# Load test (`load`)

Shape: ramp to 150 req/s in 5 s, hold 20 s, ramp down. Executor: `ramping-arrival-rate` (open model). Every request is `GET /products/:id`, which holds one database connection for about 20 ms.

A load test applies the traffic of a normal busy period and asks one question: does the system meet its service level at the load it was built for? With a pool of 2 connections it does not: 150 requests per second is above what the pool can serve, so the queue for a connection grows during the whole steady phase.

## Result

| | Before the fix | After the fix |
| --- | --- | --- |
| Connection pool | 2 connections | 20 connections |
| Capacity of the pool (connections / query time) | 100 req/s | 1000 req/s |
| Requests answered | 3797 | 3800 |
| Failed requests (not 2xx or 3xx) | 25.20% | 0.00% |
| Iterations k6 could not start (`dropped_iterations`) | 3 | 0 |
| Median latency | 2001 ms | 20.8 ms |
| p95 latency | 2020 ms | 21.2 ms |
| p99 latency | 2021 ms | 22.4 ms |
| Slowest request | 2029 ms | 30.9 ms |
| Thresholds crossed | 5 of 5 | 0 of 5 |
| k6 result | **FAIL** (exit code 99) | pass (exit code 0) |

## Thresholds

| Threshold | Before the fix | After the fix |
| --- | --- | --- |
| `http_req_duration`: `p(95)<250` | **FAIL** | pass |
| `http_req_failed`: `rate<0.01` | **FAIL** | pass |
| `http_req_duration{phase:ramp-up}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:steady}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:ramp-down}`: `p(95)<250` | **FAIL** | pass |

## Phases

| Phase | Target rate (req/s) | Seconds | Before: requests | Before: median (ms) | Before: p95 (ms) | After: requests | After: median (ms) | After: p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ramp-up` | 150 | 5 | 398 | 38.1 | 451 | 399 | 20.9 | 21.6 |
| `steady` | 150 | 20 | 2997 | 2010 | 2020 | 3000 | 20.8 | 21.1 |
| `ramp-down` | 10 | 5 | 401 | 2003 | 2020 | 400 | 20.8 | 21.0 |
