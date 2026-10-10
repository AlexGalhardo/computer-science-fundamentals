// EN: The scenarios shared by the demo and the end-to-end tests.
// PT: Os cenários usados tanto pela demo quanto pelos testes de ponta a ponta.
// ES: Los escenarios que usan tanto la demo como las pruebas de extremo a extremo.

import type { ChannelModel, ConfirmChannel, GetMessage } from "amqplib";
import type { Pool } from "pg";
import { type Payment, seededRandom } from "./core";
import { ACCOUNT, applyIdempotent, applyNaive, resetDb, totals } from "./db";
import {
	type AttemptLog,
	declareTopology,
	publishPayment,
	publishRaw,
	type RetryPolicy,
	type RunningConsumer,
	startConsumer,
	type Topology,
	topology,
} from "./pipeline";

let runs = 0;

function freshTopology(label: string): Topology {
	runs += 1;
	return topology(`lab.${label}.${Date.now().toString(36)}.${runs}`);
}

// EN: The pipeline is idle when the work queue and every waiting queue are empty and the consumer
//     holds nothing, twice in a row. One look is not enough: a message can be between two queues.
// PT: O pipeline está ocioso quando a fila de trabalho e todas as filas de espera estão vazias e o
//     consumidor não segura nada, duas vezes seguidas. Uma olhada só não basta: uma mensagem pode
//     estar entre duas filas.
// ES: El pipeline está inactivo cuando la cola de trabajo y todas las colas de espera están vacías
//     y el consumidor no sostiene nada, dos veces seguidas. Una sola mirada no basta: un mensaje
//     puede estar entre dos colas.
async function waitUntilIdle(
	channel: ConfirmChannel,
	names: Topology,
	policy: RetryPolicy,
	consumer: RunningConsumer,
	timeoutMs: number,
): Promise<void> {
	const queues = [
		names.work,
		...Array.from({ length: policy.maxAttempts - 1 }, (_, index) => names.retry(index + 1)),
	];
	const deadline = performance.now() + timeoutMs;
	let calm = 0;
	while (calm < 3) {
		if (performance.now() > deadline) {
			throw new Error("the pipeline did not become idle in time");
		}
		let waiting = consumer.stats.inFlight;
		for (const queue of queues) {
			waiting += (await channel.checkQueue(queue)).messageCount;
		}
		calm = waiting === 0 && consumer.stats.inFlight === 0 ? calm + 1 : 0;
		await Bun.sleep(100);
	}
}

export type Mode = "naive" | "idempotent";

export interface DuplicatesResult {
	mode: Mode;
	messages: number;
	/** Deliveries seen by the consumer, duplicates and redeliveries included. */
	deliveries: number;
	/** The lowest number of deliveries any single message had. */
	minDeliveriesPerMessage: number;
	effects: number;
	balanceCents: number;
	expectedBalanceCents: number;
}

export interface DuplicatesOptions {
	messages: number;
	/** Probability of a "crash" after the effect and before the ack. */
	crashRate: number;
	seed: number;
}

// EN: Every message is published TWICE (a producer retrying after a lost confirm), and the
//     consumer "crashes" at random between the effect and the ack. So each message is delivered
//     at least twice, and the question is how many times its effect is applied.
// PT: Toda mensagem é publicada DUAS vezes (um produtor que repete depois de perder o confirm), e
//     o consumidor "cai" ao acaso entre o efeito e o ack. Assim cada mensagem é entregue ao menos
//     duas vezes, e a pergunta é quantas vezes o seu efeito é aplicado.
// ES: Cada mensaje se publica DOS veces (un productor que reintenta tras perder la confirmación), y
//     el consumidor "cae" al azar entre el efecto y el ack. Así cada mensaje se entrega al menos
//     dos veces, y la pregunta es cuántas veces se aplica su efecto.
export async function duplicatesScenario(
	connection: ChannelModel,
	pool: Pool,
	mode: Mode,
	options: DuplicatesOptions,
): Promise<DuplicatesResult> {
	await resetDb(pool);
	const names = freshTopology(mode);
	const policy: RetryPolicy = { maxAttempts: 3, baseDelayMs: 50 };
	const channel = await connection.createConfirmChannel();
	await declareTopology(channel, names, policy);

	const payments: Payment[] = Array.from({ length: options.messages }, (_, index) => ({
		id: `pay-${String(index).padStart(5, "0")}`,
		accountId: ACCOUNT,
		amountCents: 100,
	}));
	for (const payment of payments) {
		publishPayment(channel, names, payment);
		publishPayment(channel, names, payment);
	}
	await channel.waitForConfirms();

	const random = seededRandom(options.seed);
	const apply = mode === "naive" ? applyNaive : applyIdempotent;
	const consumer = await startConsumer(connection, {
		names,
		policy,
		prefetch: 16,
		handle: (payment) => apply(pool, payment),
		crashBeforeAck: () => random() < options.crashRate,
	});
	try {
		await waitUntilIdle(channel, names, policy, consumer, 120_000);
	} finally {
		await consumer.stop();
		await channel.close();
	}

	const counts = [...consumer.stats.deliveries.values()];
	const { effects, balanceCents } = await totals(pool);
	return {
		mode,
		messages: options.messages,
		deliveries: counts.reduce((sum, count) => sum + count, 0),
		minDeliveriesPerMessage: consumer.stats.deliveries.size === options.messages ? Math.min(...counts) : 0,
		effects,
		balanceCents,
		expectedBalanceCents: options.messages * 100,
	};
}

export interface DeadLetter {
	messageId: string;
	/** The `x-attempt` header: the attempt on which the message was given up. */
	attempt: number;
	/** The reason RabbitMQ recorded in the `x-death` header. */
	reason: string;
}

export interface PoisonResult {
	policy: RetryPolicy;
	healthyMessages: number;
	effects: number;
	/** Failed attempts of the poisoned message, with the gap since the previous one. */
	poisonAttempts: { attempt: number; waitedMs: number | null }[];
	deadLetters: DeadLetter[];
}

function deadLetterOf(message: GetMessage): DeadLetter {
	const headers = message.properties.headers ?? {};
	const attempt: unknown = headers["x-attempt"];
	const deaths: unknown = headers["x-death"];
	const first: unknown = Array.isArray(deaths) ? deaths[0] : undefined;
	const reason: unknown =
		typeof first === "object" && first !== null ? (first as Record<string, unknown>).reason : undefined;
	return {
		messageId: typeof message.properties.messageId === "string" ? message.properties.messageId : "unknown",
		attempt: typeof attempt === "number" ? attempt : 1,
		reason: typeof reason === "string" ? reason : "unknown",
	};
}

function gaps(log: AttemptLog[]): { attempt: number; waitedMs: number | null }[] {
	return log.map((entry, index) => {
		const previous = log[index - 1];
		return { attempt: entry.attempt, waitedMs: previous === undefined ? null : entry.at - previous.at };
	});
}

// EN: Two bad messages among healthy ones. "poison" has a valid shape but an account that does
//     not exist, so the handler throws on every attempt: it is retried with backoff and
//     dead-lettered when the attempts run out. "malformed" is not even valid JSON for the
//     schema: it is dead-lettered on sight. The healthy messages must not be held up by either.
// PT: Duas mensagens ruins entre mensagens saudáveis. "poison" tem formato válido, mas uma conta
//     que não existe, então o handler lança erro em toda tentativa: é repetida com backoff e vai
//     para a dead-letter quando as tentativas acabam. "malformed" nem é JSON válido para o
//     schema: vai para a dead-letter de imediato. As saudáveis não podem ser travadas por elas.
// ES: Dos mensajes malos entre mensajes sanos. "poison" tiene forma válida pero una cuenta que no
//     existe, así que el handler lanza un error en cada intento: se reintenta con backoff y va a la
//     dead-letter cuando se agotan los intentos. "malformed" ni siquiera es un JSON válido para el
//     esquema: va a la dead-letter de inmediato. Los sanos no deben ser retenidos por ninguno.
export async function poisonScenario(connection: ChannelModel, pool: Pool, policy: RetryPolicy): Promise<PoisonResult> {
	await resetDb(pool);
	const names = freshTopology("poison");
	const channel = await connection.createConfirmChannel();
	await declareTopology(channel, names, policy);

	const healthy = 20;
	publishPayment(channel, names, { id: "poison", accountId: "no-such-account", amountCents: 100 });
	publishRaw(channel, names, '{"id":"malformed","amountCents":"a lot"}', "malformed");
	for (let index = 0; index < healthy; index += 1) {
		publishPayment(channel, names, { id: `ok-${index}`, accountId: ACCOUNT, amountCents: 100 });
	}
	await channel.waitForConfirms();

	const consumer = await startConsumer(connection, {
		names,
		policy,
		prefetch: 4,
		handle: (payment) => applyIdempotent(pool, payment),
		crashBeforeAck: () => false,
	});
	const deadLetters: DeadLetter[] = [];
	try {
		await waitUntilIdle(channel, names, policy, consumer, 120_000);
		for (;;) {
			const message = await channel.get(names.dlq, { noAck: true });
			if (message === false) {
				break;
			}
			deadLetters.push(deadLetterOf(message));
		}
	} finally {
		await consumer.stop();
		await channel.close();
	}
	const { effects } = await totals(pool);
	return {
		policy,
		healthyMessages: healthy,
		effects,
		poisonAttempts: gaps(consumer.stats.failures.get("poison") ?? []),
		deadLetters: deadLetters.sort((a, b) => a.messageId.localeCompare(b.messageId)),
	};
}
