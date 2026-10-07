# Big O lab

> Versão em português: [docs/pt/big-o/big-o-lab.md](../../pt/big-o/big-o-lab.md)

Mini-project MP-BIGO-1, in [`projects/big-o/big-o-lab`](../../../projects/big-o/big-o-lab). It teaches how to measure a function and recognise its growth curve.

## The idea

Big O describes how the cost of an algorithm grows with the size of the input. The lab turns that sentence into an experiment with three steps:

1. **Count.** Each algorithm increments a counter on its basic operation, the step repeated the most. A count, unlike a time, is the same on every machine.
2. **Double.** The input size doubles on every run. How the count reacts to doubling is the signature of the class.
3. **Fit.** The counts are compared with six candidate curves, and the closest one names the class.

## The six samples

| Class | Algorithm | Counted operation | Closed formula | When n doubles |
| --- | --- | --- | --- | --- |
| O(1) | read the middle element of an array | array reads | 1 | nothing changes |
| O(log n) | binary search for a missing value | halvings of the interval | floor(log₂ n) + 1 | one more step |
| O(n) | sum of all elements | additions | n | the count doubles |
| O(n log n) | merge sort | elements written while merging | n·ceil(log₂ n) − 2^ceil(log₂ n) + n | a bit more than double |
| O(n²) | count inversions comparing every pair | comparisons | n(n − 1)/2 | about four times |
| O(2ⁿ) | enumerate every subset | subsets visited | 2ⁿ | the count is squared |

The merge sort formula solves T(n) = T(⌊n/2⌋) + T(⌈n/2⌉) + n with T(1) = 0, and equals n·log₂ n when n is a power of two. The exponential sample uses n = 1, 2, 4, 8, 16: one more doubling would mean more than four billion subsets, which is the lesson about intractable costs.

## Curve fitting

For each candidate g(n) the tool finds, by ordinary least squares, the line `y = a + c·g(n)` closest to the measured points, and reports the root mean square error divided by the mean of y. The candidate with the smallest relative error wins, and a tie goes to the slower-growing curve.

Two things are worth noticing in the results:

- The constant `c` found by the fit is the constant that Big O hides. For the quadratic sample it comes out as about 0.4999, because the count is n(n − 1)/2.
- The quadratic sample is the only one whose best fit is not exact (relative error about 1.4 × 10⁻⁴). The count has a lower-order term, −n/2, that a pure n² curve cannot follow. The error is tiny and the verdict does not change: lower-order terms do not change the class.

## Counts against time

The demo also records the time of each run (median of 5). Time follows the same curve only roughly: for small inputs it is dominated by noise, the JIT compiler and the cache. That is why the class is decided on the counts, and time is shown next to them for comparison.

## Running it

```sh
cd projects/big-o/big-o-lab
docker compose run --rm ts-test    # tests
docker compose run --rm ts-demo    # bun run demo: prints the tables and rewrites results/
```

Then open `dashboard/index.html` from disk. The committed results are in [`results/results.md`](../../../projects/big-o/big-o-lab/results/results.md).

## Acceptance criteria

| Item | Criterion | Where it is verified |
| --- | --- | --- |
| MP-BIGO-1.1 | operation counts match the closed formula for each sample | `ts/tests/samples.test.ts` |
| MP-BIGO-1.2 | the tool names the right class for all six samples | `ts/tests/fit.test.ts` |
| MP-BIGO-1.3 | `bun run demo` prints the table and the dashboard plots the committed results | `docker compose run --rm ts-demo`, `dashboard/index.html` |

## Related quiz topics

`big-o` / `growth-of-functions`, `counting-operations` and `asymptotic-notation`.
