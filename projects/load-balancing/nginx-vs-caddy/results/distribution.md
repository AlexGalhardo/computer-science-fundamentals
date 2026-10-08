# NGINX against Caddy: distribution of requests

Generated at 2026-10-08T00:58:16.456Z.

## Machine

- CPU seen by Docker: AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores
- Memory seen by Docker: 15.6 GiB
- Proxies: nginx:1.30.5-alpine and caddy:2.11.7-alpine
- Back ends and load generator: bun 1.4.2, on the same machine and docker network as the proxies
- Command: `docker compose --profile lab run --rm lab`

## Method

Each run sends 3000 requests through one route of one proxy, with 30 requests in flight (closed loop), and counts which instance answered each one by the `X-Instance` header. The check passes when every observed share is within 5 percentage points of the expected share. Shares are the median of the runs, with the smallest and largest value in parentheses.

| Proxy | Algorithm | Expected | api-1 | api-2 | api-3 | Worst distance | Check |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| nginx | round-robin | 33.3% / 33.3% / 33.3% | 33.3% (33.3% to 33.3%) | 33.3% (33.3% to 33.3%) | 33.3% (33.3% to 33.3%) | 0.0 points | pass |
| nginx | weighted-round-robin | 50.0% / 33.3% / 16.7% | 50.0% (50.0% to 50.0%) | 33.3% (33.3% to 33.3%) | 16.7% (16.7% to 16.7%) | 0.0 points | pass |
| nginx | least-connections | 44.4% / 44.4% / 11.1% | 44.0% (43.8% to 44.1%) | 43.9% (43.8% to 44.1%) | 12.0% (11.9% to 12.3%) | 1.2 points | pass |
| nginx | ip-hash | 33.3% / 33.3% / 33.3% | 33.4% (33.4% to 33.4%) | 33.2% (33.2% to 33.2%) | 33.4% (33.4% to 33.4%) | 0.1 points | pass |
| caddy | round-robin | 33.3% / 33.3% / 33.3% | 33.3% (33.3% to 33.3%) | 33.3% (33.3% to 33.3%) | 33.3% (33.3% to 33.3%) | 0.0 points | pass |
| caddy | weighted-round-robin | 50.0% / 33.3% / 16.7% | 50.0% (50.0% to 50.0%) | 33.3% (33.3% to 33.3%) | 16.7% (16.7% to 16.7%) | 0.0 points | pass |
| caddy | least-connections | 44.4% / 44.4% / 11.1% | 43.9% (43.8% to 44.0%) | 43.9% (43.8% to 44.0%) | 12.3% (12.0% to 12.3%) | 1.2 points | pass |
| caddy | ip-hash | 33.3% / 33.3% / 33.3% | 31.4% (31.4% to 31.4%) | 33.2% (33.2% to 33.2%) | 35.4% (35.4% to 35.4%) | 2.1 points | pass |

## Why these shares are expected

- **round-robin**: equal weights, one third each.
- **weighted-round-robin**: weights 3, 2, 1.
- **least-connections**: api-3 takes 40 ms against 10 ms, so shares follow 1/time = 4 : 4 : 1.
- **ip-hash**: 500 clients in 500 different /24 networks, hashed over three instances.

## Stickiness of ip-hash

Each of the 500 simulated clients sends 6 requests. A client is sticky when all of them reached the same instance.

| Proxy | Sticky clients, per run |
| --- | --- |
| nginx | 500 of 500, 500 of 500, 500 of 500 |
| caddy | 500 of 500, 500 of 500, 500 of 500 |
