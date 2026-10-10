# Observabilidade

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Observabilidade é a capacidade de entender o que um sistema em execução está fazendo a partir dos dados que ele emite. Logs, métricas e traces respondem a perguntas diferentes, e juntos permitem explicar uma requisição lenta entre vários serviços sem adivinhar. O assunto também cobre o que medir (indicadores de nível de serviço), o que prometer (objetivos e orçamentos de erro) e quando acordar uma pessoa (alertas).

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Três serviços com traces, métricas e logs (`three-signals`) | Como os três sinais juntos explicam uma requisição lenta | planejado |
| Logs estruturados e id de correlação (`structured-logs`) | Como acompanhar uma requisição entre serviços | planejado |
| SLO e alerta (`slo-alert`) | Como um objetivo vira um alerta | planejado |
| Profiling com flame graph (`flame-graph`) | Como descobrir para onde vai o tempo | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/observability/`).
- Documentação: planejada (`docs/pt/observability/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), OpenTelemetry. Gratuito. Introdução curta ao vocabulário: telemetria, confiabilidade, logs, spans e traces distribuídos.
- [Site Reliability Engineering: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Google. Gratuito. O capítulo com os quatro sinais de ouro e a diferença entre sintomas e causas.
- [Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html), Peter Bourgon. Gratuito. Diagrama e texto de uma página que separam os três sinais pelo que cada um faz bem.

### Livros

- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/), Beyer, Jones, Petoff and Murphy (editors), Google. Gratuito. Gratuito online: objetivos de nível de serviço, orçamentos de erro, monitoramento e alertas como praticados no Google.
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/), Beyer, Murphy, Rensin, Kawahara and Thorne (editors), Google. Gratuito. A continuação prática, com exemplos resolvidos de implementação de SLOs e de alertas sobre eles.
- [Observability Engineering, 2nd edition](https://www.honeycomb.io/observability-engineering-oreilly-book), Charity Majors, Liz Fong-Jones, George Miranda and Austin Parker. Gratuito. O livro que o quiz segue (na primeira edição), oferecido como e-book gratuito pela Honeycomb mediante cadastro.

### Artigos e especificações

- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Sigelman and others, Google (2010). Gratuito. O artigo que definiu traces, spans e amostragem, o modelo por trás de todo sistema de tracing.
- [Trace Context](https://w3c.github.io/trace-context/), W3C. Gratuito. Os cabeçalhos padrão traceparent e tracestate que levam um trace entre serviços.
- [The Site Reliability Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Google. Gratuito. Seis formas de alertar sobre um objetivo, terminando em alertas de múltiplas janelas e taxas de queima.
- [The RED Method: How to Instrument Your Services](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/), Tom Wilkie, Grafana Labs. Gratuito. Taxa, erros e duração para cada serviço, e como isso complementa o método USE.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Gratuito. A página oficial dos flame graphs: como gerá-los e como lê-los.
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/), OpenTelemetry. Gratuito. A definição precisa dos sinais, da API, do SDK e da propagação de contexto.

### Documentação oficial

- [OpenTelemetry documentation](https://opentelemetry.io/docs/), OpenTelemetry. Gratuito. Conceitos, SDKs por linguagem, o Collector e as convenções semânticas.
- [Prometheus documentation](https://prometheus.io/docs/introduction/overview/), Prometheus Authors. Gratuito. O modelo de dados, os tipos de métrica, PromQL, regras de alerta e boas práticas de instrumentação.
- [Grafana documentation](https://grafana.com/docs/grafana/latest/), Grafana Labs. Gratuito. Painéis, fontes de dados e alertas.
- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/), Grafana Labs. Gratuito. Agregação de logs com rótulos, e a linguagem de consulta LogQL.
- [Grafana Tempo documentation](https://grafana.com/docs/tempo/latest/), Grafana Labs. Gratuito. Um back-end de traces e a linguagem de consulta TraceQL.

### Vídeos

- [Grafana](https://www.youtube.com/@Grafana), Grafana Labs. Gratuito. Vídeos introdutórios e palestras sobre toda a pilha usada nos miniprojetos.

### Prática e ferramentas

- [OpenTelemetry Demo](https://opentelemetry.io/docs/demo/), OpenTelemetry. Gratuito. Uma loja completa de microsserviços instrumentada com traces, métricas e logs, para rodar localmente.
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/), PromLabs. Gratuito. As consultas comuns de taxas, percentis e agregações em uma página.
- [Grafana Play](https://play.grafana.org/), Grafana Labs. Gratuito. Uma instância pública do Grafana com painéis de exemplo para explorar.

### Comunidades

- [OpenTelemetry community](https://opentelemetry.io/community/), OpenTelemetry. Gratuito. Onde encontrar os grupos de interesse, as reuniões e o chat do projeto.
- [r/sre](https://www.reddit.com/r/sre/), Reddit. Gratuito. Profissionais discutindo monitoramento, incidentes e plantão.
