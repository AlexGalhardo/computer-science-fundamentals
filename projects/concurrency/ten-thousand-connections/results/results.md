# Ten thousand connections: results

Generated at 2026-10-07T23:24:25.974Z by `docker compose --profile load run --rm report`.

## Machine

- CPU seen by Docker: AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores
- Memory seen by Docker: 15.6 GiB
- Load generator: grafana/k6:2.3.0, on the same machine and docker network as the servers
- ts: bun 1.4.2
- go: go1.27.1
- elixir: elixir 1.20.4 (OTP 28)

## Scenario

k6 opens 10000 connections over 10 seconds. Each one is a `GET /delay?ms=30000`, so it stays open and idle for 30 seconds. While they are held, k6 sends 50 `POST /echo` per second and records the latency, and one `GET /stats` reads the memory of the server.

## Memory

`held` counts the connections answered with 200 after the full wait. `open at probe` is the number of requests in flight that the server itself reported. Memory per connection is the growth of the resident memory divided by `open at probe`.

| Server | Asked | Held | Open at probe | Idle memory (MiB) | Memory while holding (MiB) | Memory per connection (KiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ts | 10000 | 10000 | 10000 | 18.9 | 58.6 | 4.1 |
| go | 10000 | 10000 | 10000 | 7.9 | 167.1 | 16.3 |
| elixir | 10000 | 10000 | 10000 | 86.1 | 182.7 | 9.9 |

## Latency of `POST /echo` while the connections are held

| Server | Requests | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| ts | 599 | 0.49 | 3.53 | 11.07 | 13.37 |
| go | 601 | 0.53 | 3.82 | 10.57 | 25.40 |
| elixir | 600 | 0.56 | 2.57 | 6.24 | 13.13 |

One run per server, on a shared machine. Read the numbers as orders of magnitude, and run the scenario again before comparing two servers that are close.
