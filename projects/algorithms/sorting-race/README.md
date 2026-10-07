# sorting-race

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Six sorting algorithms (bubble, insertion, merge, quick, heap and radix), written from scratch in seven languages, sort the same input files. The race shows two things at once: how the measured time of each algorithm follows its Big O when `n` grows, and how much of the time belongs to the language instead of the algorithm.

Plan item: MP-ALG-1. Full write-up: [docs/en/algorithms/sorting-race.md](../../../docs/en/algorithms/sorting-race.md).

## What it teaches

- A quadratic algorithm loses to an `n log n` one in any language once `n` is large enough: bubble sort in C++ is slower than merge sort in Python well before 10^5 values.
- The order of the input matters for some algorithms and not for others. Insertion and bubble sort are linear on sorted input, heapsort and merge sort do not care.
- Doubling `n` multiplies the time of merge sort by about 2.1, and of bubble sort by about 4. That doubling test is how a benchmark reveals the order of growth.
- Radix sort beats the comparison sorts on fixed-width integers because it never compares two values.
- In Elixir the lesson changes: with immutable linked lists there is no swap and no index, so heapsort becomes a leftist heap and quicksort builds new lists.

## Quiz topics it demonstrates

Area `algorithms`:

- `elementary-sorts` (bubble and insertion sort, inversions, best and worst case)
- `merge-sort` (merge step, stability, the doubling test)
- `quicksort` (partitioning, median of three)
- `heapsort` (heap in an array, sift-down, in-place sorting)
- `linear-time-sorts` (LSD radix sort and the stable counting pass)
- `sorting-properties` (stable, in-place and adaptive algorithms)

## Run

The only requirement is Docker.

```sh
./setup-unix-sorting-race.sh        # Linux and macOS
./setup-windows-sorting-race.ps1    # Windows
```

The script builds one pinned image per language and runs the tests of all seven.

## Structure

| Path | Content |
| --- | --- |
| `ts/src/` | Reference implementation, one file per algorithm, plus the input generator (`generate.ts`), the benchmark entry (`bench.ts`) and the results checker (`check-results.ts`) |
| `cpp/`, `python/`, `java/`, `elixir/`, `rust/`, `go/` | The same six algorithms, a benchmark entry and the same test cases |
| `data/` | Generated input files, one integer per line. Not committed |
| `bench.json` | Benchmark grid read by the repository runner |
| `results/` | Committed benchmark results (`results.md`, `results.json`, `results.js`) |
| `dashboard/` | Static page that charts `results/results.js` |

Every algorithm is a pure function: it receives the values and returns a new sorted sequence. No implementation calls a library sort. Values are integers from 0 to 2^31 - 1, the range radix sort is written for.

## Tests

```sh
docker compose run --rm ts-test       # or cpp-test, python-test, java-test, elixir-test, rust-test, go-test
```

Every language runs the same six cases for each algorithm: empty, single element, sorted, reversed, duplicated and random (1,000 values from a fixed seed). The TypeScript reference also runs a property test over 200 random arrays, checking that the output is ordered and is a permutation of the input.

Formatters and linters (clang-format, ruff, mix format, rustfmt and clippy, gofmt and golangci-lint, javac `-Xlint:all` and Spotless) run in the base images of [docs/en/environment.md](../../../docs/en/environment.md):

```sh
./lint.sh          # check
./lint.sh --fix    # rewrite
bunx biome check projects/algorithms/sorting-race    # TypeScript, from the repository root
```

## Benchmark

One command, from the repository root:

```sh
bun run bench -- --project projects/algorithms/sorting-race
```

It generates the input files (fixed seed, shapes `random`, `sorted` and `reversed`), compiles each language, runs every algorithm on the random files inside a container without network, and writes `results/`. Then check the two claims of the benchmark and print the table of input shapes:

```sh
cd projects/algorithms/sorting-race
docker run --rm --network none -v "$PWD:/app" -w /app oven/bun:1.4.2 bun run ts/src/check-results.ts
docker run --rm --network none -v "$PWD:/app" -w /app oven/bun:1.4.2 bun run ts/src/shapes.ts 10000
```

The checker fails unless every implementation printed the same checksum for the same input file (182 rows, 7 languages, 5 files in the committed run) and merge sort stayed within its doubling limit. The committed output of the shapes script is `results/shapes.md`.

### Caps

| Cap | Value | Why |
| --- | --- | --- |
| Quadratic algorithms (bubble, insertion) | `n` up to 10,000 | At 100,000 a single run takes minutes in Python and Elixir |
| Benchmark sizes | 1,000, 2,000, 10,000, 100,000 and 200,000 | Two doubling pairs: 1,000 to 2,000 for the quadratic algorithms and 100,000 to 200,000 for the rest |
| Benchmark shape | `random` only, across the seven languages | Racing the three shapes in seven languages is 546 rows. The shapes are compared in one language by `shapes.ts` |
| Input generator | three shapes, up to 1,000,000 | `bun run ts/src/generate.ts 1000000` writes the 10^6 files. Add sizes and shapes to `bench.json` to race them |
| Runs | 3 measured runs after 1 warm-up, per row | The table reports mean and standard deviation of the whole process |
| Measured section | fastest of up to 5 sorts inside the program, while the total stays under 300 ms | The minimum is the value least disturbed by other programs on the machine |

The committed run has 182 rows and took about 16 minutes on the machine recorded in `results/results.md`, which was shared with other workloads at the time. Most of that is container start-up, one container at a time.

### What the committed results show

Measured section (the sort only), random input, in milliseconds:

| n | algorithm | C++ | Rust | Go | Java | TypeScript | Python | Elixir |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10,000 | bubble | 69.0 | 108 | 63.6 | 82.1 | 252 | 7,319 | 1,205 |
| 10,000 | insertion | 12.8 | 23.4 | 18.3 | 12.1 | 104 | 4,317 | 562 |
| 10,000 | merge | 0.60 | 0.65 | 0.63 | 1.32 | 1.55 | 32.7 | 2.94 |
| 200,000 | merge | 18.1 | 14.2 | 21.5 | 24.3 | 47.1 | 1,121 | 211 |
| 200,000 | heap | 22.3 | 20.4 | 20.7 | 29.9 | 48.5 | 1,294 | 758 |

- The algorithm outweighs the language: at 10,000 values, merge sort in Python (32.7 ms) is twice as fast as bubble sort in C++ (69.0 ms), and the gap grows with `n`.
- Doubling `n` from 100,000 to 200,000 multiplied the time of merge sort by 1.76 (C++), 1.81 (Rust), 1.82 (Go), 1.93 (Python), 2.37 (TypeScript) and 2.45 (Java), all below the 2.5 limit and far from the 4 of a quadratic algorithm.
- Elixir is the exception: 3.51 in the committed run, and between 2.1 and 2.6 in a separate quiet run. It sorts immutable linked lists, so its time includes the garbage collector copying live data. The checker gives it the limit 4, enough to show the growth is not quadratic. Pairs that take less than 1 ms (1,000 to 2,000 values) are printed but not judged, because the clock noise is larger than the measurement.
- Input shape, TypeScript, 10,000 values (`results/shapes.md`): bubble sort takes 220 ms on random input and 0.13 ms on sorted input, insertion sort 126 ms and 0.36 ms. Heap and radix sort stay within the same few milliseconds on every shape.

Timings on a shared machine are noisy: read the spread in `results/results.md` before comparing two close numbers.

### Reading the results

`results/results.md` has two times per row. `process` is the whole program measured by hyperfine, including runtime start-up and reading the file. `section` is only the call to the sort, timed by the program itself. Use `section` to compare algorithms and `process` to see what a user would wait for.

### Dashboard

Open `dashboard/index.html` in a browser, straight from disk. It loads the committed `results/results.js` with a `<script>` tag and makes no network request. The chart shows time against `n` on log-log axes, one line per algorithm, with selectors for language, input shape and metric. On log-log axes a quadratic algorithm is a line of slope 2 and an `n log n` one is a line of slope slightly above 1.
