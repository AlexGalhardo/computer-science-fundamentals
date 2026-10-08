# Full test pyramid (MP-TEST-1)

> Versão em português: [docs/pt/testing/test-pyramid.md](../../pt/testing/test-pyramid.md)

Mini-project: [`projects/testing/test-pyramid`](../../../projects/testing/test-pyramid/README.md). Quiz topics: `test-pyramid-levels`, `unit-tests-isolation`, `integration-tests`, `e2e-playwright`, `smoke-regression`, `ci-test-strategy`.

## The concept

A test level is defined by how much of the system runs during the test. The more that runs, the more kinds of mistake the test can see, and the more it costs to write, to run and to diagnose.

```
            /  e2e  \          3 tests    ~0.7 s each    browser + HTTP + SQL
           /---------\
          / integration \      8 tests    ~8 ms each    handler + repository + SQLite
         /---------------\
        /      unit       \   10 tests    ~4 ms each    one pure module
       /-------------------\
```

The pyramid is advice about quantity: many cheap tests at the base, few expensive ones at the top. The opposite shape (mostly browser tests, the "ice-cream cone") gives a suite that takes long to answer and says little about where the fault is.

Two suites of the mini-project are not levels. They are defined by their purpose:

- **Smoke**: a few shallow checks on the running service, to learn in a second whether the build or the deployment is broken.
- **Regression**: tests kept because a bug once reached a user. Each one reproduces a report and stays forever.

## The application

A shop with three products and a single cart. From a subtotal of 100.00 the cart gets 10% off.

| Part | File | Level that tests it directly |
| --- | --- | --- |
| Pricing rules, pure functions on integer cents | `ts/src/pricing.ts` | unit |
| Cart stored in SQLite, with an upsert | `ts/src/cart-repository.ts` | integration |
| HTTP handler, body validated with Zod | `ts/src/app.ts` | integration |
| Start-up: database, migration, port | `ts/src/server.ts` | smoke |
| Page and browser script | `ts/public/` | end-to-end |

## One bug per level

`SEEDED_BUG` switches on one defect. The matrix (`docker compose run --rm matrix`) runs every suite against every bug and fails if a suite misses the bug of its own level.

| Seeded bug | unit | integration | regression | smoke | e2e |
| --- | --- | --- | --- | --- | --- |
| `unit`: `>` instead of `>=` at the threshold | **FAIL** | pass | pass | pass | pass |
| `integration`: the upsert replaces instead of adding | pass | **FAIL** | pass | pass | **FAIL** |
| `e2e`: the page does not redraw the cart | pass | pass | pass | pass | **FAIL** |
| `smoke`: the service starts without the migration | pass | pass | pass | **FAIL** | **FAIL** |
| `regression`: the rounding of bug #17 is removed | pass | pass | **FAIL** | pass | pass |

What each row teaches:

- **`unit`**. Only a cart of exactly 100.00 behaves differently. The unit suite has a test on the boundary value, the browser suite uses 75.00 and 150.00. A higher level does not automatically cover what a lower one covers: it runs far fewer cases.
- **`integration`**. The defect is inside a SQL string. No unit test of the TypeScript can see it, because SQL only means something to a database. The end-to-end suite also fails, 100 times slower, and its message is "expected `Keyboard x 2`", with no hint of the repository.
- **`e2e`**. The server and the database are correct. The page simply keeps showing the old cart. Only a test that reads the screen can notice.
- **`smoke`**. Every in-process test builds its own database with the migration, so all of them pass. The mistake is in how the service was started. Three HTTP requests find it in about 10 ms.
- **`regression`**. 10% of 100.05 is 10.005. The first tests used round amounts. The case exists in the suite only because it once went wrong.

## What it costs

| Suite | Tests | Duration | Per test |
| --- | --- | --- | --- |
| unit | 10 | 36 ms | 3.6 ms |
| integration | 8 | 61 ms | 7.6 ms |
| regression | 2 | 52 ms | 26.0 ms |
| smoke | 3 | 9 ms | 3.0 ms |
| e2e | 3 | 2070 ms | 690 ms |

Measured inside Docker on one machine (see the README). Time is one cost. The others are not in the table: the end-to-end suite needs a running service and a 2 GB browser image, and its tests need care with waiting and shared state to stay stable.

This is also the argument for the order of a CI pipeline: type check and unit tests first, the browser last. A mistake that the first stage finds in 50 ms should not wait behind a stage of several seconds.

## Details worth reading in the code

- **Dependency injection.** `createApp(repository)` receives its repository, so an integration test passes one built on an in-memory database and calls the handler without opening a socket.
- **A fresh database per test.** `beforeEach` in `tests/integration/cart.test.ts` creates it. No test can see what another wrote.
- **Shared state in end-to-end tests.** The shop has one cart for everybody. `tests/e2e/shop.e2e.ts` empties it before each test and the suite runs with one worker.
- **No fixed waits.** The Playwright assertions (`toHaveText`, `toHaveCount`) retry until the page reaches the expected state.
- **A health check that asks a real question.** `/health` reads the cart table, so "healthy" means "able to serve".
- **The service name is `shop`, not `app`.** Chromium forces HTTPS on the `.app` top-level domain, and a host called `app` matches it.

## Run

```sh
./setup-unix-test-pyramid.sh        # Linux and macOS
./setup-windows-test-pyramid.ps1    # Windows
```

Each suite also has its own command: `docker compose run --rm unit`, `integration`, `regression`, `smoke`, `e2e`, and `matrix` for the demo.
