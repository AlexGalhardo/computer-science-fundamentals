# Benchmark: binary-size

Generated at 2026-10-07T23:48:23.617Z. Sizes on disk of the `cpu-single` program, in KiB. Sizes are exact, so there is no spread.

## Toolchains

- cpp: g++ (GCC) 16.2.0 (sef-bench-cpu-single-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-cpu-single-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-cpu-single-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-cpu-single-java:local)
- ts: 1.4.2 (sef-bench-cpu-single-ts:local)
- elixir: 1.20.4 (sef-bench-cpu-single-elixir:local)
- python: Python 3.14.8 (sef-bench-cpu-single-python:local)

## Results

`runtime` is what must be present besides the artifact, not counting the operating system and glibc.

| Language | artifact (KiB) | runtime (KiB) | total (KiB) | What the artifact is | What the runtime is |
| --- | ---: | ---: | ---: | --- | --- |
| cpp | 20.6 | 3,625.7 | 3,646.4 | executable, g++ -O2, dynamically linked, not stripped | libstdc++ and libgcc_s shared libraries |
| rust | 483.5 | 178.6 | 662.1 | executable, cargo build --release, standard library linked in, not stripped | libgcc_s shared library |
| go | 2,327.8 | 0 | 2,327.8 | executable, CGO_ENABLED=0 go build, statically linked, not stripped | nothing |
| java | 3.8 | 42,894.3 | 42,898.1 | jar with the compiled classes | smallest Java runtime made by jlink (module java.base only, compressed) |
| ts | 2 | 77,637.3 | 77,639.4 | one JavaScript file made by bun build --minify | the bun executable |
| elixir | 7.5 | 65,892.9 | 65,900.4 | the application's compiled modules inside a mix release | the rest of the release: the Erlang runtime (ERTS) and the Erlang and Elixir libraries |
| python | 5.5 | 31,023.7 | 31,029.2 | the source file (Python ships source, bytecode is made on the first run) | the CPython interpreter, its shared library and the standard library |

## Notes

- cpp: Linking statically (-static-libstdc++ -static-libgcc) moves the runtime into the executable.
- rust: The Rust standard library is inside the executable. Only the unwinding helper of GCC is shared.
- go: The Go runtime (scheduler and garbage collector) is inside the executable, which needs no shared library at all.
- java: The full JDK image is much larger. jlink builds a runtime with only the modules the program needs.
- ts: `bun build --compile` glues both into one executable of about the sum of the two.
- elixir: A mix release is self-contained: the target machine needs neither Erlang nor Elixir installed.
- python: Tools such as PyInstaller pack the interpreter with the program, giving one file of about the size of the runtime.
