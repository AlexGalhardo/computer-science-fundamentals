// EN: Integration tests against a real broker. `BROKER` chooses which one, and docker-compose
//     starts only that broker for the run. The same three tests run on the four brokers, because
//     they are written against the shared interfaces.
// PT: Testes de integração contra um broker real. `BROKER` escolhe qual, e o docker-compose sobe
//     só esse broker para a execução. Os mesmos três testes rodam nos quatro brokers, porque são
//     escritos contra as interfaces comuns.
// ES: Pruebas de integración contra un broker real. `BROKER` elige cuál, y docker-compose levanta
//     solo ese broker para la ejecución. Las mismas tres pruebas corren en los cuatro brokers,
//     porque están escritas contra las interfaces comunes.

import { describe, expect, test } from "bun:test";
import { adapterFactory } from "../src/adapters";
import { loadConfig } from "../src/config";
import { EXPECTED } from "../src/expected";
import { orderingExperiment, redeliveryExperiment, roundTrip } from "../src/experiments";
import { makeOrders } from "../src/order";
import { isBrokerName } from "../src/queue";

const selected = process.env.BROKER ?? "";
const TIMEOUT_MS = 180_000;

describe.skipIf(!isBrokerName(selected))(`${selected || "no broker selected"}`, () => {
	if (!isBrokerName(selected)) {
		return;
	}
	const broker = selected;
	const factory = adapterFactory(broker, loadConfig());
	const expected = EXPECTED[broker];

	test(
		"1,000 messages sent, 1,000 received, one simulated e-mail each",
		async () => {
			const orders = makeOrders(1000, "it");
			const { received, emails } = await roundTrip(factory, orders, { parallelism: 8 });
			const ids = new Set(received.map((order) => order.id));
			expect(ids.size).toBe(1000);
			expect([...ids].sort()).toEqual(orders.map((order) => order.id));
			// At-least-once allows a duplicate, never a loss.
			expect(emails).toBeGreaterThanOrEqual(1000);
			console.log(`${broker}: sent 1000, distinct received ${ids.size}, deliveries ${received.length}`);
		},
		TIMEOUT_MS,
	);

	test(
		"ordering: are messages received in the order sent?",
		async () => {
			const result = await orderingExperiment(factory);
			console.log(`${broker}: ordering ${JSON.stringify(result)}`);
			expect(result.messages).toBeGreaterThanOrEqual(200);
			if (expected.globalOrder !== null) {
				expect(result.globalOrder).toBe(expected.globalOrder);
			}
			if (expected.perKeyOrder !== null) {
				expect(result.perKeyOrder).toBe(expected.perKeyOrder);
			}
		},
		TIMEOUT_MS,
	);

	test(
		"redelivery: the consumer crashes before acknowledging",
		async () => {
			const result = await redeliveryExperiment(broker, factory);
			console.log(`${broker}: redelivery ${JSON.stringify(result)}`);
			expect(result.redelivered).toBe(expected.redelivered);
			expect(result.brokerFlag).toBe(expected.brokerFlag);
		},
		TIMEOUT_MS,
	);
});
