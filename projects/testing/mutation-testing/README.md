# mutation-testing

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Two test suites for the same small module, both with **100% line coverage**. One asserts almost nothing, the other asserts exact values. Coverage cannot tell them apart. Mutation testing can: a small mutator, written here in about 100 lines, plants one bug at a time in the module and counts how many of those bugs each suite notices. The weak suite notices 21%, the strong one 95%.

Code: MP-TEST-3. Full explanation: [docs/en/testing/mutation-testing.md](../../../docs/en/testing/mutation-testing.md).

## Quiz topics it demonstrates

- `testing` / `coverage-mutation`: line coverage as a metric and what it does not show, mutants, killed and survived, mutation score, equivalent mutants, the cost of a mutation run

## Run

The only requirement is Docker.

```sh
./setup-unix-mutation-testing.sh        # Linux and macOS
./setup-windows-mutation-testing.ps1    # Windows
```

The script runs the tests, the coverage report of both suites and the mutation run, and removes the containers at the end.

## Tests and coverage

```sh
docker compose run --rm ts-test            # type check + all tests
docker compose run --rm coverage-weak      # coverage report of the weak suite
docker compose run --rm coverage-strong    # coverage report of the strong suite
```

Both coverage commands fail under 100% of lines or functions (`ts/bunfig.toml`). This is the report of the **weak** suite:

```text
-----------------|---------|---------|-------------------
File             | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|---------|-------------------
All files        |  100.00 |  100.00 |
 src/shipping.ts |  100.00 |  100.00 |
-----------------|---------|---------|-------------------
```

## Demo: the mutation run

```sh
docker compose run --rm mutation
```

It generates 19 mutants of `ts/src/shipping.ts`, runs each suite against each mutant (38 test runs, a few seconds) and writes [`results/mutation-report.md`](results/mutation-report.md). The command fails unless the weak suite scores under 60% and the strong suite over 90%.

| Suite | Line coverage | Mutants | Killed | Survived | Mutation score |
| --- | --- | --- | --- | --- | --- |
| weak (`tests/weak`) | 100% | 19 | 4 | 15 | 21.1% |
| strong (`tests/strong`) | 100% | 19 | 18 | 1 | 94.7% |

How to read it:

- **Killed** means at least one test failed on the mutant: the suite noticed the bug. **Survived** means every test passed: the suite would also pass with that bug in production.
- The weak suite checks that a price "is a number" and "is positive". Changing 150 cents per kilogram to 151, or `+` to `-`, changes neither, so those mutants live.
- The one survivor of the strong suite (`>` to `>=` on line 45) is an **equivalent mutant**: for a parcel of exactly 2 kg the extra charge is `(2 - 2) * 150 = 0` either way, so no test can ever see a difference. That is why the score here is the raw one (killed / all mutants) and why 100% is not always reachable.

## The mutator

Written for this mini-project, with no dependency, because building it is the lesson (`ts/src/mutator.ts`). It splits the source into tokens, skips comments, strings and identifiers, and produces one mutant per operator or number:

| Kind | Changes |
| --- | --- |
| Arithmetic | `+` and `-` swapped, `*` and `/` swapped |
| Relational (boundary) | `<` to `<=`, `<=` to `<`, `>` to `>=`, `>=` to `>` |
| Equality | `===` and `!==` swapped |
| Logical | `&&` and `\|\|` swapped, `!` removed, `true` and `false` swapped |
| Constant | a number `n` becomes `n + 1` |

It is a teaching tool with stated limits: it works on tokens, not on the syntax tree, so it does not tell a generic `<T>` from a comparison or a regular expression from a division. The module under test avoids those forms. A production tool (Stryker, PIT, mutmut) works on the syntax tree, has many more operators and runs only the tests that cover each mutant.

## Structure

```text
ts/src/shipping.ts             the module under test
ts/src/mutator.ts              tokenizer and mutant generator
ts/src/run-mutation.ts         the mutation run and its report
ts/tests/weak/                 100% line coverage, weak assertions
ts/tests/strong/               100% line coverage, exact values and boundaries
ts/tests/mutator/              tests of the mutator itself
results/mutation-report.md     the last report, one line per mutant
```

Dependencies, pinned: `typescript` 7.0.2 and `@types/bun` 1.4.2 for the type check, on `oven/bun:1.4.2`. Coverage comes from `bun test --coverage`.
