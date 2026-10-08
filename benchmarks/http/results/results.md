# Benchmark: http

Generated at 2026-10-07T23:45:49.877Z. 3 measured runs of 10 s per row, each after a 3 s warm-up run, with 32 virtual users. Every server and the load generator are limited to 4 CPUs and 2 GiB.

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes and servers

- cpp: 16.2.0, cpp-httplib 0.60.0 + nlohmann/json 3.12.0 (sef-bd-http-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28), axum 0.8.9 + tokio 1.53.2 (sef-bd-http-rust:local)
- go: go version go1.27.1 linux/amd64, net/http (standard library) (sef-bd-http-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS, JDK HttpServer + virtual threads + Jackson 3.2.3 (sef-bd-http-java:local)
- ts: 1.4.2, Bun.serve (built in) (sef-bd-http-ts:local)
- elixir: 1.20.4, Bandit 1.12.5 + Plug 1.20.3 (sef-bd-http-elixir:local)
- python: Python 3.14.8, FastAPI 0.142.4 + uvicorn 0.54.0 (1 worker) (sef-bd-http-python:local)

## Results

`req/s` is the mean of the runs ± standard deviation, with the range. Latencies are the mean of the runs. `CPU` is the mean of the server container while the load ran (100 % is one core, the limit is 400 %), `peak memory` is its largest sample, both from `docker stats`. `k6 CPU` is the load generator: close to 400 % means the generator, not the server, was the limit.

| Endpoint | Language | req/s | range (req/s) | p50 (ms) | p95 (ms) | p99 (ms) | CPU (%) | peak memory (MiB) | k6 CPU (%) | failed (%) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| echo | cpp | 14346 ± 2295 | 11815 to 16291 | 1.35 | 6.51 | 12.7 | 188 | 6.61 | 378 | 0.00 |
| echo | elixir | 16470 ± 3265 | 14418 to 20236 | 1.42 | 4.91 | 8.66 | 329 | 147 | 340 | 0.00 |
| echo | go | 16119 ± 1116 | 14839 to 16894 | 1.25 | 5.55 | 10.1 | 214 | 12.2 | 338 | 0.00 |
| echo | java | 12939 ± 1923 | 11308 to 15059 | 1.54 | 7.06 | 13.6 | 168 | 173 | 283 | 0.00 |
| echo | python | 2170 ± 260 | 1873 to 2355 | 13.3 | 26.7 | 38.6 | 101 | 45.6 | 110 | 0.00 |
| echo | rust | 12694 ± 3143 | 9391 to 15649 | 1.58 | 7.53 | 14.2 | 107 | 5.45 | 280 | 0.00 |
| echo | ts | 18719 ± 5605 | 14562 to 25094 | 1.32 | 4.27 | 7.63 | 96 | 17.8 | 306 | 0.00 |
| primes | cpp | 13884 ± 2447 | 11244 to 16075 | 1.35 | 6.88 | 13.8 | 239 | 6.42 | 321 | 0.00 |
| primes | elixir | 6927 ± 860 | 5963 to 7614 | 3.79 | 10.1 | 16.2 | 369 | 147 | 193 | 0.00 |
| primes | go | 21080 ± 3670 | 17836 to 25064 | 0.99 | 4.24 | 8.20 | 312 | 12.7 | 354 | 0.00 |
| primes | java | 9594 ± 1588 | 7941 to 11108 | 2.11 | 9.74 | 17.6 | 221 | 176 | 270 | 0.00 |
| primes | python | 345 ± 16 | 332 to 363 | 90.9 | 127 | 150 | 106 | 47.9 | 16 | 0.00 |
| primes | rust | 17625 ± 1974 | 15421 to 19231 | 1.20 | 4.78 | 9.22 | 236 | 6.43 | 342 | 0.00 |
| primes | ts | 7645 ± 757 | 6886 to 8400 | 3.60 | 8.00 | 13.0 | 98 | 19.4 | 175 | 0.00 |

## Commands

Run from `benchmarks/http/`:

- `cpp` echo: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-cpp:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `elixir` echo: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-elixir:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `go` echo: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-go:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `java` echo: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-java:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `python` echo: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-python:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `rust` echo: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-rust:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `ts` echo: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-ts:8080 -e ENDPOINT=echo -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `cpp` primes: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-cpp:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `elixir` primes: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-elixir:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `go` primes: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-go:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `java` primes: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-java:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `python` primes: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-python:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `rust` primes: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-rust:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
- `ts` primes: `docker compose --profile tools run --rm -T --name sef-bd-http-k6-load -e TARGET=http://server-ts:8080 -e ENDPOINT=primes -e VUS=32 -e DURATION=10s -e LIMIT=5000 k6 run --quiet /scripts/load.js`
