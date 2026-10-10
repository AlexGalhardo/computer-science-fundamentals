# test-pyramid

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A tiny shop (a catalogue, a cart, 10% off from 100.00) tested at every level of the test pyramid: unit, integration, end-to-end with Playwright, plus a smoke suite and a regression suite. One bug is seeded on purpose at each level, and a matrix shows which suite notices which bug and what each suite costs. The lesson: every level sees something the others cannot, and the price of a test grows as it climbs.

Code: MP-TEST-1. Full explanation: [docs/en/testing/test-pyramid.md](../../../docs/en/testing/test-pyramid.md).

## Quiz topics it demonstrates

- `testing` / `test-pyramid-levels`: what each level verifies, what it costs, why the base is wide
- `testing` / `unit-tests-isolation`: a pure module tested alone, boundary values
- `testing` / `integration-tests`: HTTP handler, repository and a real SQLite together, a fresh database per test
- `testing` / `e2e-playwright`: role locators, web-first assertions, state reset before each test
- `testing` / `smoke-regression`: shallow checks on the running service, one test per past bug report
- `testing` / `ci-test-strategy`: running the cheap suites first

## Run

The only requirement is Docker.

```sh
./setup-unix-test-pyramid.sh        # Linux and macOS
./setup-windows-test-pyramid.ps1    # Windows
```

The script builds the images, runs the type check, the five suites and the bug matrix, and removes the containers at the end.

## The five suites, one command each

```sh
docker compose run --rm unit           # bun test, pure functions
docker compose run --rm integration    # bun test, handler + repository + SQLite in memory
docker compose run --rm regression     # bun test, one test per past bug report
docker compose run --rm smoke          # bun test, against the running `shop` service
docker compose run --rm e2e            # Playwright (Chromium), against the running `shop` service
docker compose down -v --remove-orphans
```

`SEEDED_BUG=<name>` in front of any command plants one bug: `unit`, `integration`, `e2e`, `smoke` or `regression`. For `smoke` and `e2e` the bug lives in the `shop` service, so recreate it: `docker compose down` first.

## Demo: the bug matrix

```sh
docker compose run --rm matrix
```

It runs the 5 suites against the correct code and against each of the 5 seeded bugs (30 runs, about one minute), prints the table and writes it to [`results/bug-matrix.md`](results/bug-matrix.md). The command fails if a suite misses the bug of its own level.

| Seeded bug | Where it is | unit | integration | regression | smoke | e2e |
| --- | --- | --- | --- | --- | --- | --- |
| none | | pass | pass | pass | pass | pass |
| `unit` | `pricing.ts`: `>` instead of `>=` at the discount threshold | **FAIL** | pass | pass | pass | pass |
| `integration` | `cart-repository.ts`: the SQL upsert replaces the quantity instead of adding | pass | **FAIL** | pass | pass | **FAIL** |
| `e2e` | `public/app.js`: the page does not redraw the cart after a click | pass | pass | pass | pass | **FAIL** |
| `smoke` | `server.ts`: the service starts without running the migration | pass | pass | pass | **FAIL** | **FAIL** |
| `regression` | `pricing.ts`: the rounding that fixed bug report #17 is removed | pass | pass | **FAIL** | pass | pass |

How to read it:

- The end-to-end suite catches three of the five bugs, but misses the two that need a precise value (exactly 100.00, and 100.05). Covering every value through a browser would be far too slow, which is why those cases live at the bottom.
- The unit suite cannot see the SQL, the browser script or the way the service was started.
- When `integration` and `e2e` both fail, the integration test names the repository method. The end-to-end test only says that a text did not appear on the screen.

## Count and duration of each suite

Measured by the matrix on the correct code, inside Docker (Docker Desktop on Windows 11, AMD64, Bun 1.4.2, Playwright 1.63.0 with Chromium). The duration is the whole command, including the start of the test runner.

| Suite | Tests | Duration | Per test |
| --- | --- | --- | --- |
| unit | 10 | 36 ms | 3.6 ms |
| integration | 8 | 61 ms | 7.6 ms |
| regression | 2 | 52 ms | 26.0 ms |
| smoke | 3 | 9 ms | 3.0 ms |
| e2e | 3 | 2070 ms | 690 ms |

One end-to-end test costs about as much as 200 unit tests, before counting the Chromium image (about 2 GB against about 250 MB for the Bun image) and a running service. The numbers change from run to run and from machine to machine. The order of magnitude does not.

## Structure

```text
ts/src/pricing.ts            pure rules (unit level)
ts/src/cart-repository.ts    SQL on SQLite (integration level)
ts/src/app.ts                HTTP handler, input validated with Zod
ts/src/server.ts             starts the service (what smoke checks)
ts/public/                   the page and its script (what only e2e runs)
ts/src/seeded-bugs.ts        the SEEDED_BUG switch
ts/tests/{unit,integration,regression,smoke,e2e}/
ts/scripts/bug-matrix.ts     the demo
```

Dependencies, pinned: `zod` 4.6.5, `@playwright/test` 1.63.0 (image `mcr.microsoft.com/playwright:v1.63.0-noble`), `typescript` 7.0.2, `@types/bun` 1.4.2, on `oven/bun:1.4.2`. The database is the SQLite built into Bun.

## Safety

No port is published and the only network is `internal`. The smoke and end-to-end suites refuse a `BASE_URL` that is not `localhost`, `127.0.0.1` or the compose service `shop`.
