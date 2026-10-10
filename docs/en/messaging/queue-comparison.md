# Queue comparison (MP-MSG-1)

> Versão em português: [docs/pt/messaging/queue-comparison.md](../../pt/messaging/queue-comparison.md) · Versión en español: [docs/es/messaging/queue-comparison.md](../../es/messaging/queue-comparison.md)

Mini-project: [`projects/messaging/queue-comparison`](../../../projects/messaging/queue-comparison/README.md). Quiz topics: `queue-pubsub-stream`, `delivery-guarantees`, `ordering-partitioning`, `ack-retry-dlq`, `rabbitmq-exchanges-routing`, `kafka-topics-partitions-offsets`, `bullmq-redis`, `sqs-sns`.

## The question

"Use a queue" hides a choice. BullMQ, RabbitMQ, Kafka and SQS all move a message from a producer to a consumer, and a small interface can hide which one is in use. What the interface cannot hide is behaviour: in which order messages arrive, what happens to a message whose consumer died, and how fast it all goes. This mini-project runs one task on the four and measures those three things.

## One task, one interface

The task: an `OrderPlaced` message makes a consumer send a (simulated) confirmation e-mail.

```ts
interface OrderProducer { send(orders: OrderPlaced[]): Promise<void>; close(): Promise<void> }
interface OrderConsumer { stop(): Promise<void> }
interface QueueAdapter {
  prepare(options?: { partitions?: number }): Promise<void>;
  createProducer(): Promise<OrderProducer>;
  consume(handler: OrderHandler, options: { parallelism: number }): Promise<OrderConsumer>;
}
```

`send` resolves when the broker confirmed the messages. A message is acknowledged only after the handler's promise resolves, so every adapter is **at-least-once**. Each adapter class is declared `implements QueueAdapter` and the registry is typed `satisfies Record<BrokerName, ...>`: a missing or incomplete adapter is a compile error.

## Four models behind the interface

| | Where a message lives | How a consumer gets it | What "acknowledge" is | How a dead consumer is noticed |
| --- | --- | --- | --- | --- |
| BullMQ | Lists, sorted sets and hashes in Redis | The worker blocks on Redis and moves the job to `active` | The job is moved to `completed` | The job's lock is not renewed and expires (stalled job) |
| RabbitMQ | A queue inside the broker | The broker pushes over an open channel, up to the prefetch | `ack` of the delivery tag | The connection closes |
| Kafka | A partition of a log, kept by retention | The consumer fetches from an offset | A commit of "the next offset to read" for the group | Heartbeats stop and the session times out |
| SQS | A queue behind an HTTP API | The consumer polls (`ReceiveMessage`) | `DeleteMessage` with the receipt handle | Nothing notices: the visibility timeout just ends |

## Experiment 1: ordering

200 orders are sent in sequence and read by one consumer that handles one message at a time.

- **BullMQ and RabbitMQ**: one queue, one consumer, first in first out. Order is kept.
- **Kafka**: the topic has 3 partitions and the key is the customer id. Order exists only inside a partition, so the consumer sees each customer's orders in order, and the customers interleaved in whatever way the partitions were fetched. In the committed run 148 of 200 messages arrived after a message sent later. This is the design: partitions buy parallelism and give up total order.
- **SQS standard**: order is best effort. LocalStack happened to deliver in order; the real service does not promise it, so the test records the result and asserts nothing. Strict order needs a FIFO queue and a `MessageGroupId`.

A duplicate can pass for a reordering. An earlier version of this lab saw a customer's orders arrive as 0, 4, 8, 0, 4, 8, 12: the first produce request to a just-created topic was answered "not the leader" for one of its three partitions, the client retried the whole request, and the other partitions stored their batch twice. The fix was an idempotent producer (the broker discards a batch number it already stored) and waiting for every partition to answer before using the topic. The README tells the whole story.

The experiment keeps one consumer on purpose. With several consumers on a queue, messages are processed in parallel and effects can happen out of order on every broker, FIFO or not.

## Experiment 2: the consumer crashes before acknowledging

A consumer in a separate process receives the message, and is killed with `SIGKILL` while the handler is still running. The four brokers all deliver the message again, which is what at-least-once means, but they notice the death in different ways and at different speeds:

- **RabbitMQ**: the TCP connection closes with the process, the unacknowledged delivery returns to the queue at once, and the second delivery carries `redelivered = true`.
- **BullMQ**: nobody renews the job lock. When it expires (3 s in this lab, 30 s by default) the job is declared stalled and goes back to waiting.
- **Kafka**: the group coordinator stops receiving heartbeats and, after the session timeout (6 s here), removes the member and rebalances. The new owner of the partition starts from the last committed offset. There is no "redelivered" flag: from Kafka's point of view nothing was redelivered, an offset was simply never committed.
- **SQS**: the service does not know the consumer died. The message reappears when its visibility timeout ends (5 s here), with `ApproximateReceiveCount` equal to 2.

The practical consequence is the same everywhere: a handler can run twice for one message, so its effect must be idempotent. That is the subject of [idempotency-dlq](idempotency-dlq.md).

## Experiment 3: throughput

Each run sends 5,000 messages, then starts a consumer and waits for all of them. Producing and consuming are timed separately; the consume time runs from the first to the last delivery, so the start-up of the consumer (a group join in Kafka takes seconds) is excluded. One warm-up run is discarded, three are measured, and the table reports the mean with the lowest and highest run.

The committed numbers and the machine are in the [README](../../../projects/messaging/queue-comparison/README.md) and in `results/results.md`. They describe a single-node broker and a client on one laptop:

- Kafka wins by a wide margin on reads because of its model, not because of tuning: sequential log, large fetches, one commit for a batch.
- RabbitMQ and BullMQ pay for per-message acknowledgement. BullMQ also runs a Lua script in Redis for each state change of a job.
- SQS is an HTTP API with at most 10 messages per call, and here it is an emulator. The number is a lower bound for "an HTTP queue polled in batches of 10", not a measure of AWS.

## Running everything locally

The brokers live on an `internal` docker-compose network with no published port. Each integration test service depends only on its own broker, and the setup script tests them one at a time, removing each before starting the next. The configuration loader refuses any broker address that is not the loopback or a docker-compose service name.

LocalStack is pinned to 4.14.0. From the following releases the image refuses to start without an account token validated against a server on the internet, which contradicts the rules of this repository (no real credentials, no external network). See [the README](../../../projects/messaging/queue-comparison/README.md#everything-is-local).

## What to take away

- An interface can unify the API of brokers, never their guarantees.
- Order is a property of a queue with one consumer, or of a partition. Everything else is best effort.
- At-least-once is the common ground of the four. The difference is how long a lost message stays lost: instantly back in RabbitMQ, a timeout away in the other three.
- Throughput follows the acknowledgement model: per message, per batch, or per offset.
