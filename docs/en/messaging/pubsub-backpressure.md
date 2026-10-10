# Queue, pub/sub and backpressure (MP-MSG-3)

> Versão em português: [docs/pt/messaging/pubsub-backpressure.md](../../pt/messaging/pubsub-backpressure.md) · Versión en español: [docs/es/messaging/pubsub-backpressure.md](../../es/messaging/pubsub-backpressure.md)

Mini-project: [`projects/messaging/pubsub-backpressure`](../../../projects/messaging/pubsub-backpressure/README.md). Quiz topics: `queue-pubsub-stream`, `rabbitmq-exchanges-routing`, `backpressure`, `sqs-sns`.

## Part 1: who receives a message?

### Work queue: competing consumers

One queue, several consumers. The broker hands each message to **one** of them, in turn. Adding a consumer divides the same work among more hands: the total number of deliveries does not change. This is how one logical task (send the e-mail, resize the image) is scaled.

### Fan-out: publish/subscribe

One exchange of type `fanout`, and **one queue per subscriber**. The exchange copies every message into every queue bound to it, so each subscriber gets all of them. Adding a subscriber adds one more full copy of the flow. The producer names only the exchange and does not know who listens.

### The rule that covers both

In RabbitMQ a copy exists **per queue**, never per consumer. Whether subscribers share or duplicate a message is decided by how many queues there are:

| Wanted | Topology |
| --- | --- |
| Each message processed once, by any of N workers | 1 queue, N consumers |
| Each of N services sees every message | N queues bound to one exchange, 1 consumer each |
| Each of N services sees every message, and each service runs M instances | N queues, M consumers on each |

The lab runs the three rows with 300 messages and asserts 300, 900 and 600 deliveries. The same rule holds elsewhere under other names: a Kafka consumer group is "one queue", and an SNS topic with one SQS queue per service is the fan-out.

## Part 2: what if the producer is faster?

A buffer between a producer and a consumer absorbs bursts. It cannot absorb a lasting difference in speed: if 20 messages arrive per millisecond and 1 leaves, the buffer grows by 19 per millisecond for as long as the difference lasts. Something has to give, and there are only three options: grow (until memory ends), drop, or **slow the producer down**. The third one is backpressure.

### In one process

```ts
await queue.push(message);   // resolves only when there is room
```

That `await` is the whole mechanism. With an unbounded queue the promise always resolves at once, the producer never waits, and the lab measures a buffer that grows in a straight line (about 45 MiB per second) together with the resident memory of the process. With a capacity of 100 the buffer stays at 100 messages, memory stays flat, and the producer ends up producing exactly as fast as the consumer consumes. The cost is visible in the table too: the bounded producer sent 1,388 messages instead of 25,920. Backpressure does not make the system faster; it makes the slow part visible to the fast part instead of hiding it in a buffer.

### Between a broker and a consumer: prefetch

A broker is a buffer too, and a better place for a backlog than a consumer's memory: it can store it on disk and share it among consumers. RabbitMQ pushes messages to consumers, so without a limit it pushes everything. The prefetch count (`basic.qos`) is the limit: at most that many unacknowledged messages per consumer, the next one sent only when an ack arrives.

The lab starts with 3,000 queued messages and a slow consumer. Without prefetch the consumer held 2,908 at once and the queue was empty; with `prefetch(10)` it held 10 and 2,758 stayed in the broker. The amount of work done was the same.

### Between stages: demand (GenStage)

GenStage builds the same idea into the protocol between stages. Data flows downstream, **demand flows upstream**:

```text
producer  <---- "send me 10" ----  consumer
producer  ----- 10 events ------>  consumer
```

A producer implements `handle_demand(demand, state)` and may return at most `demand` events. A consumer subscribes with `max_demand` (the most events it accepts in flight) and `min_demand` (the level at which it asks for more). The slowest stage therefore sets the pace of the whole pipeline, and the buffer is a number in the configuration.

The Elixir side contrasts this with plain `send/2`, which never blocks and gives the sender no signal: the consumer's mailbox ends up holding the whole stream (99,983 of 100,000 events). With GenStage the peak is 10 for `max_demand: 10` and 100 for `max_demand: 100`, whether 1,000 or 3,000 events pass.

## What to take away

- Count the queues, not the consumers, to know how many times a message is processed.
- An unbounded buffer does not solve a speed difference; it postpones the failure and makes it larger.
- Backpressure is a signal that travels against the data: a full queue that makes `push` wait, a prefetch window, a demand message.
- Put the backlog where it is cheapest to hold and easiest to see: in the broker, not in the consumer's heap.
