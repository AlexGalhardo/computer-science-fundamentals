# Ordenación externa

> English version: [docs/en/file-systems/external-sorting.md](../../en/file-systems/external-sorting.md) · Versão em português: [docs/pt/file-systems/external-sorting.md](../../pt/file-systems/external-sorting.md)

Mini-proyecto: [projects/file-systems/external-sorting](../../../projects/file-systems/external-sorting). Lenguajes: Rust, Go. Tema del quiz: `file-systems` / `external-sorting`.

## El problema

Ordenar en memoria supone que los datos caben en memoria. Cuando el archivo es más grande, las dos salidas fáciles fallan. Cargarlo de todos modos termina con el proceso matado, o con la máquina haciendo swap. Ordenar el archivo en el sitio, con un algoritmo que salta de un lado a otro dentro de él, convierte cada comparación en un acceso a disco, y un acceso a disco cuesta unas cien mil veces más que un acceso a memoria.

La ordenación externa por mezcla cumple dos promesas: el uso de memoria no depende del tamaño del archivo, y cada archivo se lee y se escribe en secuencia.

## Fase 1: generación de runs

```text
archivo de entrada: [ ....... 320 MiB, en cualquier orden ....... ]
                       |          |          |               |
                    lee 8 MiB  lee 8 MiB  lee 8 MiB  ...  lee el resto
                    ordena     ordena     ordena           ordena
                    escribe    escribe    escribe          escribe
                       v          v          v               v
runs:               run-0      run-1      run-2      ...   run-40   (cada una ordenada)
```

Un buffer del tamaño de una run es el único trozo grande de memoria. Se llena desde el archivo, las líneas dentro de él se ordenan y se escriben como una **run**, un archivo ordenado. Las líneas no se mueven para ordenarlas: el programa ordena un índice de pares (inicio, longitud) que apuntan dentro del buffer, a 8 bytes por línea. Una línea cortada por el final del buffer se lleva al comienzo del siguiente.

Número de runs = techo(tamaño del archivo / tamaño de la run), una más o una menos, porque el buffer nunca termina en medio de una línea.

## Fase 2: mezcla de k vías con heap

```text
run-0:  apple  fig    pear  ...        heap de números de runs, ordenado
run-1:  banana grape  plum  ...   -->  por la línea actual de cada run   -->  salida
run-2:  cherry kiwi   lime  ...        (cima = menor línea actual)
```

Cada run se lee de principio a fin por su propio buffer, y solo una línea de cada run está en memoria. Un **min-heap** tiene una entrada por run. La cima es la run cuya línea actual es la menor: esa línea va a la salida, se lee la siguiente línea de la misma run, y la entrada desciende hasta su lugar. Cada línea cuesta unas log2(k) comparaciones, en lugar de las k - 1 de mirar todas las runs. Cuando dos líneas son iguales, sale primero la de la run de menor número, lo que mantiene la mezcla estable.

## Varias pasadas

La mezcla lee como máximo `fan-in` runs a la vez. Con más runs que eso, una pasada junta grupos de `fan-in` runs en runs más largas, y la pasada siguiente junta esas:

```text
41 runs, fan-in 8:   41  -->  6  -->  1        2 pasadas de mezcla
48 runs, fan-in 2:   48 -> 24 -> 12 -> 6 -> 3 -> 2 -> 1      6 pasadas de mezcla
```

Pasadas = techo(log en base fan-in del número de runs). Cada pasada lee y escribe cada línea una vez, así que el número de pasadas es el costo real de una configuración.

## Las dos perillas

| Perilla | Mayor significa | Precio |
| --- | --- | --- |
| tamaño de la run | menos runs, y por tanto menos pasadas | más memoria, ya que el buffer de runs es la memoria de la fase 1 |
| fan-in | menos pasadas | con un presupuesto de memoria fijo, buffers menores por run, y por tanto más recargas, y en un disco magnético cada recarga es un seek |

En esta implementación cada buffer de mezcla tiene `tamaño de la run / (fan-in + 1)` bytes, con un mínimo de 4 KiB, de modo que la mezcla usa aproximadamente tanta memoria como la generación de runs.

## El límite de memoria

Los servicios `*-limit` de `docker-compose.yml` ejecutan la ordenación en un contenedor con `mem_limit: 32m` y `memswap_limit: 32m`: 32 MiB de memoria y ningún swap. El programa genera un archivo de 320 MiB, diez veces el límite, lo ordena con runs de 8 MiB y un fan-in de 8, comprueba la salida y luego lee su propio **pico de memoria residente** de la línea `VmHWM` de `/proc/self/status`. Termina con error a menos que el pico esté por debajo del límite.

| Lenguaje | Runs | Pasadas de mezcla | Pico de memoria residente | Parte del límite |
| --- | ---: | ---: | ---: | ---: |
| Rust | 41 | 2 | 11,2 MiB | 35% |
| Go | 41 | 2 | 19,9 MiB | 62% |

Se demuestra que el límite es real con el experimento contrario: `extsort in-memory-check 32` ordena el mismo archivo cargándolo entero, en el mismo contenedor, y el kernel lo mata (código de salida 137). El script de setup exige ese fallo.

### Qué más cuenta el límite

La primera versión de la demo fue matada mientras todavía escribía el archivo de entrada, cuando su propia memoria estaba por debajo de 1 MiB. Vale la pena conocer la razón. Los bytes entregados al kernel con `write` todavía no están en el disco: esperan en la **caché de páginas** como páginas sucias. El límite de memoria de un contenedor cuenta también esas páginas, y una página sucia no puede descartarse antes de escribirse. Un programa que escribe más rápido que el disco llena el límite con páginas que no son su propia memoria, y lo matan.

La corrección está en el escritor por el que pasa todo archivo de salida: cuando se define un intervalo de sincronización, llama a `fdatasync` cada 4 MiB, lo que acota las páginas sucias que el proceso puede dejar atrás. El intervalo se usa solo en la demo del límite. Por eso esa demo es lenta: el disco marca el ritmo, no la ordenación.

## Cómo se comprueba la salida

- **Archivos pequeños, en las pruebas**: la salida se compara con la lista de líneas de entrada ordenada en memoria. Ser igual a esa lista significa ordenada, y con el mismo multiconjunto de líneas.
- **Archivos grandes, en la demo y el benchmark**: una pasada secuencial por la salida comprueba que cada línea es mayor o igual que la anterior, y compara la cuenta de líneas y un checksum con los de la entrada. El checksum es la suma y el o exclusivo de un hash de 64 bits de cada línea, así que no depende del orden de las líneas y necesita memoria O(1). El generador lo calcula para la entrada mientras escribe.

Ambos lenguajes generan el mismo archivo a partir de la misma semilla, y una prueba en cada uno verifica el mismo checksum.

## Qué demuestran las pruebas

| Ítem del plan | Cómo se verifica |
| --- | --- |
| MP-FS-2.1 pico de memoria bajo el límite con un archivo 10 veces mayor | `docker compose run --rm rust-limit` y `go-limit`: límite del contenedor de 32 MiB sin swap, archivo de 320 MiB, pico de memoria residente de 11,2 MiB y 19,9 MiB leído de `VmHWM`, y la ordenación en memoria matada bajo el mismo límite |
| MP-FS-2.2 salida ordenada, mismo multiconjunto de líneas | 112 combinaciones de entrada, tamaño de run y fan-in en cada lenguaje, cada una igual a la ordenación en memoria |
| MP-FS-2.3 tabla del tiempo total por configuración | `bun run bench -- --project external-sorting`, versionada en `results/results.md` |

## Resultados

Proceso entero, media ± desviación estándar en milisegundos sobre 7 ejecuciones, para 1.000.000 de líneas (50 MB). Entre paréntesis, el número de pasadas de mezcla.

| Lenguaje | Tamaño de la run | Runs | Fan-in 2 | Fan-in 4 | Fan-in 16 | Fan-in 64 | Pico de memoria (KiB) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rust | 1 MiB | 48 | 971 ± 379 (6) | 669 ± 221 (3) | 496 ± 20 (2) | 588 ± 119 (1) | 3.416 a 3.516 |
| Rust | 4 MiB | 12 | 979 ± 219 (4) | 619 ± 315 (2) | 389 ± 10 (1) | 538 ± 123 (1) | 7.080 a 7.584 |
| Rust | 16 MiB | 3 | 833 ± 286 (2) | 606 ± 304 (1) | 432 ± 37 (1) | 693 ± 646 (1) | 21.252 a 21.304 |
| Go | 1 MiB | 48 | 820 ± 39 (6) | 611 ± 21 (3) | 572 ± 14 (2) | 814 ± 96 (1) | 6.536 a 7.476 |
| Go | 4 MiB | 12 | 877 ± 71 (4) | 564 ± 36 (2) | 509 ± 23 (1) | 730 ± 96 (1) | 10.652 a 15.468 |
| Go | 16 MiB | 3 | 893 ± 92 (2) | 618 ± 34 (1) | 701 ± 87 (1) | 899 ± 319 (1) | 32.356 a 35.672 |

Medido el 2026-10-08 en un AMD Ryzen 7 5700X3D con Docker Desktop (WSL2), mientras otras cargas usaban la misma máquina.

- **El fan-in 2 es la columna más lenta en todas las filas menos una**, en ambos lenguajes. Necesita 6, 4 y 2 pasadas de mezcla, y cada pasada lee y escribe otra vez los 50 MB.
- **Menos pasadas compensan hasta cierto punto.** Con runs de 1 MiB, pasar de fan-in 2 a fan-in 16 reduce las pasadas de 6 a 2 y el tiempo un 49% en Rust (971 a 496 ms) y un 30% en Go (820 a 572 ms).
- **El fan-in 64 ahorra una pasada más y no es más rápido.** Con runs de 1 MiB mezcla las 48 runs en una sola pasada, y en Go es más lento que el fan-in 16 (814 ± 96 contra 572 ± 14 ms). El presupuesto de 1 MiB se reparte entre 65 buffers, así que cada run se lee de 16 KiB en 16 KiB.
- **El tamaño de la run fija la memoria**, unos 3,4, 7 y 21 MiB en Rust y 7, 11 a 15 y 32 a 36 MiB en Go. Aquí cambia el tiempo mucho menos que el fan-in, porque un archivo de 50 MB cabe en la caché de páginas y releer una run no cuesta ningún acceso a disco.
- **Cuidado con la dispersión.** Varias celdas de Rust tienen una desviación estándar superior al 30% de la media, porque la máquina estaba compartida. Una diferencia menor que la dispersión no es una diferencia: las columnas de fan-in 4, 16 y 64 no pueden ordenarse solo con las filas de Rust.

## Límites de esta implementación

- Las líneas se comparan como bytes. No hay extracción de claves.
- Las runs salen de ordenar trozos. La selección por reemplazo (replacement selection), que duplica la longitud media de las runs, no está implementada.
- En el SSD usado para el benchmark un seek es casi gratis, así que la penalización de un fan-in muy grande en un disco magnético no aparece.

## Ejecución

```sh
cd projects/file-systems/external-sorting
./setup-unix-external-sorting.sh             # o ./setup-windows-external-sorting.ps1
docker compose run --rm rust-limit           # o go-limit
bun run bench -- --project external-sorting  # desde la raíz del repositorio
```
