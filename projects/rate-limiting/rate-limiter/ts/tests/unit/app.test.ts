import { describe, expect, test } from "bun:test";
import { type AppDependencies, createApp } from "../../src/app";
import type { Decision } from "../../src/redis-limiter";

function appWith(decision: Decision): (request: Request) => Promise<Response> {
	const dependencies: AppDependencies = {
		instance: "test",
		hit: async () => decision,
		healthy: async () => true,
	};
	return createApp(dependencies);
}

describe("HTTP answers of the limiter", () => {
	test("an admitted request gets 200 and how much is left", async () => {
		const app = appWith({ allowed: true, remaining: 7, retryAfterMs: 0 });
		const response = await app(new Request("http://localhost/hit?strategy=fixed-window&key=alice"));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ allowed: true, remaining: 7, instance: "test" });
		expect(response.headers.get("retry-after")).toBeNull();
	});

	test("a rejected request gets 429 with Retry-After in whole seconds, rounded up", async () => {
		const app = appWith({ allowed: false, remaining: 0, retryAfterMs: 2300 });
		const response = await app(new Request("http://localhost/hit?strategy=token-bucket&key=alice"));
		expect(response.status).toBe(429);
		expect(response.headers.get("retry-after")).toBe("3");
		expect(response.headers.get("cache-control")).toBe("no-store");
	});

	test("Retry-After is never zero: the client is told to wait at least one second", async () => {
		const app = appWith({ allowed: false, remaining: 0, retryAfterMs: 0 });
		const response = await app(new Request("http://localhost/hit?strategy=fixed-window&key=alice"));
		expect(response.headers.get("retry-after")).toBe("1");
	});

	test("an unknown strategy or a strange key is a 400, and never reaches Redis", async () => {
		let calls = 0;
		const app = createApp({
			instance: "test",
			hit: async () => {
				calls += 1;
				return { allowed: true, remaining: 0, retryAfterMs: 0 };
			},
			healthy: async () => true,
		});
		for (const query of ["strategy=magic&key=alice", "strategy=naive&key=a%20b", "strategy=naive", "key=alice"]) {
			expect((await app(new Request(`http://localhost/hit?${query}`))).status).toBe(400);
		}
		expect(calls).toBe(0);
	});

	test("other paths are 404 and /health reflects Redis", async () => {
		const app = appWith({ allowed: true, remaining: 0, retryAfterMs: 0 });
		expect((await app(new Request("http://localhost/other"))).status).toBe(404);
		expect((await app(new Request("http://localhost/health"))).status).toBe(200);
	});
});
