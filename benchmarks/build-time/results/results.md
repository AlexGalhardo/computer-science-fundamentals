# Benchmark: build-time

Generated at 2026-10-07T23:47:54.487Z. 5 runs per row after 1 warm-up run. The program is the one of `cpu-single`.

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Toolchains

- cpp: 16.2.0 (gcc:16.2.0-trixie)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)
- go: go version go1.27.1 linux/amd64 (golang:1.27.1-bookworm)
- java: javac 25.0.4.1 (eclipse-temurin:25.0.4.1_1-jdk-noble)
- ts: 1.4.2 (oven/bun:1.4.2)
- elixir: 1.20.4 (elixir:1.20.4-otp-28-slim)
- python: Python 3.14.8 (python:3.14.8-slim-trixie)

## Results

`cold` removes every output and compiler cache before each run. `warm` appends one comment line to the source before each run. `step` says what the command really does.

| Language | Mode | Step | time (ms) | range (ms) | CPU (ms) | Command | Before each run |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| cpp | cold | compile-and-link | 2534 ± 229 | 2278 to 2787 | 2533 | `g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main` | `rm -f main` |
| cpp | warm | compile-and-link | 2530 ± 258 | 2396 to 2989 | 2530 | `g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main` | `append one comment line to main.cpp` |
| rust | cold | compile-and-link | 456 ± 49.3 | 386 to 513 | 461 | `cargo build --release --locked --offline --quiet` | `rm -rf target` |
| rust | warm | compile-and-link | 346 ± 44.4 | 300 to 398 | 393 | `cargo build --release --locked --offline --quiet` | `append one comment line to src/main.rs` |
| go | cold | compile-and-link | 3956 ± 439 | 3498 to 4626 | 16551 | `go build -o main .` | `rm -f main && go clean -cache` |
| go | warm | compile-and-link | 163 ± 11.0 | 147 to 175 | 310 | `go build -o main .` | `append one comment line to main.go` |
| java | cold | compile-to-bytecode | 799 ± 54.3 | 742 to 870 | 2157 | `javac -d out Main.java` | `rm -rf out` |
| java | warm | compile-to-bytecode | 1046 ± 190 | 827 to 1275 | 2646 | `javac -d out Main.java` | `append one comment line to Main.java` |
| ts | cold | bundle-no-typecheck | 7.03 ± 0.29 | 6.60 to 7.28 | 9.23 | `bun build main.ts --target bun --outfile out/main.js` | `rm -rf out` |
| ts | warm | bundle-no-typecheck | 7.07 ± 0.62 | 6.24 to 7.88 | 9.14 | `bun build main.ts --target bun --outfile out/main.js` | `append one comment line to main.ts` |
| elixir | cold | compile-to-bytecode | 1064 ± 200 | 913 to 1363 | 3106 | `elixirc --ignore-module-conflict -o out main.ex` | `rm -rf out` |
| elixir | warm | compile-to-bytecode | 1160 ± 266 | 933 to 1466 | 2618 | `elixirc --ignore-module-conflict -o out main.ex` | `append one comment line to main.ex` |
| python | cold | bytecode-automatic | 74.7 ± 13.7 | 54.9 to 91.8 | 74.5 | `python -m py_compile main.py` | `rm -rf __pycache__` |
| python | warm | bytecode-automatic | 74.5 ± 14.7 | 52.6 to 87.0 | 73.0 | `python -m py_compile main.py` | `append one comment line to main.py` |
