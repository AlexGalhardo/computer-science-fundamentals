import { expect, test } from "bun:test";
import type { Approach } from "../src/context";
import { inject, latencyRows, mean, percentile, renderLatency, renderNPlusOne, stddev } from "../src/stats";

test("mean, standard deviation and percentile", () => {
	expect(mean([1, 2, 3, 4])).toBe(2.5);
	expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
	expect(stddev([5])).toBe(0);
	const values = Array.from({ length: 100 }, (_, index) => index + 1);
	expect(percentile(values, 50)).toBe(50);
	expect(percentile(values, 95)).toBe(95);
	expect(percentile([], 95)).toBe(0);
});

test("latency rows compare each approach with raw SQL", () => {
	const samples = new Map<string, Record<Approach, number[][]>>([
		[
			"q",
			{
				raw: [
					[1, 1],
					[1, 1],
				],
				prisma: [
					[2, 2],
					[4, 4],
				],
				drizzle: [[1.5], [1.5]],
			},
		],
	]);
	const rows = latencyRows(samples);
	expect(rows.map((row) => row.timesRaw)).toEqual([1, 3, 1.5]);
	expect(rows[1]?.stddevMs).toBeCloseTo(Math.SQRT2, 5);
	expect(renderLatency(rows, "en")).toContain("| `q` | prisma | 3.000 |");
	expect(renderLatency(rows, "pt")).toContain("Vezes o SQL puro");
	expect(renderLatency(rows, "es")).toContain("Veces el SQL puro");
});

test("the N+1 table shows statements and speed-up", () => {
	const text = renderNPlusOne(
		[{ approach: "raw", naiveStatements: 151, fixedStatements: 2, naiveMs: 30, fixedMs: 3 }],
		"en",
	);
	expect(text).toContain("| raw | 151 | 2 | 30.0 | 3.0 | 10.0x |");
});

test("inject replaces only what is between its own markers", () => {
	const document = "<!-- a:start -->\nx\n<!-- a:end -->\n<!-- b:start -->\ny\n<!-- b:end -->";
	expect(inject(document, "b", "new")).toBe(
		"<!-- a:start -->\nx\n<!-- a:end -->\n<!-- b:start -->\nnew\n<!-- b:end -->",
	);
	expect(() => inject(document, "c", "new")).toThrow();
});
