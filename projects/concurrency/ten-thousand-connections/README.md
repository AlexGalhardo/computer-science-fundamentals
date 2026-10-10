# ten-thousand-connections

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

The same small HTTP server written three times: on an event loop (TypeScript on Bun), with one goroutine per connection (Go) and with one BEAM process per connection (Elixir). A local k6 scenario then opens 10,000 connections against each one, keeps them open and idle for 30 seconds, and measures how much memory each connection costs and whether the server still answers quickly meanwhile.

The lesson: a waiting connection does not need a thread. The three runtimes reach that result in three different ways, explained in [docs/en/concurrency/ten-thousand-connections.md](../../../docs/en/concurrency/ten-thousand-connections.md).

> **Local only.** The load script refuses to run when the target is not `localhost` or one of the three services of this docker-compose file. Never point a load test at a host you do not own.

## Quiz topics it demonstrates

- `concurrency` / `async-and-event-loop`: one thread serving thousands of idle connections
- `concurrency` / `actor-model-and-beam`: one cheap BEAM process per connection
- `concurrency` / `concurrency-vs-parallelism`: goroutines and processes against operating-system threads

## Run

The only requirement is Docker.

```sh
./setup-unix-ten-thousand-connections.sh        # Linux and macOS
./setup-windows-ten-thousand-connections.ps1    # Windows
```

The script builds the images, runs the unit tests of each language, runs the protocol suite against the three servers and checks that k6 refuses a target that is not local. It takes about a minute.

## Structure

| Path | What it is |
| --- | --- |
| `ts/` | Server on `Bun.serve`: one thread, an event loop, `await Bun.sleep(ms)` |
| `go/` | Server on `net/http`: one goroutine per connection, `time.After(ms)` |
| `elixir/` | Server written on `:gen_tcp` with no library: one process per connection, `Process.sleep(ms)` |
| `protocol/` | One protocol test suite, run against the three servers |
| `load/hold.js` | The k6 scenario |
| `load/target.js` | The rule that refuses targets that are not local |
| `load/report.ts` | Turns the three k6 summaries into `results/results.md` |

The three servers have no dependency and speak the same protocol on port 8080:

| Route | Answer |
| --- | --- |
| `GET /health` | `200`, body `ok` |
| `POST /echo` | `200`, the same body and the same `Content-Type` |
| `GET /delay?ms=N` | waits `N` milliseconds (0 to 60000), then `200` with `{"waitedMs":N}`. Anything else is `400` |
| `GET /stats` | `200` with `{"runtime", "inFlight", "rssKb"}`: requests being handled now and resident memory of the process |
| other path, other method | `404`, `405` |

Everything runs on a docker network marked `internal`, with no route to the outside and no port published to the host.

## Tests

```sh
docker compose run --rm ts-test          # unit tests, also: go-test, elixir-test
docker compose run --rm protocol-test    # the same 8 tests against each of the 3 servers
docker compose run --rm k6-refusal-test  # k6 must refuse https://example.com
docker compose --profile load down       # stops the servers
```

| What is tested | Where |
| --- | --- |
| The three servers answer the same protocol: 24 tests, 8 per server | `protocol/protocol.test.ts` |
| 300 requests that wait 500 ms each are served at the same time, on every server | same file |
| Routes, input validation and overlapping delays, without a socket | `ts/tests/app.test.ts`, `go/server_test.go`, `elixir/test/` |
| The local-target rule accepts loopback and the three service names, and refuses lookalikes such as `http://localhost@example.com` | `ts/tests/target.test.ts` |
| k6 exits with an error and opens no connection when `TARGET` is not local | `load/refusal-test.sh` |

Formatters and linters: `gofmt` and `go vet` run in `go-test`, `mix format --check-formatted` runs in `elixir-test`. Biome and golangci-lint use the configuration at the repository root:

```sh
bunx biome check projects/concurrency/ten-thousand-connections
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Load test

```sh
docker compose --profile load down               # fresh servers, so the idle memory is a real baseline
docker compose --profile load run --rm report    # ts, then go, then elixir, then the table
docker compose --profile load down               # stops the servers
```

The second command runs k6 against one server at a time and writes [results/results.md](results/results.md). It takes about two and a half minutes. On a small machine, lower the number by setting the `CONNECTIONS` environment variable first, for example `CONNECTIONS=2000 docker compose --profile load run --rm report` in a Unix shell.

The timeline of one run:

```text
0s          10s                                  40s
hold  |-- 10,000 connections open, 500 at a time, each stays open for 30 s --|
echo            |-- 50 POST /echo per second for 12 s, latency recorded --|
probe                     | GET /stats: requests in flight and memory |
```

k6 holds the 10,000 connections with 20 virtual users that open 500 connections each (`http.batch`). Ten thousand virtual users would need more memory than the servers under test.

## Results

Measured on the machine described in [results/results.md](results/results.md), 10,000 connections asked and 10,000 held by every server:

| Server | Idle memory (MiB) | Memory while holding (MiB) | Memory per connection (KiB) | echo p50 (ms) | echo p95 (ms) | echo p99 (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ts (Bun, event loop) | 18.9 | 58.6 | 4.1 | 0.49 | 3.53 | 11.07 |
| go (goroutines) | 7.9 | 167.1 | 16.3 | 0.53 | 3.82 | 10.57 |
| elixir (BEAM processes) | 86.1 | 182.7 | 9.9 | 0.56 | 2.57 | 6.24 |

What the table shows:

- Every model holds 10,000 idle connections with a few kibibytes each. For comparison, Linux typically reserves 8 MiB of address space for the stack of each operating-system thread by default, and a blocked thread still has to be scheduled by the kernel.
- The event loop is the cheapest per connection: a waiting request is a socket, a timer and a promise, with no stack at all. A goroutine keeps a stack (it starts at a few kibibytes) and `net/http` keeps read and write buffers per connection. A BEAM process keeps its own small heap and stack.
- The latency of new requests stays below a millisecond at the median with 10,000 connections open. Idle connections cost memory, not processor time.
- The BEAM starts with the largest idle memory: the virtual machine itself is the fixed cost.

What it does **not** show: this workload only waits. With processor-heavy work in the handler the picture changes, because one busy callback blocks the whole event loop, while Go and the BEAM spread work over all cores and preempt long-running code.

Read the numbers as orders of magnitude. Memory was the same in two consecutive runs (within 2 MiB). Latency was not: in the first run, with other containers busy on the machine, the Go server showed a p95 of 238 ms and a p99 of 361 ms, and in the second run, the one committed, 3.82 ms and 10.57 ms.
