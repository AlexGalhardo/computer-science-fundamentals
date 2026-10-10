# Multiplicación de matrices amigable con el caché (MP-PERF-3)

> English version: [docs/en/performance/cache-friendly-matrix.md](../../en/performance/cache-friendly-matrix.md) · Versão em português: [docs/pt/performance/cache-friendly-matrix.md](../../pt/performance/cache-friendly-matrix.md)

Miniproyecto: [`projects/performance/cache-friendly-matrix`](../../../projects/performance/cache-friendly-matrix/README.es.md). Temas del quiz: `cpu-cache-locality`, `benchmarking-methodology`.

## El mismo Big O, distinta velocidad

Multiplicar dos matrices `n × n` con tres bucles anidados es `O(n³)` sea cual sea el orden de los bucles. El Big O cuenta operaciones y supone que cada acceso a memoria cuesta lo mismo. En un procesador real no es así: un valor en el caché L1 llega en cerca de un nanosegundo, un valor en la memoria principal en cerca de cien. El orden de los bucles decide por cuál de los dos pagas.

## La jerarquía de memoria y la línea de caché

```text
registers   <  L1 (tens of KiB)  <  L2 (hundreds of KiB)  <  L3 (MiB)  <  RAM (GiB)
fastest, smallest                                              slowest, largest
```

El caché no guarda valores sueltos. Guarda **líneas** de 64 bytes, así que leer un `double` trae a sus 7 vecinos gratis. Los programas que usan a los vecinos a continuación (localidad espacial) o que vuelven a usar los mismos datos pronto (localidad temporal) corren casi siempre desde el caché.

Una matriz se almacena por filas (row-major): el elemento `(i, j)` está en el índice `i × n + j`.

```text
row walk:     a[i][0] a[i][1] a[i][2] ... 8 elements per cache line, 1 miss in 8
column walk:  b[0][j]            one element per line
              b[1][j]            n × 8 bytes further on
              b[2][j]            a miss on every element once the column outgrows the cache
```

## Las tres variantes

| Variante | Bucles | El bucle interno recorre | Localidad |
| --- | --- | --- | --- |
| `naive` | i, j, k | una fila de A y una **columna** de B | mala: una línea de B por elemento |
| `interchanged` | i, k, j | una fila de B y una fila de C | espacial: contiguo, prebuscado, vectorizado |
| `blocked-B` | mosaicos de `B × B`, luego i, k, j | trozos de filas dentro de un mosaico | espacial y temporal: el mosaico se queda en el caché |

El intercambio de bucles no cambia nada salvo el orden de dos líneas `for`. El blocking agrega tres bucles externos que eligen un mosaico. Dentro de un mosaico el código toca `B²` elementos de cada una de las tres matrices, `3 × B² × 8` bytes: 24 KiB para `B = 32` (cabe en un L1 de 32 KiB) y 96 KiB para `B = 64` (cabe en L2).

Para cada elemento del resultado, las tres variantes suman los mismos productos en el mismo orden de `k`, así que los resultados son idénticos bit a bit. Aun así las pruebas comparan con una tolerancia, porque ese es el contrato honesto del código de punto flotante, y el build de C++ usa `-ffp-contract=off` para que el compilador no pueda fusionar una multiplicación y una suma en los procesadores que tienen tal instrucción.

## Resultados medidos

La rejilla completa está en [`results/results.md`](../../../projects/performance/cache-friendly-matrix/results/results.md), y las tablas con comentarios están en el [README](../../../projects/performance/cache-friendly-matrix/README.es.md#resultados). La máquina tiene 32 KiB de caché L1 de datos y 512 KiB de L2 por núcleo, 96 MiB de L3 y líneas de 64 bytes, y se compartió con otros programas.

- **Ingenua contra por bloques, `n = 1500`**: `blocked-64` fue 3.5 veces más rápida en C++ (5524 ms contra 1566 ms) y 19.6 veces en Rust (26648 ms contra 1360 ms) en el benchmark versionado. La demostración `speedup`, ejecutada dos veces, dio 3.3 y 8.8 veces en C++ y 5.5 y 9.0 veces en Rust. Siempre más de 2 veces, nunca el mismo factor dos veces: la variante ingenua está limitada por la memoria y su tiempo se movió entre 4.6 s y 30 s según la carga de la máquina.
- **Línea de caché**: el bucle interno ingenuo lee `n` elementos de B que están a `n × 8` bytes unos de otros, así que usa un valor de cada línea de 64 bytes que trae y desperdicia los otros siete. El bucle intercambiado usa los ocho.
- **Tamaño del bloque**: en el barrido, los mejores bloques fueron de 32 a 128, con conjuntos de trabajo de 24 KiB a 384 KiB, dentro de L1 o L2. `B = 8` fue el más lento (muy poco trabajo por mosaico), y `B = 256` y `512`, cuyos conjuntos de trabajo de 1.5 MiB y 6 MiB ya no caben en los 512 KiB de L2, fueron más lentos aún.
- **Por bloques contra intercambiada**: sin un ganador claro en esta máquina. Con 96 MiB de L3 las tres matrices (54 MiB) se quedan en el último nivel de caché, donde los bucles intercambiados las recorren de corrido. Se espera que el blocking importe más en un procesador con un caché de último nivel menor o con matrices más grandes. Eso no se midió aquí.
- **Fallos por conflicto**: la variante ingenua es más de tres veces más lenta con `n = 1024` que con `n = 1000`. Un paso de columna de 8192 bytes es múltiplo de los 4096 bytes que cubre una vía del caché L1, así que toda la columna se mapea a un conjunto de 8 líneas.

## Método

- La misma entrada generada en ambos lenguajes (un generador de semilla fija), y un checksum impreso con cada resultado: 844274790.842 con `n = 1500` para cada variante en ambos lenguajes.
- C++ con `-O3` y Rust en modo release, que son niveles equivalentes. Con `-O2` GCC no vectoriza el bucle intercambiado y la comparación entre lenguajes sería injusta.
- El runner de benchmark repite cada proceso 3 veces después de 1 de calentamiento e informa media, desviación estándar y rango. Los tamaños pequeños repiten la multiplicación 5 veces dentro del proceso e informan la mediana.
- La máquina era compartida, y la dispersión es grande. Una diferencia menor que la dispersión no se informa como diferencia.

## Criterios de aceptación

| Elemento | Cómo se verifica |
| --- | --- |
| MP-PERF-3.1 las tres dan la misma matriz dentro de la tolerancia de punto flotante | `docker compose run --rm cpp-test` y `rust-test` (tolerancia `1e-9 × n`, ocho tamaños, seis tamaños de bloque) |
| MP-PERF-3.2 por bloques al menos 2 veces más rápida que la ingenua en el mayor tamaño | `docker compose run --rm cpp-speedup` y `rust-speedup` (terminan con error por debajo de 2 veces, `n = 1500`), y las filas `n = 1500` de `results/results.md` |
| MP-PERF-3.3 el README relaciona el resultado con la línea de caché y el tamaño de bloque | "Resultados" y "Tamaño del bloque" en el README |

## Ejecutar

```sh
cd projects/performance/cache-friendly-matrix
./setup-unix-cache-friendly-matrix.sh      # pruebas
docker compose run --rm cpp-speedup        # demostración
```
