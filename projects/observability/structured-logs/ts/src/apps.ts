// EN: The three services as plain functions with their dependencies passed in, so the unit
//     tests run them with an in-memory logger, a fake HTTP call and a fake queue. Every request
//     writes six log lines, two per service:
//       api     checkout received  -> checkout answered
//       orders  order created      -> order queued
//       worker  order picked up    -> confirmation sent
// PT: Os três serviços como funções simples que recebem as suas dependências, para que os
//     testes unitários os rodem com um logger em memória, uma chamada HTTP falsa e uma fila
//     falsa. Cada requisição grava seis linhas de log, duas por serviço:
//       api     checkout received  -> checkout answered
//       orders  order created      -> order queued
//       worker  order picked up    -> confirmation sent

import { z } from "zod";
import { CORRELATION_HEADER, correlationIdFrom, currentCorrelationId, runWithCorrelation } from "./correlation";
import type { Logger } from "./logger";

export type App = (request: Request) => Promise<Response>;

const checkoutSchema = z.object({
	customer: z.string().regex(/^[a-z]{2,20}$/),
	sku: z.string().regex(/^[a-z0-9-]{1,40}$/),
	qty: z.number().int().min(1).max(100),
});

export const orderMessageSchema = checkoutSchema.extend({ orderId: z.string().regex(/^ord-[0-9a-f]{8}$/) });
export type OrderMessage = z.infer<typeof orderMessageSchema>;

const orderCreatedSchema = z.object({ orderId: z.string() });

async function readJson(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		return undefined;
	}
}

// EN: The edge of each HTTP service. The id of the incoming header is reused when valid, so
//     the chain started upstream continues; otherwise a new one starts here. Everything the
//     handler does runs inside that id, and the response carries it back, so the caller can
//     quote it in a bug report.
// PT: A borda de cada serviço HTTP. O id do cabeçalho recebido é reaproveitado quando válido,
//     então a cadeia iniciada antes continua; senão uma nova começa aqui. Tudo que o handler
//     faz roda dentro desse id, e a resposta o devolve, para que quem chamou possa citá-lo em
//     um relato de erro.
function withCorrelation(request: Request, handler: () => Promise<Response>): Promise<Response> {
	const correlationId = correlationIdFrom(request.headers.get(CORRELATION_HEADER));
	return runWithCorrelation(correlationId, async () => {
		const response = await handler();
		response.headers.set(CORRELATION_HEADER, correlationId);
		return response;
	});
}

export interface ApiDeps {
	logger: Logger;
	ordersUrl: string;
	fetch?: (url: string, init: RequestInit) => Promise<Response>;
}

/** api: `POST /checkout` validates the order and forwards it to the orders service over HTTP. */
export function apiApp(deps: ApiDeps): App {
	const call = deps.fetch ?? ((url: string, init: RequestInit): Promise<Response> => fetch(url, init));
	return async (request) => {
		const url = new URL(request.url);
		if (url.pathname === "/health") {
			return new Response("ok");
		}
		if (request.method !== "POST" || url.pathname !== "/checkout") {
			return Response.json({ error: "not found" }, { status: 404 });
		}
		return withCorrelation(request, async () => {
			const started = performance.now();
			const body = checkoutSchema.safeParse(await readJson(request));
			if (!body.success) {
				deps.logger.warn({
					message: "checkout rejected",
					fields: { reason: "invalid body" },
					text: "Bad checkout request",
				});
				return Response.json({ error: "invalid checkout" }, { status: 400 });
			}
			const { customer, sku, qty } = body.data;
			deps.logger.info({
				message: "checkout received",
				fields: { customer, sku, qty },
				text: `Checkout request from ${customer} for ${qty} x ${sku}`,
			});

			// EN: Propagation over HTTP: the id leaves this process in a request header.
			// PT: Propagação por HTTP: o id sai deste processo em um cabeçalho da requisição.
			const response = await call(`${deps.ordersUrl}/orders`, {
				method: "POST",
				headers: { "content-type": "application/json", [CORRELATION_HEADER]: currentCorrelationId() ?? "" },
				body: JSON.stringify(body.data),
			});
			const created = orderCreatedSchema.safeParse(await response.json().catch(() => undefined));
			const durationMs = Math.round(performance.now() - started);
			if (!response.ok || !created.success) {
				deps.logger.error({
					message: "checkout failed",
					fields: { status: response.status, duration_ms: durationMs },
					text: `Checkout failed after ${durationMs}ms -> ${response.status}`,
				});
				return Response.json({ error: "orders unavailable" }, { status: 502 });
			}
			// EN: The text sentence shows the usual gap of ad hoc logs: its author did not think
			//     of the order id, so this line cannot be found by searching for the order.
			// PT: A frase em texto mostra a lacuna comum de logs improvisados: quem a escreveu não
			//     pensou no id do pedido, então esta linha não é achada buscando pelo pedido.
			deps.logger.info({
				message: "checkout answered",
				fields: { order_id: created.data.orderId, status: 201, duration_ms: durationMs },
				text: `Checkout done in ${durationMs}ms -> 201`,
			});
			return Response.json({ orderId: created.data.orderId }, { status: 201 });
		});
	};
}

export interface OrdersDeps {
	logger: Logger;
	publish: (message: OrderMessage) => Promise<void>;
	queue: string;
	newOrderId?: () => string;
}

/** orders: `POST /orders` creates the order and puts it on the queue for the worker. */
export function ordersApp(deps: OrdersDeps): App {
	const newOrderId = deps.newOrderId ?? ((): string => `ord-${crypto.randomUUID().slice(0, 8)}`);
	return async (request) => {
		const url = new URL(request.url);
		if (url.pathname === "/health") {
			return new Response("ok");
		}
		if (request.method !== "POST" || url.pathname !== "/orders") {
			return Response.json({ error: "not found" }, { status: 404 });
		}
		return withCorrelation(request, async () => {
			const body = checkoutSchema.safeParse(await readJson(request));
			if (!body.success) {
				deps.logger.warn({
					message: "order rejected",
					fields: { reason: "invalid body" },
					text: "Bad order payload",
				});
				return Response.json({ error: "invalid order" }, { status: 400 });
			}
			const order: OrderMessage = { ...body.data, orderId: newOrderId() };
			deps.logger.info({
				message: "order created",
				fields: { order_id: order.orderId, customer: order.customer, sku: order.sku, qty: order.qty },
				text: `Created order ${order.orderId} (${order.customer}, ${order.qty} x ${order.sku})`,
			});
			// EN: Propagation through the queue happens inside `publish` (see broker.ts).
			// PT: A propagação pela fila acontece dentro de `publish` (veja broker.ts).
			await deps.publish(order);
			deps.logger.info({
				message: "order queued",
				fields: { order_id: order.orderId, queue: deps.queue },
				text: `order ${order.orderId} sent to queue`,
			});
			return Response.json({ orderId: order.orderId }, { status: 201 });
		});
	};
}

export interface WorkerDeps {
	logger: Logger;
	work?: () => Promise<void>;
}

/**
 * worker: handles one message from the queue. The broker layer already restored the
 * correlation id, so this code does not mention it and its lines still carry it.
 *
 * PT: worker: trata uma mensagem da fila. A camada do broker já restaurou o correlation id,
 * então este código não o menciona e as suas linhas o carregam mesmo assim.
 */
export function workerHandler(deps: WorkerDeps): (payload: unknown) => Promise<void> {
	const work = deps.work ?? ((): Promise<void> => Bun.sleep(5));
	return async (payload) => {
		const message = orderMessageSchema.safeParse(payload);
		if (!message.success) {
			deps.logger.error({
				message: "message rejected",
				fields: { reason: "invalid payload" },
				text: "Got a bad message",
			});
			throw new Error("invalid order message");
		}
		const { orderId, customer } = message.data;
		const started = performance.now();
		deps.logger.info({ message: "order picked up", fields: { order_id: orderId }, text: `Processing ${orderId}` });
		await work();
		const durationMs = Math.round(performance.now() - started);
		deps.logger.info({
			message: "confirmation sent",
			fields: { order_id: orderId, customer, duration_ms: durationMs },
			text: `Confirmation sent to ${customer}`,
		});
	};
}
