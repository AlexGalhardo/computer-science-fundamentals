# scaling-by-cores

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How much faster does a program get with more cores, and why not linearly? This mini-project (MP-PAR-1) runs two CPU-bound workloads, prime counting and a Mandelbrot render, sequentially and with 1, 2, 4 and 8 workers, in Rust, Go and C++. It proves that the parallel results are exactly the sequential ones, measures speed-up and efficiency, and fits Amdahl's law to the measurements to estimate the serial fraction.

Longer explanation of the concepts: [docs/en/parallelism/scaling-by-cores.md](../../../docs/en/parallelism/scaling-by-cores.md).

## Quiz topics it demonstrates

Area `parallelism` of the quiz:

- `amdahl-gustafson`: the serial fraction is estimated from the measurements by inverting Amdahl's law.
- `speedup-efficiency-scalability`: speed-up and efficiency tables for 1, 2, 4 and 8 workers, with a sequential baseline (strong scaling).
- `data-vs-task-parallelism`: the same operation over slices of numbers or rows, and what happens when equal slices are not equal work.
- `fork-join-work-stealing`: workers are forked and joined; static blocks against dynamic chunks on an irregular workload.
- `parallel-sorting-reductions`: one local partial result per worker, combined after the join with an associative and commutative operator.
- `determinism-reproducibility`: the parallel result equals the sequential one bit for bit, in three languages.
- `false-sharing-cache-effects`: workers accumulate in local variables and write the shared slot once, so no cache line is fought over in the hot loop.
- `shared-vs-distributed-memory`: threads of one process write disjoint parts of the same buffer.
- `map-reduce-patterns`: an independent map over the items followed by a merge of the partial results.

## Run

The only requirement is Docker.

```sh
./setup-unix-scaling-by-cores.sh        # Linux and macOS
./setup-windows-scaling-by-cores.ps1    # Windows
```

The script builds one pinned image per language, runs formatter, linter and tests of each, and ends with a demo: the same Mandelbrot image with 1 and with 8 workers in the three languages. The `checksum` field must be identical on every line and `elapsedMs` should drop.

## Structure

| Path | Content |
| --- | --- |
| `rust/` | `std::thread::scope`, no crates. `src/primes.rs`, `src/mandelbrot.rs`, `src/schedule.rs` and the command line in `src/main.rs` |
| `go/` | goroutines with `sync.WaitGroup` and `sync/atomic`, standard library only |
| `cpp/` | `std::thread` and `std::atomic`, header-only library plus `main.cpp` and `test_scaling.cpp` |
| `report/` | `scaling.ts` turns the benchmark rows into speed-up, efficiency and the Amdahl fit |
| `results/` | committed output of the benchmark and of the report |
| `dashboard/` | static page that plots speed-up and efficiency against workers from `results/results.js` |
| `bench.json` | the benchmark grid: 3 languages, 6 implementations, 4 worker counts |

Each implementation has the same command line, `<workload>-<mode> <n> <workers>`, with workload `primes` or `mandelbrot` and mode `seq`, `static` or `dynamic`. It prints one JSON line following the [benchmark contract](../../../docs/en/benchmarks.md). `n` is the number of items: the integers up to `n` for the primes, or the pixels of a square image whose side is the integer square root of `n`.

Two ways of splitting the work are implemented, because their difference is the main reason the speed-up is not linear here:

- `static`: one contiguous block per worker. No coordination, but the blocks do not cost the same, so some workers finish early and wait.
- `dynamic`: workers take the next small chunk (10,000 numbers or 4 rows) from a shared atomic counter. Rust uses a queue behind a mutex for the image, because that is how it keeps the proof that each pixel has one writer.

## Tests

```sh
docker compose run --rm rust-test     # cargo fmt --check, clippy -D warnings, cargo test
docker compose run --rm go-test       # gofmt, go vet, golangci-lint, go test -race
docker compose run --rm cpp-test      # clang-format --dry-run --Werror, tests built with -Wall -Wextra -Werror
docker compose run --rm report-test   # bun test of the report formulas
```

What the tests prove:

- The parallel result equals the sequential one exactly, for 1, 2, 3, 4 and 8 workers and both schedules, including ranges smaller than the number of workers.
- Known values: 25 primes up to 100, 9,592 primes up to 100,000 with sum 454,396,537.
- The three languages render the same image: the same golden checksum is asserted in the three test suites.
- The Go tests run under the race detector.
- The Amdahl fit returns the serial fraction that generated exact Amdahl data, and the report refuses a benchmark whose checksums differ.

## Benchmark

One command, from the repository root (it needs Bun on the host, as every benchmark of the repository):

```sh
bun run bench -- --project projects/parallelism/scaling-by-cores
```

It compiles each implementation inside its pinned image, runs the whole grid with no network, and writes `results/results.md`, `results/results.json` and `results/results.js`. Then derive the scaling tables, in Docker:

```sh
docker compose --profile report run --rm report
```

That writes `results/scaling.md` and `results/scaling.json`. Open `dashboard/index.html` in a browser for the chart.

## Results

Measured on 2026-10-07 on an AMD Ryzen 7 5700X3D (8 physical cores, 16 logical), Docker Desktop on Windows with 16 CPUs, `n` = 9,000,000 (primes up to 9,000,000 and a 3000 x 3000 image), 5 runs per row after 1 warm-up. Machine, runtime versions and exact commands: [results/results.md](results/results.md). Every row, with mean, standard deviation, best run and serial fraction: [results/scaling.md](results/scaling.md).

**Read these numbers with care.** The machine was shared with other Docker workloads while the benchmark ran, so the times are noisy: the standard deviation of a row is 9% of its mean on average, and above 20% on some rows. That is why each cell below is computed between the fastest runs (best sequential time over best parallel time), and why the same grid, run twice, does not give the same table. The range between the two runs is shown after the tables. On a quiet machine expect higher and steadier values.

### Parallel results equal the sequential ones

All 72 rows of the grid (3 languages, sequential, static and dynamic, 1 to 8 workers) printed the same checksum per workload:

| Workload | Result |
| --- | --- |
| primes | 602,489 primes up to 9,000,000, sum 2,613,521,583,098 |
| mandelbrot | 1,554,159,510 iterations in total, image checksum `99d0e04fa277c931` |

### Speed-up and efficiency

Each cell is `speed-up (efficiency)` for that number of workers. The baseline is the sequential implementation of the same language.

#### primes

| Language | Schedule | Sequential (ms) | 1 | 2 | 4 | 8 | Fitted serial fraction |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | static | 1481 | 0.98 (98%) | 1.50 (75%) | 2.35 (59%) | 4.26 (53%) | 19.8% |
| cpp | dynamic | 1481 | 0.90 (90%) | 1.74 (87%) | 3.22 (81%) | 4.22 (53%) | 11.5% |
| go | static | 1572 | 0.82 (82%) | 1.50 (75%) | 1.59 (40%) | 2.46 (31%) | 39.0% |
| go | dynamic | 1572 | 0.82 (82%) | 1.30 (65%) | 2.53 (63%) | 3.34 (42%) | 25.1% |
| rust | static | 1388 | 0.89 (89%) | 1.46 (73%) | 2.28 (57%) | 3.31 (41%) | 24.6% |
| rust | dynamic | 1388 | 0.75 (75%) | 1.67 (84%) | 2.49 (62%) | 3.07 (38%) | 21.4% |

#### mandelbrot

| Language | Schedule | Sequential (ms) | 1 | 2 | 4 | 8 | Fitted serial fraction |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | static | 4455 | 0.90 (90%) | 1.80 (90%) | 1.95 (49%) | 2.59 (32%) | 28.7% |
| cpp | dynamic | 4455 | 0.89 (89%) | 2.00 (100%) | 3.59 (90%) | 6.24 (78%) | 3.3% |
| go | static | 4550 | 0.92 (92%) | 2.03 (102%) | 1.92 (48%) | 2.65 (33%) | 26.6% |
| go | dynamic | 4550 | 0.94 (94%) | 1.88 (94%) | 3.34 (83%) | 5.37 (67%) | 6.8% |
| rust | static | 5246 | 0.79 (79%) | 1.51 (75%) | 1.78 (45%) | 2.82 (35%) | 32.7% |
| rust | dynamic | 5246 | 0.88 (88%) | 1.98 (99%) | 3.58 (89%) | 5.44 (68%) | 4.8% |

Spread between two runs of the whole grid, speed-up with 8 workers (the committed run is the second value):

| Workload | Schedule | cpp | go | rust |
| --- | --- | --- | --- | --- |
| primes | static | 4.32 and 4.26 | 4.10 and 2.46 | 4.12 and 3.31 |
| primes | dynamic | 4.45 and 4.22 | 5.01 and 3.34 | 4.49 and 3.07 |
| mandelbrot | static | 2.19 and 2.59 | 2.23 and 2.65 | 2.71 and 2.82 |
| mandelbrot | dynamic | 6.11 and 6.24 | 4.23 and 5.37 | 6.05 and 5.44 |

### Amdahl fit: the estimated serial fraction

The last column of the tables is the serial fraction `s` of Amdahl's law, `S(N) = 1 / (s + (1 - s) / N)`, fitted by least squares to the speed-ups measured with 2, 4 and 8 workers.

- **Mandelbrot, dynamic schedule: s is 3.3% (C++), 6.8% (Go) and 4.8% (Rust).** This is the best the program does. With s around 5%, Amdahl's law caps the speed-up near 20 however many cores are added, and predicts about 6 with 8 workers, which is what was measured.
- **Mandelbrot, static schedule: s is 28.7% (C++), 26.6% (Go) and 32.7% (Rust).** The code is the same, only the split changed, and the speed-up stops near 2.7.
- **Primes: s is between 11.5% and 39.0%**, with the dynamic schedule below the static one in the three languages. These are the noisiest rows of the grid, as the spread table shows.

### Why not linearly

The fitted s is an *effective* serial fraction. The code that is really serial in these programs is tiny: starting the process and the threads, allocating the image, one pass over it for the checksum, printing one line. What the fit absorbs is everything else that keeps workers from working:

1. **Load imbalance.** This is the large effect, and the static Mandelbrot rows isolate it. With 2 workers the image is cut along its axis of symmetry, both halves cost the same, and the speed-up reaches 1.8 in C++ and 2.0 in Go (1.5 in Rust, a noisy row). With 4 workers the two middle blocks hold most of the points inside the set, the two outer workers finish early and wait, and the speed-up stays at about 1.9. Amdahl's law reads the idle time as serial code: an s near 30% for a program with no such code. The dynamic schedule removes the imbalance and s falls below 7%. The per-row serial fraction in `results/scaling.md` (Karp-Flatt) shows it too: it jumps from one worker count to the next instead of staying constant, the sign of overhead and not of serial code.
2. **The parallel machinery.** The parallel code with 1 worker is slower than the sequential code in every row (speed-up between 0.75 and 0.98): threads, the shared counter, the queue and the merge are not free.
3. **Cores are not all free and not all equal.** 8 workers need all 8 physical cores of this CPU, which also run the operating system, Docker and, during this measurement, other containers. A worker that loses its core for a moment delays the join. A CPU also typically runs one busy core at a higher clock than eight, which this benchmark does not isolate.
4. **Truly serial code.** Small here, but it is the only part that no number of cores removes.

The practical reading: before blaming Amdahl's law, check that every worker is busy until the end. Here that single change, static to dynamic, moves the Mandelbrot speed-up with 8 workers from about 2.7 to about 5.7.

## Dependencies and versions

No library outside the standard library of each language: `std::thread` in Rust and C++, goroutines in Go. A crate such as rayon would hide the mechanism this mini-project is about.

| Tool | Version |
| --- | --- |
| Rust | image `rust:1.99.0-slim-trixie` |
| Go | image `golang:1.27.1-bookworm`, golangci-lint from `golangci/golangci-lint:v2.14.0` |
| C++ | image `gcc:16.2.0-trixie` (C++23), clang-format from the Debian package |
| Report | image `oven/bun:1.4.2` |
