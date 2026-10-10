# bun-vs-node

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La misma API HTTP, escrita una vez, servida de tres formas: por Bun, por un único proceso de Node.js, y por Node.js en modo cluster de PM2 con cuatro workers. Un escenario local de k6 aplica carga a un endpoint CPU-bound y a un endpoint I/O-bound de cada configuración, y un reporte convierte las ejecuciones en una tabla de solicitudes por segundo, latencia p95 y memoria. La lección es que el rendimiento depende de dos cosas distintas: qué tan rápido el runtime ejecuta tu código, y cuántos procesos te deja usar el modelo de procesos.

Código: MP-PERF-1. Explicación completa: [docs/es/performance/bun-vs-node.md](../../../docs/es/performance/bun-vs-node.md).

> **Solo local.** k6 corre en una red Docker interna sin puerto publicado, y el script de carga se niega a ejecutarse cuando el destino no es `localhost` ni uno de los tres servicios de este archivo docker-compose. Nunca apuntes una prueba de carga a un host que no es tuyo.

## Resultados

Mediana de las rondas, con la ronda más baja y la más alta entre paréntesis. Generado por la prueba de carga. No lo edites a mano.

<!-- results:start -->
| Configuración | Runtime | Rondas | CPU-bound: solicitudes/s | CPU-bound: p95 (ms) | I/O-bound: solicitudes/s | I/O-bound: p95 (ms) | Pico de memoria (MiB) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bun` | Bun 1.4.2 | 3 | 84 (67 to 84) | 409 (406 to 585) | 9084 (5259 to 9515) | 26.0 (22.2 to 97.2) | 39 (35 to 39) |
| `node` | Node.js 24.21.0 | 3 | 71 (61 to 73) | 656 (655 to 829) | 8205 (6189 to 8486) | 29.2 (27.1 to 71.0) | 95 (70 to 98) |
| `node-pm2` | Node.js 24.21.0 | 3 | 249 (240 to 259) | 225 (220 to 242) | 9226 (8537 to 9274) | 23.7 (23.2 to 31.0) | 193 (193 to 194) |
<!-- results:end -->

La máquina, las versiones, la carga de trabajo y la definición de cada columna están en [results/results.md](results/results.md). La máquina se compartió con otros programas durante la medición, así que los números tienen ruido: lee el rango antes de creer en una diferencia.

## Temas del quiz que demuestra

- `performance` / `runtime-performance`: el event loop de un solo hilo, el trabajo CPU-bound bloqueando todas las demás solicitudes, el modo cluster y su costo de memoria
- `performance` / `latency-throughput-percentiles`: solicitudes por segundo frente a latencia p95, y por qué se informan ambas
- `performance` / `benchmarking-methodology`: la misma carga y el mismo presupuesto de CPU para todas las configuraciones, calentamiento que no se mide, varias rondas, rango informado
- `performance` / `k6-fundamentals`: escenarios, el modelo cerrado de `constant-vus`, checks con umbral, `handleSummary`
- `performance` / `capacity-planning-queueing`: lo que agregar workers puede y no puede comprar

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-bun-vs-node.sh        # Linux y macOS
./setup-windows-bun-vs-node.ps1    # Windows
```

El script construye las dos imágenes, ejecuta la verificación de tipos y las pruebas unitarias, ejecuta una suite de pruebas de API contra los tres servidores, comprueba que k6 rechaza un destino que no es local y elimina los contenedores al final.

## Prueba de carga (el benchmark)

```sh
./load-test-unix.sh            # Linux y macOS, argumento opcional: número de rondas
./load-test-windows.ps1        # Windows, opcional: -Rounds 3
```

Un comando, unos cuatro minutos con tres rondas. Para cada configuración y cada ronda inicia un contenedor de servidor nuevo, ejecuta k6 (calentamiento, luego 8 s en `/cpu`, luego 8 s en `/io`) y detiene el servidor, así que las configuraciones nunca compiten entre sí. Luego el reporte reescribe `results/` y la tabla de arriba. Los resúmenes brutos de k6 van a `k6-results/`, que git ignora.

Variables: `CPU_LIMIT` (CPUs por contenedor de servidor, por defecto 4) y `WORKERS` (instancias de PM2, por defecto 4).

## Pruebas

```sh
docker compose run --rm ts-test           # verificación de tipos y pruebas unitarias, sin red
docker compose run --rm api-test          # una suite contra los tres servidores
docker compose run --rm k6-refusal-test   # k6 debe rechazar https://example.com
docker compose down -v
```

| Qué se prueba | Dónde |
| --- | --- |
| La API responde igual en Bun, en Node.js y en Node.js con PM2 (mismos primos, mismos errores) | `ts/tests/api/api.test.ts` |
| Un proceso responde en `bun` y `node`, varios en `node-pm2` | `ts/tests/api/api.test.ts` |
| Cincuenta solicitudes I/O-bound se solapan en un único event loop | `ts/tests/api/api.test.ts` |
| El trabajo CPU-bound impide que dispare un temporizador vencido | `ts/tests/unit/work.test.ts` |
| La regla de destino local acepta loopback y los tres nombres de servicio, y rechaza parecidos como `http://localhost@example.com` | `ts/tests/unit/target.test.ts` |
| k6 termina con error y no envía nada cuando `BASE_URL` no es local | `load/refusal-test.sh` |
| El reporte calcula mediana y rango, y falla ante una configuración ausente o solicitudes fallidas | `ts/tests/unit/report.test.ts` |

## API

| Ruta | Qué hace |
| --- | --- |
| `GET /cpu?n=200000` | CPU-bound: cuenta los primos menores que `n` por división de prueba (2 a 2.000.000) |
| `GET /io?ms=20` | I/O-bound: espera `ms` milisegundos en un temporizador, como una consulta enviada a una base de datos (0 a 1000) |
| `GET /health` | Configuración, runtime, versión del runtime y el id del proceso que respondió |
| `GET /memory` | Memoria del contenedor completo, leída de los archivos de cgroup |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/app.ts` | La API, con validación Zod, independiente del runtime |
| `ts/src/work.ts` | El trabajo CPU-bound y el I/O-bound |
| `ts/src/bun-server.ts` | La API en `Bun.serve` |
| `ts/src/node-server.ts` | La API en `node:http`, usada sola y por PM2 |
| `ts/ecosystem.config.cjs` | Modo cluster de PM2 |
| `ts/src/memory.ts` | Memoria del contenedor desde cgroup v2 |
| `ts/src/report.ts` | Agrega los resúmenes de k6 en la tabla |
| `load/scenario.js` | El escenario de k6 |
| `load/target.js` | La regla que rechaza destinos que no son locales |
| `results/` | Los resultados versionados |

`load/target.js` es una copia de la regla usada por `projects/concurrency/ten-thousand-connections`, con los nombres de servicio de este proyecto. Un miniproyecto nunca importa código de otro.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Node.js | `node:24.21.0-bookworm-slim` (LTS) |
| PM2 | 7.0.4, instalado con npm en la imagen de Node.js |
| k6 | `grafana/k6:2.3.0` |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |

Node.js ejecuta el código fuente TypeScript compilado a un único archivo CommonJS por `bun build` (una etapa de build de `ts/node.Dockerfile`). PM2 está fijado, pero npm resuelve sus propias dependencias al construir la imagen, porque una instalación global no tiene lockfile.
