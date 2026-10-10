# mini-xunit

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A test framework built from nothing, twice: once in Python and once in TypeScript. Test case, suite, result, set-up and tear-down, discovery of test files, a report and an exit code, in about 300 lines per language, comments included. No test library is used in either one (no pytest, no unittest, no `bun:test`): the framework is tested by itself. After reading it, `setUp`, "fresh fixture" and "the run exited with 1" stop being magic.

Code: MP-TEST-5. Full explanation: [docs/en/testing/mini-xunit.md](../../../docs/en/testing/mini-xunit.md).

## Quiz topics it demonstrates

- `testing` / `unit-tests-isolation`: fixtures, set-up and tear-down, a fresh fixture per test, how a runner collects results, why one failing test does not stop the others

## Run

The only requirement is Docker.

```sh
./setup-unix-mini-xunit.sh        # Linux and macOS
./setup-windows-mini-xunit.ps1    # Windows
```

The script runs the self-tests of both languages and then both demos, checking that each demo exits with a non-zero code.

## Tests: the framework tests itself

```sh
docker compose run --rm python-test    # ruff + bootstrap + python -m mini_xunit selftest
docker compose run --rm ts-test        # tsc + bootstrap + bun run src/cli.ts selftest
```

Each prints `bootstrap: ok` and `24 run, 0 failed`. The 24 tests of each language are test cases written with the framework and found by its own discovery.

A framework that tests itself has a bootstrap problem: if it swallowed failures, its own tests would all look green. So each language first runs a `bootstrap` file that checks the most basic promises with plain `if` statements (a failing test is reported as failed, a passing one is not, every test is counted). Only then are the self-tests run.

## Demo: a failing test

```sh
docker compose run --rm python-demo; echo "exit code: $?"
docker compose run --rm ts-demo; echo "exit code: $?"
```

Each runs the framework on `examples/failing`, where one test has a wrong expectation on purpose. The report has the name of the test, the message and the location, and the process exits with 1:

```text
FAIL CartTest.test_total_with_discount
     expected 100 but got 90.0
     at examples/failing/cart_xtest.py:28
2 run, 1 failed
exit code: 1
```

```text
FAIL CartTest.testTotalWithDiscount
     expected 100 but got 90
     at examples/failing/cart.xunit.ts:28
2 run, 1 failed
exit code: 1
```

| Exit code | Meaning |
| --- | --- |
| 0 | every test passed |
| 1 | at least one test failed |
| 2 | no test was found, or the command was misused |

## The parts

| Part | Job | Python | TypeScript |
| --- | --- | --- | --- |
| `TestCase` | One test: runs `set_up`, the method named in the constructor, then `tear_down` in a `finally`. Catches the exception and hands it to the result | `mini_xunit/core.py` | `src/xunit.ts` |
| `TestResult` | Counts the tests that ran and keeps name, message and location of each failure | `mini_xunit/core.py` | `src/xunit.ts` |
| `TestSuite` | A list of tests or of other suites. `from_class` creates one new instance per test method | `mini_xunit/core.py` | `src/xunit.ts` |
| Assertions | `assert_equal`, `assert_true`, `assert_raises`: an `if` that raises | `mini_xunit/core.py` | `src/xunit.ts` |
| Discovery | Imports every `*_xtest.py` or `*.xunit.ts` under a folder and collects the `TestCase` subclasses | `mini_xunit/discovery.py` | `src/discovery.ts` |
| Reporter and CLI | Prints the failures and the summary, and turns the result into an exit code | `mini_xunit/reporter.py`, `__main__.py` | `src/cli.ts` |

## Why two languages

The design is the same. What changes is how each language finds a method by name and where a failure happened:

| | Python | TypeScript (Bun) |
| --- | --- | --- |
| Call a method by its name | `getattr(self, name)` | `Reflect.get(this, name)` |
| List the test methods of a class | `dir(cls)`, which already includes inherited methods | walk the prototype chain with `Object.getOwnPropertyNames` |
| Location of a failure | `traceback.extract_tb`, a list of frames | parse the text of `error.stack` |
| Asynchronous tests | not supported: everything is synchronous | every step is awaited, so a test may be `async` |
| Load a test file | `importlib` with a module spec | dynamic `import()` |

## Structure

```text
python/mini_xunit/          the framework (core, discovery, reporter, command line)
python/selftest/            bootstrap, fixtures and the tests written with the framework
python/examples/            a cart with a passing folder and a failing folder
ts/src/                     the framework (xunit, discovery, cli)
ts/selftest/                bootstrap, fixtures and the tests written with the framework
ts/examples/                the same cart, passing and failing
```

Pinned: `python:3.14.8-slim-trixie` with `ruff` 0.16.10 (lint and format only), and `oven/bun:1.4.2` with `typescript` 7.0.2 and `@types/bun` 1.4.2 (type check only). Neither implementation has a runtime dependency.

## Limits

It is a study object. It has no test filtering, no parallel run, no time-out, no skipped tests, no difference between a failure and an error, and no diff of large values. Each of those is a good exercise to add, with a self-test first.
