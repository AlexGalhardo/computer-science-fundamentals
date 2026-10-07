# Overselling at checkout: load test results

Generated at 2026-10-07T22:26:32.740Z by `.\load-test-windows.ps1 -Rounds 3`.

Workload: 200 concurrent buyers, 10 units in stock, one purchase attempt per buyer, all started together. Each strategy ran in separate rounds, and the product was reset before each round.

| Strategy | Rounds | Orders created | Requests/s (mean ± sd) | Rejected: sold out (mean) | Rejected: gave up after conflicts (mean) | Rejected share | p95 latency (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `naive` | 3 | **150 to 180** | 252 ± 76 | 35.0 | 0.0 | 17.5% | 767 |
| `optimistic` | 3 | 10 | 445 ± 72 | 190.0 | 0.0 | 95.0% | 417 |
| `pessimistic` | 3 | 10 | 260 ± 36 | 190.0 | 0.0 | 95.0% | 694 |
| `serializable` | 3 | 10 | 821 ± 67 | 190.0 | 0.0 | 95.0% | 229 |

- **Orders created** is the number of rows in `orders` after the round. Anything above the stock is overselling.
- **Requests/s** is the number of buyers divided by the time from the first request sent to the last response received.
- **Rejected** requests are the buyers that did not get a unit: `409` when the product was sold out, `503` when a fix gave up after too many conflicts.

## Environment

| Item | Value |
| --- | --- |
| Machine | AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores, 15.6 GiB visible to Docker |
| Database | PostgreSQL 18.6 (postgres:18.6-alpine) |
| Runtime | Bun 1.4.2 (oven/bun:1.4.2), ElysiaJS 1.4.30, pg 8.23.1 |
| Load tool | k6 (grafana/k6:2.3.0) |
| Think time between read and write | 2 ms |
| Connection pool | 20 connections |

Numbers depend on the machine. Compare the strategies with each other, not with another computer.
