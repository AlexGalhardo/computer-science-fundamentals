# Load test scenarios with k6: results

Generated at 2026-10-08T01:07:21.097Z by `./load-test-unix.sh 2 20`.

The same four k6 scenarios ran twice against the same API: before the fix (small connection pool) and after it (larger pool). Nothing else changed. A scenario fails when it crosses a threshold: p95 latency of 250 ms or more, overall or in any phase, or 1% or more failed requests.

| Scenario | Shape | Before (pool of 2) | After (pool of 20) |
| --- | --- | --- | --- |
| [`load`](load.md) | ramp to 150 req/s in 5 s, hold 20 s, ramp down | **FAIL**: p95 2020 ms, 25.20% failed | pass: p95 21.2 ms, 0.00% failed |
| [`stress`](stress.md) | steps of 6 s: 50, 100, 150, 200, 250, 300 req/s | **FAIL**: p95 2020 ms, 42.79% failed | pass: p95 21.2 ms, 0.00% failed |
| [`spike`](spike.md) | 40 req/s, jump to 500 req/s for 6 s, back to 40 req/s for 16 s | **FAIL**: p95 2020 ms, 47.15% failed | pass: p95 21.4 ms, 0.00% failed |
| [`soak`](soak.md) | constant 130 req/s for 60 s (scaled down: a real soak runs for hours) | **FAIL**: p95 2020 ms, 23.08% failed | pass: p95 27.4 ms, 0.00% failed |

One Markdown summary per scenario: [load.md](load.md), [stress.md](stress.md), [spike.md](spike.md), [soak.md](soak.md). The raw k6 output is in `k6-results/`, which is git-ignored.

## Environment

| Item | Value |
| --- | --- |
| Machine | AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores, 15.6 GiB visible to Docker |
| Database | postgres:18.6-alpine |
| Runtime | Bun 1.4.2, oven/bun:1.4.2, ElysiaJS 1.4.30, pg 8.23.1 |
| Load tool | k6 (grafana/k6:2.3.0), on the same machine and the same internal Docker network as the API |
| Query time | 20 ms per request (`pg_sleep`) |
| Waiting limit for a connection | 2000 ms, then `503` |

Each scenario ran once before and once after the fix. Other agents and programs were using the same machine, so the exact latencies are noisy. The verdicts are not: before the fix the load is above the capacity of the pool by a wide margin, and after the fix it is below it by a wide margin.
