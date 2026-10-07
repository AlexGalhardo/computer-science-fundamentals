# Benchmark: travelling-salesman

Generated at 2026-10-07T23:42:26.354Z. 3 runs per row after 0 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- ts: 1.4.2 (oven/bun:1.4.2)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| brute-force | default | 6 | rust | 13.1 ± 2.50 | 10.7 to 15.7 | 2.80 | 0.00 | 2436 |
| brute-force | default | 6 | ts | 91.0 ± 34.3 | 64.8 to 130 | 35.4 | 0.63 | 18860 |
| brute-force | default | 8 | rust | 11.0 ± 0.64 | 10.6 to 11.7 | 2.80 | 0.09 | 2476 |
| brute-force | default | 8 | ts | 33.4 ± 5.39 | 29.8 to 39.6 | 17.9 | 2.02 | 24384 |
| brute-force | default | 10 | rust | 30.7 ± 10.3 | 21.4 to 41.7 | 15.8 | 6.81 | 2376 |
| brute-force | default | 10 | ts | 44.0 ± 7.03 | 37.6 to 51.5 | 35.4 | 13.1 | 28968 |
| brute-force | default | 11 | rust | 81.6 ± 11.2 | 70.1 to 92.5 | 71.6 | 70.9 | 2576 |
| brute-force | default | 11 | ts | 235 ± 55.2 | 171 to 269 | 223 | 202 | 28776 |
| brute-force | default | 12 | rust | 723 ± 10.8 | 714 to 735 | 713 | 765 | 2584 |
| brute-force | default | 12 | ts | 2174 ± 144 | 2055 to 2334 | 2158 | 1709 | 28648 |
| brute-force | default | 13 | rust | 10183 ± 1371 | 8722 to 11441 | 10151 | 7351 | 2516 |
| brute-force | default | 13 | ts | 12056 ± 6.75 | 12052 to 12064 | 12039 | 12034 | 28904 |
| brute-force | default | 14 | rust | 12023 ± 8.16 | 12013 to 12028 | 11982 | 12010 | 2492 |
| brute-force | default | 14 | ts | 12057 ± 18.8 | 12037 to 12075 | 11894 | 12007 | 28764 |
| held-karp | default | 6 | rust | 18.1 ± 6.36 | 14.2 to 25.4 | 4.71 | 0.01 | 2316 |
| held-karp | default | 6 | ts | 105 ± 47.3 | 72.6 to 159 | 64.3 | 1.04 | 21128 |
| held-karp | default | 8 | rust | 17.3 ± 6.14 | 11.3 to 23.6 | 4.10 | 0.02 | 2452 |
| held-karp | default | 8 | ts | 176 ± 97.0 | 110 to 287 | 46.2 | 1.53 | 21292 |
| held-karp | default | 10 | rust | 20.2 ± 11.4 | 12.4 to 33.3 | 3.91 | 0.09 | 2320 |
| held-karp | default | 10 | ts | 77.3 ± 23.8 | 50.2 to 94.9 | 27.6 | 3.63 | 25128 |
| held-karp | default | 11 | rust | 18.6 ± 2.63 | 15.7 to 20.9 | 3.97 | 0.25 | 2372 |
| held-karp | default | 11 | ts | 75.5 ± 13.3 | 60.1 to 84.2 | 26.6 | 3.79 | 25304 |
| held-karp | default | 12 | rust | 46.5 ± 18.6 | 29.5 to 66.3 | 8.27 | 0.59 | 2472 |
| held-karp | default | 12 | ts | 68.6 ± 23.9 | 45.4 to 93.1 | 31.5 | 4.58 | 25924 |
| held-karp | default | 13 | rust | 12.9 ± 2.22 | 11.5 to 15.4 | 4.18 | 1.37 | 2680 |
| held-karp | default | 13 | ts | 67.4 ± 27.9 | 50.2 to 99.6 | 33.6 | 5.69 | 26432 |
| held-karp | default | 14 | rust | 22.2 ± 5.12 | 18.1 to 27.9 | 6.40 | 3.10 | 2828 |
| held-karp | default | 14 | ts | 53.6 ± 8.64 | 44.6 to 61.8 | 40.3 | 9.38 | 28176 |
| held-karp | default | 16 | rust | 27.1 ± 1.87 | 25.6 to 29.2 | 18.5 | 13.9 | 4716 |
| held-karp | default | 16 | ts | 116 ± 28.1 | 84.5 to 139 | 109 | 40.2 | 35336 |
| held-karp | default | 18 | rust | 84.4 ± 1.30 | 83.0 to 85.6 | 77.7 | 60.2 | 13372 |
| held-karp | default | 18 | ts | 228 ± 38.5 | 198 to 272 | 201 | 109 | 44580 |
| held-karp | default | 20 | rust | 417 ± 70.3 | 375 to 498 | 408 | 437 | 51084 |
| held-karp | default | 20 | ts | 600 ± 57.9 | 546 to 661 | 610 | 569 | 81964 |
| nearest-neighbour | default | 6 | rust | 21.0 ± 0.53 | 20.5 to 21.5 | 4.20 | 0.01 | 2480 |
| nearest-neighbour | default | 6 | ts | 46.5 ± 9.18 | 39.3 to 56.8 | 17.5 | 0.16 | 18440 |
| nearest-neighbour | default | 8 | rust | 13.4 ± 1.71 | 11.7 to 15.1 | 3.14 | 0.00 | 2348 |
| nearest-neighbour | default | 8 | ts | 44.0 ± 5.16 | 39.5 to 49.6 | 17.5 | 0.16 | 19156 |
| nearest-neighbour | default | 10 | rust | 13.0 ± 3.44 | 9.98 to 16.8 | 2.75 | 0.00 | 2452 |
| nearest-neighbour | default | 10 | ts | 77.0 ± 10.5 | 65.8 to 86.6 | 34.7 | 0.16 | 18620 |
| nearest-neighbour | default | 11 | rust | 17.8 ± 2.72 | 16.2 to 20.9 | 3.50 | 0.00 | 2296 |
| nearest-neighbour | default | 11 | ts | 105 ± 30.4 | 80.2 to 139 | 43.3 | 1.84 | 18980 |
| nearest-neighbour | default | 12 | rust | 17.1 ± 5.12 | 13.9 to 23.0 | 3.58 | 0.00 | 2340 |
| nearest-neighbour | default | 12 | ts | 92.2 ± 22.5 | 70.4 to 115 | 28.5 | 0.17 | 18548 |
| nearest-neighbour | default | 13 | rust | 29.4 ± 7.89 | 21.5 to 37.3 | 4.73 | 0.00 | 2408 |
| nearest-neighbour | default | 13 | ts | 75.2 ± 8.22 | 68.6 to 84.4 | 22.2 | 0.24 | 18644 |
| nearest-neighbour | default | 14 | rust | 17.5 ± 4.04 | 12.9 to 20.4 | 3.70 | 0.00 | 2500 |
| nearest-neighbour | default | 14 | ts | 58.8 ± 12.9 | 44.1 to 68.1 | 26.0 | 0.14 | 18392 |
| nearest-neighbour | default | 16 | rust | 12.9 ± 2.29 | 11.1 to 15.4 | 3.04 | 0.00 | 2504 |
| nearest-neighbour | default | 16 | ts | 29.2 ± 6.49 | 25.4 to 36.7 | 23.6 | 0.38 | 19248 |
| nearest-neighbour | default | 18 | rust | 14.2 ± 0.75 | 13.3 to 14.8 | 3.00 | 0.00 | 2472 |
| nearest-neighbour | default | 18 | ts | 34.3 ± 11.9 | 27.2 to 48.0 | 18.3 | 0.15 | 22936 |
| nearest-neighbour | default | 20 | rust | 16.8 ± 6.33 | 11.4 to 23.7 | 3.73 | 0.00 | 2516 |
| nearest-neighbour | default | 20 | ts | 69.3 ± 22.0 | 44.0 to 83.2 | 24.0 | 0.26 | 23148 |
| nearest-neighbour | default | 100 | rust | 21.4 ± 4.06 | 16.8 to 24.3 | 3.62 | 0.03 | 2496 |
| nearest-neighbour | default | 100 | ts | 83.0 ± 57.6 | 47.5 to 149 | 27.3 | 1.08 | 25400 |
| two-opt | default | 6 | rust | 52.2 ± 13.8 | 41.5 to 67.8 | 4.73 | 0.01 | 2492 |
| two-opt | default | 6 | ts | 59.7 ± 13.5 | 44.1 to 67.8 | 17.7 | 0.31 | 20524 |
| two-opt | default | 8 | rust | 29.4 ± 16.2 | 18.0 to 48.0 | 4.13 | 0.00 | 2360 |
| two-opt | default | 8 | ts | 28.4 ± 1.62 | 26.6 to 29.7 | 14.3 | 0.34 | 18864 |
| two-opt | default | 10 | rust | 24.3 ± 10.6 | 13.8 to 34.9 | 4.96 | 0.00 | 2440 |
| two-opt | default | 10 | ts | 55.2 ± 18.4 | 34.6 to 70.3 | 27.7 | 0.46 | 20780 |
| two-opt | default | 11 | rust | 16.0 ± 4.64 | 11.6 to 20.9 | 2.98 | 0.00 | 2352 |
| two-opt | default | 11 | ts | 48.8 ± 13.4 | 38.4 to 63.9 | 22.4 | 0.50 | 20868 |
| two-opt | default | 12 | rust | 33.3 ± 18.3 | 20.3 to 54.3 | 5.35 | 0.00 | 2468 |
| two-opt | default | 12 | ts | 136 ± 28.6 | 113 to 168 | 43.1 | 0.57 | 20540 |
| two-opt | default | 13 | rust | 15.7 ± 5.41 | 11.5 to 21.8 | 4.42 | 0.00 | 2576 |
| two-opt | default | 13 | ts | 61.5 ± 11.7 | 53.1 to 74.9 | 19.3 | 0.68 | 20764 |
| two-opt | default | 14 | rust | 23.0 ± 13.5 | 11.0 to 37.7 | 4.69 | 0.11 | 2628 |
| two-opt | default | 14 | ts | 50.0 ± 9.46 | 42.3 to 60.6 | 20.1 | 0.60 | 22436 |
| two-opt | default | 16 | rust | 11.2 ± 1.69 | 10.1 to 13.1 | 2.84 | 0.01 | 2528 |
| two-opt | default | 16 | ts | 51.2 ± 7.85 | 45.3 to 60.1 | 24.6 | 0.68 | 24236 |
| two-opt | default | 18 | rust | 15.6 ± 1.50 | 14.4 to 17.3 | 3.55 | 0.01 | 2376 |
| two-opt | default | 18 | ts | 94.2 ± 31.6 | 59.4 to 121 | 30.0 | 0.97 | 23488 |
| two-opt | default | 20 | rust | 12.6 ± 2.57 | 11.0 to 15.6 | 3.42 | 0.01 | 2364 |
| two-opt | default | 20 | ts | 36.2 ± 5.89 | 29.8 to 41.3 | 18.6 | 0.71 | 24200 |
| two-opt | default | 100 | rust | 10.3 ± 2.36 | 8.72 to 13.0 | 2.78 | 0.05 | 2584 |
| two-opt | default | 100 | ts | 30.8 ± 7.63 | 23.3 to 38.5 | 21.4 | 1.86 | 29628 |

## Commands

- `rust`: `rust/target/release/travelling-salesman brute-force 6`
- `ts`: `bun run ts/src/bench.ts brute-force 6`
- `rust`: `rust/target/release/travelling-salesman brute-force 8`
- `ts`: `bun run ts/src/bench.ts brute-force 8`
- `rust`: `rust/target/release/travelling-salesman brute-force 10`
- `ts`: `bun run ts/src/bench.ts brute-force 10`
- `rust`: `rust/target/release/travelling-salesman brute-force 11`
- `ts`: `bun run ts/src/bench.ts brute-force 11`
- `rust`: `rust/target/release/travelling-salesman brute-force 12`
- `ts`: `bun run ts/src/bench.ts brute-force 12`
- `rust`: `rust/target/release/travelling-salesman brute-force 13`
- `ts`: `bun run ts/src/bench.ts brute-force 13`
- `rust`: `rust/target/release/travelling-salesman brute-force 14`
- `ts`: `bun run ts/src/bench.ts brute-force 14`
- `rust`: `rust/target/release/travelling-salesman held-karp 6`
- `ts`: `bun run ts/src/bench.ts held-karp 6`
- `rust`: `rust/target/release/travelling-salesman held-karp 8`
- `ts`: `bun run ts/src/bench.ts held-karp 8`
- `rust`: `rust/target/release/travelling-salesman held-karp 10`
- `ts`: `bun run ts/src/bench.ts held-karp 10`
- `rust`: `rust/target/release/travelling-salesman held-karp 11`
- `ts`: `bun run ts/src/bench.ts held-karp 11`
- `rust`: `rust/target/release/travelling-salesman held-karp 12`
- `ts`: `bun run ts/src/bench.ts held-karp 12`
- `rust`: `rust/target/release/travelling-salesman held-karp 13`
- `ts`: `bun run ts/src/bench.ts held-karp 13`
- `rust`: `rust/target/release/travelling-salesman held-karp 14`
- `ts`: `bun run ts/src/bench.ts held-karp 14`
- `rust`: `rust/target/release/travelling-salesman held-karp 16`
- `ts`: `bun run ts/src/bench.ts held-karp 16`
- `rust`: `rust/target/release/travelling-salesman held-karp 18`
- `ts`: `bun run ts/src/bench.ts held-karp 18`
- `rust`: `rust/target/release/travelling-salesman held-karp 20`
- `ts`: `bun run ts/src/bench.ts held-karp 20`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 6`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 6`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 8`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 8`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 10`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 10`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 11`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 11`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 12`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 12`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 13`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 13`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 14`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 14`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 16`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 16`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 18`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 18`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 20`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 20`
- `rust`: `rust/target/release/travelling-salesman nearest-neighbour 100`
- `ts`: `bun run ts/src/bench.ts nearest-neighbour 100`
- `rust`: `rust/target/release/travelling-salesman two-opt 6`
- `ts`: `bun run ts/src/bench.ts two-opt 6`
- `rust`: `rust/target/release/travelling-salesman two-opt 8`
- `ts`: `bun run ts/src/bench.ts two-opt 8`
- `rust`: `rust/target/release/travelling-salesman two-opt 10`
- `ts`: `bun run ts/src/bench.ts two-opt 10`
- `rust`: `rust/target/release/travelling-salesman two-opt 11`
- `ts`: `bun run ts/src/bench.ts two-opt 11`
- `rust`: `rust/target/release/travelling-salesman two-opt 12`
- `ts`: `bun run ts/src/bench.ts two-opt 12`
- `rust`: `rust/target/release/travelling-salesman two-opt 13`
- `ts`: `bun run ts/src/bench.ts two-opt 13`
- `rust`: `rust/target/release/travelling-salesman two-opt 14`
- `ts`: `bun run ts/src/bench.ts two-opt 14`
- `rust`: `rust/target/release/travelling-salesman two-opt 16`
- `ts`: `bun run ts/src/bench.ts two-opt 16`
- `rust`: `rust/target/release/travelling-salesman two-opt 18`
- `ts`: `bun run ts/src/bench.ts two-opt 18`
- `rust`: `rust/target/release/travelling-salesman two-opt 20`
- `ts`: `bun run ts/src/bench.ts two-opt 20`
- `rust`: `rust/target/release/travelling-salesman two-opt 100`
- `ts`: `bun run ts/src/bench.ts two-opt 100`
