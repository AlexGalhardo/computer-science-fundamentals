# Benchmark: database

Generated at 2026-10-07T23:52:28.250Z. 3 measured runs per language after 1 small warm-up run. 5000 rows, 8 workers in the pool phase. PostgreSQL 18.6 with its data on tmpfs, client and server limited to 4 CPUs each.

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Drivers

- cpp: libpq (official C client, from Debian trixie) 17.11-0+deb13u1 (sef-bd-database-cpp:local)
- rust: sqlx 0.9.0 on tokio 1.53.2 (sef-bd-database-rust:local)
- go: pgx 5.11.0 (pgxpool) (sef-bd-database-go:local)
- java: PostgreSQL JDBC 42.7.14 + HikariCP 7.1.0 (sef-bd-database-java:local)
- ts: Bun.sql (built into Bun 1.4.2) (sef-bd-database-ts:local)
- elixir: Postgrex 0.22.4 (sef-bd-database-elixir:local)
- python: psycopg 3.3.6 + psycopg-pool 3.3.3 (sef-bd-database-python:local)

## Results

`ops/s` is the mean of the runs ± standard deviation. Latencies are per operation, mean of the runs. `client CPU` and `client memory` belong to the whole client run (the four phases together).

| Phase | Language | ops/s | range (ops/s) | p50 (ms) | p95 (ms) | p99 (ms) | client CPU (ms) | client memory (MiB) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| insert | cpp | 4817 ± 272 | 4510 to 5028 | 0.19 | 0.28 | 0.44 | 1134 | 11.5 |
| insert | rust | 1463 ± 96 | 1360 to 1550 | 0.62 | 0.95 | 2.19 | 5233 | 5.76 |
| insert | go | 4415 ± 285 | 4086 to 4594 | 0.22 | 0.28 | 0.34 | 2042 | 13.9 |
| insert | java | 5713 ± 282 | 5505 to 6034 | 0.16 | 0.24 | 0.34 | 3877 | 128 |
| insert | ts | 4189 ± 204 | 3970 to 4374 | 0.23 | 0.32 | 0.46 | 2654 | 53.0 |
| insert | elixir | 2699 ± 174 | 2498 to 2810 | 0.35 | 0.47 | 0.68 | 4286 | 112 |
| insert | python | 4239 ± 694 | 3547 to 4935 | 0.23 | 0.32 | 0.45 | 5663 | 41.5 |
| read | cpp | 4965 ± 344 | 4669 to 5342 | 0.19 | 0.27 | 0.39 | 1134 | 11.5 |
| read | rust | 1594 ± 100 | 1495 to 1694 | 0.59 | 0.81 | 1.22 | 5233 | 5.76 |
| read | go | 4852 ± 129 | 4710 to 4960 | 0.20 | 0.24 | 0.28 | 2042 | 13.9 |
| read | java | 6452 ± 520 | 5895 to 6926 | 0.14 | 0.20 | 0.31 | 3877 | 128 |
| read | ts | 4173 ± 300 | 3867 to 4466 | 0.22 | 0.32 | 0.60 | 2654 | 53.0 |
| read | elixir | 2761 ± 124 | 2650 to 2895 | 0.35 | 0.45 | 0.55 | 4286 | 112 |
| read | python | 4239 ± 492 | 3683 to 4619 | 0.22 | 0.31 | 0.58 | 5663 | 41.5 |
| query | cpp | 1919 ± 315 | 1673 to 2274 | 0.51 | 0.82 | 1.00 | 1134 | 11.5 |
| query | rust | 1131 ± 93 | 1046 to 1230 | 0.85 | 1.12 | 1.63 | 5233 | 5.76 |
| query | go | 2187 ± 204 | 1956 to 2342 | 0.43 | 0.58 | 0.82 | 2042 | 13.9 |
| query | java | 2545 ± 29 | 2518 to 2576 | 0.37 | 0.48 | 0.64 | 3877 | 128 |
| query | ts | 2020 ± 130 | 1896 to 2155 | 0.46 | 0.66 | 1.17 | 2654 | 53.0 |
| query | elixir | 1392 ± 247 | 1107 to 1539 | 0.69 | 1.05 | 1.76 | 4286 | 112 |
| query | python | 2081 ± 57 | 2037 to 2146 | 0.45 | 0.67 | 0.80 | 5663 | 41.5 |
| pool | cpp | 23546 ± 3998 | 21200 to 28162 | 0.23 | 0.60 | 1.78 | 1134 | 11.5 |
| pool | rust | 13456 ± 3505 | 9668 to 16586 | 0.55 | 1.03 | 1.78 | 5233 | 5.76 |
| pool | go | 32674 ± 1644 | 31594 to 34565 | 0.22 | 0.32 | 0.41 | 2042 | 13.9 |
| pool | java | 14681 ± 644 | 14278 to 15425 | 0.23 | 0.60 | 6.75 | 3877 | 128 |
| pool | ts | 9226 ± 1626 | 7507 to 10739 | 0.64 | 1.69 | 2.71 | 2654 | 53.0 |
| pool | elixir | 12187 ± 4557 | 6945 to 15209 | 0.60 | 1.39 | 2.29 | 4286 | 112 |
| pool | python | 2259 ± 250 | 2033 to 2527 | 3.44 | 5.87 | 7.93 | 5663 | 41.5 |

## Commands

Run from `benchmarks/database/`:

- `cpp`: `docker compose --profile clients run --rm -T client-cpp 5000 8`
- `rust`: `docker compose --profile clients run --rm -T client-rust 5000 8`
- `go`: `docker compose --profile clients run --rm -T client-go 5000 8`
- `java`: `docker compose --profile clients run --rm -T client-java 5000 8`
- `ts`: `docker compose --profile clients run --rm -T client-ts 5000 8`
- `elixir`: `docker compose --profile clients run --rm -T client-elixir 5000 8`
- `python`: `docker compose --profile clients run --rm -T client-python 5000 8`
