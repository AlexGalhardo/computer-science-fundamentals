# three-signals

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Uma requisição em cada doze é lenta, e ninguém sabe por quê. Este mini-projeto roda três serviços instrumentados com OpenTelemetry e mostra como os três sinais respondem a três perguntas diferentes sobre essa requisição: a **métrica** diz que algo está lento, o **trace** diz onde, o **log** diz por quê.

Código: MP-OBS-1. Explicação completa: [docs/pt/observability/three-signals.md](../../../docs/pt/observability/three-signals.md).

```text
cliente -> gateway (TS) -> orders (TS) -> inventory (Go) -> warehouse.lookup   <- lento para um SKU
               |               |               |
               +------- OTLP/HTTP (traces, métricas, logs) -------+
                                    v
                          OpenTelemetry Collector
                     traces |     métricas |      logs |
                            v              v           v
                          Tempo       Prometheus      Loki
                            +--------- Grafana --------+       http://127.0.0.1:3000
```

## O span lento

A falha injetada: no serviço inventory, a consulta do SKU `slow-widget` leva 800 ms (uma "varredura completa da prateleira"), e qualquer outro SKU leva 8 ms. Um único trace mostra isso. Este é o painel de trace do Grafana para uma requisição encontrada pela demo, salvo por `docker compose --profile screenshot run --rm screenshot`:

![Um trace no Grafana: sete spans em três serviços, a barra longa mais baixa é warehouse.lookup](results/slow-span.png)

A consulta que o encontrou, em TraceQL:

```traceql
{ name = "warehouse.lookup" && duration > 500ms }
```

O mesmo trace em texto, de [results/results.md](results/results.md) (o resultado bruto da consulta está em [results/slow-trace.json](results/slow-trace.json)):

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

Seis spans são longos, e cinco deles só esperam. O tempo próprio (duração menos os filhos) deixa um culpado, e os atributos dele explicam: `warehouse.sku = slow-widget`, `warehouse.scan = full`.

## A investigação, sinal por sinal

| Passo | Sinal | Consulta | O que responde | O que não consegue responder |
| --- | --- | --- | --- | --- |
| 1 | Métrica (Prometheus, PromQL) | `histogram_quantile(0.99, sum by (le, service_name) (rate(http_server_request_duration_seconds_bucket[5m])))` | O p99 é de 0,94 s nos três serviços | Quais requisições: o SKU não é um label, de propósito (uma série temporal por produto seria um problema de cardinalidade) |
| 2 | Trace (Tempo, TraceQL) | `{ name = "warehouse.lookup" && duration > 500ms }` | Qual span concentra o tempo, em qual serviço, para qual SKU | Por que a consulta foi lenta |
| 3 | Log (Loki, LogQL) | `{service_name=~".+"} \| trace_id="<trace id>"` | `warehouse lookup was slow: full shelf scan, no index for this sku` | Com que frequência acontece (isso é a métrica de novo) |

O elo entre os passos é o **trace id**: o gateway o devolve no cabeçalho de resposta `x-trace-id`, todo span o carrega, e o SDK o grava em todo registro de log.

## Tópicos do quiz que ele demonstra

- `observability` / `three-signals`: no que cada sinal é bom, e o trace id que os une
- `observability` / `distributed-tracing`: spans, pai e filho, o cabeçalho W3C `traceparent` entre três processos em duas linguagens, tempo próprio
- `observability` / `opentelemetry`: API e SDK, os três providers, o Resource, OTLP, e o Collector com um pipeline por sinal
- `observability` / `metric-types-cardinality`: um histograma de duração com buckets explícitos, e por que o SKU não é atributo de métrica
- `observability` / `red-use-golden-signals`: o dashboard tem taxa, erros e duração por serviço
- `observability` / `prometheus-grafana-loki-tempo`: uma consulta básica em PromQL, LogQL e TraceQL, data sources e dashboards provisionados por arquivos

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-three-signals.sh        # Linux e macOS
./setup-windows-three-signals.ps1    # Windows
```

O script constrói as imagens, roda os testes unitários das duas linguagens sem rede, sobe a pilha inteira, roda o teste de ponta a ponta e remove tudo no fim. O Grafana leva de um a dois minutos na primeira inicialização (ele cria o seu banco), e o teste espera por ele.

## Explorar à mão

Um comando sobe tudo, com imagens fixadas:

```sh
docker compose up -d
```

Depois abra <http://127.0.0.1:3000> (sem login; defina `GRAFANA_PORT` para usar outra porta). O dashboard **Three signals: one slow request** já está lá. Gere tráfego e o relatório:

```sh
docker compose run --rm demo                                   # 60 requisições e as três consultas; grava results/
docker compose --profile screenshot run --rm screenshot        # a imagem deste README
docker compose --profile screenshot down -v                    # para e remove tudo
```

No dashboard, clique em um trace id da tabela "Traces with a span slower than 500 ms" para desenhar a cascata dele logo abaixo.

## Dashboards como código

Nada é clicado no Grafana. Ele lê três arquivos na inicialização:

| Arquivo | O que provisiona |
| --- | --- |
| `grafana/provisioning/datasources/datasources.yaml` | Prometheus, Loki e Tempo, com `uid`s fixos e os links entre uma linha de log e o seu trace |
| `grafana/provisioning/dashboards/dashboards.yaml` | Um provider que carrega todo arquivo JSON de uma pasta |
| `grafana/dashboards/three-signals.json` | O dashboard: taxa, erros, duração, traces lentos, um trace, avisos |

O teste de ponta a ponta pede o dashboard à API do Grafana e confere que ele está marcado como provisionado e tem os seis painéis.

## Testes

```sh
docker compose run --rm ts-test     # checagem de tipos + 9 testes unitários, sem rede
docker compose run --rm go-test     # gofmt, go vet, 5 testes unitários, sem rede
docker compose run --rm e2e-test    # 6 testes contra Tempo, Prometheus, Loki e Grafana
docker compose down -v
```

Os testes unitários usam o SDK real com exporters em memória: provam que o trace id atravessa um salto HTTP no cabeçalho `traceparent`, que os registros de log carregam o trace id, e que três SKUs diferentes produzem uma única série temporal.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/telemetry.ts` | O SDK do OpenTelemetry configurado à mão: três providers, um Resource, exporters OTLP |
| `ts/src/instrument.ts` | Instrumentação HTTP manual: span de servidor com `extract`, span de cliente com `inject`, a métrica e o log |
| `ts/src/apps.ts`, `gateway.ts`, `orders.ts` | Os dois serviços TypeScript |
| `go/inventory.go`, `go/telemetry.go` | O serviço Go com a dependência lenta injetada, e a configuração do SDK |
| `ts/src/lab.ts`, `ts/src/demo.ts` | As três consultas sobre as APIs HTTP, a cascata e o tempo próprio, a demo |
| `config/` | Configuração do Collector, Tempo, Loki e Prometheus |
| `grafana/` | Data sources e dashboard como código |
| `screenshot/` | O script Playwright que salva `results/slow-span.png` |
| `results/` | O relatório, o JSON do trace e a captura de tela versionados |

## Somente local

- A rede `lab` é `internal`: os contêineres dela não alcançam a internet. Só o Grafana entra em uma segunda rede para publicar uma porta, presa a `127.0.0.1`.
- O envio de estatísticas de uso está desligado em tudo: `analytics.reporting_enabled: false` no Loki, `usage_report.reporting_enabled: false` no Tempo, as variáveis `GF_ANALYTICS_*` e o feed de notícias no Grafana, e a telemetria do próprio Collector. O Prometheus não envia nada.
- O Grafana permite acesso anônimo somente de leitura porque este é um laboratório sem nenhum segredo. Não copie essa configuração para um servidor.

## Versões

| Componente | Versão |
| --- | --- |
| OpenTelemetry Collector | `otel/opentelemetry-collector:0.162.0` |
| Tempo | `grafana/tempo:3.1.0` |
| Loki | `grafana/loki:3.7.8` |
| Prometheus | `prom/prometheus:v3.15.0` |
| Grafana | `grafana/grafana:13.2.3` |
| Bun | `oven/bun:1.4.2` |
| Go | `golang:1.27.1-bookworm` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| OpenTelemetry JS | `@opentelemetry/api` 1.9.1; `sdk-trace-base`, `sdk-metrics`, `resources`, `core`, `context-async-hooks` 2.12.0; `sdk-logs`, `api-logs` e os três `exporter-*-otlp-http` 0.223.0 |
| OpenTelemetry Go | `otel`, `sdk`, `sdk/metric`, `sdk/log`, `otlptracehttp`, `otlpmetrichttp` v1.47.0; `otlploghttp` v0.23.0; `contrib/bridges/otelslog` v0.21.0 |
| Zod | 4.6.5 |

O OpenTelemetry faz parte da stack do repositório; os pacotes acima são o SDK dele. Dois dos módulos Go (`otlploghttp`, `otelslog`) e os pacotes de log do JS ainda têm versões `0.x`: são as versões atuais, não pré-lançamentos, mas a API deles pode mudar entre versões menores.

## Observações

- A instrumentação é manual de propósito. No Bun, os ganchos de instrumentação automática do Node.js não alteram o servidor HTTP embutido, e escrever `extract`, `inject` e o span à mão é a lição.
- O Tempo leva até um minuto para que um trace novo apareça em uma **busca** TraceQL. Buscar um trace **pelo id** funciona na hora. A demo e os testes repetem a consulta até a resposta chegar.
- O `rate()` precisa de duas amostras de uma série, então a demo manda uma requisição de aquecimento e espera antes da carga.
