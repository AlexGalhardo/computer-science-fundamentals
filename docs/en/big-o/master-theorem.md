# Interactive master theorem

> Versão em português: [docs/pt/big-o/master-theorem.md](../../pt/big-o/master-theorem.md) · Versión en español: [docs/es/big-o/master-theorem.md](../../es/big-o/master-theorem.md)

Mini-project MP-BIGO-2, in [`projects/big-o/master-theorem`](../../../projects/big-o/master-theorem). It teaches how the three cases of the master theorem decide the cost of a recurrence.

## The recurrence

A divide and conquer algorithm splits a problem of size n into `a` subproblems of size `n/b`, and does `f(n)` of work outside the recursive calls (splitting and combining):

```text
T(n) = a·T(n/b) + f(n)        a ≥ 1, b > 1
```

Merge sort is `2T(n/2) + n`, binary search is `T(n/2) + 1`, and Strassen's matrix multiplication is `7T(n/2) + n²`.

## One comparison, three cases

The recursion tree has `a^i` calls at depth `i`, each on an input of size `n/b^i`. Its leaves number `n^(log_b a)`. The theorem compares `f(n)` with that number:

| Case | Condition | Who pays the bill | Solution |
| --- | --- | --- | --- |
| 1 | f(n) is polynomially smaller than n^(log_b a) | the leaves | Θ(n^(log_b a)) |
| 2 | f(n) has the same order as n^(log_b a) | every level, equally | Θ(n^(log_b a) · log n) |
| 3 | f(n) is polynomially larger than n^(log_b a) | the root | Θ(f(n)) |

"Polynomially" means by a factor `n^ε` for some ε > 0. Case 3 also needs the regularity condition `a·f(n/b) ≤ c·f(n)` with `c < 1`, which always holds for the functions used here.

## When the theorem does not apply

The classifier reports two situations instead of inventing an answer:

- **Outside the hypotheses**: `a < 1` or `b ≤ 1`, for example a recurrence that subtracts instead of dividing. The input is rejected with the hypothesis it breaks.
- **In the gap between the cases**: `f(n)` differs from `n^(log_b a)` only by a logarithmic factor, as in `2T(n/2) + n log n`. The three basic cases say nothing. For a positive power of the logarithm the tool also shows what the extended case 2 gives (one more log factor, here Θ(n log² n)). For `n / log n` it gives no solution.

`f(n)` is restricted to `n^d · (log n)^k`, which covers the usual textbook recurrences.

## The empirical check

A prediction is worth more when it can fail. `ts/src/empirical.ts` generates the recursive function a recurrence describes, runs it with no memoisation and counts its calls and its total work `W(n)`. If the theorem predicts Θ(g(n)), the ratio `W(n) / g(n)` must settle on a constant.

The check measures the **drift** of that ratio between the two largest sizes, for the predicted class and for its two neighbours (one log factor less, one more). The measured growth agrees when the predicted class has a drift below 5% and smaller than both neighbours. Results, from [`results/results.md`](../../../projects/big-o/master-theorem/results/results.md):

| Recurrence | Predicted | Largest n | Calls | Drift predicted / one log less / one log more |
| --- | --- | ---: | ---: | --- |
| merge sort, 2T(n/2) + n | Θ(n log n) | 65,536 | 131,071 | 0.0039 / 0.0625 / 0.0662 |
| binary search, T(n/2) + 1 | Θ(log n) | 16,777,216 | 25 | 0.0017 / 0.0417 / 0.0433 |
| 7-way split, 7T(n/2) + n² | Θ(n^2.81) | 128 | 960,800 | 0.0087 / 0.1768 / 0.1354 |

These are counts, not times, so they are the same on every machine.

## The recursion tree

`bun run classify` prints the tree as text, and the static page draws it: the calls of each level on the left, and a bar with the total cost of the level on the right. Bars that grow towards the bottom are case 1, equal bars are case 2, and bars that shrink are case 3. The last level is the base cases, which cost 1 each.

The page offers `a` from 1 to 9, `b` from 2 to 4 and eight driving functions. Every combination was classified by the tested TypeScript code and stored in `results/results.js`, so the page never reimplements the theorem.

## Running it

```sh
cd projects/big-o/master-theorem
docker compose run --rm ts-test                          # tests
docker compose run --rm ts-demo                          # bun run demo
docker compose run --rm ts-demo bun run classify 7 2 2   # one recurrence
```

Then open `dashboard/index.html` from disk.

## Acceptance criteria

| Item | Criterion | Where it is verified |
| --- | --- | --- |
| MP-BIGO-2.1 | unit tests cover one recurrence per case and one that does not fit | `ts/tests/classify.test.ts` |
| MP-BIGO-2.2 | the measured growth agrees with the predicted class for merge sort, binary search and a 7-way split | `ts/tests/empirical.test.ts`, `results/results.md` |
| MP-BIGO-2.3 | one command prints the case and the page draws the tree for the chosen a, b | `bun run classify`, `dashboard/index.html` |

## Related quiz topics

`big-o` / `recurrences-master-theorem`.
