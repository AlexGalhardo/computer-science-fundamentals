# Benchmark: build

Generated at 2026-10-08T00:22:25.465Z. 5 runs per row after 1 warm-up run. The program is the one of `cpu-single`.

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
| cpp | cold | compile-and-link | 4512 ± 2676 | 1717 to 8562 | 4430 | `g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main` | `rm -f main` |
| cpp | warm | compile-and-link | 4698 ± 1680 | 2696 to 6095 | 4582 | `g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main` | `append one comment line to main.cpp` |
| rust | cold | compile-and-link | 417 ± 54.8 | 361 to 481 | 400 | `cargo build --release --locked --offline --quiet` | `rm -rf target` |
| rust | warm | compile-and-link | 551 ± 265 | 369 to 1007 | 378 | `cargo build --release --locked --offline --quiet` | `append one comment line to src/main.rs` |
| go | cold | compile-and-link | 7439 ± 3568 | 4202 to 12814 | 20502 | `go build -o main .` | `rm -f main && go clean -cache` |
| go | warm | compile-and-link | 335 ± 132 | 183 to 535 | 443 | `go build -o main .` | `append one comment line to main.go` |
| java | cold | compile-to-bytecode | 768 ± 114 | 672 to 951 | 1807 | `javac -d out Main.java` | `rm -rf out` |
| java | warm | compile-to-bytecode | 768 ± 127 | 632 to 945 | 1720 | `javac -d out Main.java` | `append one comment line to Main.java` |
| ts | cold | bundle-no-typecheck | 8.49 ± 1.72 | 5.96 to 10.7 | 9.62 | `bun build main.ts --target bun --outfile out/main.js` | `rm -rf out` |
| ts | warm | bundle-no-typecheck | 11.3 ± 7.07 | 5.35 to 22.0 | 7.88 | `bun build main.ts --target bun --outfile out/main.js` | `append one comment line to main.ts` |
| elixir | cold | compile-to-bytecode | 765 ± 84.3 | 695 to 910 | 2543 | `elixirc --ignore-module-conflict -o out main.ex` | `rm -rf out` |
| elixir | warm | compile-to-bytecode | 1020 ± 148 | 844 to 1253 | 3039 | `elixirc --ignore-module-conflict -o out main.ex` | `append one comment line to main.ex` |
| python | cold | bytecode-automatic | 75.9 ± 6.72 | 64.2 to 81.1 | 73.6 | `python -m py_compile main.py` | `rm -rf __pycache__` |
| python | warm | bytecode-automatic | 74.4 ± 15.9 | 49.0 to 91.3 | 69.5 | `python -m py_compile main.py` | `append one comment line to main.py` |
