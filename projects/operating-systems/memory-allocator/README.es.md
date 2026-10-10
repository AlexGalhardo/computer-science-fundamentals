# memory-allocator

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cuatro asignadores de memoria sobre una arena fija: first fit, best fit y worst fit sobre una lista libre, y el sistema buddy. Un benchmark ejecuta la misma secuencia de asignaciones y liberaciones a través de cada uno y mide las asignaciones fallidas, la fragmentación externa y la fragmentación interna. Enseña que la memoria libre solo es útil cuando es contigua, que la estrategia decide con qué rapidez la arena se rompe en huecos, y que la fusión (coalescing) es lo que la vuelve a unir.

Explicación completa: [docs/es/operating-systems/memory-allocator.md](../../../docs/es/operating-systems/memory-allocator.md).

## Temas del quiz que demuestra

- `operating-systems` / `memory-management`: asignación con lista libre (first fit, best fit, worst fit), fragmentación externa e interna, fusión (coalescing) y compactación, particiones de tamaño variable y segmentación.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-memory-allocator.sh        # Linux y macOS
./setup-windows-memory-allocator.ps1    # Windows
```

El script construye las imágenes, ejecuta las pruebas de ambos lenguajes y ejecuta el benchmark.

## Benchmark

```sh
docker compose run --rm demo
```

Imprime la tabla de abajo para dos cargas de trabajo y escribe `results/results.md`.

```text
Workload: mixed (arena 1048576 bytes, 20000 steps, seed 2026)
strategy    attempts  failed  failed %  ext frag %  int frag %  peak used
first-fit      11054     905      8.19       80.54        0.00     969266
best-fit       11054     868      7.85       78.65        0.00    1013220
worst-fit      11054    1258     11.38       95.72        0.00     653051
buddy          11054    1098      9.93       68.07       25.48    1047424
```

`docker compose run --rm rust-demo` imprime la misma tabla desde la implementación en Rust.

El benchmark es una simulación determinista, no una medición de tiempo: cuenta eventos y mide la disposición de la arena, por lo que los números son los mismos en cualquier máquina y no interviene ninguna ejecución de hyperfine.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/allocator.hpp` | el asignador con lista libre y sus tres estrategias, y el sistema buddy |
| `cpp/workload.hpp` | generador con semilla y el bucle del benchmark |
| `cpp/demo.cpp` | imprime la tabla como texto o Markdown |
| `cpp/test_allocator.cpp` | pruebas, sin framework |
| `rust/src/lib.rs` | los mismos asignadores, benchmark y pruebas en Rust (un trait en lugar de una clase abstracta) |
| `rust/src/main.rs` | imprime la tabla |
| `results/` | tabla versionada |

Cada carpeta de lenguaje tiene su propio Dockerfile con una imagen fijada (`gcc:16.2.0-trixie`, `rust:1.99.0-slim-trixie`) y ninguna dependencia de bibliotecas.

## Pruebas

```sh
docker compose run --rm cpp-test     # clang-format check, then the tests
docker compose run --rm rust-test    # cargo fmt, clippy -D warnings, then the tests
```

La prueba aleatorizada ejecuta miles de asignaciones y liberaciones aleatorias en cada estrategia y comprueba, después de cada una, que ningún par de bloques vivos se superponga. Luego libera todo en orden aleatorio y comprueba que la arena vuelva a ser un único bloque libre.

## Resultados

La tabla versionada es [results/results.md](results/results.md).
