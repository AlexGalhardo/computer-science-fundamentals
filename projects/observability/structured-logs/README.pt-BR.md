# structured-logs

> English version: [README.md](README.md)

Como seguir **uma requisição** por três serviços quando os logs dela estão misturados com os de todas as outras? Este mini-projeto roda o mesmo sistema duas vezes: uma gravando **logs JSON estruturados com um correlation id**, outra gravando **texto livre**. Uma requisição entra no `api`, vai para o `orders` por HTTP e chega ao `worker` por uma fila do RabbitMQ. Todas as linhas vão para o Loki, e então a mesma pergunta é feita às duas variantes: "mostre todas as linhas de log desta requisição".

Código: MP-OBS-2. Explicação completa: [docs/pt/observability/structured-logs.md](../../../docs/pt/observability/structured-logs.md).

```
cliente --X-Correlation-Id--> api --X-Correlation-Id--> orders --AMQP correlationId--> [fila] --> worker
                               |                          |                                         |
                               +--------------------------+----- linhas de log --> Loki <-----------+
```

## A mesma busca nas duas variantes

Saída real de `docker compose run --rm demo`, versionada em [results/results.md](results/results.md). As duas variantes receberam os mesmos 4 checkouts concorrentes, e cada requisição gravou 6 linhas (2 em cada serviço). A pergunta: todas as linhas da primeira requisição (alice, 2 x blue-pen).

**Estruturado (JSON), pelo correlation id: 6 de 6 linhas, dos três serviços.**

```logql
{format="json"} | json | correlation_id="req-json-1-9ef19148"
```

```text
{"customer":"alice","sku":"blue-pen","qty":2,"timestamp":"2026-10-08T01:40:47.437Z","level":"info","service":"api","message":"checkout received","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","customer":"alice","sku":"blue-pen","qty":2,"timestamp":"2026-10-08T01:40:47.439Z","level":"info","service":"orders","message":"order created","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","queue":"orders.json","timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"orders","message":"order queued","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"worker","message":"order picked up","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","status":201,"duration_ms":4,"timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"api","message":"checkout answered","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","customer":"alice","duration_ms":6,"timestamp":"2026-10-08T01:40:47.447Z","level":"info","service":"worker","message":"confirmation sent","correlation_id":"req-json-1-9ef19148"}
```

**Não estruturado (texto), pelo id do pedido, o único id que as frases têm: 3 de 6 linhas.** A porta de entrada (`api`) e o último passo do worker nunca escreveram o id do pedido, então não são encontrados.

```logql
{format="text"} |= "ord-1ed68350"
```

```text
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [orders] order ord-1ed68350 sent to queue
2026-10-08 01:40:47 INFO [worker] Processing ord-1ed68350
```

**Não estruturado (texto), pelo nome do cliente, para alcançar as frases que faltam: 6 linhas de 2 requisições diferentes.** A Alice comprou duas vezes, e nada nas linhas diz qual é qual.

```logql
{format="text"} |= "alice"
```

```text
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 1 x red-pen
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 2 x blue-pen
2026-10-08 01:40:47 INFO [orders] Created order ord-60eb4168 (alice, 1 x red-pen)
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
```

| | JSON estruturado | Texto livre |
| --- | --- | --- |
| Consulta | `\| json \| correlation_id="..."` | `\|= "trecho"` |
| Linhas da requisição encontradas | 6 de 6 | 3 de 6 pelo id do pedido |
| Linhas de outras requisições | nenhuma | misturadas ao buscar pelo cliente |
| Atravessa a fila | sim, as linhas do worker carregam o id | só onde uma frase repete o id do pedido |
| Outras perguntas (`duration_ms > 500`, `level="error"`) | um filtro por campo | uma regex nova por frase |

## O que ensina

- Um **log estruturado** é um objeto JSON por linha: chaves fixas (`timestamp` em UTC no formato ISO 8601, `level`, `service`, `message`) mais um campo por valor. Uma máquina o filtra por campo; texto livre exige uma regex frágil por frase.
- Um **correlation id** é criado na borda (ou aceito de quem chamou, quando válido), escrito em toda linha e devolvido no cabeçalho da resposta.
- **Propagação**: por HTTP no cabeçalho `X-Correlation-Id`, e pela fila na propriedade `correlationId` da mensagem AMQP. Se um salto o esquece, o rastro acaba ali.
- O **`AsyncLocalStorage`** mantém o id da requisição atual através dos `await`, então o logger o acrescenta sem que toda função o receba como parâmetro.
- **Labels do Loki são para baixa cardinalidade** (`service`, `format`). O correlation id fica dentro da linha: como label, criaria um stream por requisição.
- O id vem de fora, então é **validado** antes de chegar a uma linha de log ou a uma consulta (log injection).

## Tópicos do quiz que ele demonstra

- `observability` / `structured-logs`: JSON contra texto livre, correlation id, campos do log, o que vai em um label do Loki, filtros LogQL
- `observability` / `three-signals`: no que logs são bons (o detalhe de uma requisição) e quanto custam
- `observability` / `distributed-tracing`: propagação de contexto por cabeçalhos HTTP e por uma fila de mensagens
- `observability` / `prometheus-grafana-loki-tempo`: o Loki indexa só labels; seletor de stream, filtro de linha e `| json` do LogQL

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-structured-logs.sh        # Linux e macOS
./setup-windows-structured-logs.ps1    # Windows
```

O script constrói a imagem, roda os testes unitários sem rede, sobe as duas variantes dos três serviços com o broker e o Loki em uma rede interna, roda o teste de ponta a ponta e remove tudo no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Manda os quatro checkouts às duas variantes, imprime as três buscas acima e reescreve `results/results.md`.

## Testes

```sh
docker compose run --rm ts-test     # checagem de tipos + 18 testes unitários, sem rede
docker compose run --rm e2e-test    # 7 testes de ponta a ponta contra a pilha rodando
docker compose down -v
```

- Unitários: os dois formatos, validação e geração do id, o `AsyncLocalStorage` separando requisições intercaladas, o id atravessando uma fila falsa, o corpo do push para o Loki, a montagem das consultas.
- Ponta a ponta (MP-OBS-2.1): quatro requisições concorrentes por variante; **uma única consulta LogQL** devolve as 6 linhas de uma requisição, dos três serviços, e nenhuma linha de outra requisição. Para contraste, a busca em texto pelo id do pedido acha 3 de 6 linhas, e a busca pelo cliente mistura duas requisições.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/correlation.ts` | Validação e geração do id, e o `AsyncLocalStorage` que o carrega |
| `ts/src/logger.ts` | Um logger, dois formatos: `formatJson` e `formatText` |
| `ts/src/shipper.ts` | Agrupa as linhas em lotes e as envia ao Loki (`POST /loki/api/v1/push`) |
| `ts/src/broker.ts` | RabbitMQ: o id viaja na propriedade `correlationId` da mensagem |
| `ts/src/apps.ts` | Os três serviços como funções: `apiApp`, `ordersApp`, `workerHandler` |
| `ts/src/api.ts`, `orders.ts`, `worker.ts`, `runtime.ts` | Pontos de entrada e inicialização comum |
| `ts/src/lab.ts`, `ts/src/demo.ts` | O cenário, o cliente de consultas do Loki e a demo |
| `ts/tests/` | `unit.test.ts` e `e2e.test.ts` |
| `config/loki.yaml` | Loki em um único processo, sem envio de estatísticas de uso |
| `docker-compose.yml` | As duas variantes, o broker e o Loki em uma rede interna, sem porta publicada |

## Versões fixadas

| O quê | Versão |
| --- | --- |
| `oven/bun` | 1.4.2 |
| `grafana/loki` | 3.7.8 |
| `rabbitmq` | 4.3.6-alpine |
| `amqplib` / `@types/amqplib` | 2.2.0 / 0.10.8 |
| `zod` | 4.6.5 |
| `typescript` / `@types/bun` | 7.0.2 / 1.4.2 |

Todas estão na stack do repositório; nenhuma outra dependência foi adicionada.

## Limites do laboratório

- O shipper fica dentro do processo para manter o laboratório pequeno. Em produção o serviço escreve em stdout e um agente (Grafana Alloy, OpenTelemetry Collector) acompanha a saída e a envia.
- Um correlation id liga linhas de log. Ele não registra pai e filho nem a duração de cada etapa: isso é o que um trace faz (veja [three-signals](../three-signals/README.pt-BR.md)).
- Tudo é local: rede interna, nenhuma porta publicada, envio de estatísticas desligado no Loki, credenciais falsas.
