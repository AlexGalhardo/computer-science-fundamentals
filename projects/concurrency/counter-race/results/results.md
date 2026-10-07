# Benchmark: counter-race

Generated at 2026-10-07T23:00:16.357Z. 5 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- go: go version go1.27.1 linux/amd64 (sef-bench-counter-race-go:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-counter-race-rust:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-counter-race-java:local)
- ts: 1.4.2 (sef-bench-counter-race-ts:local)
- elixir: 1.20.4 (sef-bench-counter-race-elixir:local)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| actor | 1 | 1000000 | elixir | 1211 ± 193 | 966 to 1408 | 3516 | 222 | 113016 |
| actor | 2 | 1000000 | elixir | 1452 ± 70.1 | 1378 to 1547 | 4425 | 220 | 115044 |
| actor | 4 | 1000000 | elixir | 1447 ± 246 | 1096 to 1662 | 4572 | 268 | 126456 |
| actor | 8 | 1000000 | elixir | 2675 ± 891 | 1849 to 4015 | 7974 | 280 | 128760 |
| atomic | 1 | 1000000 | go | 6.01 ± 1.05 | 5.06 to 7.29 | 6.55 | 2.10 | 3232 |
| atomic | 1 | 1000000 | java | 149 ± 19.5 | 129 to 173 | 242 | 27.7 | 46112 |
| atomic | 1 | 1000000 | rust | 4.43 ± 0.36 | 4.05 to 4.83 | 3.01 | 8.05 | 2440 |
| atomic | 1 | 1000000 | ts | 77.8 ± 17.5 | 58.2 to 106 | 115 | 32.2 | 40344 |
| atomic | 2 | 1000000 | go | 12.3 ± 2.76 | 9.40 to 16.1 | 15.3 | 5.79 | 3232 |
| atomic | 2 | 1000000 | java | 165 ± 25.2 | 142 to 195 | 285 | 30.1 | 46040 |
| atomic | 2 | 1000000 | rust | 11.3 ± 0.98 | 10.2 to 12.9 | 14.6 | 9.47 | 2444 |
| atomic | 2 | 1000000 | ts | 124 ± 32.6 | 84.0 to 161 | 292 | 61.6 | 45700 |
| atomic | 4 | 1000000 | go | 15.5 ± 1.03 | 14.0 to 16.7 | 47.1 | 9.46 | 3360 |
| atomic | 4 | 1000000 | java | 218 ± 38.2 | 159 to 257 | 398 | 54.9 | 45760 |
| atomic | 4 | 1000000 | rust | 15.1 ± 3.16 | 9.98 to 18.4 | 35.2 | 13.0 | 2268 |
| atomic | 4 | 1000000 | ts | 90.0 ± 8.30 | 77.9 to 101 | 241 | 52.8 | 53772 |
| atomic | 8 | 1000000 | go | 17.2 ± 1.04 | 15.6 to 18.0 | 93.2 | 13.4 | 3360 |
| atomic | 8 | 1000000 | java | 180 ± 31.9 | 155 to 235 | 421 | 75.7 | 46512 |
| atomic | 8 | 1000000 | rust | 15.9 ± 0.58 | 15.3 to 16.8 | 80.2 | 14.7 | 2360 |
| atomic | 8 | 1000000 | ts | 172 ± 43.4 | 129 to 223 | 649 | 98.3 | 67908 |
| buggy | 1 | 1000000 | go | 4.77 ± 0.72 | 3.74 to 5.73 | 5.16 | 1.42 | 3232 |
| buggy | 1 | 1000000 | java | 114 ± 10.1 | 98.4 to 123 | 152 | 20.2 | 45960 |
| buggy | 1 | 1000000 | rust | 3.84 ± 0.41 | 3.34 to 4.39 | 3.02 | 1.72 | 2368 |
| buggy | 1 | 1000000 | ts | 80.3 ± 20.6 | 60.9 to 114 | 143 | 34.7 | 40024 |
| buggy | 2 | 1000000 | go | 7.26 ± 1.42 | 4.78 to 8.38 | 11.6 | 3.62 | 3232 |
| buggy | 2 | 1000000 | java | 125 ± 22.5 | 107 to 158 | 180 | 24.2 | 45732 |
| buggy | 2 | 1000000 | rust | 6.08 ± 1.13 | 4.39 to 6.94 | 6.93 | 5.31 | 2316 |
| buggy | 2 | 1000000 | ts | 81.2 ± 65.2 | 42.1 to 197 | 216 | 69.5 | 45704 |
| buggy | 4 | 1000000 | go | 7.91 ± 1.26 | 6.51 to 9.00 | 13.8 | 5.44 | 3360 |
| buggy | 4 | 1000000 | java | 145 ± 9.11 | 130 to 155 | 225 | 30.1 | 45980 |
| buggy | 4 | 1000000 | rust | 7.79 ± 0.25 | 7.54 to 8.13 | 17.1 | 6.04 | 2316 |
| buggy | 4 | 1000000 | ts | 79.4 ± 15.9 | 66.2 to 106 | 203 | 47.2 | 52696 |
| buggy | 8 | 1000000 | go | 10.2 ± 1.59 | 8.67 to 12.8 | 36.7 | 6.38 | 3360 |
| buggy | 8 | 1000000 | java | 138 ± 22.1 | 110 to 167 | 295 | 44.6 | 46340 |
| buggy | 8 | 1000000 | rust | 9.77 ± 0.48 | 9.28 to 10.5 | 19.6 | 7.84 | 2316 |
| buggy | 8 | 1000000 | ts | 99.4 ± 24.4 | 66.5 to 131 | 359 | 70.1 | 67816 |
| channel | 1 | 1000000 | go | 433 ± 58.3 | 378 to 530 | 521 | 504 | 3360 |
| channel | 1 | 1000000 | rust | 42.3 ± 4.71 | 38.3 to 49.9 | 59.6 | 46.5 | 9532 |
| channel | 2 | 1000000 | go | 444 ± 35.0 | 405 to 491 | 642 | 436 | 3232 |
| channel | 2 | 1000000 | rust | 43.2 ± 2.60 | 39.2 to 46.0 | 96.3 | 49.2 | 6964 |
| channel | 4 | 1000000 | go | 366 ± 22.8 | 344 to 402 | 573 | 473 | 3360 |
| channel | 4 | 1000000 | rust | 48.5 ± 5.90 | 42.8 to 57.8 | 175 | 50.2 | 8132 |
| channel | 8 | 1000000 | go | 548 ± 45.8 | 476 to 601 | 1059 | 497 | 3488 |
| channel | 8 | 1000000 | rust | 55.2 ± 5.02 | 50.5 to 62.9 | 367 | 50.1 | 7096 |
| get-then-set | 1 | 1000000 | elixir | 3068 ± 321 | 2700 to 3447 | 4425 | 1279 | 107800 |
| get-then-set | 2 | 1000000 | elixir | 2310 ± 233 | 1991 to 2604 | 6088 | 1387 | 111324 |
| get-then-set | 4 | 1000000 | elixir | 2546 ± 390 | 2055 to 3053 | 6519 | 1437 | 111112 |
| get-then-set | 8 | 1000000 | elixir | 2459 ± 305 | 2099 to 2872 | 7691 | 1406 | 118316 |
| message | 1 | 1000000 | ts | 1165 ± 116 | 1038 to 1300 | 1581 | 1229 | 247636 |
| message | 2 | 1000000 | ts | 1208 ± 147 | 1006 to 1359 | 1693 | 1075 | 273212 |
| message | 4 | 1000000 | ts | 1455 ± 48.7 | 1389 to 1503 | 2002 | 1446 | 283864 |
| message | 8 | 1000000 | ts | 1138 ± 112 | 1037 to 1304 | 1917 | 1053 | 295776 |
| mutex | 1 | 1000000 | go | 9.40 ± 1.57 | 8.36 to 11.9 | 10.2 | 5.16 | 3232 |
| mutex | 1 | 1000000 | java | 154 ± 21.1 | 127 to 182 | 254 | 32.5 | 45640 |
| mutex | 1 | 1000000 | rust | 7.04 ± 0.55 | 6.22 to 7.71 | 4.80 | 5.09 | 2448 |
| mutex | 1 | 1000000 | ts | 120 ± 24.4 | 86.2 to 155 | 145 | 72.7 | 41392 |
| mutex | 2 | 1000000 | go | 12.0 ± 1.36 | 10.9 to 13.6 | 18.0 | 7.47 | 3232 |
| mutex | 2 | 1000000 | java | 178 ± 33.2 | 125 to 215 | 291 | 36.2 | 45732 |
| mutex | 2 | 1000000 | rust | 15.8 ± 2.14 | 13.4 to 19.0 | 22.1 | 11.1 | 2320 |
| mutex | 2 | 1000000 | ts | 137 ± 11.4 | 123 to 152 | 257 | 113 | 47088 |
| mutex | 4 | 1000000 | go | 15.9 ± 1.93 | 12.6 to 17.5 | 40.1 | 14.5 | 3232 |
| mutex | 4 | 1000000 | java | 255 ± 67.5 | 195 to 367 | 303 | 85.4 | 45436 |
| mutex | 4 | 1000000 | rust | 20.4 ± 2.02 | 18.0 to 22.4 | 60.6 | 20.6 | 2432 |
| mutex | 4 | 1000000 | ts | 178 ± 28.8 | 156 to 228 | 598 | 120 | 56096 |
| mutex | 8 | 1000000 | go | 27.2 ± 2.25 | 23.4 to 29.0 | 73.1 | 26.2 | 3360 |
| mutex | 8 | 1000000 | java | 231 ± 78.5 | 150 to 352 | 328 | 58.6 | 46132 |
| mutex | 8 | 1000000 | rust | 19.1 ± 4.98 | 13.8 to 25.6 | 36.7 | 20.7 | 2332 |
| mutex | 8 | 1000000 | ts | 261 ± 40.8 | 228 to 315 | 790 | 166 | 68616 |
| queue | 1 | 1000000 | java | 327 ± 33.3 | 277 to 363 | 577 | 201 | 54956 |
| queue | 2 | 1000000 | java | 520 ± 84.1 | 424 to 619 | 630 | 477 | 52376 |
| queue | 4 | 1000000 | java | 568 ± 72.2 | 497 to 673 | 707 | 376 | 51592 |
| queue | 8 | 1000000 | java | 659 ± 50.4 | 609 to 720 | 853 | 715 | 53112 |

## Commands

- `elixir`: `env WORKERS=1 counter-race-elixir actor 1000000`
- `elixir`: `env WORKERS=2 counter-race-elixir actor 1000000`
- `elixir`: `env WORKERS=4 counter-race-elixir actor 1000000`
- `elixir`: `env WORKERS=8 counter-race-elixir actor 1000000`
- `go`: `env WORKERS=1 counter-race-go atomic 1000000`
- `java`: `env WORKERS=1 counter-race-java atomic 1000000`
- `rust`: `env WORKERS=1 counter-race-rust atomic 1000000`
- `ts`: `env WORKERS=1 counter-race-ts atomic 1000000`
- `go`: `env WORKERS=2 counter-race-go atomic 1000000`
- `java`: `env WORKERS=2 counter-race-java atomic 1000000`
- `rust`: `env WORKERS=2 counter-race-rust atomic 1000000`
- `ts`: `env WORKERS=2 counter-race-ts atomic 1000000`
- `go`: `env WORKERS=4 counter-race-go atomic 1000000`
- `java`: `env WORKERS=4 counter-race-java atomic 1000000`
- `rust`: `env WORKERS=4 counter-race-rust atomic 1000000`
- `ts`: `env WORKERS=4 counter-race-ts atomic 1000000`
- `go`: `env WORKERS=8 counter-race-go atomic 1000000`
- `java`: `env WORKERS=8 counter-race-java atomic 1000000`
- `rust`: `env WORKERS=8 counter-race-rust atomic 1000000`
- `ts`: `env WORKERS=8 counter-race-ts atomic 1000000`
- `go`: `env WORKERS=1 counter-race-go buggy 1000000`
- `java`: `env WORKERS=1 counter-race-java buggy 1000000`
- `rust`: `env WORKERS=1 counter-race-rust buggy 1000000`
- `ts`: `env WORKERS=1 counter-race-ts buggy 1000000`
- `go`: `env WORKERS=2 counter-race-go buggy 1000000`
- `java`: `env WORKERS=2 counter-race-java buggy 1000000`
- `rust`: `env WORKERS=2 counter-race-rust buggy 1000000`
- `ts`: `env WORKERS=2 counter-race-ts buggy 1000000`
- `go`: `env WORKERS=4 counter-race-go buggy 1000000`
- `java`: `env WORKERS=4 counter-race-java buggy 1000000`
- `rust`: `env WORKERS=4 counter-race-rust buggy 1000000`
- `ts`: `env WORKERS=4 counter-race-ts buggy 1000000`
- `go`: `env WORKERS=8 counter-race-go buggy 1000000`
- `java`: `env WORKERS=8 counter-race-java buggy 1000000`
- `rust`: `env WORKERS=8 counter-race-rust buggy 1000000`
- `ts`: `env WORKERS=8 counter-race-ts buggy 1000000`
- `go`: `env WORKERS=1 counter-race-go channel 1000000`
- `rust`: `env WORKERS=1 counter-race-rust channel 1000000`
- `go`: `env WORKERS=2 counter-race-go channel 1000000`
- `rust`: `env WORKERS=2 counter-race-rust channel 1000000`
- `go`: `env WORKERS=4 counter-race-go channel 1000000`
- `rust`: `env WORKERS=4 counter-race-rust channel 1000000`
- `go`: `env WORKERS=8 counter-race-go channel 1000000`
- `rust`: `env WORKERS=8 counter-race-rust channel 1000000`
- `elixir`: `env WORKERS=1 counter-race-elixir get-then-set 1000000`
- `elixir`: `env WORKERS=2 counter-race-elixir get-then-set 1000000`
- `elixir`: `env WORKERS=4 counter-race-elixir get-then-set 1000000`
- `elixir`: `env WORKERS=8 counter-race-elixir get-then-set 1000000`
- `ts`: `env WORKERS=1 counter-race-ts message 1000000`
- `ts`: `env WORKERS=2 counter-race-ts message 1000000`
- `ts`: `env WORKERS=4 counter-race-ts message 1000000`
- `ts`: `env WORKERS=8 counter-race-ts message 1000000`
- `go`: `env WORKERS=1 counter-race-go mutex 1000000`
- `java`: `env WORKERS=1 counter-race-java mutex 1000000`
- `rust`: `env WORKERS=1 counter-race-rust mutex 1000000`
- `ts`: `env WORKERS=1 counter-race-ts mutex 1000000`
- `go`: `env WORKERS=2 counter-race-go mutex 1000000`
- `java`: `env WORKERS=2 counter-race-java mutex 1000000`
- `rust`: `env WORKERS=2 counter-race-rust mutex 1000000`
- `ts`: `env WORKERS=2 counter-race-ts mutex 1000000`
- `go`: `env WORKERS=4 counter-race-go mutex 1000000`
- `java`: `env WORKERS=4 counter-race-java mutex 1000000`
- `rust`: `env WORKERS=4 counter-race-rust mutex 1000000`
- `ts`: `env WORKERS=4 counter-race-ts mutex 1000000`
- `go`: `env WORKERS=8 counter-race-go mutex 1000000`
- `java`: `env WORKERS=8 counter-race-java mutex 1000000`
- `rust`: `env WORKERS=8 counter-race-rust mutex 1000000`
- `ts`: `env WORKERS=8 counter-race-ts mutex 1000000`
- `java`: `env WORKERS=1 counter-race-java queue 1000000`
- `java`: `env WORKERS=2 counter-race-java queue 1000000`
- `java`: `env WORKERS=4 counter-race-java queue 1000000`
- `java`: `env WORKERS=8 counter-race-java queue 1000000`
