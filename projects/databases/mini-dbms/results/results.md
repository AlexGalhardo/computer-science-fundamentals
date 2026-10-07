# Benchmark: mini-dbms

Generated at 2026-10-07T22:28:02.321Z. 3 runs per row after 1 warm-up run(s).

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
- python: Python 3.14.8 (python:3.14.8-slim-trixie)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| hash | default | 1000 | python | 114 ± 7.33 | 106 to 120 | 49.7 | 0.42 | 12060 |
| hash | default | 1000 | rust | 12.2 ± 1.69 | 11.2 to 14.1 | 2.96 | 0.25 | 2392 |
| hash | default | 10000 | python | 170 ± 27.6 | 152 to 202 | 90.7 | 23.9 | 16400 |
| hash | default | 10000 | rust | 24.7 ± 3.72 | 20.5 to 27.4 | 11.9 | 3.05 | 4956 |
| hash | default | 100000 | python | 457 ± 14.3 | 448 to 473 | 372 | 112 | 64976 |
| hash | default | 100000 | rust | 101 ± 12.5 | 91.5 to 115 | 91.8 | 53.9 | 29612 |
| hash | default | 1000000 | python | 4319 ± 243 | 4074 to 4560 | 4255 | 2161 | 538060 |
| hash | default | 1000000 | rust | 1375 ± 33.5 | 1348 to 1412 | 1365 | 983 | 304040 |
| nested-loop | default | 1000 | python | 295 ± 91.5 | 195 to 376 | 145 | 44.8 | 11680 |
| nested-loop | default | 1000 | rust | 23.3 ± 2.42 | 21.1 to 25.9 | 7.69 | 4.24 | 2300 |
| nested-loop | default | 10000 | python | 5279 ± 429 | 5009 to 5773 | 5156 | 4113 | 15560 |
| nested-loop | default | 10000 | rust | 380 ± 30.5 | 346 to 406 | 366 | 332 | 3888 |
| sort-merge | default | 1000 | python | 124 ± 21.1 | 103 to 145 | 56.0 | 1.10 | 12144 |
| sort-merge | default | 1000 | rust | 16.6 ± 2.37 | 14.0 to 18.6 | 3.37 | 0.20 | 2296 |
| sort-merge | default | 10000 | python | 245 ± 107 | 173 to 367 | 118 | 25.4 | 15612 |
| sort-merge | default | 10000 | rust | 20.5 ± 3.27 | 17.5 to 24.0 | 9.70 | 2.63 | 3956 |
| sort-merge | default | 100000 | python | 714 ± 116 | 591 to 822 | 627 | 307 | 53488 |
| sort-merge | default | 100000 | rust | 181 ± 19.2 | 162 to 200 | 147 | 107 | 23000 |
| sort-merge | default | 1000000 | python | 4456 ± 372 | 4137 to 4865 | 4397 | 2652 | 442236 |
| sort-merge | default | 1000000 | rust | 2049 ± 48.3 | 1996 to 2090 | 1946 | 1597 | 212716 |

## Commands

- `python`: `python python/bench.py hash 1000`
- `rust`: `rust/target/release/mini-dbms bench hash 1000`
- `python`: `python python/bench.py hash 10000`
- `rust`: `rust/target/release/mini-dbms bench hash 10000`
- `python`: `python python/bench.py hash 100000`
- `rust`: `rust/target/release/mini-dbms bench hash 100000`
- `python`: `python python/bench.py hash 1000000`
- `rust`: `rust/target/release/mini-dbms bench hash 1000000`
- `python`: `python python/bench.py nested-loop 1000`
- `rust`: `rust/target/release/mini-dbms bench nested-loop 1000`
- `python`: `python python/bench.py nested-loop 10000`
- `rust`: `rust/target/release/mini-dbms bench nested-loop 10000`
- `python`: `python python/bench.py sort-merge 1000`
- `rust`: `rust/target/release/mini-dbms bench sort-merge 1000`
- `python`: `python python/bench.py sort-merge 10000`
- `rust`: `rust/target/release/mini-dbms bench sort-merge 10000`
- `python`: `python python/bench.py sort-merge 100000`
- `rust`: `rust/target/release/mini-dbms bench sort-merge 100000`
- `python`: `python python/bench.py sort-merge 1000000`
- `rust`: `rust/target/release/mini-dbms bench sort-merge 1000000`
