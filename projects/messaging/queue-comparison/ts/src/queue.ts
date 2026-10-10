// EN: The contract shared by the four brokers. The experiments and the tests are written against
//     these interfaces only, so the same code runs on BullMQ, RabbitMQ, Kafka and SQS. What stays
//     different is the behaviour (ordering, redelivery, speed), and that is the lesson.
// PT: O contrato comum aos quatro brokers. Os experimentos e os testes são escritos só contra
//     estas interfaces, então o mesmo código roda em BullMQ, RabbitMQ, Kafka e SQS. O que
//     continua diferente é o comportamento (ordem, reentrega, velocidade), e essa é a lição.
// ES: El contrato común a los cuatro brokers. Los experimentos y las pruebas se escriben solo
//     contra estas interfaces, así que el mismo código corre en BullMQ, RabbitMQ, Kafka y SQS. Lo
//     que sigue siendo distinto es el comportamiento (orden, reentrega, velocidad), y esa es la
//     lección.

import type { OrderPlaced } from "./order";

export const BROKERS = ["bullmq", "rabbitmq", "kafka", "sqs"] as const;
export type BrokerName = (typeof BROKERS)[number];

export interface DeliveryInfo {
	/**
	 * `true` when the broker says this is not the first delivery, `false` when it says it is,
	 * `null` when the broker gives no such signal (Kafka only re-reads an offset).
	 */
	redelivered: boolean | null;
}

/**
 * The message is acknowledged only after the returned promise resolves (at-least-once).
 * A handler that throws leaves the message to be delivered again.
 */
export type OrderHandler = (order: OrderPlaced, info: DeliveryInfo) => Promise<void>;

export interface OrderProducer {
	/** Resolves when the broker has confirmed every order. */
	send: (orders: OrderPlaced[]) => Promise<void>;
	close: () => Promise<void>;
}

export interface OrderConsumer {
	stop: () => Promise<void>;
}

export interface ConsumeOptions {
	/** How many messages this consumer may have in progress at the same time. */
	parallelism: number;
}

export interface ChannelOptions {
	/** Only Kafka uses it: a topic is split into partitions, a queue is not. */
	partitions?: number;
}

export interface QueueAdapter {
	readonly broker: BrokerName;
	/** Creates the queue or topic, empty. */
	prepare: (options?: ChannelOptions) => Promise<void>;
	createProducer: () => Promise<OrderProducer>;
	consume: (handler: OrderHandler, options: ConsumeOptions) => Promise<OrderConsumer>;
}

/** `channel` is the queue or topic name. Each experiment uses a fresh one. */
export type AdapterFactory = (channel: string) => QueueAdapter;

export function isBrokerName(value: string): value is BrokerName {
	return (BROKERS as readonly string[]).includes(value);
}

export function chunk<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let start = 0; start < items.length; start += size) {
		chunks.push(items.slice(start, start + size));
	}
	return chunks;
}
