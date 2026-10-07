# Benchmark: hybrid-quicksort

Generated at 2026-10-07T23:46:29.948Z. 3 runs per row after 1 warm-up run(s).

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

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| first-k0 | random | 4000 | cpp | 7.30 ± 0.84 | 6.72 to 8.26 | 2.93 | 0.15 | 3812 |
| first-k0 | random | 4000 | rust | 19.1 ± 9.44 | 13.1 to 29.9 | 4.07 | 0.22 | 2052 |
| first-k0 | random | 16000 | cpp | 11.4 ± 0.30 | 11.1 to 11.6 | 7.27 | 1.04 | 3908 |
| first-k0 | random | 16000 | rust | 80.7 ± 19.7 | 59.8 to 99.1 | 10.1 | 1.06 | 2112 |
| first-k0 | reversed | 4000 | cpp | 28.2 ± 10.6 | 20.9 to 40.3 | 23.5 | 2.51 | 3900 |
| first-k0 | reversed | 4000 | rust | 146 ± 28.3 | 113 to 165 | 63.2 | 12.6 | 2004 |
| first-k0 | reversed | 16000 | cpp | 441 ± 6.96 | 435 to 449 | 436 | 84.6 | 3960 |
| first-k0 | reversed | 16000 | rust | 915 ± 12.0 | 901 to 922 | 889 | 166 | 2256 |
| first-k0 | sorted | 4000 | cpp | 30.7 ± 4.16 | 25.9 to 33.2 | 25.4 | 3.81 | 3688 |
| first-k0 | sorted | 4000 | rust | 112 ± 10.9 | 104 to 125 | 73.0 | 14.9 | 2112 |
| first-k0 | sorted | 16000 | cpp | 352 ± 80.1 | 261 to 409 | 345 | 51.4 | 3960 |
| first-k0 | sorted | 16000 | rust | 1028 ± 168 | 873 to 1207 | 1010 | 212 | 2240 |
| median3-k0 | random | 4000 | cpp | 8.09 ± 0.31 | 7.86 to 8.45 | 3.69 | 0.20 | 3952 |
| median3-k0 | random | 4000 | rust | 13.1 ± 1.84 | 11.0 to 14.3 | 4.09 | 0.20 | 2056 |
| median3-k0 | random | 16000 | cpp | 13.0 ± 0.77 | 12.6 to 13.9 | 8.22 | 1.04 | 4028 |
| median3-k0 | random | 16000 | rust | 14.6 ± 0.76 | 13.8 to 15.2 | 7.51 | 1.05 | 2352 |
| median3-k0 | random | 1000000 | cpp | 428 ± 10.3 | 416 to 436 | 424 | 89.8 | 11112 |
| median3-k0 | random | 1000000 | rust | 557 ± 91.3 | 469 to 651 | 534 | 121 | 13732 |
| median3-k0 | reversed | 4000 | cpp | 8.15 ± 1.93 | 6.90 to 10.4 | 3.00 | 0.05 | 3780 |
| median3-k0 | reversed | 4000 | rust | 12.8 ± 1.22 | 11.7 to 14.1 | 4.03 | 0.05 | 2220 |
| median3-k0 | reversed | 16000 | cpp | 21.9 ± 12.8 | 8.21 to 33.6 | 11.4 | 0.20 | 3908 |
| median3-k0 | reversed | 16000 | rust | 10.6 ± 1.17 | 9.66 to 11.9 | 3.25 | 0.42 | 2264 |
| median3-k0 | reversed | 1000000 | cpp | 171 ± 21.8 | 157 to 196 | 165 | 19.7 | 11164 |
| median3-k0 | reversed | 1000000 | rust | 137 ± 27.4 | 110 to 164 | 122 | 20.9 | 13620 |
| median3-k0 | sorted | 4000 | cpp | 16.4 ± 9.17 | 8.19 to 26.3 | 4.92 | 0.04 | 3900 |
| median3-k0 | sorted | 4000 | rust | 13.7 ± 3.25 | 11.8 to 17.4 | 3.42 | 0.06 | 1992 |
| median3-k0 | sorted | 16000 | cpp | 15.4 ± 3.48 | 11.7 to 18.6 | 4.54 | 0.17 | 3960 |
| median3-k0 | sorted | 16000 | rust | 13.7 ± 1.37 | 12.4 to 15.1 | 4.53 | 0.19 | 2264 |
| median3-k0 | sorted | 1000000 | cpp | 197 ± 31.6 | 178 to 234 | 181 | 17.8 | 11164 |
| median3-k0 | sorted | 1000000 | rust | 130 ± 8.66 | 122 to 139 | 121 | 16.9 | 13656 |
| median3-k10 | random | 4000 | cpp | 13.6 ± 9.21 | 7.24 to 24.1 | 4.82 | 0.13 | 3832 |
| median3-k10 | random | 4000 | rust | 17.0 ± 7.02 | 12.1 to 25.1 | 3.93 | 0.17 | 2232 |
| median3-k10 | random | 16000 | cpp | 14.9 ± 2.89 | 12.2 to 17.9 | 9.78 | 0.81 | 4028 |
| median3-k10 | random | 16000 | rust | 14.0 ± 0.45 | 13.7 to 14.5 | 6.72 | 0.78 | 2328 |
| median3-k10 | random | 1000000 | cpp | 395 ± 17.9 | 378 to 413 | 385 | 82.5 | 11124 |
| median3-k10 | random | 1000000 | rust | 419 ± 15.9 | 403 to 434 | 411 | 68.7 | 13704 |
| median3-k10 | reversed | 4000 | cpp | 6.33 ± 1.03 | 5.55 to 7.50 | 2.55 | 0.03 | 3900 |
| median3-k10 | reversed | 4000 | rust | 15.3 ± 1.59 | 13.7 to 16.9 | 4.93 | 0.05 | 2008 |
| median3-k10 | reversed | 16000 | cpp | 8.65 ± 2.04 | 7.45 to 11.0 | 4.62 | 0.15 | 3952 |
| median3-k10 | reversed | 16000 | rust | 16.2 ± 1.67 | 14.7 to 18.0 | 4.38 | 0.19 | 2308 |
| median3-k10 | reversed | 1000000 | cpp | 195 ± 7.79 | 187 to 202 | 188 | 9.45 | 11096 |
| median3-k10 | reversed | 1000000 | rust | 114 ± 26.1 | 84.1 to 133 | 106 | 9.68 | 13708 |
| median3-k10 | sorted | 4000 | cpp | 11.7 ± 4.74 | 7.41 to 16.8 | 3.24 | 0.03 | 3792 |
| median3-k10 | sorted | 4000 | rust | 16.9 ± 5.53 | 12.6 to 23.2 | 3.45 | 0.05 | 2052 |
| median3-k10 | sorted | 16000 | cpp | 12.9 ± 3.99 | 9.32 to 17.2 | 6.51 | 0.14 | 3952 |
| median3-k10 | sorted | 16000 | rust | 12.4 ± 1.53 | 10.7 to 13.6 | 4.01 | 0.21 | 2224 |
| median3-k10 | sorted | 1000000 | cpp | 209 ± 20.8 | 190 to 231 | 197 | 12.5 | 11124 |
| median3-k10 | sorted | 1000000 | rust | 121 ± 11.7 | 109 to 133 | 112 | 14.3 | 13772 |
| median3-k20 | random | 4000 | cpp | 6.74 ± 0.47 | 6.24 to 7.18 | 2.96 | 0.12 | 3816 |
| median3-k20 | random | 4000 | rust | 12.7 ± 1.39 | 11.4 to 14.2 | 3.45 | 0.12 | 2116 |
| median3-k20 | random | 16000 | cpp | 14.7 ± 2.10 | 12.5 to 16.7 | 9.34 | 0.73 | 3940 |
| median3-k20 | random | 16000 | rust | 13.4 ± 1.00 | 12.5 to 14.5 | 6.01 | 0.64 | 2248 |
| median3-k20 | random | 1000000 | cpp | 402 ± 26.8 | 372 to 423 | 392 | 74.6 | 11100 |
| median3-k20 | random | 1000000 | rust | 393 ± 52.4 | 333 to 426 | 382 | 69.6 | 13788 |
| median3-k20 | reversed | 4000 | cpp | 15.0 ± 3.47 | 12.5 to 19.0 | 4.35 | 0.03 | 3792 |
| median3-k20 | reversed | 4000 | rust | 12.1 ± 2.31 | 10.7 to 14.8 | 3.06 | 0.04 | 2232 |
| median3-k20 | reversed | 16000 | cpp | 8.79 ± 0.69 | 8.27 to 9.58 | 4.24 | 0.14 | 4028 |
| median3-k20 | reversed | 16000 | rust | 17.8 ± 8.34 | 12.0 to 27.4 | 5.11 | 0.14 | 2288 |
| median3-k20 | reversed | 1000000 | cpp | 245 ± 109 | 174 to 370 | 232 | 17.8 | 11136 |
| median3-k20 | reversed | 1000000 | rust | 113 ± 5.90 | 109 to 120 | 105 | 10.2 | 13716 |
| median3-k20 | sorted | 4000 | cpp | 6.81 ± 0.15 | 6.64 to 6.93 | 2.52 | 0.03 | 3688 |
| median3-k20 | sorted | 4000 | rust | 11.7 ± 3.06 | 8.84 to 14.9 | 2.82 | 0.02 | 2136 |
| median3-k20 | sorted | 16000 | cpp | 8.97 ± 3.05 | 6.99 to 12.5 | 3.87 | 0.17 | 4028 |
| median3-k20 | sorted | 16000 | rust | 11.3 ± 1.04 | 10.4 to 12.4 | 3.59 | 0.16 | 2276 |
| median3-k20 | sorted | 1000000 | cpp | 223 ± 23.3 | 203 to 249 | 215 | 18.5 | 11100 |
| median3-k20 | sorted | 1000000 | rust | 187 ± 21.9 | 166 to 210 | 159 | 15.4 | 13800 |
| median3-k5 | random | 4000 | cpp | 13.4 ± 8.42 | 7.61 to 23.1 | 6.81 | 0.18 | 3832 |
| median3-k5 | random | 4000 | rust | 11.1 ± 0.96 | 10.0 to 11.7 | 3.32 | 0.19 | 2136 |
| median3-k5 | random | 16000 | cpp | 18.8 ± 11.7 | 11.6 to 32.3 | 7.97 | 0.88 | 3936 |
| median3-k5 | random | 16000 | rust | 19.8 ± 4.37 | 16.5 to 24.7 | 8.49 | 1.01 | 2272 |
| median3-k5 | random | 1000000 | cpp | 487 ± 15.4 | 471 to 501 | 480 | 85.7 | 11148 |
| median3-k5 | random | 1000000 | rust | 453 ± 20.4 | 433 to 474 | 439 | 79.3 | 13620 |
| median3-k5 | reversed | 4000 | cpp | 8.86 ± 1.74 | 7.14 to 10.6 | 2.49 | 0.02 | 3780 |
| median3-k5 | reversed | 4000 | rust | 25.8 ± 20.9 | 12.7 to 49.9 | 3.53 | 0.05 | 2052 |
| median3-k5 | reversed | 16000 | cpp | 9.97 ± 1.45 | 9.01 to 11.6 | 4.52 | 0.18 | 4028 |
| median3-k5 | reversed | 16000 | rust | 54.3 ± 29.0 | 29.8 to 86.4 | 8.91 | 0.32 | 2300 |
| median3-k5 | reversed | 1000000 | cpp | 238 ± 35.3 | 201 to 272 | 223 | 16.3 | 11148 |
| median3-k5 | reversed | 1000000 | rust | 165 ± 6.19 | 158 to 170 | 148 | 25.2 | 13592 |
| median3-k5 | sorted | 4000 | cpp | 9.91 ± 1.40 | 8.58 to 11.4 | 2.80 | 0.04 | 3900 |
| median3-k5 | sorted | 4000 | rust | 13.6 ± 3.10 | 11.1 to 17.1 | 3.19 | 0.02 | 2004 |
| median3-k5 | sorted | 16000 | cpp | 19.3 ± 7.15 | 14.1 to 27.5 | 6.06 | 0.18 | 3940 |
| median3-k5 | sorted | 16000 | rust | 26.7 ± 13.3 | 11.5 to 36.2 | 10.0 | 0.20 | 2224 |
| median3-k5 | sorted | 1000000 | cpp | 202 ± 8.10 | 193 to 208 | 192 | 20.1 | 11180 |
| median3-k5 | sorted | 1000000 | rust | 192 ± 12.7 | 178 to 201 | 171 | 23.4 | 13684 |
| median3-k50 | random | 4000 | cpp | 11.6 ± 3.68 | 8.02 to 15.4 | 4.85 | 0.14 | 3832 |
| median3-k50 | random | 4000 | rust | 10.3 ± 0.66 | 9.52 to 10.7 | 2.87 | 0.15 | 2232 |
| median3-k50 | random | 16000 | cpp | 14.3 ± 0.68 | 13.8 to 15.1 | 6.64 | 0.76 | 4028 |
| median3-k50 | random | 16000 | rust | 18.7 ± 1.18 | 17.5 to 19.8 | 6.62 | 0.82 | 2012 |
| median3-k50 | random | 1000000 | cpp | 381 ± 11.9 | 368 to 392 | 372 | 68.1 | 11148 |
| median3-k50 | random | 1000000 | rust | 375 ± 18.6 | 357 to 394 | 367 | 65.7 | 13656 |
| median3-k50 | reversed | 4000 | cpp | 10.8 ± 5.94 | 6.83 to 17.6 | 2.84 | 0.02 | 3900 |
| median3-k50 | reversed | 4000 | rust | 9.88 ± 1.28 | 8.73 to 11.2 | 2.59 | 0.02 | 2212 |
| median3-k50 | reversed | 16000 | cpp | 8.08 ± 0.58 | 7.74 to 8.74 | 4.10 | 0.09 | 4028 |
| median3-k50 | reversed | 16000 | rust | 15.7 ± 3.18 | 12.3 to 18.5 | 4.30 | 0.18 | 2260 |
| median3-k50 | reversed | 1000000 | cpp | 156 ± 25.1 | 131 to 181 | 152 | 16.1 | 11148 |
| median3-k50 | reversed | 1000000 | rust | 160 ± 9.22 | 150 to 166 | 146 | 19.3 | 13780 |
| median3-k50 | sorted | 4000 | cpp | 6.79 ± 0.07 | 6.72 to 6.84 | 2.67 | 0.02 | 3824 |
| median3-k50 | sorted | 4000 | rust | 24.5 ± 16.1 | 15.1 to 43.1 | 3.29 | 0.04 | 2120 |
| median3-k50 | sorted | 16000 | cpp | 8.74 ± 1.50 | 7.24 to 10.2 | 3.65 | 0.11 | 3912 |
| median3-k50 | sorted | 16000 | rust | 10.6 ± 0.82 | 9.83 to 11.5 | 3.22 | 0.17 | 2260 |
| median3-k50 | sorted | 1000000 | cpp | 167 ± 14.3 | 150 to 176 | 157 | 11.3 | 11156 |
| median3-k50 | sorted | 1000000 | rust | 106 ± 1.38 | 105 to 107 | 97.0 | 7.98 | 13660 |
| random-k0 | random | 4000 | cpp | 15.2 ± 6.12 | 11.6 to 22.3 | 4.85 | 0.22 | 3824 |
| random-k0 | random | 4000 | rust | 18.9 ± 5.09 | 13.0 to 22.0 | 5.69 | 0.24 | 2096 |
| random-k0 | random | 16000 | cpp | 21.7 ± 4.80 | 18.7 to 27.2 | 10.1 | 1.09 | 3936 |
| random-k0 | random | 16000 | rust | 25.2 ± 4.64 | 20.0 to 29.0 | 11.0 | 1.13 | 2336 |
| random-k0 | random | 1000000 | cpp | 472 ± 25.9 | 450 to 501 | 465 | 91.1 | 11148 |
| random-k0 | random | 1000000 | rust | 676 ± 33.3 | 648 to 713 | 662 | 115 | 13612 |
| random-k0 | reversed | 4000 | cpp | 8.21 ± 1.46 | 6.61 to 9.45 | 3.58 | 0.07 | 3824 |
| random-k0 | reversed | 4000 | rust | 25.3 ± 9.60 | 14.2 to 31.2 | 5.63 | 0.09 | 2096 |
| random-k0 | reversed | 16000 | cpp | 14.5 ± 5.48 | 8.43 to 19.1 | 5.22 | 0.37 | 3900 |
| random-k0 | reversed | 16000 | rust | 15.3 ± 0.82 | 14.6 to 16.2 | 5.72 | 0.63 | 2220 |
| random-k0 | reversed | 1000000 | cpp | 220 ± 5.15 | 214 to 224 | 213 | 27.3 | 11148 |
| random-k0 | reversed | 1000000 | rust | 342 ± 49.0 | 305 to 397 | 316 | 46.9 | 13624 |
| random-k0 | sorted | 4000 | cpp | 9.19 ± 3.01 | 6.44 to 12.4 | 3.02 | 0.07 | 3832 |
| random-k0 | sorted | 4000 | rust | 14.5 ± 4.68 | 10.2 to 19.5 | 3.72 | 0.07 | 2124 |
| random-k0 | sorted | 16000 | cpp | 9.87 ± 1.88 | 8.72 to 12.0 | 5.64 | 0.29 | 3920 |
| random-k0 | sorted | 16000 | rust | 22.8 ± 9.07 | 15.3 to 32.9 | 7.22 | 0.30 | 2184 |
| random-k0 | sorted | 1000000 | cpp | 195 ± 9.20 | 188 to 206 | 191 | 28.2 | 11100 |
| random-k0 | sorted | 1000000 | rust | 267 ± 14.3 | 255 to 283 | 248 | 41.0 | 13484 |

## Commands

- `cpp`: `cpp/build/bench first-k0 random 4000`
- `rust`: `rust/target/release/hybrid-quicksort first-k0 random 4000`
- `cpp`: `cpp/build/bench first-k0 random 16000`
- `rust`: `rust/target/release/hybrid-quicksort first-k0 random 16000`
- `cpp`: `cpp/build/bench first-k0 reversed 4000`
- `rust`: `rust/target/release/hybrid-quicksort first-k0 reversed 4000`
- `cpp`: `cpp/build/bench first-k0 reversed 16000`
- `rust`: `rust/target/release/hybrid-quicksort first-k0 reversed 16000`
- `cpp`: `cpp/build/bench first-k0 sorted 4000`
- `rust`: `rust/target/release/hybrid-quicksort first-k0 sorted 4000`
- `cpp`: `cpp/build/bench first-k0 sorted 16000`
- `rust`: `rust/target/release/hybrid-quicksort first-k0 sorted 16000`
- `cpp`: `cpp/build/bench median3-k0 random 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 random 4000`
- `cpp`: `cpp/build/bench median3-k0 random 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 random 16000`
- `cpp`: `cpp/build/bench median3-k0 random 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 random 1000000`
- `cpp`: `cpp/build/bench median3-k0 reversed 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 reversed 4000`
- `cpp`: `cpp/build/bench median3-k0 reversed 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 reversed 16000`
- `cpp`: `cpp/build/bench median3-k0 reversed 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 reversed 1000000`
- `cpp`: `cpp/build/bench median3-k0 sorted 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 sorted 4000`
- `cpp`: `cpp/build/bench median3-k0 sorted 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 sorted 16000`
- `cpp`: `cpp/build/bench median3-k0 sorted 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k0 sorted 1000000`
- `cpp`: `cpp/build/bench median3-k10 random 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 random 4000`
- `cpp`: `cpp/build/bench median3-k10 random 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 random 16000`
- `cpp`: `cpp/build/bench median3-k10 random 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 random 1000000`
- `cpp`: `cpp/build/bench median3-k10 reversed 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 reversed 4000`
- `cpp`: `cpp/build/bench median3-k10 reversed 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 reversed 16000`
- `cpp`: `cpp/build/bench median3-k10 reversed 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 reversed 1000000`
- `cpp`: `cpp/build/bench median3-k10 sorted 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 sorted 4000`
- `cpp`: `cpp/build/bench median3-k10 sorted 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 sorted 16000`
- `cpp`: `cpp/build/bench median3-k10 sorted 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k10 sorted 1000000`
- `cpp`: `cpp/build/bench median3-k20 random 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 random 4000`
- `cpp`: `cpp/build/bench median3-k20 random 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 random 16000`
- `cpp`: `cpp/build/bench median3-k20 random 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 random 1000000`
- `cpp`: `cpp/build/bench median3-k20 reversed 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 reversed 4000`
- `cpp`: `cpp/build/bench median3-k20 reversed 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 reversed 16000`
- `cpp`: `cpp/build/bench median3-k20 reversed 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 reversed 1000000`
- `cpp`: `cpp/build/bench median3-k20 sorted 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 sorted 4000`
- `cpp`: `cpp/build/bench median3-k20 sorted 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 sorted 16000`
- `cpp`: `cpp/build/bench median3-k20 sorted 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k20 sorted 1000000`
- `cpp`: `cpp/build/bench median3-k5 random 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 random 4000`
- `cpp`: `cpp/build/bench median3-k5 random 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 random 16000`
- `cpp`: `cpp/build/bench median3-k5 random 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 random 1000000`
- `cpp`: `cpp/build/bench median3-k5 reversed 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 reversed 4000`
- `cpp`: `cpp/build/bench median3-k5 reversed 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 reversed 16000`
- `cpp`: `cpp/build/bench median3-k5 reversed 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 reversed 1000000`
- `cpp`: `cpp/build/bench median3-k5 sorted 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 sorted 4000`
- `cpp`: `cpp/build/bench median3-k5 sorted 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 sorted 16000`
- `cpp`: `cpp/build/bench median3-k5 sorted 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k5 sorted 1000000`
- `cpp`: `cpp/build/bench median3-k50 random 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 random 4000`
- `cpp`: `cpp/build/bench median3-k50 random 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 random 16000`
- `cpp`: `cpp/build/bench median3-k50 random 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 random 1000000`
- `cpp`: `cpp/build/bench median3-k50 reversed 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 reversed 4000`
- `cpp`: `cpp/build/bench median3-k50 reversed 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 reversed 16000`
- `cpp`: `cpp/build/bench median3-k50 reversed 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 reversed 1000000`
- `cpp`: `cpp/build/bench median3-k50 sorted 4000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 sorted 4000`
- `cpp`: `cpp/build/bench median3-k50 sorted 16000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 sorted 16000`
- `cpp`: `cpp/build/bench median3-k50 sorted 1000000`
- `rust`: `rust/target/release/hybrid-quicksort median3-k50 sorted 1000000`
- `cpp`: `cpp/build/bench random-k0 random 4000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 random 4000`
- `cpp`: `cpp/build/bench random-k0 random 16000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 random 16000`
- `cpp`: `cpp/build/bench random-k0 random 1000000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 random 1000000`
- `cpp`: `cpp/build/bench random-k0 reversed 4000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 reversed 4000`
- `cpp`: `cpp/build/bench random-k0 reversed 16000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 reversed 16000`
- `cpp`: `cpp/build/bench random-k0 reversed 1000000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 reversed 1000000`
- `cpp`: `cpp/build/bench random-k0 sorted 4000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 sorted 4000`
- `cpp`: `cpp/build/bench random-k0 sorted 16000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 sorted 16000`
- `cpp`: `cpp/build/bench random-k0 sorted 1000000`
- `rust`: `rust/target/release/hybrid-quicksort random-k0 sorted 1000000`
