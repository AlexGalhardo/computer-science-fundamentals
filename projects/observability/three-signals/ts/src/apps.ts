// EN: The two TypeScript services as plain functions from Request to Response, so the tests
//     can call them with in-memory telemetry and no network. `gateway.ts` and `orders.ts` only
//     plug these into `Bun.serve`.
// PT: Os dois serviços TypeScript como funções simples de Request para Response, para que os
//     testes possam chamá-los com telemetria em memória e sem rede. `gateway.ts` e `orders.ts`
//     apenas os ligam ao `Bun.serve`.
// ES: Los dos servicios TypeScript como funciones simples de Request a Response, para que las
//     pruebas puedan llamarlos con telemetría en memoria y sin red. `gateway.ts` y `orders.ts`
//     solo los conectan a `Bun.serve`.

import { z } from "zod";
import { activeTraceId, handleRequest, log, tracedFetch } from "./instrument";
import type { Telemetry } from "./telemetry";

export type App = (request: Request) => Promise<Response>;

const checkoutQuerySchema = z.object({
	sku: z.string().regex(/^[a-z0-9-]{1,40}$/),
	qty: z.coerce.number().int().min(1).max(100).default(1),
});

const orderBodySchema = z.object({
	sku: z.string().regex(/^[a-z0-9-]{1,40}$/),
	qty: z.number().int().min(1).max(100),
});

const stockSchema = z.object({ sku: z.string(), inStock: z.boolean(), shelf: z.string() });

// EN: The trace id goes back to the caller in a response header. With it a person (or a
//     support ticket) can jump straight to the trace of that one request.
// PT: O trace id volta para quem chamou em um cabeçalho da resposta. Com ele uma pessoa (ou um
//     chamado de suporte) pula direto para o trace daquela requisição.
// ES: El trace id vuelve a quien llamó en un encabezado de la respuesta. Con él una persona (o un
//     ticket de soporte) salta directo al trace de esa petición.
function withTraceId(response: Response): Response {
	const traceId = activeTraceId();
	if (traceId !== undefined) {
		response.headers.set("x-trace-id", traceId);
	}
	return response;
}

/** Gateway: `GET /checkout?sku=...&qty=...` validates the input and asks the orders service. */
export function gatewayApp(telemetry: Telemetry, ordersUrl: string): App {
	return async (request) => {
		const url = new URL(request.url);
		if (url.pathname === "/health") {
			return new Response("ok");
		}
		if (request.method !== "GET" || url.pathname !== "/checkout") {
			return Response.json({ error: "not found" }, { status: 404 });
		}
		return handleRequest(telemetry, request, "/checkout", async () => {
			const query = checkoutQuerySchema.safeParse(Object.fromEntries(url.searchParams));
			if (!query.success) {
				return withTraceId(Response.json({ error: "invalid sku or qty" }, { status: 400 }));
			}
			const response = await tracedFetch(telemetry, "POST orders", `${ordersUrl}/orders`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(query.data),
			});
			return withTraceId(Response.json(await response.json(), { status: response.status }));
		});
	};
}

/** Orders: `POST /orders` prices the order and asks the inventory service (Go) for stock. */
export function ordersApp(telemetry: Telemetry, inventoryUrl: string): App {
	return async (request) => {
		const url = new URL(request.url);
		if (url.pathname === "/health") {
			return new Response("ok");
		}
		if (request.method !== "POST" || url.pathname !== "/orders") {
			return Response.json({ error: "not found" }, { status: 404 });
		}
		return handleRequest(telemetry, request, "/orders", async () => {
			const body = orderBodySchema.safeParse(await request.json().catch(() => undefined));
			if (!body.success) {
				return Response.json({ error: "invalid order" }, { status: 400 });
			}
			const { sku, qty } = body.data;

			// EN: An INTERNAL span marks a step inside this process. Without it the trace would
			//     show only "orders took N ms", not which part of orders.
			// PT: Um span INTERNAL marca uma etapa dentro deste processo. Sem ele o trace
			//     mostraria só "orders levou N ms", e não qual parte de orders.
			// ES: Un span INTERNAL marca un paso dentro de este proceso. Sin él el trace
			//     mostraría solo "orders tardó N ms", y no qué parte de orders.
			const total = telemetry.tracer.startActiveSpan("orders.price", (span) => {
				const cents = qty * (500 + (sku.length % 7) * 100);
				span.setAttributes({ "order.sku": sku, "order.qty": qty, "order.total_cents": cents });
				span.end();
				return cents;
			});

			const response = await tracedFetch(telemetry, "GET inventory", `${inventoryUrl}/stock/${sku}`);
			if (!response.ok) {
				log(telemetry, "error", "inventory call failed", { "order.sku": sku, status: response.status });
				return Response.json({ error: "inventory unavailable" }, { status: 502 });
			}
			const stock = stockSchema.parse(await response.json());
			log(telemetry, "info", "order priced and stock checked", {
				"order.sku": sku,
				"order.qty": qty,
				in_stock: stock.inStock,
			});
			return Response.json({ sku, qty, totalCents: total, inStock: stock.inStock, shelf: stock.shelf });
		});
	};
}
