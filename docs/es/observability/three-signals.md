# Tres señales: una petición lenta (MP-OBS-1)

> English version: [docs/en/observability/three-signals.md](../../en/observability/three-signals.md) · Versão em português: [docs/pt/observability/three-signals.md](../../pt/observability/three-signals.md)

Miniproyecto: [`projects/observability/three-signals`](../../../projects/observability/three-signals/README.es.md). Temas del quiz: `three-signals`, `distributed-tracing`, `opentelemetry`, `metric-types-cardinality`, `red-use-golden-signals`, `prometheus-grafana-loki-tempo`.

## El problema

Un checkout pasa por tres servicios: `gateway`, `orders` e `inventory`. La mayoría de las peticiones tarda 10 ms. Unas pocas tardan 800 ms. Los servicios están sanos, nada se cayó, no se devuelve ningún error. ¿Cuál de los tres es lento, y por qué solo a veces?

Cada señal responde una parte de eso, y ninguna lo responde todo.

| Señal | Qué es | Buena para | Mala para |
| --- | --- | --- | --- |
| Métrica | Un número agregado en el tiempo, por conjunto de labels | Barata, siempre activa, tendencias y alertas | El detalle: no puede nombrar una petición |
| Trace | El árbol de operaciones de una petición | A dónde se fue el tiempo, a través de los servicios | El costo: uno por petición, normalmente muestreado |
| Log | Un registro con marca de tiempo de un evento | La razón, en palabras y campos | Encontrar las líneas correctas entre millones |

## 1. Un Resource, tres pipelines

OpenTelemetry separa la **API** (lo que llama el código: iniciar un span, registrar un valor, emitir un log) del **SDK** (lo que ocurre con los datos). El SDK tiene la misma forma para cada señal:

```text
provider -> instrument (tracer, meter, logger) -> processor or reader (batch) -> exporter (OTLP)
```

```ts
const resource = resourceFromAttributes({ "service.name": serviceName });
const tracerProvider = new BasicTracerProvider({ resource, spanProcessors: [...] });
const meterProvider = new MeterProvider({ resource, readers: [...] });
const loggerProvider = new LoggerProvider({ resource, processors: [...] });
```

El **Resource** dice quién produjo la telemetría. Como los tres providers lo comparten, un span, una métrica y una línea de log del mismo servicio llevan el mismo `service.name`, y un back end puede ponerlos lado a lado.

Los servicios conocen una sola dirección, `OTEL_EXPORTER_OTLP_ENDPOINT`, que es el **Collector**. El Collector tiene un pipeline por señal y encamina cada una a su almacén:

```yaml
service:
  pipelines:
    traces:  { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_grpc/tempo] }
    metrics: { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_http/prometheus] }
    logs:    { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_http/loki] }
```

Reemplazar Tempo por otro almacén de traces cambia este archivo y ninguna línea de código de la aplicación.

## 2. Propagación de contexto: cómo tres procesos hacen un solo trace

Un trace es un conjunto de spans con el mismo **trace id**. Cada span tiene su propio **span id** y el id de su padre. Dentro de un proceso el SDK mantiene el span activo en un contexto (en Bun y Node.js, `AsyncLocalStorage`; en Go, `context.Context`). Entre procesos el contexto tiene que viajar en la petición, y el estándar W3C Trace Context dice cómo:

```text
traceparent: 00-db9972d963f729b4d44e6b5848cfa283-3f1c2a9b7d4e5f60-01
             |  |                                |                |
             |  trace id (32 hex)                parent span id   flags (01 = sampled)
             version
```

El lado del cliente **inyecta** el encabezado, el lado del servidor lo **extrae**:

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

`orders` es TypeScript e `inventory` es Go. No comparten código, solo el formato del encabezado, y el trace continúa. Si un servicio no propagara el encabezado, el siguiente empezaría un trace nuevo y la petición se partiría en dos.

Un detalle sobre el propio id. Tiene 16 bytes, escritos como 32 dígitos hexadecimales en el encabezado, en los logs y cuando un trace se obtiene por id. La API de búsqueda de Tempo lo imprime sin los ceros a la izquierda, así que `0af7...` vuelve como `af7...`. El SDK sortea el id, lo que significa que uno de cada dieciséis traces empieza con cero, y un código que compara las dos formas como texto no encuentra ese trace. Completa el id a 32 dígitos donde entra al programa (`canonicalTraceId` en `ts/src/lab.ts`) y compara solo entonces.

## 3. Leer el trace: duración frente a self time

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

Un span padre contiene a sus hijos, así que todo ancestro de un span lento también es lento. Ordenar por duración apunta a la raíz, que siempre es la más larga. El **self time** es la duración de un span menos la duración de sus hijos directos, y apunta al span que realmente gastó el tiempo: `warehouse.lookup`, 800.5 ms de 805.

El span también lleva atributos: `warehouse.sku = slow-widget` y `warehouse.scan = full`. Ese es el detalle de alta cardinalidad que una métrica no puede contener.

## 4. Por qué la métrica no tiene SKU

```ts
telemetry.requestDuration.record(seconds, {
	"http.request.method": request.method,
	"http.route": route,                    // "/stock/{sku}", the template, not "/stock/slow-widget"
	"http.response.status_code": status,
});
```

En una base de datos de series temporales, cada combinación distinta de valores de label es una serie separada. Un label con el SKU crearía una serie por producto, y un label con el id del pedido una por petición. Por eso la métrica conserva solo atributos con pocos valores, y es un **histograma**: en lugar de guardar cada duración, cuenta cuántas peticiones cayeron bajo cada límite de bucket (`0.005 ... 0.5, 1, 2.5, 5` segundos). A partir de los buckets Prometheus estima un percentil:

```promql
histogram_quantile(0.99, sum by (le, service_name) (rate(http_server_request_duration_seconds_bucket[5m])))
```

La respuesta en el laboratorio es de unos 0.94 s para los tres servicios. Es una estimación dentro del bucket (0.5, 1], no los 0.8 s exactos: la precisión de un histograma es el ancho de sus buckets. El mismo histograma da la tasa (su `_count`) y la porción de errores (el label `http_response_status_code`), que es el método RED en un solo instrumento.

## 5. La línea de log que lo explica

El SDK copia el trace id y el span id del span activo en cada registro de log. En Go, el puente `otelslog` lo hace para la API estándar `log/slog`, siempre que la llamada de log reciba el contexto:

```go
s.Logger.WarnContext(ctx, "warehouse lookup was slow: full shelf scan, no index for this sku",
	slog.String("warehouse.sku", sku), slog.Int64("duration_ms", elapsed))
```

Loki indexa solo los labels de un stream (`service_name`), nunca el texto. El trace id llega como structured metadata, que se puede filtrar sin convertirse en un label:

```logql
{service_name=~".+"} | trace_id="db9972d963f729b4d44e6b5848cfa283"
```

Vuelven cinco líneas, de los tres servicios, y una de ellas es la advertencia con la razón.

## 6. Dashboards como código

Grafana se configura con archivos leídos al arrancar: los data sources (con `uid` fijos), un provider de dashboards, y el JSON del dashboard. No se hace clic en nada, así que el laboratorio es idéntico en cada máquina y un cambio a un panel es un diff revisado. El archivo de data sources también conecta las señales entre sí: un campo derivado convierte el `trace_id` de una línea de log en un enlace a Tempo, y `tracesToLogsV2` agrega a cada span un botón que ejecuta el LogQL de arriba.

## Qué recordar

- Las métricas dicen **que**, los traces dicen **dónde**, los logs dicen **por qué**. El trace id es el hilo entre ellos.
- Un trace existe a través de procesos solo si cada salto propaga el contexto.
- El span más largo es la raíz. Mira el self time.
- Los atributos de baja cardinalidad van a las métricas. El detalle de alta cardinalidad va a los spans y a los logs.
- La aplicación habla OTLP con un collector y no conoce ningún back end.

## Fuentes

- Majors, Fong-Jones y Miranda, *Observability Engineering*, capítulos 5 a 7.
- Documentación de OpenTelemetry: Signals, Context propagation, Collector configuration, OTLP.
- W3C Trace Context.
- Documentación de Prometheus (receptor OTLP, histogramas), Loki (ingesta OTLP, structured metadata), Tempo (TraceQL) y Grafana (provisioning).
