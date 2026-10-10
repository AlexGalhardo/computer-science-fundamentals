// EN: Tests of the pure parts. They need neither the broker nor the database.
// PT: Testes das partes puras. Não precisam do broker nem do banco.
// ES: Pruebas de las partes puras. No necesitan ni el broker ni la base de datos.

import { describe, expect, test } from "bun:test";
import { backoffDelay, loadConfig, paymentSchema, seededRandom } from "../src/core";
import { renderReport } from "../src/demo";
import { topology } from "../src/pipeline";

describe("exponential backoff", () => {
	test("the wait doubles after each failed attempt", () => {
		expect([1, 2, 3, 4].map((attempt) => backoffDelay(attempt, 1000))).toEqual([1000, 2000, 4000, 8000]);
	});

	test("the total waited before the fifth attempt is base x (2^4 - 1)", () => {
		const total = [1, 2, 3, 4].reduce((sum, attempt) => sum + backoffDelay(attempt, 1000), 0);
		expect(total).toBe(15_000);
	});

	test("attempts start at 1", () => {
		expect(() => backoffDelay(0, 1000)).toThrow(RangeError);
		expect(() => backoffDelay(1.5, 1000)).toThrow(RangeError);
	});
});

describe("seeded random", () => {
	test("the same seed gives the same failures", () => {
		const first = seededRandom(42);
		const second = seededRandom(42);
		expect(Array.from({ length: 20 }, first)).toEqual(Array.from({ length: 20 }, second));
	});

	test("values are in [0, 1) and about 20% fall below 0.2", () => {
		const random = seededRandom(7);
		const values = Array.from({ length: 10_000 }, random);
		expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
		const below = values.filter((value) => value < 0.2).length;
		expect(below).toBeGreaterThan(1800);
		expect(below).toBeLessThan(2200);
	});
});

describe("message schema", () => {
	test("accepts a valid payment", () => {
		expect(paymentSchema.safeParse({ id: "p-1", accountId: "a", amountCents: 100 }).success).toBe(true);
	});

	test("rejects a payload that no retry can fix", () => {
		expect(paymentSchema.safeParse({ id: "p-1", amountCents: "a lot" }).success).toBe(false);
		expect(paymentSchema.safeParse({ id: "p-1", accountId: "a", amountCents: -5 }).success).toBe(false);
		expect(paymentSchema.safeParse(undefined).success).toBe(false);
	});
});

describe("topology and configuration", () => {
	test("each backoff step has its own waiting queue", () => {
		const names = topology("lab");
		expect([names.work, names.dlq, names.retry(1), names.retry(2)]).toEqual([
			"lab.work",
			"lab.dlq",
			"lab.retry.1",
			"lab.retry.2",
		]);
	});

	test("defaults point at the docker-compose services", () => {
		const config = loadConfig({});
		expect(new URL(config.DATABASE_URL).hostname).toBe("db");
		expect(new URL(config.AMQP_URL).hostname).toBe("broker");
		expect(() => loadConfig({ AMQP_URL: "not a url" })).toThrow();
	});
});

describe("report", () => {
	test("marks the wrong number of effects", () => {
		const text = renderReport(
			[
				{
					mode: "naive",
					messages: 1000,
					deliveries: 2500,
					minDeliveriesPerMessage: 2,
					effects: 2500,
					balanceCents: 250_000,
					expectedBalanceCents: 100_000,
				},
				{
					mode: "idempotent",
					messages: 1000,
					deliveries: 2500,
					minDeliveriesPerMessage: 2,
					effects: 1000,
					balanceCents: 100_000,
					expectedBalanceCents: 100_000,
				},
			],
			{
				policy: { maxAttempts: 3, baseDelayMs: 100 },
				healthyMessages: 20,
				effects: 20,
				poisonAttempts: [
					{ attempt: 1, waitedMs: null },
					{ attempt: 2, waitedMs: 104.2 },
				],
				deadLetters: [{ messageId: "poison", attempt: 3, reason: "rejected" }],
			},
		);
		expect(text).toContain("| `naive` | 1000 | 2500 | 2 | **2500** | **2500.00** | 1000.00 |");
		expect(text).toContain("| `idempotent` | 1000 | 2500 | 2 | 1000 | 1000.00 | 1000.00 |");
		expect(text).toContain("| 2 | 104 ms |");
		expect(text).toContain("| `poison` | 3 | rejected |");
	});
});
