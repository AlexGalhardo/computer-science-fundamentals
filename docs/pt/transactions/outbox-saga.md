# Outbox e saga (MP-TX-4)

> English version: [docs/en/transactions/outbox-saga.md](../../en/transactions/outbox-saga.md)

Mini-projeto: [`projects/transactions/outbox-saga`](../../../projects/transactions/outbox-saga/README.pt-BR.md). Tópicos do quiz: `saga-outbox`, `idempotency`, `distributed-transactions-2pc`.

## O problema

Dentro de um banco, uma transação faz várias escritas darem certo ou falharem juntas. Com dois serviços e dois bancos não existe essa transação. O two-phase commit poderia coordená-los, mas ele acopla a disponibilidade de todos os participantes, bloqueia quando o coordenador falha, e a maioria dos brokers de mensagens não participa dele. A resposta usual é abrir mão da transação única e construir a consistência a partir de três garantias locais menores.

## 1. O bug do dual write

```ts
await db.commit(order);      // escrita 1: o banco
// <- o processo morre aqui
await broker.publish(event); // escrita 2: o broker
```

Dois sistemas, duas escritas, nada atômico em volta. Se o processo morrer entre as linhas, o pedido existe e o evento não: o serviço de pagamentos nunca fica sabendo e o pedido fica `PENDING` para sempre. Inverter a ordem não ajuda: publicar primeiro e cair, e o pagamento é cobrado por um pedido que nunca foi gravado.

O laboratório reproduz isso com uma queda de verdade. A requisição leva `crashAfterCommit`, e o serviço de pedidos chama `process.exit(1)` logo depois do commit. O Docker reinicia o serviço, e nada traz o evento de volta.

## 2. O outbox transacional

```sql
BEGIN;
INSERT INTO orders (...) VALUES (...);
INSERT INTO outbox (event_id, routing_key, payload) VALUES (...);
COMMIT;
```

O evento vira uma linha, gravada **na mesma transação** do pedido. Agora o banco garante "os dois ou nenhum". Um laço separado, o relay, seleciona as linhas não publicadas (`FOR UPDATE SKIP LOCKED`), publica cada uma, espera o broker confirmar e marca a linha como publicada.

Com a mesma queda, a linha do evento já está confirmada. Depois do reinício o relay a encontra e a publica. A queda atrasa o evento. Não consegue perdê-lo.

O relay pode morrer depois de publicar e antes de marcar a linha, e então publica o mesmo evento de novo. Por isso o outbox dá entrega **at-least-once**, não exactly-once.

## 3. O consumidor idempotente

Como duplicatas vão chegar, todo handler começa a sua transação com:

```sql
INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING;
```

Uma linha inserida significa "primeira vez": fazer o trabalho. Zero linhas significa "já vi": pular. A marca e a mudança de negócio são confirmadas juntas, então uma mensagem nunca fica processada pela metade. Entrega at-least-once mais um handler idempotente dá **efeitos** exactly-once, que é o que o negócio precisa. A entrega exactly-once em si não é alcançável no caso geral.

A mesma ideia protege a borda HTTP: um cliente que repete `POST /orders` com o mesmo cabeçalho `Idempotency-Key` recebe o pedido que já existe (`200`) em vez de um segundo.

## 4. A saga

Uma saga é uma transação de negócio feita de transações locais, uma por serviço, ligadas por eventos. Não há rollback global, então cada passo que pode falhar depois precisa de uma **compensação**: outra transação local que o desfaz semanticamente.

| Passo | Serviço | Transação local | Compensação |
| --- | --- | --- | --- |
| 1 | pedidos | criar o pedido como `PENDING`, emitir `OrderCreated` | cancelar o pedido |
| 2 | pagamentos | gravar o pagamento, emitir `PaymentCompleted` ou `PaymentFailed` | (último passo, não precisa) |
| 3 | pedidos | `PaymentCompleted`: marcar `PAID`. `PaymentFailed`: marcar `CANCELLED` | |

Esta é uma saga **coreografada**: sem coordenador central, cada serviço reage a eventos. A alternativa é a saga orquestrada, em que um componente diz a cada serviço o que fazer, mais fácil de acompanhar quando há muitos passos.

O que uma saga não dá é isolamento. Entre o passo 1 e o passo 3, outros leitores podem ver um pedido `PENDING` que ainda pode ser cancelado. O status `PENDING` é como o laboratório torna esse estado intermediário explícito em vez de fingir que ele não existe.

## Resultados

`docker compose run --rm demo` grava [`results/results.md`](../../../projects/transactions/outbox-saga/results/results.md): no caminho feliz os dois modos terminam com o pedido `PAID` e o pagamento `COMPLETED`. Com a queda, `dual-write` deixa o pedido `PENDING` sem pagamento, e `outbox` termina `PAID`. Um pagamento acima do limite falso termina com o pagamento `FAILED` e o pedido `CANCELLED`.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-TX-4.1 caminho feliz deixa os dois bancos consistentes | `tests/e2e.test.ts`, "happy path" |
| MP-TX-4.2 com uma queda entre a escrita e a publicação, o bug perde o evento e o outbox não | `tests/e2e.test.ts`, "crash injected between the database write and the publish" |
| MP-TX-4.3 um pagamento que falha cancela o pedido, de ponta a ponta | `tests/e2e.test.ts`, "saga with compensation" |

## Como rodar

```sh
cd projects/transactions/outbox-saga
./setup-unix-outbox-saga.sh        # ou ./setup-windows-outbox-saga.ps1
docker compose run --rm demo && docker compose down -v
```
