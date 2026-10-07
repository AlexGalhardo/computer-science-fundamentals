# Sorting race

> Versão em português: [docs/pt/algorithms/sorting-race.md](../../pt/algorithms/sorting-race.md)

Mini-project: [`projects/algorithms/sorting-race`](../../../projects/algorithms/sorting-race/README.md) (MP-ALG-1). Languages: TypeScript (reference), C++, Python, Java, Elixir, Rust and Go. Quiz: area `algorithms`, topics `elementary-sorts`, `merge-sort`, `quicksort`, `heapsort`, `linear-time-sorts` and `sorting-properties`.

## The question

Is a program slow because of the language or because of the algorithm? The race answers by holding one thing fixed at a time: six algorithms, seven languages, the same input files.

## The six algorithms

| Algorithm | Idea | Best | Worst | Extra memory | Stable |
| --- | --- | --- | --- | --- | --- |
| Bubble | swap out-of-order neighbours, stop after a pass with no swap | `O(n)` | `O(n²)` | `O(1)` | yes |
| Insertion | insert each value into the sorted prefix | `O(n)` | `O(n²)` | `O(1)` | yes |
| Merge | split in half, sort the halves, merge | `O(n log n)` | `O(n log n)` | `O(n)` | yes |
| Quick | partition around the median of three, sort each side | `O(n log n)` | `O(n²)` | `O(log n)` stack | no |
| Heap | build a max-heap in the array, move the maximum to the end | `O(n log n)` | `O(n log n)` | `O(1)` | no |
| Radix (LSD, base 256) | four stable counting passes, one per byte | `O(n)` | `O(n)` | `O(n)` | yes |

Every implementation is a pure function written from scratch, with no call to a library sort. Radix sort is written for integers from 0 to 2^31 - 1, so the input files stay in that range.

## How the race is kept fair

- **Same input.** A generator with a fixed seed writes one integer per line. Every language reads the same file.
- **Same answer.** Every program prints a checksum of its output, `h = (h · 31 + v) mod 1,000,000,007`, which depends on the order. The checker fails if two rows for the same file disagree.
- **Same test cases.** Empty, single element, sorted, reversed, duplicated and random, in the tests of all seven languages.
- **Only the sort is timed.** The `section` column excludes runtime start-up and file parsing. The `process` column includes them.

## What to look at in the results

1. **Algorithm against language.** At 10,000 values, merge sort in Python took 32.7 ms and bubble sort in C++ took 69.0 ms. The slowest language with a good algorithm beat the fastest language with a bad one.
2. **The doubling test.** From 100,000 to 200,000 values, merge sort took between 1.76 and 2.45 times longer in six languages. `n log n` predicts about 2.1 and a quadratic algorithm would give 4.
3. **The Elixir exception.** Elixir measured 3.51 in the committed run and 2.1 to 2.6 in a quiet one. Its lists are immutable, so sorting allocates new cells all the time and the garbage collector copies the live ones. The algorithm is still `n log n`, but the runtime adds a cost that grows faster.
4. **Where the lesson changes.** In Elixir there is no swap and no index. Heapsort becomes a leftist heap, a tree whose only operation is "merge two heaps", and quicksort builds three new lists per partition.
5. **Input shape.** `results/shapes.md` compares random, sorted and reversed input in TypeScript: bubble and insertion sort drop from hundreds of milliseconds to a fraction of a millisecond on sorted input, while heap and radix sort do not react.

The numbers come from one machine that was running other workloads. Read the spread, and trust ratios more than absolute times.

## Reproduce

```sh
bun run bench -- --project projects/algorithms/sorting-race
```

Results: [`results/results.md`](../../../projects/algorithms/sorting-race/results/results.md). Dashboard: open `projects/algorithms/sorting-race/dashboard/index.html` from disk. The caps of the benchmark are listed in the README of the mini-project.

## Things to try

- Add selection sort and count its swaps against bubble sort.
- Replace the median of three in quicksort with the first element and run the sorted shape.
- Add 1,000,000 to `sizes` in `bench.json` and see which languages still finish in a second.
