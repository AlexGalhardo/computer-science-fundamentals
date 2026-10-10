# paging-tlb

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un simulador de paginación. Traduce direcciones virtuales a través de una TLB y una tabla de páginas, contando aciertos de TLB (TLB hits), fallos de TLB (TLB misses) y fallos de página (page faults), y compara cuatro algoritmos de reemplazo de páginas (FIFO, clock, LRU y óptimo) sobre cadenas de referencias. Enseña cuánto cuesta una traducción, por qué importa la TLB, y que la elección de la página a expulsar cambia el número de fallos de página, hasta la anomalía de Belady, en la que FIFO falla más con más memoria.

Explicación completa: [docs/es/operating-systems/paging-tlb.md](../../../docs/es/operating-systems/paging-tlb.md).

## Temas del quiz que demuestra

- `operating-systems` / `memory-management`: traducción de direcciones (número de página y desplazamiento), fallos de página, la TLB y el tiempo efectivo de acceso, reemplazo FIFO, clock, LRU y óptimo, la anomalía de Belady.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-paging-tlb.sh        # Linux y macOS
./setup-windows-paging-tlb.ps1    # Windows
```

El script construye las imágenes, ejecuta las pruebas de ambos lenguajes y ejecuta la demo.

## Demo

```sh
docker compose run --rm demo
```

Imprime las tablas de fallos de página y el experimento de la TLB, y escribe `results/results.md` y `results/results.json`.

```text
Belady's anomaly
reference string: 1 2 3 4 1 2 5 1 2 3 4 5
frames      1    2    3    4    5
fifo       12   12    9   10    5
lru        12   12   10    8    5
optimal    12    9    7    6    5
```

`docker compose run --rm rust-demo` imprime las mismas tablas de fallos de página desde la implementación en Rust.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/replacement.ts` | FIFO, clock, LRU y óptimo (implementación de referencia) |
| `ts/src/mmu.ts` | tabla de páginas, TLB, contadores y tiempo efectivo de acceso |
| `ts/src/report.ts`, `ts/src/cli.ts` | demo, tablas y archivos de resultados |
| `rust/src/lib.rs` | los mismos algoritmos y la MMU en Rust, con un `enum` y `match` en lugar de clases |
| `rust/src/main.rs` | imprime las tablas de fallos de página |
| `results/` | tablas versionadas |

Cada carpeta de lenguaje tiene su propio Dockerfile con una imagen fijada (`oven/bun:1.4.2`, `rust:1.99.0-slim-trixie`) y ninguna dependencia.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

Las pruebas verifican la traza de referencia de la MMU (aciertos de TLB, fallos y fallos de página esperados), los conteos de fallos de página de libro de texto, y la anomalía de Belady. El servicio de Rust también ejecuta `cargo fmt --check` y `cargo clippy -D warnings`.

## Resultados

La tabla versionada es [results/results.md](results/results.md). La simulación es determinista, por lo que los números son los mismos en cualquier máquina.
