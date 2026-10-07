# gates-karnaugh-adders

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Mini-project MP-DL-1. It teaches **how a Boolean function becomes a circuit**, in three steps: an expression is parsed and simulated with gates to produce its truth table, a truth table is minimised by the Quine-McCluskey method (the Karnaugh map done as a table), and gates are wired into a half adder, a full adder and an 8-bit ripple-carry adder that really adds.

Full explanation: [docs/en/digital-logic/gates-karnaugh-adders.md](../../../docs/en/digital-logic/gates-karnaugh-adders.md).

## Quiz topics it demonstrates

- `digital-logic` / `logic-gates`: gates, truth tables, reading a circuit.
- `digital-logic` / `boolean-algebra`: De Morgan, absorption, consensus, minterms and canonical forms, all checked by comparing truth tables.
- `digital-logic` / `karnaugh-maps`: grouping, prime and essential implicants, don't-care terms, minimal sum of products.
- `digital-logic` / `arithmetic-circuits`: half adder, full adder, ripple-carry adder and how the carry travels.

## Run

The only requirement is Docker.

```sh
./setup-unix-gates-karnaugh-adders.sh        # Linux and macOS
./setup-windows-gates-karnaugh-adders.ps1    # Windows
```

The script builds the two images, runs every test and then the two demos.

## Structure

| Path | What it holds |
| --- | --- |
| `ts/src/gates.ts` | NOT, AND, OR and the gates derived from them |
| `ts/src/expression.ts` | Parser of expressions such as `A·B + C'`, circuit evaluation, truth table |
| `ts/src/quine-mccluskey.ts` | Prime implicants, essential ones, exact minimal cover, don't-care terms |
| `ts/src/adders.ts` | Half adder, full adder, n-bit ripple-carry adder |
| `python/logic.py` | Truth tables as bit-parallel columns, parsed with Python's own `ast` |
| `python/quine_mccluskey.py` | Independent second implementation of the minimisation |
| `python/adders.py` | The same adder network, adding all 65,536 pairs in a single pass |
| `results/` | Output of the two demos |

TypeScript is the reference implementation: one row at a time, the way the circuit is explained on paper. The Python version exists because the lesson changes: Python integers have no size limit, so a whole column of the truth table is one integer and each gate handles every row with a single operation (bit-parallel simulation).

### Expression syntax (TypeScript)

| Operation | Written as |
| --- | --- |
| NOT | `A'` (postfix), `!A` or `~A` (prefix) |
| AND | `A·B`, `A*B`, `A&B`, `A.B` or just `AB` |
| XOR | `A ^ B` |
| OR | `A + B` or `A \| B` |

Priority: NOT, then AND, then XOR, then OR. A variable is one letter followed by optional digits. The Python version uses Python's operators: `~`, `&`, `^`, `|`.

## Tests

```sh
docker compose run --rm ts-test        # bun test
docker compose run --rm python-test    # ruff check, ruff format --check, pytest
```

| Acceptance criterion | Test |
| --- | --- |
| Truth tables match hand-written ones for 20 expressions | `ts/tests/expression.test.ts`, `python/test_logic.py` |
| The minimised expression is equivalent to the original for every input | `ts/tests/quine-mccluskey.test.ts` (all 256 functions of 3 variables, all 65,536 of 4 variables, random ones of 5 and 6, with and without don't-care terms), `python/test_quine_mccluskey.py` |
| The 8-bit adder agrees with native addition for all 65,536 input pairs | `ts/tests/adders.test.ts`, `python/test_adders.py` |

Lint and types of the TypeScript code run from the repository root: `bunx biome check projects/digital-logic/gates-karnaugh-adders` and `bunx tsc --noEmit -p projects/digital-logic/gates-karnaugh-adders/ts`.

## Demo

```sh
docker compose run --rm ts-demo
docker compose run --rm python-demo
```

Each demo prints its report and writes it to [`results/results-ts.md`](results/results-ts.md) and [`results/results-python.md`](results/results-python.md). A sample of the minimisation table:

| Function | Minimal sum of products | Literals |
| --- | --- | ---: |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | `B'·D' + B·D` | 4 |
| Σm(0, 1, 2, 5, 8, 9, 10) | `A'·C'·D + B'·C' + B'·D'` | 7 |
| Σm(1, 3, 7) + d(5) | `C` | 1 |
| Σm(1, 2, 4, 7) | `A'·B'·C + A'·B·C' + A·B'·C' + A·B·C` | 12 |

There are no dependencies beyond the pinned images (`oven/bun:1.4.2` and `python:3.14.8-slim-trixie` with ruff 0.16.10 and pytest 9.1.1).
