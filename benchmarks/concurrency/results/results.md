# Benchmark: concurrency

Generated at 2026-10-07T22:54:36.249Z. 5 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- cpp: g++ (GCC) 16.2.0 (sef-bench-concurrency-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-concurrency-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-concurrency-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-concurrency-java:local)
- ts: 1.4.2 (sef-bench-concurrency-ts:local)
- elixir: 1.20.4 (sef-bench-concurrency-elixir:local)
- python: Python 3.14.8 (sef-bench-concurrency-python:local)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| asyncio-tasks | default | 0 | python | 521 ± 114 | 409 to 655 | 520 | 0.79 | 25272 |
| asyncio-tasks | default | 10000 | python | 613 ± 73.5 | 497 to 696 | 613 | 88.4 | 36832 |
| asyncio-tasks | default | 100000 | python | 2095 ± 334 | 1755 to 2507 | 2091 | 1632 | 151336 |
| coroutines | default | 0 | cpp | 1.69 ± 0.17 | 1.52 to 1.95 | 1.48 | 0.00 | 3772 |
| coroutines | default | 10000 | cpp | 11.4 ± 7.60 | 3.10 to 18.4 | 8.40 | 2.03 | 5024 |
| coroutines | default | 100000 | cpp | 63.4 ± 13.7 | 41.2 to 77.6 | 57.5 | 17.7 | 14332 |
| goroutines | default | 0 | go | 2.94 ± 1.07 | 2.09 to 4.60 | 3.09 | 0.00 | 2136 |
| goroutines | default | 10000 | go | 63.5 ± 19.3 | 44.7 to 90.3 | 83.9 | 106 | 29528 |
| goroutines | default | 100000 | go | 460 ± 33.8 | 427 to 513 | 1125 | 316 | 271832 |
| os-threads | default | 0 | cpp | 1.59 ± 0.10 | 1.50 to 1.76 | 1.50 | 0.00 | 3772 |
| os-threads | default | 10000 | cpp | 1694 ± 290 | 1490 to 2197 | 2705 | 1803 | 87620 |
| processes | default | 0 | elixir | 547 ± 31.5 | 511 to 591 | 1648 | 1.18 | 86700 |
| processes | default | 10000 | elixir | 476 ± 33.6 | 445 to 530 | 1643 | 42.9 | 114828 |
| processes | default | 100000 | elixir | 1270 ± 521 | 976 to 2199 | 3904 | 490 | 380564 |
| promises | default | 0 | ts | 20.4 ± 6.18 | 13.2 to 29.6 | 13.0 | 0.32 | 18876 |
| promises | default | 10000 | ts | 18.6 ± 4.36 | 13.3 to 25.2 | 26.9 | 5.96 | 33564 |
| promises | default | 100000 | ts | 250 ± 42.5 | 189 to 300 | 605 | 195 | 71828 |
| tokio-tasks | default | 0 | rust | 14.6 ± 3.16 | 11.7 to 19.9 | 13.7 | 1.66 | 3072 |
| tokio-tasks | default | 10000 | rust | 32.4 ± 9.79 | 21.4 to 47.0 | 48.7 | 38.9 | 8080 |
| tokio-tasks | default | 100000 | rust | 192 ± 29.3 | 168 to 234 | 388 | 152 | 53248 |
| virtual-threads | default | 0 | java | 72.8 ± 11.5 | 58.1 to 87.1 | 100 | 0.54 | 44564 |
| virtual-threads | default | 10000 | java | 393 ± 54.6 | 320 to 474 | 1388 | 361 | 90528 |
| virtual-threads | default | 100000 | java | 4476 ± 708 | 3353 to 5071 | 11761 | 4513 | 265660 |

## Commands

- `python`: `python /opt/bench/main.py asyncio-tasks 0`
- `python`: `python /opt/bench/main.py asyncio-tasks 10000`
- `python`: `python /opt/bench/main.py asyncio-tasks 100000`
- `cpp`: `/opt/bench/main coroutines 0`
- `cpp`: `/opt/bench/main coroutines 10000`
- `cpp`: `/opt/bench/main coroutines 100000`
- `go`: `/opt/bench/main goroutines 0`
- `go`: `/opt/bench/main goroutines 10000`
- `go`: `/opt/bench/main goroutines 100000`
- `cpp`: `/opt/bench/main os-threads 0`
- `cpp`: `/opt/bench/main os-threads 10000`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" processes 0`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" processes 10000`
- `elixir`: `elixir -pa /opt/bench -e "Main.main(System.argv())" processes 100000`
- `ts`: `bun /opt/bench/main.ts promises 0`
- `ts`: `bun /opt/bench/main.ts promises 10000`
- `ts`: `bun /opt/bench/main.ts promises 100000`
- `rust`: `/opt/bench/main tokio-tasks 0`
- `rust`: `/opt/bench/main tokio-tasks 10000`
- `rust`: `/opt/bench/main tokio-tasks 100000`
- `java`: `java -cp /opt/bench Main virtual-threads 0`
- `java`: `java -cp /opt/bench Main virtual-threads 10000`
- `java`: `java -cp /opt/bench Main virtual-threads 100000`
