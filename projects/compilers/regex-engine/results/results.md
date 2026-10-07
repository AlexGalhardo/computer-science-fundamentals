# Benchmark: regex-engine

Generated at 2026-10-07T23:42:21.712Z. 3 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- go: go version go1.27.1 linux/amd64 (golang:1.27.1-bookworm)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| backtracking | default | 10 | go | 36.9 ± 8.19 | 29.2 to 45.5 | 11.0 | 0.03 | 2848 |
| backtracking | default | 15 | go | 31.1 ± 1.77 | 29.2 to 32.6 | 10.8 | 1.43 | 2700 |
| backtracking | default | 20 | go | 88.5 ± 14.6 | 77.0 to 105 | 58.8 | 48.8 | 2556 |
| backtracking | default | 25 | go | 1600 ± 164 | 1418 to 1736 | 1573 | 1240 | 2020 |
| dfa | default | 10 | go | 32.2 ± 0.77 | 31.5 to 33.0 | 10.2 | 0.00 | 2392 |
| dfa | default | 15 | go | 6.13 ± 1.31 | 4.98 to 7.55 | 3.86 | 0.00 | 3040 |
| dfa | default | 20 | go | 24.3 ± 28.4 | 7.10 to 57.1 | 7.01 | 0.00 | 2864 |
| dfa | default | 25 | go | 87.6 ± 19.2 | 71.0 to 109 | 14.3 | 0.00 | 2608 |
| dfa | default | 1000 | go | 89.2 ± 24.6 | 62.1 to 110 | 19.1 | 0.00 | 2164 |
| dfa | default | 100000 | go | 53.7 ± 22.0 | 29.4 to 72.4 | 14.6 | 0.23 | 2832 |
| dfa | default | 1000000 | go | 41.0 ± 5.24 | 35.4 to 45.8 | 14.3 | 2.74 | 3176 |
| nfa | default | 10 | go | 31.9 ± 3.58 | 28.0 to 35.1 | 10.6 | 0.00 | 2856 |
| nfa | default | 15 | go | 53.3 ± 12.2 | 39.5 to 62.6 | 14.5 | 0.00 | 2580 |
| nfa | default | 20 | go | 28.5 ± 1.71 | 26.9 to 30.3 | 9.09 | 0.00 | 2868 |
| nfa | default | 25 | go | 28.3 ± 4.39 | 24.9 to 33.2 | 8.61 | 0.00 | 2848 |
| nfa | default | 1000 | go | 63.4 ± 33.9 | 31.8 to 99.3 | 15.3 | 0.03 | 2608 |
| nfa | default | 100000 | go | 75.3 ± 94.8 | 17.3 to 185 | 22.6 | 5.99 | 2992 |
| nfa | default | 1000000 | go | 120 ± 5.32 | 115 to 126 | 88.5 | 44.5 | 3208 |

## Commands

- `go`: `.bench/regex-engine bench backtracking 10`
- `go`: `.bench/regex-engine bench backtracking 15`
- `go`: `.bench/regex-engine bench backtracking 20`
- `go`: `.bench/regex-engine bench backtracking 25`
- `go`: `.bench/regex-engine bench dfa 10`
- `go`: `.bench/regex-engine bench dfa 15`
- `go`: `.bench/regex-engine bench dfa 20`
- `go`: `.bench/regex-engine bench dfa 25`
- `go`: `.bench/regex-engine bench dfa 1000`
- `go`: `.bench/regex-engine bench dfa 100000`
- `go`: `.bench/regex-engine bench dfa 1000000`
- `go`: `.bench/regex-engine bench nfa 10`
- `go`: `.bench/regex-engine bench nfa 15`
- `go`: `.bench/regex-engine bench nfa 20`
- `go`: `.bench/regex-engine bench nfa 25`
- `go`: `.bench/regex-engine bench nfa 1000`
- `go`: `.bench/regex-engine bench nfa 100000`
- `go`: `.bench/regex-engine bench nfa 1000000`
