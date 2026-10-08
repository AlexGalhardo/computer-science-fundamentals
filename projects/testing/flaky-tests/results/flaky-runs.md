# flaky-tests: 50 runs of each flaky test

Written by `docker compose run --rm flaky` in 2.2 s. Expectation: each flaky test must fail at least once.

| Cause | Test file | Runs | Failures | Failure rate | Verdict |
| --- | --- | --- | --- | --- | --- |
| time | `tests/flaky/time.test.ts` | 50 | 17 | 34.0% | as expected |
| order | `tests/flaky/order.test.ts` | 50 | 36 | 72.0% | as expected |
| shared-state | `tests/flaky/shared-state.test.ts` | 50 | 38 | 76.0% | as expected |
| network | `tests/flaky/network.test.ts` | 50 | 16 | 32.0% | as expected |
