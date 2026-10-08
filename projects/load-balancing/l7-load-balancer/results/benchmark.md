# Hand-written load balancer against NGINX: results

Generated at 2026-10-08T01:55:22Z by `docker compose --profile bench run --rm report`.

## Machine

- CPU seen by Docker: AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores
- Memory seen by Docker: 15.6 GiB
- Balancer and back ends: go1.27.1
- NGINX: nginx:1.30.5-alpine
- k6: grafana/k6:2.3.0
- Load generator, proxies and back ends share the machine and one internal docker network

## Scenario

k6 keeps 50 virtual users sending `GET /work` in a closed loop for 10 seconds through one proxy, in front of the same three back ends. The targets are measured one at a time and the whole round is repeated, so that a busy moment of the machine does not fall on one target only. Every cell is the median of the runs, with the smallest and the largest value in parentheses.

| Proxy | Runs | Throughput (requests/s) | p50 latency (ms) | p99 latency (ms) | Failed requests |
| --- | ---: | ---: | ---: | ---: | ---: |
| This balancer, round robin | 5 | 10584 (7863 to 17198) | 3.08 (2.07 to 3.84) | 22.31 (12.15 to 34.70) | 0 |
| This balancer, least connections | 5 | 9405 (7561 to 11521) | 3.19 (2.81 to 4.19) | 28.72 (21.88 to 40.73) | 0 |
| NGINX, round robin | 5 | 10129 (9983 to 12968) | 2.60 (1.98 to 2.77) | 26.47 (18.83 to 30.52) | 0 |

Read the numbers as orders of magnitude. The machine is shared with other workloads, and the load generator competes with the proxies for the same cores.
