# cache-friendly-matrix

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Tres formas de multiplicar dos matrices, en C++ y en Rust: el orden del libro de texto (i-j-k), los mismos bucles intercambiados (i-k-j) y una versión por bloques. Las tres hacen exactamente las mismas `n³` multiplicaciones y sumas y devuelven la misma matriz, bit a bit. La única diferencia es el orden en que se visita la memoria, y solo eso hace que el orden del libro de texto sea varias veces más lento. La lección: el Big O cuenta operaciones, y el procesador también cobra por dónde están los datos.

Elemento del plan: MP-PERF-3. Lenguajes: C++ y Rust. Explicación completa: [docs/es/performance/cache-friendly-matrix.md](../../../docs/es/performance/cache-friendly-matrix.md).

## Qué enseña

- Una matriz almacenada por filas (row-major) tiene filas contiguas y columnas dispersas. Una **línea de caché** es de 64 bytes, es decir, 8 doubles: recorrer una fila cuesta un fallo de caché cada 8 elementos, recorrer una columna cuesta uno por elemento una vez que la columna deja de caber en el caché.
- El **intercambio de bucles** (i-k-j) convierte el recorrido de columna en dos recorridos de fila. Eso es localidad espacial.
- El **blocking** corta el trabajo en mosaicos de `B × B` cuyo conjunto de trabajo (`3 × B² × 8` bytes) cabe en un nivel de caché, de modo que los datos se reutilizan antes de ser expulsados. Eso es localidad temporal.
- Un tamaño que es múltiplo de una potencia de dos puede ser mucho peor que uno un poco menor, porque los elementos de una columna compiten entonces por el mismo conjunto de caché (fallos por conflicto).
- Cómo medirlo sin engañarse: la misma entrada, el mismo nivel de optimización, un checksum que pruebe que las variantes coinciden, varias ejecuciones y la dispersión.

## Resultados

Medido en la máquina descrita en [results/results.md](results/results.md) (AMD Ryzen 7 5700X3D: 32 KiB de caché L1 de datos y 512 KiB de L2 por núcleo, 96 MiB de L3 compartida, líneas de caché de 64 bytes), mientras otros programas la usaban. Los números tienen ruido, y la dispersión es parte del resultado.

Mayor tamaño, `n = 1500` (18 MiB por matriz), proceso completo, media ± desviación estándar de 3 ejecuciones después de 1 de calentamiento, del benchmark versionado:

| Variante | C++ (ms) | Rust (ms) |
| --- | ---: | ---: |
| `naive` (i-j-k) | 5524 ± 755 | 26648 ± 5773 |
| `interchanged` (i-k-j) | 1968 ± 530 | 1575 ± 141 |
| `blocked-32` | 2080 ± 191 | 1757 ± 166 |
| `blocked-64` | 1566 ± 17 | 1360 ± 760 |
| `naive` / `blocked-64` | **3.5 veces** | **19.6 veces** |

La versión por bloques fue al menos 2 veces más rápida que la ingenua en el mayor tamaño en todas las ejecuciones hechas para este proyecto, pero cuánto varió mucho. La demostración `speedup` (mediana de 3 ejecuciones en un proceso) dio 3.3 y 8.8 veces en C++ y 5.5 y 9.0 veces en Rust en dos ocasiones, y el benchmark de arriba dio 3.5 y 19.6. La variante ingenua es la inestable (de 4.6 s a 30 s para el mismo trabajo): está limitada por la memoria, así que es la que más sufre cuando otros programas compiten por el caché L3 compartido y el bus de memoria. La cifra de 26.6 s de Rust es un valor atípico de ese tipo. Lee "varias veces más rápida", no un factor preciso.

Lo que dicen los números, y lo que no dicen:

- **El orden de los bucles importa más que el lenguaje.** En ambos lenguajes el orden ingenuo es el lento, y las dos variantes amigables con el caché están cerca una de otra.
- **El blocking no superó al simple intercambio en esta máquina.** Las diferencias entre `interchanged`, `blocked-32` y `blocked-64` están dentro del ruido. Las tres matrices ocupan 54 MiB y este procesador tiene 96 MiB de L3, así que los bucles intercambiados recorren datos que todavía están en el último nivel de caché, con ayuda del prefetcher. El blocking rinde más cuando las matrices son mayores que el caché de último nivel.
- **1024 frente a 1000.** La variante ingenua tardó 6636 ms con `n = 1024` y 1402 ms con `n = 1000` en C++ (6454 ms y 1930 ms en Rust): 7% más de trabajo, más de tres veces el tiempo. Con `n = 1024` los elementos de una columna están a 8192 bytes uno del otro, un múltiplo de 4096 bytes, así que todos caen en el mismo conjunto del caché L1, que guarda solo 8 líneas por conjunto. Las variantes intercambiada y por bloques no recorren columnas y no se ven afectadas.

### Tamaño del bloque

`docker compose run --rm cpp-sweep` y `rust-sweep`, `n = 1500`, mediana de 3 ejecuciones:

| Bloque `B` | Conjunto de trabajo `3 × B² × 8` bytes | Cabe en | C++ (ms) | Rust (ms) |
| ---: | ---: | --- | ---: | ---: |
| 8 | 1.5 KiB | L1 | 2411 | 1827 |
| 16 | 6 KiB | L1 | 1705 | 1204 |
| 32 | 24 KiB | L1 (32 KiB) | 1330 | 1004 |
| 64 | 96 KiB | L2 | 1349 | 772 |
| 128 | 384 KiB | L2 (512 KiB) | 1352 | 717 |
| 256 | 1.5 MiB | solo L3 | 1682 | 945 |
| 512 | 6 MiB | solo L3 | 1657 | 919 |

La curva es una U. Los bloques muy pequeños pierden tiempo en la sobrecarga del bucle y cortan el bucle interno en trozos demasiado cortos para las instrucciones vectoriales. Los bloques cuyo conjunto de trabajo supera los 512 KiB de L2 pierden la reutilización para la que existe el blocking. Los mejores tamaños de bloque (32 a 128) son aquellos cuyo conjunto de trabajo cabe en L1 o L2. El tamaño de bloque correcto es una propiedad del caché, así que se encuentra midiendo en la máquina de destino.

## Temas del quiz que demuestra

Área `performance`:

- `cpu-cache-locality` (jerarquía de memoria, línea de caché, localidad espacial y temporal, recorrido por filas, intercambio de bucles, blocking)
- `benchmarking-methodology` (calentamiento, varias ejecuciones y su dispersión, checksum contra la eliminación de código muerto y para probar trabajo igual, mismo Big O con distinta velocidad)

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-cache-friendly-matrix.sh        # Linux y macOS
./setup-windows-cache-friendly-matrix.ps1    # Windows
```

El script construye las dos imágenes y ejecuta las pruebas de ambos lenguajes.

## Demostración

```sh
docker compose run --rm cpp-speedup     # las tres variantes con n = 1500, falla por debajo de 2 veces
docker compose run --rm rust-speedup
docker compose run --rm cpp-sweep       # tamaños de bloque de 8 a 512
docker compose run --rm rust-sweep
```

`MATRIX_N=1024 docker compose run --rm cpp-speedup` cambia el tamaño. `speedup` imprime una tabla con el checksum de cada variante y termina con error a menos que la variante por bloques sea al menos 2 veces más rápida que la ingenua y las tres matrices coincidan.

## Benchmark

```sh
bun run bench -- --project cache-friendly-matrix    # desde la raíz del repositorio
```

El runner construye ambos programas, ejecuta cada variante con `n` = 256, 512, 1000, 1024 y 1500 dentro de las imágenes de los lenguajes con hyperfine (3 ejecuciones después de 1 de calentamiento), y escribe `results/results.md`, `results.json` y `results.js`. Tarda unos cinco minutos. `dashboard/index.html` grafica `results/results.js` y funciona al abrirlo desde el disco.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/matrix.hpp` | Las tres multiplicaciones, el generador de entrada y el checksum |
| `cpp/main.cpp` | Entrada del benchmark, `speedup` y `sweep` |
| `cpp/test_matrix.cpp` | Pruebas |
| `rust/src/lib.rs`, `rust/src/main.rs` | Lo mismo en Rust, con las pruebas dentro de `lib.rs` |
| `bench.json`, `results/` | Rejilla del benchmark y resultados versionados |
| `dashboard/` | Página estática que grafica `results/results.js` |

## Pruebas

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- Las tres variantes dan la misma matriz dentro de una tolerancia de `1e-9 × n`, y el mismo checksum, con ocho tamaños y seis tamaños de bloque, incluidos tamaños que el bloque no divide y un bloque mayor que la matriz.
- Un producto conocido de 2 × 2, la multiplicación por la identidad y la misma entrada generada en ambos lenguajes (checksum compartido).
- Con `n = 512` el orden ingenuo debe tardar más de 1.5 veces el tiempo de la variante intercambiada y de la variante por bloques. Es una razón con un margen amplio (se midió de 3 a 8 veces), no un tiempo absoluto.

Los formateadores y linters (clang-format, rustfmt, clippy) corren en las imágenes base de [docs/es/environment.md](../../../docs/es/environment.md):

```sh
./lint.sh          # verificar
./lint.sh --fix    # reescribir
```

## Versiones

| Componente | Versión |
| --- | --- |
| C++ | `gcc:16.2.0-trixie`, `-std=c++23 -O3 -ffp-contract=off` |
| Rust | `rust:1.99.0-slim-trixie`, edition 2024, perfil release, sin dependencias |
| hyperfine | 2.0.0, en la imagen de benchmark del repositorio |
