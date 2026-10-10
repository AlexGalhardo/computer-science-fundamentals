// EN: Tests that need no broker: the message schema, the ordering analysis, the "local hosts
//     only" guard and the report. They run in a container with no network.
// PT: Testes que não precisam de broker: o schema da mensagem, a análise de ordem, a trava de
//     "somente hosts locais" e o relatório. Rodam em um contêiner sem rede.
// ES: Pruebas que no necesitan broker: el esquema del mensaje, el análisis del orden, la
//     protección de "solo hosts locales" y el reporte. Corren en un contenedor sin red.

import { describe, expect, test } from "bun:test";
import { isLocalHost, loadConfig } from "../src/config";
import { EXPECTED } from "../src/expected";
import { analyseOrder, spread } from "../src/experiments";
import { decodeOrder, encodeOrder, FakeMailer, makeOrders } from "../src/order";
import { BROKERS, chunk, isBrokerName } from "../src/queue";
import { renderReport } from "../src/report";

describe("order message", () => {
	test("survives encoding and decoding", () => {
		const [order] = makeOrders(1, "t");
		if (order === undefined) {
			throw new Error("no order");
		}
		expect(decodeOrder(encodeOrder(order))).toEqual(order);
	});

	test("a malformed message is rejected instead of trusted", () => {
		expect(() => decodeOrder('{"id":"x"}')).toThrow();
		expect(() => decodeOrder("not json")).toThrow();
	});

	test("the simulated mailer records one e-mail per order", () => {
		const mailer = new FakeMailer();
		for (const order of makeOrders(3, "t")) {
			mailer.send(order);
		}
		expect(mailer.sent.map((email) => email.orderId)).toEqual(["t-000000", "t-000001", "t-000002"]);
	});
});

describe("ordering analysis", () => {
	const orders = makeOrders(8, "t");
	const pick = (...seqs: number[]) => seqs.map((seq) => orders[seq]).filter((order) => order !== undefined);

	test("the sent order is in order", () => {
		expect(analyseOrder(orders)).toEqual({ messages: 8, globalOrder: true, perKeyOrder: true, outOfOrder: 0 });
	});

	test("partitions read one after the other keep the order per key only", () => {
		// Customers are seq % 4: partition A holds customers 0 and 2, partition B holds 1 and 3.
		const result = analyseOrder(pick(0, 2, 4, 6, 1, 3, 5, 7));
		expect(result.globalOrder).toBe(false);
		expect(result.perKeyOrder).toBe(true);
		expect(result.outOfOrder).toBe(3);
	});

	test("a swap inside one customer breaks the order per key", () => {
		expect(analyseOrder(pick(4, 0, 1, 2, 3)).perKeyOrder).toBe(false);
	});
});

describe("helpers", () => {
	test("chunk splits without losing items", () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	test("spread reports mean, lowest and highest", () => {
		expect(spread([10, 20, 60])).toEqual({ mean: 30, min: 10, max: 60 });
	});

	test("every broker has an expected behaviour", () => {
		expect(Object.keys(EXPECTED).sort()).toEqual([...BROKERS].sort());
		expect(isBrokerName("kafka")).toBe(true);
		expect(isBrokerName("nats")).toBe(false);
	});
});

describe("local targets only", () => {
	test("loopback and docker-compose service names are local", () => {
		for (const host of ["localhost", "127.0.0.1", "redis", "rabbitmq", "localstack"]) {
			expect(isLocalHost(host)).toBe(true);
		}
	});

	test("a public host or an IP address is refused", () => {
		for (const host of ["sqs.us-east-1.amazonaws.com", "example.com", "10.0.0.5"]) {
			expect(isLocalHost(host)).toBe(false);
		}
	});

	test("the configuration refuses to load with a non-local broker", () => {
		expect(() => loadConfig({ SQS_ENDPOINT: "https://sqs.us-east-1.amazonaws.com" })).toThrow();
		expect(() => loadConfig({ KAFKA_BROKER: "broker.example.com:9092" })).toThrow();
		expect(() => loadConfig({ REDIS_URL: "redis://cache.example.com:6379" })).toThrow();
		expect(loadConfig({}).KAFKA_BROKER).toBe("kafka:9092");
	});
});

describe("report", () => {
	test("renders one row per broker in each table", () => {
		const text = renderReport(
			[
				{
					broker: "kafka",
					ordering: { messages: 200, globalOrder: false, perKeyOrder: true, outOfOrder: 120 },
					redelivery: { redelivered: true, afterMs: 6400, brokerFlag: null },
					throughput: {
						messages: 5000,
						runs: 3,
						produce: { mean: 40000, min: 35000, max: 45000 },
						consume: { mean: 30000, min: 28000, max: 33000 },
					},
				},
			],
			{
				date: "2026-10-08",
				cpu: "test cpu",
				cores: 8,
				memoryGb: 15.5,
				kernel: "6.0",
				bun: "1.4.2",
				images: { bullmq: "a", rabbitmq: "b", kafka: "apache/kafka:4.3.1", sqs: "d" },
				clients: { bullmq: "a", rabbitmq: "b", kafka: "kafkajs 2.2.4", sqs: "d" },
				command: "docker compose run --rm demo",
			},
		);
		expect(text).toContain("| Kafka | **no** | yes | 120 of 200 | yes | 6.4 s | none |");
		expect(text).toContain("| Kafka | 40,000 (35,000 to 45,000) | 30,000 (28,000 to 33,000) |");
		expect(text).toContain("`apache/kafka:4.3.1`");
	});
});
