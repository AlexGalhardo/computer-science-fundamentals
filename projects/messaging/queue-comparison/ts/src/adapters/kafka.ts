// EN: Kafka is a log, not a queue. Producing appends a record to one partition of a topic, chosen
//     by the hash of the record key. Consuming does not remove anything: a consumer group only
//     commits "the next offset I will read". There is no per-message acknowledgement, so a
//     crashed consumer is "redelivered" simply because its offset was never committed.
// PT: O Kafka é um log, não uma fila. Produzir acrescenta um registro a uma partição de um
//     tópico, escolhida pelo hash da chave do registro. Consumir não remove nada: um consumer
//     group só confirma "o próximo offset que vou ler". Não há confirmação por mensagem, então um
//     consumidor que caiu é "reentregue" simplesmente porque o seu offset nunca foi confirmado.

import { Kafka, logLevel, Partitioners } from "kafkajs";
import type { Config } from "../config";
import { decodeOrder, encodeOrder } from "../order";
import {
	type ChannelOptions,
	type ConsumeOptions,
	chunk,
	type OrderConsumer,
	type OrderHandler,
	type OrderProducer,
	type QueueAdapter,
} from "../queue";

const BATCH_SIZE = 500;

export class KafkaAdapter implements QueueAdapter {
	readonly broker = "kafka";
	private readonly kafka: Kafka;

	constructor(
		config: Config,
		private readonly channel: string,
	) {
		this.kafka = new Kafka({
			clientId: "queue-comparison",
			brokers: [config.KAFKA_BROKER],
			logLevel: logLevel.NOTHING,
			retry: { retries: 10, initialRetryTime: 200 },
		});
	}

	async prepare(options?: ChannelOptions): Promise<void> {
		const admin = this.kafka.admin();
		await admin.connect();
		await admin.createTopics({
			waitForLeaders: true,
			topics: [{ topic: this.channel, numPartitions: options?.partitions ?? 1, replicationFactor: 1 }],
		});
		await admin.disconnect();
	}

	async createProducer(): Promise<OrderProducer> {
		const producer = this.kafka.producer({
			allowAutoTopicCreation: false,
			createPartitioner: Partitioners.DefaultPartitioner,
		});
		await producer.connect();
		return {
			send: async (orders) => {
				for (const part of chunk(orders, BATCH_SIZE)) {
					await producer.send({
						topic: this.channel,
						// EN: -1 is `acks=all`: the leader answers only after the in-sync
						//     replicas have the records.
						// PT: -1 é `acks=all`: o líder só responde depois que as réplicas
						//     in-sync têm os registros.
						acks: -1,
						// EN: The key decides the partition, so the orders of one customer
						//     share a partition and keep their order.
						// PT: A chave decide a partição, então os pedidos de um cliente dividem
						//     uma partição e mantêm a ordem.
						messages: part.map((order) => ({ key: order.customerId, value: encodeOrder(order) })),
					});
				}
			},
			close: () => producer.disconnect(),
		};
	}

	async consume(handler: OrderHandler, options: ConsumeOptions): Promise<OrderConsumer> {
		const consumer = this.kafka.consumer({
			groupId: `${this.channel}-group`,
			// EN: A dead consumer is noticed only when its session times out. 6 s is the lowest
			//     value the broker accepts by default.
			// PT: Um consumidor morto só é percebido quando a sessão expira. 6 s é o menor valor
			//     que o broker aceita por padrão.
			sessionTimeout: 6000,
			heartbeatInterval: 1000,
			rebalanceTimeout: 10_000,
			allowAutoTopicCreation: false,
		});
		await consumer.connect();
		await consumer.subscribe({ topic: this.channel, fromBeginning: true });
		await consumer.run({
			partitionsConsumedConcurrently: options.parallelism,
			// EN: The offset is marked as done only when the handler resolves, and committed
			//     after that. Commit after processing is what gives at-least-once.
			// PT: O offset só é marcado como concluído quando o handler resolve, e confirmado
			//     depois disso. Confirmar depois de processar é o que dá at-least-once.
			eachMessage: async ({ message }) => {
				const order = decodeOrder(message.value?.toString("utf8") ?? "");
				await handler(order, { redelivered: null });
			},
		});
		return { stop: () => consumer.disconnect() };
	}
}
