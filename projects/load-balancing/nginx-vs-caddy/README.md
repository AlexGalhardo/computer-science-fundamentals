# nginx-vs-caddy

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Three identical API instances behind two load balancers, NGINX and Caddy, configured side by side. The lab sends the same traffic through both and answers two questions with numbers:

1. **How does each balancing algorithm distribute requests?** Round robin, weighted round robin, least connections and IP hash, each compared with the share it promises.
2. **What happens when one instance fails during load?** How many requests are lost, how long the clients notice, and how long the instance takes to get traffic again, with the default configuration of each proxy and with a tuned one.

The explanation of the concepts is in [docs/en/load-balancing/nginx-vs-caddy.md](../../../docs/en/load-balancing/nginx-vs-caddy.md).

> **Local only.** The load generator refuses to run when a target is not `localhost` or a service of this docker-compose file. Never point a load test at a host you do not own.

## Quiz topics it demonstrates

- `load-balancing` / `balancing-algorithms`: round robin, weights, least connections with a slow instance, IP hash
- `load-balancing` / `health-checks-and-failover`: passive and active checks, retries, a crash against a freeze
- `load-balancing` / `sticky-sessions`: affinity by client address and its limits
- `load-balancing` / `nginx-configuration`: `upstream`, `weight`, `least_conn`, `ip_hash`, `max_fails`, `fail_timeout`, `proxy_next_upstream`, `proxy_pass`
- `load-balancing` / `caddy-configuration`: `reverse_proxy`, `lb_policy`, `lb_try_duration`, `health_uri`, `fail_duration`
- `load-balancing` / `reverse-proxy-load-balancer-api-gateway`: `X-Forwarded-For` and which proxies to trust
- `load-balancing` / `layer-4-vs-layer-7`: routing by URL path

## Run

The only requirement is Docker.

```sh
./setup-unix-nginx-vs-caddy.sh        # Linux and macOS
./setup-windows-nginx-vs-caddy.ps1    # Windows
```

The script builds the image, runs the unit tests, checks both proxy configurations, brings up both stacks, runs the integration tests through them, checks that the load generator refuses a target that is not local, and removes everything. It takes about two minutes.

## The two stacks

One command brings up the three instances and both proxies, each on its own local port:

```sh
docker compose up -d --wait nginx caddy
curl -i http://127.0.0.1:18480/rr    # NGINX
curl -i http://127.0.0.1:18481/rr    # Caddy
docker compose --profile lab down -v # stop and remove everything
```

Repeat the `curl` and watch the `X-Instance` header change. Set `NGINX_PORT` or `CADDY_PORT` before the first command to use other ports. Both ports are bound to `127.0.0.1` only.

Both proxies publish the same routes, and every route forwards to `GET /work` of an instance:

| Route | NGINX (`nginx/nginx.conf`) | Caddy (`caddy/Caddyfile`) |
| --- | --- | --- |
| `/rr` | `upstream` with no method directive | `lb_policy round_robin` |
| `/wrr` | `weight=3`, `weight=2`, `weight=1` | `lb_policy weighted_round_robin 3 2 1` |
| `/lc` | `least_conn` | `lb_policy least_conn` |
| `/iphash` | `ip_hash` | `lb_policy client_ip_hash` |
| `/tuned` | `max_fails=1 fail_timeout=3s`, 1 s timeouts, `proxy_next_upstream` | `lb_try_duration`, `fail_duration`, `health_uri`, 1 s timeouts |

## Structure

| Path | What it is |
| --- | --- |
| `nginx/nginx.conf`, `caddy/Caddyfile` | The two configurations, with the same routes. Read them side by side |
| `ts/src/api/` | The instance: `GET /work`, `GET /health`, `GET /stats`, and control routes that make it slow, crash or freeze |
| `ts/src/lab/load.ts` | Two load generators: closed loop (fixed concurrency) and open loop (fixed rate) |
| `ts/src/lab/analysis.ts` | Pure functions: shares, expected shares, tolerance, recovery time |
| `ts/src/lab/experiments.ts` | The experiments: what is sent, and what is expected before measuring |
| `ts/src/lab/target.ts`, `config.ts` | The rule that refuses targets that are not local |
| `ts/src/cli.ts` | Runs the experiments and writes `results/` |
| `ts/tests/`, `ts/integration/` | Unit tests (no network) and integration tests (through both proxies) |

The control routes of the instances (`/control/...`) are reachable only on the internal docker network. The proxies forward nothing but the routes of the table.

## Tests

```sh
docker compose run --rm ts-test             # type check and 22 unit tests, no network
docker compose run --rm caddy-config-test   # caddy validate and caddy fmt
docker compose run --rm nginx-config-test   # nginx -t
docker compose run --rm lab-test            # 17 integration tests through both proxies
docker compose run --rm refusal-test        # the lab must refuse https://example.com
docker compose --profile lab down -v
```

| What is tested | Where |
| --- | --- |
| Each algorithm stays within 5 percentage points of its expected shares, on both proxies | `ts/integration/proxies.test.ts` |
| IP hash: 500 of 500 simulated clients always reach the same instance, and NGINX sends a whole /24 network to one instance | same file |
| A crashed instance: NGINX defaults lose nothing, Caddy defaults lose about one request in three, both tuned configurations lose nothing | same file |
| A frozen instance: both tuned configurations lose nothing | same file |
| The control routes are not reachable through the proxies | same file |
| Shares, tolerance, stickiness, recovery time, median and spread | `ts/tests/analysis.test.ts` |
| The instance: routes, validation of control input, slow, crash and freeze, with no socket | `ts/tests/app.test.ts` |
| The local-target rule accepts loopback and service names and refuses lookalikes such as `http://localhost@example.com` | `ts/tests/target.test.ts` |
| The lab exits with an error and sends nothing when a target is not local | `ts/scripts/refusal-test.sh` |

Linter and formatter: Biome with the configuration at the repository root, and `caddy fmt` for the Caddyfile.

```sh
bunx biome check projects/load-balancing/nginx-vs-caddy
```

## Experiments

```sh
docker compose --profile lab run --rm lab    # about six minutes, writes results/
docker compose --profile lab down -v
```

It writes [results/distribution.md](results/distribution.md) and [results/failure.md](results/failure.md), with the machine, the image versions and the method. Set `REPETITIONS` to change the number of runs of each case (3 by default).

### Distribution

3000 requests per run, 30 in flight, three runs per case. Share of each instance (median):

| Algorithm | Expected | NGINX | Caddy |
| --- | --- | --- | --- |
| Round robin | 33.3 / 33.3 / 33.3 | 33.3 / 33.3 / 33.3 | 33.3 / 33.3 / 33.3 |
| Weighted round robin (3, 2, 1) | 50.0 / 33.3 / 16.7 | 50.0 / 33.3 / 16.7 | 50.0 / 33.3 / 16.7 |
| Least connections, `api-3` four times slower | 44.4 / 44.4 / 11.1 | 44.0 / 43.9 / 12.0 | 43.9 / 43.9 / 12.3 |
| IP hash, 500 clients | 33.3 / 33.3 / 33.3 | 33.4 / 33.2 / 33.4 | 31.4 / 33.2 / 35.4 |

Every case is within 5 percentage points of the expected share (the worst is 2.1 points), which is the acceptance criterion of the mini-project.

- Round robin is exact: it counts requests and nothing else.
- Least connections is where the algorithm sees the load. `api-3` answers in 40 ms and the others in 10 ms. With the same number of requests in flight on each, an instance finishes requests at a rate proportional to 1/time, so the shares are 4 : 4 : 1 and the slow instance serves about one ninth. Round robin would keep giving it one third.
- IP hash is sticky (500 of 500 clients always reached the same instance) and only roughly even: it depends on how the client addresses happen to hash. The numbers repeat exactly from run to run because the hash is deterministic.

### One instance fails during load

100 requests per second for 14 s. At 2 s `api-3` fails for 4 s. Three runs per case, median shown:

| Failure | Proxy | Configuration | Errors | Slow (over 250 ms) | Recovery time | Back in rotation after its return |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| crash | NGINX | default | 0 | 0 | 0 ms | 6980 ms |
| crash | NGINX | tuned | 0 | 0 | 0 ms | 3980 ms |
| crash | Caddy | default | 133 | 0 | 4000 ms | 30 ms |
| crash | Caddy | tuned | 0 | 0 | 0 ms | 691 ms |
| freeze | NGINX | default | 33 | 92 | 3740 ms | 10 ms |
| freeze | NGINX | tuned | 0 | 34 | 999 ms | 1900 ms |
| freeze | Caddy | default | 34 | 92 | 3740 ms | 20 ms |
| freeze | Caddy | tuned | 0 | 34 | 1007 ms | 1018 ms |

What the table shows:

- **The defaults differ.** When a connection is refused, NGINX passes the request to the next server and skips the failed one for 10 s (`proxy_next_upstream error timeout`, `max_fails=1`, `fail_timeout=10s`), so a crash costs nothing. Caddy, with only `lb_policy`, has no retry and no health check: it keeps choosing the dead instance, and one request in three fails (133 of the 400 sent during the 4 s) until the instance returns.
- **A freeze is worse than a crash.** A refused connection is an immediate answer. A frozen process accepts the connection and says nothing, and only a timeout reveals it. With the default timeouts (60 s in NGINX, none in Caddy) neither proxy notices within the 4 s: the requests sent in the first second are abandoned by the client after 3 s, and the rest come back late.
- **Tuning is timeouts plus retries plus health checks.** With 1 s timeouts both proxies lose nothing. The 34 slow requests are the ones that found the failure during the first second, each one waiting for the timeout before being repeated on another instance.
- **Passive against active.** NGINX open source only has passive checks: a real request discovers the failure, and a real request tries the server again after `fail_timeout`. That is why the instance takes seconds to get traffic again. Caddy's active check asks `/health` every second on its own.
- **Removing fast and returning fast are a trade.** A proxy that never removes the instance (Caddy default) sends it traffic the instant it returns, and also during the whole failure.

The counts are identical or within one request across the three runs, and times vary by about 10 ms, because this experiment depends on timeouts and not on speed. The machine was shared with other workloads. Throughput is not measured here.

### What "stopped" means here

The acceptance criterion says "one instance stopped during load". The instance stops itself on command (`POST /control/outage` on the internal network): for a crash it closes its listening socket and every open connection, which is what a proxy sees when the process dies while the host stays up. This keeps the experiment inside one `docker compose run`, repeatable and timed to the millisecond, with no access to the Docker socket. Stopping the container (`docker compose stop api-3`) is a third case, not measured here: the address itself can stop answering, and then a connection attempt waits for the connect timeout instead of being refused at once.
