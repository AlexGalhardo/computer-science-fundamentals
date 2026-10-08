# flaky-tests: 50 runs of each flaky test

Written by `docker compose run --rm flaky` in 1.8 s. Expectation: each flaky test must fail at least once.

| Cause | Test file | Runs | Failures | Failure rate | Verdict |
| --- | --- | --- | --- | --- | --- |
| time | `tests/flaky/time.test.ts` | 50 | 11 | 22.0% | as expected |
| order | `tests/flaky/order.test.ts` | 50 | 37 | 74.0% | as expected |
| shared-state | `tests/flaky/shared-state.test.ts` | 50 | 42 | 84.0% | as expected |
| network | `tests/flaky/network.test.ts` | 50 | 11 | 22.0% | as expected |
