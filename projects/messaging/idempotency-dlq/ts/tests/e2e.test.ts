// EN: End-to-end tests against a real RabbitMQ and a real PostgreSQL, started by docker-compose.
//     They are the acceptance criteria of the mini-project: duplicates hurt a naive consumer,
//     the idempotency key store gives exactly one effect per message, and a poisoned message
//     ends in the dead-letter queue after the configured attempts.
// PT: Testes de ponta a ponta contra um RabbitMQ e um PostgreSQL reais, iniciados pelo
//     docker-compose. São os critérios de aceitação do mini-projeto: duplicatas prejudicam um
//     consumidor ingênuo, o armazenamento de chaves de idempotência dá exatamente um efeito por
//     mensagem, e uma mensagem envenenada termina na dead-letter queue depois das tentativas
//     configuradas.
// ES: Pruebas de extremo a extremo contra un RabbitMQ y un PostgreSQL reales, iniciados por
//     docker-compose. Son los criterios de aceptación del mini-proyecto: los duplicados perjudican
//     a un consumidor ingenuo, el almacén de claves de idempotencia da exactamente un efecto por
//     mensaje, y un mensaje envenenado termina en la dead-letter queue tras los intentos
//     configurados.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { ChannelModel } from "amqplib";
import type { Pool } from "pg";
import { backoffDelay, loadConfig } from "../src/core";
import { connectDb } from "../src/db";
import { connectBroker } from "../src/pipeline";
import { duplicatesScenario, poisonScenario } from "../src/scenarios";

const TIMEOUT_MS = 180_000;
const OPTIONS = { messages: 1000, crashRate: 0.2, seed: 42 };

let pool: Pool;
let connection: ChannelModel;

beforeAll(async () => {
	const config = loadConfig();
	pool = await connectDb(config.DATABASE_URL);
	connection = await connectBroker(config.AMQP_URL);
});

afterAll(async () => {
	await connection.close();
	await pool.end();
});

describe("duplicated messages", () => {
	test(
		"without protection, the side effect is applied more than once",
		async () => {
			const result = await duplicatesScenario(connection, pool, "naive", OPTIONS);
			console.log(`naive: ${JSON.stringify(result)}`);
			expect(result.minDeliveriesPerMessage).toBeGreaterThanOrEqual(2);
			// Every delivery became an effect: at least two per message.
			expect(result.effects).toBe(result.deliveries);
			expect(result.effects).toBeGreaterThanOrEqual(2000);
			expect(result.balanceCents).toBeGreaterThan(result.expectedBalanceCents);
		},
		TIMEOUT_MS,
	);

	test(
		"with the idempotency key store, 1,000 messages delivered at least twice produce exactly 1,000 effects",
		async () => {
			const result = await duplicatesScenario(connection, pool, "idempotent", OPTIONS);
			console.log(`idempotent: ${JSON.stringify(result)}`);
			expect(result.messages).toBe(1000);
			expect(result.minDeliveriesPerMessage).toBeGreaterThanOrEqual(2);
			expect(result.deliveries).toBeGreaterThan(2000);
			expect(result.effects).toBe(1000);
			expect(result.balanceCents).toBe(result.expectedBalanceCents);
		},
		TIMEOUT_MS,
	);
});

describe("poisoned message", () => {
	test(
		"lands in the dead-letter queue after the configured attempts, with backoff in between",
		async () => {
			const policy = { maxAttempts: 4, baseDelayMs: 100 };
			const result = await poisonScenario(connection, pool, policy);
			console.log(`poison: ${JSON.stringify(result)}`);

			// Exactly the configured number of attempts, numbered 1 to 4.
			expect(result.poisonAttempts.map((entry) => entry.attempt)).toEqual([1, 2, 3, 4]);
			// Each retry waited at least its backoff step: 100, 200, 400 ms.
			result.poisonAttempts.slice(1).forEach((entry, index) => {
				expect(entry.waitedMs ?? 0).toBeGreaterThanOrEqual(backoffDelay(index + 1, policy.baseDelayMs));
			});

			// Both bad messages are in the dead-letter queue, and nothing else is.
			expect(result.deadLetters).toEqual([
				{ messageId: "malformed", attempt: 1, reason: "rejected" },
				{ messageId: "poison", attempt: 4, reason: "rejected" },
			]);
			// The healthy messages were all processed, once each.
			expect(result.effects).toBe(result.healthyMessages);
		},
		TIMEOUT_MS,
	);
});
