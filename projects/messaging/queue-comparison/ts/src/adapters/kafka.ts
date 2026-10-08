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
		const partitions = options?.partitions ?? 1;
		await admin.createTopics({
			waitForLeaders: true,
			topics: [{ topic: this.channel, numPartitions: partitions, replicationFactor: 1 }],
		});
		// EN: "Created" is not "ready". The controller has chosen a leader for each partition,
		//     but the broker may still be opening the partition and answers "not the leader"
		//     for a short while. Asking each partition for its offsets is a request only a
		//     ready leader answers, so the topic is used only after that succeeds.
		// PT: "Criado" não é "pronto". O controller já escolheu um líder para cada partição, mas
		//     o broker ainda pode estar abrindo a partição e responde "não sou o líder" por um
		//     instante. Pedir os offsets de cada partição é uma requisição que só um líder
		//     pronto responde, então o tópico só é usado depois que ela dá certo.
		let ready = false;
		for (let attempt = 0; attempt < 100 && !ready; attempt += 1) {
			try {
				ready = (await admin.fetchTopicOffsets(this.channel)).length === partitions;
			} catch {
				ready = false;
			}
			if (!ready) {
				await Bun.sleep(100);
			}
		}
		await admin.disconnect();
		if (!ready) {
			throw new Error(`kafka: topic ${this.channel} did not become ready`);
		}
	}

	async createProducer(): Promise<OrderProducer> {
		const producer = this.kafka.producer({
			allowAutoTopicCreation: false,
			createPartitioner: Partitioners.DefaultPartitioner,
			// EN: One produce request carries batches for several partitions. On a topic that
			//     was just created, the broker may answer "not the leader" for ONE of them; the
			//     client then retries the whole request, and the partitions that had already
			//     stored their batch store it again. That duplicate sits in the log, so every
			//     consumer reads it, and it looks like broken ordering (0, 4, 8, 0, 4, 8, 12).
			//     The idempotent producer numbers each batch per partition, and the broker
			//     discards a number it has already stored. It needs one request in flight at
			//     a time and `acks=all`.
			// PT: Uma requisição de produção leva lotes para várias partições. Em um tópico
			//     recém-criado, o broker pode responder "não sou o líder" para UMA delas; o
			//     cliente então repete a requisição inteira, e as partições que já tinham
			//     gravado o lote o gravam de novo. Essa duplicata fica no log, então todo
			//     consumidor a lê, e ela parece uma ordem quebrada (0, 4, 8, 0, 4, 8, 12).
			//     O produtor idempotente numera cada lote por partição, e o broker descarta um
			//     número que já gravou. Ele exige uma requisição em andamento por vez e `acks=all`.
			idempotent: true,
			maxInFlightRequests: 1,
			// EN: The guarantee holds only while the producer keeps retrying the SAME numbered batch.
			// PT: A garantia só vale enquanto o produtor continua repetindo o MESMO lote numerado.
			retry: { retries: Number.MAX_SAFE_INTEGER, initialRetryTime: 200 },
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
