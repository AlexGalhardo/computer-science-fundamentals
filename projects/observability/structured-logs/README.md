# structured-logs

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How do you follow **one request** through three services when their logs are mixed with the logs of every other request? This mini-project runs the same system twice: once writing **structured JSON logs with a correlation id**, once writing **free text**. A request enters `api`, goes to `orders` over HTTP and reaches `worker` through a RabbitMQ queue. All lines go to Loki, and then the same question is asked of both variants: "show me every log line of this request".

Code: MP-OBS-2. Full explanation: [docs/en/observability/structured-logs.md](../../../docs/en/observability/structured-logs.md).

```text
client --X-Correlation-Id--> api --X-Correlation-Id--> orders --AMQP correlationId--> [queue] --> worker
                              |                          |                                          |
                              +--------------------------+------- log lines --> Loki <--------------+
```

## The same search on both variants

Real output of `docker compose run --rm demo`, committed in [results/results.md](results/results.md). Both variants received the same 4 concurrent checkouts, and each request wrote 6 lines (2 in each service). The question: every line of the first request (alice, 2 x blue-pen).

**Structured (JSON), by correlation id: 6 of 6 lines, from the three services.**

```logql
{format="json"} | json | correlation_id="req-json-1-9ef19148"
```

```text
{"customer":"alice","sku":"blue-pen","qty":2,"timestamp":"2026-10-08T01:40:47.437Z","level":"info","service":"api","message":"checkout received","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","customer":"alice","sku":"blue-pen","qty":2,"timestamp":"2026-10-08T01:40:47.439Z","level":"info","service":"orders","message":"order created","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","queue":"orders.json","timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"orders","message":"order queued","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"worker","message":"order picked up","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","status":201,"duration_ms":4,"timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"api","message":"checkout answered","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","customer":"alice","duration_ms":6,"timestamp":"2026-10-08T01:40:47.447Z","level":"info","service":"worker","message":"confirmation sent","correlation_id":"req-json-1-9ef19148"}
```

**Unstructured (text), by order id, the only id the sentences have: 3 of 6 lines.** The entry point (`api`) and the last step of the worker never wrote the order id, so they are not found.

```logql
{format="text"} |= "ord-1ed68350"
```

```text
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [orders] order ord-1ed68350 sent to queue
2026-10-08 01:40:47 INFO [worker] Processing ord-1ed68350
```

**Unstructured (text), by customer name, to reach the missing sentences: 6 lines of 2 different requests.** Alice bought twice, and nothing in the lines says which is which.

```logql
{format="text"} |= "alice"
```

```text
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 1 x red-pen
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 2 x blue-pen
2026-10-08 01:40:47 INFO [orders] Created order ord-60eb4168 (alice, 1 x red-pen)
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
```

| | Structured JSON | Free text |
| --- | --- | --- |
| Query | `\| json \| correlation_id="..."` | `\|= "substring"` |
| Lines of the request found | 6 of 6 | 3 of 6 by order id |
| Lines of other requests | none | mixed in when searching by customer |
| Crosses the queue | yes, the worker lines carry the id | only where a sentence repeats the order id |
| Other questions (`duration_ms > 500`, `level="error"`) | a field filter | a new regex per sentence |

## What it teaches

- A **structured log** is one JSON object per line: fixed keys (`timestamp` in UTC ISO 8601, `level`, `service`, `message`) plus one field per value. A machine filters it by field; free text needs a fragile regex per sentence.
- A **correlation id** is created at the edge (or accepted from the caller when valid), written in every line, and returned in the response header.
- **Propagation**: over HTTP in the `X-Correlation-Id` header, and through the queue in the AMQP message property `correlationId`. If one hop forgets it, the trail ends there.
- **`AsyncLocalStorage`** keeps the id of the current request across `await`, so the logger adds it without every function receiving it as a parameter.
- **Loki labels are for low cardinality** (`service`, `format`). The correlation id stays inside the line: as a label it would create one stream per request.
- The id comes from outside, so it is **validated** before it reaches a log line or a query (log injection).

## Quiz topics it demonstrates

- `observability` / `structured-logs`: JSON against free text, correlation id, log fields, what goes in a Loki label, LogQL filters
- `observability` / `three-signals`: what logs are good at (the detail of one request) and what they cost
- `observability` / `distributed-tracing`: context propagation through HTTP headers and through a message queue
- `observability` / `prometheus-grafana-loki-tempo`: Loki indexes labels only; LogQL stream selector, line filter and `| json`

## Run

The only requirement is Docker.

```sh
./setup-unix-structured-logs.sh        # Linux and macOS
./setup-windows-structured-logs.ps1    # Windows
```

The script builds the image, runs the unit tests with no network, starts both variants of the three services with the broker and Loki on an internal network, runs the end-to-end test, and removes everything at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Sends the four checkouts to both variants, prints the three searches above and rewrites `results/results.md`.

## Tests

```sh
docker compose run --rm ts-test     # type check + 18 unit tests, no network
docker compose run --rm e2e-test    # 7 end-to-end tests against the running stack
docker compose down -v
```

- Unit: the two formats, validation and generation of the id, `AsyncLocalStorage` keeping interleaved requests apart, the id crossing a fake queue, the Loki push body, query building.
- End to end (MP-OBS-2.1): four concurrent requests per variant; **one LogQL query** returns the 6 lines of one request, from the three services, and no line of another request. For contrast, the text search by order id finds 3 of 6 lines and the search by customer mixes two requests.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/correlation.ts` | Validation and generation of the id, and the `AsyncLocalStorage` that carries it |
| `ts/src/logger.ts` | One logger, two formats: `formatJson` and `formatText` |
| `ts/src/shipper.ts` | Batches the lines and pushes them to Loki (`POST /loki/api/v1/push`) |
| `ts/src/broker.ts` | RabbitMQ: the id travels in the `correlationId` message property |
| `ts/src/apps.ts` | The three services as functions: `apiApp`, `ordersApp`, `workerHandler` |
| `ts/src/api.ts`, `orders.ts`, `worker.ts`, `runtime.ts` | Entry points and shared start-up |
| `ts/src/lab.ts`, `ts/src/demo.ts` | The scenario, the Loki query client and the demo |
| `ts/tests/` | `unit.test.ts` and `e2e.test.ts` |
| `config/loki.yaml` | Loki in a single process, usage reporting disabled |
| `docker-compose.yml` | Both variants, broker and Loki on an internal network, no published port |

## Pinned versions

| What | Version |
| --- | --- |
| `oven/bun` | 1.4.2 |
| `grafana/loki` | 3.7.8 |
| `rabbitmq` | 4.3.6-alpine |
| `amqplib` / `@types/amqplib` | 2.2.0 / 0.10.8 |
| `zod` | 4.6.5 |
| `typescript` / `@types/bun` | 7.0.2 / 1.4.2 |

All of them are in the stack of the repository; no other dependency was added.

## Limits of the lab

- The shipper lives inside the process to keep the lab small. In production the service writes to stdout and an agent (Grafana Alloy, the OpenTelemetry Collector) tails and ships it.
- A correlation id links log lines. It does not record parent and child, or durations per step: that is what a trace does (see [three-signals](../three-signals/README.md)).
- Everything is local: internal network, no published port, usage reporting disabled in Loki, fake credentials.
