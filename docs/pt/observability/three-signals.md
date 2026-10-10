# Três sinais: uma requisição lenta (MP-OBS-1)

> English version: [docs/en/observability/three-signals.md](../../en/observability/three-signals.md) · Versión en español: [docs/es/observability/three-signals.md](../../es/observability/three-signals.md)

Mini-projeto: [`projects/observability/three-signals`](../../../projects/observability/three-signals/README.pt-BR.md). Tópicos do quiz: `three-signals`, `distributed-tracing`, `opentelemetry`, `metric-types-cardinality`, `red-use-golden-signals`, `prometheus-grafana-loki-tempo`.

## O problema

Um checkout passa por três serviços: `gateway`, `orders` e `inventory`. A maioria das requisições leva 10 ms. Algumas levam 800 ms. Os serviços estão saudáveis, nada caiu, nenhum erro é devolvido. Qual dos três está lento, e por que só às vezes?

Cada sinal responde a uma parte disso, e nenhum responde a tudo.

| Sinal | O que é | Bom em | Ruim em |
| --- | --- | --- | --- |
| Métrica | Um número agregado ao longo do tempo, por conjunto de labels | Barata, sempre ligada, tendências e alertas | Detalhe: não consegue apontar uma requisição |
| Trace | A árvore de operações de uma requisição | Onde o tempo foi gasto, entre serviços | Custo: um por requisição, em geral amostrado |
| Log | Um registro com data e hora de um evento | O motivo, em palavras e campos | Achar as linhas certas entre milhões |

## 1. Um Resource, três pipelines

O OpenTelemetry separa a **API** (o que o código chama: iniciar um span, registrar um valor, emitir um log) do **SDK** (o que acontece com os dados). O SDK tem o mesmo formato para cada sinal:

```text
provider -> instrumento (tracer, meter, logger) -> processor ou reader (lote) -> exporter (OTLP)
```

```ts
const resource = resourceFromAttributes({ "service.name": serviceName });
const tracerProvider = new BasicTracerProvider({ resource, spanProcessors: [...] });
const meterProvider = new MeterProvider({ resource, readers: [...] });
const loggerProvider = new LoggerProvider({ resource, processors: [...] });
```

O **Resource** diz quem produziu a telemetria. Como os três providers o compartilham, um span, uma métrica e uma linha de log do mesmo serviço carregam o mesmo `service.name`, e um back end consegue colocá-los lado a lado.

Os serviços conhecem um único endereço, `OTEL_EXPORTER_OTLP_ENDPOINT`, que é o **Collector**. O Collector tem um pipeline por sinal e encaminha cada um ao seu armazenamento:

```yaml
service:
  pipelines:
    traces:  { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_grpc/tempo] }
    metrics: { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_http/prometheus] }
    logs:    { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp_http/loki] }
```

Trocar o Tempo por outro armazenamento de traces muda este arquivo e nenhuma linha do código da aplicação.

## 2. Propagação de contexto: como três processos formam um trace

Um trace é um conjunto de spans com o mesmo **trace id**. Cada span tem o seu próprio **span id** e o id do pai. Dentro de um processo, o SDK guarda o span ativo em um contexto (no Bun e no Node.js, `AsyncLocalStorage`; em Go, `context.Context`). Entre processos, o contexto precisa viajar na requisição, e o padrão W3C Trace Context diz como:

```text
traceparent: 00-db9972d963f729b4d44e6b5848cfa283-3f1c2a9b7d4e5f60-01
             |  |                                |                |
             |  trace id (32 hex)                span id do pai   flags (01 = amostrado)
             versão
```

O lado cliente **injeta** o cabeçalho, o lado servidor o **extrai**:

```ts
// cliente: um span CLIENT, e o contexto dele vai para os cabeçalhos
propagation.inject(context.active(), headers);

// servidor: o novo span SERVER vira filho do span de quem chamou
const parent = propagation.extract(context.active(), Object.fromEntries(request.headers));
tracer.startActiveSpan("POST /orders", { kind: SpanKind.SERVER }, parent, async (span) => { ... });
```

```go
ctx := propagator.Extract(r.Context(), propagation.HeaderCarrier(r.Header))
ctx, span := tracer.Start(ctx, "GET /stock/{sku}", trace.WithSpanKind(trace.SpanKindServer))
```

`orders` é TypeScript e `inventory` é Go. Eles não compartilham código, só o formato do cabeçalho, e o trace continua. Se um serviço não propagasse o cabeçalho, o seguinte começaria um trace novo e a requisição ficaria partida em duas.

## 3. Lendo o trace: duração contra tempo próprio

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

Um span pai contém os filhos, então todo ancestral de um span lento também é lento. Ordenar por duração aponta a raiz, que é sempre a mais longa. O **tempo próprio** é a duração de um span menos a duração dos filhos diretos, e aponta o span que realmente gastou o tempo: `warehouse.lookup`, 800,5 ms de 805.

O span também carrega atributos: `warehouse.sku = slow-widget` e `warehouse.scan = full`. Esse é o detalhe de alta cardinalidade que uma métrica não consegue guardar.

## 4. Por que a métrica não tem SKU

```ts
telemetry.requestDuration.record(seconds, {
	"http.request.method": request.method,
	"http.route": route,                    // "/stock/{sku}", o modelo, não "/stock/slow-widget"
	"http.response.status_code": status,
});
```

Em um banco de séries temporais, cada combinação distinta de valores de label é uma série separada. Um label com o SKU criaria uma série por produto, e um label com o id do pedido, uma por requisição. Por isso a métrica guarda só atributos com poucos valores, e é um **histograma**: em vez de guardar cada duração, conta quantas requisições ficaram abaixo de cada limite de bucket (`0.005 ... 0.5, 1, 2.5, 5` segundos). A partir dos buckets, o Prometheus estima um percentil:

```promql
histogram_quantile(0.99, sum by (le, service_name) (rate(http_server_request_duration_seconds_bucket[5m])))
```

A resposta no laboratório é cerca de 0,94 s para os três serviços. É uma estimativa dentro do bucket (0,5; 1], não os 0,8 s exatos: a precisão de um histograma é a largura dos seus buckets. O mesmo histograma dá a taxa (o `_count`) e a fatia de erros (o label `http_response_status_code`), que é o método RED em um único instrumento.

## 5. A linha de log que explica

O SDK copia o trace id e o span id do span ativo para todo registro de log. Em Go, a ponte `otelslog` faz isso para a API padrão `log/slog`, desde que a chamada de log receba o contexto:

```go
s.Logger.WarnContext(ctx, "warehouse lookup was slow: full shelf scan, no index for this sku",
	slog.String("warehouse.sku", sku), slog.Int64("duration_ms", elapsed))
```

O Loki indexa só os labels de um stream (`service_name`), nunca o texto. O trace id chega como structured metadata, que pode ser filtrada sem virar label:

```logql
{service_name=~".+"} | trace_id="db9972d963f729b4d44e6b5848cfa283"
```

Voltam cinco linhas, dos três serviços, e uma delas é o aviso com o motivo.

## 6. Dashboards como código

O Grafana é configurado por arquivos lidos na inicialização: os data sources (com `uid`s fixos), um provider de dashboards e o JSON do dashboard. Nada é clicado, então o laboratório é idêntico em toda máquina e uma mudança em um painel é um diff revisado. O arquivo de data sources também liga os sinais entre si: um derived field transforma o `trace_id` de uma linha de log em um link para o Tempo, e o `tracesToLogsV2` acrescenta a todo span um botão que roda o LogQL acima.

## O que lembrar

- Métricas dizem **que**, traces dizem **onde**, logs dizem **por quê**. O trace id é o fio entre eles.
- Um trace só existe entre processos se cada salto propagar o contexto.
- O span mais longo é a raiz. Olhe o tempo próprio.
- Atributos de baixa cardinalidade vão para métricas. Detalhe de alta cardinalidade vai para spans e logs.
- A aplicação fala OTLP com um collector e não conhece nenhum back end.

## Fontes

- Majors, Fong-Jones e Miranda, *Observability Engineering*, capítulos 5 a 7.
- Documentação do OpenTelemetry: Signals, Context propagation, configuração do Collector, OTLP.
- W3C Trace Context.
- Documentação do Prometheus (receptor OTLP, histogramas), do Loki (ingestão OTLP, structured metadata), do Tempo (TraceQL) e do Grafana (provisionamento).
