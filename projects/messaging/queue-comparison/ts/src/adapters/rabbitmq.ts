// EN: RabbitMQ (AMQP 0-9-1). The producer publishes to the default exchange with the queue name
//     as routing key, and waits for publisher confirms. The consumer acknowledges manually: an
//     unacknowledged message belongs to the channel, and returns to the queue when it closes.
// PT: RabbitMQ (AMQP 0-9-1). O produtor publica na exchange padrão com o nome da fila como routing
//     key, e espera os publisher confirms. O consumidor confirma manualmente: uma mensagem sem
//     ack pertence ao canal, e volta para a fila quando ele fecha.

import { type ChannelModel, connect } from "amqplib";
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

const CONFIRM_BATCH = 1000;

export class RabbitmqAdapter implements QueueAdapter {
	readonly broker = "rabbitmq";

	constructor(
		private readonly config: Config,
		private readonly channel: string,
	) {}

	private open(): Promise<ChannelModel> {
		return connect(this.config.AMQP_URL);
	}

	async prepare(_options?: ChannelOptions): Promise<void> {
		const connection = await this.open();
		const channel = await connection.createChannel();
		await channel.assertQueue(this.channel, { durable: true });
		await channel.purgeQueue(this.channel);
		await channel.close();
		await connection.close();
	}

	async createProducer(): Promise<OrderProducer> {
		const connection = await this.open();
		const channel = await connection.createConfirmChannel();
		return {
			send: async (orders) => {
				for (const part of chunk(orders, CONFIRM_BATCH)) {
					for (const order of part) {
						// EN: Durable queue plus persistent message: both are needed for a
						//     message to survive a broker restart.
						// PT: Fila durável mais mensagem persistente: as duas são necessárias
						//     para uma mensagem sobreviver a um reinício do broker.
						channel.sendToQueue(this.channel, Buffer.from(encodeOrder(order)), {
							persistent: true,
							messageId: order.id,
							contentType: "application/json",
						});
					}
					await channel.waitForConfirms();
				}
			},
			close: async () => {
				await channel.close();
				await connection.close();
			},
		};
	}

	async consume(handler: OrderHandler, options: ConsumeOptions): Promise<OrderConsumer> {
		const connection = await this.open();
		const channel = await connection.createChannel();
		// EN: Prefetch is the limit of unacknowledged messages the broker lets this consumer
		//     hold. With 1, messages are handled strictly one at a time.
		// PT: O prefetch é o limite de mensagens sem ack que o broker deixa este consumidor
		//     segurar. Com 1, as mensagens são tratadas estritamente uma por vez.
		await channel.prefetch(options.parallelism);
		const { consumerTag } = await channel.consume(this.channel, (message) => {
			if (message === null) {
				return;
			}
			Promise.resolve()
				.then(() => decodeOrder(message.content.toString("utf8")))
				.then((order) => handler(order, { redelivered: message.fields.redelivered }))
				.then(
					() => channel.ack(message),
					(error: unknown) => {
						console.error("rabbitmq consumer: handler failed, requeueing", error);
						channel.nack(message, false, true);
					},
				);
		});
		return {
			stop: async () => {
				await channel.cancel(consumerTag);
				await channel.close();
				await connection.close();
			},
		};
	}
}
