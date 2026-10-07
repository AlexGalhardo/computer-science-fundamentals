# Benchmark: graph-algorithms

Generated at 2026-10-07T22:42:47.923Z. 5 runs per row after 1 warm-up run(s).

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
- go: go version go1.27.1 linux/amd64 (golang:1.27.1-bookworm)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| bellman-ford-list | default | 1000 | cpp | 8.80 ± 1.66 | 6.90 to 10.8 | 3.79 | 0.52 | 4328 |
| bellman-ford-list | default | 1000 | go | 41.5 ± 8.30 | 32.5 to 53.5 | 12.5 | 0.61 | 3920 |
| bellman-ford-list | default | 4000 | cpp | 11.2 ± 2.48 | 9.59 to 15.6 | 7.46 | 2.15 | 5080 |
| bellman-ford-list | default | 4000 | go | 12.7 ± 0.63 | 12.0 to 13.7 | 15.0 | 8.76 | 8752 |
| dijkstra-list | default | 1000 | cpp | 5.89 ± 0.65 | 5.24 to 6.98 | 2.74 | 0.22 | 4168 |
| dijkstra-list | default | 1000 | go | 41.1 ± 14.8 | 31.1 to 66.8 | 12.7 | 0.43 | 3204 |
| dijkstra-list | default | 4000 | cpp | 11.0 ± 2.30 | 9.19 to 14.3 | 6.14 | 1.25 | 5184 |
| dijkstra-list | default | 4000 | go | 102 ± 41.3 | 41.9 to 153 | 26.4 | 2.34 | 4528 |
| dijkstra-matrix | default | 1000 | cpp | 19.2 ± 3.04 | 15.3 to 23.0 | 14.3 | 1.89 | 11604 |
| dijkstra-matrix | default | 1000 | go | 16.2 ± 3.51 | 13.1 to 22.1 | 15.6 | 2.89 | 11564 |
| dijkstra-matrix | default | 4000 | cpp | 152 ± 20.4 | 129 to 181 | 144 | 20.0 | 128980 |
| dijkstra-matrix | default | 4000 | go | 143 ± 9.21 | 133 to 156 | 124 | 34.2 | 129784 |
| kruskal-list | default | 1000 | cpp | 6.74 ± 0.52 | 5.90 to 7.30 | 3.12 | 0.54 | 4416 |
| kruskal-list | default | 1000 | go | 34.5 ± 5.40 | 29.2 to 43.4 | 11.8 | 1.62 | 4544 |
| kruskal-list | default | 4000 | cpp | 11.3 ± 2.50 | 9.72 to 15.6 | 6.86 | 2.73 | 5400 |
| kruskal-list | default | 4000 | go | 14.7 ± 1.51 | 13.1 to 16.9 | 18.0 | 7.26 | 8860 |
| prim-list | default | 1000 | cpp | 6.51 ± 0.82 | 5.48 to 7.38 | 2.86 | 0.47 | 4180 |
| prim-list | default | 1000 | go | 57.2 ± 48.5 | 29.6 to 144 | 13.4 | 2.79 | 3636 |
| prim-list | default | 4000 | cpp | 11.1 ± 1.93 | 9.15 to 14.2 | 7.32 | 2.80 | 5040 |
| prim-list | default | 4000 | go | 46.1 ± 16.1 | 30.8 to 73.2 | 18.8 | 5.92 | 5636 |
| prim-matrix | default | 1000 | cpp | 25.0 ± 4.69 | 17.5 to 28.8 | 16.2 | 1.56 | 11580 |
| prim-matrix | default | 1000 | go | 20.5 ± 2.86 | 15.9 to 23.3 | 21.8 | 4.06 | 11964 |
| prim-matrix | default | 4000 | cpp | 163 ± 7.06 | 155 to 171 | 157 | 14.5 | 128804 |
| prim-matrix | default | 4000 | go | 256 ± 64.6 | 211 to 371 | 223 | 32.1 | 130840 |
| toposort-list | default | 1000 | cpp | 6.87 ± 1.32 | 5.17 to 8.87 | 2.74 | 0.18 | 4084 |
| toposort-list | default | 1000 | go | 27.2 ± 1.54 | 26.0 to 29.5 | 8.46 | 0.10 | 3208 |
| toposort-list | default | 4000 | cpp | 13.3 ± 3.70 | 9.47 to 17.9 | 5.61 | 0.69 | 4724 |
| toposort-list | default | 4000 | go | 29.3 ± 1.74 | 27.6 to 31.9 | 10.1 | 0.38 | 3792 |

## Commands

- `cpp`: `.bench/graph_bench_cpp bellman-ford-list 1000`
- `go`: `.bench/graph_bench_go bellman-ford-list 1000`
- `cpp`: `.bench/graph_bench_cpp bellman-ford-list 4000`
- `go`: `.bench/graph_bench_go bellman-ford-list 4000`
- `cpp`: `.bench/graph_bench_cpp dijkstra-list 1000`
- `go`: `.bench/graph_bench_go dijkstra-list 1000`
- `cpp`: `.bench/graph_bench_cpp dijkstra-list 4000`
- `go`: `.bench/graph_bench_go dijkstra-list 4000`
- `cpp`: `.bench/graph_bench_cpp dijkstra-matrix 1000`
- `go`: `.bench/graph_bench_go dijkstra-matrix 1000`
- `cpp`: `.bench/graph_bench_cpp dijkstra-matrix 4000`
- `go`: `.bench/graph_bench_go dijkstra-matrix 4000`
- `cpp`: `.bench/graph_bench_cpp kruskal-list 1000`
- `go`: `.bench/graph_bench_go kruskal-list 1000`
- `cpp`: `.bench/graph_bench_cpp kruskal-list 4000`
- `go`: `.bench/graph_bench_go kruskal-list 4000`
- `cpp`: `.bench/graph_bench_cpp prim-list 1000`
- `go`: `.bench/graph_bench_go prim-list 1000`
- `cpp`: `.bench/graph_bench_cpp prim-list 4000`
- `go`: `.bench/graph_bench_go prim-list 4000`
- `cpp`: `.bench/graph_bench_cpp prim-matrix 1000`
- `go`: `.bench/graph_bench_go prim-matrix 1000`
- `cpp`: `.bench/graph_bench_cpp prim-matrix 4000`
- `go`: `.bench/graph_bench_go prim-matrix 4000`
- `cpp`: `.bench/graph_bench_cpp toposort-list 1000`
- `go`: `.bench/graph_bench_go toposort-list 1000`
- `cpp`: `.bench/graph_bench_cpp toposort-list 4000`
- `go`: `.bench/graph_bench_go toposort-list 4000`
