# Logs estruturados e correlation id (MP-OBS-2)

> English version: [docs/en/observability/structured-logs.md](../../en/observability/structured-logs.md)

Mini-projeto: [`projects/observability/structured-logs`](../../../projects/observability/structured-logs/README.pt-BR.md). Tópicos do quiz: `structured-logs`, `three-signals`, `distributed-tracing`, `prometheus-grafana-loki-tempo`.

## O problema

Um checkout passa por três serviços: o `api` o recebe, o `orders` cria o pedido, e o `worker` o retira de uma fila e envia a confirmação. Cada serviço grava o seu próprio log, e a qualquer momento dezenas de requisições estão em andamento, então as linhas ficam intercaladas. Quando um cliente reclama, a pergunta é simples, "o que aconteceu com esta requisição?", e os logs precisam respondê-la.

## 1. Texto livre: escrito para pessoas

```text
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 2 x blue-pen
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
```

Cada linha é uma frase que fez sentido para quem a digitou. Daí vêm três problemas:

- **Não há chave comum.** A primeira linha não tem id de pedido (ele ainda não existe), a última o esqueceu. Uma busca pelo id do pedido acha 3 das 6 linhas da requisição.
- **As chaves que sobram são ambíguas.** O nome do cliente alcança as outras linhas, mas a Alice comprou duas vezes, e as linhas das duas compras voltam misturadas.
- **Cada pergunta exige uma regex nova.** "Requisições mais lentas que 500 ms" significa extrair um número do meio de uma frase, com um padrão que quebra quando alguém muda a redação.

## 2. Estruturado: escrito para máquinas

```json
{"order_id":"ord-1244c436","status":201,"duration_ms":4,"timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"api","message":"checkout answered","correlation_id":"req-json-1-9ef19148"}
```

Um objeto JSON por linha. As regras usadas no laboratório:

- **Chaves fixas em toda linha**: `timestamp` (UTC, ISO 8601, para que linhas de máquinas em fusos diferentes ordenem como texto puro), `level`, `service`, `message`, `correlation_id`.
- **`message` é um nome constante do evento**, nunca uma frase com valores dentro. Os valores vão em campos: `order_id`, `duration_ms`, `status`.
- **Um campo, um significado, um tipo** em todos os serviços: `duration_ms` é sempre um número de milissegundos.
- **Sem segredos e sem dados pessoais.** Um log é copiado, indexado e guardado por muito tempo.

Agora uma pergunta é um filtro sobre um campo, e continua funcionando quando a redação de uma mensagem muda.

## 3. O correlation id

Um correlation id é um valor compartilhado por tudo que uma requisição causa.

```ts
const correlationId = correlationIdFrom(request.headers.get("x-correlation-id"));
return runWithCorrelation(correlationId, async () => {
	const response = await handler();
	response.headers.set("x-correlation-id", correlationId);
	return response;
});
```

- Ele é **criado na borda**, ou aceito de quem chamou quando é válido, para que uma cadeia iniciada antes continue.
- Ele é **validado** (`^[A-Za-z0-9._-]{8,64}$`). O valor vem de fora: uma quebra de linha nele forjaria uma linha de log (log injection), e uma aspa mudaria uma consulta montada com ele.
- Ele é **devolvido no cabeçalho da resposta**, para que quem chamou possa citá-lo em um relato de erro.

### Levando o id dentro do processo

Passar o id como parâmetro para toda função não escala. O `AsyncLocalStorage` é uma variável presa a uma cadeia de chamadas assíncronas: qualquer código alcançado por `await` lê o id da sua própria requisição, mesmo com outras requisições intercaladas na mesma thread. O logger o lê dali, então o código que registra logs nunca menciona o id.

### Levando o id entre processos

O id precisa sair do processo junto com o trabalho, e cada transporte tem o seu lugar para metadados:

| Salto | Onde o id viaja |
| --- | --- |
| `api` -> `orders` (HTTP) | o cabeçalho `X-Correlation-Id` da requisição |
| `orders` -> `worker` (RabbitMQ) | a propriedade `correlationId` da mensagem AMQP |

```ts
channel.sendToQueue(queue, body, { correlationId: currentCorrelationId() });
// ... depois, em outro processo:
const correlationId = correlationIdFrom(message.properties.correlationId);
runWithCorrelation(correlationId, () => handler(payload));
```

A fila é onde os rastros costumam quebrar: o worker roda depois, em outro processo, sem nenhuma requisição HTTP de onde ler um cabeçalho. Se quem publica não anexa o id, ou quem consome não o restaura, as linhas do worker não pertencem a nenhuma requisição.

## 4. Encontrando a requisição: LogQL

O Loki indexa só os **labels** de um stream, não o conteúdo das linhas. Uma consulta primeiro escolhe streams por label e depois filtra as linhas deles:

```logql
{format="json"} | json | correlation_id="req-json-1-9ef19148"
```

| Parte | O que faz |
| --- | --- |
| `{format="json"}` | seletor de stream: usa o índice |
| `\| json` | interpreta cada linha e transforma as chaves em campos |
| `correlation_id="..."` | mantém as linhas cujo campo tem esse valor |

Em texto livre a melhor ferramenta é o filtro de linha, que mantém as linhas que contêm um trecho:

```logql
{format="text"} |= "ord-1ed68350"
```

O teste de ponta a ponta manda quatro checkouts concorrentes a cada variante e confere as duas: a consulta JSON devolve as 6 linhas de uma requisição, dos três serviços, e nenhuma linha de outra requisição; a busca em texto devolve 3 de 6.

### Por que o id não é um label

Cada combinação distinta de valores de label é um stream separado, com a sua entrada no índice e os seus chunks. Por isso um label precisa ter poucos valores possíveis: `service`, `format`, um ambiente. Um correlation id tem um valor por requisição: como label, criaria milhões de streams minúsculos e deixaria o Loki lento e caro. Valores de alta cardinalidade ficam na linha e são filtrados na hora da consulta.

## 5. Como as linhas chegam ao Loki

No laboratório cada serviço tem um pequeno shipper que agrupa as linhas em lotes e as envia para `POST /loki/api/v1/push`, tentando de novo enquanto o Loki inicia. Isso mantém o laboratório em uma única imagem. Em produção o serviço só escreve em stdout, e um agente de fora (Grafana Alloy, OpenTelemetry Collector) acompanha a saída e a envia, de modo que um armazenamento de logs lento não consegue atrasar a aplicação.

## O que um correlation id não é

Ele agrupa linhas; não diz qual etapa chamou qual, nem quanto tempo cada uma levou. Essa estrutura (spans pai e filho, com durações) é um **trace**, e o id que faz esse papel ali é o trace id, propagado no cabeçalho W3C `traceparent`. Veja [three-signals](three-signals.md), em que as linhas de log carregam o trace id e um clique leva de uma linha ao seu trace.

## Como rodar

```sh
cd projects/observability/structured-logs
./setup-unix-structured-logs.sh     # ou ./setup-windows-structured-logs.ps1
docker compose run --rm demo        # a mesma busca nas duas variantes
docker compose down -v
```
