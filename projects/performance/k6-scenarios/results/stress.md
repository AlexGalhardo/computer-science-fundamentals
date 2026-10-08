# Stress test (`stress`)

Shape: steps of 6 s: 50, 100, 150, 200, 250, 300 req/s. Executor: `ramping-arrival-rate` (open model). Every request is `GET /products/:id`, which holds one database connection for about 20 ms.

A stress test keeps raising the load past the normal level to find where the system stops coping, and how it behaves there. The table of phases is the latency curve: flat while the arrival rate is below the capacity of the pool, then a knee. The knee is the capacity of the bottleneck, read from the outside.

## Result

| | Before the fix | After the fix |
| --- | --- | --- |
| Connection pool | 2 connections | 20 connections |
| Capacity of the pool (connections / query time) | 100 req/s | 1000 req/s |
| Requests answered | 5887 | 6174 |
| Failed requests (not 2xx or 3xx) | 42.79% | 0.00% |
| Iterations k6 could not start (`dropped_iterations`) | 287 | 0 |
| Median latency | 2000 ms | 20.7 ms |
| p95 latency | 2020 ms | 21.2 ms |
| p99 latency | 2021 ms | 22.4 ms |
| Slowest request | 2026 ms | 37.6 ms |
| Thresholds crossed | 6 of 8 | 0 of 8 |
| k6 result | **FAIL** (exit code 99) | pass (exit code 0) |

## Thresholds

| Threshold | Before the fix | After the fix |
| --- | --- | --- |
| `http_req_duration`: `p(95)<250` | **FAIL** | pass |
| `http_req_failed`: `rate<0.01` | **FAIL** | pass |
| `http_req_duration{phase:050-rps}`: `p(95)<250` | pass | pass |
| `http_req_duration{phase:100-rps}`: `p(95)<250` | pass | pass |
| `http_req_duration{phase:150-rps}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:200-rps}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:250-rps}`: `p(95)<250` | **FAIL** | pass |
| `http_req_duration{phase:300-rps}`: `p(95)<250` | **FAIL** | pass |

## Phases

| Phase | Target rate (req/s) | Seconds | Before: requests | Before: median (ms) | Before: p95 (ms) | After: requests | After: median (ms) | After: p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `050-rps` | 50 | 6 | 299 | 21.4 | 24.0 | 299 | 21.1 | 22.5 |
| `100-rps` | 100 | 6 | 575 | 127 | 224 | 575 | 20.9 | 21.4 |
| `150-rps` | 150 | 6 | 873 | 1736 | 2019 | 874 | 20.7 | 20.9 |
| `200-rps` | 200 | 6 | 1090 | 2014 | 2021 | 1175 | 20.7 | 21.0 |
| `250-rps` | 250 | 6 | 1376 | 2001 | 2020 | 1475 | 20.7 | 21.0 |
| `300-rps` | 300 | 6 | 1673 | 2001 | 2020 | 1775 | 20.7 | 21.1 |

## The latency knee

Before the fix, p95 latency is 24.0 ms at 50 req/s and 2019 ms at 150 req/s: the knee is at the `150-rps` step. The pool of 2 connections serves at most 2 / 20 ms = 100 requests per second (a little less in practice, because a query costs more than its 20 ms of sleep). Below that rate a connection is almost always free and latency is flat. A step right at that rate already shows waiting in its median. From the first step clearly above it, requests arrive faster than they leave, the queue for a connection grows for as long as the step lasts, and the waiting limit of 2000 ms turns the queue into 503 answers.

After the fix, the pool of 20 connections can serve 1000 requests per second, above the highest step of the test, and the curve stays flat: no step has a knee.
