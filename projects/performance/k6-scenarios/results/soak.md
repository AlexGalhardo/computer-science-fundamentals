# Soak test (`soak`)

Shape: constant 130 req/s for 60 s (scaled down: a real soak runs for hours). Executor: `ramping-arrival-rate` (open model). Every request is `GET /products/:id`, which holds one database connection for about 20 ms.

A soak test holds a constant load for a long time, because some problems need time: a queue that grows a little every second, memory that is never freed, a table that fills up. Compare the first 10 seconds with the last 10: the same arrival rate, and a different latency. A test that stopped after a few seconds would have missed it. This run lasts one minute so the demo is short. A real soak test runs for hours.

## Result

| | Before the fix | After the fix |
| --- | --- | --- |
| Connection pool | 2 connections | 20 connections |
| Capacity of the pool (connections / query time) | 100 req/s | 1000 req/s |
| Requests answered | 7800 | 7800 |
| Failed requests (not 2xx or 3xx) | 23.08% | 0.00% |
| Iterations k6 could not start (`dropped_iterations`) | 0 | 0 |
| Median latency | 2012 ms | 20.9 ms |
| p95 latency | 2020 ms | 27.4 ms |
| p99 latency | 2022 ms | 38.0 ms |
| Slowest request | 2046 ms | 106 ms |
| Thresholds crossed | 5 of 5 | 0 of 5 |
| k6 result | **FAIL** (exit code 99) | pass (exit code 0) |

## Thresholds

| Threshold | Before the fix | After the fix |
| --- | --- | --- |
| `http_req_duration`: `p(95)<250` | **FAIL** | pass |
| `http_req_failed`: `rate<0.01` | **FAIL** | pass |
| `http_req_duration{phase:first-10s}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:middle}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:last-10s}`: `p(95)<250` | **FAIL** | pass |

## Phases

| Phase | Target rate (req/s) | Seconds | Before: requests | Before: median (ms) | Before: p95 (ms) | After: requests | After: median (ms) | After: p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `first-10s` | 130 | 10 | 1299 | 1760 | 2018 | 1299 | 20.9 | 22.3 |
| `middle` | 130 | 40 | 5200 | 2013 | 2020 | 5200 | 20.9 | 27.2 |
| `last-10s` | 130 | 10 | 1300 | 2013 | 2020 | 1300 | 20.9 | 31.8 |
