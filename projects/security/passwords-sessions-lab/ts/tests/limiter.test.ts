// EN: The attempt limiter alone, without HTTP, with a clock the test controls. No test sleeps.
// PT: O limitador de tentativas sozinho, sem HTTP, com um relógio que o teste controla. Nenhum
//     teste dorme.
// ES: El limitador de intentos por separado, sin HTTP, con un reloj que controla la prueba. Ninguna
//     prueba duerme.

import { describe, expect, test } from "bun:test";
import { AttemptLimiter, type LimiterRule } from "../src/fixed/fixed-attempt-limiter";

const RULE: LimiterRule = { maxFailures: 3, windowMs: 60_000, lockMs: 120_000 };

function setup(maxEntries?: number): { limiter: AttemptLimiter; advance: (ms: number) => void } {
	let now = 0;
	return {
		limiter: new AttemptLimiter(RULE, () => now, maxEntries),
		advance: (ms) => {
			now += ms;
		},
	};
}

describe("AttemptLimiter", () => {
	test("a key with no failures does not wait", () => {
		expect(setup().limiter.retryAfterMs("alice-fake")).toBe(0);
	});

	test("the failure that reaches the limit starts the lock, and the wait counts down", () => {
		const { limiter, advance } = setup();
		limiter.recordFailure("alice-fake");
		limiter.recordFailure("alice-fake");
		expect(limiter.retryAfterMs("alice-fake")).toBe(0);
		limiter.recordFailure("alice-fake");
		expect(limiter.retryAfterMs("alice-fake")).toBe(120_000);
		advance(50_000);
		expect(limiter.retryAfterMs("alice-fake")).toBe(70_000);
		advance(70_000);
		expect(limiter.retryAfterMs("alice-fake")).toBe(0);
	});

	test("keys are independent", () => {
		const { limiter } = setup();
		for (let i = 0; i < 3; i++) limiter.recordFailure("alice-fake");
		expect(limiter.retryAfterMs("bob-fake")).toBe(0);
	});

	test("failures outside the window do not add up", () => {
		const { limiter, advance } = setup();
		limiter.recordFailure("alice-fake");
		limiter.recordFailure("alice-fake");
		advance(60_000);
		limiter.recordFailure("alice-fake");
		expect(limiter.retryAfterMs("alice-fake")).toBe(0);
	});

	test("reset clears the count", () => {
		const { limiter } = setup();
		limiter.recordFailure("alice-fake");
		limiter.recordFailure("alice-fake");
		limiter.reset("alice-fake");
		limiter.recordFailure("alice-fake");
		expect(limiter.retryAfterMs("alice-fake")).toBe(0);
	});

	test("the number of remembered keys is bounded, and a key that is locked right now is kept", () => {
		const { limiter } = setup(3);
		for (let i = 0; i < 3; i++) limiter.recordFailure("alice-fake");
		for (const key of ["key-1-fake", "key-2-fake", "key-3-fake", "key-4-fake"]) limiter.recordFailure(key);
		// EN: key-1 and key-2, the oldest unlocked ones, were dropped to make room.
		// PT: key-1 e key-2, as mais antigas sem bloqueio, foram descartadas para abrir espaço.
		// ES: key-1 y key-2, las más antiguas sin bloqueo, se descartaron para abrir espacio.
		expect(limiter.retryAfterMs("alice-fake")).toBe(120_000);
		for (let i = 0; i < 2; i++) limiter.recordFailure("key-4-fake");
		expect(limiter.retryAfterMs("key-4-fake")).toBe(120_000);
		for (let i = 0; i < 2; i++) limiter.recordFailure("key-1-fake");
		expect(limiter.retryAfterMs("key-1-fake")).toBe(0);
	});
});
