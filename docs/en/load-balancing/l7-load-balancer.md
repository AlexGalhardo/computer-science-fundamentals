# Hand-written layer 7 load balancer

> Versão em português: [docs/pt/load-balancing/l7-load-balancer.md](../../pt/load-balancing/l7-load-balancer.md)

Mini-project: [projects/load-balancing/l7-load-balancer](../../../projects/load-balancing/l7-load-balancer/README.md) (MP-LB-2). Language: Go.

## The problem

NGINX and Caddy hide the work behind one line of configuration. Writing the balancer by hand shows that the work is short to describe and full of decisions:

```
client ──TCP 1──> balancer ──TCP 2──> back end
                    │
                    ├─ 1. choose a back end          strategy.go
                    ├─ 2. rewrite the headers        proxy.go
                    ├─ 3. forward and copy back      proxy.go
                    ├─ 4. on failure: retry or not   proxy.go
                    └─ meanwhile: who is alive?      health.go
```

It is a **layer 7** balancer because it reads the HTTP request. The client's TCP connection ends at the balancer, and the request travels on a second connection, usually one that is already open and reused. A layer 4 balancer would forward the bytes of one connection without knowing where a request starts or ends.

## 1. Choosing

**Round robin** is one counter: request number `n` goes to usable back end `n mod count`. The detail that matters is what "count" is. Rotating over the whole list and skipping the dead ones looks equivalent and is not: with B down in A, B, C, every turn that lands on B falls through to C, and C receives two thirds. The rotation has to run over the usable back ends.

**Least connections** keeps, per back end, the number of requests sent and not yet finished, and picks the smallest. With requests of equal duration it behaves like round robin. With a back end four times slower it gives that back end about one ninth of the requests instead of one third, because each back end finishes requests at a rate of (requests in flight) / (time per request):

```
fast: 10 in flight / 20 ms = 500 requests/s   (twice)
slow: 10 in flight / 80 ms = 125 requests/s
slow share = 125 / 1125 = 1/9
```

The counter only knows the requests of this balancer. Two balancers in front of the same back ends each see half of the picture, which is why NGINX needs a shared memory `zone` for its workers.

## 2. Rewriting the headers

- **Hop-by-hop headers** (`Connection`, `Keep-Alive`, `Transfer-Encoding`, `Upgrade` and the ones named inside `Connection`) describe one connection. The balancer has two connections, so it removes them in both directions.
- **`X-Forwarded-For`**: the back end sees a connection from the balancer, so the client address travels in this header, each proxy appending the peer it received the request from. A back end may believe it only when the connection comes from a proxy it trusts.

## 3 and 4. Forwarding, and what to do when it fails

A failed attempt raises one question: may the same request be sent to another back end?

| What happened | Did the back end see the request? | Retry |
| --- | --- | --- |
| Connection refused or connect timeout | No | Always, any method |
| Sent, then the connection broke or the answer timed out | Maybe, and maybe it was executed | Only GET, HEAD and OPTIONS |

A POST that may have been executed is answered with 502, because repeating it could create the order twice. This is the same rule as `proxy_next_upstream` without `non_idempotent` in NGINX.

A failed attempt also removes the back end from the rotation at once. That is a **passive health check**: real traffic found the failure.

## Meanwhile: who is alive

The **active health check** asks `GET /health` of every back end at a fixed interval and removes the ones that do not answer 200 in time. The interval is the price of detection: a back end that dies right after a successful probe stays in rotation for up to one interval, times the number of consecutive failures required. Requiring several results in a row before changing the state avoids flapping.

The two checks complete each other. The passive one is immediate and needs traffic. The active one works with no traffic and is the only one that can bring a back end back, because nobody sends requests to a back end that is out.

The acceptance test of the mini-project stops one of three back ends in the middle of 3000 requests: none fails, because requests that hit the dying back end are retried, and the back end is out of rotation at the first failure or the next probe. With no traffic at all, a 100 ms check removed a stopped back end 54 ms after it stopped, in one run of the test.

## The benchmark

k6 sends `GET /work` with 50 virtual users through this balancer and through NGINX, one at a time, five rounds. Committed result ([results/benchmark.md](../../../projects/load-balancing/l7-load-balancer/results/benchmark.md)), median and range:

| Proxy | Throughput (requests/s) | p99 latency (ms) |
| --- | ---: | ---: |
| This balancer, round robin | 10584 (7863 to 17198) | 22.31 (12.15 to 34.70) |
| This balancer, least connections | 9405 (7561 to 11521) | 28.72 (21.88 to 40.73) |
| NGINX, round robin | 10129 (9983 to 12968) | 26.47 (18.83 to 30.52) |

The honest reading is that the ranges overlap and no winner can be named. The machine was shared, the load generator ran on the same cores, and two other runs on the same day had medians between about 5000 and 9600 requests per second. What the table supports is the order of magnitude: forwarding small requests on reused connections costs about the same in both.

### What the hand-written balancer leaves out

Streaming of large bodies (it buffers up to 1 MiB so that a retry can resend the body), TLS, WebSocket upgrades, weights, slow start, connection draining of a removed back end, configuration reload, metrics and access logs. Each one is a reason to use NGINX or Caddy in production, and a reason why their configuration files have so many directives.

## Local targets only

`load/target.js` accepts only `localhost`, `127.0.0.1`, `[::1]` and the three proxies of the compose file, before k6 sends anything. `k6-refusal-test` runs k6 with eight targets that are not local and passes only if every one is refused. The docker network is `internal`.

## Quiz

Topics of the `load-balancing` area that this mini-project demonstrates: `layer-4-vs-layer-7`, `balancing-algorithms`, `health-checks-and-failover` and `reverse-proxy-load-balancer-api-gateway`.
