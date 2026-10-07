# travelling-salesman

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Four ways to solve the travelling salesman problem (visit every city once and return to the start with the shortest tour): brute force over every order, dynamic programming over subsets (Held-Karp), the greedy nearest-neighbour heuristic and 2-opt local search. The project shows where exhaustive search stops being usable, how far a better exact algorithm pushes that wall, and what a heuristic gives up to answer instantly.

Plan item: MP-ALG-3. Languages: TypeScript (reference) and Rust. Full write-up: [docs/en/algorithms/travelling-salesman.md](../../../docs/en/algorithms/travelling-salesman.md).

## What it teaches

- Brute force tests `(n - 1)!` orders. Each extra city multiplies the work by the number of cities, so the wall is sudden: comfortable at 11 cities, hopeless at 14.
- Held-Karp reuses subproblems ("which cities were visited and where the path ends") and costs `O(n² · 2^n)`: exponential, yet 20 cities take a moment. Its limit is memory, `O(n · 2^n)`.
- A faster language moves the wall of brute force by about one city. A better algorithm moves it by ten.
- Nearest neighbour and 2-opt answer in microseconds for sizes no exact method can touch, with no guarantee of optimality.

## Quiz topics it demonstrates

Area `algorithms`:

- `backtracking` (brute force over permutations, factorial growth, pruning with a bound)
- `dynamic-programming` (Held-Karp is tabulation over subsets)
- `greedy` (nearest neighbour as a greedy heuristic without guarantee)

## Run

The only requirement is Docker.

```sh
./setup-unix-travelling-salesman.sh        # Linux and macOS
./setup-windows-travelling-salesman.ps1    # Windows
```

## Structure

| Path | Content |
| --- | --- |
| `ts/src/instance.ts` | Random cities from a fixed seed, integer distance matrix, tour validation |
| `ts/src/brute-force.ts`, `held-karp.ts` | The two exact solvers |
| `ts/src/heuristics.ts` | Nearest neighbour and 2-opt |
| `ts/src/demo.ts`, `ts/src/bench.ts` | Heuristic gap table and benchmark entry |
| `rust/src/lib.rs`, `rust/src/main.rs` | The same four solvers and the benchmark entry in Rust |
| `bench.json`, `results/` | Benchmark grid and committed results |
| `dashboard/` | Static page that charts `results/results.js` |

Cities are random points on a 1000 by 1000 grid. Distances are Euclidean, rounded to integers, so tour lengths are exact and both languages can be compared with plain equality.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

- Brute force and Held-Karp return a tour of the same optimal length on every tested instance of up to 10 cities (20 instances per size up to 8 cities, 4 for 9 and 10), and each tour is checked to be a valid permutation with that length. The visiting order itself may differ by direction or when two tours tie.
- The heuristics stay within the documented factors on 64 instances of 5 to 12 cities.
- The Rust tests also assert tour lengths printed by the TypeScript reference, which proves both languages build the same instances.

Formatters and linters:

```sh
./lint.sh                                                    # rustfmt and clippy, in the Rust base image
bunx biome check projects/algorithms/travelling-salesman     # TypeScript, from the repository root
```

## Heuristics against the optimum

```sh
docker compose run --rm demo
```

Ratio between the tour of each heuristic and the optimal tour (1.000 means optimal), 8 random instances per size:

| cities | instances | nearest neighbour: mean | worst | 2-opt: mean | worst | 2-opt optimal |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 5 | 8 | 1.029 | 1.141 | 1.000 | 1.000 | 8 of 8 |
| 6 | 8 | 1.059 | 1.150 | 1.000 | 1.000 | 8 of 8 |
| 7 | 8 | 1.071 | 1.172 | 1.006 | 1.047 | 7 of 8 |
| 8 | 8 | 1.093 | 1.210 | 1.007 | 1.055 | 6 of 8 |
| 9 | 8 | 1.070 | 1.158 | 1.016 | 1.056 | 5 of 8 |
| 10 | 8 | 1.103 | 1.235 | 1.001 | 1.010 | 7 of 8 |
| 11 | 8 | 1.097 | 1.160 | 1.014 | 1.040 | 3 of 8 |
| 12 | 8 | 1.137 | 1.326 | 1.005 | 1.022 | 5 of 8 |
| all | 64 | 1.082 | 1.326 | 1.006 | 1.056 | 49 of 64 |

Documented factors, enforced by the tests on instances of up to 12 cities: nearest neighbour at most **1.6** times the optimum, 2-opt (started from the nearest-neighbour tour) at most **1.2** times. These are measured bounds for this family of random instances, not theoretical guarantees: on arbitrary instances nearest neighbour has no constant factor.

## Benchmark

```sh
bun run bench -- --project projects/algorithms/travelling-salesman
```

The grid runs the four solvers at 6, 8, 10, 11, 12, 13, 14, 16, 18, 20 and 100 cities in both languages and writes `results/`. Open `dashboard/index.html` from disk to see the chart.

Caps:

| Cap | Value | Why |
| --- | --- | --- |
| Brute force deadline | 12 seconds, then the row reports `timeout` as its checksum | 14 cities would take minutes and 16 cities days |
| Brute force sizes | up to 14 cities | The size after the first timeout adds nothing |
| Held-Karp sizes | up to 20 cities in the grid, 22 in the code | The table has `n · 2^n` entries |
| Runs | 3 measured runs, no warm-up, per row | Keeps the rows that hit the deadline to under a minute each |

### Where brute force exceeds 10 seconds

Measured section in milliseconds, from the committed `results/results.md` (78 rows, about 5 minutes):

| Cities | Brute force, TypeScript | Brute force, Rust | Held-Karp, TypeScript | Held-Karp, Rust |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 13.1 | 6.81 | 3.63 | 0.09 |
| 11 | 202 | 70.9 | 3.79 | 0.25 |
| 12 | 1,709 | 765 | 4.58 | 0.59 |
| 13 | **timeout (over 12,000)** | 7,351 | 5.69 | 1.37 |
| 14 | timeout | **timeout (over 12,000)** | 9.38 | 3.10 |
| 20 | not run | not run | 569 | 437 |

- **TypeScript: brute force exceeds 10 seconds at 13 cities.**
- **Rust: brute force exceeds 10 seconds at 14 cities** (13 cities take 7.4 seconds).
- Rust is 2 to 3 times faster and gains exactly one city. Held-Karp solves 20 cities in about half a second in either language.
- The heuristics take less than 2 ms for 100 cities in TypeScript and 0.05 ms in Rust.
- Wherever brute force finished, it printed the same tour length as Held-Karp, and both languages printed the same lengths for all four solvers.
