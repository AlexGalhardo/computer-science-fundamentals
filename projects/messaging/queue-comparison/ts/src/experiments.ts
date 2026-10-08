// EN: The experiments. Each one is written once, against the shared interfaces, and run on every
//     broker. The answers differ per broker, and those differences are the content of the README.
// PT: Os experimentos. Cada um é escrito uma vez, contra as interfaces comuns, e executado em
//     todos os brokers. As respostas mudam por broker, e essas diferenças são o conteúdo do README.

import { join } from "node:path";
import { FakeMailer, makeOrders, type OrderPlaced } from "./order";
import { type AdapterFactory, type BrokerName, chunk, type OrderConsumer } from "./queue";

let counter = 0;

/** A fresh queue or topic name, so no experiment sees messages of another one. */
export function freshChannel(label: string): string {
	counter += 1;
	return `orders-${label}-${Date.now().toString(36)}-${counter}`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`timeout after ${ms} ms: ${what}`)), ms);
	});
	try {
		return await Promise.race([promise, timeout]);
	} finally {
		clearTimeout(timer);
	}
}

export interface RoundTrip {
	/** Every delivery, in the order the consumer saw it (duplicates included). */
	received: OrderPlaced[];
	/** Simulated e-mails sent by the consumer, one per delivery. */
	emails: number;
	produceMs: number;
	/** From the first delivery to the last one, so the consumer start-up is left out. */
	consumeMs: number;
}

// EN: Sends `orders`, then starts ONE consumer and waits until every distinct order arrived.
//     Producing finishes before consuming starts, so the two speeds are measured separately.
// PT: Envia `orders`, depois inicia UM consumidor e espera até todo pedido distinto chegar.
//     A produção termina antes de o consumo começar, então as duas velocidades são medidas
//     separadamente.
export async function roundTrip(
	factory: AdapterFactory,
	orders: OrderPlaced[],
	options: { parallelism: number; partitions?: number; sendBatch?: number; timeoutMs?: number },
): Promise<RoundTrip> {
	const adapter = factory(freshChannel("rt"));
	await adapter.prepare({ partitions: options.partitions });

	const producer = await adapter.createProducer();
	const produceStart = performance.now();
	for (const part of chunk(orders, options.sendBatch ?? orders.length)) {
		await producer.send(part);
	}
	const produceMs = performance.now() - produceStart;
	await producer.close();

	const received: OrderPlaced[] = [];
	const mailer = new FakeMailer();
	const distinct = new Set<string>();
	let first = 0;
	let last = 0;
	let consumer: OrderConsumer | undefined;
	const all = new Promise<void>((resolveAll) => {
		adapter
			.consume(
				async (order) => {
					const now = performance.now();
					if (received.length === 0) {
						first = now;
					}
					last = now;
					received.push(order);
					mailer.send(order);
					distinct.add(order.id);
					if (distinct.size === orders.length) {
						resolveAll();
					}
				},
				{ parallelism: options.parallelism },
			)
			.then((started) => {
				consumer = started;
			});
	});
	try {
		await withTimeout(all, options.timeoutMs ?? 120_000, `${adapter.broker} delivered ${distinct.size}`);
	} finally {
		await consumer?.stop();
	}
	return { received, emails: mailer.sent.length, produceMs, consumeMs: last - first };
}

export interface OrderingResult {
	messages: number;
	/** Did the consumer see the messages exactly in the order they were sent? */
	globalOrder: boolean;
	/** Did it see the messages of each customer (the ordering key) in order? */
	perKeyOrder: boolean;
	/** How many messages arrived after a message that was sent later. */
	outOfOrder: number;
}

// EN: A message is "out of order" when a message sent after it was already seen. Counting them
//     says how far from the sent order the delivery was, not only yes or no.
// PT: Uma mensagem está "fora de ordem" quando uma mensagem enviada depois dela já foi vista.
//     Contá-las diz o quão longe da ordem de envio a entrega ficou, não só sim ou não.
export function analyseOrder(received: OrderPlaced[]): OrderingResult {
	let highest = -1;
	let outOfOrder = 0;
	let perKeyOrder = true;
	const highestByKey = new Map<string, number>();
	for (const order of received) {
		if (order.seq < highest) {
			outOfOrder += 1;
		}
		highest = Math.max(highest, order.seq);
		if (order.seq < (highestByKey.get(order.customerId) ?? -1)) {
			perKeyOrder = false;
		}
		highestByKey.set(order.customerId, Math.max(highestByKey.get(order.customerId) ?? -1, order.seq));
	}
	return { messages: received.length, globalOrder: outOfOrder === 0, perKeyOrder, outOfOrder };
}

/** Kafka gets a topic with several partitions, the usual production shape. Queues have none. */
export const ORDERING_PARTITIONS = 3;

// EN: Ordering: 200 orders sent in sequence, one consumer handling one message at a time.
// PT: Ordem: 200 pedidos enviados em sequência, um consumidor tratando uma mensagem por vez.
export async function orderingExperiment(factory: AdapterFactory, count = 200): Promise<OrderingResult> {
	const orders = makeOrders(count, "ord");
	const { received } = await roundTrip(factory, orders, {
		parallelism: 1,
		partitions: ORDERING_PARTITIONS,
		sendBatch: 10,
	});
	return analyseOrder(received);
}

export interface RedeliveryResult {
	/** Did a second consumer receive the message the first one never acknowledged? */
	redelivered: boolean;
	/** Time from the kill of the first consumer to the second delivery. */
	afterMs: number | null;
	/** What the broker itself said about the second delivery. */
	brokerFlag: boolean | null;
}

// EN: Redelivery: a consumer in ANOTHER process receives the message and is killed with SIGKILL
//     before it can acknowledge. Nothing is simulated: the process really dies with the message
//     in its hands. A second consumer then waits to see whether the broker hands it over again.
// PT: Reentrega: um consumidor em OUTRO processo recebe a mensagem e é morto com SIGKILL antes de
//     conseguir confirmar. Nada é simulado: o processo morre de verdade com a mensagem nas mãos.
//     Um segundo consumidor então espera para ver se o broker a entrega de novo.
export async function redeliveryExperiment(
	broker: BrokerName,
	factory: AdapterFactory,
	timeoutMs = 60_000,
): Promise<RedeliveryResult> {
	const channel = freshChannel("crash");
	const adapter = factory(channel);
	await adapter.prepare();
	const [order] = makeOrders(1, "crash");
	if (order === undefined) {
		throw new Error("no order to send");
	}
	const producer = await adapter.createProducer();
	await producer.send([order]);
	await producer.close();

	const child = Bun.spawn(["bun", "run", join(import.meta.dir, "crash-consumer.ts"), broker, channel], {
		stdout: "pipe",
		stderr: "inherit",
	});
	const sawMessage = (async () => {
		let output = "";
		const decoder = new TextDecoder();
		for await (const part of child.stdout) {
			output += decoder.decode(part);
			if (output.includes("RECEIVED")) {
				return;
			}
		}
		throw new Error("the first consumer exited before receiving the message");
	})();
	try {
		await withTimeout(sawMessage, timeoutMs, `${broker}: first consumer never received the message`);
	} finally {
		child.kill("SIGKILL");
		await child.exited;
	}
	const killedAt = performance.now();

	let consumer: OrderConsumer | undefined;
	const second = new Promise<RedeliveryResult>((resolveSecond) => {
		adapter
			.consume(
				async (again, info) => {
					if (again.id === order.id) {
						resolveSecond({
							redelivered: true,
							afterMs: performance.now() - killedAt,
							brokerFlag: info.redelivered,
						});
					}
				},
				{ parallelism: 1 },
			)
			.then((started) => {
				consumer = started;
			});
	});
	try {
		return await withTimeout(second, timeoutMs, `${broker}: no redelivery`);
	} catch {
		return { redelivered: false, afterMs: null, brokerFlag: null };
	} finally {
		await consumer?.stop();
	}
}

export interface Spread {
	mean: number;
	min: number;
	max: number;
}

export function spread(values: number[]): Spread {
	const total = values.reduce((sum, value) => sum + value, 0);
	return { mean: total / values.length, min: Math.min(...values), max: Math.max(...values) };
}

export interface ThroughputResult {
	messages: number;
	runs: number;
	/** Messages per second. */
	produce: Spread;
	consume: Spread;
}

export const THROUGHPUT_PARALLELISM = 16;

// EN: Throughput: one warm-up run is thrown away (connections, JIT, topic creation), then each
//     measured run reports messages per second. The table shows mean, lowest and highest run.
// PT: Vazão: uma rodada de aquecimento é descartada (conexões, JIT, criação de tópico), depois
//     cada rodada medida informa mensagens por segundo. A tabela mostra média, menor e maior.
export async function throughputExperiment(
	factory: AdapterFactory,
	messages: number,
	runs: number,
): Promise<ThroughputResult> {
	const run = async (count: number, label: string): Promise<{ produce: number; consume: number }> => {
		const { produceMs, consumeMs } = await roundTrip(factory, makeOrders(count, label), {
			parallelism: THROUGHPUT_PARALLELISM,
			timeoutMs: 300_000,
		});
		return { produce: count / (produceMs / 1000), consume: (count - 1) / (consumeMs / 1000) };
	};
	await run(Math.min(messages, 500), "warm");
	const measured: { produce: number; consume: number }[] = [];
	for (let index = 0; index < runs; index += 1) {
		measured.push(await run(messages, `run${index}`));
	}
	return {
		messages,
		runs,
		produce: spread(measured.map((item) => item.produce)),
		consume: spread(measured.map((item) => item.consume)),
	};
}
