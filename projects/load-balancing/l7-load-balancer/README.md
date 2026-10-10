# l7-load-balancer

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A layer 7 load balancer written by hand in Go, with the standard library only, in about 350 lines of code plus the comments. It shows what a load balancer does on every request: choose a back end (round robin or least connections), forward the request on another connection, copy the answer back, find out which back ends are alive (active health checks) and decide when a failed request may be sent to another back end. A local k6 benchmark then compares it with NGINX in front of the same three back ends.

The explanation of the concepts is in [docs/en/load-balancing/l7-load-balancer.md](../../../docs/en/load-balancing/l7-load-balancer.md).

> **Local only.** The k6 script refuses to run when the target is not `localhost` or one of the three proxies of this docker-compose file. Never point a load test at a host you do not own.

## Quiz topics it demonstrates

- `load-balancing` / `layer-4-vs-layer-7`: the proxy ends the client's connection and opens another one to the back end
- `load-balancing` / `balancing-algorithms`: round robin and least connections, with a slow back end
- `load-balancing` / `health-checks-and-failover`: active and passive checks, detection time, retry only when it is safe
- `load-balancing` / `reverse-proxy-load-balancer-api-gateway`: hop-by-hop headers and `X-Forwarded-For`

## Run

The only requirement is Docker.

```sh
./setup-unix-l7-load-balancer.sh        # Linux and macOS
./setup-windows-l7-load-balancer.ps1    # Windows
```

The script builds the image, runs `gofmt`, `go vet` and the Go tests with the race detector, sends 30 requests through each proxy inside docker-compose, checks that k6 refuses a target that is not local, and removes everything. It takes about a minute.

## Structure

| Path | What it is |
| --- | --- |
| `go/balancer/pool.go` | The back ends and their counters: healthy, requests in flight, requests served |
| `go/balancer/strategy.go` | The choice: `RoundRobin` and `LeastConnections` |
| `go/balancer/proxy.go` | One request: forward, rewrite headers, copy the answer, retry |
| `go/balancer/health.go` | The active health check |
| `go/cmd/lb` | The balancer as a program, configured by environment variables |
| `go/cmd/backend` | The trivial back end used by the benchmark |
| `go/cmd/report`, `go/report` | Turns the k6 summaries into `results/benchmark.md` |
| `load/bench.js`, `load/run-all.sh` | The k6 scenario and the rounds of the benchmark |
| `load/target.js` | The rule that refuses targets that are not local |
| `nginx/nginx.conf` | The reference: NGINX with round robin over the same back ends |

The balancer is configured with `BACKENDS` (comma-separated `http://host:port`), `STRATEGY` (`round-robin` or `least-connections`), `HEALTH_PATH`, `HEALTH_INTERVAL` and `HEALTH_TIMEOUT`. It answers `GET /lb/status` itself, with the state of every back end, and forwards everything else.

Everything runs on a docker network marked `internal`, with no route to the outside and no port published to the host.

## Tests

```sh
docker compose run --rm go-test          # gofmt, go vet, 17 Go tests with -race, no network
docker compose run --rm smoke-test       # 30 requests through each proxy, 10 per back end
docker compose run --rm k6-refusal-test  # k6 must refuse 8 targets that are not local
docker compose --profile bench down -v
```

The Go tests are integration tests in the small: real HTTP servers on the loopback interface play the back ends, and the requests go through the real proxy handler.

| What is tested | Test in `go/balancer/balancer_test.go` |
| --- | --- |
| Round robin: 300 requests, exactly 100 per back end, in the order a, b, c | `TestRoundRobinSplitsRequestsEvenly` |
| With one back end out, the other two get 50 each | `TestRoundRobinSkipsUnhealthyBackend` |
| Least connections picks the fewest requests in flight and rotates on ties | `TestLeastConnectionsPicksTheIdlestBackend`, `TestLeastConnectionsBreaksTiesInRotation` |
| One back end four times slower: least connections gives it 1/9, round robin 1/3, within 5 points | `TestDistributionWithOneSlowBackend` |
| A stopped back end is removed within the check interval, with no client traffic | `TestActiveCheckRemovesStoppedBackendWithinTheInterval` |
| 3000 requests while a back end is stopped: none fails | `TestNoRequestFailsWhileABackendStops` |
| A back end returns after the configured number of successful probes | `TestBackendReturnsAfterASuccessfulProbe` |
| After the request was sent, a GET is retried and a POST is not | `TestRetryAfterSendingOnlyForIdempotentRequests` |
| A POST is retried when the connection was refused | `TestPostIsRetriedWhenTheConnectionWasRefused` |
| No healthy back end: 503, and nothing is forwarded | `TestNoHealthyBackendAnswers503` |
| Hop-by-hop headers are removed in both directions, `X-Forwarded-For` is appended | `TestHeadersAreRewrittenForTheNextHop` |

The first version of round robin failed `TestRoundRobinSkipsUnhealthyBackend` with 34 against 66: it started at `counter % size` and skipped dead back ends, so the neighbour of a dead back end received its share too. The comment in `strategy.go` keeps the story.

Linters: `gofmt` and `go vet` run in `go-test`. golangci-lint uses the configuration at the repository root:

```sh
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Benchmark

```sh
docker compose --profile bench run --rm report   # about three minutes, writes results/
docker compose --profile bench down -v
```

k6 keeps 50 virtual users sending `GET /work` for 10 seconds through one proxy at a time: this balancer with round robin, this balancer with least connections, and NGINX with round robin. After one discarded warm-up per proxy, the round of three is repeated five times. `REPETITIONS`, `VUS` and `DURATION_S` change the scenario.

Committed run, on the machine described in [results/benchmark.md](results/benchmark.md). Median of five runs, smallest and largest value in parentheses:

| Proxy | Throughput (requests/s) | p50 latency (ms) | p99 latency (ms) | Failed requests |
| --- | ---: | ---: | ---: | ---: |
| This balancer, round robin | 10584 (7863 to 17198) | 3.08 (2.07 to 3.84) | 22.31 (12.15 to 34.70) | 0 |
| This balancer, least connections | 9405 (7561 to 11521) | 3.19 (2.81 to 4.19) | 28.72 (21.88 to 40.73) | 0 |
| NGINX, round robin | 10129 (9983 to 12968) | 2.60 (1.98 to 2.77) | 26.47 (18.83 to 30.52) | 0 |

How to read it:

- **No difference can be claimed.** The ranges overlap completely. The machine was shared with other workloads while this ran, and k6 competes with the proxies for the same 16 cores. Two earlier runs on the same day gave medians of 6185, 6579 and 9588 requests per second (three repetitions) and then 5586, 4974 and 5461 (five repetitions), in the same order of rows. The spread between runs is larger than any gap between proxies.
- **The order of magnitude is the result.** A few hundred lines of Go on `net/http` forward thousands of requests per second with a p99 of tens of milliseconds, the same range as NGINX in this setup, with no failed request in any run.
- **What it does not show.** The back end does nothing, so this measures the overhead of the proxy with small requests and reused connections. It says nothing about large bodies, TLS, thousands of idle connections, memory, or a quiet machine with the load generator elsewhere, where a tuned NGINX would be expected to do better.

To compare two proxies seriously, run on an idle machine, raise `REPETITIONS`, and treat any difference smaller than the range as noise.
