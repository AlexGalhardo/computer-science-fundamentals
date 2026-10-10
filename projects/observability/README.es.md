# Observabilidad

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La observabilidad es la capacidad de entender qué está haciendo un sistema en ejecución a partir de los datos que emite. Los logs, las métricas y los traces responden a preguntas distintas, y juntos permiten explicar una petición lenta a través de varios servicios sin adivinar. El tema también cubre qué medir (indicadores de nivel de servicio), qué prometer (objetivos y presupuestos de error) y cuándo despertar a una persona (alertas).

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Tres servicios con traces, métricas y logs (`three-signals`) | Cómo las tres señales juntas explican una petición lenta | planificado |
| Logs estructurados e id de correlación (`structured-logs`) | Cómo seguir una petición a través de los servicios | planificado |
| SLO y alerta (`slo-alert`) | Cómo un objetivo se convierte en una alerta | planificado |
| Profiling con un flame graph (`flame-graph`) | Cómo encontrar a dónde se va el tiempo | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/observability/`).
- Documentación: planificada (`docs/es/observability/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), OpenTelemetry. Gratis. Una introducción corta al vocabulario: telemetría, confiabilidad, logs, spans y traces distribuidos.
- [Site Reliability Engineering: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Google. Gratis. El capítulo con las cuatro señales de oro y la diferencia entre síntomas y causas.
- [Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html), Peter Bourgon. Gratis. Un diagrama y un texto de una página que separan las tres señales según aquello en lo que cada una destaca.

### Libros

- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/), Beyer, Jones, Petoff and Murphy (editors), Google. Gratis. Gratis en línea: objetivos de nivel de servicio, presupuestos de error, monitoreo y alertas tal como se practican en Google.
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/), Beyer, Murphy, Rensin, Kawahara and Thorne (editors), Google. Gratis. La continuación práctica, con ejemplos resueltos de cómo implementar SLOs y alertar sobre ellos.
- [Observability Engineering, 2nd edition](https://www.honeycomb.io/observability-engineering-oreilly-book), Charity Majors, Liz Fong-Jones, George Miranda and Austin Parker. Gratis. El libro que sigue el quiz (en su primera edición), ofrecido como e-book gratuito por Honeycomb previo registro.

### Artículos y especificaciones

- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Sigelman and others, Google (2010). Gratis. El artículo que definió traces, spans y muestreo, el modelo detrás de todo sistema de tracing.
- [Trace Context](https://w3c.github.io/trace-context/), W3C. Gratis. Las cabeceras estándar traceparent y tracestate que llevan un trace a través de los servicios.
- [The Site Reliability Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Google. Gratis. Seis formas de alertar sobre un objetivo, que terminan en alertas de múltiples ventanas y múltiples tasas de consumo.
- [The RED Method: How to Instrument Your Services](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/), Tom Wilkie, Grafana Labs. Gratis. Tasa, errores y duración para cada servicio, y cómo complementa el método USE.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Gratis. La página principal de los flame graphs: cómo generarlos y cómo leerlos.
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/), OpenTelemetry. Gratis. La definición precisa de las señales, la API, el SDK y la propagación de contexto.

### Documentación oficial

- [OpenTelemetry documentation](https://opentelemetry.io/docs/), OpenTelemetry. Gratis. Conceptos, SDKs por lenguaje, el Collector y las convenciones semánticas.
- [Prometheus documentation](https://prometheus.io/docs/introduction/overview/), Prometheus Authors. Gratis. El modelo de datos, los tipos de métrica, PromQL, las reglas de alerta y las buenas prácticas de instrumentación.
- [Grafana documentation](https://grafana.com/docs/grafana/latest/), Grafana Labs. Gratis. Paneles, fuentes de datos y alertas.
- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/), Grafana Labs. Gratis. Agregación de logs con etiquetas, y el lenguaje de consulta LogQL.
- [Grafana Tempo documentation](https://grafana.com/docs/tempo/latest/), Grafana Labs. Gratis. Un back end de traces y el lenguaje de consulta TraceQL.

### Videos

- [Grafana](https://www.youtube.com/@Grafana), Grafana Labs. Gratis. Videos introductorios y charlas de conferencias sobre toda la pila usada en los miniproyectos.

### Práctica y herramientas

- [OpenTelemetry Demo](https://opentelemetry.io/docs/demo/), OpenTelemetry. Gratis. Una tienda completa de microservicios instrumentada con traces, métricas y logs, para ejecutar localmente.
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/), PromLabs. Gratis. Las consultas comunes de tasas, percentiles y agregaciones en una página.
- [Grafana Play](https://play.grafana.org/), Grafana Labs. Gratis. Una instancia pública de Grafana con paneles de ejemplo para explorar.

### Comunidades

- [OpenTelemetry community](https://opentelemetry.io/community/), OpenTelemetry. Gratis. Dónde encontrar los grupos de interés, las reuniones y el chat del proyecto.
- [r/sre](https://www.reddit.com/r/sre/), Reddit. Gratis. Profesionales que discuten monitoreo, incidentes y guardias.
