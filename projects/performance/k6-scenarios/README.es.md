# k6-scenarios

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una API local sobre PostgreSQL con un cuello de botella deliberado (un pool de conexiones de 2), y cuatro escenarios de k6 que la miran cada uno desde un ángulo distinto: **load** (carga), **stress** (estrés), **spike** (pico) y **soak** (resistencia). Cada escenario tiene umbrales, los incumple con el pool pequeño y los cumple con un pool de 20. Nada más cambia entre las dos ejecuciones. La lección es para qué sirve cada tipo de prueba de carga, y cómo un cuello de botella que ningún gráfico de CPU muestra aparece como una rodilla en la curva de latencia.

Código: MP-PERF-2. Explicación completa: [docs/es/performance/k6-scenarios.md](../../../docs/es/performance/k6-scenarios.md).

> **Solo local.** k6 corre en una red Docker interna sin puerto publicado, y el script se niega a ejecutarse cuando el destino no es `localhost` ni el servicio `api` de este archivo docker-compose. Nunca apuntes una prueba de carga a un host que no es tuyo.

## Resultados

Generado por la prueba de carga. No lo edites a mano. El nombre de cada escenario lleva a su resumen en Markdown (en inglés).

<!-- results:start -->
| Escenario | Forma | Antes (pool de 2) | Después (pool de 20) |
| --- | --- | --- | --- |
| [`load`](results/load.md) | sube a 150 req/s en 5 s, se mantiene 20 s, baja | **FALLÓ**: p95 2020 ms, 25.20% con error | pasó: p95 21.2 ms, 0.00% con error |
| [`stress`](results/stress.md) | escalones de 6 s: 50, 100, 150, 200, 250, 300 req/s | **FALLÓ**: p95 2020 ms, 42.79% con error | pasó: p95 21.2 ms, 0.00% con error |
| [`spike`](results/spike.md) | 40 req/s, salto a 500 req/s durante 6 s, vuelve a 40 req/s durante 16 s | **FALLÓ**: p95 2020 ms, 47.15% con error | pasó: p95 21.4 ms, 0.00% con error |
| [`soak`](results/soak.md) | 130 req/s constantes durante 60 s (reducido: un soak real corre durante horas) | **FALLÓ**: p95 2020 ms, 23.08% con error | pasó: p95 27.4 ms, 0.00% con error |
<!-- results:end -->

Un escenario falla cuando supera un umbral: latencia p95 de 250 ms o más, en total o en cualquier fase, o 1% o más de solicitudes con error. La máquina, las versiones y la lista de resúmenes están en [results/results.md](results/results.md). La rodilla de latencia está en [results/stress.md](results/stress.md).

## Temas del quiz que demuestra

- `performance` / `load-test-types`: qué revelan las pruebas de carga, estrés, pico y resistencia, y la forma de cada una
- `performance` / `k6-fundamentals`: escenarios, el executor `ramping-arrival-rate` (modelo abierto), etapas, umbrales y código de salida 99, checks, tags, `handleSummary`, el destino desde `__ENV`
- `performance` / `database-performance`: el pool de conexiones, qué pasa cuando todas las conexiones están ocupadas
- `performance` / `capacity-planning-queueing`: la capacidad de un pool como conexiones divididas por el tiempo de retención, la rodilla de latencia en la saturación
- `performance` / `latency-throughput-percentiles`: p95 frente a la mediana, solicitudes con error, latencia por fase

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-k6-scenarios.sh        # Linux y macOS
./setup-windows-k6-scenarios.ps1    # Windows
```

El script construye la imagen, ejecuta la verificación de tipos, las pruebas unitarias y las pruebas contra un contenedor de PostgreSQL en una red interna, comprueba que k6 rechaza un destino que no es local en cada uno de los cuatro escenarios y elimina los contenedores al final.

## Prueba de carga (la demostración)

```sh
./load-test-unix.sh            # Linux y macOS, argumentos opcionales: pool antes, pool después
./load-test-windows.ps1        # Windows, opcional: -PoolBefore 2 -PoolAfter 20
```

Un comando, unos seis minutos. Ejecuta los cuatro escenarios con un pool de 2 conexiones, los ejecuta de nuevo con un pool de 20, y luego el reporte escribe `results/` y la tabla de arriba. El reporte falla a menos que todo escenario haya superado un umbral antes de la corrección y ninguno después, y a menos que la prueba de estrés muestre una rodilla de latencia antes de la corrección y ninguna después. Los resúmenes brutos de k6 van a `k6-results/`, que git ignora.

Un escenario a mano:

```sh
docker compose up -d --wait api
docker compose run --rm -e SCENARIO=stress -e VARIANT=before k6    # código de salida 99: se superó un umbral
docker compose down -v
```

## Los cuatro escenarios

| Escenario | Forma | La pregunta que responde |
| --- | --- | --- |
| `load` | sube a 150 req/s, se mantiene, baja | ¿El sistema cumple su nivel de servicio con el tráfico para el que fue construido? |
| `stress` | escalones de 50 a 300 req/s | ¿Dónde deja de aguantar, y cómo se comporta allí? |
| `spike` | 40 req/s, 500 req/s durante 6 s, 40 req/s otra vez | ¿Sobrevive a una ráfaga, y qué tan rápido se recupera? |
| `soak` | 130 req/s, constante | ¿Qué se degrada solo con el tiempo? (un minuto aquí, horas en la vida real) |

Los cuatro usan el modelo abierto (`ramping-arrival-rate`): k6 inicia solicitudes a la tasa indicada hayan sido respondidas o no las anteriores. Un modelo cerrado escondería el cuello de botella, porque los usuarios virtuales que esperan sus respuestas reducen la carga por sí mismos.

## Pruebas

```sh
docker compose run --rm ts-test           # verificación de tipos, pruebas unitarias, pruebas contra PostgreSQL
docker compose run --rm k6-refusal-test   # k6 debe rechazar https://example.com
docker compose down -v
```

| Qué se prueba | Dónde |
| --- | --- |
| Seis solicitudes concurrentes tardan unas seis veces más con un pool de 1 que con un pool de 6 | `ts/tests/integration/pool.test.ts` |
| Una solicitud que espera más que el límite recibe `503` (load shedding) | `ts/tests/integration/pool.test.ts` |
| Cada escenario pide más de lo que el pool de 2 puede atender y como máximo el 60% del pool de 20 | `ts/tests/unit/profiles.test.ts` |
| Cada perfil tiene la forma de su tipo de prueba | `ts/tests/unit/profiles.test.ts` |
| El reporte exige falla antes y pasa después, y encuentra la rodilla | `ts/tests/unit/report.test.ts` |
| La regla de destino local rechaza parecidos como `http://api.example.com` | `ts/tests/unit/profiles.test.ts` |
| k6 termina con error y no envía nada cuando `BASE_URL` no es local | `k6/refusal-test.sh` |

## API

| Ruta | Qué hace |
| --- | --- |
| `GET /products/:id` | Lee un producto. Retiene una conexión del pool durante unos `QUERY_MS` (20 ms). `404` id desconocido, `503` ninguna conexión quedó libre dentro de `POOL_WAIT_MS` (2 s) |
| `GET /stats` | Tamaño del pool, conexiones abiertas, inactivas y en espera, solicitudes descartadas |
| `GET /health` | Liveness |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `k6/profiles.js` | Los cuatro perfiles de carga, como datos compartidos por k6, las pruebas y el reporte |
| `k6/scenario.js` | El script de k6: executor, umbrales, tags por fase, resumen |
| `k6/target.js` | La regla que rechaza destinos que no son locales |
| `ts/src/db.ts` | El pool de conexiones, la consulta, el límite de espera |
| `ts/src/app.ts` | Las rutas de ElysiaJS, con validación Zod |
| `ts/src/report.ts` | Construye los resúmenes Markdown y verifica los criterios de aceptación |
| `results/` | Los resúmenes Markdown versionados, uno por escenario |

`k6/target.js` es una copia de la regla usada por las otras pruebas de carga del repositorio, con el nombre de servicio de este proyecto. Un miniproyecto nunca importa código de otro.

## Versiones

| Componente | Versión |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| k6 | `grafana/k6:2.3.0` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
