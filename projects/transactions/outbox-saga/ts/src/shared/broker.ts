// EN: A thin layer over RabbitMQ (AMQP). One topic exchange named `events` receives every event.
//     Each service owns a durable queue bound to the routing keys it cares about.
// PT: Uma camada fina sobre o RabbitMQ (AMQP). Uma exchange do tipo topic chamada `events` recebe
//     todos os eventos. Cada serviço é dono de uma fila durável ligada às routing keys que lhe
//     interessam.

import { type ChannelModel, type ConfirmChannel, connect } from "amqplib";
import { type DomainEvent, eventSchema, ROUTING_KEYS } from "./events";

const EXCHANGE = "events";

export interface Broker {
	publish: (event: DomainEvent) => Promise<void>;
	subscribe: (queue: string, routingKeys: string[], handler: (event: DomainEvent) => Promise<void>) => Promise<void>;
	close: () => Promise<void>;
}

async function connectWithRetry(url: string): Promise<ChannelModel> {
	let lastError: unknown;
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			return await connect(url);
		} catch (error) {
			lastError = error;
			await Bun.sleep(500);
		}
	}
	throw new Error(`could not connect to the broker: ${lastError instanceof Error ? lastError.message : "unknown"}`);
}

export async function connectBroker(url: string): Promise<Broker> {
	const connection = await connectWithRetry(url);
	const channel: ConfirmChannel = await connection.createConfirmChannel();
	await channel.assertExchange(EXCHANGE, "topic", { durable: true });

	return {
		// EN: Publisher confirms: the promise resolves only when the broker says "I have it".
		//     Without the confirm, a message sent just before a network failure would be
		//     counted as published and silently lost.
		// PT: Confirmação de publicação: a promise só resolve quando o broker diz "recebi". Sem a
		//     confirmação, uma mensagem enviada logo antes de uma falha de rede seria contada
		//     como publicada e perdida em silêncio.
		publish: async (event) => {
			channel.publish(EXCHANGE, ROUTING_KEYS[event.type], Buffer.from(JSON.stringify(event)), {
				persistent: true,
				messageId: event.id,
				contentType: "application/json",
			});
			await channel.waitForConfirms();
		},

		// EN: Manual acknowledgement gives at-least-once delivery. The message is acknowledged
		//     only after the handler finished. If the service dies in the middle, the broker
		//     delivers the message again, which is why every handler must be idempotent.
		// PT: A confirmação manual dá entrega at-least-once. A mensagem só é confirmada depois de
		//     o handler terminar. Se o serviço morrer no meio, o broker entrega a mensagem de
		//     novo, e é por isso que todo handler precisa ser idempotente.
		subscribe: async (queue, routingKeys, handler) => {
			await channel.assertQueue(queue, { durable: true });
			for (const key of routingKeys) {
				await channel.bindQueue(queue, EXCHANGE, key);
			}
			await channel.prefetch(10);
			await channel.consume(queue, (message) => {
				if (message === null) {
					return;
				}
				let parsed: unknown;
				try {
					parsed = JSON.parse(message.content.toString("utf8"));
				} catch {
					parsed = undefined;
				}
				const event = eventSchema.safeParse(parsed);
				if (!event.success) {
					// EN: A malformed message will never become valid, so it is dropped instead
					//     of being redelivered forever (a real system would use a dead-letter queue).
					// PT: Uma mensagem malformada nunca vai ficar válida, então é descartada em vez
					//     de ser reentregue para sempre (um sistema real usaria uma dead-letter queue).
					console.error(`${queue}: dropping a malformed message`);
					channel.nack(message, false, false);
					return;
				}
				handler(event.data).then(
					() => channel.ack(message),
					(error: unknown) => {
						console.error(`${queue}: handler failed, requeueing`, error);
						channel.nack(message, false, true);
					},
				);
			});
		},

		close: async () => {
			await channel.close();
			await connection.close();
		},
	};
}
