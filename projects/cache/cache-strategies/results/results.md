# Cache strategies and stampede: load test results

Generated at 2026-10-08T01:37:09.642Z by `.\load-test-windows.ps1 -Rounds 3`.

## Stampede: database queries per expiry

Workload: 300 virtual users read one hot key for 9 s, pausing 100 ms between reads. The cached copy lives 2000 ms and the query behind it takes 100 ms. No warm-up: the cold start is the first stampede.

| Protection | Rounds | Expiries | Database queries | Queries per expiry (median) | Queries per expiry (range) | p95 latency, ms (mean ± sd) | Slowest request (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `none` | 3 | 9 | 2627 | **299** | 260 to 300 | 64 ± 51 | 1729 |
| `lock` | 3 | 15 | 15 | **1** | 1 | 107 ± 32 | 365 |
| `early` | 3 | 18 | 18 | **1** | 1 | 39 ± 23 | 289 |

- **Expiries** counts every time the hot key had to be loaded: the cold start, each expiry and each early refresh.
- **Queries per expiry** is counted by the API. A query that starts while another load of the hot key is still running belongs to the same expiry. The median column shows the worst round: the lowest median for `none`, the highest for the fixes.
- `lock`: one request wins `SET lock NX PX` and queries, the others wait for its copy. `early`: one request refreshes the key in the background before it expires, and nobody waits.

## Hit rate and latency per strategy and time to live

Workload: 20 virtual users, 200 products chosen with a skew towards the low ids, 2% writes, 5 s measured after a warm-up that is not counted. Each database read costs an extra 5 ms.

| Strategy | Time to live | Rounds | Hit rate (mean ± sd) | Read median (ms) | Read p95, ms (mean ± sd) | Write median (ms) | Write p95 (ms) | DB reads per 1000 requests | DB writes per 1000 requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cache-aside` | 250 ms | 3 | 59.2% ± 4.2 | 3.34 | 17.3 ± 10.7 | 23.12 | 493.4 | 403.2 | 20.3 |
| `cache-aside` | 1000 ms | 3 | 85.1% ± 1.7 | 1.40 | 9.9 ± 4.7 | 13.80 | 50.0 | 147.5 | 21.5 |
| `cache-aside` | 5000 ms | 3 | 95.2% ± 0.6 | 1.29 | 8.0 ± 7.0 | 43.64 | 442.2 | 47.7 | 19.7 |
| `write-through` | 250 ms | 3 | 62.9% ± 5.9 | 3.06 | 16.7 ± 16.6 | 19.19 | 60.4 | 360.7 | 21.4 |
| `write-through` | 1000 ms | 3 | 83.8% ± 3.2 | 3.46 | 20.9 ± 10.0 | 20.92 | 77.2 | 157.3 | 20.1 |
| `write-through` | 5000 ms | 3 | 96.7% ± 1.3 | 2.31 | 15.0 ± 9.2 | 48.52 | 236.9 | 30.1 | 21.5 |
| `write-behind` | 250 ms | 3 | 55.2% ± 2.3 | 8.02 | 36.6 ± 10.9 | 11.14 | 39.9 | 455.3 | 5.5 |
| `write-behind` | 1000 ms | 3 | 83.2% ± 3.8 | 3.25 | 27.5 ± 15.2 | 7.04 | 33.2 | 164.0 | 4.5 |
| `write-behind` | 5000 ms | 3 | 97.4% ± 0.8 | 1.71 | 9.8 ± 8.2 | 2.43 | 13.6 | 25.4 | 3.2 |

- **Hit rate** is the share of reads answered with `X-Cache: hit`.
- **DB reads** and **DB writes** are statements sent to PostgreSQL per 1000 client requests. A write-behind batch is one statement for many products.

## Environment

| Item | Value |
| --- | --- |
| Machine | AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores, 15.6 GiB visible to Docker |
| Database | PostgreSQL 18.6 (postgres:18.6-alpine) |
| Cache | Redis 8.10.2 (redis:8.10.2-alpine), no persistence, default configuration |
| Runtime | Bun 1.4.2 (oven/bun:1.4.2) with its built-in Redis client, ElysiaJS 1.4.30, pg 8.23.1 |
| Load tool | k6 (grafana/k6:2.3.0) |
| Connection pool | 20 connections |
| Write-behind flush interval | 200 ms |

Numbers depend on the machine, and they are noisy: the runs are short and the machine was shared with other work. Compare the rows with each other, not with another computer. The counts of the stampede table (queries per expiry) are the stable part; the latencies are not.
