# Benchmark: dynamic-programming

Generated at 2026-10-07T23:37:09.770Z. 3 runs per row after 1 warm-up run(s).

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
- python: Python 3.14.8 (python:3.14.8-slim-trixie)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| coins-memo | default | 8 | python | 128 ± 19.6 | 106 to 140 | 63.6 | 0.03 | 11984 |
| coins-memo | default | 8 | ts | 36.6 ± 7.55 | 28.3 to 43.2 | 14.9 | 0.27 | 17840 |
| coins-memo | default | 12 | python | 107 ± 8.39 | 102 to 117 | 52.5 | 0.04 | 11856 |
| coins-memo | default | 12 | ts | 44.5 ± 6.82 | 37.4 to 51.1 | 15.7 | 0.75 | 17964 |
| coins-memo | default | 16 | python | 123 ± 12.2 | 109 to 132 | 58.3 | 0.03 | 11776 |
| coins-memo | default | 16 | ts | 64.3 ± 5.14 | 59.0 to 69.2 | 16.3 | 0.40 | 18676 |
| coins-memo | default | 20 | python | 220 ± 42.1 | 175 to 259 | 84.2 | 0.06 | 11836 |
| coins-memo | default | 20 | ts | 64.1 ± 2.27 | 61.7 to 66.3 | 21.7 | 0.44 | 18152 |
| coins-memo | default | 100 | python | 161 ± 21.1 | 137 to 175 | 79.0 | 0.60 | 11612 |
| coins-memo | default | 100 | ts | 58.4 ± 4.94 | 52.8 to 62.1 | 18.4 | 0.52 | 18052 |
| coins-memo | default | 500 | python | 167 ± 7.72 | 162 to 176 | 78.5 | 2.98 | 12380 |
| coins-memo | default | 500 | ts | 82.0 ± 32.5 | 48.4 to 113 | 22.2 | 7.19 | 20904 |
| coins-naive | default | 8 | python | 137 ± 31.1 | 114 to 173 | 63.4 | 0.06 | 12044 |
| coins-naive | default | 8 | ts | 107 ± 23.5 | 88.9 to 134 | 20.0 | 0.90 | 18528 |
| coins-naive | default | 12 | python | 196 ± 35.6 | 155 to 220 | 84.5 | 0.39 | 11860 |
| coins-naive | default | 12 | ts | 37.3 ± 9.18 | 30.3 to 47.7 | 15.8 | 0.66 | 18924 |
| coins-naive | default | 16 | python | 117 ± 19.4 | 102 to 139 | 56.2 | 1.69 | 11780 |
| coins-naive | default | 16 | ts | 54.9 ± 41.3 | 30.3 to 103 | 16.4 | 1.14 | 21564 |
| coins-naive | default | 20 | python | 121 ± 18.7 | 101 to 138 | 67.5 | 9.77 | 12056 |
| coins-naive | default | 20 | ts | 117 ± 68.6 | 43.3 to 179 | 37.1 | 8.28 | 24928 |
| coins-tab | default | 8 | python | 150 ± 6.64 | 145 to 158 | 70.3 | 0.01 | 11556 |
| coins-tab | default | 8 | ts | 49.0 ± 9.15 | 41.6 to 59.3 | 18.9 | 0.27 | 17384 |
| coins-tab | default | 12 | python | 176 ± 48.1 | 135 to 229 | 73.1 | 0.02 | 11408 |
| coins-tab | default | 12 | ts | 37.2 ± 9.32 | 29.2 to 47.4 | 16.8 | 0.24 | 17632 |
| coins-tab | default | 16 | python | 131 ± 11.5 | 119 to 142 | 63.4 | 0.02 | 11864 |
| coins-tab | default | 16 | ts | 60.3 ± 22.1 | 36.8 to 80.5 | 30.9 | 0.24 | 17576 |
| coins-tab | default | 20 | python | 102 ± 3.81 | 98.1 to 105 | 49.6 | 0.01 | 12048 |
| coins-tab | default | 20 | ts | 40.0 ± 11.9 | 28.7 to 52.4 | 19.2 | 0.23 | 17424 |
| coins-tab | default | 100 | python | 193 ± 22.6 | 167 to 211 | 76.0 | 0.06 | 11592 |
| coins-tab | default | 100 | ts | 26.4 ± 1.29 | 25.4 to 27.8 | 11.4 | 0.43 | 18748 |
| coins-tab | default | 500 | python | 122 ± 15.0 | 106 to 135 | 54.9 | 0.13 | 11984 |
| coins-tab | default | 500 | ts | 30.9 ± 5.62 | 27.3 to 37.4 | 13.7 | 0.45 | 19260 |
| knapsack-memo | default | 8 | python | 179 ± 49.3 | 140 to 235 | 71.7 | 0.11 | 11520 |
| knapsack-memo | default | 8 | ts | 45.1 ± 19.1 | 31.0 to 66.8 | 26.2 | 1.87 | 19040 |
| knapsack-memo | default | 12 | python | 153 ± 15.4 | 137 to 168 | 73.3 | 0.70 | 11384 |
| knapsack-memo | default | 12 | ts | 146 ± 44.7 | 113 to 197 | 30.9 | 3.34 | 21096 |
| knapsack-memo | default | 16 | python | 151 ± 23.0 | 124 to 164 | 68.5 | 1.12 | 11860 |
| knapsack-memo | default | 16 | ts | 180 ± 6.74 | 173 to 186 | 32.1 | 1.33 | 21312 |
| knapsack-memo | default | 20 | python | 120 ± 25.9 | 95.9 to 147 | 61.5 | 1.56 | 11812 |
| knapsack-memo | default | 20 | ts | 49.5 ± 8.94 | 40.9 to 58.8 | 21.4 | 3.69 | 21188 |
| knapsack-memo | default | 100 | python | 272 ± 45.2 | 222 to 309 | 142 | 56.9 | 16380 |
| knapsack-memo | default | 100 | ts | 413 ± 233 | 206 to 666 | 36.1 | 3.69 | 24892 |
| knapsack-memo | default | 500 | python | 2629 ± 142 | 2465 to 2721 | 2524 | 2116 | 179304 |
| knapsack-memo | default | 500 | ts | 78.1 ± 9.71 | 69.0 to 88.3 | 57.7 | 30.9 | 38264 |
| knapsack-naive | default | 8 | python | 181 ± 29.3 | 147 to 199 | 74.6 | 0.05 | 11484 |
| knapsack-naive | default | 8 | ts | 27.4 ± 4.73 | 24.1 to 32.8 | 12.4 | 0.43 | 18992 |
| knapsack-naive | default | 12 | python | 264 ± 111 | 184 to 391 | 104 | 1.18 | 11824 |
| knapsack-naive | default | 12 | ts | 62.3 ± 18.3 | 45.3 to 81.6 | 23.4 | 1.91 | 23356 |
| knapsack-naive | default | 16 | python | 269 ± 142 | 166 to 430 | 106 | 20.0 | 11856 |
| knapsack-naive | default | 16 | ts | 55.8 ± 2.21 | 53.9 to 58.2 | 29.1 | 4.20 | 26556 |
| knapsack-naive | default | 20 | python | 410 ± 43.3 | 367 to 454 | 276 | 183 | 11628 |
| knapsack-naive | default | 20 | ts | 85.4 ± 17.9 | 65.4 to 99.7 | 54.3 | 12.3 | 27664 |
| knapsack-tab | default | 8 | python | 242 ± 51.9 | 194 to 297 | 81.1 | 0.10 | 11580 |
| knapsack-tab | default | 8 | ts | 34.8 ± 2.31 | 32.5 to 37.1 | 17.4 | 0.79 | 18096 |
| knapsack-tab | default | 12 | python | 204 ± 32.6 | 181 to 241 | 64.5 | 0.16 | 11756 |
| knapsack-tab | default | 12 | ts | 28.6 ± 3.37 | 24.7 to 31.0 | 12.2 | 1.01 | 19216 |
| knapsack-tab | default | 16 | python | 212 ± 22.7 | 187 to 231 | 75.2 | 0.32 | 11604 |
| knapsack-tab | default | 16 | ts | 85.0 ± 55.2 | 37.2 to 145 | 25.7 | 1.54 | 19716 |
| knapsack-tab | default | 20 | python | 157 ± 14.5 | 147 to 174 | 68.2 | 0.36 | 11600 |
| knapsack-tab | default | 20 | ts | 115 ± 87.6 | 59.3 to 216 | 30.6 | 1.48 | 19908 |
| knapsack-tab | default | 100 | python | 217 ± 85.7 | 162 to 316 | 84.5 | 9.85 | 12560 |
| knapsack-tab | default | 100 | ts | 61.7 ± 17.2 | 47.8 to 81.0 | 31.5 | 3.78 | 25556 |
| knapsack-tab | default | 500 | python | 511 ± 32.6 | 474 to 536 | 410 | 377 | 45460 |
| knapsack-tab | default | 500 | ts | 72.5 ± 27.5 | 56.1 to 104 | 47.5 | 24.6 | 39760 |
| lcs-memo | default | 8 | python | 181 ± 46.1 | 128 to 212 | 70.9 | 0.07 | 11680 |
| lcs-memo | default | 8 | ts | 45.2 ± 12.7 | 33.9 to 58.9 | 17.4 | 0.82 | 19516 |
| lcs-memo | default | 12 | python | 99.6 ± 16.2 | 86.9 to 118 | 46.2 | 0.13 | 12044 |
| lcs-memo | default | 12 | ts | 40.5 ± 5.49 | 34.9 to 45.8 | 16.1 | 0.72 | 19296 |
| lcs-memo | default | 16 | python | 112 ± 8.64 | 106 to 122 | 52.0 | 0.12 | 11528 |
| lcs-memo | default | 16 | ts | 43.6 ± 5.25 | 37.7 to 47.6 | 17.7 | 1.68 | 21996 |
| lcs-memo | default | 20 | python | 170 ± 25.8 | 141 to 188 | 71.1 | 0.31 | 11636 |
| lcs-memo | default | 20 | ts | 41.4 ± 8.86 | 34.4 to 51.4 | 16.2 | 1.44 | 21412 |
| lcs-memo | default | 100 | python | 175 ± 13.5 | 160 to 186 | 91.9 | 14.0 | 12528 |
| lcs-memo | default | 100 | ts | 98.9 ± 46.2 | 46.8 to 135 | 37.4 | 6.63 | 24256 |
| lcs-memo | default | 500 | python | 467 ± 103 | 389 to 584 | 354 | 261 | 30984 |
| lcs-memo | default | 500 | ts | 67.3 ± 10.7 | 55.3 to 76.2 | 35.1 | 8.50 | 30648 |
| lcs-naive | default | 8 | python | 239 ± 55.1 | 205 to 303 | 96.2 | 0.87 | 11664 |
| lcs-naive | default | 8 | ts | 150 ± 60.9 | 82.7 to 201 | 35.8 | 2.02 | 23412 |
| lcs-naive | default | 12 | python | 248 ± 57.5 | 188 to 303 | 116 | 45.7 | 11776 |
| lcs-naive | default | 12 | ts | 92.4 ± 7.78 | 87.8 to 101 | 28.2 | 5.74 | 24248 |
| lcs-tab | default | 8 | python | 228 ± 41.3 | 183 to 264 | 78.9 | 0.06 | 11568 |
| lcs-tab | default | 8 | ts | 47.5 ± 10.8 | 38.0 to 59.3 | 15.7 | 0.79 | 18608 |
| lcs-tab | default | 12 | python | 139 ± 7.43 | 131 to 145 | 61.6 | 0.06 | 11340 |
| lcs-tab | default | 12 | ts | 63.0 ± 5.65 | 58.4 to 69.3 | 22.9 | 0.89 | 18312 |
| lcs-tab | default | 16 | python | 169 ± 30.9 | 135 to 194 | 68.2 | 0.09 | 11940 |
| lcs-tab | default | 16 | ts | 112 ± 16.2 | 93.3 to 123 | 22.9 | 2.52 | 18344 |
| lcs-tab | default | 20 | python | 129 ± 22.2 | 110 to 153 | 57.5 | 0.10 | 11592 |
| lcs-tab | default | 20 | ts | 73.1 ± 4.56 | 69.8 to 78.3 | 29.4 | 6.48 | 19248 |
| lcs-tab | default | 100 | python | 133 ± 15.8 | 119 to 150 | 61.0 | 2.14 | 11704 |
| lcs-tab | default | 100 | ts | 148 ± 27.5 | 117 to 169 | 33.8 | 6.57 | 25084 |
| lcs-tab | default | 500 | python | 272 ± 16.3 | 253 to 283 | 136 | 57.6 | 13364 |
| lcs-tab | default | 500 | ts | 81.2 ± 13.0 | 70.8 to 95.8 | 40.5 | 15.2 | 30640 |

## Commands

- `python`: `python python/bench.py coins-memo 8`
- `ts`: `bun run ts/src/bench.ts coins-memo 8`
- `python`: `python python/bench.py coins-memo 12`
- `ts`: `bun run ts/src/bench.ts coins-memo 12`
- `python`: `python python/bench.py coins-memo 16`
- `ts`: `bun run ts/src/bench.ts coins-memo 16`
- `python`: `python python/bench.py coins-memo 20`
- `ts`: `bun run ts/src/bench.ts coins-memo 20`
- `python`: `python python/bench.py coins-memo 100`
- `ts`: `bun run ts/src/bench.ts coins-memo 100`
- `python`: `python python/bench.py coins-memo 500`
- `ts`: `bun run ts/src/bench.ts coins-memo 500`
- `python`: `python python/bench.py coins-naive 8`
- `ts`: `bun run ts/src/bench.ts coins-naive 8`
- `python`: `python python/bench.py coins-naive 12`
- `ts`: `bun run ts/src/bench.ts coins-naive 12`
- `python`: `python python/bench.py coins-naive 16`
- `ts`: `bun run ts/src/bench.ts coins-naive 16`
- `python`: `python python/bench.py coins-naive 20`
- `ts`: `bun run ts/src/bench.ts coins-naive 20`
- `python`: `python python/bench.py coins-tab 8`
- `ts`: `bun run ts/src/bench.ts coins-tab 8`
- `python`: `python python/bench.py coins-tab 12`
- `ts`: `bun run ts/src/bench.ts coins-tab 12`
- `python`: `python python/bench.py coins-tab 16`
- `ts`: `bun run ts/src/bench.ts coins-tab 16`
- `python`: `python python/bench.py coins-tab 20`
- `ts`: `bun run ts/src/bench.ts coins-tab 20`
- `python`: `python python/bench.py coins-tab 100`
- `ts`: `bun run ts/src/bench.ts coins-tab 100`
- `python`: `python python/bench.py coins-tab 500`
- `ts`: `bun run ts/src/bench.ts coins-tab 500`
- `python`: `python python/bench.py knapsack-memo 8`
- `ts`: `bun run ts/src/bench.ts knapsack-memo 8`
- `python`: `python python/bench.py knapsack-memo 12`
- `ts`: `bun run ts/src/bench.ts knapsack-memo 12`
- `python`: `python python/bench.py knapsack-memo 16`
- `ts`: `bun run ts/src/bench.ts knapsack-memo 16`
- `python`: `python python/bench.py knapsack-memo 20`
- `ts`: `bun run ts/src/bench.ts knapsack-memo 20`
- `python`: `python python/bench.py knapsack-memo 100`
- `ts`: `bun run ts/src/bench.ts knapsack-memo 100`
- `python`: `python python/bench.py knapsack-memo 500`
- `ts`: `bun run ts/src/bench.ts knapsack-memo 500`
- `python`: `python python/bench.py knapsack-naive 8`
- `ts`: `bun run ts/src/bench.ts knapsack-naive 8`
- `python`: `python python/bench.py knapsack-naive 12`
- `ts`: `bun run ts/src/bench.ts knapsack-naive 12`
- `python`: `python python/bench.py knapsack-naive 16`
- `ts`: `bun run ts/src/bench.ts knapsack-naive 16`
- `python`: `python python/bench.py knapsack-naive 20`
- `ts`: `bun run ts/src/bench.ts knapsack-naive 20`
- `python`: `python python/bench.py knapsack-tab 8`
- `ts`: `bun run ts/src/bench.ts knapsack-tab 8`
- `python`: `python python/bench.py knapsack-tab 12`
- `ts`: `bun run ts/src/bench.ts knapsack-tab 12`
- `python`: `python python/bench.py knapsack-tab 16`
- `ts`: `bun run ts/src/bench.ts knapsack-tab 16`
- `python`: `python python/bench.py knapsack-tab 20`
- `ts`: `bun run ts/src/bench.ts knapsack-tab 20`
- `python`: `python python/bench.py knapsack-tab 100`
- `ts`: `bun run ts/src/bench.ts knapsack-tab 100`
- `python`: `python python/bench.py knapsack-tab 500`
- `ts`: `bun run ts/src/bench.ts knapsack-tab 500`
- `python`: `python python/bench.py lcs-memo 8`
- `ts`: `bun run ts/src/bench.ts lcs-memo 8`
- `python`: `python python/bench.py lcs-memo 12`
- `ts`: `bun run ts/src/bench.ts lcs-memo 12`
- `python`: `python python/bench.py lcs-memo 16`
- `ts`: `bun run ts/src/bench.ts lcs-memo 16`
- `python`: `python python/bench.py lcs-memo 20`
- `ts`: `bun run ts/src/bench.ts lcs-memo 20`
- `python`: `python python/bench.py lcs-memo 100`
- `ts`: `bun run ts/src/bench.ts lcs-memo 100`
- `python`: `python python/bench.py lcs-memo 500`
- `ts`: `bun run ts/src/bench.ts lcs-memo 500`
- `python`: `python python/bench.py lcs-naive 8`
- `ts`: `bun run ts/src/bench.ts lcs-naive 8`
- `python`: `python python/bench.py lcs-naive 12`
- `ts`: `bun run ts/src/bench.ts lcs-naive 12`
- `python`: `python python/bench.py lcs-tab 8`
- `ts`: `bun run ts/src/bench.ts lcs-tab 8`
- `python`: `python python/bench.py lcs-tab 12`
- `ts`: `bun run ts/src/bench.ts lcs-tab 12`
- `python`: `python python/bench.py lcs-tab 16`
- `ts`: `bun run ts/src/bench.ts lcs-tab 16`
- `python`: `python python/bench.py lcs-tab 20`
- `ts`: `bun run ts/src/bench.ts lcs-tab 20`
- `python`: `python python/bench.py lcs-tab 100`
- `ts`: `bun run ts/src/bench.ts lcs-tab 100`
- `python`: `python python/bench.py lcs-tab 500`
- `ts`: `bun run ts/src/bench.ts lcs-tab 500`
