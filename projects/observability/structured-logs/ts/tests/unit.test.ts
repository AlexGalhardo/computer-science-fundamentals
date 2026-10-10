// EN: Unit tests: no network, no broker, no Loki. The services are called as functions, with
//     a logger that writes into an array.
// PT: Testes unitários: sem rede, sem broker, sem Loki. Os serviços são chamados como funções,
//     com um logger que grava em um array.
// ES: Pruebas unitarias: sin red, sin broker, sin Loki. Los servicios se llaman como funciones,
//     con un logger que escribe en un array.

import { describe, expect, test } from "bun:test";
import { apiApp, type OrderMessage, ordersApp, workerHandler } from "../src/apps";
import { readServiceEnv } from "../src/config";
import {
	CORRELATION_HEADER,
	correlationIdFrom,
	currentCorrelationId,
	isCorrelationId,
	newCorrelationId,
	runWithCorrelation,
} from "../src/correlation";
import { jsonQuery, textQuery } from "../src/lab";
import { createLogger, formatJson, formatText, type Logger } from "../src/logger";
import { createShipper } from "../src/shipper";

const FIXED = new Date("2026-10-07T12:34:56.789Z");

function memoryLogger(format: "json" | "text", service = "api"): { logger: Logger; lines: string[] } {
	const lines: string[] = [];
	const logger = createLogger({ service, format, write: (line) => lines.push(line), now: () => FIXED });
	return { logger, lines };
}

describe("correlation id", () => {
	test("accepts ids made of safe characters and rejects everything else", () => {
		expect(isCorrelationId("req-json-1-0a1b2c3d")).toBe(true);
		expect(isCorrelationId(newCorrelationId())).toBe(true);
		expect(isCorrelationId("short")).toBe(false);
		expect(isCorrelationId("a".repeat(65))).toBe(false);
		expect(isCorrelationId(undefined)).toBe(false);
		// EN: A line break would forge a log line; a quote would change a LogQL query.
		// PT: Uma quebra de linha forjaria uma linha de log; uma aspa mudaria uma consulta LogQL.
		// ES: Un salto de línea falsificaría una línea de log; una comilla cambiaría una consulta LogQL.
		expect(isCorrelationId("abcdefgh\nlevel=error")).toBe(false);
		expect(isCorrelationId('abcdefgh" or "1"="1')).toBe(false);
	});

	test("keeps a valid incoming id and replaces an invalid one", () => {
		expect(correlationIdFrom("req-12345678")).toBe("req-12345678");
		const generated = correlationIdFrom("bad id!");
		expect(generated).not.toBe("bad id!");
		expect(isCorrelationId(generated)).toBe(true);
	});

	test("AsyncLocalStorage keeps interleaved requests apart across awaits", async () => {
		expect(currentCorrelationId()).toBeUndefined();
		const seen = await Promise.all(
			["req-aaaaaaaa", "req-bbbbbbbb", "req-cccccccc"].map((id, index) =>
				runWithCorrelation(id, async () => {
					// EN: The later a request starts, the sooner it wakes up: the three chains
					//     really do interleave on the single thread.
					// PT: Quanto mais tarde uma requisição começa, mais cedo ela acorda: as três
					//     cadeias realmente se intercalam na única thread.
					// ES: Cuanto más tarde empieza una petición, más temprano despierta: las tres
					//     cadenas realmente se intercalan en el único thread.
					await Bun.sleep(15 - index * 5);
					return currentCorrelationId();
				}),
			),
		);
		expect(seen).toEqual(["req-aaaaaaaa", "req-bbbbbbbb", "req-cccccccc"]);
		expect(currentCorrelationId()).toBeUndefined();
	});
});

describe("logger formats", () => {
	const event = {
		message: "order created",
		fields: { order_id: "ord-0a1b2c3d", qty: 2 },
		text: "Created order ord-0a1b2c3d",
	};

	test("JSON: one object per line, UTC ISO 8601 timestamp, correlation id from the context", () => {
		const line = runWithCorrelation("req-12345678", () => formatJson("orders", "info", event, FIXED));
		expect(line).not.toContain("\n");
		expect(JSON.parse(line)).toEqual({
			order_id: "ord-0a1b2c3d",
			qty: 2,
			timestamp: "2026-10-07T12:34:56.789Z",
			level: "info",
			service: "orders",
			message: "order created",
			correlation_id: "req-12345678",
		});
	});

	test("JSON: an event field cannot overwrite the fixed keys", () => {
		const line = runWithCorrelation("req-12345678", () =>
			formatJson(
				"orders",
				"info",
				{ message: "m", fields: { correlation_id: "forged", service: "forged" }, text: "t" },
				FIXED,
			),
		);
		expect(JSON.parse(line)).toMatchObject({ correlation_id: "req-12345678", service: "orders" });
	});

	test("JSON: outside a request there is no correlation_id key", () => {
		expect(JSON.parse(formatJson("orders", "info", event, FIXED))).not.toHaveProperty("correlation_id");
	});

	test("text: a sentence with no correlation id and no fields", () => {
		const line = runWithCorrelation("req-12345678", () => formatText("orders", "warn", event, FIXED));
		expect(line).toBe("2026-10-07 12:34:56 WARN [orders] Created order ord-0a1b2c3d");
		expect(line).not.toContain("req-12345678");
	});
});

describe("services", () => {
	test("api: forwards the correlation id in the header, logs it and returns it", async () => {
		const { logger, lines } = memoryLogger("json");
		let forwarded: string | null = null;
		const app = apiApp({
			logger,
			ordersUrl: "http://orders.test",
			fetch: async (_url, init) => {
				forwarded = new Headers(init.headers).get(CORRELATION_HEADER);
				return Response.json({ orderId: "ord-0a1b2c3d" }, { status: 201 });
			},
		});
		const response = await app(
			new Request("http://api.test/checkout", {
				method: "POST",
				headers: { [CORRELATION_HEADER]: "req-12345678" },
				body: JSON.stringify({ customer: "alice", sku: "blue-pen", qty: 2 }),
			}),
		);
		expect(response.status).toBe(201);
		expect(response.headers.get(CORRELATION_HEADER)).toBe("req-12345678");
		expect(String(forwarded)).toBe("req-12345678");
		const parsed = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
		expect(parsed.map((line) => line.message)).toEqual(["checkout received", "checkout answered"]);
		expect(parsed.every((line) => line.correlation_id === "req-12345678")).toBe(true);
	});

	test("api: with no header, generates an id and uses it everywhere", async () => {
		const { logger, lines } = memoryLogger("json");
		const app = apiApp({
			logger,
			ordersUrl: "http://orders.test",
			fetch: async () => Response.json({ orderId: "ord-0a1b2c3d" }, { status: 201 }),
		});
		const response = await app(
			new Request("http://api.test/checkout", {
				method: "POST",
				body: JSON.stringify({ customer: "bob", sku: "blue-pen", qty: 1 }),
			}),
		);
		const id = response.headers.get(CORRELATION_HEADER);
		expect(isCorrelationId(id)).toBe(true);
		expect(lines.map((line) => (JSON.parse(line) as Record<string, unknown>).correlation_id)).toEqual([id, id]);
	});

	test("api: rejects an invalid body with 400", async () => {
		const { logger } = memoryLogger("json");
		const app = apiApp({ logger, ordersUrl: "http://orders.test", fetch: async () => new Response("unused") });
		const response = await app(
			new Request("http://api.test/checkout", {
				method: "POST",
				body: JSON.stringify({ customer: "A", qty: 0 }),
			}),
		);
		expect(response.status).toBe(400);
	});

	test("orders -> queue -> worker: the id crosses the queue as a message property", async () => {
		const { logger, lines } = memoryLogger("json", "orders");
		// EN: A fake queue that does what broker.ts does: remember the id at publish time and
		//     restore it around the handler, later, outside the request.
		// PT: Uma fila falsa que faz o que o broker.ts faz: guarda o id na hora de publicar e o
		//     restaura em volta do handler, depois, fora da requisição.
		// ES: Una cola falsa que hace lo que hace broker.ts: guarda el id al publicar y lo
		//     restaura alrededor del handler, después, fuera de la petición.
		const queue: Array<{ payload: OrderMessage; correlationId: string | undefined }> = [];
		const orders = ordersApp({
			logger,
			queue: "orders.test",
			newOrderId: () => "ord-0a1b2c3d",
			publish: async (payload) => {
				queue.push({ payload, correlationId: currentCorrelationId() });
			},
		});
		const response = await orders(
			new Request("http://orders.test/orders", {
				method: "POST",
				headers: { [CORRELATION_HEADER]: "req-12345678" },
				body: JSON.stringify({ customer: "alice", sku: "blue-pen", qty: 2 }),
			}),
		);
		expect(response.status).toBe(201);
		expect(queue).toHaveLength(1);

		const message = queue[0];
		const handler = workerHandler({ logger, work: async () => undefined });
		expect(currentCorrelationId()).toBeUndefined();
		await runWithCorrelation(correlationIdFrom(message?.correlationId), () => handler(message?.payload));

		const parsed = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
		expect(parsed.map((line) => line.message)).toEqual([
			"order created",
			"order queued",
			"order picked up",
			"confirmation sent",
		]);
		expect(parsed.every((line) => line.correlation_id === "req-12345678")).toBe(true);
		expect(parsed.every((line) => line.order_id === "ord-0a1b2c3d")).toBe(true);
	});

	test("worker: rejects a malformed message", async () => {
		const { logger } = memoryLogger("json", "worker");
		await expect(workerHandler({ logger })({ orderId: "nope" })).rejects.toThrow("invalid order message");
	});

	test("text variant: same events, but some sentences have no id at all", async () => {
		const { logger, lines } = memoryLogger("text");
		const app = apiApp({
			logger,
			ordersUrl: "http://orders.test",
			fetch: async () => Response.json({ orderId: "ord-0a1b2c3d" }, { status: 201 }),
		});
		await app(
			new Request("http://api.test/checkout", {
				method: "POST",
				headers: { [CORRELATION_HEADER]: "req-12345678" },
				body: JSON.stringify({ customer: "alice", sku: "blue-pen", qty: 2 }),
			}),
		);
		expect(lines).toHaveLength(2);
		expect(lines[0]).toBe("2026-10-07 12:34:56 INFO [api] Checkout request from alice for 2 x blue-pen");
		expect(lines.some((line) => line.includes("req-12345678") || line.includes("ord-0a1b2c3d"))).toBe(false);
	});
});

describe("shipper", () => {
	test("sends batches in the Loki push format, with increasing nanosecond timestamps", async () => {
		const sent: Array<{ url: string; body: string }> = [];
		const shipper = createShipper({
			lokiUrl: "http://loki.test/",
			labels: { service: "api", format: "json" },
			intervalMs: 60_000,
			send: async (url, body) => {
				sent.push({ url, body });
				return true;
			},
		});
		shipper.add("first", FIXED);
		shipper.add("second", FIXED);
		await shipper.stop();

		expect(sent).toHaveLength(1);
		expect(sent[0]?.url).toBe("http://loki.test/loki/api/v1/push");
		expect(JSON.parse(sent[0]?.body ?? "")).toEqual({
			streams: [
				{
					stream: { service: "api", format: "json" },
					values: [
						["1791376496789000000", "first"],
						["1791376496789000001", "second"],
					],
				},
			],
		});
	});

	test("keeps the lines when Loki is not reachable and sends them on the next flush", async () => {
		const bodies: string[] = [];
		let up = false;
		const shipper = createShipper({
			lokiUrl: "http://loki.test",
			labels: { service: "api", format: "json" },
			intervalMs: 60_000,
			send: async (_url, body) => {
				if (up) {
					bodies.push(body);
				}
				return up;
			},
		});
		shipper.add("kept", FIXED);
		await shipper.flush();
		expect(bodies).toHaveLength(0);
		up = true;
		await shipper.stop();
		expect(bodies).toHaveLength(1);
		expect(bodies[0]).toContain("kept");
	});
});

describe("queries and configuration", () => {
	test("the LogQL of each variant", () => {
		expect(jsonQuery("req-12345678")).toBe('{format="json"} | json | correlation_id="req-12345678"');
		expect(textQuery("ord-0a1b2c3d")).toBe('{format="text"} |= "ord-0a1b2c3d"');
	});

	test("a query is never built from an unvalidated value", () => {
		expect(() => jsonQuery('x" or "1"="1')).toThrow();
		expect(() => textQuery('x" | drop')).toThrow();
	});

	test("the environment is validated", () => {
		expect(readServiceEnv({ BROKER_URL: "amqp://lab:lab-fake-password@broker:5672" }).LOG_FORMAT).toBe("json");
		expect(() => readServiceEnv({ BROKER_URL: "amqp://broker", LOG_FORMAT: "xml" })).toThrow();
		expect(() => readServiceEnv({ BROKER_URL: "http://broker" })).toThrow();
	});
});
