# outbox-saga

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Como dois serviços ficam consistentes quando cada um tem o seu banco e nenhuma transação cobre os dois? Este mini-projeto roda um serviço de pedidos e um serviço de pagamentos, cada um com o seu PostgreSQL, conversando pelo RabbitMQ. Ele mostra o **bug do dual write** (confirmar no banco, depois publicar: uma queda no meio perde o evento), corrige com um **outbox transacional**, torna os consumidores **idempotentes**, e fecha o fluxo de negócio como uma **saga com compensação**: um pagamento que falha cancela o pedido.

Código: MP-TX-4. Explicação completa: [docs/pt/transactions/outbox-saga.md](../../../docs/pt/transactions/outbox-saga.md).

```text
cliente -> order-service --(orders-db: orders + outbox)--> relay --> RabbitMQ --> payment-service --(payments-db)
               ^                                                                        |
               +----------- PaymentCompleted / PaymentFailed <--- relay <--- outbox ----+
```

## Resultados

Gerados por `docker compose run --rm demo`, versionados em [results/results.md](results/results.md):

| Cenário | Modo | Pedido | Pagamento | O evento chegou ao serviço de pagamentos |
| --- | --- | --- | --- | --- |
| caminho feliz | `dual-write` | PAID | COMPLETED | sim |
| caminho feliz | `outbox` | PAID | COMPLETED | sim |
| queda entre a escrita e a publicação | `dual-write` | PENDING | nenhum | **não, perdido** |
| queda entre a escrita e a publicação | `outbox` | PAID | COMPLETED | sim |
| pagamento falha | `outbox` | CANCELLED | FAILED | sim |

A queda é de verdade: o serviço de pedidos chama `process.exit(1)` logo depois do commit e o Docker o reinicia.

## Tópicos do quiz que ele demonstra

- `transactions` / `saga-outbox`: dual write, outbox transacional, relay, saga coreografada, compensação
- `transactions` / `idempotency`: entrega at-least-once, o consumidor idempotente com `processed_messages`, o cabeçalho `Idempotency-Key`
- `transactions` / `distributed-transactions-2pc`: o problema que o two-phase commit resolve, tratado aqui sem transação distribuída

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-outbox-saga.sh        # Linux e macOS
./setup-windows-outbox-saga.ps1    # Windows
```

O script constrói a imagem, sobe os dois bancos, o broker e os dois serviços em uma rede interna, roda os testes de ponta a ponta e remove tudo no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Roda os cinco cenários da tabela, mostra o resultado e reescreve `results/results.md`.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v
```

O contêiner roda a checagem de tipos do TypeScript e depois `bun test`: testes unitários, e testes de ponta a ponta que falam com os serviços em execução por HTTP e com o broker.

## API do laboratório

| Serviço | Rota | O que faz |
| --- | --- | --- |
| order-service | `POST /orders` | Corpo `{ orderId, customerId, amountCents, mode, crashAfterCommit }`. `mode` é `outbox` (padrão) ou `dual-write`. Cabeçalho opcional `Idempotency-Key`. `201` criado, `200` repetido |
| order-service | `GET /orders/:id` | O pedido, com `status` `PENDING`, `PAID` ou `CANCELLED` |
| payment-service | `GET /payments/:orderId` | O pagamento, `COMPLETED` ou `FAILED` |
| ambos | `GET /stats` | Linhas do outbox ainda não publicadas (e duplicatas ignoradas, no serviço de pagamentos) |

Valores acima de 500,00 (`50000` centavos) são recusados pela regra do cartão falso.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/orders.ts` | Criação do pedido (dual write e outbox) e o passo da saga que reage ao pagamento |
| `ts/src/payments.ts` | O handler idempotente de `OrderCreated` |
| `ts/src/shared/outbox.ts` | Insert no outbox, relay, e a checagem em `processed_messages` |
| `ts/src/shared/broker.ts` | RabbitMQ: confirmação de publicação e acks manuais |
| `ts/src/shared/events.ts` | Os três eventos e o seu schema |
| `ts/src/scenarios.ts`, `ts/src/demo.ts` | Os cenários, usados pelos testes e pela demo |
| `results/` | Os resultados versionados |

## Versões

| Componente | Versão |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| RabbitMQ | `rabbitmq:4.3.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| amqplib | 2.2.0 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
