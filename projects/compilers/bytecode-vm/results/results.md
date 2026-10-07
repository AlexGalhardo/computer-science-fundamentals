# Benchmark: bytecode-vm

Generated at 2026-10-07T23:32:44.345Z. 5 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- rust: rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)
- ts: 1.4.2 (oven/bun:1.4.2)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| loop | default | 100000 | rust | 34.0 ± 4.04 | 31.5 to 41.1 | 22.0 | 17.9 | 2084 |
| loop | default | 100000 | ts | 70.4 ± 8.39 | 62.9 to 84.0 | 92.8 | 36.0 | 58168 |
| loop | default | 1000000 | rust | 220 ± 9.63 | 209 to 234 | 206 | 194 | 2044 |
| loop | default | 1000000 | ts | 500 ± 38.4 | 453 to 546 | 795 | 376 | 77452 |
| recursion | default | 100000 | rust | 35.4 ± 8.28 | 28.9 to 49.6 | 21.1 | 19.6 | 2188 |
| recursion | default | 100000 | ts | 145 ± 17.0 | 126 to 167 | 259 | 64.5 | 81372 |
| recursion | default | 1000000 | rust | 161 ± 20.9 | 147 to 198 | 144 | 136 | 2096 |
| recursion | default | 1000000 | ts | 820 ± 67.2 | 750 to 900 | 1303 | 672 | 97660 |

## Commands

- `rust`: `rust/target/release/bytecode-vm bench bench/loop.mini 100000`
- `ts`: `bun run baseline-ts/bench.ts bench/loop.mini 100000`
- `rust`: `rust/target/release/bytecode-vm bench bench/loop.mini 1000000`
- `ts`: `bun run baseline-ts/bench.ts bench/loop.mini 1000000`
- `rust`: `rust/target/release/bytecode-vm bench bench/recursion.mini 100000`
- `ts`: `bun run baseline-ts/bench.ts bench/recursion.mini 100000`
- `rust`: `rust/target/release/bytecode-vm bench bench/recursion.mini 1000000`
- `ts`: `bun run baseline-ts/bench.ts bench/recursion.mini 1000000`
