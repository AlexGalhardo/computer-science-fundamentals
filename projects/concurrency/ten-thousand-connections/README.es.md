# ten-thousand-connections

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

El mismo pequeño servidor HTTP escrito tres veces: sobre un event loop (TypeScript en Bun), con una goroutine por conexión (Go) y con un proceso de la BEAM por conexión (Elixir). Luego, un escenario local de k6 abre 10,000 conexiones contra cada uno, las mantiene abiertas e inactivas durante 30 segundos y mide cuánta memoria cuesta cada conexión y si el servidor sigue respondiendo rápido mientras tanto.

La lección: una conexión que espera no necesita un thread. Los tres runtimes llegan a ese resultado por tres caminos distintos, explicados en [docs/es/concurrency/ten-thousand-connections.md](../../../docs/es/concurrency/ten-thousand-connections.md).

> **Solo local.** El script de carga se niega a ejecutarse cuando el destino no es `localhost` ni uno de los tres servicios de este archivo docker-compose. Nunca apuntes una prueba de carga a un host que no es tuyo.

## Temas del quiz que demuestra

- `concurrency` / `async-and-event-loop`: un thread atendiendo miles de conexiones inactivas
- `concurrency` / `actor-model-and-beam`: un proceso barato de la BEAM por conexión
- `concurrency` / `concurrency-vs-parallelism`: goroutines y procesos comparados con threads del sistema operativo

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-ten-thousand-connections.sh        # Linux y macOS
./setup-windows-ten-thousand-connections.ps1    # Windows
```

El script construye las imágenes, ejecuta las pruebas unitarias de cada lenguaje, ejecuta la suite de protocolo contra los tres servidores y comprueba que k6 rechaza un destino que no es local. Tarda cerca de un minuto.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/` | Servidor en `Bun.serve`: un thread, un event loop, `await Bun.sleep(ms)` |
| `go/` | Servidor en `net/http`: una goroutine por conexión, `time.After(ms)` |
| `elixir/` | Servidor escrito sobre `:gen_tcp`, sin biblioteca: un proceso por conexión, `Process.sleep(ms)` |
| `protocol/` | Una única suite de pruebas de protocolo, ejecutada contra los tres servidores |
| `load/hold.js` | El escenario de k6 |
| `load/target.js` | La regla que rechaza destinos que no son locales |
| `load/report.ts` | Convierte los tres resúmenes de k6 en `results/results.md` |

Los tres servidores no tienen dependencias y hablan el mismo protocolo en el puerto 8080:

| Ruta HTTP | Respuesta |
| --- | --- |
| `GET /health` | `200`, cuerpo `ok` |
| `POST /echo` | `200`, el mismo cuerpo y el mismo `Content-Type` |
| `GET /delay?ms=N` | espera `N` milisegundos (0 a 60000) y responde `200` con `{"waitedMs":N}`. Cualquier otra cosa es `400` |
| `GET /stats` | `200` con `{"runtime", "inFlight", "rssKb"}`: solicitudes en curso ahora y memoria residente del proceso |
| otra ruta, otro método | `404`, `405` |

Todo se ejecuta en una red docker marcada como `internal`, sin ruta hacia afuera y sin ningún puerto publicado en el host.

## Pruebas

```sh
docker compose run --rm ts-test          # pruebas unitarias, también: go-test, elixir-test
docker compose run --rm protocol-test    # las mismas 8 pruebas contra cada uno de los 3 servidores
docker compose run --rm k6-refusal-test  # k6 debe rechazar https://example.com
docker compose --profile load down       # detiene los servidores
```

| Qué se prueba | Dónde |
| --- | --- |
| Los tres servidores responden al mismo protocolo: 24 pruebas, 8 por servidor | `protocol/protocol.test.ts` |
| 300 solicitudes que esperan 500 ms cada una se atienden al mismo tiempo, en todos los servidores | el mismo archivo |
| Rutas, validación de entrada y esperas superpuestas, sin socket | `ts/tests/app.test.ts`, `go/server_test.go`, `elixir/test/` |
| La regla de destino local acepta loopback y los tres nombres de servicio, y rechaza parecidos como `http://localhost@example.com` | `ts/tests/target.test.ts` |
| k6 termina con error y no abre conexiones cuando `TARGET` no es local | `load/refusal-test.sh` |

Formateadores y linters: `gofmt` y `go vet` se ejecutan en `go-test`, `mix format --check-formatted` se ejecuta en `elixir-test`. Biome y golangci-lint usan la configuración de la raíz del repositorio:

```sh
bunx biome check projects/concurrency/ten-thousand-connections
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Prueba de carga

```sh
docker compose --profile load down               # servidores nuevos, para que la memoria inactiva sea una línea base real
docker compose --profile load run --rm report    # ts, luego go, luego elixir, luego la tabla
docker compose --profile load down               # detiene los servidores
```

El segundo comando ejecuta k6 contra un servidor a la vez y escribe [results/results.md](results/results.md). Tarda cerca de dos minutos y medio. En una máquina pequeña, baja el número definiendo antes la variable de entorno `CONNECTIONS`, por ejemplo `CONNECTIONS=2000 docker compose --profile load run --rm report` en un shell Unix.

La línea de tiempo de una ejecución:

```text
0s          10s                                  40s
hold  |-- 10,000 conexiones se abren, 500 a la vez, y cada una se mantiene abierta 30 s --|
echo            |-- 50 POST /echo por segundo durante 12 s, latencia registrada --|
probe                     | GET /stats: solicitudes en curso y memoria |
```

k6 mantiene las 10,000 conexiones con 20 usuarios virtuales que abren 500 conexiones cada uno (`http.batch`). Diez mil usuarios virtuales necesitarían más memoria que los servidores bajo prueba.

## Resultados

Medido en la máquina descrita en [results/results.md](results/results.md), con 10,000 conexiones pedidas y 10,000 mantenidas por todos los servidores:

| Servidor | Memoria inactiva (MiB) | Memoria manteniendo las conexiones (MiB) | Memoria por conexión (KiB) | echo p50 (ms) | echo p95 (ms) | echo p99 (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ts (Bun, event loop) | 18.9 | 58.6 | 4.1 | 0.49 | 3.53 | 11.07 |
| go (goroutines) | 7.9 | 167.1 | 16.3 | 0.53 | 3.82 | 10.57 |
| elixir (procesos de la BEAM) | 86.1 | 182.7 | 9.9 | 0.56 | 2.57 | 6.24 |

Lo que muestra la tabla:

- Todos los modelos mantienen 10,000 conexiones inactivas con unos pocos kibibytes cada una. Como comparación, Linux normalmente reserva 8 MiB de espacio de direcciones para la pila de cada thread del sistema operativo por defecto, y un thread bloqueado todavía tiene que ser planificado por el kernel.
- El event loop es el más barato por conexión: una solicitud que espera es un socket, un timer y una promise, sin ninguna pila. Una goroutine mantiene una pila (que empieza con unos pocos kibibytes) y `net/http` mantiene buffers de lectura y de escritura por conexión. Un proceso de la BEAM mantiene su propio heap y su pila, ambos pequeños.
- La latencia de solicitudes nuevas se mantiene por debajo de un milisegundo en la mediana con 10,000 conexiones abiertas. Las conexiones inactivas cuestan memoria, no tiempo de procesador.
- La BEAM empieza con la mayor memoria inactiva: la propia máquina virtual es el costo fijo.

Lo que **no** muestra: esta carga solo espera. Con trabajo pesado de procesador en el handler el panorama cambia, porque un callback ocupado bloquea todo el event loop, mientras que Go y la BEAM reparten el trabajo entre todos los núcleos e interrumpen el código demorado.

Lee los números como órdenes de magnitud. La memoria fue la misma en dos ejecuciones seguidas (diferencia menor a 2 MiB). La latencia no: en la primera ejecución, con otros contenedores ocupados en la máquina, el servidor Go mostró un p95 de 238 ms y un p99 de 361 ms, y en la segunda, la que está versionada, 3.82 ms y 10.57 ms.
