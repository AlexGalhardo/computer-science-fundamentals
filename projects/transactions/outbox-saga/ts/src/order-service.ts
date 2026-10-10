// EN: Entry point of the order service: HTTP API (ElysiaJS), the consumer of payment events and
//     the outbox relay, all in one process.
// PT: Ponto de entrada do serviço de pedidos: API HTTP (ElysiaJS), o consumidor dos eventos de
//     pagamento e o relay do outbox, tudo em um processo.
// ES: Punto de entrada del servicio de pedidos: API HTTP (ElysiaJS), el consumidor de los eventos de
//     pago y el relay del outbox, todo en un proceso.

import { Elysia } from "elysia";
import { z } from "zod";
import { createOrder, createOrderBody, findOrder, handlePaymentEvent, ORDER_SCHEMA } from "./orders";
import { connectBroker } from "./shared/broker";
import { loadConfig } from "./shared/config";
import { createPool, migrate } from "./shared/db";
import { startRelay, unpublishedCount } from "./shared/outbox";

const config = loadConfig();
const pool = createPool(config.DATABASE_URL);
await migrate(pool, ORDER_SCHEMA);
const broker = await connectBroker(config.BROKER_URL);

await broker.subscribe("order-service.payments", ["payment.*"], async (event) => {
	await handlePaymentEvent(pool, event);
});
startRelay(pool, broker.publish, config.RELAY_INTERVAL_MS);

// EN: A real crash, not an exception: the process ends at once, with no cleanup and no chance to
//     run the lines that would come next. Docker restarts the container (`restart: on-failure`).
// PT: Uma queda de verdade, não uma exceção: o processo termina na hora, sem limpeza e sem chance
//     de rodar as linhas que viriam depois. O Docker reinicia o contêiner (`restart: on-failure`).
// ES: Una caída de verdad, no una excepción: el proceso termina al instante, sin limpieza y sin
//     oportunidad de ejecutar las líneas que vendrían después. Docker reinicia el contenedor (`restart: on-failure`).
function crash(): void {
	console.error("order-service: simulated crash after the database commit");
	process.exit(1);
}

new Elysia()
	.get("/health", () => ({ ok: true }))
	.get("/stats", async () => ({ unpublished: await unpublishedCount(pool) }))
	.get(
		"/orders/:id",
		async ({ params, status }) => {
			const order = await findOrder(pool, params.id);
			return order === null ? status(404, { error: "order not found" }) : order;
		},
		{ params: z.object({ id: z.uuid() }) },
	)
	.post(
		"/orders",
		async ({ body, headers, status }) => {
			const result = await createOrder(
				{ pool, publish: broker.publish, crash },
				body,
				headers["idempotency-key"],
			);
			return status(result.replayed ? 200 : 201, result.order);
		},
		{
			body: createOrderBody,
			headers: z.object({ "idempotency-key": z.string().min(1).max(128).optional() }),
		},
	)
	.listen({ port: config.PORT, hostname: "0.0.0.0" });

console.log(`order-service listening on port ${config.PORT}`);
