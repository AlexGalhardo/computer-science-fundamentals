# Bun against Node: load test results

Generated at 2026-10-08T00:47:58.883Z by `.\load-test-windows.ps1 -Rounds 3`.

Workload: after a warm-up that is not measured, 8 s of 32 virtual users calling `GET /cpu?n=200000` (counts the primes below n), then 8 s of 200 virtual users calling `GET /io?ms=20` (waits on a timer). Closed model: each virtual user waits for the answer before sending the next request. One setup runs at a time.

Each cell is the **median of the rounds, with the lowest and the highest round in parentheses**.

| Setup | Runtime | Rounds | CPU-bound: requests/s | CPU-bound: p95 (ms) | I/O-bound: requests/s | I/O-bound: p95 (ms) | Peak memory (MiB) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bun` | Bun 1.4.2 | 3 | 84 (67 to 84) | 409 (406 to 585) | 9084 (5259 to 9515) | 26.0 (22.2 to 97.2) | 39 (35 to 39) |
| `node` | Node.js 24.21.0 | 3 | 71 (61 to 73) | 656 (655 to 829) | 8205 (6189 to 8486) | 29.2 (27.1 to 71.0) | 95 (70 to 98) |
| `node-pm2` | Node.js 24.21.0 | 3 | 249 (240 to 259) | 225 (220 to 242) | 9226 (8537 to 9274) | 23.7 (23.2 to 31.0) | 193 (193 to 194) |

- **Requests/s** is the number of answers of the phase divided by the time from its first request sent to its last answer received.
- **p95** is the 95th percentile of the request duration measured by k6: 95% of the requests of the phase took at most this long.
- **Peak memory** is the highest memory use of the whole container since it started (cgroup `memory.peak`), read after the load. For `node-pm2` that is the PM2 daemon plus every worker.

## Environment

| Item | Value |
| --- | --- |
| Machine | AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores, 15.6 GiB visible to Docker |
| Images | oven/bun:1.4.2, node:24.21.0-bookworm-slim, PM2 7.0.4 |
| Load tool | k6 (grafana/k6:2.3.0), on the same machine and the same internal Docker network as the server |
| Limits | each server container is limited to 4 CPUs. `node-pm2` runs 4 workers in cluster mode, `bun` and `node` run one process |

Other agents and programs were using the same machine during the measurement, so the numbers are noisy. Compare the setups with each other, look at the range before believing a difference, and do not compare with another computer.
