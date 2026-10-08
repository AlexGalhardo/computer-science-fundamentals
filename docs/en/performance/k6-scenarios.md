# Load test scenarios with k6 (MP-PERF-2)

> Versão em português: [docs/pt/performance/k6-scenarios.md](../../pt/performance/k6-scenarios.md)

Mini-project: [`projects/performance/k6-scenarios`](../../../projects/performance/k6-scenarios/README.md). Quiz topics: `load-test-types`, `k6-fundamentals`, `database-performance`, `capacity-planning-queueing`, `latency-throughput-percentiles`.

## The bottleneck

`GET /products/:id` borrows one connection from a pool, runs a query that takes 20 ms in PostgreSQL, and gives the connection back. The pool has **2 connections**.

```
request -> [ queue for a connection ] -> [ connection 1 ] -> PostgreSQL (20 ms)
                                         [ connection 2 ] -> PostgreSQL (20 ms)
```

By the utilisation law, 2 connections that are each busy for 20 ms per request serve at most 2 / 0.020 s = **100 requests per second**. Below that, a connection is almost always free. Above that, requests arrive faster than they leave and the queue grows for as long as the load lasts. The API waits at most 2 s for a connection and then answers `503` (load shedding), so the queue cannot grow without bound.

Nothing on a dashboard of the usual suspects points at this. The CPU of the API is idle (it is waiting), the database is idle (2 queries at a time is nothing), and every query still takes 20 ms. Only the latency seen by the client tells the story, which is why you need a load test to find it.

The fix is one number: `POOL_SIZE=20`, a capacity of 1,000 requests per second.

## Four shapes, four questions

All four scenarios send the same request. Only the shape of the arrival rate over time differs (`k6/profiles.js`).

| Scenario | Shape | The question | What the small pool shows |
| --- | --- | --- | --- |
| Load | ramp to the normal busy traffic (150 req/s) and hold | Is the service level met at the expected load? | No: the steady phase is above capacity, p95 hits the 2 s waiting limit |
| Stress | steps from 50 to 300 req/s | Where is the limit, and what happens there? | Flat latency at 50 req/s, waiting at 100, collapse from 150 on: the knee |
| Spike | 40, then 500 req/s for 6 s, then 40 again | Does it survive a burst and recover? | The burst is shed with `503`, and the first seconds of the recovery are still slow |
| Soak | 130 req/s, constant | What degrades with time? | The first seconds look acceptable at the median, then the queue reaches the limit and stays there |

A real soak test runs for hours and looks for slow growth: a memory leak, a connection that is never released, a disk filling up. This one is scaled down to a minute, and what it keeps of the idea is the comparison between the first and the last seconds of the same constant load.

## Open model against closed model

The scenarios use the `ramping-arrival-rate` executor. k6 starts a fixed number of iterations per second, whether or not the earlier ones finished. That is an **open model**, and it is how real traffic behaves: people do not stop arriving because the site is slow.

A **closed model** (`ramping-vus`, `constant-vus`) has a fixed number of virtual users, each waiting for its answer before sending again. When the server slows down, the users send less, the load drops, and the test reports a comfortable throughput at a terrible latency. The bottleneck is still visible there, but the test never pushes past the capacity, so there is no knee to see. Coordinated omission is the name of the measurement error this causes.

The price of the open model: every request in flight holds a virtual user, so `maxVUs` must cover rate × worst latency. When k6 runs out of virtual users it does not send the request and counts it in `dropped_iterations`, which the summaries report.

## Thresholds, checks and the exit code

```js
thresholds: {
	http_req_duration: ["p(95)<250"],
	http_req_failed: ["rate<0.01"],
	"http_req_duration{phase:recovery}": ["p(95)<250"],
}
```

- A **threshold** is a pass or fail rule on a metric. When one is crossed, k6 exits with code 99, which is what makes a load test usable in a pipeline.
- A **check** (`check(response, { "status is 200": ... })`) only records a pass rate. A failed check never fails the run by itself.
- A **tag** (`{ tags: { phase } }`) splits a metric. Each phase of each scenario has its own p95, and its own threshold.

## Measured results

The committed summaries are in `results/`: [load](../../../projects/performance/k6-scenarios/results/load.md), [stress](../../../projects/performance/k6-scenarios/results/stress.md), [spike](../../../projects/performance/k6-scenarios/results/spike.md), [soak](../../../projects/performance/k6-scenarios/results/soak.md), with the machine and the versions in [results.md](../../../projects/performance/k6-scenarios/results/results.md).

The stress test of the committed run, before the fix:

| Step | Requests answered | Median | p95 |
| --- | --- | --- | --- |
| 50 req/s | 299 | 21 ms | 24 ms |
| 100 req/s | 575 | 127 ms | 224 ms |
| 150 req/s | 873 | 1736 ms | 2019 ms |
| 200 req/s | 1090 | 2014 ms | 2021 ms |
| 250 req/s | 1376 | 2001 ms | 2020 ms |
| 300 req/s | 1673 | 2001 ms | 2020 ms |

How to read it:

- At 50 req/s the pool is half used and latency is the query time.
- At 100 req/s the arrival rate equals the capacity. The median is already six times the query time, because arrivals are not perfectly regular and any two requests that arrive together must wait. The step is short, so p95 is still under the budget.
- From 150 req/s on, latency sits at the 2 s waiting limit: that is the knee. The latency does not grow further only because the API gives up at 2 s and answers `503`. In the whole run 43% of the requests failed.
- After the fix every step has a p95 of about 21 ms. The same six steps are now at most 30% of the capacity of the pool.

In every scenario the verdict flips: all four cross their thresholds with the pool of 2 (k6 exit code 99) and cross none with the pool of 20 (exit code 0).

## Why not just make the pool huge

A pool is a limit on purpose. Each PostgreSQL connection is a server process with its own memory, and the database has a `max_connections` limit shared by every instance of the application. A pool of 20 on 10 instances already asks for 200 connections. The right size comes from the arithmetic above (arrival rate × holding time, divided by the utilisation you accept), and shortening the time each request holds a connection raises capacity just as much as adding connections.

## Method and limits

- Each scenario ran once before and once after the fix, on a machine shared with other programs. The latencies are noisy. The verdicts are not: every scenario asks for more than the capacity of the small pool and at most 60% of the capacity of the large one (`ts/tests/unit/profiles.test.ts` checks this arithmetic).
- A fresh API process is started for each scenario, so no queue is carried over.
- k6 runs on the same machine as the API, which is fine for a before and after comparison and wrong for absolute capacity numbers.

## Load test rules

k6 runs from the pinned image `grafana/k6:2.3.0` on the internal docker-compose network. No port is published, and `k6/target.js` throws before any request when `BASE_URL` is not `localhost`, `127.0.0.1`, `[::1]` or `api`. `docker compose run --rm k6-refusal-test` proves it for the four scenarios with `https://example.com`. Raw k6 output goes to `k6-results/`, which is git-ignored. Only the Markdown summaries are committed.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-PERF-2.1 the bottleneck is visible as a latency knee in the load test | `./load-test-unix.sh` (or `.ps1`): the report step fails unless the stress scenario has a knee before the fix and none after. The curve is in `results/stress.md`. In miniature, without k6: `ts/tests/integration/pool.test.ts` |
| MP-PERF-2.2 each scenario fails its threshold before the fix and passes after | Same command: the report step fails unless each of the four scenarios crossed a threshold with the small pool and none with the large one |
| MP-PERF-2.3 Markdown summary per scenario committed, raw output git-ignored | `results/load.md`, `stress.md`, `spike.md`, `soak.md`, and `k6-results/` in `.gitignore` |

The plan says "latency knee in the load test". The knee is shown by the stress scenario, whose steps are the latency curve. The load scenario holds one rate, so it shows a point above the knee, not the curve.

## Run

```sh
cd projects/performance/k6-scenarios
./setup-unix-k6-scenarios.sh     # tests
./load-test-unix.sh              # the four scenarios, before and after, and the reports
```
