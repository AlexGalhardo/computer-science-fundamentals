# dynamic-programming

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Three classic problems (0-1 knapsack, longest common subsequence and coin change), each solved three times: with plain recursion, with the same recursion plus a cache (memoisation), and with loops that fill a table (tabulation). The three versions compute the same recurrence. What changes is how often the same subproblem is solved, and a call counter makes that visible.

Plan item: MP-ALG-2. Languages: TypeScript (reference) and Python. Full write-up: [docs/en/algorithms/dynamic-programming.md](../../../docs/en/algorithms/dynamic-programming.md).

## What it teaches

- Dynamic programming applies when subproblems overlap and the optimal answer is built from optimal answers of subproblems.
- Memoisation keeps the recursive code and adds a cache. Tabulation removes the recursion and fills the table in an order where every value needed is already there.
- The cost becomes "number of distinct subproblems times the work of each one": `n * W` for the knapsack, `m * n` for the LCS, `amount * coins` for the change.
- A greedy rule is not enough for coin change: with coins 1, 3 and 4 it pays 6 with three coins, and the table finds two.

## Quiz topics it demonstrates

Area `algorithms`:

- `dynamic-programming` (overlapping subproblems, memoisation and tabulation, knapsack, LCS, coin change, call counts)
- `greedy` (the coin system where greedy fails, and why the 0-1 knapsack needs a table)
- `divide-and-conquer` (why overlapping subproblems make naive recursion exponential)

## Run

The only requirement is Docker.

```sh
./setup-unix-dynamic-programming.sh        # Linux and macOS
./setup-windows-dynamic-programming.ps1    # Windows
```

## Demo

One command prints the table of each problem being filled, and then the call counts:

```sh
docker compose run --rm demo
```

```text
== 0-1 knapsack / mochila 0-1 ==
items (value, weight) / itens (valor, peso): (3,2) (4,3) (5,4) (6,5), capacity / capacidade 5
capacity w         0   1   2   3   4   5
no items           0   0   0   0   0   0
+ item (3,2)       0   0   3   3   3   3
+ item (4,3)       0   0   3   4   4   7
+ item (5,4)       0   0   3   4   5   7
+ item (6,5)       0   0   3   4   5   7
answer / resposta: 7 (items 1 and 2 / itens 1 e 2)

== longest common subsequence / maior subsequência comum ==
a = BANANA, b = ATANA
                       A   T   A   N   A
""                 0   0   0   0   0   0
+ B                0   0   0   0   0   0
+ A                0   1   1   1   1   1
+ N                0   1   1   1   2   2
+ A                0   1   1   2   2   3
+ N                0   1   1   2   3   3
+ A                0   1   1   2   3   4
answer / resposta: 4 (AANA)

== coin change / troco ==
coins / moedas: 1, 3, 4, amount / valor 6
amount v           0   1   2   3   4   5   6
after dp[0]        0
after dp[1]        0   1
after dp[2]        0   1   2
after dp[3]        0   1   2   1
after dp[4]        0   1   2   1   1
after dp[5]        0   1   2   1   1   2
after dp[6]        0   1   2   1   1   2   2
answer / resposta: 2 (3 + 3), greedy / guloso: 3 (4 + 1 + 1)

== calls of the recursive versions / chamadas das versões recursivas ==
problem      n       naive    memo     ratio
knapsack    20      734544    2380      309x
lcs         12      117808     198      595x
coins       30     2550408      86    29656x
```

Each row of a table is one step: it is computed only from the rows above it (or from the cells to its left). `docker compose run --rm python-demo` prints the same call counts from the Python implementation.

## Call counter

The recursive versions receive a counter that is incremented on every call, cache hits included. The documented input sizes are 20 items for the knapsack, two strings of 12 letters for the LCS and the amount 30 for coin change. At those sizes the naive version makes 309, 595 and 29,656 times more calls than the memoised one. A test in each language asserts the ratio is at least 100, and the Python test also asserts the exact counts of the TypeScript reference.

## Structure

| Path | Content |
| --- | --- |
| `ts/src/knapsack.ts`, `lcs.ts`, `coin-change.ts` | One file per problem, with the naive, memoised and tabulated versions |
| `ts/src/problems.ts` | Instances built from a size `n` and a seed, shared by benchmark, demo and tests |
| `ts/src/demo.ts`, `ts/src/bench.ts` | Demo and benchmark entry |
| `python/dp.py`, `problems.py`, `demo.py`, `bench.py` | The same in Python |
| `bench.json`, `results/` | Benchmark grid and committed results |
| `dashboard/` | Static page that charts `results/results.js` |

Instances: the knapsack has `n` items with weights 1 to 20, values 1 to 100 and capacity `5n`. The LCS compares two strings of `n` letters over A, C, G, T. Coin change makes the amount `n` with coins 1, 3 and 4. A Lehmer generator with a fixed seed builds them, identically in both languages.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

Each language checks known answers, that the three versions agree on 200 random cases of each problem, and the call-count ratio. Formatters and linters:

```sh
./lint.sh                                                    # ruff, in the Python base image
bunx biome check projects/algorithms/dynamic-programming     # TypeScript, from the repository root
```

## Benchmark

```sh
bun run bench -- --project projects/algorithms/dynamic-programming
```

The grid runs the nine implementations at `n` = 8, 12, 16, 20, 100 and 500 in both languages, 3 measured runs after 1 warm-up, and writes `results/`. Open `dashboard/index.html` from disk to see the chart.

Caps, so the whole run takes a few minutes: `knapsack-naive` and `coins-naive` stop at `n` = 20 and `lcs-naive` at `n` = 12, because their call counts grow exponentially. The memoised and tabulated versions go on to 500.

In `results/results.md`, compare the `section` column of the three versions of a problem at the same `n`. The `checksum` column is the answer itself, so equal checksums on a row of TypeScript and a row of Python show that both languages agree.
