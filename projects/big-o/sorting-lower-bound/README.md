# sorting-lower-bound

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

It teaches **why no comparison sort beats Ω(n lg n) and how counting sorts escape it**. A generator builds the decision tree of a real sorting algorithm, comparison counters measure merge sort, heapsort and quicksort against lg(n!), and counting sort and radix sort order the same inputs without a single comparison between elements.

Full explanation: [docs/en/big-o/sorting-lower-bound.md](../../../docs/en/big-o/sorting-lower-bound.md).

## Quiz topics it demonstrates

- `big-o` / `sorting-lower-bound`: decision trees, n! leaves, the height ⌈lg n!⌉, and the sorts that are outside the comparison model.
- `big-o` / `asymptotic-notation`: lg(n!) is Θ(n lg n).
- `big-o` / `best-worst-average-case`: the bound is about the worst case and the average, not about every input.

## Run

The only requirement is Docker.

```sh
./setup-unix-sorting-lower-bound.sh        # Linux and macOS
./setup-windows-sorting-lower-bound.ps1    # Windows
```

The script builds both images, runs the tests and runs the demos.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/sorts.ts` | merge sort, heapsort and quicksort that receive the comparison as a function |
| `ts/src/decision-tree.ts` | builds the decision tree of any of those sorts for small n |
| `ts/src/linear-sorts.ts` | counting sort and radix sort |
| `ts/src/experiment.ts` | lg(n!), every permutation of small inputs, 1,000 random inputs |
| `ts/src/demo.ts` | `bun run demo`: prints the tree and the tables, writes `results/` |
| `python/lower_bound.py` | the same experiment with a key class that overloads the comparison operators |
| `python/demo.py` | `python demo.py`: prints the tables, writes `results/results-python.md` |
| `results/` | committed results: `results.md`, `results.json`, `results-python.md` |

TypeScript is the reference implementation (`oven/bun:1.4.2`). Python (`python:3.14.8-slim-trixie`) is here because the lesson changes: operator overloading counts the comparisons made inside the built-in `sorted`, which we cannot edit, and proves that counting sort makes none. Neither implementation has runtime dependencies.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

The Python service also runs `ruff check` and `ruff format --check`.

## Demo

```sh
docker compose run --rm ts-demo        # bun run demo
docker compose run --rm python-demo    # python demo.py
```

The TypeScript demo draws the decision tree of merge sort for n = 3 and prints three tables: the trees for n = 3 and 4, every permutation for n up to 8, and 1,000 random inputs of n = 1,000 with the comparison sorts next to counting sort and radix sort. There is no dashboard: the tables in [`results/results.md`](results/results.md) are the result.
