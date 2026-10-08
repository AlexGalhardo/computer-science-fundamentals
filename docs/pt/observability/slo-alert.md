# SLO e alerta (MP-OBS-3)

> English version: [docs/en/observability/slo-alert.md](../../en/observability/slo-alert.md)

Mini-projeto: [`projects/observability/slo-alert`](../../../projects/observability/slo-alert/README.pt-BR.md). Tópicos do quiz: `sli-slo-error-budgets`, `alerting`, `metric-types-cardinality`, `prometheus-grafana-loki-tempo`.

## O problema

"Alerte quando a CPU passar de 90%" aciona pessoas por coisas que os usuários nunca percebem e fica em silêncio enquanto os usuários sofrem. Um alerta deveria dizer que **os usuários estão sendo prejudicados, mais rápido do que se combinou ser aceitável**. Para escrever isso como regra, quatro coisas precisam ser definidas em ordem.

## 1. SLI: o que é medido

Um indicador de nível de serviço é uma razão: eventos bons sobre eventos válidos.

| Objetivo | Evento bom | Evento válido |
| --- | --- | --- |
| Disponibilidade | uma requisição que não falhou (sem 5xx) | toda requisição |
| Latência | uma requisição bem-sucedida que levou 100 ms ou menos | toda requisição bem-sucedida |

O indicador de latência é uma fatia de requisições abaixo de um limite, não uma média: uma média de 60 ms pode esconder uma requisição em cada dez levando 400 ms. Com um histograma do Prometheus a fatia é uma divisão, porque os buckets são cumulativos: `le="0.1"` já conta toda requisição de 100 ms ou menos. Por isso o limite do objetivo precisa ser um dos limites de bucket.

As requisições com falha ficam fora do histograma de latência. Um 503 é recusado em menos de um milissegundo, e contá-lo faria a latência parecer melhor justamente quando o serviço está falhando.

## 2. SLO e orçamento de erro

O objetivo é uma meta para o indicador em uma janela: 99% em 30 dias. O **orçamento de erro** é o que o objetivo deixa sobrar: 1% das requisições pode falhar. É um orçamento porque existe para ser gasto, em lançamentos, experimentos e falhas não planejadas. Um objetivo de 100% não deixaria nada, e nenhuma mudança poderia ser feita com segurança.

## 3. Burn rate

```
burn rate = fatia de eventos ruins / orçamento de erro
```

| Burn rate | Significado para uma janela de 30 dias (720 horas) |
| --- | --- |
| 1 | O orçamento dura exatamente 30 dias |
| 6 | Acaba em 720 / 6 = 120 horas (5 dias) |
| 14,4 | Acaba em 720 / 14,4 = 50 horas. Uma hora gasta 14,4 / 720 = 2% |

O burn rate transforma "quão ruim está" em "quanto tempo até o orçamento acabar", e é isso que decide entre um acionamento e um chamado.

## 4. Do PromQL às regras

Uma **recording rule** guarda o resultado de uma expressão como uma nova série. O indicador:

```yaml
- record: job:slo_errors_per_request:ratio_rate5m
  expr: |
    sum by (job) (rate(http_requests_total{code=~"5.."}[5m]))
    /
    sum by (job) (rate(http_requests_total[5m]))
```

O `rate()` de um counter é requisições por segundo; dividir duas taxas dá uma fatia de 0 a 1. Um detalhe importa: a série `code="503"` precisa existir com valor 0 antes da primeira falha. Uma série que não existe não é zero, é ausente, e a razão ficaria sem valor.

O burn rate é o indicador dividido pelo orçamento, e o alerta o compara com um limite em **duas janelas**:

```yaml
- alert: AvailabilityBudgetBurn
  expr: |
    job:slo_availability_burn_rate:ratio_rate5m > 14.4
    and
    job:slo_availability_burn_rate:ratio_rate1m > 14.4
  for: 10s
  labels:
    severity: page
```

- A **janela longa** prova que uma parte real do orçamento se foi. Uma requisição com falha em um minuto calmo não aciona ninguém.
- A **janela curta** prova que ainda está acontecendo. Quando o problema acaba, a janela curta esvazia depressa e o `and` fica falso, embora a janela longa ainda lembre.
- O **`for`** pede que a condição se mantenha antes de disparar. Até lá o alerta fica `pending`.

O laboratório usa 5 minutos e 1 minuto. Em produção usa-se 1 hora e 5 minutos, com os mesmos limites.

## 5. Testando regras sem um serviço

O `promtool test rules` entrega amostras inventadas às regras e confere as séries e os alertas que saem em momentos escolhidos:

```yaml
input_series:
  - series: 'http_requests_total{job="shop", code="200"}'
    values: "0+135x121"          # +135 a cada 15 s = 9 requisições por segundo
  - series: 'http_requests_total{job="shop", code="503"}'
    values: "0x40 60+60x39 2400x40"   # nada, depois 4 por segundo por 10 minutos, depois nada
alert_rule_test:
  - eval_time: 16m
    alertname: AvailabilityBudgetBurn
    exp_alerts: [ ... ]          # disparando: 4 de 13 falham, burn rate 30,77
  - eval_time: 21m30s
    alertname: AvailabilityBudgetBurn
    exp_alerts: []               # resolvido 90 s depois do fim; a janela de 5 min ainda queima a 23,3
```

Trinta minutos de histórico rodam em milissegundos, e um erro em um limite é encontrado antes de qualquer incidente.

## 6. O incidente de verdade

A loja atende 8 requisições por vez; cada requisição em andamento atrasa as outras, e além de 8 ela responde 503. O k6 com 30 usuários virtuais basta para quebrar os dois objetivos. Medido no laboratório:

| Momento | Segundos |
| --- | --- |
| Carga começa → alerta de disponibilidade pending | 4 |
| Carga começa → disparando, receiver notificado | 14 |
| Carga para → alerta resolvido | 53 |
| Burn rate da janela de 5 min nesse momento | 77,7 (limite 14,4) |

O Prometheus decide quando um alerta dispara. O **Alertmanager** decide quem fica sabendo: agrupa alertas (`group_by`), espera um pouco pelos relacionados (`group_wait`) e manda uma notificação `resolved` quando eles terminam. Aqui o receiver é um webhook local.

## O que lembrar

- Um SLI é eventos bons sobre eventos válidos. Um SLI de latência é uma fatia abaixo de um limite, não uma média.
- O orçamento de erro é 1 menos o objetivo, e existe para ser gasto.
- Burn rate = fatia ruim / orçamento. 14,4 gasta 2% de um orçamento de 30 dias em uma hora.
- Duas janelas: a longa evita ruído, a curta faz o alerta parar quando o problema para.
- Regras são código. Elas têm testes unitários.
- Um teste de carga só mira um serviço que é seu. Aqui o k6 recusa tudo que não é local.

## Fontes

- Majors, Fong-Jones e Miranda, *Observability Engineering*, capítulos 12 e 13.
- Google, *The Site Reliability Workbook*, capítulo 5 (alertas sobre SLOs).
- Documentação do Prometheus: recording rules, alerting rules, testes unitários de regras, histogramas, Alertmanager.
