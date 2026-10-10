# travelling-salesman

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cuatro maneras de resolver el problema del viajante de comercio (visitar cada ciudad una vez y volver al inicio con el recorrido más corto): fuerza bruta sobre todos los órdenes, programación dinámica sobre subconjuntos (Held-Karp), la heurística voraz del vecino más cercano y la búsqueda local 2-opt. El proyecto muestra dónde la búsqueda exhaustiva deja de ser utilizable, hasta dónde empuja ese muro un algoritmo exacto mejor, y a qué renuncia una heurística para responder al instante.

Ítem del plan: MP-ALG-3. Lenguajes: TypeScript (referencia) y Rust. Texto completo: [docs/es/algorithms/travelling-salesman.md](../../../docs/es/algorithms/travelling-salesman.md).

## Qué enseña

- La fuerza bruta prueba `(n - 1)!` órdenes. Cada ciudad extra multiplica el trabajo por el número de ciudades, así que el muro es repentino: cómodo con 11 ciudades, desesperado con 14.
- Held-Karp reutiliza subproblemas ("qué ciudades se visitaron y dónde termina el camino") y cuesta `O(n² · 2^n)`: exponencial, pero 20 ciudades toman un instante. Su límite es la memoria, `O(n · 2^n)`.
- Un lenguaje más rápido mueve el muro de la fuerza bruta cerca de una ciudad. Un algoritmo mejor lo mueve diez.
- El vecino más cercano y el 2-opt responden en microsegundos para tamaños que ningún método exacto puede tocar, sin garantía de optimalidad.

## Temas del quiz que demuestra

Área `algorithms`:

- `backtracking` (fuerza bruta sobre permutaciones, crecimiento factorial, poda con una cota)
- `dynamic-programming` (Held-Karp es tabulación sobre subconjuntos)
- `greedy` (el vecino más cercano como heurística voraz sin garantía)

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-travelling-salesman.sh        # Linux y macOS
./setup-windows-travelling-salesman.ps1    # Windows
```

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/instance.ts` | Ciudades aleatorias a partir de una semilla fija, matriz de distancias entera, validación del recorrido |
| `ts/src/brute-force.ts`, `held-karp.ts` | Los dos solucionadores exactos |
| `ts/src/heuristics.ts` | Vecino más cercano y 2-opt |
| `ts/src/demo.ts`, `ts/src/bench.ts` | Tabla de brecha de las heurísticas y entrada del benchmark |
| `rust/src/lib.rs`, `rust/src/main.rs` | Los mismos cuatro solucionadores y la entrada del benchmark en Rust |
| `bench.json`, `results/` | Cuadrícula del benchmark y resultados versionados |
| `dashboard/` | Página estática que grafica `results/results.js` |

Las ciudades son puntos aleatorios en una cuadrícula de 1000 por 1000. Las distancias son euclidianas, redondeadas a enteros, así que las longitudes de los recorridos son exactas y ambos lenguajes se pueden comparar con igualdad simple.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

- La fuerza bruta y Held-Karp devuelven un recorrido de la misma longitud óptima en cada instancia probada de hasta 10 ciudades (20 instancias por tamaño hasta 8 ciudades, 4 para 9 y 10), y se comprueba que cada recorrido sea una permutación válida con esa longitud. El orden de visita en sí puede diferir por la dirección o cuando dos recorridos empatan.
- Las heurísticas se mantienen dentro de los factores documentados en 64 instancias de 5 a 12 ciudades.
- Las pruebas de Rust también verifican longitudes de recorrido impresas por la referencia en TypeScript, lo que prueba que ambos lenguajes construyen las mismas instancias.

Formateadores y linters:

```sh
./lint.sh                                                    # rustfmt y clippy, en la imagen base de Rust
bunx biome check projects/algorithms/travelling-salesman     # TypeScript, desde la raíz del repositorio
```

## Heurísticas frente al óptimo

```sh
docker compose run --rm demo
```

Razón entre el recorrido de cada heurística y el recorrido óptimo (1.000 significa óptimo), 8 instancias aleatorias por tamaño:

| ciudades | instancias | vecino más cercano: media | peor | 2-opt: media | peor | 2-opt óptimo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 5 | 8 | 1.029 | 1.141 | 1.000 | 1.000 | 8 de 8 |
| 6 | 8 | 1.059 | 1.150 | 1.000 | 1.000 | 8 de 8 |
| 7 | 8 | 1.071 | 1.172 | 1.006 | 1.047 | 7 de 8 |
| 8 | 8 | 1.093 | 1.210 | 1.007 | 1.055 | 6 de 8 |
| 9 | 8 | 1.070 | 1.158 | 1.016 | 1.056 | 5 de 8 |
| 10 | 8 | 1.103 | 1.235 | 1.001 | 1.010 | 7 de 8 |
| 11 | 8 | 1.097 | 1.160 | 1.014 | 1.040 | 3 de 8 |
| 12 | 8 | 1.137 | 1.326 | 1.005 | 1.022 | 5 de 8 |
| todas | 64 | 1.082 | 1.326 | 1.006 | 1.056 | 49 de 64 |

Factores documentados, exigidos por las pruebas en instancias de hasta 12 ciudades: el vecino más cercano como máximo **1.6** veces el óptimo, el 2-opt (iniciado desde el recorrido del vecino más cercano) como máximo **1.2** veces. Son cotas medidas para esta familia de instancias aleatorias, no garantías teóricas: en instancias arbitrarias el vecino más cercano no tiene un factor constante.

## Benchmark

```sh
bun run bench -- --project projects/algorithms/travelling-salesman
```

La cuadrícula ejecuta los cuatro solucionadores con 6, 8, 10, 11, 12, 13, 14, 16, 18, 20 y 100 ciudades en ambos lenguajes y escribe `results/`. Abre `dashboard/index.html` desde el disco para ver el gráfico.

Límites:

| Límite | Valor | Por qué |
| --- | --- | --- |
| Plazo de la fuerza bruta | 12 segundos, después la fila informa `timeout` como su checksum | 14 ciudades tardarían minutos y 16 ciudades días |
| Tamaños de la fuerza bruta | hasta 14 ciudades | El tamaño posterior al primer timeout no aporta nada |
| Tamaños de Held-Karp | hasta 20 ciudades en la cuadrícula, 22 en el código | La tabla tiene `n · 2^n` entradas |
| Ejecuciones | 3 ejecuciones medidas, sin calentamiento, por fila | Mantiene las filas que alcanzan el plazo por debajo de un minuto cada una |

### Dónde la fuerza bruta supera los 10 segundos

Tramo medido en milisegundos, del `results/results.md` versionado (78 filas, unos 5 minutos):

| Ciudades | Fuerza bruta, TypeScript | Fuerza bruta, Rust | Held-Karp, TypeScript | Held-Karp, Rust |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 13.1 | 6.81 | 3.63 | 0.09 |
| 11 | 202 | 70.9 | 3.79 | 0.25 |
| 12 | 1,709 | 765 | 4.58 | 0.59 |
| 13 | **timeout (más de 12,000)** | 7,351 | 5.69 | 1.37 |
| 14 | timeout | **timeout (más de 12,000)** | 9.38 | 3.10 |
| 20 | no se ejecutó | no se ejecutó | 569 | 437 |

- **TypeScript: la fuerza bruta supera los 10 segundos con 13 ciudades.**
- **Rust: la fuerza bruta supera los 10 segundos con 14 ciudades** (13 ciudades toman 7.4 segundos).
- Rust es de 2 a 3 veces más rápido y gana exactamente una ciudad. Held-Karp resuelve 20 ciudades en cerca de medio segundo en cualquiera de los dos lenguajes.
- Las heurísticas toman menos de 2 ms para 100 ciudades en TypeScript y 0.05 ms en Rust.
- Dondequiera que la fuerza bruta terminó, imprimió la misma longitud de recorrido que Held-Karp, y ambos lenguajes imprimieron las mismas longitudes para los cuatro solucionadores.
