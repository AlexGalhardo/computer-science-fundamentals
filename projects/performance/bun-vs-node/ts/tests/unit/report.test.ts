import { expect, test } from "bun:test";
import {
	aggregate,
	injectTable,
	renderTable,
	type Setup,
	type Summary,
	spread,
	summarySchema,
	violations,
} from "../../src/report";

function summary(setup: Setup, round: number, cpuRps: number, overrides: Partial<Summary> = {}): Summary {
	return {
		setup,
		round,
		runtime: setup === "bun" ? "bun" : "node",
		runtimeVersion: "1.0.0",
		cpuVus: 32,
		ioVus: 200,
		cpuN: 200_000,
		ioMs: 20,
		durationS: 8,
		checksRate: 1,
		cpu: { requests: cpuRps * 8, windowMs: 8_000, requestsPerSecond: cpuRps, medianMs: 100, p95Ms: 200 + round },
		io: { requests: 60_000, windowMs: 8_000, requestsPerSecond: 7_500, medianMs: 21, p95Ms: 25 },
		memoryBytes: 64 * 2 ** 20,
		memorySource: "cgroup-peak",
		...overrides,
	};
}

test("spread gives the median and the range, for odd and even counts", () => {
	expect(spread([30, 10, 20])).toEqual({ median: 20, min: 10, max: 30 });
	expect(spread([40, 10, 20, 30])).toEqual({ median: 25, min: 10, max: 40 });
});

test("aggregate builds one row per setup, in a fixed order", () => {
	const rows = aggregate([
		summary("node-pm2", 1, 400),
		summary("bun", 1, 110),
		summary("bun", 2, 90),
		summary("bun", 3, 100),
		summary("node", 1, 95),
	]);
	expect(rows.map((row) => row.setup)).toEqual(["bun", "node", "node-pm2"]);
	expect(rows[0]?.rounds).toBe(3);
	expect(rows[0]?.cpuRps).toEqual({ median: 100, min: 90, max: 110 });
	expect(rows[0]?.memoryMib.median).toBe(64);
	expect(renderTable(rows, "en")).toContain("| `bun` | Bun 1.0.0 | 3 | 100 (90 to 110) |");
	expect(renderTable(rows, "pt")).toContain("Pico de memória");
});

test("violations reports a missing setup and failed requests", () => {
	const complete = [summary("bun", 1, 100), summary("node", 1, 100), summary("node-pm2", 1, 400)];
	expect(violations(complete)).toEqual([]);
	expect(violations(complete.slice(0, 2))).toEqual(['no run for setup "node-pm2"']);
	expect(violations([...complete, summary("node", 2, 100, { checksRate: 0.5 })])).toEqual([
		"node round 2: 50.00% of the requests failed",
	]);
});

test("a malformed k6 summary is rejected", () => {
	expect(summarySchema.safeParse({ ...summary("bun", 1, 100), setup: "deno" }).success).toBe(false);
	expect(summarySchema.safeParse({ ...summary("bun", 1, 100), memoryBytes: "many" }).success).toBe(false);
});

test("injectTable replaces only what is between the markers", () => {
	const readme = "before\n<!-- results:start -->\nold\n<!-- results:end -->\nafter\n";
	expect(injectTable(readme, "new")).toBe("before\n<!-- results:start -->\nnew\n<!-- results:end -->\nafter\n");
	expect(() => injectTable("no markers", "new")).toThrow("no results markers");
});
