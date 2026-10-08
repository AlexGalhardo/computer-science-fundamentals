# Three signals: one slow request (MP-OBS-1)

> Versão em português: [docs/pt/observability/three-signals.md](../../pt/observability/three-signals.md)

Mini-project: [`projects/observability/three-signals`](../../../projects/observability/three-signals/README.md). Quiz topics: `three-signals`, `distributed-tracing`, `opentelemetry`, `metric-types-cardinality`, `red-use-golden-signals`, `prometheus-grafana-loki-tempo`.

## The problem

A checkout goes through three services: `gateway`, `orders` and `inventory`. Most requests take 10 ms. A few take 800 ms. The services are healthy, nothing crashed, no error is returned. Which of the three is slow, and why only sometimes?

Each signal answers a part of that, and none answers all of it.

| Signal | What it is | Good at | Bad at |
| --- | --- | --- | --- |
| Metric | A number aggregated over time, per label set | Cheap, always on, trends and alerts | Detail: it cannot name one request |
| Trace | The tree of operations of one request | Where the time went, across services | Cost: one per request, usually sampled |
| Log | A timestamped record of one event | The reason, in words and fields | Finding the right lines among millions |

## 1. One Resource, three pipelines

OpenTelemetry separates the **API** (what the code calls: start a span, record a value, emit a log) from the **SDK** (what happens to the data). The SDK has the same shape for each signal:

```
provider -> instrument (tracer, meter, logger) -> processor or reader (batch) -> exporter (OTLP)
```

```ts
const resource = resourceFromAttributes({ "service.name": serviceName });
const tracerProvider = new BasicTracerProvider({ resource, spanProcessors: [...] });
const meterProvider = new MeterProvider({ resource, readers: [...] });
const loggerProvider = new LoggerProvider({ resource, processors: [...] });
```

The **Resource** says who produced the telemetry. Because the three providers share it, a span, a metric and a log line of the same service carry the same `service.name`, and a back end can put them side by side.

The services know one address only, `OTEL_EXPORTER_OTLP_ENDPOINT`, which is the **Collector**. The Collector has one pipeline per signal and forwards each to its store:

```yaml
service:
  pipelines:
    traces:  { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_grpc/tempo] }
    metrics: { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_http/prometheus] }
    logs:    { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_http/loki] }
```

Replacing Tempo by another trace store changes this file and no line of application code.

## 2. Context propagation: how three processes make one trace

A trace is a set of spans with the same **trace id**. Each span has its own **span id** and the id of its parent. Inside a process the SDK keeps the active span in a context (in Bun and Node.js, `AsyncLocalStorage`; in Go, `context.Context`). Between processes the context has to travel in the request, and the W3C Trace Context standard says how:

```
traceparent: 00-db9972d963f729b4d44e6b5848cfa283-3f1c2a9b7d4e5f60-01
             |  |                                |                |
             |  trace id (32 hex)                parent span id   flags (01 = sampled)
             version
```

The client side **injects** the header, the server side **extracts** it:

```ts
// client: a CLIENT span, then its context goes into the headers
propagation.inject(context.active(), headers);

// server: the new SERVER span becomes a child of the caller's span
const parent = propagation.extract(context.active(), Object.fromEntries(request.headers));
tracer.startActiveSpan("POST /orders", { kind: SpanKind.SERVER }, parent, async (span) => { ... });
```

```go
ctx := propagator.Extract(r.Context(), propagation.HeaderCarrier(r.Header))
ctx, span := tracer.Start(ctx, "GET /stock/{sku}", trace.WithSpanKind(trace.SpanKindServer))
```

`orders` is TypeScript and `inventory` is Go. They share no code, only the header format, and the trace continues. If one service did not propagate the header, the next one would start a new trace and the request would be split in two.

## 3. Reading the trace: duration against self time

```text
span                                         start ms   dur ms  self ms
gateway: GET /checkout                            0.0    805.0      0.4
  gateway: POST orders                            0.0    804.6      0.5
    orders: POST /orders                          1.0    804.1      0.3
      orders: orders.price                        1.0      0.0      0.0
      orders: GET inventory                       1.0    803.7      3.1
        inventory: GET /stock/{sku}               1.4    800.6      0.1
          inventory: warehouse.lookup             1.5    800.5    800.5
```

A parent span contains its children, so every ancestor of a slow span is slow too. Sorting by duration points at the root, which is always the longest. **Self time** is the duration of a span minus the duration of its direct children, and it points at the span that actually spent the time: `warehouse.lookup`, 800.5 ms of 805.

The span also carries attributes: `warehouse.sku = slow-widget` and `warehouse.scan = full`. That is the high-cardinality detail that a metric cannot hold.

## 4. Why the metric has no SKU

```ts
telemetry.requestDuration.record(seconds, {
	"http.request.method": request.method,
	"http.route": route,                    // "/stock/{sku}", the template, not "/stock/slow-widget"
	"http.response.status_code": status,
});
```

In a time series database, every distinct combination of label values is a separate series. A label with the SKU would create one series per product, and a label with the order id one per request. So the metric keeps only attributes with few values, and it is a **histogram**: instead of storing each duration, it counts how many requests fell under each bucket limit (`0.005 ... 0.5, 1, 2.5, 5` seconds). From the buckets Prometheus estimates a percentile:

```promql
histogram_quantile(0.99, sum by (le, service_name) (rate(http_server_request_duration_seconds_bucket[5m])))
```

The answer in the lab is about 0.94 s for the three services. It is an estimate inside the bucket (0.5, 1], not the exact 0.8 s: the precision of a histogram is the width of its buckets. The same histogram gives the rate (its `_count`) and the error share (the `http_response_status_code` label), which is the RED method on one instrument.

## 5. The log line that explains it

The SDK copies the trace id and the span id of the active span into every log record. In Go, the `otelslog` bridge does it for the standard `log/slog` API, as long as the log call receives the context:

```go
s.Logger.WarnContext(ctx, "warehouse lookup was slow: full shelf scan, no index for this sku",
	slog.String("warehouse.sku", sku), slog.Int64("duration_ms", elapsed))
```

Loki indexes only the labels of a stream (`service_name`), never the text. The trace id arrives as structured metadata, which can be filtered without becoming a label:

```logql
{service_name=~".+"} | trace_id="db9972d963f729b4d44e6b5848cfa283"
```

Five lines come back, from the three services, and one of them is the warning with the reason.

## 6. Dashboards as code

Grafana is configured by files read at start-up: the data sources (with fixed `uid`s), a dashboard provider, and the dashboard JSON. Nothing is clicked, so the lab is identical on every machine and a change to a panel is a reviewed diff. The data source file also wires the signals together: a derived field turns the `trace_id` of a log line into a link to Tempo, and `tracesToLogsV2` adds to every span a button that runs the LogQL above.

## What to remember

- Metrics say **that**, traces say **where**, logs say **why**. The trace id is the thread between them.
- A trace exists across processes only if every hop propagates the context.
- The longest span is the root. Look at self time.
- Low-cardinality attributes go to metrics. High-cardinality detail goes to spans and logs.
- The application talks OTLP to a collector and knows no back end.

## Sources

- Majors, Fong-Jones and Miranda, *Observability Engineering*, chapters 5 to 7.
- OpenTelemetry documentation: Signals, Context propagation, Collector configuration, OTLP.
- W3C Trace Context.
- Prometheus (OTLP receiver, histograms), Loki (OTLP ingestion, structured metadata), Tempo (TraceQL) and Grafana (provisioning) documentation.
