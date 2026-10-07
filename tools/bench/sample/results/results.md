# Benchmark: sample

Generated at 2026-10-07T21:58:52.693Z. 3 runs per row after 1 warm-up run(s).

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
| sum-formula | default | 1000 | python | 48.5 ± 0.87 | 47.7 to 49.4 | 23.9 | 0.00 | 10012 |
| sum-formula | default | 1000 | ts | 11.1 ± 0.82 | 10.4 to 12.0 | 4.37 | 0.02 | 15496 |
| sum-formula | default | 100000 | python | 47.9 ± 6.54 | 42.3 to 55.1 | 23.0 | 0.00 | 9944 |
| sum-formula | default | 100000 | ts | 16.3 ± 1.66 | 14.9 to 18.1 | 6.91 | 0.03 | 15652 |
| sum-loop | default | 1000 | python | 48.9 ± 3.13 | 46.5 to 52.4 | 23.2 | 0.03 | 10000 |
| sum-loop | default | 1000 | ts | 10.9 ± 0.27 | 10.7 to 11.2 | 4.56 | 0.15 | 15988 |
| sum-loop | default | 100000 | python | 55.9 ± 4.99 | 52.0 to 61.5 | 30.6 | 4.59 | 10040 |
| sum-loop | default | 100000 | ts | 12.5 ± 0.18 | 12.3 to 12.7 | 6.04 | 0.58 | 20452 |

## Commands

- `python`: `python python/bench.py sum-formula 1000`
- `ts`: `bun run ts/bench.ts sum-formula 1000`
- `python`: `python python/bench.py sum-formula 100000`
- `ts`: `bun run ts/bench.ts sum-formula 100000`
- `python`: `python python/bench.py sum-loop 1000`
- `ts`: `bun run ts/bench.ts sum-loop 1000`
- `python`: `python python/bench.py sum-loop 100000`
- `ts`: `bun run ts/bench.ts sum-loop 100000`
