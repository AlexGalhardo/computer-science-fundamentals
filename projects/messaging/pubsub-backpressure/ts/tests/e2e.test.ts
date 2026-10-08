// EN: End-to-end tests against a real RabbitMQ started by docker-compose.
// PT: Testes de ponta a ponta contra um RabbitMQ real iniciado pelo docker-compose.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { ChannelModel } from "amqplib";
import { connectBroker, fanOut, loadConfig, prefetchExperiment, workQueue } from "../src/rabbit";

const MESSAGES = 300;
const expectedIds = Array.from({ length: MESSAGES }, (_, index) => `m-${index}`).sort();

let connection: ChannelModel;

beforeAll(async () => {
	connection = await connectBroker(loadConfig().AMQP_URL);
});

afterAll(async () => {
	await connection.close();
});

describe("work queue against fan-out", () => {
	test("a queue delivers each message once, shared among the workers", async () => {
		const result = await workQueue(connection, MESSAGES, 3);
		console.log(`work queue: ${result.perConsumer.map((received) => received.length).join(", ")}`);
		// 300 deliveries for 300 messages: nobody received a copy of somebody else's message.
		expect(result.totalDeliveries).toBe(MESSAGES);
		expect(result.perConsumer.flat().sort()).toEqual(expectedIds);
		// The work was really divided: every worker got a share.
		for (const received of result.perConsumer) {
			expect(received.length).toBeGreaterThan(0);
			expect(received.length).toBeLessThan(MESSAGES);
		}
	}, 60_000);

	test("a fan-out delivers every message to every subscriber", async () => {
		const result = await fanOut(connection, MESSAGES, 3);
		console.log(`fan-out: ${result.perConsumer.map((received) => received.length).join(", ")}`);
		expect(result.totalDeliveries).toBe(MESSAGES * 3);
		for (const received of result.perConsumer) {
			expect([...received].sort()).toEqual(expectedIds);
		}
	}, 60_000);

	test("2 services with 3 instances each process every message twice, not six times", async () => {
		const result = await fanOut(connection, MESSAGES, 2, 3);
		console.log(`combined: ${result.perConsumer.map((received) => received.length).join(", ")}`);
		expect(result.totalDeliveries).toBe(MESSAGES * 2);
		// Consumers 0 to 2 are the instances of the first service, 3 to 5 of the second.
		for (const service of [result.perConsumer.slice(0, 3), result.perConsumer.slice(3, 6)]) {
			expect(service.flat().sort()).toEqual(expectedIds);
		}
	}, 60_000);
});

describe("prefetch as backpressure", () => {
	const BACKLOG = 3000;

	test("with no prefetch limit the whole backlog moves into the consumer", async () => {
		const result = await prefetchExperiment(connection, 0, BACKLOG);
		console.log(`no prefetch: ${JSON.stringify(result)}`);
		expect(result.peakHeldByConsumer).toBeGreaterThan(BACKLOG * 0.9);
		expect(result.leftInBroker).toBe(0);
	}, 60_000);

	test("with prefetch 10 the consumer never holds more than 10 and the backlog stays in the broker", async () => {
		const result = await prefetchExperiment(connection, 10, BACKLOG);
		console.log(`prefetch 10: ${JSON.stringify(result)}`);
		expect(result.peakHeldByConsumer).toBeLessThanOrEqual(10);
		expect(result.processed).toBeGreaterThan(0);
		expect(result.leftInBroker).toBeGreaterThan(BACKLOG * 0.8);
	}, 60_000);
});
