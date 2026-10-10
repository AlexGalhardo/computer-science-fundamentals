import { describe, expect, test } from "bun:test";
import { app } from "../src/app";
import { buildPriceIndex, quoteAfter, quoteBefore, sampleCatalog, sampleOrder } from "../src/pricing";
import { median, spread } from "../src/stats";

describe("pricing", () => {
	const catalog = sampleCatalog(400);
	const order = sampleOrder(200, 400);

	// EN: The fix is only valid if it changes the cost and nothing else.
	// PT: A correção só vale se mudar o custo e mais nada.
	// ES: La corrección solo vale si cambia el costo y nada más.
	test("both variants return the same quote", () => {
		expect(quoteBefore(order, catalog)).toEqual(quoteAfter(order, buildPriceIndex(catalog)));
	});

	test("prices a small order by hand", () => {
		const small = [
			{ sku: "pen", cents: 150 },
			{ sku: "ink", cents: 900 },
		];
		const lines = [
			{ sku: "pen", qty: 3 },
			{ sku: "ink", qty: 1 },
			{ sku: "ghost", qty: 9 },
		];
		const expected = { lines: 3, unknownSkus: 1, totalCents: 3 * 150 + 900 };
		expect(quoteBefore(lines, small)).toEqual(expected);
		expect(quoteAfter(lines, buildPriceIndex(small))).toEqual(expected);
	});

	test("the sample data is deterministic and has unknown SKUs", () => {
		expect(sampleOrder(200, 400)).toEqual(order);
		expect(quoteAfter(order, buildPriceIndex(catalog)).unknownSkus).toBe(5);
	});
});

describe("app", () => {
	test("the two routes answer with the same body", async () => {
		const before = await app(new Request("http://localhost/before/quote"));
		const after = await app(new Request("http://localhost/after/quote"));
		expect(before.status).toBe(200);
		expect(await before.json()).toEqual(await after.json());
	});

	test("rejects a profile request with an invalid duration, before profiling anything", async () => {
		for (const seconds of ["0", "31", "abc", "1.5"]) {
			const response = await app(new Request(`http://localhost/debug/cpuprofile?seconds=${seconds}`));
			expect(response.status).toBe(400);
		}
	});

	test("unknown routes and methods", async () => {
		expect((await app(new Request("http://localhost/nope"))).status).toBe(404);
		expect((await app(new Request("http://localhost/before/quote", { method: "POST" }))).status).toBe(405);
		expect((await app(new Request("http://localhost/health"))).status).toBe(200);
	});
});

describe("benchmark statistics", () => {
	test("median of an odd and of an even number of runs", () => {
		expect(median([30, 10, 20])).toBe(20);
		expect(median([40, 10, 20, 30])).toBe(25);
		expect(() => median([])).toThrow();
	});

	test("spread is (max - min) / median", () => {
		expect(spread([90, 100, 110])).toEqual({ median: 100, min: 90, max: 110, spreadPercent: 20 });
	});
});
