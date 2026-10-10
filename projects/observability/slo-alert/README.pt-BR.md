# slo-alert

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Como uma frase do tipo "99% das requisições precisam dar certo" vira um acionamento na hora certa, e para quando o problema para? Este mini-projeto leva um pequeno serviço de loja do objetivo até o alerta: indicadores, orçamento de erro, burn rate, regras do Prometheus testadas com o `promtool`, e um alerta que dispara quando o k6 local sobrecarrega o serviço e se resolve depois que a carga termina.

Código: MP-OBS-3. Explicação completa: [docs/pt/observability/slo-alert.md](../../../docs/pt/observability/slo-alert.md).

```text
k6 (só local) --sobrecarga--> shop --/metrics--> Prometheus --alertas--> Alertmanager --webhook--> receiver
                               ^                    |
     usuários normais ---------+        recording rules: SLI -> burn rate -> alerta (duas janelas)
```

## Os objetivos

| Objetivo (em 30 dias) | Indicador (SLI) | Orçamento de erro | Aciona quando o burn rate passa de |
| --- | --- | --- | --- |
| Disponibilidade: 99% das requisições não falham | falhas (5xx) / todas as requisições | 1% | 14,4, na janela de 5 min **e** na de 1 min |
| Latência: 95% das requisições bem-sucedidas levam 100 ms ou menos | 1 - bucket `le="0.1"` / count | 5% | 6, na janela de 5 min **e** na de 1 min |

Burn rate = fatia ruim / orçamento de erro. Com burn rate 1, o orçamento dura exatamente os 30 dias. Com 14,4 ele acaba em 720 / 14,4 = 50 horas, e uma hora nesse ritmo gasta 14,4 / 720 = 2% dele.

Regras deste tipo em produção usam janelas de 1 hora e 5 minutos. O laboratório usa 5 minutos e 1 minuto, doze vezes mais curtas, para que a demonstração leve três minutos. Os limites e a aritmética deles são os mesmos.

## Resultados

Gerados por `docker compose run --rm demo`, versionados em [results/results.md](results/results.md). O k6 rodou 30 usuários virtuais por 60 segundos contra uma loja que atende 8 requisições por vez; cerca de 5 requisições por segundo de tráfego normal rodaram o tempo todo.

| Medida | Valor |
| --- | --- |
| Pico de requisições | 227 requisições por segundo |
| Pico da fatia de requisições com falha (janela de 1 min) | 80,2% (objetivo: no máximo 1%) |
| Pico da fatia de requisições bem-sucedidas lentas (janela de 1 min) | 100% (objetivo: no máximo 5%) |
| Alerta pending ou disparando antes da carga | não |

| Alerta | Pending | Disparando e receiver notificado | Resolvido depois que a carga parou | Pico de burn rate | Burn rate da janela de 5 min na resolução |
| --- | --- | --- | --- | --- | --- |
| `AvailabilityBudgetBurn` | 4 s depois do início da carga | 14 s | 53 s | 80,2 | 77,7 |
| `LatencyBudgetBurn` | 6 s | 16 s | 51 s | 20,0 | 17,3 |

**Tempos documentados, conferidos pelo teste de ponta a ponta:** o receiver é notificado **em até 60 segundos** depois de a carga começar, e o alerta se resolve **em até 120 segundos** depois de a carga parar.

A última coluna é a lição das duas janelas. Quando os alertas se resolveram, a janela de 5 minutos ainda queimava muito acima do limite (77,7 contra 14,4): ela ainda lembrava do incidente. A janela de 1 minuto já tinha esquecido, e a regra precisa das duas. Só com a janela longa, o acionamento continuaria por cerca de cinco minutos depois de o serviço voltar ao normal.

## Tópicos do quiz que ele demonstra

- `observability` / `sli-slo-error-budgets`: SLI como eventos bons ou ruins sobre eventos válidos, o objetivo, o orçamento de erro, um SLI de latência como fatia de requisições abaixo de um limite e não como média, burn rate
- `observability` / `alerting`: alertas baseados em sintoma sobre a queima do orçamento, duas janelas, `for` com pending e firing, agrupamento e notificações de resolução do Alertmanager
- `observability` / `metric-types-cardinality`: um counter e um histograma clássico escritos à mão, buckets `le` cumulativos, `rate()`, por que uma série precisa começar em 0
- `observability` / `prometheus-grafana-loki-tempo`: o Prometheus puxando `/metrics`, PromQL em recording rules

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-slo-alert.sh        # Linux e macOS
./setup-windows-slo-alert.ps1    # Windows
```

O script constrói a imagem e roda, em ordem: os testes unitários, o testador de regras do Prometheus, a prova de que o k6 recusa um alvo que não é local, e o incidente de ponta a ponta (cerca de três minutos). Tudo é removido no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Sobe a pilha e o k6 (45 segundos calmos, 60 segundos de carga), imprime a linha do tempo enquanto ela acontece e regrava `results/results.md` e `results/timeline.json`.

## Testes

```sh
docker compose run --rm ts-test             # checagem de tipos + 22 testes unitários, sem rede
docker compose run --rm rules-test          # promtool check config + promtool test rules, sem rede
docker compose run --rm load-refusal-test   # o k6 precisa recusar https://example.com
docker compose run --rm e2e-test            # 8 testes: o alerta dispara e se resolve nos tempos documentados
docker compose down -v
```

### As regras e os testes delas

[`prometheus/rules.yaml`](prometheus/rules.yaml) tem 9 recording rules e 2 alerting rules, em três camadas dentro de um único grupo de regras (as regras de um grupo rodam em ordem, então cada camada lê o que a camada de cima acabou de gravar):

| Camada | Exemplo | Significado |
| --- | --- | --- |
| Indicador | `job:slo_errors_per_request:ratio_rate5m` | Fatia de requisições com falha nos últimos 5 minutos |
| Burn rate | `job:slo_availability_burn_rate:ratio_rate5m` | Essa fatia dividida pelo orçamento de 1% |
| Orçamento | `job:slo_availability_error_budget_remaining:ratio_1h` | 1 = intacto, 0 = gasto, negativo = estourado |
| Alerta | `AvailabilityBudgetBurn` | Os dois burn rates acima de 14,4, mantidos por 10 s |

[`prometheus/rules.test.yaml`](prometheus/rules.test.yaml) é rodado pelo `promtool test rules` dentro da imagem fixada do Prometheus. Ele simula quatro históricos em milissegundos: um serviço saudável, 10% de falhas constantes (burn rate 10: objetivo quebrado, mas abaixo do limite de acionamento), uma indisponibilidade de dez minutos (dispara, e se resolve 90 segundos depois do fim enquanto a janela de 5 minutos ainda queima a 23,3), e um serviço lento que nunca falha (aciona só por latência).

## Somente local

- O k6 (`grafana/k6:2.3.0`) lê o alvo de `TARGET`, que tem um endereço local como padrão, e [`load/target.js`](load/target.js) recusa qualquer host fora de uma lista fechada (`localhost`, `127.0.0.1`, `[::1]`, `shop`). O `load-refusal-test` prova isso, e os testes unitários cobrem parecidos como `http://localhost@example.com`.
- A rede do compose é `internal` e nenhuma porta é publicada. Para olhar o Prometheus à mão, use `docker compose exec prometheus wget -qO- 'http://127.0.0.1:9090/api/v1/alerts'`.
- O "pager" é um webhook local que só lembra o que recebeu. O envio de estatísticas de uso do k6 está desligado; o Prometheus e o Alertmanager não enviam nada.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/metrics.ts` | Um counter e um histograma à mão, no formato de texto do Prometheus |
| `ts/src/shop.ts` | O serviço: capacidade fixa, mais lento a cada requisição em andamento, 503 quando cheio |
| `ts/src/slo.ts` | A aritmética: orçamento de erro, burn rate, tempo até esgotar, a condição de duas janelas |
| `ts/src/receiver.ts` | O webhook que recebe as notificações do Alertmanager |
| `ts/src/watch.ts`, `ts/src/demo.ts` | O observador que registra a linha do tempo de um incidente, e a demo |
| `prometheus/` | Configuração de scrape, as regras e os testes do `promtool` |
| `alertmanager/` | Roteamento, agrupamento e o webhook receiver |
| `load/` | O script do k6, a regra de alvo local e o teste de recusa |
| `results/` | A linha do tempo versionada |

## Versões

| Componente | Versão |
| --- | --- |
| Prometheus (e `promtool`) | `prom/prometheus:v3.15.0` |
| Alertmanager | `prom/alertmanager:v0.34.1` |
| k6 | `grafana/k6:2.3.0` |
| Bun | `oven/bun:1.4.2` |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |

O Alertmanager faz parte do projeto Prometheus e é a única imagem aqui que a lista de stack do repositório não cita: o Prometheus dispara alertas, mas não os entrega, então um alerta que "dispara e se resolve" para alguém precisa dele. Nenhuma biblioteca cliente de métricas é usada; o formato de exposição é escrito à mão porque isso faz parte da lição.

## Observações

- Os intervalos de scrape e de avaliação são de 2 segundos, e o Alertmanager espera 1 segundo antes da primeira notificação. Em produção os valores são de 15 a 60 segundos e de 30 segundos. Eles só deixam o laboratório rápido; não são uma recomendação.
- A regra de orçamento de erro olha a última hora porque o laboratório só tem minutos de dados. Uma real olha a janela inteira do objetivo (`[30d]`).
- Os tempos dos resultados dependem da máquina, mas só em alguns segundos: são dominados pelas janelas (`for: 10s`, e a janela de 1 minuto que precisa esvaziar antes de o alerta se resolver).
- Sem nenhuma requisição em uma janela, uma regra de razão grava `NaN` (0 / 0), e não 0. Isso acontece nos primeiros segundos do laboratório, antes de o tráfego normal ser coletado duas vezes. O alerta continua em silêncio, porque toda comparação com `NaN` é falsa, e o observador lê `NaN` como "ainda sem valor" (`sampleValue` em `ts/src/watch.ts`): guardado como número, ele transformaria todo pico em `NaN`.
- "Alerta pending ou disparando antes da carga" significa: um alerta ficou ativo enquanto o tráfego normal do próprio observador era o único tráfego que a loja tinha atendido. O observador responde isso lendo diretamente o counter de requisições da loja e subtraindo as requisições que ele mesmo enviou. A taxa dos últimos 10 segundos, que dá o momento "carga começou" da linha do tempo, atrasa uma ou duas coletas: uma fração de segundo de sobrecarga basta para deixar o alerta pending, então o alerta pode ser visto pending um segundo antes de a taxa cruzar a linha de "carga ligada". O observador imprime uma linha quando isso acontece.
