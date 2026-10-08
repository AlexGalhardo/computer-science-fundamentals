# Benchmark: parallelism

Generated at 2026-10-07T22:46:24.830Z. 5 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- cpp: g++ (GCC) 16.2.0 (sef-bench-parallelism-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-parallelism-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-parallelism-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-parallelism-java:local)
- ts: 1.4.2 (sef-bench-parallelism-ts:local)
- elixir: 1.20.4 (sef-bench-parallelism-elixir:local)
- python: Python 3.14.8 (sef-bench-parallelism-python:local)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| primes | 1 | 2000000 | cpp | 232 ± 13.9 | 213 to 250 | 228 | 241 | 3952 |
| primes | 1 | 2000000 | elixir | 1562 ± 180 | 1368 to 1858 | 2428 | 1075 | 87944 |
| primes | 1 | 2000000 | go | 184 ± 7.53 | 177 to 196 | 185 | 173 | 2268 |
| primes | 1 | 2000000 | java | 280 ± 11.7 | 263 to 294 | 322 | 231 | 45480 |
| primes | 1 | 2000000 | python | 9646 ± 997 | 8741 to 11111 | 9839 | 8936 | 23572 |
| primes | 1 | 2000000 | rust | 193 ± 30.8 | 164 to 244 | 193 | 184 | 2436 |
| primes | 1 | 2000000 | ts | 214 ± 28.3 | 197 to 263 | 234 | 225 | 36484 |
| primes | 16 | 2000000 | cpp | 24.9 ± 1.10 | 23.6 to 26.5 | 280 | 24.8 | 4008 |
| primes | 16 | 2000000 | elixir | 810 ± 137 | 679 to 1016 | 2780 | 100 | 89232 |
| primes | 16 | 2000000 | go | 29.5 ± 2.06 | 27.5 to 32.5 | 298 | 26.9 | 2268 |
| primes | 16 | 2000000 | java | 126 ± 13.6 | 112 to 148 | 617 | 65.7 | 46924 |
| primes | 16 | 2000000 | python | 4622 ± 451 | 4086 to 5177 | 26853 | 4289 | 23420 |
| primes | 16 | 2000000 | rust | 29.4 ± 1.80 | 27.1 to 31.5 | 310 | 24.7 | 2440 |
| primes | 16 | 2000000 | ts | 130 ± 12.4 | 117 to 147 | 697 | 84.1 | 59784 |
| primes | 2 | 2000000 | cpp | 94.2 ± 8.31 | 87.8 to 108 | 181 | 83.9 | 3876 |
| primes | 2 | 2000000 | elixir | 1332 ± 255 | 959 to 1653 | 2631 | 250 | 88000 |
| primes | 2 | 2000000 | go | 106 ± 14.1 | 85.4 to 122 | 213 | 123 | 2268 |
| primes | 2 | 2000000 | java | 193 ± 24.9 | 171 to 236 | 326 | 126 | 45680 |
| primes | 2 | 2000000 | python | 6466 ± 610 | 5555 to 7008 | 12243 | 6061 | 23228 |
| primes | 2 | 2000000 | rust | 95.2 ± 15.9 | 85.7 to 123 | 188 | 78.2 | 2388 |
| primes | 2 | 2000000 | ts | 129 ± 5.89 | 120 to 135 | 273 | 103 | 38652 |
| primes | 4 | 2000000 | cpp | 50.6 ± 2.98 | 46.5 to 54.5 | 189 | 48.4 | 3812 |
| primes | 4 | 2000000 | elixir | 693 ± 184 | 513 to 963 | 2374 | 299 | 88208 |
| primes | 4 | 2000000 | go | 50.9 ± 1.64 | 48.5 to 52.8 | 195 | 50.5 | 2268 |
| primes | 4 | 2000000 | java | 143 ± 11.6 | 131 to 159 | 363 | 73.8 | 45848 |
| primes | 4 | 2000000 | python | 3662 ± 507 | 2893 to 4128 | 12800 | 2944 | 23588 |
| primes | 4 | 2000000 | rust | 73.2 ± 8.68 | 58.9 to 81.0 | 267 | 68.5 | 2388 |
| primes | 4 | 2000000 | ts | 102 ± 11.1 | 89.6 to 115 | 388 | 79.6 | 41380 |
| primes | 8 | 2000000 | cpp | 32.8 ± 0.38 | 32.3 to 33.3 | 232 | 31.8 | 3988 |
| primes | 8 | 2000000 | elixir | 706 ± 143 | 559 to 881 | 2495 | 160 | 87936 |
| primes | 8 | 2000000 | go | 34.2 ± 1.34 | 32.6 to 35.8 | 243 | 34.8 | 2268 |
| primes | 8 | 2000000 | java | 126 ± 18.0 | 109 to 151 | 457 | 80.8 | 46224 |
| primes | 8 | 2000000 | python | 3994 ± 576 | 3254 to 4681 | 19230 | 5066 | 23400 |
| primes | 8 | 2000000 | rust | 41.2 ± 6.65 | 34.3 to 50.5 | 284 | 31.7 | 2460 |
| primes | 8 | 2000000 | ts | 96.5 ± 8.08 | 85.1 to 107 | 538 | 81.7 | 47352 |

## Commands

- `cpp`: `/opt/bench/main primes 2000000 1`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" primes 2000000 1`
- `go`: `/opt/bench/main primes 2000000 1`
- `java`: `java -cp /opt/bench Main primes 2000000 1`
- `python`: `python /opt/bench/main.py primes 2000000 1`
- `rust`: `/opt/bench/main primes 2000000 1`
- `ts`: `bun /opt/bench/main.ts primes 2000000 1`
- `cpp`: `/opt/bench/main primes 2000000 16`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" primes 2000000 16`
- `go`: `/opt/bench/main primes 2000000 16`
- `java`: `java -cp /opt/bench Main primes 2000000 16`
- `python`: `python /opt/bench/main.py primes 2000000 16`
- `rust`: `/opt/bench/main primes 2000000 16`
- `ts`: `bun /opt/bench/main.ts primes 2000000 16`
- `cpp`: `/opt/bench/main primes 2000000 2`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" primes 2000000 2`
- `go`: `/opt/bench/main primes 2000000 2`
- `java`: `java -cp /opt/bench Main primes 2000000 2`
- `python`: `python /opt/bench/main.py primes 2000000 2`
- `rust`: `/opt/bench/main primes 2000000 2`
- `ts`: `bun /opt/bench/main.ts primes 2000000 2`
- `cpp`: `/opt/bench/main primes 2000000 4`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" primes 2000000 4`
- `go`: `/opt/bench/main primes 2000000 4`
- `java`: `java -cp /opt/bench Main primes 2000000 4`
- `python`: `python /opt/bench/main.py primes 2000000 4`
- `rust`: `/opt/bench/main primes 2000000 4`
- `ts`: `bun /opt/bench/main.ts primes 2000000 4`
- `cpp`: `/opt/bench/main primes 2000000 8`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" primes 2000000 8`
- `go`: `/opt/bench/main primes 2000000 8`
- `java`: `java -cp /opt/bench Main primes 2000000 8`
- `python`: `python /opt/bench/main.py primes 2000000 8`
- `rust`: `/opt/bench/main primes 2000000 8`
- `ts`: `bun /opt/bench/main.ts primes 2000000 8`
