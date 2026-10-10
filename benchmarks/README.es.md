# Benchmark de lenguajes

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Las mismas ocho cargas de trabajo en los siete lenguajes del repositorio (C++, Rust, Go, Java, TypeScript en Bun, Elixir y Python), medidas en Docker con imágenes fijadas, con un dashboard estático que explica cada gráfico en palabras simples.

Enseña cómo ejecuta código cada lenguaje (compilado, máquina virtual, intérprete), cómo hace muchas cosas a la vez (threads, goroutines, procesos de la BEAM, threads virtuales, event loop) y cuánto cuesta eso en tiempo, memoria y CPU. **No** es un ranking: lee [Límites de la comparación](#límites-de-la-comparación) antes de citar cualquier número.

- Dashboard: abre [`dashboard/index.html`](dashboard/index.html) en un navegador. Funciona directo desde el disco, sin servidor y sin red.
- Contrato y runner compartidos con los mini-proyectos: [docs/es/benchmarks.md](../docs/es/benchmarks.md).

## Cómo ejecutar

Requisitos: Docker y Bun. No se instala nada más en el host.

```sh
./setup-unix-benchmarks.sh          # Linux y macOS
./setup-windows-benchmarks.ps1      # Windows
```

El script construye todas las imágenes, ejecuta las pruebas de coincidencia, ejecuta las ocho cargas, reescribe `*/results/`, las tablas de este README y `dashboard/results/results.js`, y prueba el dashboard. Tarda cerca de una hora. `--quick` (`-Quick` en Windows) omite las mediciones.

Pasos individuales, desde `benchmarks/`:

| Comando | Qué hace |
| --- | --- |
| `bun run images` | construye la imagen de cada lenguaje para las cuatro cargas del runner |
| `bun run bench -- --project cpu-single` | ejecuta una carga del runner (`cpu-single`, `parallelism`, `concurrency`, `memory`) |
| `bun run sections parallelism` | recolecta los tiempos de sección usados para el speed-up |
| `bun run http` | ejecuta la carga HTTP (k6 contra los siete servidores) |
| `bun run build-time`, `bun run binary-size`, `bun run database` | ejecutan los otros tres recolectores |
| `bun run all [step...]` | ejecuta todos los pasos en orden, reintentando un paso que falla |
| `bun run data` | reconstruye los datos del dashboard y las tablas de abajo |
| `bun run test` | las implementaciones coinciden en el checksum, los resultados versionados están completos |
| `bun run test:http` | los siete servidores pasan una suite de protocolo, k6 rechaza destinos no locales |
| `bun run test:database` | los siete clientes de base de datos leen de vuelta los mismos datos |
| `bun run test:dashboard` | Playwright, en Docker sin red: se dibuja cada gráfico |

## Estructura

```text
benchmarks/
├── docker/            un Dockerfile por lenguaje, compartido por las cargas del runner
├── cpu-single/        n-body y criba de primos, un thread
├── parallelism/       conteo de primos con 1, 2, 4, 8 y 16 workers
├── concurrency/       100.000 tareas esperando en una compuerta
├── memory/            árboles binarios y un proceso inactivo
├── http/              siete servidores, k6, recolector, pruebas de protocolo
├── build-time/       tiempo de compilación, en frío y en caliente
├── binary-size/       tamaño del artefacto y del runtime que necesita
├── database/          siete clientes de PostgreSQL, recolector, pruebas
├── scripts/           constructor de imágenes, recolectores extra, datos del dashboard
├── tests/             pruebas de coincidencia y de resultados
└── dashboard/         el sitio estático y sus pruebas de Playwright
```

Cada carpeta de carga tiene una subcarpeta por lenguaje, un `bench.json` donde encaja el runner compartido, y un `results/` versionado con `results.md`, `results.json` y `results.js`.

## Las cargas

| Carga | Qué mide | Qué no mide |
| --- | --- | --- |
| `cpu-single` | Velocidad de aritmética simple y bucles sobre arreglos en un núcleo: una simulación n-body (punto flotante) y una criba de Eratóstenes (enteros, memoria) | Bibliotecas que hacen la parte pesada en código nativo (NumPy, SIMD), programas de larga duración donde un JIT está completamente caliente |
| `parallelism` | Cuánto más rápido se hace el mismo trabajo con 1, 2, 4, 8 y 16 workers, usando el mecanismo propio de cada lenguaje | Velocidad absoluta (mira `cpu-single`), trabajos que comparten datos entre workers |
| `concurrency` | Costo en tiempo y memoria de 100.000 tareas que esperan y pasan un mensaje | Qué tan rápido calcularían las tareas, comportamiento de un servidor caliente de larga vida |
| `http` | Peticiones por segundo, percentiles de latencia, CPU y memoria de un servidor pequeño bajo carga local, para un eco de JSON y un endpoint limitado por CPU | El lenguaje solo: cada stack es una biblioteca de servidor distinta. Distancia de red, TLS, bases de datos |
| `memory` | Memoria máxima y tiempo de un programa con muchas asignaciones, tiempo de arranque y memoria base de uno inactivo | Recolectores o asignadores ajustados, fragmentación a largo plazo |
| `build-time` | Tiempo desde el código fuente hasta lo que ejecuta el lenguaje, desde cero (frío) y después de editar una línea (caliente) | Proyectos grandes, donde importan más las compilaciones incrementales y las cachés |
| `binary-size` | Tamaño en disco de lo que entregas y del runtime que necesita | Tamaño de la imagen del contenedor, el sistema operativo y su biblioteca C |
| `database` | Operaciones por segundo y latencia de las mismas consultas contra un PostgreSQL local, con una conexión y con un pool | El lenguaje: esto es sobre todo el driver y el viaje de ida y vuelta al servidor |

Todas las implementaciones de una carga imprimen el mismo checksum para la misma entrada. `bun run test` lo demuestra ejecutando cada programa en su imagen, y compara el resultado con una referencia calculada de forma independiente (la energía publicada del sistema n-body, una criba en la propia prueba, la fórmula cerrada del número de nodos del árbol).

## Cómo maneja cada lenguaje los threads

El modelo de planificación es lo principal que muestran estas cargas. Esta tabla dice qué usa cada implementación.

| Lenguaje | Trabajo de CPU en muchos núcleos (`parallelism`) | Muchas tareas esperando (`concurrency`) | Modelo en una frase |
| --- | --- | --- | --- |
| C++ | `std::thread`, un thread del SO por worker, un contador atómico reparte los pedazos | Corrutinas de C++20 con un planificador escrito a mano, y `std::thread` limitado a 10.000 para comparar | El kernel planifica threads del SO (1:1). El lenguaje da el mecanismo de corrutinas pero no un planificador |
| Rust | pool de threads rayon con work stealing | tareas de tokio en un runtime multi-thread | Threads del SO para calcular. Los bloques `async` se compilan a máquinas de estado que un runtime de biblioteca sondea en unos pocos threads |
| Go | goroutines que leen números de pedazo desde un canal, `GOMAXPROCS` = workers | goroutines bloqueadas en un canal | M:N: el runtime de Go multiplexa muchas goroutines (stacks pequeños que crecen) sobre unos pocos threads del SO y las expulsa por tiempo |
| Java | stream paralelo enviado a un `ForkJoinPool` de threads de plataforma | threads virtuales esperando en un `CountDownLatch`, mensajes mediante una `LinkedBlockingQueue` | Los threads de plataforma son threads del SO. Los threads virtuales los planifica la JVM en un pequeño pool de threads portadores y se desmontan cuando se bloquean |
| TypeScript (Bun) | threads `Worker`, cada uno con su propio heap, alimentados por mensajes | funciones `async` esperando una promesa | Un thread y un event loop por isolate. No se comparte nada, así que más núcleos significa más isolates |
| Elixir | `Task.async_stream` con `max_concurrency` = workers | procesos BEAM bloqueados en `receive` | La VM ejecuta procesos livianos con un thread planificador por núcleo, los expulsa por conteo de reducciones, y solo comparten mediante paso de mensajes |
| Python | `multiprocessing.Pool` de procesos (spawn) | tareas asyncio en un event loop | El GIL deja que un solo thread ejecute bytecode a la vez, así que el trabajo de CPU necesita procesos y la espera usa un event loop de un solo thread |

## Bibliotecas y por qué se eligieron

Las cuatro cargas del runner usan solo la biblioteca estándar, excepto donde el lenguaje no tiene una para el trabajo: Rust usa rayon 1.12.0 (el crate habitual de paralelismo de datos) en `parallelism` y tokio 1.53.2 (el runtime async habitual) en `concurrency`.

| Lenguaje | Servidor HTTP | Por qué | Driver de base de datos | Por qué |
| --- | --- | --- | --- | --- |
| C++ | cpp-httplib 0.60.0 y nlohmann/json 3.12.0 | La biblioteca estándar no tiene red ni JSON. Es el par header-only más usado, y evita un framework grande | libpq, de Debian trixie | El cliente oficial de C. No tiene pool, así que la fase de pool abre 8 conexiones y le da una a cada thread |
| Rust | axum 0.8.9 sobre tokio 1.53.2, serde_json 1.0.151 | No hay servidor HTTP en la biblioteca estándar. axum es el framework más usado | sqlx 0.9.0 | La biblioteca de base de datos async más usada, con un pool integrado |
| Go | `net/http`, `encoding/json` | Biblioteca estándar | pgx 5.11.0 con pgxpool | El driver de PostgreSQL más usado para Go |
| Java | `com.sun.net.httpserver` con un executor de threads virtuales, Jackson 3.2.3 | El servidor viene con el JDK. El JDK no tiene un parser de JSON y Jackson es el más usado | PostgreSQL JDBC 42.7.14 y HikariCP 7.1.0 | El driver oficial y el pool más usado |
| TypeScript | `Bun.serve` | Integrado en Bun | `Bun.sql` | Integrado en Bun, con un pool |
| Elixir | Bandit 1.12.5 y Plug 1.20.3, `JSON` de la biblioteca estándar | Plug es la interfaz web estándar y Bandit el servidor predeterminado de Phoenix | Postgrex 0.22.4 | El driver que usa Ecto, con un pool integrado |
| Python | FastAPI 0.142.4 sobre uvicorn 0.54.0, un worker | `http.server` es solo para desarrollo. FastAPI es el framework más usado | psycopg 3.3.6 y psycopg-pool 3.3.3 | El driver de PostgreSQL más usado |

Cada versión está fijada exactamente: etiquetas de imagen, `Cargo.lock`, `go.sum`, `mix.lock`, `requirements.txt` (congelado, incluidos los paquetes transitivos) y URL de descarga fijas para los jars de Java y los headers de C++. Estas bibliotecas no están en el stack acordado para los mini-proyectos (`.claude/rules/mini-project.md`), así que se listan aquí para que el dueño las confirme o las reemplace.

## Método

- Todo se ejecuta en contenedores de imágenes fijadas. Las cuatro cargas del runner y `build-time` se ejecutan con `--network none`. Los programas se compilan dentro de la imagen, así que ninguna ejecución lee el programa a través de un bind mount.
- `cpu-single`, `parallelism`, `concurrency` y `memory` usan el runner compartido (`tools/bench`): hyperfine 2.0.0 ejecuta cada comando 5 veces después de 1 ejecución de calentamiento descartada y registra el tiempo de reloj, el tiempo de CPU y la memoria residente máxima de todo el proceso. El programa imprime por sí mismo el tiempo de su sección medida.
- El speed-up se calcula sobre la sección medida (el arranque no es trabajo paralelo), a partir de 5 muestras adicionales por caso recolectadas por `scripts/collect-sections.ts`. La eficiencia es el speed-up dividido por los workers.
- La memoria por tarea es (memoria máxima con n tareas − memoria máxima con 0 tareas) / n.
- `http`: un servidor a la vez, limitado a 4 CPU y 2 GiB, en una red `internal` de Docker sin puertos publicados. k6 2.3.0 (también con 4 CPU) ejecuta 32 usuarios virtuales durante 10 s, 3 veces, cada una después de un calentamiento de 3 s. `http/collect.ts` muestrea el contenedor del servidor desde `docker stats` mientras k6 envía carga y descarta la primera y la última muestra de cada ejecución. El script de k6 rechaza cualquier destino que no sea `localhost` o un servicio del archivo compose.
- `build-time`: hyperfine con `--prepare`. El modo en frío elimina la salida y la caché del compilador antes de cada ejecución. El modo en caliente agrega una línea de comentario al código fuente antes de cada ejecución.
- `binary-size`: tamaños exactos de `stat` y `du` dentro de las imágenes.
- `database`: PostgreSQL 18.6 con sus datos en tmpfs, en una red `internal`. Cada cliente se ejecuta una vez como calentamiento y 3 veces medido, con 5.000 filas y 8 workers en la fase de pool. El tiempo de CPU y la memoria máxima los informa el propio proceso cliente, a partir de la contabilidad del kernel.

## Resultados

Las tablas de abajo las reescribe `bun run data` a partir de los archivos `results/` versionados. Las tablas en bruto, con los comandos exactos, están en cada `results/results.md`.

<!-- results:start -->

### Máquina

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

### Runtimes

- cpp: g++ (GCC) 16.2.0 (sef-bench-cpu-single-cpp:local). HTTP: 16.2.0, cpp-httplib 0.60.0 + nlohmann/json 3.12.0 (sef-bd-http-cpp:local). Base de datos: libpq (official C client, from Debian trixie) 17.11-0+deb13u1 (sef-bd-database-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-cpu-single-rust:local). HTTP: rustc 1.99.0 (b940084d7 2026-09-28), axum 0.8.9 + tokio 1.53.2 (sef-bd-http-rust:local). Base de datos: sqlx 0.9.0 on tokio 1.53.2 (sef-bd-database-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-cpu-single-go:local). HTTP: go version go1.27.1 linux/amd64, net/http (standard library) (sef-bd-http-go:local). Base de datos: pgx 5.11.0 (pgxpool) (sef-bd-database-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-cpu-single-java:local). HTTP: openjdk 25.0.4.1 2026-08-18 LTS, JDK HttpServer + virtual threads + Jackson 3.2.3 (sef-bd-http-java:local). Base de datos: PostgreSQL JDBC 42.7.14 + HikariCP 7.1.0 (sef-bd-database-java:local)
- ts: 1.4.2 (sef-bench-cpu-single-ts:local). HTTP: 1.4.2, Bun.serve (built in) (sef-bd-http-ts:local). Base de datos: Bun.sql (built into Bun 1.4.2) (sef-bd-database-ts:local)
- elixir: 1.20.4 (sef-bench-cpu-single-elixir:local). HTTP: 1.20.4, Bandit 1.12.5 + Plug 1.20.3 (sef-bd-http-elixir:local). Base de datos: Postgrex 0.22.4 (sef-bd-database-elixir:local)
- python: Python 3.14.8 (sef-bench-cpu-single-python:local). HTTP: Python 3.14.8, FastAPI 0.142.4 + uvicorn 0.54.0 (1 worker) (sef-bd-http-python:local). Base de datos: psycopg 3.3.6 + psycopg-pool 3.3.3 (sef-bd-database-python:local)

### CPU, un thread: n-body, 1,000,000 pasos

`proceso` es el programa completo (promedio ± desviación estándar de 5 ejecuciones), `sección` es solo el núcleo, sin el arranque.

| Lenguaje | proceso (ms) | rango (ms) | sección (ms) | CPU (ms) | pico de memoria (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 102 ± 14.1 | 83.5 – 119 | 95.6 | 101 | 3.68 |
| rust | 48.7 ± 3.29 | 44.4 – 53.4 | 49.2 | 48.6 | 2.04 |
| go | 98.2 ± 11.0 | 82.6 – 112 | 100 | 99.6 | 2.09 |
| java | 151 ± 8.84 | 140 – 163 | 123 | 199 | 44.2 |
| ts | 220 ± 23.8 | 181 – 244 | 234 | 228 | 30.5 |
| elixir | 3660 ± 803 | 2864 – 4742 | 2900 | 4595 | 84.3 |
| python | 9159 ± 861 | 8398 – 10338 | 9178 | 9157 | 14.9 |

### CPU, un thread: criba de primos hasta 10,000,000

`proceso` es el programa completo (promedio ± desviación estándar de 5 ejecuciones), `sección` es solo el núcleo, sin el arranque.

| Lenguaje | proceso (ms) | rango (ms) | sección (ms) | CPU (ms) | pico de memoria (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 42.4 ± 5.08 | 37.8 – 48.7 | 29.2 | 42.2 | 12.9 |
| rust | 35.9 ± 5.32 | 29.1 – 41.1 | 25.5 | 35.8 | 11.6 |
| go | 45.8 ± 5.57 | 40.3 – 54.3 | 36.6 | 47.3 | 12.0 |
| java | 119 ± 12.9 | 101 – 136 | 51.9 | 158 | 53.8 |
| ts | 56.1 ± 4.88 | 48.4 – 61.2 | 37.3 | 60.6 | 38.7 |
| elixir | 1586 ± 141 | 1417 – 1770 | 1203 | 2645 | 160 |
| python | 1931 ± 191 | 1792 – 2243 | 1701 | 1930 | 24.5 |

### Paralelismo: speed-up (primos por debajo de 2,000,000)

Tiempo de la sección medida con 1 worker dividido por el tiempo con w workers (promedio de 5 ejecuciones cada uno). Lo ideal es w.

| Lenguaje | tiempo, 1 worker (ms) | 2 workers | 4 workers | 8 workers | 16 workers |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 212 ± 21.5 | 1.93× | 3.14× | 4.31× | 4.59× |
| rust | 217 ± 31.4 | 2.62× | 4.10× | 5.96× | 7.55× |
| go | 178 ± 8.66 | 1.95× | 2.91× | 5.01× | 5.20× |
| java | 271 ± 23.6 | 1.52× | 1.99× | 2.36× | 1.80× |
| ts | 345 ± 67.9 | 1.41× | 2.36× | 2.76× | 1.81× |
| elixir | 685 ± 113 | 1.21× | 1.77× | 3.14× | 2.66× |
| python | 10502 ± 1356 | 1.86× | 2.77× | 4.34× | 4.13× |

### Paralelismo: eficiencia

Speed-up dividido por el número de workers. 100 % significa que no se perdió ningún tiempo.

| Lenguaje | 2 workers | 4 workers | 8 workers | 16 workers |
| --- | ---: | ---: | ---: | ---: |
| cpp | 97 % | 79 % | 54 % | 29 % |
| rust | 131 % | 102 % | 75 % | 47 % |
| go | 98 % | 73 % | 63 % | 33 % |
| java | 76 % | 50 % | 29 % | 11 % |
| ts | 71 % | 59 % | 34 % | 11 % |
| elixir | 60 % | 44 % | 39 % | 17 % |
| python | 93 % | 69 % | 54 % | 26 % |

### Paralelismo: tiempo de CPU del proceso completo (ms)

Tiempo de usuario más sistema sumado en todos los núcleos, medido por hyperfine. Crece con los workers cuando los núcleos esperan, giran en vacío o comparten un núcleo físico.

| Lenguaje | 1 | 2 | 4 | 8 | 16 |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 228 | 181 | 189 | 232 | 280 |
| rust | 193 | 188 | 267 | 284 | 310 |
| go | 185 | 213 | 195 | 243 | 298 |
| java | 322 | 326 | 363 | 457 | 617 |
| ts | 234 | 273 | 388 | 538 | 697 |
| elixir | 2428 | 2631 | 2374 | 2495 | 2780 |
| python | 9839 | 12243 | 12800 | 19230 | 26853 |

### Concurrencia: tareas esperando al mismo tiempo

`memoria por tarea` = (pico con n tareas − pico con 0 tareas) / n. Los threads del SO en C++ están limitados a 10.000 (mira los límites más abajo).

| Lenguaje | modelo | tareas | tiempo total (ms) | pico de memoria (MiB) | memoria por tarea (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | coroutines | 100,000 | 63.4 ± 13.7 | 14.0 | 108 |
| cpp | os-threads | 10,000 | 1694 ± 290 | 85.6 | 8,586 |
| rust | tokio-tasks | 100,000 | 192 ± 29.3 | 52.0 | 514 |
| go | goroutines | 100,000 | 460 ± 33.8 | 265 | 2,762 |
| java | virtual-threads | 100,000 | 4476 ± 708 | 259 | 2,264 |
| ts | promises | 100,000 | 250 ± 42.5 | 70.1 | 542 |
| elixir | processes | 100,000 | 1270 ± 521 | 372 | 3,009 |
| python | asyncio-tasks | 100,000 | 2095 ± 334 | 148 | 1,291 |

### HTTP: eco de JSON (`POST /echo`)

32 usuarios virtuales, 3 ejecuciones de 10 s. CPU: 100 % es un núcleo, el límite es 400 %. `CPU de k6` cerca de 400 % significa que el límite fue el generador de carga, no el servidor.

| Lenguaje | req/s | p50 (ms) | p95 (ms) | p99 (ms) | pico de memoria (MiB) | CPU promedio (%) | CPU de k6 (%) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 14,346 ± 2,295 | 1.35 | 6.51 | 12.7 | 6.61 | 188 | 378 |
| rust | 12,694 ± 3,143 | 1.58 | 7.53 | 14.2 | 5.45 | 107 | 280 |
| go | 16,119 ± 1,116 | 1.25 | 5.55 | 10.1 | 12.2 | 214 | 338 |
| java | 12,939 ± 1,923 | 1.54 | 7.06 | 13.6 | 173 | 168 | 283 |
| ts | 18,719 ± 5,605 | 1.32 | 4.27 | 7.63 | 17.8 | 96 | 306 |
| elixir | 16,470 ± 3,265 | 1.42 | 4.91 | 8.66 | 147 | 329 | 340 |
| python | 2,170 ± 260 | 13.3 | 26.7 | 38.6 | 45.6 | 101 | 110 |

### HTTP: limitado por CPU (`GET /primes?limit=5000`)

32 usuarios virtuales, 3 ejecuciones de 10 s. CPU: 100 % es un núcleo, el límite es 400 %. `CPU de k6` cerca de 400 % significa que el límite fue el generador de carga, no el servidor.

| Lenguaje | req/s | p50 (ms) | p95 (ms) | p99 (ms) | pico de memoria (MiB) | CPU promedio (%) | CPU de k6 (%) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 13,884 ± 2,447 | 1.35 | 6.88 | 13.8 | 6.42 | 239 | 321 |
| rust | 17,625 ± 1,974 | 1.20 | 4.78 | 9.22 | 6.43 | 236 | 342 |
| go | 21,080 ± 3,670 | 0.99 | 4.24 | 8.20 | 12.7 | 312 | 354 |
| java | 9,594 ± 1,588 | 2.11 | 9.74 | 17.6 | 176 | 221 | 270 |
| ts | 7,645 ± 757 | 3.60 | 8.00 | 13.0 | 19.4 | 98 | 175 |
| elixir | 6,927 ± 860 | 3.79 | 10.1 | 16.2 | 147 | 369 | 193 |
| python | 345 ± 16 | 90.9 | 127 | 150 | 47.9 | 106 | 16 |

### Memoria: árboles binarios, profundidad 18

GC = con recolector de basura. `CPU` por encima de `tiempo` significa que threads auxiliares (por lo general el recolector) trabajaron en otros núcleos.

| Lenguaje | memoria | pico de memoria (MiB) | tiempo (ms) | CPU (ms) |
| --- | ---: | ---: | ---: | ---: |
| cpp | manual | 35.6 | 2494 ± 269 | 2492 |
| rust | manual | 34.1 | 2406 ± 361 | 2388 |
| go | GC | 38.5 | 2723 ± 359 | 5484 |
| java | GC | 459 | 1029 ± 177 | 1177 |
| ts | GC | 171 | 1809 ± 366 | 3204 |
| elixir | GC | 196 | 2000 ± 199 | 3173 |
| python | GC | 46.1 | 12936 ± 1349 | 12913 |

### Memoria: proceso inactivo (arranca y sale)

Lo que paga todo programa del lenguaje antes de hacer cualquier cosa.

| Lenguaje | memoria | tiempo de arranque (ms) | pico de memoria (MiB) |
| --- | ---: | ---: | ---: |
| cpp | manual | 1.86 ± 0.23 | 3.78 |
| rust | manual | 1.33 ± 0.10 | 2.14 |
| go | GC | 2.41 ± 0.44 | 2.09 |
| java | GC | 170 ± 26.5 | 43.6 |
| ts | GC | 21.6 ± 4.09 | 17.6 |
| elixir | GC | 453 ± 50.7 | 85.6 |
| python | GC | 157 ± 14.0 | 14.7 |

### Tiempo de compilación del programa de `cpu-single`

`frío` empieza sin salida y sin caché del compilador. `caliente` cambia una línea y compila de nuevo. `paso` dice qué se mide realmente: Python, Elixir, Java y Bun no tienen un paso que produzca código de máquina por adelantado.

| Lenguaje | paso | frío (ms) | caliente (ms) | comando |
| --- | ---: | ---: | ---: | ---: |
| cpp | compile-and-link | 4512 ± 2676 | 4698 ± 1680 | `g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main` |
| rust | compile-and-link | 417 ± 54.8 | 551 ± 265 | `cargo build --release --locked --offline --quiet` |
| go | compile-and-link | 7439 ± 3568 | 335 ± 132 | `go build -o main .` |
| java | compile-to-bytecode | 768 ± 114 | 768 ± 127 | `javac -d out Main.java` |
| ts | bundle-no-typecheck | 8.49 ± 1.72 | 11.3 ± 7.07 | `bun build main.ts --target bun --outfile out/main.js` |
| elixir | compile-to-bytecode | 765 ± 84.3 | 1020 ± 148 | `elixirc --ignore-module-conflict -o out main.ex` |
| python | bytecode-automatic | 75.9 ± 6.72 | 74.4 ± 15.9 | `python -m py_compile main.py` |

### Tamaño en disco de lo que entregas

`runtime` es lo que debe estar en la máquina además del artefacto, sin contar el sistema operativo y glibc. Los tamaños son exactos, así que no hay dispersión.

| Lenguaje | artefacto (KiB) | runtime (KiB) | total (KiB) | artefacto | runtime |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 20.6 | 3,625.7 | 3,646.4 | executable, g++ -O2, dynamically linked, not stripped | libstdc++ and libgcc_s shared libraries |
| rust | 483.5 | 178.6 | 662.1 | executable, cargo build --release, standard library linked in, not stripped | libgcc_s shared library |
| go | 2,327.8 | 0 | 2,327.8 | executable, CGO_ENABLED=0 go build, statically linked, not stripped | nothing |
| java | 3.8 | 42,894.3 | 42,898.1 | jar with the compiled classes | smallest Java runtime made by jlink (module java.base only, compressed) |
| ts | 2 | 77,637.3 | 77,639.4 | one JavaScript file made by bun build --minify | the bun executable |
| elixir | 7.5 | 65,892.9 | 65,900.4 | the application's compiled modules inside a mix release | the rest of the release: the Erlang runtime (ERTS) and the Erlang and Elixir libraries |
| python | 5.5 | 31,023.7 | 31,029.2 | the source file (Python ships source, bytecode is made on the first run) | the CPython interpreter, its shared library and the standard library |

### Base de datos: insertar filas una por una

5000 filas, 3 ejecuciones. Cada operación es un viaje de ida y vuelta a PostgreSQL. La CPU y la memoria del cliente corresponden a la ejecución completa del cliente (todas las fases).

| Lenguaje | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU del cliente (ms) | memoria del cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 4,817 ± 272 | 0.19 | 0.28 | 0.44 | 1,134 | 11.5 |
| rust | 1,463 ± 96 | 0.62 | 0.95 | 2.19 | 5,233 | 5.76 |
| go | 4,415 ± 285 | 0.22 | 0.28 | 0.34 | 2,042 | 13.9 |
| java | 5,713 ± 282 | 0.16 | 0.24 | 0.34 | 3,877 | 128 |
| ts | 4,189 ± 204 | 0.23 | 0.32 | 0.46 | 2,654 | 53.0 |
| elixir | 2,699 ± 174 | 0.35 | 0.47 | 0.68 | 4,286 | 112 |
| python | 4,239 ± 694 | 0.23 | 0.32 | 0.45 | 5,663 | 41.5 |

### Base de datos: leer por clave primaria

5000 filas, 3 ejecuciones. Cada operación es un viaje de ida y vuelta a PostgreSQL. La CPU y la memoria del cliente corresponden a la ejecución completa del cliente (todas las fases).

| Lenguaje | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU del cliente (ms) | memoria del cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 4,965 ± 344 | 0.19 | 0.27 | 0.39 | 1,134 | 11.5 |
| rust | 1,594 ± 100 | 0.59 | 0.81 | 1.22 | 5,233 | 5.76 |
| go | 4,852 ± 129 | 0.20 | 0.24 | 0.28 | 2,042 | 13.9 |
| java | 6,452 ± 520 | 0.14 | 0.20 | 0.31 | 3,877 | 128 |
| ts | 4,173 ± 300 | 0.22 | 0.32 | 0.60 | 2,654 | 53.0 |
| elixir | 2,761 ± 124 | 0.35 | 0.45 | 0.55 | 4,286 | 112 |
| python | 4,239 ± 492 | 0.22 | 0.31 | 0.58 | 5,663 | 41.5 |

### Base de datos: filtrar y agregar

5000 filas, 3 ejecuciones. Cada operación es un viaje de ida y vuelta a PostgreSQL. La CPU y la memoria del cliente corresponden a la ejecución completa del cliente (todas las fases).

| Lenguaje | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU del cliente (ms) | memoria del cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 1,919 ± 315 | 0.51 | 0.82 | 1.00 | 1,134 | 11.5 |
| rust | 1,131 ± 93 | 0.85 | 1.12 | 1.63 | 5,233 | 5.76 |
| go | 2,187 ± 204 | 0.43 | 0.58 | 0.82 | 2,042 | 13.9 |
| java | 2,545 ± 29 | 0.37 | 0.48 | 0.64 | 3,877 | 128 |
| ts | 2,020 ± 130 | 0.46 | 0.66 | 1.17 | 2,654 | 53.0 |
| elixir | 1,392 ± 247 | 0.69 | 1.05 | 1.76 | 4,286 | 112 |
| python | 2,081 ± 57 | 0.45 | 0.67 | 0.80 | 5,663 | 41.5 |

### Base de datos: leer por clave, 8 workers en un pool

5000 filas, 3 ejecuciones. Cada operación es un viaje de ida y vuelta a PostgreSQL. La CPU y la memoria del cliente corresponden a la ejecución completa del cliente (todas las fases).

| Lenguaje | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU del cliente (ms) | memoria del cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 23,546 ± 3,998 | 0.23 | 0.60 | 1.78 | 1,134 | 11.5 |
| rust | 13,456 ± 3,505 | 0.55 | 1.03 | 1.78 | 5,233 | 5.76 |
| go | 32,674 ± 1,644 | 0.22 | 0.32 | 0.41 | 2,042 | 13.9 |
| java | 14,681 ± 644 | 0.23 | 0.60 | 6.75 | 3,877 | 128 |
| ts | 9,226 ± 1,626 | 0.64 | 1.69 | 2.71 | 2,654 | 53.0 |
| elixir | 12,187 ± 4,557 | 0.60 | 1.39 | 2.29 | 4,286 | 112 |
| python | 2,259 ± 250 | 3.44 | 5.87 | 7.93 | 5,663 | 41.5 |

<!-- results:end -->

## Límites de la comparación

- **Ruido.** Los números versionados se midieron mientras otros contenedores se ejecutaban en la misma máquina, dentro de Docker Desktop sobre WSL 2. Las ejecuciones son pocas (5, o 3 en HTTP y base de datos) y cortas. Una diferencia menor que la dispersión informada no es una diferencia, y los lenguajes cuyos números están cerca no deben ordenarse.
- **Una máquina, un día, configuración predeterminada.** Sin flags de JVM, sin ajuste de `GOGC`, sin asignador alternativo, sin optimización guiada por perfil, sin optimización en tiempo de enlace.
- **Programas pequeños escritos de la forma simple.** Muestran el runtime en una tarea estrecha. Los programas reales usan bibliotecas que cambian por completo el panorama (NumPy en Python, arenas en C++ y Rust).
- **El arranque está incluido** en cada tiempo de proceso completo y domina las ejecuciones cortas de los lenguajes rápidos. La columna `section` lo excluye.
- **El paralelismo** usa un trabajo que toma una fracción de segundo en los lenguajes compilados, así que iniciar los workers es una parte visible. El host tiene 8 núcleos físicos con SMT: 16 workers no pueden dar 16 veces.
- **La concurrencia** mide un arranque en frío. El número de la JVM está dominado por código que el JIT todavía no ha compilado: el mismo bucle repetido en una JVM caliente tardó más de 10 veces menos en una comprobación manual. Los threads del SO de C++ se detienen en 10.000 porque 100.000 threads se acercarían al límite de threads de la máquina virtual de Docker (`kernel.threads-max` era 127.543), compartida con otros trabajos.
- **HTTP** compara stacks, no lenguajes. Python y Bun ejecutan un proceso, su valor predeterminado, mientras que los demás usan los 4 núcleos. Cliente y servidor comparten la máquina, el modelo de carga es cerrado (la latencia bajo sobrecarga se subestima), y cuando la columna de CPU de k6 está cerca de 400 % el generador de carga es el límite.
- **La base de datos** mide sobre todo el driver y el viaje de ida y vuelta. Los drivers difieren en valores predeterminados que importan más que el lenguaje, como si una sentencia se prepara una vez o en cada llamada. PostgreSQL guarda aquí sus datos en memoria.
- **La compilación** usa un programa de un solo archivo. Python, Bun, Java y Elixir no producen código de máquina por adelantado, así que sus filas miden un paso distinto, nombrado en la tabla.
- **El tamaño del binario** no cuenta el sistema operativo ni glibc, y nada pasa por strip.
- La velocidad, la memoria y el tamaño son solo algunas de las razones para elegir un lenguaje. La seguridad, la facilidad de escritura, las bibliotecas y la experiencia del equipo no están en ninguna tabla.

## Brechas encontradas en el runner compartido

No se cambió nada en `tools/`. Esto se resolvió dentro de `benchmarks/`:

- El runner encuentra un proyecto solo por ruta o bajo `projects/<area>/`. `benchmarks/package.json` tiene su propio script `bench`, así que `bun run bench -- --project cpu-single` funciona desde `benchmarks/`.
- La sección medida se lee una sola vez por fila, lo que es demasiado ruidoso para el speed-up. `scripts/collect-sections.ts` recolecta 5 muestras.
- No hay un paso antes de cada ejecución cronometrada (necesario para las compilaciones en frío), ni un modo de servicio de larga duración (HTTP, base de datos), ni una métrica de tamaño. Cada uno tiene su propio recolector, que escribe los mismos tres archivos de resultados.
- El runner reconstruye la imagen de hyperfine en cada invocación, lo que contacta al registro y falla por timeout. `bun run all` reintenta un paso que falla.

## Temas del quiz que demuestra

Las áreas del quiz que ilustran estas cargas son concurrencia y paralelismo, sistemas operativos (procesos, threads, planificación), gestión de memoria, compiladores e intérpretes, redes (HTTP) y bases de datos. Los enlaces se agregan cuando se escriban esas áreas del quiz.
