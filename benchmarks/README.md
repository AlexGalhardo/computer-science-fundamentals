# Language benchmarks

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

The same eight workloads in the seven languages of the repository (C++, Rust, Go, Java, TypeScript on Bun, Elixir and Python), measured in Docker on pinned images, with a static dashboard that explains every chart in plain words.

It teaches how each language runs code (compiled, virtual machine, interpreter), how it does many things at once (threads, goroutines, BEAM processes, virtual threads, event loop) and what that costs in time, memory and CPU. It is **not** a ranking: read [Limits of the comparison](#limits-of-the-comparison) before quoting any number.

- Dashboard: open [`dashboard/index.html`](dashboard/index.html) in a browser. It works from disk, with no server and no network.
- Contract and runner shared with the mini-projects: [docs/en/benchmarks.md](../docs/en/benchmarks.md).

## Run

Requirements: Docker and Bun. Nothing else is installed on the host.

```sh
./setup-unix-benchmarks.sh          # Linux and macOS
./setup-windows-benchmarks.ps1      # Windows
```

The script builds every image, runs the agreement tests, runs the eight workloads, rewrites `*/results/`, the tables of this README and `dashboard/results/results.js`, and tests the dashboard. It takes about an hour. `--quick` (`-Quick` on Windows) skips the measurements.

Single steps, from `benchmarks/`:

| Command | What it does |
| --- | --- |
| `bun run images` | builds the image of every language for the four runner workloads |
| `bun run bench -- --project cpu-single` | runs one runner workload (`cpu-single`, `parallelism`, `concurrency`, `memory`) |
| `bun run sections parallelism` | collects the section times used for speed-up |
| `bun run http` | runs the HTTP workload (k6 against the seven servers) |
| `bun run build-time`, `bun run binary-size`, `bun run database` | run the other three collectors |
| `bun run all [step...]` | runs every step in order, retrying a step that fails |
| `bun run data` | rebuilds the dashboard data and the tables below |
| `bun run test` | implementations agree on the checksum, committed results are complete |
| `bun run test:http` | the seven servers pass one protocol suite, k6 refuses non-local targets |
| `bun run test:database` | the seven database clients read back the same data |
| `bun run test:dashboard` | Playwright, in Docker with no network: every chart renders |

## Structure

```
benchmarks/
├── docker/            one Dockerfile per language, shared by the runner workloads
├── cpu-single/        n-body and prime sieve, one thread
├── parallelism/       prime counting over 1, 2, 4, 8 and 16 workers
├── concurrency/       100,000 tasks waiting at a gate
├── memory/            binary trees and an idle process
├── http/              seven servers, k6, collector, protocol tests
├── build-time/       build time, cold and warm
├── binary-size/       size of the artifact and of the runtime it needs
├── database/          seven PostgreSQL clients, collector, tests
├── scripts/           image builder, extra collectors, dashboard data
├── tests/             agreement and results tests
└── dashboard/         the static site and its Playwright tests
```

Each workload folder has one sub-folder per language, a `bench.json` where the shared runner fits, and a committed `results/` with `results.md`, `results.json` and `results.js`.

## The workloads

| Workload | What it measures | What it does not measure |
| --- | --- | --- |
| `cpu-single` | Speed of plain arithmetic and array loops on one core: an n-body simulation (floating point) and a sieve of Eratosthenes (integers, memory) | Libraries that do the heavy part in native code (NumPy, SIMD), long-running programs where a JIT is fully warm |
| `parallelism` | How much faster the same job gets with 1, 2, 4, 8 and 16 workers, using each language's own mechanism | Absolute speed (see `cpu-single`), jobs that share data between workers |
| `concurrency` | Cost in time and memory of 100,000 tasks that wait and pass one message | How fast the tasks would compute, behaviour of a warm long-lived server |
| `http` | Requests per second, latency percentiles, CPU and memory of a small server under local load, for a JSON echo and a CPU-bound endpoint | The language alone: each stack is a different server library. Network distance, TLS, databases |
| `memory` | Peak memory and time of an allocation-heavy program, start-up time and baseline memory of an idle one | Tuned collectors or allocators, long-term fragmentation |
| `build-time` | Time from source to what the language runs, from nothing (cold) and after a one-line edit (warm) | Large projects, where incremental builds and caches matter most |
| `binary-size` | Size on disk of what you ship and of the runtime it needs | Container image size, the operating system and its C library |
| `database` | Operations per second and latency of the same queries against one local PostgreSQL, on one connection and on a pool | The language: this is mostly the driver and the round trip to the server |

All implementations of a workload print the same checksum for the same input. `bun run test` proves it by running every program in its image, and compares the result with a reference calculated independently (the published energy of the n-body system, a sieve in the test itself, the closed formula for the number of tree nodes).

## How each language handles threads

The scheduling model is the main thing these workloads show. This table says what each implementation uses.

| Language | CPU work on many cores (`parallelism`) | Many waiting tasks (`concurrency`) | Model in one sentence |
| --- | --- | --- | --- |
| C++ | `std::thread`, one OS thread per worker, an atomic counter hands out the chunks | C++20 coroutines with a hand-written scheduler, and `std::thread` capped at 10,000 for comparison | The kernel schedules OS threads (1:1). The language gives the coroutine mechanism but no scheduler |
| Rust | rayon thread pool with work stealing | tokio tasks on a multi-thread runtime | OS threads for computing. `async` blocks compile to state machines that a library runtime polls on a few threads |
| Go | goroutines reading chunk numbers from a channel, `GOMAXPROCS` = workers | goroutines blocked on a channel | M:N: the Go runtime multiplexes many goroutines (small growable stacks) over a few OS threads and preempts them |
| Java | parallel stream submitted to a `ForkJoinPool` of platform threads | virtual threads waiting on a `CountDownLatch`, messages through a `LinkedBlockingQueue` | Platform threads are OS threads. Virtual threads are scheduled by the JVM on a small pool of carrier threads and unmounted when they block |
| TypeScript (Bun) | `Worker` threads, each with its own heap, fed by messages | `async` functions awaiting one promise | One thread and an event loop per isolate. Nothing is shared, so more cores means more isolates |
| Elixir | `Task.async_stream` with `max_concurrency` = workers | BEAM processes blocked in `receive` | The VM runs lightweight processes on one scheduler thread per core, preempts them by reduction count, and they only share by message passing |
| Python | `multiprocessing.Pool` of processes (spawn) | asyncio tasks on one event loop | The GIL lets one thread run bytecode at a time, so CPU work needs processes and waiting uses a single-threaded event loop |

## Libraries and why they were chosen

The four runner workloads use only the standard library, except where the language has none for the job: Rust uses rayon 1.12.0 (the usual data-parallelism crate) in `parallelism` and tokio 1.53.2 (the usual async runtime) in `concurrency`.

| Language | HTTP server | Why | Database driver | Why |
| --- | --- | --- | --- | --- |
| C++ | cpp-httplib 0.60.0 and nlohmann/json 3.12.0 | The standard library has no networking and no JSON. These are the most used header-only pair, and avoid a large framework | libpq, from Debian trixie | The official C client. It has no pool, so the pool phase opens 8 connections and gives one to each thread |
| Rust | axum 0.8.9 on tokio 1.53.2, serde_json 1.0.151 | No HTTP server in the standard library. axum is the most used framework | sqlx 0.9.0 | The most used async database library, with a built-in pool |
| Go | `net/http`, `encoding/json` | Standard library | pgx 5.11.0 with pgxpool | The most used PostgreSQL driver for Go |
| Java | `com.sun.net.httpserver` with a virtual-thread executor, Jackson 3.2.3 | The server ships with the JDK. The JDK has no JSON parser and Jackson is the most used one | PostgreSQL JDBC 42.7.14 and HikariCP 7.1.0 | The official driver and the most used pool |
| TypeScript | `Bun.serve` | Built into Bun | `Bun.sql` | Built into Bun, with a pool |
| Elixir | Bandit 1.12.5 and Plug 1.20.3, `JSON` from the standard library | Plug is the standard web interface and Bandit the default server of Phoenix | Postgrex 0.22.4 | The driver used by Ecto, with a built-in pool |
| Python | FastAPI 0.142.4 on uvicorn 0.54.0, one worker | `http.server` is for development only. FastAPI is the most used framework | psycopg 3.3.6 and psycopg-pool 3.3.3 | The most used PostgreSQL driver |

Every version is pinned exactly: image tags, `Cargo.lock`, `go.sum`, `mix.lock`, `requirements.txt` (frozen, including transitive packages) and fixed download URLs for the Java jars and the C++ headers. These libraries are not in the stack agreed for mini-projects (`.claude/rules/mini-project.md`), so they are listed here for the owner to confirm or replace.

## Method

- Everything runs in containers of pinned images. The four runner workloads and `build-time` run with `--network none`. Programs are compiled into the image, so no run reads the program through a bind mount.
- `cpu-single`, `parallelism`, `concurrency` and `memory` use the shared runner (`tools/bench`): hyperfine 2.0.0 runs each command 5 times after 1 discarded warm-up run and records wall-clock time, CPU time and peak resident memory of the whole process. The program prints the time of its measured section itself.
- Speed-up is calculated on the measured section (start-up is not parallel work), from 5 extra samples per case collected by `scripts/collect-sections.ts`. Efficiency is speed-up divided by workers.
- Memory per task is (peak memory with n tasks − peak memory with 0 tasks) / n.
- `http`: one server at a time, limited to 4 CPUs and 2 GiB, on an `internal` Docker network with no published port. k6 2.3.0 (also 4 CPUs) runs 32 virtual users for 10 s, 3 times, each after a 3 s warm-up. `http/collect.ts` samples the server container from `docker stats` while k6 is sending load and drops the first and last sample of each run. The k6 script refuses any target that is not `localhost` or a service of the compose file.
- `build-time`: hyperfine with `--prepare`. Cold removes the output and the compiler cache before each run. Warm appends a comment line to the source before each run.
- `binary-size`: exact sizes from `stat` and `du` inside the images.
- `database`: PostgreSQL 18.6 with its data on tmpfs, on an `internal` network. Each client runs once as warm-up and 3 times measured, with 5,000 rows and 8 workers in the pool phase. CPU time and peak memory are reported by the client process itself, from the kernel's accounting.

## Results

The tables below are rewritten by `bun run data` from the committed `results/` files. The raw tables, with the exact commands, are in each `results/results.md`.

<!-- results:start -->

### Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

### Runtimes

- cpp: g++ (GCC) 16.2.0 (sef-bench-cpu-single-cpp:local). HTTP: 16.2.0, cpp-httplib 0.60.0 + nlohmann/json 3.12.0 (sef-bd-http-cpp:local). Database: libpq (official C client, from Debian trixie) 17.11-0+deb13u1 (sef-bd-database-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-cpu-single-rust:local). HTTP: rustc 1.99.0 (b940084d7 2026-09-28), axum 0.8.9 + tokio 1.53.2 (sef-bd-http-rust:local). Database: sqlx 0.9.0 on tokio 1.53.2 (sef-bd-database-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-cpu-single-go:local). HTTP: go version go1.27.1 linux/amd64, net/http (standard library) (sef-bd-http-go:local). Database: pgx 5.11.0 (pgxpool) (sef-bd-database-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-cpu-single-java:local). HTTP: openjdk 25.0.4.1 2026-08-18 LTS, JDK HttpServer + virtual threads + Jackson 3.2.3 (sef-bd-http-java:local). Database: PostgreSQL JDBC 42.7.14 + HikariCP 7.1.0 (sef-bd-database-java:local)
- ts: 1.4.2 (sef-bench-cpu-single-ts:local). HTTP: 1.4.2, Bun.serve (built in) (sef-bd-http-ts:local). Database: Bun.sql (built into Bun 1.4.2) (sef-bd-database-ts:local)
- elixir: 1.20.4 (sef-bench-cpu-single-elixir:local). HTTP: 1.20.4, Bandit 1.12.5 + Plug 1.20.3 (sef-bd-http-elixir:local). Database: Postgrex 0.22.4 (sef-bd-database-elixir:local)
- python: Python 3.14.8 (sef-bench-cpu-single-python:local). HTTP: Python 3.14.8, FastAPI 0.142.4 + uvicorn 0.54.0 (1 worker) (sef-bd-http-python:local). Database: psycopg 3.3.6 + psycopg-pool 3.3.3 (sef-bd-database-python:local)

### CPU, one thread: n-body, 1,000,000 steps

`process` is the whole program (mean ± standard deviation of 5 runs), `section` is the kernel only, without start-up.

| Language | process (ms) | range (ms) | section (ms) | CPU (ms) | peak memory (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 102 ± 14.1 | 83.5 – 119 | 95.6 | 101 | 3.68 |
| rust | 48.7 ± 3.29 | 44.4 – 53.4 | 49.2 | 48.6 | 2.04 |
| go | 98.2 ± 11.0 | 82.6 – 112 | 100 | 99.6 | 2.09 |
| java | 151 ± 8.84 | 140 – 163 | 123 | 199 | 44.2 |
| ts | 220 ± 23.8 | 181 – 244 | 234 | 228 | 30.5 |
| elixir | 3660 ± 803 | 2864 – 4742 | 2900 | 4595 | 84.3 |
| python | 9159 ± 861 | 8398 – 10338 | 9178 | 9157 | 14.9 |

### CPU, one thread: prime sieve up to 10,000,000

`process` is the whole program (mean ± standard deviation of 5 runs), `section` is the kernel only, without start-up.

| Language | process (ms) | range (ms) | section (ms) | CPU (ms) | peak memory (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 42.4 ± 5.08 | 37.8 – 48.7 | 29.2 | 42.2 | 12.9 |
| rust | 35.9 ± 5.32 | 29.1 – 41.1 | 25.5 | 35.8 | 11.6 |
| go | 45.8 ± 5.57 | 40.3 – 54.3 | 36.6 | 47.3 | 12.0 |
| java | 119 ± 12.9 | 101 – 136 | 51.9 | 158 | 53.8 |
| ts | 56.1 ± 4.88 | 48.4 – 61.2 | 37.3 | 60.6 | 38.7 |
| elixir | 1586 ± 141 | 1417 – 1770 | 1203 | 2645 | 160 |
| python | 1931 ± 191 | 1792 – 2243 | 1701 | 1930 | 24.5 |

### Parallelism: speed-up (primes below 2,000,000)

Time of the measured section with 1 worker divided by the time with w workers (mean of 5 runs each). The ideal is w.

| Language | time, 1 worker (ms) | 2 workers | 4 workers | 8 workers | 16 workers |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 212 ± 21.5 | 1.93× | 3.14× | 4.31× | 4.59× |
| rust | 217 ± 31.4 | 2.62× | 4.10× | 5.96× | 7.55× |
| go | 178 ± 8.66 | 1.95× | 2.91× | 5.01× | 5.20× |
| java | 271 ± 23.6 | 1.52× | 1.99× | 2.36× | 1.80× |
| ts | 345 ± 67.9 | 1.41× | 2.36× | 2.76× | 1.81× |
| elixir | 685 ± 113 | 1.21× | 1.77× | 3.14× | 2.66× |
| python | 10502 ± 1356 | 1.86× | 2.77× | 4.34× | 4.13× |

### Parallelism: efficiency

Speed-up divided by the number of workers. 100 % means no time was lost.

| Language | 2 workers | 4 workers | 8 workers | 16 workers |
| --- | ---: | ---: | ---: | ---: |
| cpp | 97 % | 79 % | 54 % | 29 % |
| rust | 131 % | 102 % | 75 % | 47 % |
| go | 98 % | 73 % | 63 % | 33 % |
| java | 76 % | 50 % | 29 % | 11 % |
| ts | 71 % | 59 % | 34 % | 11 % |
| elixir | 60 % | 44 % | 39 % | 17 % |
| python | 93 % | 69 % | 54 % | 26 % |

### Parallelism: CPU time of the whole process (ms)

User plus system time summed over all cores, from hyperfine. It grows with the workers when cores wait, spin or share a physical core.

| Language | 1 | 2 | 4 | 8 | 16 |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 228 | 181 | 189 | 232 | 280 |
| rust | 193 | 188 | 267 | 284 | 310 |
| go | 185 | 213 | 195 | 243 | 298 |
| java | 322 | 326 | 363 | 457 | 617 |
| ts | 234 | 273 | 388 | 538 | 697 |
| elixir | 2428 | 2631 | 2374 | 2495 | 2780 |
| python | 9839 | 12243 | 12800 | 19230 | 26853 |

### Concurrency: tasks waiting at the same time

`memory per task` = (peak with n tasks − peak with 0 tasks) / n. C++ OS threads are capped at 10,000 (see the limits below).

| Language | model | tasks | total time (ms) | peak memory (MiB) | memory per task (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | coroutines | 100,000 | 63.4 ± 13.7 | 14.0 | 108 |
| cpp | os-threads | 10,000 | 1694 ± 290 | 85.6 | 8,586 |
| rust | tokio-tasks | 100,000 | 192 ± 29.3 | 52.0 | 514 |
| go | goroutines | 100,000 | 460 ± 33.8 | 265 | 2,762 |
| java | virtual-threads | 100,000 | 4476 ± 708 | 259 | 2,264 |
| ts | promises | 100,000 | 250 ± 42.5 | 70.1 | 542 |
| elixir | processes | 100,000 | 1270 ± 521 | 372 | 3,009 |
| python | asyncio-tasks | 100,000 | 2095 ± 334 | 148 | 1,291 |

### HTTP: JSON echo (`POST /echo`)

32 virtual users, 3 runs of 10 s. CPU: 100 % is one core, the limit is 400 %. `k6 CPU` near 400 % means the load generator was the limit, not the server.

| Language | req/s | p50 (ms) | p95 (ms) | p99 (ms) | peak memory (MiB) | mean CPU (%) | k6 CPU (%) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 14,346 ± 2,295 | 1.35 | 6.51 | 12.7 | 6.61 | 188 | 378 |
| rust | 12,694 ± 3,143 | 1.58 | 7.53 | 14.2 | 5.45 | 107 | 280 |
| go | 16,119 ± 1,116 | 1.25 | 5.55 | 10.1 | 12.2 | 214 | 338 |
| java | 12,939 ± 1,923 | 1.54 | 7.06 | 13.6 | 173 | 168 | 283 |
| ts | 18,719 ± 5,605 | 1.32 | 4.27 | 7.63 | 17.8 | 96 | 306 |
| elixir | 16,470 ± 3,265 | 1.42 | 4.91 | 8.66 | 147 | 329 | 340 |
| python | 2,170 ± 260 | 13.3 | 26.7 | 38.6 | 45.6 | 101 | 110 |

### HTTP: CPU-bound (`GET /primes?limit=5000`)

32 virtual users, 3 runs of 10 s. CPU: 100 % is one core, the limit is 400 %. `k6 CPU` near 400 % means the load generator was the limit, not the server.

| Language | req/s | p50 (ms) | p95 (ms) | p99 (ms) | peak memory (MiB) | mean CPU (%) | k6 CPU (%) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 13,884 ± 2,447 | 1.35 | 6.88 | 13.8 | 6.42 | 239 | 321 |
| rust | 17,625 ± 1,974 | 1.20 | 4.78 | 9.22 | 6.43 | 236 | 342 |
| go | 21,080 ± 3,670 | 0.99 | 4.24 | 8.20 | 12.7 | 312 | 354 |
| java | 9,594 ± 1,588 | 2.11 | 9.74 | 17.6 | 176 | 221 | 270 |
| ts | 7,645 ± 757 | 3.60 | 8.00 | 13.0 | 19.4 | 98 | 175 |
| elixir | 6,927 ± 860 | 3.79 | 10.1 | 16.2 | 147 | 369 | 193 |
| python | 345 ± 16 | 90.9 | 127 | 150 | 47.9 | 106 | 16 |

### Memory: binary trees, depth 18

GC = garbage collected. `CPU` above `time` means helper threads (usually the collector) worked on other cores.

| Language | memory | peak memory (MiB) | time (ms) | CPU (ms) |
| --- | ---: | ---: | ---: | ---: |
| cpp | manual | 35.6 | 2494 ± 269 | 2492 |
| rust | manual | 34.1 | 2406 ± 361 | 2388 |
| go | GC | 38.5 | 2723 ± 359 | 5484 |
| java | GC | 459 | 1029 ± 177 | 1177 |
| ts | GC | 171 | 1809 ± 366 | 3204 |
| elixir | GC | 196 | 2000 ± 199 | 3173 |
| python | GC | 46.1 | 12936 ± 1349 | 12913 |

### Memory: idle process (start and exit)

What every program in the language pays before doing anything.

| Language | memory | start-up time (ms) | peak memory (MiB) |
| --- | ---: | ---: | ---: |
| cpp | manual | 1.86 ± 0.23 | 3.78 |
| rust | manual | 1.33 ± 0.10 | 2.14 |
| go | GC | 2.41 ± 0.44 | 2.09 |
| java | GC | 170 ± 26.5 | 43.6 |
| ts | GC | 21.6 ± 4.09 | 17.6 |
| elixir | GC | 453 ± 50.7 | 85.6 |
| python | GC | 157 ± 14.0 | 14.7 |

### Build time of the `cpu-single` program

`cold` starts with no output and no compiler cache. `warm` changes one line and builds again. `step` says what is really measured: Python, Elixir, Java and Bun have no step that produces machine code ahead of time.

| Language | step | cold (ms) | warm (ms) | command |
| --- | ---: | ---: | ---: | ---: |
| cpp | compile-and-link | 4512 ± 2676 | 4698 ± 1680 | `g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main` |
| rust | compile-and-link | 417 ± 54.8 | 551 ± 265 | `cargo build --release --locked --offline --quiet` |
| go | compile-and-link | 7439 ± 3568 | 335 ± 132 | `go build -o main .` |
| java | compile-to-bytecode | 768 ± 114 | 768 ± 127 | `javac -d out Main.java` |
| ts | bundle-no-typecheck | 8.49 ± 1.72 | 11.3 ± 7.07 | `bun build main.ts --target bun --outfile out/main.js` |
| elixir | compile-to-bytecode | 765 ± 84.3 | 1020 ± 148 | `elixirc --ignore-module-conflict -o out main.ex` |
| python | bytecode-automatic | 75.9 ± 6.72 | 74.4 ± 15.9 | `python -m py_compile main.py` |

### Size on disk of what you ship

`runtime` is what must be on the machine besides the artifact, not counting the operating system and glibc. Sizes are exact, so there is no spread.

| Language | artifact (KiB) | runtime (KiB) | total (KiB) | artifact | runtime |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 20.6 | 3,625.7 | 3,646.4 | executable, g++ -O2, dynamically linked, not stripped | libstdc++ and libgcc_s shared libraries |
| rust | 483.5 | 178.6 | 662.1 | executable, cargo build --release, standard library linked in, not stripped | libgcc_s shared library |
| go | 2,327.8 | 0 | 2,327.8 | executable, CGO_ENABLED=0 go build, statically linked, not stripped | nothing |
| java | 3.8 | 42,894.3 | 42,898.1 | jar with the compiled classes | smallest Java runtime made by jlink (module java.base only, compressed) |
| ts | 2 | 77,637.3 | 77,639.4 | one JavaScript file made by bun build --minify | the bun executable |
| elixir | 7.5 | 65,892.9 | 65,900.4 | the application's compiled modules inside a mix release | the rest of the release: the Erlang runtime (ERTS) and the Erlang and Elixir libraries |
| python | 5.5 | 31,023.7 | 31,029.2 | the source file (Python ships source, bytecode is made on the first run) | the CPython interpreter, its shared library and the standard library |

### Database: insert rows one by one

5000 rows, 3 runs. Each operation is one round trip to PostgreSQL. Client CPU and memory belong to the whole run of the client (all phases).

| Language | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | client CPU (ms) | client memory (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 4,817 ± 272 | 0.19 | 0.28 | 0.44 | 1,134 | 11.5 |
| rust | 1,463 ± 96 | 0.62 | 0.95 | 2.19 | 5,233 | 5.76 |
| go | 4,415 ± 285 | 0.22 | 0.28 | 0.34 | 2,042 | 13.9 |
| java | 5,713 ± 282 | 0.16 | 0.24 | 0.34 | 3,877 | 128 |
| ts | 4,189 ± 204 | 0.23 | 0.32 | 0.46 | 2,654 | 53.0 |
| elixir | 2,699 ± 174 | 0.35 | 0.47 | 0.68 | 4,286 | 112 |
| python | 4,239 ± 694 | 0.23 | 0.32 | 0.45 | 5,663 | 41.5 |

### Database: read by primary key

5000 rows, 3 runs. Each operation is one round trip to PostgreSQL. Client CPU and memory belong to the whole run of the client (all phases).

| Language | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | client CPU (ms) | client memory (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 4,965 ± 344 | 0.19 | 0.27 | 0.39 | 1,134 | 11.5 |
| rust | 1,594 ± 100 | 0.59 | 0.81 | 1.22 | 5,233 | 5.76 |
| go | 4,852 ± 129 | 0.20 | 0.24 | 0.28 | 2,042 | 13.9 |
| java | 6,452 ± 520 | 0.14 | 0.20 | 0.31 | 3,877 | 128 |
| ts | 4,173 ± 300 | 0.22 | 0.32 | 0.60 | 2,654 | 53.0 |
| elixir | 2,761 ± 124 | 0.35 | 0.45 | 0.55 | 4,286 | 112 |
| python | 4,239 ± 492 | 0.22 | 0.31 | 0.58 | 5,663 | 41.5 |

### Database: filter and aggregate

5000 rows, 3 runs. Each operation is one round trip to PostgreSQL. Client CPU and memory belong to the whole run of the client (all phases).

| Language | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | client CPU (ms) | client memory (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 1,919 ± 315 | 0.51 | 0.82 | 1.00 | 1,134 | 11.5 |
| rust | 1,131 ± 93 | 0.85 | 1.12 | 1.63 | 5,233 | 5.76 |
| go | 2,187 ± 204 | 0.43 | 0.58 | 0.82 | 2,042 | 13.9 |
| java | 2,545 ± 29 | 0.37 | 0.48 | 0.64 | 3,877 | 128 |
| ts | 2,020 ± 130 | 0.46 | 0.66 | 1.17 | 2,654 | 53.0 |
| elixir | 1,392 ± 247 | 0.69 | 1.05 | 1.76 | 4,286 | 112 |
| python | 2,081 ± 57 | 0.45 | 0.67 | 0.80 | 5,663 | 41.5 |

### Database: read by key, 8 workers on a pool

5000 rows, 3 runs. Each operation is one round trip to PostgreSQL. Client CPU and memory belong to the whole run of the client (all phases).

| Language | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | client CPU (ms) | client memory (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 23,546 ± 3,998 | 0.23 | 0.60 | 1.78 | 1,134 | 11.5 |
| rust | 13,456 ± 3,505 | 0.55 | 1.03 | 1.78 | 5,233 | 5.76 |
| go | 32,674 ± 1,644 | 0.22 | 0.32 | 0.41 | 2,042 | 13.9 |
| java | 14,681 ± 644 | 0.23 | 0.60 | 6.75 | 3,877 | 128 |
| ts | 9,226 ± 1,626 | 0.64 | 1.69 | 2.71 | 2,654 | 53.0 |
| elixir | 12,187 ± 4,557 | 0.60 | 1.39 | 2.29 | 4,286 | 112 |
| python | 2,259 ± 250 | 3.44 | 5.87 | 7.93 | 5,663 | 41.5 |

<!-- results:end -->

## Limits of the comparison

- **Noise.** The committed numbers were measured while other containers were running on the same machine, inside Docker Desktop on WSL 2. Runs are few (5, or 3 for HTTP and database) and short. A difference smaller than the reported spread is not a difference, and languages whose numbers are close should not be ranked.
- **One machine, one day, default settings.** No JVM flags, no `GOGC` tuning, no alternative allocator, no profile-guided optimisation, no link-time optimisation.
- **Small programs written the plain way.** They show the runtime on a narrow task. Real programs use libraries that change the picture completely (NumPy in Python, arenas in C++ and Rust).
- **Start-up is included** in every whole-process time and dominates the short runs of the fast languages. The `section` column excludes it.
- **Parallelism** uses a job that takes a fraction of a second in the compiled languages, so starting the workers is a visible share of it. The host has 8 physical cores with SMT: 16 workers cannot give 16 times.
- **Concurrency** measures a cold start. The JVM number is dominated by code the JIT has not compiled yet: the same loop repeated in a warm JVM took more than 10 times less in a manual check. C++ OS threads stop at 10,000 because 100,000 threads would approach the thread limit of the Docker virtual machine (`kernel.threads-max` was 127,543), shared with other work.
- **HTTP** compares stacks, not languages. Python and Bun run one process, their default, while the others use the 4 cores. Client and server share the machine, the load model is closed (latency under overload is underestimated), and when the k6 CPU column is near 400 % the load generator is the limit.
- **Database** mostly measures the driver and the round trip. Drivers differ in defaults that matter more than the language, such as whether a statement is prepared once or on every call. PostgreSQL keeps its data in memory here.
- **Build** uses a one-file program. Python, Bun, Java and Elixir do not produce machine code ahead of time, so their rows measure a different step, named in the table.
- **Binary size** does not count the operating system or glibc, and nothing is stripped.
- Speed, memory and size are only some of the reasons to choose a language. Safety, ease of writing, libraries and the team's experience are in no table.

## Gaps found in the shared runner

Nothing in `tools/` was changed. These were worked around inside `benchmarks/`:

- The runner finds a project only by path or under `projects/<area>/`. `benchmarks/package.json` has its own `bench` script, so `bun run bench -- --project cpu-single` works from `benchmarks/`.
- The measured section is read once per row, which is too noisy for speed-up. `scripts/collect-sections.ts` collects 5 samples.
- There is no step before each timed run (needed for cold builds), no long-running service mode (HTTP, database) and no size metric. Each has its own collector, writing the same three result files.
- The runner rebuilds the hyperfine image on every invocation, which contacts the registry and fails on a timeout. `bun run all` retries a failed step.

## Quiz topics it demonstrates

The quiz areas that these workloads illustrate are concurrency and parallelism, operating systems (processes, threads, scheduling), memory management, compilers and interpreters, networking (HTTP) and databases. The links are added when those quiz areas are written.
