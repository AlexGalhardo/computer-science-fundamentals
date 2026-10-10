# three-signals

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

One request in twelve is slow, and nobody knows why. This mini-project runs three services instrumented with OpenTelemetry and shows how the three signals answer three different questions about that request: the **metric** says that something is slow, the **trace** says where, the **log** says why.

Code: MP-OBS-1. Full explanation: [docs/en/observability/three-signals.md](../../../docs/en/observability/three-signals.md).

```text
client -> gateway (TS) -> orders (TS) -> inventory (Go) -> warehouse.lookup   <- slow for one SKU
              |               |               |
              +------- OTLP/HTTP (traces, metrics, logs) -------+
                                   v
                         OpenTelemetry Collector
                    traces |      metrics |      logs |
                           v              v           v
                         Tempo       Prometheus      Loki
                           +--------- Grafana --------+       http://127.0.0.1:3000
```

## The slow span

The injected fault: in the inventory service, the lookup of the SKU `slow-widget` takes 800 ms (a "full shelf scan"), every other SKU takes 8 ms. One trace shows it. This is the Grafana trace panel for a request found by the demo, saved by `docker compose --profile screenshot run --rm screenshot`:

![One trace in Grafana: seven spans over three services, the lowest long bar is warehouse.lookup](results/slow-span.png)

The query that found it, in TraceQL:

```traceql
{ name = "warehouse.lookup" && duration > 500ms }
```

The same trace as text, from [results/results.md](results/results.md) (the raw query result is in [results/slow-trace.json](results/slow-trace.json)):

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

Six spans are long, and five of them only wait. Self time (duration minus the children) leaves one culprit, and its attributes explain it: `warehouse.sku = slow-widget`, `warehouse.scan = full`.

## The investigation, signal by signal

| Step | Signal | Query | What it answers | What it cannot answer |
| --- | --- | --- | --- | --- |
| 1 | Metric (Prometheus, PromQL) | `histogram_quantile(0.99, sum by (le, service_name) (rate(http_server_request_duration_seconds_bucket[5m])))` | The p99 is 0.94 s in the three services | Which requests: the SKU is not a label, on purpose (one time series per product would be a cardinality problem) |
| 2 | Trace (Tempo, TraceQL) | `{ name = "warehouse.lookup" && duration > 500ms }` | Which span holds the time, in which service, for which SKU | Why the lookup was slow |
| 3 | Log (Loki, LogQL) | `{service_name=~".+"} \| trace_id="<trace id>"` | `warehouse lookup was slow: full shelf scan, no index for this sku` | How often it happens (that is the metric again) |

The link between the steps is the **trace id**: the gateway returns it in the `x-trace-id` response header, every span carries it, and the SDK writes it into every log record.

## Quiz topics it demonstrates

- `observability` / `three-signals`: what each signal is good at, and the trace id that joins them
- `observability` / `distributed-tracing`: spans, parent and child, the W3C `traceparent` header between three processes in two languages, self time
- `observability` / `opentelemetry`: API and SDK, the three providers, the Resource, OTLP, and the Collector with one pipeline per signal
- `observability` / `metric-types-cardinality`: a duration histogram with explicit buckets, and why the SKU is not a metric attribute
- `observability` / `red-use-golden-signals`: the dashboard has rate, errors and duration per service
- `observability` / `prometheus-grafana-loki-tempo`: one basic query in PromQL, LogQL and TraceQL, data sources and dashboards provisioned from files

## Run

The only requirement is Docker.

```sh
./setup-unix-three-signals.sh        # Linux and macOS
./setup-windows-three-signals.ps1    # Windows
```

The script builds the images, runs the unit tests of both languages with no network, starts the whole stack, runs the end-to-end test and removes everything at the end. Grafana takes one to two minutes on its first start (it creates its database), and the test waits for it.

## Explore by hand

One command brings everything up, with pinned images:

```sh
docker compose up -d
```

Then open <http://127.0.0.1:3000> (no login; set `GRAFANA_PORT` to use another port). The dashboard **Three signals: one slow request** is already there. Generate traffic and the report:

```sh
docker compose run --rm demo                                   # 60 requests, then the three queries; writes results/
docker compose --profile screenshot run --rm screenshot        # the picture of this README
docker compose --profile screenshot down -v                    # stop and remove everything
```

On the dashboard, click a trace id in the table "Traces with a span slower than 500 ms" to draw its waterfall below.

## Dashboards as code

Nothing is clicked into Grafana. It reads three files at start-up:

| File | What it provisions |
| --- | --- |
| `grafana/provisioning/datasources/datasources.yaml` | Prometheus, Loki and Tempo, with fixed `uid`s and the links between a log line and its trace |
| `grafana/provisioning/dashboards/dashboards.yaml` | A provider that loads every JSON file of a folder |
| `grafana/dashboards/three-signals.json` | The dashboard: rate, errors, duration, slow traces, one trace, warnings |

The end-to-end test asks the Grafana API for the dashboard and checks that it is marked as provisioned and has the six panels.

## Tests

```sh
docker compose run --rm ts-test     # typecheck + 11 unit tests, no network
docker compose run --rm go-test     # gofmt, go vet, 5 unit tests, no network
docker compose run --rm e2e-test    # 7 tests against Tempo, Prometheus, Loki and Grafana
docker compose down -v
```

The unit tests use the real SDK with in-memory exporters: they prove that the trace id crosses an HTTP hop in the `traceparent` header, that log records carry the trace id, and that three different SKUs produce one time series.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/telemetry.ts` | The OpenTelemetry SDK configured by hand: three providers, one Resource, OTLP exporters |
| `ts/src/instrument.ts` | Manual HTTP instrumentation: server span with `extract`, client span with `inject`, the metric and the log |
| `ts/src/apps.ts`, `gateway.ts`, `orders.ts` | The two TypeScript services |
| `go/inventory.go`, `go/telemetry.go` | The Go service with the injected slow dependency, and its SDK setup |
| `ts/src/lab.ts`, `ts/src/demo.ts` | The three queries over the HTTP APIs, the waterfall and self time, the demo |
| `config/` | Collector, Tempo, Loki and Prometheus configuration |
| `grafana/` | Data sources and dashboard as code |
| `screenshot/` | The Playwright script that saves `results/slow-span.png` |
| `results/` | The committed report, trace JSON and screenshot |

## Local only

- The `lab` network is `internal`: its containers cannot reach the internet. Grafana alone joins a second network to publish one port, bound to `127.0.0.1`.
- Usage reporting is off everywhere: `analytics.reporting_enabled: false` in Loki, `usage_report.reporting_enabled: false` in Tempo, the `GF_ANALYTICS_*` variables and the news feed in Grafana, and the Collector's own telemetry. Prometheus sends none.
- Grafana allows anonymous read-only access because this is a lab with no secret in it. Do not copy that setting to a server.

## Versions

| Component | Version |
| --- | --- |
| OpenTelemetry Collector | `otel/opentelemetry-collector:0.162.0` |
| Tempo | `grafana/tempo:3.1.0` |
| Loki | `grafana/loki:3.7.8` |
| Prometheus | `prom/prometheus:v3.15.0` |
| Grafana | `grafana/grafana:13.2.3` |
| Bun | `oven/bun:1.4.2` |
| Go | `golang:1.27.1-bookworm` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| OpenTelemetry JS | `@opentelemetry/api` 1.9.1; `sdk-trace-base`, `sdk-metrics`, `resources`, `core`, `context-async-hooks` 2.12.0; `sdk-logs`, `api-logs` and the three `exporter-*-otlp-http` 0.223.0 |
| OpenTelemetry Go | `otel`, `sdk`, `sdk/metric`, `sdk/log`, `otlptracehttp`, `otlpmetrichttp` v1.47.0; `otlploghttp` v0.23.0; `contrib/bridges/otelslog` v0.21.0 |
| Zod | 4.6.5 |

OpenTelemetry is in the stack of the repository; the packages above are its SDK. Two of the Go modules (`otlploghttp`, `otelslog`) and the JS log packages still have `0.x` version numbers: they are the current releases, not pre-releases, but their API may change between minor versions.

## Notes

- Instrumentation is manual on purpose. In Bun, the Node.js auto-instrumentation hooks do not patch the built-in HTTP server, and writing `extract`, `inject` and the span by hand is the lesson.
- Tempo shows a new trace in a TraceQL **search** about 30 seconds after it ended. The query frontend of Tempo 3 never searches the last 30 seconds (`query_frontend.query_end_cutoff`), so that a search does not return traces that are still arriving. Fetching a trace **by id** works right away. The demo and the tests retry until the answer is there.
- Tempo's search prints a trace id **without its leading zeros**: `0af7...` comes back as `af7...`, with 31 digits. The `traceparent` header, the logs and the fetch by id use the 32 digits. The SDK draws the id at random, so one trace in sixteen is affected, and comparing the two forms as text misses it. `searchTraces` in `ts/src/lab.ts` pads every id back to 32 digits, and the end-to-end test sends one request whose id starts with zeros on every run.
- `rate()` needs two samples of a series, so the demo sends one warm-up request and waits before the load.
