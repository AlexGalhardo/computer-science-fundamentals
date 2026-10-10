# outbox-saga

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cómo se mantienen consistentes dos servicios cuando cada uno tiene su propia base de datos y ninguna transacción puede cubrir a ambas? Este mini-proyecto ejecuta un servicio de pedidos y un servicio de pagos, cada uno con su propio PostgreSQL, que se comunican mediante RabbitMQ. Muestra el **bug de escritura doble** (hacer commit en la base de datos y luego publicar: una caída entre ambos pierde el evento), lo corrige con un **transactional outbox**, hace **idempotentes** a los consumidores y termina el flujo de negocio como una **saga con compensación**: un pago fallido cancela el pedido.

Código: MP-TX-4. Explicación completa: [docs/es/transactions/outbox-saga.md](../../../docs/es/transactions/outbox-saga.md).

```text
client -> order-service --(orders-db: orders + outbox)--> relay --> RabbitMQ --> payment-service --(payments-db)
              ^                                                                        |
              +----------- PaymentCompleted / PaymentFailed <--- relay <--- outbox ----+
```

## Resultados

Generados por `docker compose run --rm demo`, versionados en [results/results.md](results/results.md):

| Escenario | Modo | Pedido | Pago | El evento llegó al servicio de pagos |
| --- | --- | --- | --- | --- |
| camino feliz | `dual-write` | PAID | COMPLETED | sí |
| camino feliz | `outbox` | PAID | COMPLETED | sí |
| caída entre la escritura y la publicación | `dual-write` | PENDING | ninguno | **no, se perdió** |
| caída entre la escritura y la publicación | `outbox` | PAID | COMPLETED | sí |
| el pago falla | `outbox` | CANCELLED | FAILED | sí |

La caída es real: el servicio de pedidos llama a `process.exit(1)` justo después del commit y Docker lo reinicia.

## Temas del quiz que demuestra

- `transactions` / `saga-outbox`: escritura doble, transactional outbox, relay, saga coreografiada, compensación
- `transactions` / `idempotency`: entrega at-least-once, el consumidor idempotente con `processed_messages`, el encabezado `Idempotency-Key`
- `transactions` / `distributed-transactions-2pc`: el problema que resuelve el commit en dos fases, abordado aquí sin una transacción distribuida

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-outbox-saga.sh        # Linux y macOS
./setup-windows-outbox-saga.ps1    # Windows
```

El script construye la imagen, inicia las dos bases de datos, el broker y los dos servicios en una red interna, ejecuta las pruebas de extremo a extremo y elimina todo al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Ejecuta los cinco escenarios de la tabla, los imprime y reescribe `results/results.md`.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v
```

El contenedor ejecuta la verificación de tipos de TypeScript y luego `bun test`: pruebas unitarias y pruebas de extremo a extremo que hablan con los servicios en ejecución por HTTP y con el broker.

## API del laboratorio

| Servicio | Ruta | Qué hace |
| --- | --- | --- |
| order-service | `POST /orders` | Cuerpo `{ orderId, customerId, amountCents, mode, crashAfterCommit }`. `mode` es `outbox` (por defecto) o `dual-write`. Encabezado opcional `Idempotency-Key`. `201` creado, `200` repetido |
| order-service | `GET /orders/:id` | El pedido, con `status` `PENDING`, `PAID` o `CANCELLED` |
| payment-service | `GET /payments/:orderId` | El pago, `COMPLETED` o `FAILED` |
| ambos | `GET /stats` | Filas del outbox sin publicar (y duplicados omitidos, en el servicio de pagos) |

Los montos superiores a 500.00 (`50000` centavos) son rechazados por la regla de tarjeta falsa.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/orders.ts` | La creación de un pedido (escritura doble y outbox) y el paso de la saga que reacciona al pago |
| `ts/src/payments.ts` | El manejador idempotente de `OrderCreated` |
| `ts/src/shared/outbox.ts` | Inserción en el outbox, relay y la verificación de `processed_messages` |
| `ts/src/shared/broker.ts` | RabbitMQ: publisher confirms y acknowledgements manuales |
| `ts/src/shared/events.ts` | Los tres eventos y su schema |
| `ts/src/scenarios.ts`, `ts/src/demo.ts` | Los escenarios, usados por las pruebas y la demo |
| `results/` | Los resultados versionados |

## Versiones

| Componente | Versión |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| RabbitMQ | `rabbitmq:4.3.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| amqplib | 2.2.0 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
