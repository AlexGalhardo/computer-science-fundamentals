# Scaling by cores

> Versão em português: [docs/pt/parallelism/scaling-by-cores.md](../../pt/parallelism/scaling-by-cores.md)

Area: Parallelism. Mini-project: [projects/parallelism/scaling-by-cores](../../../projects/parallelism/scaling-by-cores/README.md) (MP-PAR-1). Languages: Rust, Go, C++.

## The question

A machine has 8 cores. Does a program run 8 times faster on it? This mini-project measures the answer for two CPU-bound programs and explains the gap between the ideal and the measurement.

## Concepts

| Concept | Meaning |
| --- | --- |
| Speed-up | `S(N) = T(1) / T(N)`: how many times faster the program is with N workers. The baseline here is the sequential program, not the parallel one with one worker |
| Efficiency | `E(N) = S(N) / N`: the share of each worker that turned into gain |
| Strong scaling | The problem size is fixed and only the workers vary. This is what the benchmark does |
| Amdahl's law | With a serial fraction `s`, `S(N) = 1 / (s + (1 - s) / N)`, which never exceeds `1 / s` |
| Karp-Flatt metric | Amdahl inverted for one measurement: `s = (1/S - 1/N) / (1 - 1/N)`. Constant `s` means serial code, growing `s` means overhead |
| Data parallelism | The same operation over slices of the data: numbers to test, rows to render |
| Fork-join | Start the workers, wait for all of them, then read their results |
| Static schedule | One contiguous block per worker, decided before the work starts |
| Dynamic schedule | Workers fetch the next small chunk when they are free |
| Reduction | Each worker keeps a local partial result and the partial results are combined at the end |

## The two workloads

**Prime counting.** Count the primes up to `n` by trial division with odd divisors up to the square root. Proving that a number is prime costs about `sqrt(n) / 2` divisions, so large numbers are more expensive than small ones. The result is the count and the sum of the primes.

**Mandelbrot.** Render a square image of the Mandelbrot set: for every pixel, iterate `z = z² + c` until `|z| > 2` or 1,000 steps. Pixels inside the set cost 1,000 steps, pixels far from it cost one or two. The result is the image, summarised by the total of iterations and a checksum.

Both are data parallel: no number and no pixel depends on another. Both are irregular: equal slices of data are not equal amounts of work. That second property is what separates the two schedules.

## How the work is split

```
static, 4 workers                      dynamic, 4 workers

rows  0 ..  499 -> worker 0 (cheap)    shared counter: next free row
rows 500 .. 999 -> worker 1 (costly)   every worker repeats:
rows 1000..1499 -> worker 2 (costly)       take the next 4 rows
rows 1500..1999 -> worker 3 (cheap)        render them
                                       until no row is left
workers 0 and 3 finish early and wait  nobody waits while work remains
```

With the static schedule the program is as slow as its unluckiest worker. With the dynamic schedule the expensive rows end up spread over all workers, at the price of one atomic operation per chunk. The chunk is small enough to balance the load and large enough to keep that shared counter out of the hot loop: 4 rows of the image, or 10,000 numbers.

## Why the parallel result is exactly the sequential one

The acceptance criterion of the mini-project is equality, not similarity.

- **No shared writes.** Every pixel has one writer, and every worker counts in a local variable. There is no data race to make the result depend on the schedule.
- **Integer reduction.** The partial results are integers combined with addition, which is associative and commutative, so the grouping and the order of the workers do not matter.
- **Floating point is per pixel.** The Mandelbrot iteration uses doubles, but each pixel is computed alone, by the same operations in the same order. Nothing is summed across pixels in floating point.
- **No fused multiply-add.** `x * y + z` computed as one instruction rounds once instead of twice and can change the last bit. Rust never fuses on its own, the Go code rounds each product with an explicit `float64(...)` conversion, and the C++ code is compiled with `-ffp-contract=off`. That is why the three languages produce the same checksum.

The tests assert the equality for 1, 2, 3, 4 and 8 workers with both schedules, and the three test suites assert the same golden checksum. The report script refuses to produce a table when any benchmark row prints a different checksum.

## What each language adds

| Language | Workers | What is specific |
| --- | --- | --- |
| Rust | `std::thread::scope` | The compiler demands proof that workers write disjoint memory: the image is cut with `split_at_mut` and `chunks_mut`, and the dynamic schedule hands blocks out from a queue behind a `Mutex` |
| Go | goroutines with `sync.WaitGroup` | Workers write disjoint parts of one slice. Nothing in the language checks it, so the tests run under the race detector (`go test -race`) |
| C++ | `std::thread` and `join` | Same structure as Go with `std::atomic`. Correctness rests on the same discipline, with no checker in the test run |

No external dependency is used in any of the three: the lesson is the mechanism, and a library such as rayon would hide it.

## Measuring

```sh
bun run bench -- --project projects/parallelism/scaling-by-cores
docker compose -f projects/parallelism/scaling-by-cores/docker-compose.yml --profile report run --rm report
```

The first command runs every implementation with 1, 2, 4 and 8 workers inside the pinned language images, with no network, and hyperfine times each process several times. The second derives speed-up, efficiency and the Amdahl fit, and writes `results/scaling.md`.

Two decisions about the numbers:

- **Baseline.** Speed-up is computed against the sequential implementation. The parallel code with one worker is also in the table, so the cost of the parallel machinery itself is visible.
- **Best run and mean.** Other load on the machine can only slow a run down. The speed-up is therefore computed between the fastest runs, and the mean with its standard deviation is printed next to it to show the noise.

## Results

Measured on 2026-10-07 on an AMD Ryzen 7 5700X3D (8 physical cores, 16 logical), Docker Desktop on Windows with 16 CPUs, `n` = 9,000,000 (primes up to 9,000,000 and a 3000 x 3000 image), 5 runs per row after 1 warm-up. Machine, runtime versions and exact commands: [results/results.md](../../../projects/parallelism/scaling-by-cores/results/results.md). Every row, with mean, standard deviation, best run and serial fraction: [results/scaling.md](../../../projects/parallelism/scaling-by-cores/results/scaling.md).

**Read these numbers with care.** The machine was shared with other Docker workloads while the benchmark ran, so the times are noisy: the standard deviation of a row is 9% of its mean on average, and above 20% on some rows. That is why each cell below is computed between the fastest runs (best sequential time over best parallel time), and why the same grid, run twice, does not give the same table. The range between the two runs is shown after the tables. On a quiet machine expect higher and steadier values.

### Parallel results equal the sequential ones

All 72 rows of the grid (3 languages, sequential, static and dynamic, 1 to 8 workers) printed the same checksum per workload:

| Workload | Result |
| --- | --- |
| primes | 602,489 primes up to 9,000,000, sum 2,613,521,583,098 |
| mandelbrot | 1,554,159,510 iterations in total, image checksum `99d0e04fa277c931` |

### Speed-up and efficiency

Each cell is `speed-up (efficiency)` for that number of workers. The baseline is the sequential implementation of the same language.

**primes**

| Language | Schedule | Sequential (ms) | 1 | 2 | 4 | 8 | Fitted serial fraction |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | static | 1481 | 0.98 (98%) | 1.50 (75%) | 2.35 (59%) | 4.26 (53%) | 19.8% |
| cpp | dynamic | 1481 | 0.90 (90%) | 1.74 (87%) | 3.22 (81%) | 4.22 (53%) | 11.5% |
| go | static | 1572 | 0.82 (82%) | 1.50 (75%) | 1.59 (40%) | 2.46 (31%) | 39.0% |
| go | dynamic | 1572 | 0.82 (82%) | 1.30 (65%) | 2.53 (63%) | 3.34 (42%) | 25.1% |
| rust | static | 1388 | 0.89 (89%) | 1.46 (73%) | 2.28 (57%) | 3.31 (41%) | 24.6% |
| rust | dynamic | 1388 | 0.75 (75%) | 1.67 (84%) | 2.49 (62%) | 3.07 (38%) | 21.4% |

**mandelbrot**

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

1. **Load imbalance.** This is the large effect, and the static Mandelbrot rows isolate it. With 2 workers the image is cut along its axis of symmetry, both halves cost the same, and the speed-up reaches 1.8 in C++ and 2.0 in Go (1.5 in Rust, a noisy row). With 4 workers the two middle blocks hold most of the points inside the set, the two outer workers finish early and wait, and the speed-up stays at about 1.9. Amdahl's law reads the idle time as serial code: an s near 30% for a program with no such code. The dynamic schedule removes the imbalance and s falls below 7%. The per-row serial fraction in `projects/parallelism/scaling-by-cores/results/scaling.md` (Karp-Flatt) shows it too: it jumps from one worker count to the next instead of staying constant, the sign of overhead and not of serial code.
2. **The parallel machinery.** The parallel code with 1 worker is slower than the sequential code in every row (speed-up between 0.75 and 0.98): threads, the shared counter, the queue and the merge are not free.
3. **Cores are not all free and not all equal.** 8 workers need all 8 physical cores of this CPU, which also run the operating system, Docker and, during this measurement, other containers. A worker that loses its core for a moment delays the join. A CPU also typically runs one busy core at a higher clock than eight, which this benchmark does not isolate.
4. **Truly serial code.** Small here, but it is the only part that no number of cores removes.

The practical reading: before blaming Amdahl's law, check that every worker is busy until the end. Here that single change, static to dynamic, moves the Mandelbrot speed-up with 8 workers from about 2.7 to about 5.7.

## Where to go next

- Quiz: area `parallelism`, topics `amdahl-gustafson`, `speedup-efficiency-scalability`, `data-vs-task-parallelism`, `fork-join-work-stealing`, `parallel-sorting-reductions`, `determinism-reproducibility`, `false-sharing-cache-effects`, `shared-vs-distributed-memory` and `map-reduce-patterns`.
- Source chapters: Tanenbaum and Bos, Modern Operating Systems, chapter 8 (multiple processor systems); Aho, Lam, Sethi and Ullman, Compilers, chapter 11 (optimizing for parallelism and locality).
