# scaling-by-cores

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cuánto más rápido se vuelve un programa con más núcleos, y por qué no de forma lineal? Este mini-proyecto (MP-PAR-1) ejecuta dos cargas limitadas por CPU, el conteo de primos y un render de Mandelbrot, de forma secuencial y con 1, 2, 4 y 8 trabajadores, en Rust, Go y C++. Prueba que los resultados paralelos son exactamente los secuenciales, mide la aceleración (speed-up) y la eficiencia, y ajusta la ley de Amdahl a las mediciones para estimar la fracción serial.

Explicación más larga de los conceptos: [docs/es/parallelism/scaling-by-cores.md](../../../docs/es/parallelism/scaling-by-cores.md).

## Temas del quiz que demuestra

Área `parallelism` del quiz:

- `amdahl-gustafson`: la fracción serial se estima a partir de las mediciones, invirtiendo la ley de Amdahl.
- `speedup-efficiency-scalability`: tablas de speed-up y eficiencia para 1, 2, 4 y 8 trabajadores, con una base secuencial (escalabilidad fuerte).
- `data-vs-task-parallelism`: la misma operación sobre porciones de números o de filas, y qué pasa cuando porciones iguales no son trabajo igual.
- `fork-join-work-stealing`: los trabajadores se crean y se esperan (fork y join); bloques estáticos frente a porciones dinámicas en una carga irregular.
- `parallel-sorting-reductions`: un resultado parcial local por trabajador, combinado después del join con un operador asociativo y conmutativo.
- `determinism-reproducibility`: el resultado paralelo es igual al secuencial bit a bit, en tres lenguajes.
- `false-sharing-cache-effects`: los trabajadores acumulan en variables locales y escriben la posición compartida una sola vez, así que no se disputa ninguna línea de caché en el bucle caliente.
- `shared-vs-distributed-memory`: los hilos de un mismo proceso escriben en partes disjuntas del mismo búfer.
- `map-reduce-patterns`: un map independiente sobre los elementos seguido de una mezcla de los resultados parciales.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-scaling-by-cores.sh        # Linux y macOS
./setup-windows-scaling-by-cores.ps1    # Windows
```

El script construye una imagen fijada por lenguaje, ejecuta el formateador, el linter y las pruebas de cada una, y termina con una demo: la misma imagen de Mandelbrot con 1 y con 8 trabajadores en los tres lenguajes. El campo `checksum` debe ser idéntico en todas las líneas y `elapsedMs` debería bajar.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `rust/` | `std::thread::scope`, sin crates. `src/primes.rs`, `src/mandelbrot.rs`, `src/schedule.rs` y la línea de comandos en `src/main.rs` |
| `go/` | goroutines con `sync.WaitGroup` y `sync/atomic`, solo biblioteca estándar |
| `cpp/` | `std::thread` y `std::atomic`, biblioteca solo de encabezados más `main.cpp` y `test_scaling.cpp` |
| `report/` | `scaling.ts` convierte las filas del benchmark en speed-up, eficiencia y el ajuste de Amdahl |
| `results/` | salida versionada del benchmark y del reporte |
| `dashboard/` | página estática que grafica speed-up y eficiencia contra trabajadores a partir de `results/results.js` |
| `bench.json` | la cuadrícula del benchmark: 3 lenguajes, 6 implementaciones, 4 cantidades de trabajadores |

Cada implementación tiene la misma línea de comandos, `<workload>-<mode> <n> <workers>`, con workload `primes` o `mandelbrot` y mode `seq`, `static` o `dynamic`. Imprime una línea JSON que sigue el [contrato de benchmark](../../../docs/es/benchmarks.md). `n` es el número de elementos: los enteros hasta `n` para los primos, o los píxeles de una imagen cuadrada cuyo lado es la raíz cuadrada entera de `n`.

Se implementan dos formas de dividir el trabajo, porque su diferencia es la razón principal de que aquí el speed-up no sea lineal:

- `static`: un bloque contiguo por trabajador. Sin coordinación, pero los bloques no cuestan lo mismo, así que algunos trabajadores terminan antes y esperan.
- `dynamic`: los trabajadores toman la siguiente porción pequeña (10,000 números o 4 filas) de un contador atómico compartido. Rust usa una cola detrás de un mutex para la imagen, porque así conserva la prueba de que cada píxel tiene un único escritor.

## Pruebas

```sh
docker compose run --rm rust-test     # cargo fmt --check, clippy -D warnings, cargo test
docker compose run --rm go-test       # gofmt, go vet, golangci-lint, go test -race
docker compose run --rm cpp-test      # clang-format --dry-run --Werror, pruebas compiladas con -Wall -Wextra -Werror
docker compose run --rm report-test   # bun test de las fórmulas del reporte
```

Lo que prueban las pruebas:

- El resultado paralelo es exactamente igual al secuencial, para 1, 2, 3, 4 y 8 trabajadores y ambas planificaciones, incluidos los rangos menores que el número de trabajadores.
- Valores conocidos: 25 primos hasta 100, 9,592 primos hasta 100,000 con suma 454,396,537.
- Los tres lenguajes renderizan la misma imagen: el mismo checksum de referencia se verifica en las tres suites de pruebas.
- Las pruebas de Go corren bajo el detector de condiciones de carrera.
- El ajuste de Amdahl devuelve la fracción serial que generó datos exactos de Amdahl, y el reporte rechaza un benchmark cuyos checksums difieren.

## Benchmark

Un solo comando, desde la raíz del repositorio (necesita Bun en el host, como todo benchmark del repositorio):

```sh
bun run bench -- --project projects/parallelism/scaling-by-cores
```

Compila cada implementación dentro de su imagen fijada, ejecuta toda la cuadrícula sin red, y escribe `results/results.md`, `results/results.json` y `results/results.js`. Luego deriva las tablas de escalabilidad, en Docker:

```sh
docker compose --profile report run --rm report
```

Eso escribe `results/scaling.md` y `results/scaling.json`. Abre `dashboard/index.html` en un navegador para ver la gráfica.

## Resultados

Medido el 2026-10-07 en un AMD Ryzen 7 5700X3D (8 núcleos físicos, 16 lógicos), Docker Desktop en Windows con 16 CPU, `n` = 9,000,000 (primos hasta 9,000,000 y una imagen de 3000 x 3000), 5 ejecuciones por fila después de 1 de calentamiento. Máquina, versiones de los runtimes y comandos exactos: [results/results.md](results/results.md). Todas las filas, con media, desviación estándar, mejor ejecución y fracción serial: [results/scaling.md](results/scaling.md) (en inglés, generado por el script).

**Lee estos números con cuidado.** La máquina se compartía con otras cargas en Docker mientras corría el benchmark, así que los tiempos tienen ruido: la desviación estándar de una fila es en promedio el 9% de su media, y pasa del 20% en algunas filas. Por eso cada celda de abajo se calcula entre las ejecuciones más rápidas (mejor tiempo secuencial sobre mejor tiempo paralelo), y por eso la misma cuadrícula, ejecutada dos veces, no da la misma tabla. El rango entre las dos ejecuciones se muestra después de las tablas. En una máquina tranquila espera valores más altos y más estables.

### Los resultados paralelos son iguales a los secuenciales

Las 72 filas de la cuadrícula (3 lenguajes, secuencial, estático y dinámico, de 1 a 8 trabajadores) imprimieron el mismo checksum por carga:

| Carga | Resultado |
| --- | --- |
| primes | 602,489 primos hasta 9,000,000, suma 2,613,521,583,098 |
| mandelbrot | 1,554,159,510 iteraciones en total, checksum de la imagen `99d0e04fa277c931` |

### Speed-up y eficiencia

Cada celda es `speed-up (eficiencia)` para esa cantidad de trabajadores. La base es la implementación secuencial del mismo lenguaje.

#### primes

| Lenguaje | Planificación | Secuencial (ms) | 1 | 2 | 4 | 8 | Fracción serial ajustada |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | estático | 1481 | 0.98 (98%) | 1.50 (75%) | 2.35 (59%) | 4.26 (53%) | 19.8% |
| cpp | dinámico | 1481 | 0.90 (90%) | 1.74 (87%) | 3.22 (81%) | 4.22 (53%) | 11.5% |
| go | estático | 1572 | 0.82 (82%) | 1.50 (75%) | 1.59 (40%) | 2.46 (31%) | 39.0% |
| go | dinámico | 1572 | 0.82 (82%) | 1.30 (65%) | 2.53 (63%) | 3.34 (42%) | 25.1% |
| rust | estático | 1388 | 0.89 (89%) | 1.46 (73%) | 2.28 (57%) | 3.31 (41%) | 24.6% |
| rust | dinámico | 1388 | 0.75 (75%) | 1.67 (84%) | 2.49 (62%) | 3.07 (38%) | 21.4% |

#### mandelbrot

| Lenguaje | Planificación | Secuencial (ms) | 1 | 2 | 4 | 8 | Fracción serial ajustada |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | estático | 4455 | 0.90 (90%) | 1.80 (90%) | 1.95 (49%) | 2.59 (32%) | 28.7% |
| cpp | dinámico | 4455 | 0.89 (89%) | 2.00 (100%) | 3.59 (90%) | 6.24 (78%) | 3.3% |
| go | estático | 4550 | 0.92 (92%) | 2.03 (102%) | 1.92 (48%) | 2.65 (33%) | 26.6% |
| go | dinámico | 4550 | 0.94 (94%) | 1.88 (94%) | 3.34 (83%) | 5.37 (67%) | 6.8% |
| rust | estático | 5246 | 0.79 (79%) | 1.51 (75%) | 1.78 (45%) | 2.82 (35%) | 32.7% |
| rust | dinámico | 5246 | 0.88 (88%) | 1.98 (99%) | 3.58 (89%) | 5.44 (68%) | 4.8% |

Rango entre dos ejecuciones de toda la cuadrícula, speed-up con 8 trabajadores (la ejecución versionada es el segundo valor):

| Carga | Planificación | cpp | go | rust |
| --- | --- | --- | --- | --- |
| primes | estático | 4.32 y 4.26 | 4.10 y 2.46 | 4.12 y 3.31 |
| primes | dinámico | 4.45 y 4.22 | 5.01 y 3.34 | 4.49 y 3.07 |
| mandelbrot | estático | 2.19 y 2.59 | 2.23 y 2.65 | 2.71 y 2.82 |
| mandelbrot | dinámico | 6.11 y 6.24 | 4.23 y 5.37 | 6.05 y 5.44 |

### Ajuste de Amdahl: la fracción serial estimada

La última columna de las tablas es la fracción serial `s` de la ley de Amdahl, `S(N) = 1 / (s + (1 - s) / N)`, ajustada por mínimos cuadrados a los speed-ups medidos con 2, 4 y 8 trabajadores.

- **Mandelbrot, planificación dinámica: s es 3.3% (C++), 6.8% (Go) y 4.8% (Rust).** Es lo mejor que hace el programa. Con s alrededor del 5%, la ley de Amdahl limita el speed-up a cerca de 20 por más núcleos que se añadan, y predice cerca de 6 con 8 trabajadores, que es lo que se midió.
- **Mandelbrot, planificación estática: s es 28.7% (C++), 26.6% (Go) y 32.7% (Rust).** El código es el mismo, solo cambió la división, y el speed-up se detiene cerca de 2.7.
- **Primos: s está entre 11.5% y 39.0%**, con la planificación dinámica por debajo de la estática en los tres lenguajes. Son las filas con más ruido de la cuadrícula, como muestra la tabla de rangos.

### Por qué no es lineal

La s ajustada es una fracción serial *efectiva*. El código realmente serial en estos programas es diminuto: iniciar el proceso y los hilos, reservar la imagen, una pasada sobre ella para el checksum, imprimir una línea. Lo que el ajuste absorbe es todo lo demás que impide que los trabajadores trabajen:

1. **Desbalance de carga.** Es el efecto grande, y las filas de Mandelbrot estático lo aíslan. Con 2 trabajadores la imagen se corta por su eje de simetría, las dos mitades cuestan lo mismo, y el speed-up llega a 1.8 en C++ y 2.0 en Go (1.5 en Rust, una fila con ruido). Con 4 trabajadores los dos bloques del medio concentran la mayor parte de los puntos dentro del conjunto, los dos trabajadores de los extremos terminan antes y esperan, y el speed-up se queda en cerca de 1.9. La ley de Amdahl lee el tiempo ocioso como código serial: una s cercana al 30% para un programa que no tiene ese código. La planificación dinámica elimina el desbalance y la s cae por debajo del 7%. La fracción serial por fila en `results/scaling.md` (Karp-Flatt) también lo muestra: salta de una cantidad de trabajadores a la siguiente en lugar de mantenerse constante, señal de sobrecarga y no de código serial.
2. **La maquinaria paralela.** El código paralelo con 1 trabajador es más lento que el código secuencial en todas las filas (speed-up entre 0.75 y 0.98): los hilos, el contador compartido, la cola y la mezcla de los parciales no son gratis.
3. **Los núcleos no están todos libres ni son todos iguales.** 8 trabajadores necesitan los 8 núcleos físicos de esta CPU, que también ejecutan el sistema operativo, Docker y, durante esta medición, otros contenedores. Un trabajador que pierde su núcleo por un instante retrasa el join. Además, una CPU suele ejecutar un solo núcleo ocupado a un reloj más alto que ocho, algo que este benchmark no aísla.
4. **Código realmente serial.** Pequeño aquí, pero es la única parte que ninguna cantidad de núcleos elimina.

La lectura práctica: antes de culpar a la ley de Amdahl, comprueba que todos los trabajadores estén ocupados hasta el final. Aquí ese único cambio, de estático a dinámico, lleva el speed-up de Mandelbrot con 8 trabajadores de cerca de 2.7 a cerca de 5.7.

## Dependencias y versiones

Ninguna biblioteca fuera de la biblioteca estándar de cada lenguaje: `std::thread` en Rust y C++, goroutines en Go. Un crate como rayon escondería el mecanismo que es el tema de este mini-proyecto.

| Herramienta | Versión |
| --- | --- |
| Rust | imagen `rust:1.99.0-slim-trixie` |
| Go | imagen `golang:1.27.1-bookworm`, golangci-lint de `golangci/golangci-lint:v2.14.0` |
| C++ | imagen `gcc:16.2.0-trixie` (C++23), clang-format del paquete Debian |
| Reporte | imagen `oven/bun:1.4.2` |
