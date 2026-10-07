# hybrid-quicksort

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

One quicksort with two knobs: the pivot strategy (first element, random, median of three) and the threshold `k` below which a range is sorted with insertion sort. The project measures what each knob changes in practice: the pivot decides whether sorted input is the best case or the quadratic worst case, and the threshold trims the constant factor.

Plan item: MP-ALG-4. Languages: C++ and Rust. Full write-up: [docs/en/algorithms/hybrid-quicksort.md](../../../docs/en/algorithms/hybrid-quicksort.md).

## What it teaches

- With the first element as the pivot, sorted and reversed inputs split every range into "nothing" and "everything else": `n` levels instead of `log n`, and time that grows 16 times when `n` grows 4 times.
- A random pivot removes the bad input: the worst case now depends on luck, not on the data. Median of three does the same for sorted data at the price of two comparisons.
- Recursing on the smaller side keeps the stack `O(log n)` deep even when the time is quadratic.
- Switching to insertion sort on small ranges keeps the `O(n log n)` growth and lowers the constant. The best `k` is found by measuring, and it depends on language and machine.

## Quiz topics it demonstrates

Area `algorithms`:

- `quicksort` (partitioning, worst case, pivot strategies, random pivot, stack depth, insertion-sort threshold)
- `elementary-sorts` (insertion sort on small or nearly sorted ranges)
- `sorting-properties` (adaptive behaviour and input shapes)

## Run

The only requirement is Docker.

```sh
./setup-unix-hybrid-quicksort.sh        # Linux and macOS
./setup-windows-hybrid-quicksort.ps1    # Windows
```

## Structure

| Path | Content |
| --- | --- |
| `cpp/quicksort.hpp` | The quicksort, the three pivot strategies, the input shapes and the checksum |
| `cpp/main.cpp` | Benchmark entry and the threshold sweep |
| `cpp/test_quicksort.cpp` | Tests |
| `rust/src/lib.rs`, `rust/src/main.rs` | The same in Rust, with the tests inside `lib.rs` |
| `bench.json`, `results/` | Benchmark grid and committed results |
| `dashboard/` | Static page that charts `results/results.js` |

An implementation is named `<pivot>-k<threshold>`, for example `median3-k10`. Inputs are built in memory from a fixed seed: `random`, `sorted` and `reversed` hold the same values in a different order.

## Tests

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- Every pivot strategy with every threshold (0, 5, 10, 20, 50) sorts every shape at six sizes, plus an input full of duplicates. The oracle is the library sort.
- With the first-element pivot on sorted input, the time must grow more than 8 times when `n` grows 4 times (quadratic growth predicts 16), while median of three must grow less than 8 times (`n log n` predicts about 4.4).

Formatters and linters (clang-format, rustfmt, clippy) run in the base images:

```sh
./lint.sh          # check
./lint.sh --fix    # rewrite
```

## Benchmark

```sh
bun run bench -- --project projects/algorithms/hybrid-quicksort
```

The grid runs seven implementations (`first-k0`, `random-k0`, `median3-k0`, `median3-k5`, `median3-k10`, `median3-k20`, `median3-k50`) on the three shapes at 4,000, 16,000 and 1,000,000 values, in both languages. Inside each program the sort is repeated 5 times on fresh copies and the median is reported as the measured section.

Caps: `first-k0` stops at 16,000 values, because at 1,000,000 its quadratic case would take minutes per run. Everything else runs in milliseconds.

### Threshold sweep

One command per language sorts the same 1,000,000 random values with `k` = 0, 5, 10, 20 and 50 and prints the best value:

```sh
docker compose run --rm cpp-sweep
docker compose run --rm rust-sweep
```

The committed output is in `results/threshold-cpp.md` and `results/threshold-rust.md`.

### Dashboard

Open `dashboard/index.html` in a browser, straight from disk. It reads the committed `results/results.js` and draws time against `n`, one line per strategy. Use the "Variant" selector to switch between `random`, `sorted` and `reversed`: on `sorted` the line of `first-k0` climbs with slope 2 on the log-log chart while the others stay near slope 1.

### What the committed results show

Measured section in milliseconds (median of 5 sorts), from `results/results.md` (120 rows, about 4 minutes):

| Implementation | Shape | n | C++ | Rust |
| --- | --- | ---: | ---: | ---: |
| `first-k0` | sorted | 4,000 | 3.81 | 14.9 |
| `first-k0` | sorted | 16,000 | 51.4 | 212 |
| `median3-k0` | sorted | 4,000 | 0.04 | 0.06 |
| `median3-k0` | sorted | 16,000 | 0.17 | 0.19 |
| `random-k0` | sorted | 16,000 | 0.29 | 0.30 |
| `median3-k0` | random | 1,000,000 | 89.8 | 121 |
| `median3-k5` | random | 1,000,000 | 85.7 | 79.3 |
| `median3-k10` | random | 1,000,000 | 82.5 | 68.7 |
| `median3-k20` | random | 1,000,000 | 74.6 | 69.6 |
| `median3-k50` | random | 1,000,000 | 68.1 | 65.7 |

- **Pivot.** On sorted input, `first-k0` grew 13.5 times (C++) and 14.2 times (Rust) when `n` grew 4 times: quadratic growth, which predicts 16. Median of three grew about 4 times. At 16,000 values the first-element pivot is already about 300 times (C++) and 1,100 times (Rust) slower than median of three.
- **Threshold.** The best value recorded is **k = 50** in both languages, in the grid above and in the dedicated sweep (`results/threshold-cpp.md`: 56.7 ms against 91.8 ms for k = 0, `results/threshold-rust.md`: 60.4 ms against 67.7 ms). The gain is a constant factor, as expected.
- The ranges of the sweep overlap for neighbouring thresholds, and the machine was shared, so read "k = 50 is best here" as "a threshold of a few dozen values helps", not as a universal constant.
- All 120 rows print the same checksum for the same shape and size: every strategy, every threshold and both languages produce the same sorted output.
