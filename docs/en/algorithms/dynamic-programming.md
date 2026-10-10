# Dynamic programming

> Versão em português: [docs/pt/algorithms/dynamic-programming.md](../../pt/algorithms/dynamic-programming.md) · Versión en español: [docs/es/algorithms/dynamic-programming.md](../../es/algorithms/dynamic-programming.md)

Mini-project: [`projects/algorithms/dynamic-programming`](../../../projects/algorithms/dynamic-programming/README.md) (MP-ALG-2). Languages: TypeScript and Python. Quiz: area `algorithms`, topic `dynamic-programming`.

## The idea

Some problems break into smaller problems that repeat. Plain recursion solves each repetition again, and the number of calls explodes. Dynamic programming solves each distinct subproblem once and stores the answer. It needs two properties:

- **Overlapping subproblems**: the same subproblem is reached by many paths.
- **Optimal substructure**: the best answer is built from the best answers of subproblems.

There are two ways to write it, and they compute the same recurrence:

| | Memoisation | Tabulation |
| --- | --- | --- |
| Direction | top-down | bottom-up |
| Code | the recursion, plus a cache | loops filling a table |
| Subproblems solved | only the ones reached | all of them |
| Risk | deep recursion | choosing a wrong fill order |
| Memory trick | none | keep only the rows still needed |

## The three problems

| Problem | Subproblem | Recurrence | Cost |
| --- | --- | --- | --- |
| 0-1 knapsack | `best(i, w)`: best value with items `i..` and capacity `w` | `max(skip, value[i] + best(i + 1, w - weight[i]))` | `O(n · W)` |
| Longest common subsequence | `lcs(i, j)`: answer for the suffixes `a[i..]`, `b[j..]` | match: `1 + lcs(i + 1, j + 1)`, else `max(lcs(i + 1, j), lcs(i, j + 1))` | `O(m · n)` |
| Coin change | `coins(v)`: fewest coins for the amount `v` | `1 + min(coins(v - c))` over the coins `c ≤ v` | `O(amount · coins)` |

Each one is implemented three times: naive (plain recursion), memoised and tabulated. The naive version is the specification. The tests require the other two to return the same answer on 200 random cases per problem.

## What the call counter shows

Time depends on the machine. The number of calls depends only on the algorithm, so it is the cleanest evidence of repeated work. At the documented sizes:

| Problem | Size | Naive calls | Memoised calls | Ratio |
| --- | ---: | ---: | ---: | ---: |
| Knapsack | 20 items | 734,544 | 2,380 | 309 |
| LCS | 12 letters each | 117,808 | 198 | 595 |
| Coin change | amount 30 | 2,550,408 | 86 | 29,656 |

The memoised count includes the calls that only hit the cache. TypeScript and Python print exactly the same counts, because both build the same instances from the same seed.

## The table, step by step

`docker compose run --rm demo` prints each table as it is filled. For coin change with coins 1, 3 and 4 and amount 6:

```text
amount v           0   1   2   3   4   5   6
after dp[6]        0   1   2   1   1   2   2
```

`dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + min(2, 1, 2) = 2`, the answer `3 + 3`. The greedy rule "largest coin first" pays `4 + 1 + 1`, three coins. The table cannot fall into that trap, because it tries every coin for every amount.

## Benchmark

`bun run bench -- --project projects/algorithms/dynamic-programming` runs the nine implementations in both languages. Results: [`results/results.md`](../../../projects/algorithms/dynamic-programming/results/results.md).

Measured section in milliseconds, from the committed run (92 rows):

| Implementation | n | TypeScript | Python |
| --- | ---: | ---: | ---: |
| `knapsack-naive` | 20 | 12.3 | 183 |
| `knapsack-memo` | 20 | 3.69 | 1.56 |
| `knapsack-tab` | 20 | 1.48 | 0.36 |
| `knapsack-memo` | 500 | 30.9 | 2,116 |
| `knapsack-tab` | 500 | 24.6 | 377 |
| `lcs-naive` | 12 | 5.74 | 45.7 |
| `lcs-memo` | 500 | 8.50 | 261 |
| `lcs-tab` | 500 | 15.2 | 57.6 |
| `coins-naive` | 20 | 8.28 | 9.77 |
| `coins-tab` | 500 | 0.45 | 0.13 |

How to read it:

- The naive versions are already the slowest at `n` = 20 or 12, and they stop there. The memoised and tabulated versions reach 500 because their cost is polynomial.
- In Python, tabulation is 5 times faster than memoisation on the knapsack at 500 items (377 ms against 2,116 ms): the same number of subproblems, without a function call and a dictionary lookup for each one.
- Every row is one cold run. TypeScript runs on a JIT compiler, so on inputs that take a millisecond it is still warming up and can be slower than Python. On the larger inputs it is several times faster.
- The `checksum` column is the answer. All 92 rows agree: for each problem and size, the three versions and the two languages print the same value.

## Things to try

- Change the knapsack to keep only one row and walk the capacities in ascending order. An item is then counted more than once: the table became the unbounded knapsack.
- Raise the LCS size of the naive version from 12 to 16 and watch the call count.
- Use coins 2 and 4 with an odd amount: all three versions must answer `-1`.
