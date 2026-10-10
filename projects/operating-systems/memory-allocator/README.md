# memory-allocator

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Four memory allocators over a fixed arena: first fit, best fit and worst fit on a free list, and the buddy system. A benchmark runs the same sequence of allocations and frees through each of them and measures failed allocations, external fragmentation and internal fragmentation. It teaches that free memory is only useful when it is contiguous, that the strategy decides how fast the arena breaks into holes, and that coalescing is what puts it back together.

Full explanation: [docs/en/operating-systems/memory-allocator.md](../../../docs/en/operating-systems/memory-allocator.md).

## Quiz topics it demonstrates

- `operating-systems` / `memory-management`: free-list allocation (first fit, best fit, worst fit), external and internal fragmentation, coalescing and compaction, variable-size partitions and segmentation.

## Run

The only requirement is Docker.

```sh
./setup-unix-memory-allocator.sh        # Linux and macOS
./setup-windows-memory-allocator.ps1    # Windows
```

The script builds the images, runs the tests of both languages and runs the benchmark.

## Benchmark

```sh
docker compose run --rm demo
```

It prints the table below for two workloads and writes `results/results.md`.

```text
Workload: mixed (arena 1048576 bytes, 20000 steps, seed 2026)
strategy    attempts  failed  failed %  ext frag %  int frag %  peak used
first-fit      11054     905      8.19       80.54        0.00     969266
best-fit       11054     868      7.85       78.65        0.00    1013220
worst-fit      11054    1258     11.38       95.72        0.00     653051
buddy          11054    1098      9.93       68.07       25.48    1047424
```

`docker compose run --rm rust-demo` prints the same table from the Rust implementation.

The benchmark is a deterministic simulation, not a timing: it counts events and measures the layout of the arena, so the numbers are the same on any machine and no hyperfine run is involved.

## Structure

| Path | Content |
| --- | --- |
| `cpp/allocator.hpp` | the free-list allocator with its three strategies and the buddy system |
| `cpp/workload.hpp` | seeded generator and the benchmark loop |
| `cpp/demo.cpp` | prints the table as text or Markdown |
| `cpp/test_allocator.cpp` | tests, with no framework |
| `rust/src/lib.rs` | the same allocators, benchmark and tests in Rust (a trait instead of an abstract class) |
| `rust/src/main.rs` | prints the table |
| `results/` | committed table |

Each language folder has its own Dockerfile on a pinned image (`gcc:16.2.0-trixie`, `rust:1.99.0-slim-trixie`) and no library dependency.

## Tests

```sh
docker compose run --rm cpp-test     # clang-format check, then the tests
docker compose run --rm rust-test    # cargo fmt, clippy -D warnings, then the tests
```

The randomised test runs thousands of random allocations and frees on every strategy and checks, after each one, that no two live blocks overlap. Then it frees everything in random order and checks that the arena is a single free block again.

## Results

The committed table is [results/results.md](results/results.md).
