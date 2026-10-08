// EN: The RabbitMQ side: the topology of queues, the publisher and the consumer with retry,
//     backoff and dead-lettering.
//
//       publisher --> [work] --> consumer --ok--> ack
//                       ^           |
//                       |           +--failed, attempts left--> [retry.N] (waits base x 2^(N-1))
//                       +---- TTL expired, dead-lettered back ------+
//                                   |
//                                   +--invalid, or no attempts left--> reject --> [dlq]
//
// PT: O lado do RabbitMQ: a topologia das filas, o publicador e o consumidor com retentativa,
//     backoff e dead-lettering (o desenho acima mostra o caminho de uma mensagem).

import { type ChannelModel, type ConfirmChannel, type ConsumeMessage, connect } from "amqplib";
import { backoffDelay, type Payment, paymentSchema } from "./core";

export interface Topology {
	work: string;
	dlq: string;
	deadExchange: string;
	workExchange: string;
	retry: (attempt: number) => string;
}

export function topology(prefix: string): Topology {
	return {
		work: `${prefix}.work`,
		dlq: `${prefix}.dlq`,
		deadExchange: `${prefix}.dead`,
		workExchange: `${prefix}.work`,
		retry: (attempt) => `${prefix}.retry.${attempt}`,
	};
}

const WORK_KEY = "work";
const DEAD_KEY = "dead";

export interface RetryPolicy {
	/** Total number of tries, the first one included. */
	maxAttempts: number;
	baseDelayMs: number;
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

export async function declareTopology(channel: ConfirmChannel, names: Topology, policy: RetryPolicy): Promise<void> {
	await channel.assertExchange(names.workExchange, "direct", { durable: true });
	await channel.assertExchange(names.deadExchange, "direct", { durable: true });
	// EN: A message rejected without requeue leaves the work queue through its dead-letter
	//     exchange and lands in the dead-letter queue, where a person can inspect it.
	// PT: Uma mensagem rejeitada sem requeue sai da fila de trabalho pela dead-letter exchange e
	//     cai na dead-letter queue, onde uma pessoa pode inspecioná-la.
	await channel.assertQueue(names.work, {
		durable: true,
		deadLetterExchange: names.deadExchange,
		deadLetterRoutingKey: DEAD_KEY,
	});
	await channel.bindQueue(names.work, names.workExchange, WORK_KEY);
	await channel.assertQueue(names.dlq, { durable: true });
	await channel.bindQueue(names.dlq, names.deadExchange, DEAD_KEY);
	// EN: One waiting queue per backoff step. RabbitMQ expires messages only at the head of a
	//     queue, so mixing a 100 ms and a 400 ms wait in one queue would hold the short one
	//     behind the long one. A queue per delay keeps each wait exact. Nobody consumes these
	//     queues: when the TTL ends, the message is dead-lettered back to the work exchange.
	// PT: Uma fila de espera por degrau de backoff. O RabbitMQ só expira mensagens na cabeça da
	//     fila, então misturar esperas de 100 ms e 400 ms em uma fila prenderia a curta atrás da
	//     longa. Uma fila por atraso mantém cada espera exata. Ninguém consome estas filas:
	//     quando o TTL acaba, a mensagem volta por dead-letter para a exchange de trabalho.
	for (let attempt = 1; attempt < policy.maxAttempts; attempt += 1) {
		await channel.assertQueue(names.retry(attempt), {
			durable: true,
			messageTtl: backoffDelay(attempt, policy.baseDelayMs),
			deadLetterExchange: names.workExchange,
			// EN: Without this, the dead-lettered message would keep the routing key it was
			//     published with (the name of the waiting queue), match no binding of the
			//     work exchange and be dropped in silence.
			// PT: Sem isto, a mensagem manteria a routing key com que foi publicada (o nome da
			//     fila de espera), não casaria com nenhum binding da exchange de trabalho e
			//     seria descartada em silêncio.
			deadLetterRoutingKey: WORK_KEY,
		});
	}
}

/** Queues the publish on the channel. The caller waits for the confirms. */
export function publishRaw(channel: ConfirmChannel, names: Topology, body: string, id: string): void {
	channel.publish(names.workExchange, WORK_KEY, Buffer.from(body), {
		persistent: true,
		messageId: id,
		contentType: "application/json",
	});
}

export function publishPayment(channel: ConfirmChannel, names: Topology, payment: Payment): void {
	publishRaw(channel, names, JSON.stringify(payment), payment.id);
}

export interface AttemptLog {
	attempt: number;
	at: number;
}

export interface ConsumerStats {
	/** How many times each message id was delivered. */
	deliveries: Map<string, number>;
	/** When each failed attempt of a message happened, to check the backoff. */
	failures: Map<string, AttemptLog[]>;
	deadLettered: number;
	inFlight: number;
}

export interface ConsumerOptions {
	names: Topology;
	policy: RetryPolicy;
	prefetch: number;
	/** The business handler. A throw means "failed, try again later". */
	handle: (payment: Payment) => Promise<unknown>;
	/**
	 * Called after the handler succeeded and BEFORE the ack. Returning true simulates a crash
	 * in that window: the effect is done, the broker never hears about it.
	 */
	crashBeforeAck: () => boolean;
}

export interface RunningConsumer {
	stats: ConsumerStats;
	stop: () => Promise<void>;
}

function attemptOf(message: ConsumeMessage): number {
	const header: unknown = message.properties.headers?.["x-attempt"];
	return typeof header === "number" && Number.isInteger(header) && header >= 1 ? header : 1;
}

export async function startConsumer(connection: ChannelModel, options: ConsumerOptions): Promise<RunningConsumer> {
	const { names, policy } = options;
	const channel = await connection.createConfirmChannel();
	await channel.prefetch(options.prefetch);
	const stats: ConsumerStats = { deliveries: new Map(), failures: new Map(), deadLettered: 0, inFlight: 0 };

	const onMessage = async (message: ConsumeMessage): Promise<void> => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(message.content.toString("utf8"));
		} catch {
			parsed = undefined;
		}
		const payment = paymentSchema.safeParse(parsed);
		if (!payment.success) {
			// EN: Permanent failure: the payload is invalid and will be invalid on every retry.
			//     It goes straight to the dead-letter queue, without spending attempts.
			// PT: Falha permanente: o payload é inválido e será inválido em toda retentativa.
			//     Vai direto para a dead-letter queue, sem gastar tentativas.
			stats.deadLettered += 1;
			channel.nack(message, false, false);
			return;
		}
		const { id } = payment.data;
		stats.deliveries.set(id, (stats.deliveries.get(id) ?? 0) + 1);
		try {
			await options.handle(payment.data);
		} catch (error) {
			const attempt = attemptOf(message);
			const log = stats.failures.get(id) ?? [];
			log.push({ attempt, at: performance.now() });
			stats.failures.set(id, log);
			if (attempt >= policy.maxAttempts) {
				console.error(
					`${id}: attempt ${attempt} of ${policy.maxAttempts} failed, dead-lettering`,
					error instanceof Error ? error.message : error,
				);
				stats.deadLettered += 1;
				channel.nack(message, false, false);
				return;
			}
			// EN: Retry later, not now: the copy goes to the waiting queue of this attempt,
			//     carrying the attempt number. It is confirmed by the broker BEFORE the
			//     original is acknowledged, so a crash in between duplicates the message
			//     instead of losing it. Duplicates are fine: the handler is idempotent.
			// PT: Repetir depois, não agora: a cópia vai para a fila de espera desta tentativa,
			//     levando o número da tentativa. Ela é confirmada pelo broker ANTES de a
			//     original receber ack, então uma queda no meio duplica a mensagem em vez de
			//     perdê-la. Duplicatas não são problema: o handler é idempotente.
			channel.sendToQueue(names.retry(attempt), message.content, {
				persistent: true,
				messageId: id,
				contentType: "application/json",
				headers: { "x-attempt": attempt + 1 },
			});
			await channel.waitForConfirms();
			channel.ack(message);
			return;
		}
		if (options.crashBeforeAck()) {
			// EN: The effect is committed and the ack is "lost". Requeue stands in for what
			//     the broker does when a consumer dies holding a message.
			// PT: O efeito foi confirmado e o ack se "perdeu". O requeue faz o papel do que o
			//     broker faz quando um consumidor morre segurando uma mensagem.
			channel.nack(message, false, true);
			return;
		}
		channel.ack(message);
	};

	const { consumerTag } = await channel.consume(names.work, (message) => {
		if (message === null) {
			return;
		}
		stats.inFlight += 1;
		onMessage(message)
			.catch((error: unknown) => {
				console.error("consumer: unexpected error, requeueing", error);
				channel.nack(message, false, true);
			})
			.finally(() => {
				stats.inFlight -= 1;
			});
	});

	return {
		stats,
		stop: async () => {
			await channel.cancel(consumerTag);
			await channel.close();
		},
	};
}
