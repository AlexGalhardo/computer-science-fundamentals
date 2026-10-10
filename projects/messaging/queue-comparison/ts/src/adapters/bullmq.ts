// EN: BullMQ is a library, not a server: the "broker" is Redis. A `Queue` writes jobs into Redis
//     structures and a `Worker` takes them. A worker holds a lock on each active job and renews
//     it; a job whose lock expired is "stalled" and goes back to be processed again.
// PT: O BullMQ é uma biblioteca, não um servidor: o "broker" é o Redis. Uma `Queue` grava jobs em
//     estruturas do Redis e um `Worker` os pega. O worker segura um lock em cada job ativo e o
//     renova; um job cujo lock expirou está "stalled" e volta para ser processado de novo.
// ES: BullMQ es una biblioteca, no un servidor: el "broker" es Redis. Una `Queue` escribe jobs en
//     estructuras de Redis y un `Worker` los toma. El worker mantiene un lock sobre cada job
//     activo y lo renueva; un job cuyo lock expiró está "stalled" y vuelve a procesarse.

import { type ConnectionOptions, Queue, Worker } from "bullmq";
import type { Config } from "../config";
import { orderPlacedSchema } from "../order";
import {
	type ChannelOptions,
	type ConsumeOptions,
	chunk,
	type OrderConsumer,
	type OrderHandler,
	type OrderProducer,
	type QueueAdapter,
} from "../queue";

const BULK_SIZE = 500;
/** Short on purpose, so the redelivery experiment does not wait the default 30 seconds. */
const LOCK_MS = 3000;

export class BullmqAdapter implements QueueAdapter {
	readonly broker = "bullmq";
	private readonly connection: ConnectionOptions;

	constructor(
		config: Config,
		private readonly channel: string,
	) {
		const url = new URL(config.REDIS_URL);
		// EN: A worker blocks on Redis waiting for jobs, so the per-request retry limit of the
		//     Redis client must be disabled, as BullMQ requires.
		// PT: Um worker fica bloqueado no Redis esperando jobs, então o limite de retentativas por
		//     requisição do cliente Redis precisa ser desativado, como o BullMQ exige.
		// ES: Un worker se queda bloqueado en Redis esperando jobs, así que el límite de reintentos
		//     por solicitud del cliente Redis debe desactivarse, como exige BullMQ.
		this.connection = { host: url.hostname, port: Number(url.port || 6379), maxRetriesPerRequest: null };
	}

	async prepare(_options?: ChannelOptions): Promise<void> {
		const queue = new Queue(this.channel, { connection: this.connection });
		await queue.obliterate({ force: true });
		await queue.close();
	}

	async createProducer(): Promise<OrderProducer> {
		const queue = new Queue(this.channel, { connection: this.connection });
		await queue.waitUntilReady();
		return {
			send: async (orders) => {
				for (const part of chunk(orders, BULK_SIZE)) {
					await queue.addBulk(
						part.map((order) => ({
							name: "order-placed",
							data: order,
							opts: { removeOnComplete: true, removeOnFail: true },
						})),
					);
				}
			},
			close: () => queue.close(),
		};
	}

	async consume(handler: OrderHandler, options: ConsumeOptions): Promise<OrderConsumer> {
		const worker = new Worker(
			this.channel,
			async (job) => {
				const order = orderPlacedSchema.parse(job.data);
				// EN: `attemptsStarted` counts how many times a worker began this job. Above 1,
				//     somebody started it before and did not finish.
				// PT: `attemptsStarted` conta quantas vezes um worker começou este job. Acima de 1,
				//     alguém já o começou antes e não terminou.
				// ES: `attemptsStarted` cuenta cuántas veces un worker empezó este job. Por encima
				//     de 1, alguien ya lo empezó antes y no terminó.
				await handler(order, { redelivered: job.attemptsStarted > 1 });
			},
			{
				connection: this.connection,
				concurrency: options.parallelism,
				lockDuration: LOCK_MS,
				stalledInterval: 1000,
				maxStalledCount: 3,
			},
		);
		worker.on("error", (error) => console.error(`bullmq worker: ${error.message}`));
		await worker.waitUntilReady();
		return { stop: () => worker.close() };
	}
}
