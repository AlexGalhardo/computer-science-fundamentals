# Bun against Node (MP-PERF-1)

> Versão em português: [docs/pt/performance/bun-vs-node.md](../../pt/performance/bun-vs-node.md) · Versión en español: [docs/es/performance/bun-vs-node.md](../../es/performance/bun-vs-node.md)

Mini-project: [`projects/performance/bun-vs-node`](../../../projects/performance/bun-vs-node/README.md). Quiz topics: `runtime-performance`, `latency-throughput-percentiles`, `benchmarking-methodology`, `k6-fundamentals`, `capacity-planning-queueing`.

## The question

"Which is faster, Bun or Node?" has no single answer, because two different things decide the throughput of a server:

1. **The runtime**: how fast the engine runs your JavaScript (JavaScriptCore in Bun, V8 in Node.js) and how much its HTTP server costs per request.
2. **The process model**: how many processes run your code. JavaScript runs on one thread per process, so one process uses one core for your code, however many cores the machine has.

The mini-project separates the two. The API is written once (`ts/src/app.ts`) and served three ways:

| Setup | Runtime | Processes |
| --- | --- | --- |
| `bun` | Bun, `Bun.serve` | 1 |
| `node` | Node.js, `node:http` | 1 |
| `node-pm2` | Node.js, `node:http` | 4 workers under PM2 cluster mode |

Every container has the same CPU limit (4 CPUs), so `bun` against `node` compares runtimes, and `node` against `node-pm2` compares process models with the runtime held constant.

## CPU-bound and I/O-bound

```text
CPU-bound request (GET /cpu)           I/O-bound request (GET /io)

event loop: [count primes........]     event loop: [start timer][free.........][answer]
            nobody else runs here                   other requests run here
```

- `GET /cpu` counts primes. The event loop is busy for the whole request, so requests are served strictly one after the other in each process. With 32 clients waiting, a request spends most of its time in line.
- `GET /io` waits 20 ms on a timer, which stands for a query sent to a database. While it waits, the event loop is free, so one process holds thousands of these at once.

The unit test "CPU-bound work blocks the event loop" shows the first case with no server at all: a timer due in 1 ms only fires after the prime count ends.

## What cluster mode does

`pm2-runtime start ecosystem.config.cjs` starts four copies of the same server through the `cluster` module of Node.js. The primary process owns the listening socket and hands each new **connection** to a worker. Consequences:

- CPU-bound throughput grows with the number of workers, up to the number of cores available.
- I/O-bound throughput barely changes: one event loop was not the limit.
- Workers share no memory. Each one has its own heap, so memory grows with the number of workers, and anything kept in process memory (sessions, caches, counters) is different in each worker.
- A keep-alive connection stays on the worker that accepted it. The API test sends `Connection: close` to see more than one process id.

## Measured results

The committed table is in the [README](../../../projects/performance/bun-vs-node/README.md#results) and in `results/results.md`, with the machine and the versions. In the committed run (median of 3 rounds, lowest to highest in parentheses):

| Setup | CPU-bound requests/s | CPU-bound p95 | I/O-bound requests/s | Peak memory |
| --- | --- | --- | --- | --- |
| `bun` | 84 (67 to 84) | 409 ms | 9084 (5259 to 9515) | 39 MiB |
| `node` | 71 (61 to 73) | 656 ms | 8205 (6189 to 8486) | 95 MiB |
| `node-pm2` | 249 (240 to 259) | 225 ms | 9226 (8537 to 9274) | 193 MiB |

How to read it without fooling yourself:

- **Process model, CPU-bound**: four workers served about 3.5 times the requests of one Node.js process (249 against 71), and p95 fell from 656 ms to 225 ms. Not 4 times: the primary process, the HTTP work and k6 also need CPU, and the machine was shared.
- **Process model, I/O-bound**: all three are near the same ceiling. 200 virtual users each waiting 20 ms cannot send more than 200 / 0.020 = 10,000 requests per second, whatever the server. The ranges overlap, so there is no difference to report. Adding workers buys nothing when the processor is not the bottleneck.
- **Runtime, CPU-bound**: Bun served more requests than one Node.js process in this workload (84 against 71), and the ranges (67 to 84, 61 to 73) overlap. That is a small difference in one tight loop on one machine, not a law about the two runtimes.
- **Memory**: the cluster used about twice the memory of one Node.js process (193 MiB against 95 MiB) for the PM2 daemon and four heaps. Bun used the least. Throughput bought with processes is paid in memory.
- **p95 follows the queue**: on `/cpu` the p95 is roughly the number of clients divided by the throughput (32 / 84 ≈ 0.38 s on Bun), because every request waits for the ones ahead of it. That is the closed-model form of Little's law.

## Method

- One setup runs at a time, in a fresh container for every round, with the same CPU limit.
- A warm-up phase runs before the measurement and is not counted, so the JIT compiler and the connections are ready.
- Three rounds per setup, reported as median with the range. The machine was running other work, and the ranges show it (one Bun I/O round fell to 5259 requests/s).
- k6 runs on the same machine as the server and competes for its CPU. That is fine for comparing the setups with each other and wrong for absolute numbers.
- The run fails when any request fails (`checks` threshold), because a server that answers errors quickly looks fast.

## Load test rules

k6 runs from the pinned image `grafana/k6:2.3.0` on the internal docker-compose network. No port is published, and `load/target.js` throws before any request when `BASE_URL` is not `localhost`, `127.0.0.1`, `[::1]` or one of the three services. `docker compose run --rm k6-refusal-test` proves it with `https://example.com`. Raw k6 output goes to `k6-results/`, which is git-ignored.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-PERF-1.1 same API on Bun, Node, and Node with PM2 cluster: one suite passes against the three | `docker compose run --rm api-test` (`ts/tests/api/api.test.ts`, 7 tests per setup) |
| MP-PERF-1.2 local k6 scenario with a CPU-bound and an I/O-bound endpoint, refusing non-local targets | `docker compose run --rm k6-refusal-test` and `ts/tests/unit/target.test.ts` |
| MP-PERF-1.3 table of requests per second, p95 latency and memory for each setup | `./load-test-unix.sh` (or `.ps1`), which writes `results/results.md` |

## Run

```sh
cd projects/performance/bun-vs-node
./setup-unix-bun-vs-node.sh     # tests
./load-test-unix.sh             # k6 and the results table
```
