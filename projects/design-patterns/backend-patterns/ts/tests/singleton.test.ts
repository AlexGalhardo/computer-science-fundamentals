import { describe, expect, test } from "bun:test";
import { createApp, RateLimiter, RequestCounter } from "../src/singleton/after";
import { RequestCounter as GlobalCounter, RateLimiter as GlobalRateLimiter } from "../src/singleton/before";

// EN: These two tests run in this order, in the same process, and the second one only passes
//     because the first one ran before it. That order dependence is the hidden shared state.
//     Do not "fix" it: it is the lesson, and `after` shows the design that removes it.
// PT: Estes dois testes rodam nesta ordem, no mesmo processo, e o segundo só passa porque o
//     primeiro rodou antes. Essa dependência de ordem é o estado compartilhado escondido.
//     Não "conserte": ela é a lição, e `after` mostra o desenho que a remove.
describe("singleton: before", () => {
	test("two limiters that look independent share one hidden counter", () => {
		const login = new GlobalRateLimiter(3);
		const search = new GlobalRateLimiter(3);

		expect(login.allow("10.0.0.1")).toBe(true);
		expect(login.allow("10.0.0.1")).toBe(true);
		expect(login.allow("10.0.0.1")).toBe(true);

		// EN: `search` was never used, and nothing in its constructor mentions `login`.
		// PT: `search` nunca foi usado, e nada em seu construtor menciona `login`.
		expect(search.allow("10.0.0.1")).toBe(false);
	});

	test("the state survives from the previous test: this one depends on the order", () => {
		const fresh = new GlobalRateLimiter(3);
		expect(fresh.allow("10.0.0.1")).toBe(false);
		expect(GlobalCounter.getInstance().hit("10.0.0.1")).toBe(6);
	});
});

describe("singleton: after", () => {
	test("limiters with their own counters are independent", () => {
		const login = new RateLimiter(new RequestCounter(), 3);
		const search = new RateLimiter(new RequestCounter(), 3);

		expect(login.allow("10.0.0.1")).toBe(true);
		expect(login.allow("10.0.0.1")).toBe(true);
		expect(login.allow("10.0.0.1")).toBe(true);
		expect(login.allow("10.0.0.1")).toBe(false);

		expect(search.allow("10.0.0.1")).toBe(true);
	});

	test("no state survives from the previous test: a new counter starts from zero", () => {
		const fresh = new RateLimiter(new RequestCounter(), 3);
		expect(fresh.allow("10.0.0.1")).toBe(true);
	});

	test("sharing is still possible, as an explicit decision of the composition root", () => {
		const app = createApp();
		expect(app.login.allow("10.0.0.1")).toBe(true);
		expect(app.login.allow("10.0.0.1")).toBe(true);
		expect(app.passwordReset.allow("10.0.0.1")).toBe(true);
		expect(app.passwordReset.allow("10.0.0.1")).toBe(false);
		expect(app.search.allow("10.0.0.1")).toBe(true);
	});
});
