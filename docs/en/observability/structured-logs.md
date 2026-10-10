# Structured logs and correlation id (MP-OBS-2)

> Versão em português: [docs/pt/observability/structured-logs.md](../../pt/observability/structured-logs.md) · Versión en español: [docs/es/observability/structured-logs.md](../../es/observability/structured-logs.md)

Mini-project: [`projects/observability/structured-logs`](../../../projects/observability/structured-logs/README.md). Quiz topics: `structured-logs`, `three-signals`, `distributed-tracing`, `prometheus-grafana-loki-tempo`.

## The problem

A checkout passes through three services: `api` receives it, `orders` creates the order, and `worker` picks it from a queue and sends the confirmation. Each service writes its own log, and at any moment dozens of requests are in flight, so their lines are interleaved. When one customer complains, the question is simple, "what happened to this request?", and the logs must answer it.

## 1. Free text: written for people

```text
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 2 x blue-pen
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
```

Each line is a sentence that made sense to whoever typed it. Three problems follow:

- **No common key.** The first line has no order id (it does not exist yet), the last one forgot it. A search by order id finds 3 of the 6 lines of the request.
- **The remaining keys are ambiguous.** The customer name reaches the other lines, but Alice bought twice, and the lines of both purchases come back mixed.
- **Every question needs a new regex.** "Requests slower than 500 ms" means extracting a number from the middle of a sentence, with a pattern that breaks when someone rewords it.

## 2. Structured: written for machines

```json
{"order_id":"ord-1244c436","status":201,"duration_ms":4,"timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"api","message":"checkout answered","correlation_id":"req-json-1-9ef19148"}
```

One JSON object per line. The rules used in the lab:

- **Fixed keys in every line**: `timestamp` (UTC, ISO 8601, so lines of machines in different time zones sort as plain text), `level`, `service`, `message`, `correlation_id`.
- **`message` is a constant name of the event**, never a sentence with values inside. The values go in fields: `order_id`, `duration_ms`, `status`.
- **One field, one meaning, one type** across services: `duration_ms` is always a number of milliseconds.
- **No secrets and no personal data.** A log is copied, indexed and kept for a long time.

Now a question is a filter on a field, and it keeps working when the wording of a message changes.

## 3. The correlation id

A correlation id is one value shared by everything a request causes.

```ts
const correlationId = correlationIdFrom(request.headers.get("x-correlation-id"));
return runWithCorrelation(correlationId, async () => {
	const response = await handler();
	response.headers.set("x-correlation-id", correlationId);
	return response;
});
```

- It is **created at the edge**, or accepted from the caller when it is valid, so a chain that started upstream continues.
- It is **validated** (`^[A-Za-z0-9._-]{8,64}$`). The value comes from outside: a line break in it would forge a log line (log injection), and a quote would change a query built with it.
- It is **returned in the response header**, so the caller can quote it in a bug report.

### Carrying it inside the process

Passing the id as a parameter to every function does not scale. `AsyncLocalStorage` is a variable bound to one chain of asynchronous calls: any code reached through `await` reads the id of its own request, even while other requests run interleaved on the same thread. The logger reads it there, so the code that logs never mentions the id.

### Carrying it between processes

The id must leave the process with the work, and each transport has its place for metadata:

| Hop | Where the id travels |
| --- | --- |
| `api` -> `orders` (HTTP) | the `X-Correlation-Id` request header |
| `orders` -> `worker` (RabbitMQ) | the `correlationId` property of the AMQP message |

```ts
channel.sendToQueue(queue, body, { correlationId: currentCorrelationId() });
// ... later, in another process:
const correlationId = correlationIdFrom(message.properties.correlationId);
runWithCorrelation(correlationId, () => handler(payload));
```

The queue is where trails usually break: the worker runs later, in another process, with no HTTP request to read a header from. If the publisher does not attach the id, or the consumer does not restore it, the lines of the worker belong to no request.

## 4. Finding the request: LogQL

Loki indexes only the **labels** of a stream, not the content of the lines. A query first selects streams by label and then filters their lines:

```logql
{format="json"} | json | correlation_id="req-json-1-9ef19148"
```

| Part | What it does |
| --- | --- |
| `{format="json"}` | stream selector: uses the index |
| `\| json` | parses each line and turns its keys into fields |
| `correlation_id="..."` | keeps the lines whose field has that value |

On free text the best tool is the line filter, which keeps the lines containing a substring:

```logql
{format="text"} |= "ord-1ed68350"
```

The end-to-end test sends four concurrent checkouts to each variant and checks both: the JSON query returns the 6 lines of one request, from the three services, and no line of another request; the text search returns 3 of 6.

### Why the id is not a label

Every distinct combination of label values is a separate stream, with its own entry in the index and its own chunks. A label must therefore have few possible values: `service`, `format`, an environment. A correlation id has one value per request: as a label it would create millions of tiny streams and make Loki slow and expensive. High-cardinality values stay in the line and are filtered at query time.

## 5. How the lines reach Loki

In the lab each service has a small shipper that batches its lines and sends them to `POST /loki/api/v1/push`, retrying while Loki is starting. That keeps the lab to one image. In production the service only writes to stdout, and an agent outside it (Grafana Alloy, the OpenTelemetry Collector) tails the output and ships it, so a slow log store cannot slow down the application.

## What a correlation id is not

It groups lines; it does not say which step called which, or how long each one took. That structure (parent and child spans, with durations) is a **trace**, and the id that plays this role there is the trace id, propagated in the W3C `traceparent` header. See [three-signals](three-signals.md), where log lines carry the trace id and one click goes from a line to its trace.

## Run it

```sh
cd projects/observability/structured-logs
./setup-unix-structured-logs.sh     # or ./setup-windows-structured-logs.ps1
docker compose run --rm demo        # the same search on both variants
docker compose down -v
```
