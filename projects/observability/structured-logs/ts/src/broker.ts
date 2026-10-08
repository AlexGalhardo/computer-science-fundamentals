// EN: A thin layer over RabbitMQ (AMQP) with one job in this lab: carry the correlation id
//     across the queue. An HTTP call has headers; an AMQP message has properties, and one of
//     them is literally called `correlationId`. The publisher fills it from the current
//     request, and the consumer restores it before running the handler. Without this step the
//     trail of a request ends at the queue, because the worker runs later, in another process,
//     with no HTTP request to read a header from.
// PT: Uma camada fina sobre o RabbitMQ (AMQP) com um trabalho neste laboratório: levar o
//     correlation id através da fila. Uma chamada HTTP tem cabeçalhos; uma mensagem AMQP tem
//     propriedades, e uma delas se chama literalmente `correlationId`. Quem publica a preenche
//     a partir da requisição atual, e quem consome a restaura antes de rodar o handler. Sem
//     esse passo o rastro de uma requisição acaba na fila, porque o worker roda depois, em
//     outro processo, sem nenhuma requisição HTTP de onde ler um cabeçalho.

import { type ChannelModel, connect } from "amqplib";
import { correlationIdFrom, currentCorrelationId, runWithCorrelation } from "./correlation";

export interface Broker {
	publish: (payload: unknown) => Promise<void>;
	consume: (handler: (payload: unknown) => Promise<void>) => Promise<void>;
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

export async function connectBroker(url: string, queue: string): Promise<Broker> {
	const connection = await connectWithRetry(url);
	const channel = await connection.createConfirmChannel();
	await channel.assertQueue(queue, { durable: true });

	return {
		publish: async (payload) => {
			channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
				contentType: "application/json",
				correlationId: currentCorrelationId(),
			});
			await channel.waitForConfirms();
		},

		consume: async (handler) => {
			await channel.prefetch(10);
			await channel.consume(queue, (message) => {
				if (message === null) {
					return;
				}
				let payload: unknown;
				try {
					payload = JSON.parse(message.content.toString("utf8"));
				} catch {
					payload = undefined;
				}
				// EN: The property comes from outside the process, so it is validated like the
				//     HTTP header. A message with no valid id still gets one, so its lines can be
				//     found together.
				// PT: A propriedade vem de fora do processo, então é validada como o cabeçalho
				//     HTTP. Uma mensagem sem id válido ainda recebe um, para que as suas linhas
				//     possam ser encontradas juntas.
				const correlationId = correlationIdFrom(message.properties.correlationId);
				runWithCorrelation(correlationId, () => handler(payload)).then(
					() => channel.ack(message),
					// EN: A message the handler rejects will never become valid: it is dropped,
					//     not redelivered forever (a real system would use a dead-letter queue).
					// PT: Uma mensagem que o handler rejeita nunca vai ficar válida: é descartada,
					//     e não reentregue para sempre (um sistema real usaria uma dead-letter queue).
					() => channel.nack(message, false, false),
				);
			});
		},

		close: async () => {
			await channel.close();
			await connection.close();
		},
	};
}
