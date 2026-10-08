# flaky-tests

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A lab of intermittent tests. Four tests fail some of the time with no change in the code, each for one of the usual reasons: the real clock, the order of concurrent results, state shared between tests, and a real network call. Next to each one is the fixed version: a fake clock, a deterministic order, isolation, a stubbed network. Each flaky test is run 50 times and fails at least once. Each fixed test is run 500 times and never fails.

Code: MP-TEST-4. Full explanation: [docs/en/testing/flaky-tests.md](../../../docs/en/testing/flaky-tests.md).

> **Flaky on purpose.** The files under `ts/tests/flaky/` are intermittent by design and are never part of the normal test run. They are run only by the `flaky` service, which expects them to fail.

## Quiz topics it demonstrates

- `testing` / `flaky-tests`: what a flaky test is, the usual causes, the fix of each one, why a retry hides the problem
- `testing` / `test-doubles`: a fake clock as a double for time, a stub in place of an HTTP call
- `testing` / `unit-tests-isolation`: a fresh fixture per test, tests that do not depend on their order

## Run

The only requirement is Docker.

```sh
./setup-unix-flaky-tests.sh        # Linux and macOS
./setup-windows-flaky-tests.ps1    # Windows
```

The script runs the deterministic tests, then the two repeat runs below, and removes the containers at the end. It takes about half a minute after the build.

## Tests

```sh
docker compose run --rm ts-test
```

Type check plus the 16 deterministic tests (the fixed ones and the unit tests), in random order, in a container with no network.

## Demo: repeat until it shows

```sh
docker compose run --rm flaky    # each flaky test 50 times: each must fail at least once
docker compose run --rm fixed    # each fixed test 500 times: none may fail
docker compose down -v --remove-orphans
```

Each run is a new `bun test --randomize` process. The reports are written to [`results/flaky-runs.md`](results/flaky-runs.md) and [`results/fixed-runs.md`](results/fixed-runs.md). Last run:

| Cause | Flaky test, 50 runs | Fix | Fixed test, 500 runs |
| --- | --- | --- | --- |
| Time | 11 failures (22%) | fake clock | 0 failures |
| Order dependence | 37 failures (74%) | deterministic order | 0 failures |
| Shared state | 42 failures (84%) | isolation | 0 failures |
| Real network | 11 failures (22%) | stubbed network | 0 failures |

The failure counts of the flaky tests change from run to run. That is the point.

## The four causes

| Cause | What goes wrong | Where | The fix |
| --- | --- | --- | --- |
| Time | The test reads the real clock a second time and expects the same millisecond the code saw. When the clock ticks in between, the values differ by 1 | `src/session.ts`, `tests/flaky/time.test.ts` | The clock is a parameter. The test passes a `FakeClock` and moves it by hand |
| Order dependence | Concurrent lookups finish in a varying order, the code returns them in arrival order, and the test expects one order | `src/prices.ts`, `tests/flaky/order.test.ts` | The code keeps the order of the request (`Promise.all`), or the test compares sorted contents when order does not matter |
| Shared state | Three tests use one module-level registry and pass only in the order they were written (1 of 6 orders) | `src/invoices.ts`, `tests/flaky/shared-state.test.ts` | `beforeEach` builds a fresh registry for every test |
| Real network | The test calls a real HTTP service that fails one request in four | `src/rates.ts`, `tests/flaky/network.test.ts` | The HTTP function is a parameter. The test passes a stub, and the error path becomes testable on demand |

In all four the fix has the same shape: the test stops depending on something it does not control, and that something becomes an explicit input.

## Is "at least once in 50" guaranteed?

No, and it cannot be: it is a probability. With a failure rate `p` per run, the chance of 50 green runs in a row is `(1 - p)^50`. For the least flaky test here (about 20%) that is `0.8^50`, about 1 in 70 000. The same arithmetic shows why a flaky test hurts: at 2% per run, a suite with 50 such tests is red in 64% of the runs.

## Safety

The "real network" is the `unstable-api` service of this compose file, on an `internal` network with no published port. Its failures are simulated with a random number. `rates.ts` refuses any address that is not `localhost`, `127.0.0.1` or `unstable-api`. The `fixed` and `ts-test` services have no network at all.

## Structure

```
ts/src/session.ts          time: sessions, Clock, FakeClock
ts/src/prices.ts           order: arrival order against request order
ts/src/invoices.ts         shared state: a registry, its factory and a singleton
ts/src/rates.ts            network: an HTTP client with an injectable transport
ts/src/unstable-api.ts     the local service that fails one request in four
ts/src/repeat.ts           runs each test file N times and counts failures
ts/tests/flaky/            the four intermittent tests
ts/tests/fixed/            the four fixes
ts/tests/unit/             tests of the service and of the repeat plan
```

Dependencies, pinned: `zod` 4.6.5 (validation of the HTTP body and of the script argument), `typescript` 7.0.2 and `@types/bun` 1.4.2, on `oven/bun:1.4.2`.
