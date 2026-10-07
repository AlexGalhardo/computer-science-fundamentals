# Benchmark: hash-map

Generated at 2026-10-07T22:26:39.178Z. 5 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- cpp: g++ (GCC) 16.2.0 (gcc:16.2.0-trixie)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)
- ts: 1.4.2 (oven/bun:1.4.2)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| chaining | 0.25 | 200000 | cpp | 99.7 ± 17.2 | 77.6 to 118 | 90.6 | 14.7 | 15968 |
| chaining | 0.25 | 200000 | rust | 71.1 ± 7.60 | 58.1 to 78.2 | 61.3 | 17.7 | 14496 |
| chaining | 0.25 | 200000 | ts | 213 ± 28.0 | 186 to 259 | 206 | 59.1 | 51268 |
| chaining | 0.5 | 200000 | cpp | 80.5 ± 11.2 | 65.7 to 91.6 | 68.0 | 13.7 | 12756 |
| chaining | 0.5 | 200000 | rust | 67.3 ± 14.4 | 46.8 to 86.2 | 58.3 | 14.5 | 11408 |
| chaining | 0.5 | 200000 | ts | 185 ± 78.1 | 108 to 281 | 206 | 84.5 | 50576 |
| chaining | 0.75 | 200000 | cpp | 72.3 ± 16.1 | 56.6 to 93.9 | 67.3 | 11.1 | 11768 |
| chaining | 0.75 | 200000 | rust | 79.0 ± 14.1 | 60.1 to 94.1 | 66.1 | 15.3 | 10436 |
| chaining | 0.75 | 200000 | ts | 140 ± 17.3 | 125 to 168 | 184 | 52.8 | 49456 |
| chaining | 0.9 | 200000 | cpp | 60.4 ± 11.6 | 51.3 to 80.6 | 56.4 | 16.6 | 11528 |
| chaining | 0.9 | 200000 | rust | 68.8 ± 9.89 | 60.6 to 85.1 | 58.5 | 23.1 | 9972 |
| chaining | 0.9 | 200000 | ts | 189 ± 45.6 | 125 to 235 | 196 | 77.3 | 46896 |
| probing | 0.25 | 200000 | cpp | 51.4 ± 12.6 | 38.4 to 68.3 | 45.4 | 16.9 | 22228 |
| probing | 0.25 | 200000 | rust | 104 ± 15.3 | 94.5 to 131 | 77.0 | 39.9 | 20588 |
| probing | 0.25 | 200000 | ts | 186 ± 37.6 | 132 to 236 | 178 | 40.4 | 44028 |
| probing | 0.5 | 200000 | cpp | 40.8 ± 3.47 | 36.6 to 45.0 | 36.6 | 10.4 | 12756 |
| probing | 0.5 | 200000 | rust | 65.1 ± 9.08 | 58.9 to 80.8 | 53.8 | 13.6 | 11428 |
| probing | 0.5 | 200000 | ts | 118 ± 30.9 | 74.5 to 158 | 123 | 35.4 | 36992 |
| probing | 0.75 | 200000 | cpp | 38.3 ± 10.1 | 29.1 to 55.3 | 35.0 | 16.6 | 9720 |
| probing | 0.75 | 200000 | rust | 56.6 ± 7.07 | 50.7 to 66.2 | 44.6 | 17.0 | 8192 |
| probing | 0.75 | 200000 | ts | 134 ± 17.3 | 120 to 163 | 115 | 51.5 | 36484 |
| probing | 0.9 | 200000 | cpp | 65.5 ± 5.68 | 61.4 to 75.5 | 62.0 | 41.4 | 8696 |
| probing | 0.9 | 200000 | rust | 73.6 ± 11.5 | 63.8 to 92.8 | 63.5 | 47.3 | 7240 |
| probing | 0.9 | 200000 | ts | 214 ± 58.2 | 157 to 306 | 197 | 148 | 34824 |

## Commands

- `cpp`: `.bench/hash_map_bench chaining 200000 0.25`
- `rust`: `.bench/rust/release/bench chaining 200000 0.25`
- `ts`: `bun run ts/bench.ts chaining 200000 0.25`
- `cpp`: `.bench/hash_map_bench chaining 200000 0.5`
- `rust`: `.bench/rust/release/bench chaining 200000 0.5`
- `ts`: `bun run ts/bench.ts chaining 200000 0.5`
- `cpp`: `.bench/hash_map_bench chaining 200000 0.75`
- `rust`: `.bench/rust/release/bench chaining 200000 0.75`
- `ts`: `bun run ts/bench.ts chaining 200000 0.75`
- `cpp`: `.bench/hash_map_bench chaining 200000 0.9`
- `rust`: `.bench/rust/release/bench chaining 200000 0.9`
- `ts`: `bun run ts/bench.ts chaining 200000 0.9`
- `cpp`: `.bench/hash_map_bench probing 200000 0.25`
- `rust`: `.bench/rust/release/bench probing 200000 0.25`
- `ts`: `bun run ts/bench.ts probing 200000 0.25`
- `cpp`: `.bench/hash_map_bench probing 200000 0.5`
- `rust`: `.bench/rust/release/bench probing 200000 0.5`
- `ts`: `bun run ts/bench.ts probing 200000 0.5`
- `cpp`: `.bench/hash_map_bench probing 200000 0.75`
- `rust`: `.bench/rust/release/bench probing 200000 0.75`
- `ts`: `bun run ts/bench.ts probing 200000 0.75`
- `cpp`: `.bench/hash_map_bench probing 200000 0.9`
- `rust`: `.bench/rust/release/bench probing 200000 0.9`
- `ts`: `bun run ts/bench.ts probing 200000 0.9`
