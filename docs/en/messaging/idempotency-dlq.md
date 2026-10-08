# Idempotency and dead-letter queue (MP-MSG-2)

> Versão em português: [docs/pt/messaging/idempotency-dlq.md](../../pt/messaging/idempotency-dlq.md)

Mini-project: [`projects/messaging/idempotency-dlq`](../../../projects/messaging/idempotency-dlq/README.md). Quiz topics: `idempotent-consumers`, `ack-retry-dlq`, `delivery-guarantees`, `rabbitmq-exchanges-routing`.

## The problem

A broker that never loses a message must sometimes deliver it twice. When an acknowledgement does not arrive, the broker cannot tell "the consumer died before the work" from "the consumer did the work and died before saying so", and it delivers again. Producers do the same when a confirmation is lost. So a consumer sees two kinds of trouble that no configuration removes:

- **Duplicates**: the same message more than once.
- **Poison**: a message that fails every time, and that redelivery turns into an endless loop.

## 1. The damage, measured

The effect in this lab is a credit: `balance = balance + amount`. It is a relative update, so it is not idempotent. Every message is published twice, and the consumer loses the acknowledgement of 20% of the deliveries after committing the effect.

```ts
await credit(payment);   // the effect is committed
// <- the acknowledgement is lost here
channel.ack(message);
```

The naive consumer applies one effect per delivery: 1,000 messages became 2,521 credits. Nothing crashed and no error was logged. That silence is what makes the bug expensive.

## 2. The idempotency key store

Each message carries an id chosen once by the producer. The consumer records it **in the same transaction** as the effect:

```sql
BEGIN;
INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT DO NOTHING;
-- 0 rows inserted: a duplicate, stop here
UPDATE accounts SET balance_cents = balance_cents + $2 WHERE id = $3;
COMMIT;
```

Why each detail matters:

| Detail | Without it |
| --- | --- |
| Primary key on `message_id` | Two copies arriving together both pass a `SELECT` check and both apply (check-then-act) |
| Same transaction as the effect | A crash leaves "marked but not applied" (the effect is lost for good) or "applied but not marked" (it is applied again) |
| Id chosen by the producer | A broker delivery tag or a timestamp changes on every delivery, so no duplicate would ever match |

With the store, the same 2,521 deliveries produced exactly 1,000 effects. Delivery stayed at-least-once; the **effect** became exactly-once.

### The same race in Go

The Go side removes the broker and the database to isolate the concurrency. `RacyStore` checks and marks in two steps, each under a mutex. There is no data race and `go test -race` is silent, yet two goroutines holding the same id can both pass the check. A test opens that window with a hook and gets two effects every time. `AtomicStore` does check, effect and mark in one critical section, which is what the database transaction does in TypeScript.

The lesson to keep: a lock around each step is not a lock around the decision.

## 3. Retry with backoff

A failed message is not retried at once. A dependency that is down gains nothing from being called again a millisecond later, and a message that will always fail would spin as fast as the consumer can fail. The wait doubles after each failure:

```
wait after failed attempt n = base x 2^(n-1)      base 200 ms: 200, 400, 800 ms
```

RabbitMQ has no "deliver later", so the delay is built from two features:

- a waiting queue with a **TTL** and no consumer;
- a **dead-letter exchange** on that queue pointing back to the work exchange.

The consumer publishes the failed message to the waiting queue of its attempt, with the header `x-attempt` incremented, and then acknowledges the original. When the TTL ends, RabbitMQ dead-letters the message back to the work queue.

There is one waiting queue per backoff step because RabbitMQ expires messages only at the head of a queue: a 200 ms message behind an 800 ms message would wait 800 ms. And the waiting queue sets `x-dead-letter-routing-key`: without it the message keeps the routing key it was published with, matches no binding and is dropped silently. That mistake was made while building this lab, and the test caught it.

## 4. The dead-letter queue

When the attempts run out, the consumer rejects the message without requeue. The work queue has its own dead-letter exchange, so the message moves to the dead-letter queue with an `x-death` header recording why. There it no longer delays healthy messages, and it waits for a person.

Not every failure deserves the retries. The consumer separates:

- **transient** failures (the handler threw): retried with backoff;
- **permanent** failures (the payload does not pass the schema): dead-lettered on sight, because no wait makes an invalid message valid.

In the committed run the poisoned message was tried 4 times with waits of 203, 403 and 803 ms and then dead-lettered; the malformed one went straight there on attempt 1; the 20 healthy messages were all applied.

## What to take away

- At-least-once delivery plus an idempotent consumer is how "exactly once" is built in practice.
- The dedupe mark and the effect must commit together. Two stores cannot do that.
- Retry later and with a growing wait, a limited number of times, then dead-letter.
- Classify the error before retrying: transient or permanent.
