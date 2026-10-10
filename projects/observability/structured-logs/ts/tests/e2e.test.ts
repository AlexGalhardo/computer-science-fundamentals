// EN: End-to-end test, run inside the compose network: real services, a real queue, a real
//     Loki. Four concurrent checkouts go to each variant, and then the test asks for the lines
//     of one request.
// PT: Teste de ponta a ponta, rodado dentro da rede do compose: serviços reais, uma fila real,
//     um Loki real. Quatro checkouts concorrentes vão para cada variante, e então o teste pede
//     as linhas de uma requisição.
// ES: Prueba de extremo a extremo, ejecutada dentro de la red de compose: servicios reales, una cola real,
//     un Loki real. Cuatro checkouts concurrentes van a cada variante, y entonces la prueba pide
//     las líneas de una petición.

import { beforeAll, describe, expect, test } from "bun:test";
import { readLabEnv } from "../src/config";
import {
	CHECKOUTS,
	jsonQuery,
	LINES_PER_REQUEST,
	queryLoki,
	runScenario,
	type ScenarioResult,
	textQuery,
} from "../src/lab";

const env = readLabEnv();
let scenario: ScenarioResult;

beforeAll(async () => {
	scenario = await runScenario(env);
}, 180_000);

describe("structured logs (JSON)", () => {
	test("ONE query returns every line of one request, from the three services, and nothing else", async () => {
		for (const request of scenario.json) {
			const lines = await queryLoki(env.LOKI_URL, jsonQuery(request.correlationId), scenario.sinceMs);
			const parsed = lines.map((line) => JSON.parse(line.line) as Record<string, unknown>);

			expect(lines).toHaveLength(LINES_PER_REQUEST);
			expect(new Set(lines.map((line) => line.service))).toEqual(new Set(["api", "orders", "worker"]));
			expect(parsed.map((line) => line.message).sort()).toEqual(
				[
					"checkout answered",
					"checkout received",
					"confirmation sent",
					"order created",
					"order picked up",
					"order queued",
				].sort(),
			);
			// EN: No line of another request: every line has this id, and every line that names
			//     an order names this request's order.
			// PT: Nenhuma linha de outra requisição: toda linha tem este id, e toda linha que cita
			//     um pedido cita o pedido desta requisição.
			// ES: Ninguna línea de otra petición: toda línea tiene este id, y toda línea que cita
			//     un pedido cita el pedido de esta petición.
			expect(parsed.every((line) => line.correlation_id === request.correlationId)).toBe(true);
			const orderIds = new Set(parsed.map((line) => line.order_id).filter((id) => id !== undefined));
			expect(orderIds).toEqual(new Set([request.orderId]));
		}
	});

	test("the id crossed the queue: the worker lines carry the id the client sent", async () => {
		const request = scenario.json[0];
		expect(request).toBeDefined();
		const query = `{format="json", service="worker"} | json | correlation_id="${request?.correlationId}"`;
		const lines = await queryLoki(env.LOKI_URL, query, scenario.sinceMs);
		expect(lines).toHaveLength(2);
	});

	test("the requests together account for every JSON line", async () => {
		const all = await queryLoki(env.LOKI_URL, '{format="json"}', scenario.sinceMs);
		expect(all).toHaveLength(CHECKOUTS.length * LINES_PER_REQUEST);
	});
});

describe("unstructured logs (text), for contrast", () => {
	test("the variant wrote the same number of lines", async () => {
		const all = await queryLoki(env.LOKI_URL, '{format="text"}', scenario.sinceMs);
		expect(all).toHaveLength(CHECKOUTS.length * LINES_PER_REQUEST);
	});

	test("searching by order id MISSES lines: half of the request is not found", async () => {
		const request = scenario.text[0];
		expect(request).toBeDefined();
		const lines = await queryLoki(env.LOKI_URL, textQuery(request?.orderId ?? ""), scenario.sinceMs);
		expect(lines).toHaveLength(3);
		expect(lines.length).toBeLessThan(LINES_PER_REQUEST);
		// EN: The api service never wrote the order id, so the entry point of the request is invisible.
		// PT: O serviço api nunca escreveu o id do pedido, então a porta de entrada da requisição fica invisível.
		// ES: El servicio api nunca escribió el id del pedido, así que la puerta de entrada de la petición queda invisible.
		expect(lines.some((line) => line.service === "api")).toBe(false);
	});

	test("searching by customer MIXES requests: lines of two different orders come back", async () => {
		const request = scenario.text[0];
		const sameCustomer = scenario.text.filter((other) => other.customer === request?.customer);
		expect(sameCustomer.length).toBeGreaterThan(1);

		const lines = await queryLoki(env.LOKI_URL, textQuery(request?.customer ?? ""), scenario.sinceMs);
		for (const other of sameCustomer) {
			expect(lines.some((line) => line.line.includes(other.orderId))).toBe(true);
		}
		expect(lines.length).toBeGreaterThan(LINES_PER_REQUEST - 1);
	});

	test("the correlation id the client sent appears in no text line", async () => {
		const request = scenario.text[0];
		const lines = await queryLoki(env.LOKI_URL, textQuery(request?.correlationId ?? ""), scenario.sinceMs);
		expect(lines).toHaveLength(0);
	});
});
