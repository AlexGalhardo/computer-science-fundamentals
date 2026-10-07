# Outbox and saga (MP-TX-4)

> Versão em português: [docs/pt/transactions/outbox-saga.md](../../pt/transactions/outbox-saga.md)

Mini-project: [`projects/transactions/outbox-saga`](../../../projects/transactions/outbox-saga/README.md). Quiz topics: `saga-outbox`, `idempotency`, `distributed-transactions-2pc`.

## The problem

Inside one database, a transaction makes several writes succeed or fail together. With two services and two databases there is no such transaction. Two-phase commit could coordinate them, but it couples the availability of every participant, blocks when the coordinator fails, and most message brokers do not take part in it. The usual answer is to give up the single transaction and build consistency from three smaller, local guarantees.

## 1. The dual-write bug

```ts
await db.commit(order);      // write 1: the database
// <- the process dies here
await broker.publish(event); // write 2: the broker
```

Two systems, two writes, nothing atomic around them. If the process dies between the lines, the order exists and the event does not: the payment service never hears about it and the order stays `PENDING` forever. Reversing the order does not help: publish first and crash, and the payment is charged for an order that was never stored.

The lab reproduces this with a real crash. The request carries `crashAfterCommit`, and the order service calls `process.exit(1)` right after the commit. Docker restarts the service, and nothing brings the event back.

## 2. The transactional outbox

```sql
BEGIN;
INSERT INTO orders (...) VALUES (...);
INSERT INTO outbox (event_id, routing_key, payload) VALUES (...);
COMMIT;
```

The event becomes a row, written **in the same transaction** as the order. The database now guarantees "both or neither". A separate loop, the relay, selects the unpublished rows (`FOR UPDATE SKIP LOCKED`), publishes each one, waits for the broker to confirm, and marks the row as published.

With the same crash, the event row is already committed. After the restart the relay finds it and publishes it. The crash delays the event. It cannot lose it.

The relay can die after publishing and before marking the row, and then it publishes the same event again. So the outbox gives **at-least-once** delivery, not exactly-once.

## 3. The idempotent consumer

Because duplicates will arrive, every handler starts its transaction with:

```sql
INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING;
```

One row inserted means "first time": do the work. Zero rows means "seen before": skip. The mark and the business change commit together, so a message is never half processed. At-least-once delivery plus an idempotent handler gives exactly-once **effects**, which is what the business needs. Exactly-once delivery itself is not achievable in general.

The same idea protects the HTTP edge: a client that retries `POST /orders` with the same `Idempotency-Key` header gets the order that already exists (`200`) instead of a second one.

## 4. The saga

A saga is a business transaction made of local transactions, one per service, linked by events. There is no global rollback, so each step that can fail later needs a **compensation**: another local transaction that semantically undoes it.

| Step | Service | Local transaction | Compensation |
| --- | --- | --- | --- |
| 1 | order | create the order as `PENDING`, emit `OrderCreated` | cancel the order |
| 2 | payment | store the payment, emit `PaymentCompleted` or `PaymentFailed` | (last step, none needed) |
| 3 | order | `PaymentCompleted`: mark `PAID`. `PaymentFailed`: mark `CANCELLED` | |

This is a **choreographed** saga: no central coordinator, each service reacts to events. The alternative is an orchestrated saga, where one component tells each service what to do, which is easier to follow when there are many steps.

What a saga does not give is isolation. Between step 1 and step 3 other readers can see a `PENDING` order that may still be cancelled. The `PENDING` status is how the lab makes that intermediate state explicit instead of pretending it does not exist.

## Results

`docker compose run --rm demo` writes [`results/results.md`](../../../projects/transactions/outbox-saga/results/results.md): on the happy path both modes end with the order `PAID` and the payment `COMPLETED`. With the crash, `dual-write` leaves the order `PENDING` with no payment, and `outbox` ends `PAID`. A payment above the fake limit ends with the payment `FAILED` and the order `CANCELLED`.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-TX-4.1 happy path leaves both databases consistent | `tests/e2e.test.ts`, "happy path" |
| MP-TX-4.2 with a crash between the write and the publish, the bug loses the event and the outbox does not | `tests/e2e.test.ts`, "crash injected between the database write and the publish" |
| MP-TX-4.3 a failed payment cancels the order, end to end | `tests/e2e.test.ts`, "saga with compensation" |

## Run

```sh
cd projects/transactions/outbox-saga
./setup-unix-outbox-saga.sh        # or ./setup-windows-outbox-saga.ps1
docker compose run --rm demo && docker compose down -v
```
