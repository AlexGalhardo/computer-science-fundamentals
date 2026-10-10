# rate-limiter

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

"Como máximo 10 solicitudes por segundo" suena a una sola regla, pero cinco algoritmos la aplican de cinco maneras distintas, y la diferencia solo aparece cuando el tráfico llega en ráfagas. Este miniproyecto implementa ventana fija, ventana deslizante (log y contador), token bucket y leaky bucket en memoria, les entrega a todos el mismo tráfico y dibuja lo que deja pasar cada uno. Luego lleva el limitador a Redis, donde dos instancias de la aplicación comparten un contador mediante un script Lua atómico, y muestra la carrera que aparece sin él.

Código: MP-RL-1. Explicación completa: [docs/es/rate-limiting/rate-limiter.md](../../../docs/es/rate-limiting/rate-limiter.md).

## Resultados

Las mismas 80 solicitudes, con cada algoritmo configurado como 10 solicitudes por segundo. Generado por el experimento en [results/burst.md](results/burst.md).

| Serie | bajo el límite (0-1 s) | ráfaga en la frontera (1-3 s) | sobrecarga continua (3-6 s) | ráfaga instantánea tras el silencio (6-8 s) | Total | peor intervalo de 1 s |
| --- | --- | --- | --- | --- | --- | --- |
| Tráfico ofrecido | 5 | 20 | 40 | 15 | 80 | 20 |
| Ventana fija | 5 | 20 | 20 | 10 | 55 | 20 |
| Ventana deslizante (log) | 5 | 10 | 20 | 10 | 45 | 10 |
| Ventana deslizante (contador) | 5 | 11 | 20 | 10 | 46 | 11 |
| Token bucket | 5 | 11 | 29 | 10 | 55 | 19 |
| Leaky bucket (admitidas) | 5 | 11 | 29 | 10 | 55 | 19 |
| Leaky bucket (saliendo de la cola) | 5 | 11 | 29 | 10 | 55 | 10 |

![Solicitudes admitidas a lo largo del tiempo por cada algoritmo](results/burst.es.svg)

"Peor intervalo de 1 s" es el mayor número de solicitudes que pasó en cualquier intervalo de un segundo, empiece donde empiece. Es la medida honesta de un límite de "10 por segundo":

- La **ventana fija** deja pasar 20 en 200 ms: 10 al final de una ventana y 10 al comienzo de la siguiente.
- El **log deslizante** nunca pasa de 10, al precio de guardar una marca de tiempo por cada solicitud admitida.
- El **contador deslizante** guarda dos números y se equivoca por uno aquí (11), porque supone que la ventana anterior fue uniforme.
- El **token bucket** permite una ráfaga del tamaño de su capacidad y luego la tasa de reposición, es decir, hasta capacidad + tasa × tiempo. Es a propósito: la capacidad es la ráfaga que decidiste tolerar.
- El **leaky bucket** admite las mismas solicitudes que el token bucket, pero las libera una cada 100 ms. Entra una ráfaga, sale un flujo uniforme.

## Temas del quiz que demuestra

- `rate-limiting` / `fixed-window`: ventanas alineadas, un contador por cliente, la ráfaga doble en la frontera
- `rate-limiting` / `sliding-window`: el log deslizante y su costo de memoria, la fórmula del contador deslizante y su aproximación
- `rate-limiting` / `token-bucket`: la capacidad como tamaño de la ráfaga, la tasa de reposición como tasa promedio, la reposición perezosa, el tope
- `rate-limiting` / `leaky-bucket`: la lectura como cola, salida constante, comparación con el token bucket
- `rate-limiting` / `redis-distributed`: contador compartido, la carrera de verificar y luego actuar, el script Lua atómico, `EVALSHA` y `NOSCRIPT`, el reloj de Redis
- `rate-limiting` / `http-429-and-backoff`: `429 Too Many Requests` con `Retry-After`

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-rate-limiter.sh        # Linux y macOS
./setup-windows-rate-limiter.ps1    # Windows
```

El script construye las imágenes y ejecuta tres suites de pruebas: los algoritmos en memoria en TypeScript, los mismos en Go (con el detector de carreras), y dos instancias de la aplicación compartiendo un Redis bajo 400 solicitudes concurrentes. Al final elimina los contenedores y la red.

## Experimento de ráfaga (la demo)

```sh
./experiment-unix.sh            # Linux y macOS
./experiment-windows.ps1        # Windows
```

Un comando: ejecuta el experimento y reescribe `results/burst.json`, `results/burst.md`, `results/burst.svg`, `results/burst.pt-BR.svg` y `results/burst.es.svg`. El gráfico es un archivo SVG puro, sin script y sin referencia externa, así que se abre desde el disco en cualquier navegador. El experimento es una simulación con reloj inyectado: tarda milisegundos, no envía nada a ningún lado y da los mismos números en cualquier máquina. Una prueba falla cuando `results/` está desactualizado.

La implementación en Go imprime la misma tabla: `docker compose run --rm go-test go run ./cmd/experiment`.

## Pruebas

```sh
docker compose run --rm ts-test             # verificación de tipos, tabla de casos, experimento, respuestas HTTP
docker compose run --rm go-test             # gofmt, go vet, golangci-lint, go test -race
docker compose run --rm distributed-test    # dos instancias y Redis
docker compose down -v
```

- **Tabla de casos.** `cases/cases.json` tiene 15 líneas de tiempo ("una solicitud llega en este milisegundo y debe ser admitida o rechazada"), resueltas a mano a partir de la definición de cada algoritmo. TypeScript y Go leen el mismo archivo.
- **Reloj determinístico.** Cada limitador recibe el tiempo como argumento (`allow(nowMs)`), así que ninguna prueba espera.
- **Dos instancias.** `limiter-a` y `limiter-b` ejecutan la misma imagen contra un solo Redis. Con el script atómico admiten exactamente 50 de 400 solicitudes concurrentes, en cinco rondas. Con el `GET` seguido de `INCR` ingenuo, la misma multitud hace pasar más de 50: hasta 192 en las rondas medidas, y exactamente 50 en algunas de ellas. Una carrera es cuestión de tiempo, y por eso la prueba repite la ronda hasta que una supere el límite.

## Reglas del laboratorio

Redis y las dos instancias se hablan en una red interna de docker-compose: ningún contenedor llega a internet y no se publica ningún puerto en el host. La prueba concurrente lee sus destinos de `TARGETS`, cuyo valor por defecto son los dos servicios del compose, y se niega a empezar cuando algún host no es local.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `cases/cases.json` | Tabla de solicitudes admitidas y rechazadas a lo largo del tiempo, compartida por ambos lenguajes |
| `ts/src/fixed-window.ts`, `sliding-log.ts`, `sliding-counter.ts`, `token-bucket.ts`, `leaky-bucket.ts` | Los cinco algoritmos, un archivo cada uno |
| `ts/src/experiment.ts`, `chart.ts`, `report.ts` | El experimento de ráfaga, el gráfico SVG y la tabla |
| `lua/fixed-window.lua`, `lua/token-bucket.lua` | Los scripts atómicos que corren dentro de Redis |
| `ts/src/redis-limiter.ts`, `app.ts`, `server.ts` | El limitador distribuido y su servicio HTTP (`GET /hit?strategy=...&key=...`) |
| `go/` | Los mismos algoritmos protegidos por un mutex, con una prueba de concurrencia |
| `results/` | Salida del experimento |

## Notas

- Un objeto limitador guarda el estado de un cliente. Un servicio real mantiene un mapa de la clave del cliente a su limitador.
- El leaky bucket se implementa como una cola: `schedule(nowMs)` devuelve cuándo sale una solicitud admitida. La primera solicitud en un balde vacío sale al instante. Algunos textos la hacen esperar un intervalo; el espaciado entre salidas es el mismo.
- El cliente de Redis es el integrado en Bun (`RedisClient`), así que la única dependencia es Zod, usado para validar el archivo de casos, el entorno, la query string y las respuestas de los scripts.
- No se importa código de otro miniproyecto.
