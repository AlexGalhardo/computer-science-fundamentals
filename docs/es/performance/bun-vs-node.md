# Bun contra Node (MP-PERF-1)

> English version: [docs/en/performance/bun-vs-node.md](../../en/performance/bun-vs-node.md) · Versão em português: [docs/pt/performance/bun-vs-node.md](../../pt/performance/bun-vs-node.md)

Miniproyecto: [`projects/performance/bun-vs-node`](../../../projects/performance/bun-vs-node/README.es.md). Temas del quiz: `runtime-performance`, `latency-throughput-percentiles`, `benchmarking-methodology`, `k6-fundamentals`, `capacity-planning-queueing`.

## La pregunta

"¿Cuál es más rápido, Bun o Node?" no tiene una única respuesta, porque dos cosas distintas deciden el rendimiento de un servidor:

1. **El runtime**: qué tan rápido el motor ejecuta tu JavaScript (JavaScriptCore en Bun, V8 en Node.js) y cuánto cuesta su servidor HTTP por solicitud.
2. **El modelo de procesos**: cuántos procesos ejecutan tu código. JavaScript corre en un hilo por proceso, así que un proceso usa un núcleo para tu código, sin importar cuántos núcleos tenga la máquina.

El miniproyecto separa las dos. La API se escribe una vez (`ts/src/app.ts`) y se sirve de tres formas:

| Configuración | Runtime | Procesos |
| --- | --- | --- |
| `bun` | Bun, `Bun.serve` | 1 |
| `node` | Node.js, `node:http` | 1 |
| `node-pm2` | Node.js, `node:http` | 4 workers en modo cluster de PM2 |

Todo contenedor tiene el mismo límite de CPU (4 CPUs), así que `bun` contra `node` compara runtimes, y `node` contra `node-pm2` compara modelos de procesos con el runtime constante.

## CPU-bound e I/O-bound

```text
CPU-bound request (GET /cpu)           I/O-bound request (GET /io)

event loop: [count primes........]     event loop: [start timer][free.........][answer]
            nobody else runs here                   other requests run here
```

- `GET /cpu` cuenta primos. El event loop está ocupado durante toda la solicitud, así que las solicitudes se sirven estrictamente una tras otra en cada proceso. Con 32 clientes esperando, una solicitud pasa la mayor parte de su tiempo en la fila.
- `GET /io` espera 20 ms en un temporizador, que representa una consulta enviada a una base de datos. Mientras espera, el event loop está libre, así que un proceso sostiene miles de estas a la vez.

La prueba unitaria "CPU-bound work blocks the event loop" muestra el primer caso sin ningún servidor: un temporizador que vencería en 1 ms solo dispara después de que termina el conteo de primos.

## Qué hace el modo cluster

`pm2-runtime start ecosystem.config.cjs` inicia cuatro copias del mismo servidor mediante el módulo `cluster` de Node.js. El proceso primario es dueño del socket de escucha y entrega cada **conexión** nueva a un worker. Consecuencias:

- El rendimiento CPU-bound crece con el número de workers, hasta el número de núcleos disponibles.
- El rendimiento I/O-bound casi no cambia: un event loop no era el límite.
- Los workers no comparten memoria. Cada uno tiene su propio heap, así que la memoria crece con el número de workers, y todo lo que se guarda en la memoria del proceso (sesiones, cachés, contadores) es distinto en cada worker.
- Una conexión keep-alive se queda en el worker que la aceptó. La prueba de la API envía `Connection: close` para ver más de un id de proceso.

## Resultados medidos

La tabla versionada está en el [README](../../../projects/performance/bun-vs-node/README.es.md#resultados) y en `results/results.md`, con la máquina y las versiones. En la ejecución versionada (mediana de 3 rondas, de la más baja a la más alta entre paréntesis):

| Configuración | CPU-bound solicitudes/s | CPU-bound p95 | I/O-bound solicitudes/s | Pico de memoria |
| --- | --- | --- | --- | --- |
| `bun` | 84 (67 to 84) | 409 ms | 9084 (5259 to 9515) | 39 MiB |
| `node` | 71 (61 to 73) | 656 ms | 8205 (6189 to 8486) | 95 MiB |
| `node-pm2` | 249 (240 to 259) | 225 ms | 9226 (8537 to 9274) | 193 MiB |

Cómo leerlo sin engañarse:

- **Modelo de procesos, CPU-bound**: cuatro workers atendieron unas 3.5 veces las solicitudes de un proceso Node.js (249 contra 71), y el p95 bajó de 656 ms a 225 ms. No 4 veces: el proceso primario, el trabajo HTTP y k6 también necesitan CPU, y la máquina era compartida.
- **Modelo de procesos, I/O-bound**: los tres están cerca del mismo techo. 200 usuarios virtuales que esperan 20 ms cada uno no pueden enviar más de 200 / 0.020 = 10,000 solicitudes por segundo, sea cual sea el servidor. Los rangos se solapan, así que no hay diferencia que informar. Agregar workers no compra nada cuando el procesador no es el cuello de botella.
- **Runtime, CPU-bound**: Bun atendió más solicitudes que un proceso Node.js en esta carga (84 contra 71), y los rangos (67 a 84, 61 a 73) se solapan. Es una diferencia pequeña en un bucle ajustado en una máquina, no una ley sobre los dos runtimes.
- **Memoria**: el cluster usó cerca del doble de la memoria de un proceso Node.js (193 MiB contra 95 MiB) por el daemon de PM2 y cuatro heaps. Bun usó la menor. El rendimiento comprado con procesos se paga en memoria.
- **El p95 sigue a la cola**: en `/cpu` el p95 es aproximadamente el número de clientes dividido por el rendimiento (32 / 84 ≈ 0.38 s en Bun), porque cada solicitud espera a las que tiene delante. Esa es la forma de modelo cerrado de la ley de Little.

## Método

- Una configuración corre a la vez, en un contenedor nuevo para cada ronda, con el mismo límite de CPU.
- Una fase de calentamiento corre antes de la medición y no se cuenta, para que el compilador JIT y las conexiones estén listos.
- Tres rondas por configuración, informadas como mediana con el rango. La máquina estaba ejecutando otro trabajo, y los rangos lo muestran (una ronda I/O de Bun bajó a 5259 solicitudes/s).
- k6 corre en la misma máquina que el servidor y compite por su CPU. Eso está bien para comparar las configuraciones entre sí y mal para números absolutos.
- La ejecución falla cuando cualquier solicitud falla (umbral de `checks`), porque un servidor que responde errores rápido parece veloz.

## Reglas de la prueba de carga

k6 corre desde la imagen fijada `grafana/k6:2.3.0` en la red interna de docker-compose. No se publica ningún puerto, y `load/target.js` lanza una excepción antes de cualquier solicitud cuando `BASE_URL` no es `localhost`, `127.0.0.1`, `[::1]` ni uno de los tres servicios. `docker compose run --rm k6-refusal-test` lo prueba con `https://example.com`. La salida bruta de k6 va a `k6-results/`, que git ignora.

## Criterios de aceptación

| Elemento | Cómo se verifica |
| --- | --- |
| MP-PERF-1.1 la misma API en Bun, Node y Node con cluster de PM2: una suite pasa contra las tres | `docker compose run --rm api-test` (`ts/tests/api/api.test.ts`, 7 pruebas por configuración) |
| MP-PERF-1.2 escenario local de k6 con un endpoint CPU-bound y uno I/O-bound, que rechaza destinos no locales | `docker compose run --rm k6-refusal-test` y `ts/tests/unit/target.test.ts` |
| MP-PERF-1.3 tabla de solicitudes por segundo, latencia p95 y memoria para cada configuración | `./load-test-unix.sh` (o `.ps1`), que escribe `results/results.md` |

## Ejecutar

```sh
cd projects/performance/bun-vs-node
./setup-unix-bun-vs-node.sh     # pruebas
./load-test-unix.sh             # k6 y la tabla de resultados
```
