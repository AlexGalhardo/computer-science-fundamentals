# Escalabilidad por núcleos

> English version: [docs/en/parallelism/scaling-by-cores.md](../../en/parallelism/scaling-by-cores.md) · Versão em português: [docs/pt/parallelism/scaling-by-cores.md](../../pt/parallelism/scaling-by-cores.md)

Área: Paralelismo. Mini-proyecto: [projects/parallelism/scaling-by-cores](../../../projects/parallelism/scaling-by-cores/README.es.md) (MP-PAR-1). Lenguajes: Rust, Go, C++.

## La pregunta

Una máquina tiene 8 núcleos. ¿Un programa corre 8 veces más rápido en ella? Este mini-proyecto mide la respuesta para dos programas limitados por CPU y explica la distancia entre lo ideal y lo medido.

## Conceptos

| Concepto | Significado |
| --- | --- |
| Speed-up | `S(N) = T(1) / T(N)`: cuántas veces más rápido es el programa con N trabajadores. La base aquí es el programa secuencial, no el paralelo con un trabajador |
| Eficiencia | `E(N) = S(N) / N`: la parte de cada trabajador que se convirtió en ganancia |
| Escalabilidad fuerte | El tamaño del problema es fijo y solo varían los trabajadores. Es lo que hace el benchmark |
| Ley de Amdahl | Con una fracción serial `s`, `S(N) = 1 / (s + (1 - s) / N)`, que nunca supera `1 / s` |
| Métrica de Karp-Flatt | Amdahl invertida para una medición: `s = (1/S - 1/N) / (1 - 1/N)`. Una `s` constante indica código serial, una `s` creciente indica sobrecarga |
| Paralelismo de datos | La misma operación sobre porciones de los datos: números que probar, filas que renderizar |
| Fork-join | Iniciar los trabajadores, esperar a todos y luego leer sus resultados |
| Planificación estática | Un bloque contiguo por trabajador, decidido antes de que empiece el trabajo |
| Planificación dinámica | Los trabajadores toman la siguiente porción pequeña cuando quedan libres |
| Reducción | Cada trabajador guarda un resultado parcial local y los resultados parciales se combinan al final |

## Las dos cargas

**Conteo de primos.** Cuenta los primos hasta `n` por división de prueba con divisores impares hasta la raíz cuadrada. Probar que un número es primo cuesta unas `sqrt(n) / 2` divisiones, así que los números grandes son más caros que los pequeños. El resultado es la cuenta y la suma de los primos.

**Mandelbrot.** Renderiza una imagen cuadrada del conjunto de Mandelbrot: para cada píxel, itera `z = z² + c` hasta que `|z| > 2` o hasta 1,000 pasos. Los píxeles dentro del conjunto cuestan 1,000 pasos, los píxeles lejos de él cuestan uno o dos. El resultado es la imagen, resumida por el total de iteraciones y un checksum.

Ambas son de datos paralelos: ningún número y ningún píxel depende de otro. Ambas son irregulares: porciones iguales de datos no son cantidades iguales de trabajo. Esa segunda propiedad es lo que separa las dos planificaciones.

## Cómo se divide el trabajo

```text
static, 4 workers                      dynamic, 4 workers

rows  0 ..  499 -> worker 0 (cheap)    shared counter: next free row
rows 500 .. 999 -> worker 1 (costly)   every worker repeats:
rows 1000..1499 -> worker 2 (costly)       take the next 4 rows
rows 1500..1999 -> worker 3 (cheap)        render them
                                       until no row is left
workers 0 and 3 finish early and wait  nobody waits while work remains
```

Con la planificación estática el programa es tan lento como su trabajador con peor suerte. Con la planificación dinámica las filas caras terminan repartidas entre todos los trabajadores, al precio de una operación atómica por porción. La porción es lo bastante pequeña para equilibrar la carga y lo bastante grande para mantener ese contador compartido fuera del bucle caliente: 4 filas de la imagen, o 10,000 números.

## Por qué el resultado paralelo es exactamente el secuencial

El criterio de aceptación del mini-proyecto es la igualdad, no la semejanza.

- **Sin escrituras compartidas.** Cada píxel tiene un único escritor, y cada trabajador cuenta en una variable local. No hay condición de carrera que haga depender el resultado de la planificación.
- **Reducción entera.** Los resultados parciales son enteros combinados con suma, que es asociativa y conmutativa, así que la agrupación y el orden de los trabajadores no importan.
- **El punto flotante es por píxel.** La iteración de Mandelbrot usa doubles, pero cada píxel se calcula solo, con las mismas operaciones en el mismo orden. Nada se suma entre píxeles en punto flotante.
- **Sin multiplicación-suma fusionada (fused multiply-add).** `x * y + z` calculado como una sola instrucción se redondea una vez en lugar de dos y puede cambiar el último bit. Rust nunca fusiona por su cuenta, el código de Go redondea cada producto con una conversión explícita `float64(...)`, y el código de C++ se compila con `-ffp-contract=off`. Por eso los tres lenguajes producen el mismo checksum.

Las pruebas verifican la igualdad para 1, 2, 3, 4 y 8 trabajadores con ambas planificaciones, y las tres suites de pruebas verifican el mismo checksum de referencia. El script del reporte se niega a producir una tabla cuando alguna fila del benchmark imprime un checksum distinto.

## Qué añade cada lenguaje

| Lenguaje | Trabajadores | Qué tiene de específico |
| --- | --- | --- |
| Rust | `std::thread::scope` | El compilador exige una prueba de que los trabajadores escriben memoria disjunta: la imagen se corta con `split_at_mut` y `chunks_mut`, y la planificación dinámica reparte bloques desde una cola detrás de un `Mutex` |
| Go | goroutines con `sync.WaitGroup` | Los trabajadores escriben partes disjuntas de un mismo slice. Nada en el lenguaje lo comprueba, así que las pruebas corren bajo el detector de condiciones de carrera (`go test -race`) |
| C++ | `std::thread` y `join` | La misma estructura que Go con `std::atomic`. La corrección se apoya en la misma disciplina, sin verificador en la ejecución de las pruebas |

No se usa ninguna dependencia externa en ninguno de los tres: la lección es el mecanismo, y una biblioteca como rayon lo escondería.

## Medir

```sh
bun run bench -- --project projects/parallelism/scaling-by-cores
docker compose -f projects/parallelism/scaling-by-cores/docker-compose.yml --profile report run --rm report
```

El primer comando ejecuta cada implementación con 1, 2, 4 y 8 trabajadores dentro de las imágenes fijadas de cada lenguaje, sin red, y hyperfine mide cada proceso varias veces. El segundo deriva el speed-up, la eficiencia y el ajuste de Amdahl, y escribe `results/scaling.md`.

Dos decisiones sobre los números:

- **Base.** El speed-up se calcula contra la implementación secuencial. El código paralelo con un trabajador también está en la tabla, así que el costo de la propia maquinaria paralela es visible.
- **Mejor ejecución y media.** Otra carga en la máquina solo puede hacer más lenta una ejecución. Por eso el speed-up se calcula entre las ejecuciones más rápidas, y la media con su desviación estándar se imprime al lado para mostrar el ruido.

## Resultados

Medido el 2026-10-07 en un AMD Ryzen 7 5700X3D (8 núcleos físicos, 16 lógicos), Docker Desktop en Windows con 16 CPU, `n` = 9,000,000 (primos hasta 9,000,000 y una imagen de 3000 x 3000), 5 ejecuciones por fila después de 1 de calentamiento. Máquina, versiones de los runtimes y comandos exactos: [results/results.md](../../../projects/parallelism/scaling-by-cores/results/results.md). Todas las filas, con media, desviación estándar, mejor ejecución y fracción serial: [results/scaling.md](../../../projects/parallelism/scaling-by-cores/results/scaling.md).

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

1. **Desbalance de carga.** Es el efecto grande, y las filas de Mandelbrot estático lo aíslan. Con 2 trabajadores la imagen se corta por su eje de simetría, las dos mitades cuestan lo mismo, y el speed-up llega a 1.8 en C++ y 2.0 en Go (1.5 en Rust, una fila con ruido). Con 4 trabajadores los dos bloques del medio concentran la mayor parte de los puntos dentro del conjunto, los dos trabajadores de los extremos terminan antes y esperan, y el speed-up se queda en cerca de 1.9. La ley de Amdahl lee el tiempo ocioso como código serial: una s cercana al 30% para un programa que no tiene ese código. La planificación dinámica elimina el desbalance y la s cae por debajo del 7%. La fracción serial por fila en `projects/parallelism/scaling-by-cores/results/scaling.md` (Karp-Flatt) también lo muestra: salta de una cantidad de trabajadores a la siguiente en lugar de mantenerse constante, señal de sobrecarga y no de código serial.
2. **La maquinaria paralela.** El código paralelo con 1 trabajador es más lento que el código secuencial en todas las filas (speed-up entre 0.75 y 0.98): los hilos, el contador compartido, la cola y la mezcla de los parciales no son gratis.
3. **Los núcleos no están todos libres ni son todos iguales.** 8 trabajadores necesitan los 8 núcleos físicos de esta CPU, que también ejecutan el sistema operativo, Docker y, durante esta medición, otros contenedores. Un trabajador que pierde su núcleo por un instante retrasa el join. Además, una CPU suele ejecutar un solo núcleo ocupado a un reloj más alto que ocho, algo que este benchmark no aísla.
4. **Código realmente serial.** Pequeño aquí, pero es la única parte que ninguna cantidad de núcleos elimina.

La lectura práctica: antes de culpar a la ley de Amdahl, comprueba que todos los trabajadores estén ocupados hasta el final. Aquí ese único cambio, de estático a dinámico, lleva el speed-up de Mandelbrot con 8 trabajadores de cerca de 2.7 a cerca de 5.7.

## Hacia dónde seguir

- Quiz: área `parallelism`, temas `amdahl-gustafson`, `speedup-efficiency-scalability`, `data-vs-task-parallelism`, `fork-join-work-stealing`, `parallel-sorting-reductions`, `determinism-reproducibility`, `false-sharing-cache-effects`, `shared-vs-distributed-memory` y `map-reduce-patterns`.
- Capítulos de referencia: Tanenbaum y Bos, Modern Operating Systems, capítulo 8 (sistemas con múltiples procesadores); Aho, Lam, Sethi y Ullman, Compilers, capítulo 11 (optimización para el paralelismo y la localidad).
