// EN: Entry point of the payment service: the consumer of OrderCreated, the outbox relay and a
//     small read-only HTTP API used by the tests and the demo.
// PT: Ponto de entrada do serviço de pagamentos: o consumidor de OrderCreated, o relay do outbox
//     e uma pequena API HTTP somente leitura usada pelos testes e pela demo.
// ES: Punto de entrada del servicio de pagos: el consumidor de OrderCreated, el relay del outbox
//     y una pequeña API HTTP de solo lectura usada por las pruebas y la demo.

import { Elysia } from "elysia";
import { z } from "zod";
import { findPayment, handleOrderCreated, PAYMENT_SCHEMA } from "./payments";
import { connectBroker } from "./shared/broker";
import { loadConfig } from "./shared/config";
import { createPool, migrate } from "./shared/db";
import { startRelay, unpublishedCount } from "./shared/outbox";

const config = loadConfig();
const pool = createPool(config.DATABASE_URL);
await migrate(pool, PAYMENT_SCHEMA);
const broker = await connectBroker(config.BROKER_URL);

let duplicatesSkipped = 0;
await broker.subscribe("payment-service.orders", ["order.created"], async (event) => {
	if ((await handleOrderCreated(pool, event)) === "duplicate") {
		duplicatesSkipped += 1;
	}
});
startRelay(pool, broker.publish, config.RELAY_INTERVAL_MS);

new Elysia()
	.get("/health", () => ({ ok: true }))
	.get("/stats", async () => ({ unpublished: await unpublishedCount(pool), duplicatesSkipped }))
	.get(
		"/payments/:orderId",
		async ({ params, status }) => {
			const payment = await findPayment(pool, params.orderId);
			return payment === null ? status(404, { error: "payment not found" }) : payment;
		},
		{ params: z.object({ orderId: z.uuid() }) },
	)
	.listen({ port: config.PORT, hostname: "0.0.0.0" });

console.log(`payment-service listening on port ${config.PORT}`);
