# Benchmark: memory

Generated at 2026-10-07T22:59:41.150Z. 5 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- cpp: g++ (GCC) 16.2.0 (sef-bench-memory-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-memory-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-memory-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-memory-java:local)
- ts: 1.4.2 (sef-bench-memory-ts:local)
- elixir: 1.20.4 (sef-bench-memory-elixir:local)
- python: Python 3.14.8 (sef-bench-memory-python:local)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| binary-trees | default | 10 | cpp | 5.14 ± 0.58 | 4.57 to 6.04 | 5.06 | 4.77 | 3892 |
| binary-trees | default | 10 | elixir | 580 ± 54.0 | 504 to 642 | 1753 | 3.98 | 86288 |
| binary-trees | default | 10 | go | 7.51 ± 0.93 | 6.83 to 9.01 | 8.50 | 3.62 | 4312 |
| binary-trees | default | 10 | java | 137 ± 14.1 | 115 to 150 | 183 | 14.4 | 48212 |
| binary-trees | default | 10 | python | 199 ± 15.8 | 181 to 222 | 187 | 33.3 | 15284 |
| binary-trees | default | 10 | rust | 8.75 ± 3.31 | 5.32 to 12.2 | 8.08 | 6.74 | 2136 |
| binary-trees | default | 10 | ts | 20.2 ± 2.91 | 15.5 to 23.3 | 30.0 | 5.15 | 33700 |
| binary-trees | default | 18 | cpp | 2494 ± 269 | 2020 to 2674 | 2492 | 2215 | 36432 |
| binary-trees | default | 18 | elixir | 2000 ± 199 | 1736 to 2252 | 3173 | 1322 | 200940 |
| binary-trees | default | 18 | go | 2723 ± 359 | 2189 to 3156 | 5484 | 2667 | 39396 |
| binary-trees | default | 18 | java | 1029 ± 177 | 851 to 1260 | 1177 | 963 | 470172 |
| binary-trees | default | 18 | python | 12936 ± 1349 | 11381 to 14658 | 12913 | 12791 | 47204 |
| binary-trees | default | 18 | rust | 2406 ± 361 | 2006 to 2886 | 2388 | 3519 | 34880 |
| binary-trees | default | 18 | ts | 1809 ± 366 | 1271 to 2175 | 3204 | 1597 | 174944 |
| idle | default | 10 | cpp | 1.86 ± 0.23 | 1.63 to 2.24 | 1.75 | 0.00 | 3872 |
| idle | default | 10 | elixir | 453 ± 50.7 | 409 to 508 | 1315 | 0.00 | 87628 |
| idle | default | 10 | go | 2.41 ± 0.44 | 2.11 to 3.19 | 2.70 | 0.00 | 2136 |
| idle | default | 10 | java | 170 ± 26.5 | 146 to 204 | 164 | 0.01 | 44612 |
| idle | default | 10 | python | 157 ± 14.0 | 146 to 181 | 157 | 0.00 | 15044 |
| idle | default | 10 | rust | 1.33 ± 0.10 | 1.18 to 1.43 | 1.22 | 0.00 | 2196 |
| idle | default | 10 | ts | 21.6 ± 4.09 | 16.5 to 27.7 | 15.5 | 0.00 | 18000 |

## Commands

- `cpp`: `/opt/bench/main binary-trees 10`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" binary-trees 10`
- `go`: `/opt/bench/main binary-trees 10`
- `java`: `java -cp /opt/bench Main binary-trees 10`
- `python`: `python /opt/bench/main.py binary-trees 10`
- `rust`: `/opt/bench/main binary-trees 10`
- `ts`: `bun /opt/bench/main.ts binary-trees 10`
- `cpp`: `/opt/bench/main binary-trees 18`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" binary-trees 18`
- `go`: `/opt/bench/main binary-trees 18`
- `java`: `java -cp /opt/bench Main binary-trees 18`
- `python`: `python /opt/bench/main.py binary-trees 18`
- `rust`: `/opt/bench/main binary-trees 18`
- `ts`: `bun /opt/bench/main.ts binary-trees 18`
- `cpp`: `/opt/bench/main idle 10`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" idle 10`
- `go`: `/opt/bench/main idle 10`
- `java`: `java -cp /opt/bench Main idle 10`
- `python`: `python /opt/bench/main.py idle 10`
- `rust`: `/opt/bench/main idle 10`
- `ts`: `bun /opt/bench/main.ts idle 10`
