// EN: Amazon SQS, emulated by LocalStack inside docker-compose. Nothing here reaches AWS: the
//     endpoint is the local container and the credentials are fake. SQS is pull-based: the
//     consumer polls over HTTP. A received message is hidden for the visibility timeout, not
//     removed; the consumer must delete it, and that delete is the acknowledgement.
// PT: Amazon SQS, emulado pelo LocalStack dentro do docker-compose. Nada aqui chega à AWS: o
//     endpoint é o contêiner local e as credenciais são falsas. O SQS é pull: o consumidor
//     consulta por HTTP. Uma mensagem recebida fica escondida pelo visibility timeout, não é
//     removida; o consumidor precisa apagá-la, e esse delete é a confirmação.
// ES: Amazon SQS, emulado por LocalStack dentro de docker-compose. Nada aquí llega a AWS: el
//     endpoint es el contenedor local y las credenciales son falsas. SQS es pull: el consumidor
//     consulta por HTTP. Un mensaje recibido queda oculto durante el visibility timeout, no se
//     elimina; el consumidor debe borrarlo, y ese delete es la confirmación.

import {
	CreateQueueCommand,
	DeleteMessageBatchCommand,
	GetQueueUrlCommand,
	type Message,
	ReceiveMessageCommand,
	SendMessageBatchCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
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

/** The API accepts at most 10 messages per call, for sends, receives and deletes. */
const API_BATCH = 10;
const PARALLEL_SENDS = 8;
/** Short on purpose, so the redelivery experiment does not wait the default 30 seconds. */
const VISIBILITY_TIMEOUT_S = 5;

export class SqsAdapter implements QueueAdapter {
	readonly broker = "sqs";
	private readonly client: SQSClient;
	private queueUrl: string | undefined;

	constructor(
		config: Config,
		private readonly channel: string,
	) {
		this.client = new SQSClient({
			endpoint: config.SQS_ENDPOINT,
			region: config.AWS_REGION,
			credentials: { accessKeyId: config.AWS_ACCESS_KEY_ID, secretAccessKey: config.AWS_SECRET_ACCESS_KEY },
			// EN: Always talk to the configured local endpoint, never to a host taken from a
			//     queue URL returned by the service.
			// PT: Sempre fala com o endpoint local configurado, nunca com um host tirado de uma
			//     URL de fila devolvida pelo serviço.
			// ES: Siempre habla con el endpoint local configurado, nunca con un host tomado de
			//     una URL de cola devuelta por el servicio.
			useQueueUrlAsEndpoint: false,
		});
	}

	private async url(): Promise<string> {
		if (this.queueUrl === undefined) {
			const found = await this.client.send(new GetQueueUrlCommand({ QueueName: this.channel }));
			if (found.QueueUrl === undefined) {
				throw new Error(`sqs: queue ${this.channel} has no URL`);
			}
			this.queueUrl = found.QueueUrl;
		}
		return this.queueUrl;
	}

	async prepare(_options?: ChannelOptions): Promise<void> {
		// EN: A standard queue: at-least-once delivery and best-effort ordering.
		// PT: Uma fila standard: entrega at-least-once e ordem por melhor esforço.
		// ES: Una cola estándar: entrega at-least-once y orden de mejor esfuerzo.
		const created = await this.client.send(
			new CreateQueueCommand({
				QueueName: this.channel,
				Attributes: { VisibilityTimeout: String(VISIBILITY_TIMEOUT_S) },
			}),
		);
		this.queueUrl = created.QueueUrl;
	}

	async createProducer(): Promise<OrderProducer> {
		const queueUrl = await this.url();
		const sendBatch = async (orders: Parameters<OrderProducer["send"]>[0]): Promise<void> => {
			const result = await this.client.send(
				new SendMessageBatchCommand({
					QueueUrl: queueUrl,
					Entries: orders.map((order, index) => ({ Id: String(index), MessageBody: encodeOrder(order) })),
				}),
			);
			if ((result.Failed?.length ?? 0) > 0) {
				throw new Error(`sqs: ${result.Failed?.length} messages were rejected`);
			}
		};
		return {
			send: async (orders) => {
				// EN: Each wave sends up to 8 batches of 10 at the same time. Waves are sent
				//     one after the other, so a later wave never overtakes an earlier one.
				// PT: Cada onda envia até 8 lotes de 10 ao mesmo tempo. As ondas vão uma depois
				//     da outra, então uma onda posterior nunca ultrapassa uma anterior.
				// ES: Cada oleada envía hasta 8 lotes de 10 al mismo tiempo. Las oleadas se envían
				//     una tras otra, así que una oleada posterior nunca adelanta a una anterior.
				for (const wave of chunk(chunk(orders, API_BATCH), PARALLEL_SENDS)) {
					await Promise.all(wave.map(sendBatch));
				}
			},
			close: async () => {},
		};
	}

	async consume(handler: OrderHandler, options: ConsumeOptions): Promise<OrderConsumer> {
		const queueUrl = await this.url();
		const abort = new AbortController();

		const handleAll = async (messages: Message[]): Promise<void> => {
			const done: Message[] = [];
			for (const message of messages) {
				try {
					const receives = Number(message.Attributes?.ApproximateReceiveCount ?? "1");
					await handler(decodeOrder(message.Body ?? ""), { redelivered: receives > 1 });
					done.push(message);
				} catch (error) {
					// EN: Not deleted: it becomes visible again after the visibility timeout.
					// PT: Não é apagada: volta a ficar visível depois do visibility timeout.
					// ES: No se borra: vuelve a ser visible después del visibility timeout.
					console.error("sqs consumer: handler failed, the message will reappear", error);
				}
			}
			if (done.length > 0) {
				await this.client.send(
					new DeleteMessageBatchCommand({
						QueueUrl: queueUrl,
						Entries: done.map((message, index) => ({
							Id: String(index),
							ReceiptHandle: message.ReceiptHandle,
						})),
					}),
				);
			}
		};

		const poll = async (): Promise<void> => {
			while (!abort.signal.aborted) {
				try {
					// EN: Long polling: the call waits up to 1 s for a message instead of
					//     returning empty at once.
					// PT: Long polling: a chamada espera até 1 s por uma mensagem em vez de
					//     voltar vazia na hora.
					// ES: Long polling: la llamada espera hasta 1 s por un mensaje en lugar de
					//     volver vacía al instante.
					const received = await this.client.send(
						new ReceiveMessageCommand({
							QueueUrl: queueUrl,
							MaxNumberOfMessages: API_BATCH,
							WaitTimeSeconds: 1,
							MessageSystemAttributeNames: ["ApproximateReceiveCount"],
						}),
						{ abortSignal: abort.signal },
					);
					await handleAll(received.Messages ?? []);
				} catch (error) {
					if (!abort.signal.aborted) {
						console.error("sqs consumer: poll failed", error);
						await Bun.sleep(200);
					}
				}
			}
		};

		const pollers = Array.from({ length: options.parallelism }, () => poll());
		return {
			stop: async () => {
				abort.abort();
				await Promise.all(pollers);
			},
		};
	}
}
