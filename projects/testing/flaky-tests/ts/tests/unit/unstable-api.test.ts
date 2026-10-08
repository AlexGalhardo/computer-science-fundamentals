import { expect, test } from "bun:test";
import { localRatesUrl } from "../../src/rates";
import { repeatPlan } from "../../src/repeat";
import { createUnstableApi, FAILURE_RATE } from "../../src/unstable-api";

// EN: Even the service that simulates bad luck is tested without luck: its random source is a
//     parameter, and here it is a function that returns a chosen number.
// PT: Até o serviço que simula azar é testado sem sorte: a fonte aleatória dele é um parâmetro, e
//     aqui ela é uma função que devolve um número escolhido.
const request = new Request("http://unstable-api:3000/rates/USD-BRL");

test("answers the rate when the random draw is at or above the failure rate", async () => {
	const response = createUnstableApi(() => FAILURE_RATE)(request);
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({ pair: "USD-BRL", rate: 5.25 });
});

test("answers 503 when the random draw is below the failure rate", () => {
	expect(createUnstableApi(() => FAILURE_RATE - 0.01)(request).status).toBe(503);
});

test("an unknown pair is a 404, whatever the draw", () => {
	const api = createUnstableApi(() => 0);
	expect(api(new Request("http://unstable-api:3000/rates/ABC-XYZ")).status).toBe(404);
});

test("the address of the rates service must be local", () => {
	const original = process.env.RATES_URL;
	try {
		process.env.RATES_URL = "https://example.com";
		expect(() => localRatesUrl()).toThrow("must be a local service");
		process.env.RATES_URL = "http://unstable-api:3000";
		expect(localRatesUrl()).toBe("http://unstable-api:3000");
	} finally {
		if (original === undefined) {
			delete process.env.RATES_URL;
		} else {
			process.env.RATES_URL = original;
		}
	}
});

test("the repeat plan matches the acceptance criteria", () => {
	expect(repeatPlan("flaky")).toEqual({ runs: 50, accept: expect.any(Function) });
	expect(repeatPlan("flaky").accept(0)).toBe(false);
	expect(repeatPlan("flaky").accept(1)).toBe(true);
	expect(repeatPlan("fixed").runs).toBe(500);
	expect(repeatPlan("fixed").accept(0)).toBe(true);
	expect(repeatPlan("fixed").accept(1)).toBe(false);
});
