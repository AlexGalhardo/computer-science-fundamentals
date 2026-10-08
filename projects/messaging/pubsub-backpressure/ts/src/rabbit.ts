// EN: The RabbitMQ experiments. The number of QUEUES decides whether subscribers share messages
//     or each get a copy:
//
//       work queue:  producer -> [tasks] -> worker A | worker B | worker C   (each message once)
//       fan-out:     producer -> (fanout exchange) -> [q.A] -> subscriber A
//                                                  -> [q.B] -> subscriber B   (a copy for each)
//
// PT: Os experimentos com RabbitMQ. O número de FILAS decide se os assinantes dividem as
//     mensagens ou se cada um recebe uma cópia (veja o desenho acima).

import { resolve } from "node:path";
import { type Channel, type ChannelModel, connect } from "amqplib";
import { z } from "zod";

const envSchema = z.object({
	// EN: Lab credentials, obviously fake, valid only inside docker-compose.
	// PT: Credenciais de laboratório, claramente falsas, válidas só dentro do docker-compose.
	AMQP_URL: z.url().default("amqp://lab:lab-fake-password@broker:5672"),
	PROJECT_DIR: z
		.string()
		.min(1)
		.default(resolve(import.meta.dir, "..", "..")),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({ AMQP_URL: env.AMQP_URL, PROJECT_DIR: env.PROJECT_DIR });
}

export async function connectBroker(url: string): Promise<ChannelModel> {
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

let runs = 0;

function freshName(label: string): string {
	runs += 1;
	return `lab.${label}.${Date.now().toString(36)}.${runs}`;
}

async function until(done: () => boolean, timeoutMs: number, what: string): Promise<void> {
	const deadline = performance.now() + timeoutMs;
	while (!done()) {
		if (performance.now() > deadline) {
			throw new Error(`timeout: ${what}`);
		}
		await Bun.sleep(10);
	}
	// EN: A short extra wait, so a wrong extra delivery would be seen instead of missed.
	// PT: Uma pequena espera extra, para uma entrega indevida a mais ser vista em vez de perdida.
	await Bun.sleep(200);
}

/** Starts a consumer that records the ids it receives and acknowledges each one. */
async function recorder(channel: Channel, queue: string): Promise<string[]> {
	const received: string[] = [];
	await channel.prefetch(1);
	await channel.consume(queue, (message) => {
		if (message !== null) {
			received.push(message.content.toString("utf8"));
			channel.ack(message);
		}
	});
	return received;
}

export interface DeliveryResult {
	messages: number;
	/** Ids received by each consumer, in the order of the consumers. */
	perConsumer: string[][];
	totalDeliveries: number;
}

function summarise(messages: number, perConsumer: string[][]): DeliveryResult {
	return {
		messages,
		perConsumer,
		totalDeliveries: perConsumer.reduce((sum, received) => sum + received.length, 0),
	};
}

function ids(messages: number): string[] {
	return Array.from({ length: messages }, (_, index) => `m-${index}`);
}

// EN: Work queue (competing consumers): ONE queue, several workers. RabbitMQ hands each message
//     to one worker, in turn, so the work is divided and nothing is processed twice.
// PT: Fila de trabalho (consumidores concorrentes): UMA fila, vários workers. O RabbitMQ entrega
//     cada mensagem a um worker, em rodízio, então o trabalho é dividido e nada é processado
//     duas vezes.
export async function workQueue(connection: ChannelModel, messages: number, workers: number): Promise<DeliveryResult> {
	const queue = freshName("tasks");
	const setup = await connection.createConfirmChannel();
	await setup.assertQueue(queue, { durable: true, autoDelete: true });

	const channels: Channel[] = [];
	const perConsumer: string[][] = [];
	for (let index = 0; index < workers; index += 1) {
		const channel = await connection.createChannel();
		channels.push(channel);
		perConsumer.push(await recorder(channel, queue));
	}
	for (const id of ids(messages)) {
		// EN: The default exchange routes to the queue whose name is the routing key.
		// PT: A exchange padrão roteia para a fila cujo nome é a routing key.
		setup.sendToQueue(queue, Buffer.from(id));
	}
	await setup.waitForConfirms();
	await until(
		() => perConsumer.reduce((sum, received) => sum + received.length, 0) >= messages,
		30_000,
		"work queue deliveries",
	);
	for (const channel of [...channels, setup]) {
		await channel.close();
	}
	return summarise(messages, perConsumer);
}

// EN: Fan-out (publish/subscribe): one fanout exchange and ONE QUEUE PER SUBSCRIBER. The
//     exchange copies every message into every bound queue, so each subscriber gets them all.
//     `groupSize` puts several instances on each subscriber's queue: the instances of one
//     service compete, while the services still each get a copy.
// PT: Fan-out (publish/subscribe): uma exchange fanout e UMA FILA POR ASSINANTE. A exchange copia
//     cada mensagem para toda fila ligada, então cada assinante recebe todas. `groupSize` coloca
//     várias instâncias na fila de cada assinante: as instâncias de um serviço competem,
//     enquanto os serviços continuam recebendo uma cópia cada.
export async function fanOut(
	connection: ChannelModel,
	messages: number,
	subscribers: number,
	groupSize = 1,
): Promise<DeliveryResult> {
	const exchange = freshName("events");
	const setup = await connection.createConfirmChannel();
	await setup.assertExchange(exchange, "fanout", { durable: true, autoDelete: true });

	const channels: Channel[] = [];
	const perConsumer: string[][] = [];
	for (let subscriber = 0; subscriber < subscribers; subscriber += 1) {
		const queue = `${exchange}.subscriber-${subscriber}`;
		await setup.assertQueue(queue, { durable: true, autoDelete: true });
		await setup.bindQueue(queue, exchange, "");
		for (let instance = 0; instance < groupSize; instance += 1) {
			const channel = await connection.createChannel();
			channels.push(channel);
			perConsumer.push(await recorder(channel, queue));
		}
	}
	for (const id of ids(messages)) {
		// EN: The producer names only the exchange. It does not know how many queues exist.
		// PT: O produtor cita só a exchange. Ele não sabe quantas filas existem.
		setup.publish(exchange, "", Buffer.from(id));
	}
	await setup.waitForConfirms();
	await until(
		() => perConsumer.reduce((sum, received) => sum + received.length, 0) >= messages * subscribers,
		30_000,
		"fan-out deliveries",
	);
	for (const channel of [...channels, setup]) {
		await channel.close();
	}
	return summarise(messages, perConsumer);
}

export interface PrefetchResult {
	/** 0 means no limit. */
	prefetch: number;
	backlog: number;
	/** The most messages the consumer held at once: delivered to it and not yet acknowledged. */
	peakHeldByConsumer: number;
	/** Messages still inside the broker, ready for any consumer, when the measurement ended. */
	leftInBroker: number;
	processed: number;
}

// EN: Backpressure between RabbitMQ and a slow consumer. The queue starts with a backlog and
//     the consumer handles one message every 2 ms. Without a prefetch limit the broker pushes
//     the whole backlog into the consumer process at once: the memory problem moves from the
//     broker to the consumer, and other consumers find the queue empty. With a limit, the
//     broker stops at that many unacknowledged messages and waits for acks.
// PT: Backpressure entre o RabbitMQ e um consumidor lento. A fila começa com um acúmulo e o
//     consumidor trata uma mensagem a cada 2 ms. Sem limite de prefetch o broker empurra o
//     acúmulo inteiro para o processo consumidor de uma vez: o problema de memória se muda do
//     broker para o consumidor, e outros consumidores encontram a fila vazia. Com limite, o
//     broker para naquela quantidade de mensagens sem ack e espera as confirmações.
export async function prefetchExperiment(
	connection: ChannelModel,
	prefetch: number,
	backlog: number,
	observeMs = 600,
): Promise<PrefetchResult> {
	const queue = freshName("backlog");
	const setup = await connection.createConfirmChannel();
	await setup.assertQueue(queue, { durable: true });
	const body = Buffer.alloc(1024, 1);
	for (let index = 0; index < backlog; index += 1) {
		setup.sendToQueue(queue, body);
	}
	await setup.waitForConfirms();

	const channel = await connection.createChannel();
	if (prefetch > 0) {
		await channel.prefetch(prefetch);
	}
	let held = 0;
	let peak = 0;
	let processed = 0;
	// EN: The handler works on one message at a time: each one waits for the previous to finish.
	// PT: O handler trabalha em uma mensagem por vez: cada uma espera a anterior terminar.
	let chain: Promise<void> = Promise.resolve();
	await channel.consume(queue, (message) => {
		if (message === null) {
			return;
		}
		held += 1;
		peak = Math.max(peak, held);
		chain = chain.then(async () => {
			await Bun.sleep(2);
			try {
				channel.ack(message);
			} catch {
				// The channel was closed at the end of the measurement.
				return;
			}
			held -= 1;
			processed += 1;
		});
	});
	await Bun.sleep(observeMs);
	const leftInBroker = (await setup.checkQueue(queue)).messageCount;
	const result: PrefetchResult = { prefetch, backlog, peakHeldByConsumer: peak, leftInBroker, processed };
	await channel.close();
	await setup.deleteQueue(queue);
	await setup.close();
	return result;
}
