# Observability

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Observability is the ability to understand what a running system is doing from the data it emits. Logs, metrics and traces answer different questions, and together they let someone explain a slow request across several services without guessing. The subject also covers what to measure (service level indicators), what to promise (objectives and error budgets) and when to wake a person up (alerting).

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Three services with traces, metrics and logs (`three-signals`) | How the three signals together explain one slow request | planned |
| Structured logs and correlation id (`structured-logs`) | How to follow one request across services | planned |
| SLO and alert (`slo-alert`) | How an objective becomes an alert | planned |
| Profiling with a flame graph (`flame-graph`) | How to find where time goes | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/observability/`).
- Documentation: planned (`docs/en/observability/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), OpenTelemetry. Free. A short introduction to the vocabulary: telemetry, reliability, logs, spans and distributed traces.
- [Site Reliability Engineering: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Google. Free. The chapter with the four golden signals and the difference between symptoms and causes.
- [Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html), Peter Bourgon. Free. A one-page diagram and text that separate the three signals by what they are good at.

### Books

- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/), Beyer, Jones, Petoff and Murphy (editors), Google. Free. Free online: service level objectives, error budgets, monitoring and alerting as practised at Google.
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/), Beyer, Murphy, Rensin, Kawahara and Thorne (editors), Google. Free. The practical sequel, with worked examples of implementing SLOs and alerting on them.
- [Observability Engineering, 2nd edition](https://www.honeycomb.io/observability-engineering-oreilly-book), Charity Majors, Liz Fong-Jones, George Miranda and Austin Parker. Free. The book the quiz follows (in its first edition), offered as a free e-book by Honeycomb after registration.

### Papers and specifications

- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Sigelman and others, Google (2010). Free. The paper that defined traces, spans and sampling, the model behind every tracing system.
- [Trace Context](https://w3c.github.io/trace-context/), W3C. Free. The standard traceparent and tracestate headers that carry a trace across services.
- [The Site Reliability Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Google. Free. Six ways to alert on an objective, ending with multi-window, multi-burn-rate alerts.
- [The RED Method: How to Instrument Your Services](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/), Tom Wilkie, Grafana Labs. Free. Rate, errors and duration for every service, and how it complements the USE method.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Free. The home page of flame graphs: how to generate them and how to read them.
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/), OpenTelemetry. Free. The precise definition of the signals, the API, the SDK and context propagation.

### Official documentation

- [OpenTelemetry documentation](https://opentelemetry.io/docs/), OpenTelemetry. Free. Concepts, language SDKs, the Collector and semantic conventions.
- [Prometheus documentation](https://prometheus.io/docs/introduction/overview/), Prometheus Authors. Free. The data model, metric types, PromQL, alerting rules and instrumentation best practices.
- [Grafana documentation](https://grafana.com/docs/grafana/latest/), Grafana Labs. Free. Dashboards, data sources and alerting.
- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/), Grafana Labs. Free. Log aggregation with labels, and the LogQL query language.
- [Grafana Tempo documentation](https://grafana.com/docs/tempo/latest/), Grafana Labs. Free. A trace back end and the TraceQL query language.

### Videos

- [Grafana](https://www.youtube.com/@Grafana), Grafana Labs. Free. Introductory videos and conference talks on the whole stack used in the mini-projects.

### Practice and tools

- [OpenTelemetry Demo](https://opentelemetry.io/docs/demo/), OpenTelemetry. Free. A complete microservices shop instrumented with traces, metrics and logs, to run locally.
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/), PromLabs. Free. The common queries for rates, percentiles and aggregations on one page.
- [Grafana Play](https://play.grafana.org/), Grafana Labs. Free. A public Grafana instance with example dashboards to explore.

### Communities

- [OpenTelemetry community](https://opentelemetry.io/community/), OpenTelemetry. Free. Where to find the special interest groups, meetings and chat of the project.
- [r/sre](https://www.reddit.com/r/sre/), Reddit. Free. Practitioners discussing monitoring, incidents and on-call.
