# big-o-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A lab that teaches how to **measure a function and recognise its growth curve**. Six small algorithms, one per class (O(1), O(log n), O(n), O(n log n), O(n²) and O(2ⁿ)), count their own basic operations while the input size doubles. The counts are checked against a closed formula, and a curve-fitting step names the class from the numbers alone.

Full explanation: [docs/en/big-o/big-o-lab.md](../../../docs/en/big-o/big-o-lab.md).

## Quiz topics it demonstrates

- `big-o` / `growth-of-functions`: the ladder of classes and what doubling n does to each one.
- `big-o` / `counting-operations`: counting the basic operation of loops, nested loops and halving loops.
- `big-o` / `asymptotic-notation`: constants and lower-order terms do not change the class (n(n − 1)/2 is still quadratic).

## Run

The only requirement is Docker.

```sh
./setup-unix-big-o-lab.sh        # Linux and macOS
./setup-windows-big-o-lab.ps1    # Windows
```

The script builds the image, runs the tests and runs the demo.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/samples.ts` | the six instrumented algorithms and their closed formulas |
| `ts/src/fit.ts` | least-squares fit of the counts against the six candidate curves |
| `ts/src/lab.ts` | runs every sample at every size and times it |
| `ts/src/demo.ts` | the CLI: prints the tables and writes `results/` |
| `dashboard/` | static page (HTML + Tailwind CSS v4, built CSS committed) |
| `results/` | committed results: `results.md`, `results.json`, `results.js` |

The implementation is in TypeScript on the pinned image `oven/bun:1.4.2`, with no dependencies.

## Tests

```sh
docker compose run --rm ts-test
```

The tests check that every operation count equals its closed formula, that the sizes double, and that the fit names the right class for all six samples.

## Demo and dashboard

```sh
docker compose run --rm ts-demo
```

This runs `bun run demo` in the container. It prints one table per sample (n, counted operations, formula, time) with the best fit and its error, and rewrites `results/`. Then open `dashboard/index.html` in a browser, straight from disk: it plots the committed results on log-log axes.

Operation counts are exact and identical on every machine. Times are the median of 5 runs and depend on the machine recorded in `results/results.md`.
