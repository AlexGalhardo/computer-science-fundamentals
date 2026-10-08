# Benchmark: cpu-single

Generated at 2026-10-07T22:31:41.566Z. 5 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- cpp: g++ (GCC) 16.2.0 (sef-bench-cpu-single-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-cpu-single-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-cpu-single-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-cpu-single-java:local)
- ts: 1.4.2 (sef-bench-cpu-single-ts:local)
- elixir: 1.20.4 (sef-bench-cpu-single-elixir:local)
- python: Python 3.14.8 (sef-bench-cpu-single-python:local)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| nbody | default | 100000 | cpp | 9.48 ± 1.32 | 8.57 to 11.8 | 9.23 | 6.46 | 3864 |
| nbody | default | 100000 | elixir | 1102 ± 199 | 857 to 1331 | 1874 | 513 | 87176 |
| nbody | default | 100000 | go | 11.9 ± 0.94 | 10.5 to 12.9 | 13.0 | 7.05 | 2140 |
| nbody | default | 100000 | java | 90.1 ± 15.6 | 67.2 to 108 | 132 | 33.9 | 45168 |
| nbody | default | 100000 | python | 1422 ± 195 | 1233 to 1630 | 1419 | 1029 | 15184 |
| nbody | default | 100000 | rust | 5.71 ± 0.53 | 5.14 to 6.43 | 5.62 | 4.25 | 2164 |
| nbody | default | 100000 | ts | 38.3 ± 5.97 | 28.0 to 43.3 | 43.7 | 28.0 | 31924 |
| nbody | default | 1000000 | cpp | 102 ± 14.1 | 83.5 to 119 | 101 | 95.6 | 3764 |
| nbody | default | 1000000 | elixir | 3660 ± 803 | 2864 to 4742 | 4595 | 2900 | 86280 |
| nbody | default | 1000000 | go | 98.2 ± 11.0 | 82.6 to 112 | 99.6 | 100 | 2140 |
| nbody | default | 1000000 | java | 151 ± 8.84 | 140 to 163 | 199 | 123 | 45228 |
| nbody | default | 1000000 | python | 9159 ± 861 | 8398 to 10338 | 9157 | 9178 | 15292 |
| nbody | default | 1000000 | rust | 48.7 ± 3.29 | 44.4 to 53.4 | 48.6 | 49.2 | 2084 |
| nbody | default | 1000000 | ts | 220 ± 23.8 | 181 to 244 | 228 | 234 | 31276 |
| sieve | default | 100000 | cpp | 2.33 ± 0.21 | 2.18 to 2.69 | 2.20 | 0.33 | 3992 |
| sieve | default | 100000 | elixir | 369 ± 36.0 | 331 to 418 | 1410 | 9.27 | 88292 |
| sieve | default | 100000 | go | 3.30 ± 0.43 | 2.79 to 3.78 | 3.27 | 0.36 | 2268 |
| sieve | default | 100000 | java | 60.8 ± 7.83 | 53.0 to 71.9 | 90.7 | 11.4 | 45160 |
| sieve | default | 100000 | python | 102 ± 10.6 | 89.5 to 113 | 102 | 10.6 | 15344 |
| sieve | default | 100000 | rust | 1.17 ± 0.20 | 1.01 to 1.42 | 1.08 | 0.18 | 2132 |
| sieve | default | 100000 | ts | 11.8 ± 1.13 | 10.4 to 12.9 | 10.4 | 1.86 | 25324 |
| sieve | default | 1000000 | cpp | 5.62 ± 0.18 | 5.39 to 5.88 | 5.52 | 3.31 | 4272 |
| sieve | default | 1000000 | elixir | 777 ± 78.2 | 674 to 854 | 1576 | 94.6 | 95396 |
| sieve | default | 1000000 | go | 4.42 ± 0.62 | 3.78 to 5.30 | 4.74 | 1.86 | 3164 |
| sieve | default | 1000000 | java | 78.5 ± 6.74 | 72.9 to 86.3 | 112 | 26.6 | 46088 |
| sieve | default | 1000000 | python | 279 ± 33.8 | 251 to 338 | 279 | 132 | 15516 |
| sieve | default | 1000000 | rust | 4.32 ± 0.53 | 3.70 to 4.88 | 3.95 | 2.75 | 3008 |
| sieve | default | 1000000 | ts | 22.8 ± 3.44 | 19.7 to 27.0 | 29.4 | 7.15 | 30564 |
| sieve | default | 10000000 | cpp | 42.4 ± 5.08 | 37.8 to 48.7 | 42.2 | 29.2 | 13164 |
| sieve | default | 10000000 | elixir | 1586 ± 141 | 1417 to 1770 | 2645 | 1203 | 164332 |
| sieve | default | 10000000 | go | 45.8 ± 5.57 | 40.3 to 54.3 | 47.3 | 36.6 | 12252 |
| sieve | default | 10000000 | java | 119 ± 12.9 | 101 to 136 | 158 | 51.9 | 55052 |
| sieve | default | 10000000 | python | 1931 ± 191 | 1792 to 2243 | 1930 | 1701 | 25040 |
| sieve | default | 10000000 | rust | 35.9 ± 5.32 | 29.1 to 41.1 | 35.8 | 25.5 | 11892 |
| sieve | default | 10000000 | ts | 56.1 ± 4.88 | 48.4 to 61.2 | 60.6 | 37.3 | 39620 |

## Commands

- `cpp`: `/opt/bench/main nbody 100000`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" nbody 100000`
- `go`: `/opt/bench/main nbody 100000`
- `java`: `java -cp /opt/bench Main nbody 100000`
- `python`: `python /opt/bench/main.py nbody 100000`
- `rust`: `/opt/bench/main nbody 100000`
- `ts`: `bun /opt/bench/main.ts nbody 100000`
- `cpp`: `/opt/bench/main nbody 1000000`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" nbody 1000000`
- `go`: `/opt/bench/main nbody 1000000`
- `java`: `java -cp /opt/bench Main nbody 1000000`
- `python`: `python /opt/bench/main.py nbody 1000000`
- `rust`: `/opt/bench/main nbody 1000000`
- `ts`: `bun /opt/bench/main.ts nbody 1000000`
- `cpp`: `/opt/bench/main sieve 100000`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" sieve 100000`
- `go`: `/opt/bench/main sieve 100000`
- `java`: `java -cp /opt/bench Main sieve 100000`
- `python`: `python /opt/bench/main.py sieve 100000`
- `rust`: `/opt/bench/main sieve 100000`
- `ts`: `bun /opt/bench/main.ts sieve 100000`
- `cpp`: `/opt/bench/main sieve 1000000`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" sieve 1000000`
- `go`: `/opt/bench/main sieve 1000000`
- `java`: `java -cp /opt/bench Main sieve 1000000`
- `python`: `python /opt/bench/main.py sieve 1000000`
- `rust`: `/opt/bench/main sieve 1000000`
- `ts`: `bun /opt/bench/main.ts sieve 1000000`
- `cpp`: `/opt/bench/main sieve 10000000`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" sieve 10000000`
- `go`: `/opt/bench/main sieve 10000000`
- `java`: `java -cp /opt/bench Main sieve 10000000`
- `python`: `python /opt/bench/main.py sieve 10000000`
- `rust`: `/opt/bench/main sieve 10000000`
- `ts`: `bun /opt/bench/main.ts sieve 10000000`
