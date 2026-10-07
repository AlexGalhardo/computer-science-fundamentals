# paging-tlb

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A paging simulator. It translates virtual addresses through a TLB and a page table, counting TLB hits, TLB misses and page faults, and it compares four page replacement algorithms (FIFO, clock, LRU and optimal) on reference strings. It teaches what a translation costs, why the TLB matters, and that the choice of the page to evict changes the number of page faults, up to Belady's anomaly, where FIFO faults more with more memory.

Full explanation: [docs/en/operating-systems/paging-tlb.md](../../../docs/en/operating-systems/paging-tlb.md).

## Quiz topics it demonstrates

- `operating-systems` / `memory-management`: address translation (page number and offset), page faults, the TLB and the effective access time, FIFO, clock, LRU and optimal replacement, Belady's anomaly.

## Run

The only requirement is Docker.

```sh
./setup-unix-paging-tlb.sh        # Linux and macOS
./setup-windows-paging-tlb.ps1    # Windows
```

The script builds the images, runs the tests of both languages and runs the demo.

## Demo

```sh
docker compose run --rm demo
```

It prints the page-fault tables and the TLB experiment and writes `results/results.md` and `results/results.json`.

```
Belady's anomaly
reference string: 1 2 3 4 1 2 5 1 2 3 4 5
frames      1    2    3    4    5
fifo       12   12    9   10    5
lru        12   12   10    8    5
optimal    12    9    7    6    5
```

`docker compose run --rm rust-demo` prints the same page-fault tables from the Rust implementation.

## Structure

| Path | Content |
| --- | --- |
| `ts/src/replacement.ts` | FIFO, clock, LRU and optimal (reference implementation) |
| `ts/src/mmu.ts` | page table, TLB, counters and effective access time |
| `ts/src/report.ts`, `ts/src/cli.ts` | demo, tables and result files |
| `rust/src/lib.rs` | the same algorithms and MMU in Rust, with an `enum` and `match` instead of classes |
| `rust/src/main.rs` | prints the page-fault tables |
| `results/` | committed tables |

Each language folder has its own Dockerfile on a pinned image (`oven/bun:1.4.2`, `rust:1.99.0-slim-trixie`) and no dependency.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

The tests check the reference trace of the MMU (expected TLB hits, misses and page faults), the textbook page-fault counts, and Belady's anomaly. The Rust service also runs `cargo fmt --check` and `cargo clippy -D warnings`.

## Results

The committed table is [results/results.md](results/results.md). The simulation is deterministic, so the numbers are the same on any machine.
