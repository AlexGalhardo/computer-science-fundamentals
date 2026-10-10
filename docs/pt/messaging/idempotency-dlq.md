# Idempotência e dead-letter queue (MP-MSG-2)

> English version: [docs/en/messaging/idempotency-dlq.md](../../en/messaging/idempotency-dlq.md) · Versión en español: [docs/es/messaging/idempotency-dlq.md](../../es/messaging/idempotency-dlq.md)

Mini-projeto: [`projects/messaging/idempotency-dlq`](../../../projects/messaging/idempotency-dlq/README.pt-BR.md). Tópicos do quiz: `idempotent-consumers`, `ack-retry-dlq`, `delivery-guarantees`, `rabbitmq-exchanges-routing`.

## O problema

Um broker que nunca perde uma mensagem precisa, às vezes, entregá-la duas vezes. Quando uma confirmação não chega, o broker não distingue "o consumidor morreu antes do trabalho" de "o consumidor fez o trabalho e morreu antes de avisar", e entrega de novo. Produtores fazem o mesmo quando uma confirmação se perde. Então um consumidor vê dois tipos de problema que nenhuma configuração elimina:

- **Duplicatas**: a mesma mensagem mais de uma vez.
- **Veneno**: uma mensagem que falha todas as vezes, e que a reentrega transforma em um laço sem fim.

## 1. O estrago, medido

O efeito neste laboratório é um crédito: `balance = balance + amount`. É uma atualização relativa, então não é idempotente. Toda mensagem é publicada duas vezes, e o consumidor perde a confirmação de 20% das entregas depois de confirmar o efeito no banco.

```ts
await credit(payment);   // o efeito é confirmado no banco
// <- a confirmação ao broker se perde aqui
channel.ack(message);
```

O consumidor ingênuo aplica um efeito por entrega: 1.000 mensagens viraram 2.521 créditos. Nada caiu e nenhum erro foi registrado. Esse silêncio é o que torna o bug caro.

## 2. O armazenamento de chaves de idempotência

Cada mensagem carrega um id escolhido uma vez pelo produtor. O consumidor o registra **na mesma transação** do efeito:

```sql
BEGIN;
INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT DO NOTHING;
-- 0 linhas inseridas: é uma duplicata, pare aqui
UPDATE accounts SET balance_cents = balance_cents + $2 WHERE id = $3;
COMMIT;
```

Por que cada detalhe importa:

| Detalhe | Sem ele |
| --- | --- |
| Chave primária em `message_id` | Duas cópias chegando juntas passam por uma checagem com `SELECT` e as duas aplicam (checar e depois agir) |
| Mesma transação do efeito | Uma queda deixa "marcada mas não aplicada" (o efeito se perde de vez) ou "aplicada mas não marcada" (é aplicado de novo) |
| Id escolhido pelo produtor | Um delivery tag do broker ou um timestamp muda a cada entrega, então nenhuma duplicata jamais coincidiria |

Com o armazenamento, as mesmas 2.521 entregas produziram exatamente 1.000 efeitos. A entrega continuou at-least-once; o **efeito** passou a ser exactly-once.

### A mesma corrida em Go

O lado Go tira o broker e o banco para isolar a concorrência. O `RacyStore` checa e marca em dois passos, cada um sob um mutex. Não há data race e o `go test -race` fica calado, mas duas goroutines segurando o mesmo id podem passar as duas pela checagem. Um teste abre essa janela com um gancho e obtém dois efeitos todas as vezes. O `AtomicStore` faz a checagem, o efeito e a marca em uma única seção crítica, que é o que a transação de banco faz em TypeScript.

A lição a guardar: um lock em volta de cada passo não é um lock em volta da decisão.

## 3. Retentativa com backoff

Uma mensagem que falhou não é repetida na hora. Uma dependência fora do ar não ganha nada em ser chamada de novo um milissegundo depois, e uma mensagem que sempre falha giraria tão rápido quanto o consumidor consegue falhar. A espera dobra a cada falha:

```text
espera depois da tentativa n que falhou = base x 2^(n-1)      base 200 ms: 200, 400, 800 ms
```

O RabbitMQ não tem "entregue depois", então o atraso é montado com dois recursos:

- uma fila de espera com **TTL** e sem consumidor;
- uma **dead-letter exchange** nessa fila apontando de volta para a exchange de trabalho.

O consumidor publica a mensagem que falhou na fila de espera da sua tentativa, com o cabeçalho `x-attempt` incrementado, e depois confirma a original. Quando o TTL acaba, o RabbitMQ devolve a mensagem por dead-letter à fila de trabalho.

Há uma fila de espera por degrau de backoff porque o RabbitMQ só expira mensagens na cabeça de uma fila: uma mensagem de 200 ms atrás de uma de 800 ms esperaria 800 ms. E a fila de espera define `x-dead-letter-routing-key`: sem isso a mensagem mantém a routing key com que foi publicada, não casa com nenhum binding e é descartada em silêncio. Esse erro foi cometido durante a construção deste laboratório, e o teste o pegou.

## 4. A dead-letter queue

Quando as tentativas acabam, o consumidor rejeita a mensagem sem requeue. A fila de trabalho tem a sua dead-letter exchange, então a mensagem vai para a dead-letter queue com um cabeçalho `x-death` registrando o motivo. Lá ela não atrasa mais as mensagens saudáveis, e espera por uma pessoa.

Nem toda falha merece as retentativas. O consumidor separa:

- falhas **transitórias** (o handler lançou erro): repetidas com backoff;
- falhas **permanentes** (o payload não passa no schema): vão para a dead-letter de imediato, porque nenhuma espera torna válida uma mensagem inválida.

Na execução versionada a mensagem envenenada foi tentada 4 vezes, com esperas de 203, 403 e 803 ms, e depois foi para a dead-letter; a malformada foi direto para lá na tentativa 1; as 20 mensagens saudáveis foram todas aplicadas.

## O que levar daqui

- Entrega at-least-once mais um consumidor idempotente é como "exatamente uma vez" se constrói na prática.
- A marca de deduplicação e o efeito precisam ser confirmados juntos. Dois armazenamentos não conseguem isso.
- Repita depois e com espera crescente, um número limitado de vezes, e então mande para a dead-letter.
- Classifique o erro antes de repetir: transitório ou permanente.
