# flaky-tests: 500 runs of each fixed test

Written by `docker compose run --rm fixed` in 20.2 s. Expectation: no fixed test may fail, not even once.

| Cause | Test file | Runs | Failures | Failure rate | Verdict |
| --- | --- | --- | --- | --- | --- |
| time | `tests/fixed/time.test.ts` | 500 | 0 | 0.0% | as expected |
| order | `tests/fixed/order.test.ts` | 500 | 0 | 0.0% | as expected |
| shared-state | `tests/fixed/shared-state.test.ts` | 500 | 0 | 0.0% | as expected |
| network | `tests/fixed/network.test.ts` | 500 | 0 | 0.0% | as expected |
