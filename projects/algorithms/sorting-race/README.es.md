# sorting-race

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Seis algoritmos de ordenación (bubble, insertion, merge, quick, heap y radix), escritos desde cero en siete lenguajes, ordenan los mismos archivos de entrada. La carrera muestra dos cosas a la vez: cómo el tiempo medido de cada algoritmo sigue su Big O cuando `n` crece, y cuánto del tiempo pertenece al lenguaje y no al algoritmo.

Ítem del plan: MP-ALG-1. Texto completo: [docs/es/algorithms/sorting-race.md](../../../docs/es/algorithms/sorting-race.md).

## Qué enseña

- Un algoritmo cuadrático pierde contra uno `n log n` en cualquier lenguaje cuando `n` es suficientemente grande: el bubble sort en C++ es más lento que el merge sort en Python mucho antes de 10^5 valores.
- El orden de la entrada importa para algunos algoritmos y para otros no. El insertion sort y el bubble sort son lineales con entrada ordenada, al heapsort y al merge sort les da igual.
- Duplicar `n` multiplica el tiempo del merge sort por cerca de 2.1, y el del bubble sort por cerca de 4. Esa prueba de duplicación es como un benchmark revela el orden de crecimiento.
- El radix sort supera a los ordenamientos por comparación con enteros de ancho fijo porque nunca compara dos valores.
- En Elixir la lección cambia: con listas enlazadas inmutables no hay intercambio ni índice, así que el heapsort se convierte en un leftist heap y el quicksort construye listas nuevas.

## Temas del quiz que demuestra

Área `algorithms`:

- `elementary-sorts` (bubble e insertion sort, inversiones, mejor y peor caso)
- `merge-sort` (paso de mezcla, estabilidad, la prueba de duplicación)
- `quicksort` (partición, mediana de tres)
- `heapsort` (heap en un arreglo, sift-down, ordenación in situ)
- `linear-time-sorts` (LSD radix sort y el paso de conteo estable)
- `sorting-properties` (algoritmos estables, in situ y adaptativos)

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-sorting-race.sh        # Linux y macOS
./setup-windows-sorting-race.ps1    # Windows
```

El script construye una imagen fijada por lenguaje y ejecuta las pruebas de los siete.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/` | Implementación de referencia, un archivo por algoritmo, más el generador de entradas (`generate.ts`), la entrada del benchmark (`bench.ts`) y el verificador de resultados (`check-results.ts`) |
| `cpp/`, `python/`, `java/`, `elixir/`, `rust/`, `go/` | Los mismos seis algoritmos, una entrada de benchmark y los mismos casos de prueba |
| `data/` | Archivos de entrada generados, un entero por línea. No se versionan |
| `bench.json` | Cuadrícula del benchmark leída por el runner del repositorio |
| `results/` | Resultados versionados del benchmark (`results.md`, `results.json`, `results.js`) |
| `dashboard/` | Página estática que grafica `results/results.js` |

Cada algoritmo es una función pura: recibe los valores y devuelve una nueva secuencia ordenada. Ninguna implementación llama a un ordenamiento de biblioteca. Los valores son enteros de 0 a 2^31 - 1, el rango para el que está escrito el radix sort.

## Pruebas

```sh
docker compose run --rm ts-test       # o cpp-test, python-test, java-test, elixir-test, rust-test, go-test
```

Cada lenguaje ejecuta los mismos seis casos para cada algoritmo: vacío, un solo elemento, ordenado, invertido, con duplicados y aleatorio (1,000 valores de una semilla fija). La referencia en TypeScript también ejecuta una prueba de propiedades sobre 200 arreglos aleatorios, comprobando que la salida esté ordenada y sea una permutación de la entrada.

Los formateadores y linters (clang-format, ruff, mix format, rustfmt y clippy, gofmt y golangci-lint, javac `-Xlint:all` y Spotless) se ejecutan en las imágenes base de [docs/es/environment.md](../../../docs/es/environment.md):

```sh
./lint.sh          # comprobar
./lint.sh --fix    # reescribir
bunx biome check projects/algorithms/sorting-race    # TypeScript, desde la raíz del repositorio
```

## Benchmark

Un comando, desde la raíz del repositorio:

```sh
bun run bench -- --project projects/algorithms/sorting-race
```

Genera los archivos de entrada (semilla fija, formas `random`, `sorted` y `reversed`), compila cada lenguaje, ejecuta cada algoritmo sobre los archivos aleatorios dentro de un contenedor sin red, y escribe `results/`. Después comprueba las dos afirmaciones del benchmark e imprime la tabla de formas de entrada:

```sh
cd projects/algorithms/sorting-race
docker run --rm --network none -v "$PWD:/app" -w /app oven/bun:1.4.2 bun run ts/src/check-results.ts
docker run --rm --network none -v "$PWD:/app" -w /app oven/bun:1.4.2 bun run ts/src/shapes.ts 10000
```

El verificador falla a menos que cada implementación haya impreso el mismo checksum para el mismo archivo de entrada (182 filas, 7 lenguajes, 5 archivos en la ejecución versionada) y que el merge sort se haya mantenido dentro de su límite de duplicación. La salida versionada del script de formas es `results/shapes.md`.

### Límites

| Límite | Valor | Por qué |
| --- | --- | --- |
| Algoritmos cuadráticos (bubble, insertion) | `n` hasta 10,000 | Con 100,000 una sola ejecución tarda minutos en Python y Elixir |
| Tamaños del benchmark | 1,000, 2,000, 10,000, 100,000 y 200,000 | Dos pares de duplicación: 1,000 a 2,000 para los algoritmos cuadráticos y 100,000 a 200,000 para el resto |
| Forma del benchmark | solo `random`, en los siete lenguajes | Correr las tres formas en siete lenguajes son 546 filas. Las formas se comparan en un lenguaje con `shapes.ts` |
| Generador de entradas | tres formas, hasta 1,000,000 | `bun run ts/src/generate.ts 1000000` escribe los archivos de 10^6. Añade tamaños y formas a `bench.json` para correrlos |
| Ejecuciones | 3 ejecuciones medidas tras 1 de calentamiento, por fila | La tabla informa la media y la desviación estándar del proceso completo |
| Tramo medido | la más rápida de hasta 5 ordenaciones dentro del programa, mientras el total se mantenga por debajo de 300 ms | El mínimo es el valor menos perturbado por otros programas en la máquina |

La ejecución versionada tiene 182 filas y tardó unos 16 minutos en la máquina registrada en `results/results.md`, que en ese momento se compartía con otras cargas. La mayor parte es el arranque de contenedores, uno a la vez.

### Qué muestran los resultados versionados

Tramo medido (solo la ordenación), entrada aleatoria, en milisegundos:

| n | algoritmo | C++ | Rust | Go | Java | TypeScript | Python | Elixir |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10,000 | bubble | 69.0 | 108 | 63.6 | 82.1 | 252 | 7,319 | 1,205 |
| 10,000 | insertion | 12.8 | 23.4 | 18.3 | 12.1 | 104 | 4,317 | 562 |
| 10,000 | merge | 0.60 | 0.65 | 0.63 | 1.32 | 1.55 | 32.7 | 2.94 |
| 200,000 | merge | 18.1 | 14.2 | 21.5 | 24.3 | 47.1 | 1,121 | 211 |
| 200,000 | heap | 22.3 | 20.4 | 20.7 | 29.9 | 48.5 | 1,294 | 758 |

- El algoritmo pesa más que el lenguaje: con 10,000 valores, el merge sort en Python (32.7 ms) es el doble de rápido que el bubble sort en C++ (69.0 ms), y la brecha crece con `n`.
- Duplicar `n` de 100,000 a 200,000 multiplicó el tiempo del merge sort por 1.76 (C++), 1.81 (Rust), 1.82 (Go), 1.93 (Python), 2.37 (TypeScript) y 2.45 (Java), todos por debajo del límite de 2.5 y lejos del 4 de un algoritmo cuadrático.
- Elixir es la excepción: 3.51 en la ejecución versionada, y entre 2.1 y 2.6 en una ejecución aparte, tranquila. Ordena listas enlazadas inmutables, así que su tiempo incluye al recolector de basura copiando datos vivos. El verificador le da el límite 4, suficiente para mostrar que el crecimiento no es cuadrático. Los pares que toman menos de 1 ms (1,000 a 2,000 valores) se imprimen pero no se juzgan, porque el ruido del reloj es mayor que la medición.
- Forma de la entrada, TypeScript, 10,000 valores (`results/shapes.md`): el bubble sort tarda 220 ms con entrada aleatoria y 0.13 ms con entrada ordenada, el insertion sort 126 ms y 0.36 ms. El heap sort y el radix sort se mantienen en los mismos pocos milisegundos en todas las formas.

Los tiempos en una máquina compartida son ruidosos: lee la dispersión en `results/results.md` antes de comparar dos números cercanos.

### Cómo leer los resultados

`results/results.md` tiene dos tiempos por fila. `process` es el programa completo medido por hyperfine, incluido el arranque del runtime y la lectura del archivo. `section` es solo la llamada a la ordenación, cronometrada por el propio programa. Usa `section` para comparar algoritmos y `process` para ver lo que esperaría un usuario.

### Dashboard

Abre `dashboard/index.html` en un navegador, directamente desde el disco. Carga el `results/results.js` versionado con una etiqueta `<script>` y no hace ninguna petición de red. El gráfico muestra el tiempo contra `n` en ejes log-log, una línea por algoritmo, con selectores de lenguaje, forma de entrada y métrica. En ejes log-log un algoritmo cuadrático es una recta de pendiente 2 y uno `n log n` es una recta de pendiente un poco mayor que 1.
