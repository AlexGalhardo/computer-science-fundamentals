# external-sorting

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cómo ordenar un archivo más grande que la memoria, escrito en Rust y en Go. La generación de runs ordena un trozo del tamaño de la memoria a la vez y lo escribe como una run ordenada, y una mezcla de k vías guiada por un min-heap une las runs, en una pasada o en varias. Un contenedor con 32 MiB de memoria ordena un archivo de 320 MiB, y un benchmark muestra qué hacen el tamaño de la run y el fan-in de la mezcla sobre el tiempo total.

Ítem del plan: MP-FS-2. Explicación completa: [docs/es/file-systems/external-sorting.md](../../../docs/es/file-systems/external-sorting.md).

## Qué enseña

- Una ordenación en memoria necesita memoria proporcional al archivo. Bajo un límite de 32 MiB, cargar un archivo de 320 MiB hace que maten el proceso. La ordenación externa por mezcla usa memoria proporcional al tamaño de la run, sea cual sea el tamaño del archivo.
- La fase 1 lee la entrada una vez y escribe runs. La fase 2 lee las runs en secuencia y escribe la salida. Nada salta de un lado a otro con seeks.
- Un min-heap con una entrada por run da la siguiente línea en unas log2(k) comparaciones, y solo una línea de cada run está en memoria.
- Con más runs que el fan-in, la mezcla toma varias pasadas: techo(log en base fan-in del número de runs). Cada pasada lee y escribe el archivo entero una vez.
- El tamaño de la run y el fan-in son las dos perillas. Runs mayores significan menos runs y más memoria. Un fan-in mayor significa menos pasadas y, con un presupuesto fijo, buffers menores por run.
- Un límite de memoria en un contenedor también cuenta la caché de páginas de los archivos que se están escribiendo, una lección con la que tropezó la demo: véase [results/memory-limit.md](results/memory-limit.md).

## Temas del quiz que demuestra

Área `file-systems`:

- `external-sorting`: las dos fases, número de runs, número de pasadas de mezcla, el heap de la mezcla de k vías, el efecto del fan-in, el volumen de entrada y salida por pasada.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-external-sorting.sh        # Linux y macOS
./setup-windows-external-sorting.ps1    # Windows
```

El script construye una imagen fijada por lenguaje (`rust:1.99.0-slim-trixie`, y `golang:1.27.1-bookworm` con `golangci-lint` v2.14.0), ejecuta la comprobación de formato, el linter y las pruebas en cada una, ejecuta la demo del límite de memoria en ambos lenguajes y comprueba que la ordenación en memoria es matada bajo el mismo límite. Tardó entre 1,5 y 6 minutos en la máquina de los resultados, según qué más estuviera usando el disco, casi todo en la demo del límite de memoria, que escribe unos 1,3 GiB por lenguaje dentro del contenedor y los fuerza a disco. No se instala nada en el host, no hay más dependencia que la biblioteca estándar de cada lenguaje, y todo archivo que crean los programas vive en `/tmp` dentro del contenedor y desaparece con él.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `rust/src/lines.rs`, `go/lines.go` | generador con semilla del archivo de entrada, checksum independiente del orden, el escritor que acota las páginas sucias, la comprobación de un archivo ordenado |
| `rust/src/sorter.rs`, `go/sorter.go` | generación de runs, el min-heap de runs, la mezcla de k vías, el controlador de varias pasadas, y la ordenación en memoria usada como mal ejemplo |
| `rust/src/main.rs`, `go/main.go` | el comando `extsort`: `generate`, `sort`, `bench`, `limit-check`, `in-memory-check` |
| `rust/tests/`, `go/extsort_test.go` | las pruebas |
| `fixtures/checksum-1000.txt` | checksum de las primeras 1.000 líneas generadas, verificado por ambos lenguajes |
| `docker-compose.yml` | servicios de prueba y los dos servicios con el límite de memoria de 32 MiB |
| `bench.json` | grilla de benchmark leída por el runner del repositorio |
| `results/` | resultados versionados: `memory-limit.md`, y `results.md`, `results.json`, `results.js` del runner |
| `dashboard/` | página estática que grafica `results/results.js` |

Ambos lenguajes implementan el mismo algoritmo y el mismo generador (SplitMix64, semilla 20261007), así que ordenan archivos idénticos byte a byte e imprimen el mismo checksum.

## Pruebas

```sh
docker compose run --rm rust-test
docker compose run --rm go-test
```

- **La salida es igual a una ordenación en memoria (MP-FS-2.2)**: 7 entradas (0, 1, 2, 500 y 5.000 líneas, 5.000 líneas con 7 claves distintas, 3.000 líneas con una sola clave) se ordenan con 4 tamaños de run (de 128 bytes a 1 MiB) y 4 fan-ins (2, 3, 8, 64), 112 combinaciones en cada lenguaje. En todas, el archivo de salida es exactamente la lista de líneas de entrada ordenada en memoria, lo que significa ordenada y con el mismo multiconjunto de líneas. El número de pasadas de mezcla se comprueba contra la fórmula, y no queda ningún archivo de run atrás.
- **Runs**: cada run está ordenada, cabe en el buffer de runs, y las runs juntas contienen exactamente las líneas de la entrada.
- **Las comprobaciones se comprueban**: un archivo desordenado, un archivo al que le falta una línea repetida y un archivo con una línea cambiada se detectan todos.
- **Bordes**: una entrada sin salto de línea final, líneas vacías, una línea más larga que el tamaño de la run (un error) y un fan-in de 1 (un error).
- **Heap**: la menor línea actual está siempre en la cima, y las líneas iguales salen en el orden de las runs.
- **Mismo generador**: ambos lenguajes verifican el checksum de `fixtures/checksum-1000.txt`.

## Demo: el límite de memoria (MP-FS-2.1)

```sh
docker compose run --rm rust-limit
docker compose run --rm go-limit
```

Cada contenedor tiene `mem_limit: 32m` y `memswap_limit: 32m` en `docker-compose.yml`. El programa genera 335.544.323 bytes de líneas (10 veces el límite), los ordena con runs de 8 MiB y un fan-in de 8, comprueba que la salida está ordenada y tiene las mismas líneas, lee su pico de memoria residente de la línea `VmHWM` de `/proc/self/status`, y falla a menos que ese pico esté por debajo del límite.

| Lenguaje | Runs | Pasadas de mezcla | Pico de memoria residente | Parte del límite |
| --- | ---: | ---: | ---: | ---: |
| Rust | 41 | 2 | 11,2 MiB | 35% |
| Go | 41 | 2 | 19,9 MiB | 62% |

Para demostrar que el límite es real, el mismo archivo ordenado en memoria bajo el mismo límite es matado por el kernel:

```sh
docker compose run --rm rust-limit extsort in-memory-check 32   # exit code 137
```

Salida completa y cómo se comprobó el límite: [results/memory-limit.md](results/memory-limit.md).

## Benchmark: tamaño de run y fan-in (MP-FS-2.3)

```sh
bun run bench -- --project external-sorting    # from the repository root
```

El runner inicia un contenedor por fila, sin red, y hyperfine mide el proceso entero 7 veces después de 1 ejecución de calentamiento. Grilla: 250.000 y 1.000.000 de líneas (12,5 MB y 50 MB), runs de 1, 4 y 16 MiB, fan-in de 2, 4, 16 y 64, en ambos lenguajes. La tabla completa, con máquina, versiones y comandos, es [results/results.md](results/results.md), y `dashboard/index.html` la grafica al abrirse desde el disco.

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

## Límites

- Las líneas se comparan como bytes, desde el primer byte. No hay extracción de claves ni locale.
- Las runs se hacen ordenando trozos del tamaño de la memoria. La selección por reemplazo (replacement selection), que hace runs de aproximadamente el doble de largo, la cubre el quiz y no está implementada.
- Los buffers de la mezcla se dimensionan como el tamaño de la run dividido por el fan-in más uno, con un mínimo de 4 KiB, de modo que la mezcla usa aproximadamente tanta memoria como la generación de runs.
- El benchmark se ejecutó en un SSD detrás de un disco virtual, donde un seek cuesta casi nada. La penalización de un fan-in muy grande en un disco magnético, muchas recargas pequeñas que son cada una un seek, no se ve en estos números.
- La comparación de la entrada con la salida en archivos grandes usa la cuenta de líneas y un checksum de 64 bits independiente del orden. Las pruebas en archivos pequeños comparan los archivos exactamente.
