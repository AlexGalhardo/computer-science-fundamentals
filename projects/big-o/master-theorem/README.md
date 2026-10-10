# master-theorem

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

An interactive master theorem. It teaches **how the three cases of the master theorem decide the cost of a recurrence** `T(n) = a·T(n/b) + f(n)`: a classifier returns the case and the solution, a generated recursive function checks the prediction by counting real calls, and a static page draws the recursion tree for the `a`, `b` and `f(n)` you choose.

Full explanation: [docs/en/big-o/master-theorem.md](../../../docs/en/big-o/master-theorem.md).

## Quiz topics it demonstrates

- `big-o` / `recurrences-master-theorem`: writing the recurrence of a divide and conquer algorithm, the three cases, the recursion tree, and the recurrences the theorem does not cover.

## Run

The only requirement is Docker.

```sh
./setup-unix-master-theorem.sh        # Linux and macOS
./setup-windows-master-theorem.ps1    # Windows
```

The script builds the image, runs the tests and runs the demo.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/classify.ts` | the classifier: case, solution, and a report when the theorem does not apply |
| `ts/src/tree.ts` | the recursion tree, level by level |
| `ts/src/empirical.ts` | a generated recursive function that counts its calls and its work |
| `ts/src/cli.ts` | `bun run classify <a> <b> <d> [k]` |
| `ts/src/demo.ts` | `bun run demo`: known recurrences, empirical check, `results/` |
| `dashboard/` | static page (HTML + Tailwind CSS v4, built CSS committed) |
| `results/` | committed results: `results.md`, `results.json`, `results.js` |

TypeScript on the pinned image `oven/bun:1.4.2`. The only dependency is `zod` 4.6.5, which validates the command-line input against the hypotheses of the theorem (`a ≥ 1`, `b > 1`).

## Tests

```sh
docker compose run --rm ts-test
```

The tests cover one recurrence per case and recurrences that do not fit, and check that the measured growth agrees with the predicted class for merge sort, binary search and a 7-way split.

## Demo, command line and page

```sh
docker compose run --rm ts-demo                              # all known recurrences and the empirical check
docker compose run --rm ts-demo bun run classify 7 2 2       # one recurrence: T(n) = 7T(n/2) + n^2
docker compose run --rm ts-demo bun run classify 2 2 1 1     # T(n) = 2T(n/2) + n log n: does not apply
```

The arguments are `a`, `b`, `d` and an optional `k`, for `f(n) = n^d · (log n)^k`. The command prints the case, the reason in English, Portuguese and Spanish (one `EN:`, one `PT:` and one `ES:` line), the solution and the recursion tree for a small `n`.

Then open `dashboard/index.html` in a browser, straight from disk. Choose `a`, `b` and `f(n)`: the page shows the case and draws the tree with one bar per level, so you can see whether the leaves, every level or the root pays the bill.
