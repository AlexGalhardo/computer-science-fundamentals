# Outbox y saga (MP-TX-4)

> English version: [docs/en/transactions/outbox-saga.md](../../en/transactions/outbox-saga.md) · Versão em português: [docs/pt/transactions/outbox-saga.md](../../pt/transactions/outbox-saga.md)

Mini-proyecto: [`projects/transactions/outbox-saga`](../../../projects/transactions/outbox-saga/README.es.md). Temas del quiz: `saga-outbox`, `idempotency`, `distributed-transactions-2pc`.

## El problema

Dentro de una base de datos, una transacción hace que varias escrituras tengan éxito o fallen juntas. Con dos servicios y dos bases de datos no existe tal transacción. El commit en dos fases podría coordinarlas, pero acopla la disponibilidad de cada participante, se bloquea cuando falla el coordinador, y la mayoría de los brokers de mensajes no participan en él. La respuesta habitual es renunciar a la transacción única y construir la consistencia a partir de tres garantías locales más pequeñas.

## 1. El bug de la escritura doble

```ts
await db.commit(order);      // write 1: the database
// <- the process dies here
await broker.publish(event); // write 2: the broker
```

Dos sistemas, dos escrituras, nada atómico a su alrededor. Si el proceso muere entre las líneas, el pedido existe y el evento no: el servicio de pagos nunca se entera y el pedido se queda en `PENDING` para siempre. Invertir el orden no ayuda: publicar primero y caer, y se cobra un pago por un pedido que nunca se guardó.

El laboratorio reproduce esto con una caída real. La petición lleva `crashAfterCommit`, y el servicio de pedidos llama a `process.exit(1)` justo después del commit. Docker reinicia el servicio, y nada devuelve el evento.

## 2. El transactional outbox

```sql
BEGIN;
INSERT INTO orders (...) VALUES (...);
INSERT INTO outbox (event_id, routing_key, payload) VALUES (...);
COMMIT;
```

El evento se convierte en una fila, escrita **en la misma transacción** que el pedido. Ahora la base de datos garantiza "ambos o ninguno". Un bucle separado, el relay, selecciona las filas sin publicar (`FOR UPDATE SKIP LOCKED`), publica cada una, espera a que el broker confirme y marca la fila como publicada.

Con la misma caída, la fila del evento ya está confirmada. Tras el reinicio el relay la encuentra y la publica. La caída retrasa el evento. No puede perderlo.

El relay puede morir después de publicar y antes de marcar la fila, y entonces publica el mismo evento otra vez. Así que el outbox da una entrega **at-least-once**, no exactly-once.

## 3. El consumidor idempotente

Como llegarán duplicados, todo manejador comienza su transacción con:

```sql
INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING;
```

Una fila insertada significa "primera vez": haz el trabajo. Cero filas significa "ya visto": omite. La marca y el cambio de negocio se confirman juntos, así que un mensaje nunca queda procesado a medias. La entrega at-least-once más un manejador idempotente da **efectos** exactly-once, que es lo que el negocio necesita. La entrega exactly-once en sí no es alcanzable en general.

La misma idea protege el borde HTTP: un cliente que reintenta `POST /orders` con el mismo encabezado `Idempotency-Key` recibe el pedido que ya existe (`200`) en lugar de un segundo pedido.

## 4. La saga

Una saga es una transacción de negocio hecha de transacciones locales, una por servicio, enlazadas por eventos. No hay rollback global, así que cada paso que pueda fallar más tarde necesita una **compensación**: otra transacción local que lo deshace semánticamente.

| Paso | Servicio | Transacción local | Compensación |
| --- | --- | --- | --- |
| 1 | order | crear el pedido como `PENDING`, emitir `OrderCreated` | cancelar el pedido |
| 2 | payment | guardar el pago, emitir `PaymentCompleted` o `PaymentFailed` | (último paso, no hace falta ninguna) |
| 3 | order | `PaymentCompleted`: marcar `PAID`. `PaymentFailed`: marcar `CANCELLED` | |

Esta es una saga **coreografiada**: sin coordinador central, cada servicio reacciona a eventos. La alternativa es una saga orquestada, donde un componente le dice a cada servicio qué hacer, lo que es más fácil de seguir cuando hay muchos pasos.

Lo que una saga no da es aislamiento. Entre el paso 1 y el paso 3 otros lectores pueden ver un pedido `PENDING` que todavía puede cancelarse. El estado `PENDING` es la forma en que el laboratorio hace explícito ese estado intermedio en lugar de fingir que no existe.

## Resultados

`docker compose run --rm demo` escribe [`results/results.md`](../../../projects/transactions/outbox-saga/results/results.md): en el camino feliz ambos modos terminan con el pedido `PAID` y el pago `COMPLETED`. Con la caída, `dual-write` deja el pedido en `PENDING` sin pago, y `outbox` termina en `PAID`. Un pago por encima del límite falso termina con el pago `FAILED` y el pedido `CANCELLED`.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-TX-4.1 el camino feliz deja ambas bases de datos consistentes | `tests/e2e.test.ts`, "happy path" |
| MP-TX-4.2 con una caída entre la escritura y la publicación, el bug pierde el evento y el outbox no | `tests/e2e.test.ts`, "crash injected between the database write and the publish" |
| MP-TX-4.3 un pago fallido cancela el pedido, de extremo a extremo | `tests/e2e.test.ts`, "saga with compensation" |

## Ejecución

```sh
cd projects/transactions/outbox-saga
./setup-unix-outbox-saga.sh        # o ./setup-windows-outbox-saga.ps1
docker compose run --rm demo && docker compose down -v
```
