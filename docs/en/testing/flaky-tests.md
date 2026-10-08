# Flaky test lab (MP-TEST-4)

> Versão em português: [docs/pt/testing/flaky-tests.md](../../pt/testing/flaky-tests.md)

Mini-project: [`projects/testing/flaky-tests`](../../../projects/testing/flaky-tests/README.md). Quiz topics: `flaky-tests`, `test-doubles`, `unit-tests-isolation`.

## The concept

A **flaky test** passes and fails on the same code. Nothing was changed between the green run and the red one. The result depends on something the test does not control.

That is worse than a test that always fails. A red test that might be "just the flaky one" teaches the team to press retry, and from that day a real failure looks the same as noise. The value of a suite is that red means "something broke". A flaky test removes that meaning.

Small rates add up. If each of `n` tests fails independently with probability `p`, the suite has at least one failure with probability `1 - (1 - p)^n`:

| Flaky tests in the suite | Failure rate of each | Red runs with no real bug |
| --- | --- | --- |
| 1 | 2% | 2% |
| 10 | 2% | 18% |
| 50 | 2% | 64% |

## The four causes in the lab

Every cause is a hidden input: something that affects the result and is not written in the test.

### 1. Time

```ts
const session = createSession("ana");                        // reads the clock inside
expect(session.expiresAt).toBe(Date.now() + SESSION_TTL_MS); // reads it again
```

Two reads of a clock that moves. They agree only when both fall in the same millisecond. Other forms of the same cause: tests that fail near midnight, at the end of a month, in another time zone, or on a slow machine because of a fixed `sleep`.

**Fix: a fake clock.** The clock becomes a parameter (`Clock = () => number`). Production uses `Date.now`. The test uses a `FakeClock` that stands still until `advance(ms)` is called, so "30 minutes later" takes no real time and the boundary of the rule is tested to the millisecond.

### 2. Order dependence

```ts
await Promise.all(ids.map(async (id) => { prices.push(await lookup(id)); }));
```

Concurrent work finishes in an order that depends on timing. Code that collects results as they arrive returns a different order on each run. The same cause appears with unordered collections, database rows without `ORDER BY` and files listed from a directory.

**Fix: a deterministic order.** If callers need an order, the code must guarantee it (`Promise.all` returns results in the order of the requests). If they do not, the test must not assert one: compare sorted contents.

### 3. Shared state

Three tests use one module-level registry. Each relies on what the previous one left. In the written order they pass. Under `bun test --randomize` only 1 of the 6 orders passes. The same happens with a shared database, a file on disk, a global variable or an environment variable.

**Fix: isolation.** Each test gets a fresh fixture in `beforeEach` and leaves nothing behind. Tests that pass in any order can also run in parallel.

### 4. Real network

The test calls a service over HTTP and the service has bad moments. A failure says nothing about our code.

**Fix: a stub.** The HTTP function is a parameter and the test passes one that returns a prepared `Response`. The error path, which a healthy service would not show on demand, gets its own test. The stub does not tell whether the real service still answers in that shape. A separate contract or integration test asks that, on purpose and apart from the unit suite.

In the lab the "real network" is a local service on an internal docker-compose network. Its failures are simulated, and nothing reaches a third-party host.

## What the lab measures

| Cause | Flaky test, 50 runs | Fixed test, 500 runs |
| --- | --- | --- |
| Time | 11 failures | 0 failures |
| Order dependence | 37 failures | 0 failures |
| Shared state | 42 failures | 0 failures |
| Real network | 11 failures | 0 failures |

One run from the README. `src/repeat.ts` starts a new `bun test --randomize` process for every run, so nothing is carried between runs, and fails the build if a flaky test never fails or a fixed test fails once.

"At least once in 50" is a probability, not a guarantee: for the least flaky test (about 20%) the chance of 50 green runs is `0.8^50`, about 1 in 70 000.

## What is not a fix

- **Retrying until green.** It hides the symptom and keeps the cause. A retry is acceptable as a temporary quarantine with a ticket, never as the answer.
- **A longer `sleep`.** It makes the race less likely and the suite slower. Wait for a condition instead.
- **Deleting or skipping the test** without understanding it. Sometimes the test is right and the product has a real race.
- **Fixing the order of the tests** so that the shared state keeps "working". The dependence is still there, and it blocks parallel runs.

## Run

```sh
./setup-unix-flaky-tests.sh        # Linux and macOS
./setup-windows-flaky-tests.ps1    # Windows
```
