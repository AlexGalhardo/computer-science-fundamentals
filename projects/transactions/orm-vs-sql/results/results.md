# Prisma, Drizzle and raw SQL: benchmark results

Generated at 2026-10-07T22:37:48.869Z by `docker compose run --rm bench`.

## Latency per approach

3 rounds of 1000 sequential calls per query and approach, after 100 discarded warm-up calls. The application and the database run in two containers on the same machine, so the network cost is close to zero and the difference between the approaches is mostly the work done by each library.

| Query | Approach | Mean (ms) | ± between rounds | p50 (ms) | p95 (ms) | Times raw SQL |
| --- | --- | --- | --- | --- | --- | --- |
| `author-by-id` | raw | 0.307 | 0.018 | 0.292 | 0.373 | 1.00x |
| `author-by-id` | prisma | 0.426 | 0.032 | 0.405 | 0.528 | 1.39x |
| `author-by-id` | drizzle | 0.365 | 0.017 | 0.346 | 0.445 | 1.19x |
| `top-posts` | raw | 0.352 | 0.026 | 0.325 | 0.449 | 1.00x |
| `top-posts` | prisma | 0.453 | 0.028 | 0.421 | 0.573 | 1.29x |
| `top-posts` | drizzle | 0.426 | 0.028 | 0.393 | 0.545 | 1.21x |
| `posts-with-author` | raw | 0.586 | 0.061 | 0.550 | 0.804 | 1.00x |
| `posts-with-author` | prisma | 1.107 | 0.083 | 1.049 | 1.431 | 1.89x |
| `posts-with-author` | drizzle | 0.712 | 0.053 | 0.660 | 0.956 | 1.22x |
| `post-count-by-author` | raw | 0.867 | 0.095 | 0.780 | 1.187 | 1.00x |
| `post-count-by-author` | prisma | 1.225 | 0.129 | 1.097 | 1.665 | 1.41x |
| `post-count-by-author` | drizzle | 1.001 | 0.104 | 0.909 | 1.347 | 1.15x |

"± between rounds" is the standard deviation of the means of the rounds. A difference smaller than it is noise.

## N+1 and its fix

Listing 150 authors with their posts. Time is the mean of 5 runs.

| Approach | Statements, N+1 | Statements, fix | Time, N+1 (ms) | Time, fix (ms) | Speed-up |
| --- | --- | --- | --- | --- | --- |
| raw | 151 | 2 | 51.8 | 1.6 | 32.8x |
| prisma | 151 | 2 | 67.3 | 2.8 | 24.5x |
| drizzle | 151 | 2 | 49.5 | 1.7 | 28.8x |

## Environment

| Item | Value |
| --- | --- |
| Machine | AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores, 15.6 GiB visible to Docker |
| Database | PostgreSQL 18.6 (postgres:18.6-alpine) |
| Runtime | Bun 1.4.2 (oven/bun:1.4.2) |
| Libraries | pg 8.23.1, Prisma 7.10.0 with @prisma/adapter-pg 7.10.0, Drizzle ORM 0.45.3 |

Numbers depend on the machine. Compare the approaches with each other, not with another computer.
