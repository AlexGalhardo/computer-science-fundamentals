# Spike test (`spike`)

Shape: 40 req/s, jump to 500 req/s for 6 s, back to 40 req/s for 16 s. Executor: `ramping-arrival-rate` (open model). Every request is `GET /products/:id`, which holds one database connection for about 20 ms.

A spike test jumps to a multiple of the normal traffic in about a second and comes back. It asks whether the system survives the burst and how long it takes to recover. Look at the `recovery` phase: the traffic is back to normal there, and any latency above the budget is the backlog of the spike still being drained.

## Result

| | Before the fix | After the fix |
| --- | --- | --- |
| Connection pool | 2 connections | 20 connections |
| Capacity of the pool (connections / query time) | 100 req/s | 1000 req/s |
| Requests answered | 3389 | 3960 |
| Failed requests (not 2xx or 3xx) | 47.15% | 0.00% |
| Iterations k6 could not start (`dropped_iterations`) | 571 | 0 |
| Median latency | 2000 ms | 20.8 ms |
| p95 latency | 2020 ms | 21.4 ms |
| p99 latency | 2021 ms | 24.2 ms |
| Slowest request | 2024 ms | 67.2 ms |
| Thresholds crossed | 4 of 5 | 0 of 5 |
| k6 result | **FAIL** (exit code 99) | pass (exit code 0) |

## Thresholds

| Threshold | Before the fix | After the fix |
| --- | --- | --- |
| `http_req_duration`: `p(95)<250` | **FAIL** | pass |
| `http_req_failed`: `rate<0.01` | **FAIL** | pass |
| `http_req_duration{phase:before}`: `p(95)<250` | pass | pass |
| `http_req_duration{phase:spike}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:recovery}`: `p(95)<250` | **FAIL** | pass |

## Phases

| Phase | Target rate (req/s) | Seconds | Before: requests | Before: median (ms) | Before: p95 (ms) | After: requests | After: median (ms) | After: p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `before` | 40 | 8 | 319 | 20.9 | 21.3 | 319 | 21.0 | 23.2 |
| `spike` | 500 | 6 | 2202 | 2000 | 2020 | 2769 | 20.8 | 21.2 |
| `recovery` | 40 | 16 | 867 | 21.3 | 2018 | 871 | 20.9 | 21.3 |
