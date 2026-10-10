import { expect, test } from "bun:test";
import { aggregate, injectTable, renderTable, type Summary, summarySchema, violations } from "../src/report";

function run(overrides: Partial<Summary>): Summary {
	return {
		strategy: "pessimistic",
		round: 1,
		buyers: 200,
		initialStock: 10,
		sold: 10,
		soldOut: 190,
		conflict: 0,
		unexpected: 0,
		finalOrders: 10,
		finalStock: 0,
		windowMs: 1000,
		requestsPerSecond: 200,
		medianMs: 5,
		p95Ms: 20,
		...overrides,
	};
}

const COMPLETE: Summary[] = [
	run({ strategy: "naive", sold: 20, soldOut: 180, finalOrders: 20 }),
	run({ strategy: "optimistic" }),
	run({ strategy: "pessimistic" }),
	run({ strategy: "serializable" }),
];

test("a complete, correct load test has no violations", () => {
	expect(violations(COMPLETE)).toEqual([]);
});

test("a naive run that did not oversell is a violation", () => {
	const summaries = COMPLETE.map((item) => (item.strategy === "naive" ? run({ strategy: "naive" }) : item));
	expect(violations(summaries)).toEqual(["naive round 1: expected overselling, got 10 orders"]);
});

test("a fix that oversold, or a missing strategy, is a violation", () => {
	const summaries = [COMPLETE[0], run({ strategy: "optimistic", finalOrders: 11 })].filter(
		(item): item is Summary => item !== undefined,
	);
	const problems = violations(summaries);
	expect(problems).toContain("pessimistic: no load test run found");
	expect(problems.some((problem) => problem.startsWith("optimistic round 1: expected exactly 10"))).toBe(true);
});

test("rounds are aggregated with mean and spread", () => {
	const rows = aggregate([
		run({ round: 1, requestsPerSecond: 100 }),
		run({ round: 2, requestsPerSecond: 300, finalOrders: 10 }),
	]);
	expect(rows).toHaveLength(1);
	expect(rows[0]?.rounds).toBe(2);
	expect(rows[0]?.rpsMean).toBe(200);
	expect(rows[0]?.rpsStddev).toBeCloseTo(141.42, 1);
	expect(rows[0]?.rejectedRate).toBeCloseTo(0.95, 5);
});

test("the table is rendered in the three languages and injected between the markers", () => {
	const rows = aggregate(COMPLETE);
	expect(renderTable(rows, "en")).toContain("| `naive` | 1 | **20** |");
	expect(renderTable(rows, "pt")).toContain("| Estratégia |");
	expect(renderTable(rows, "es")).toContain("| Estrategia |");
	expect(injectTable("a\n<!-- results:start -->\nold\n<!-- results:end -->\nb", "T")).toBe(
		"a\n<!-- results:start -->\nT\n<!-- results:end -->\nb",
	);
});

test("a malformed k6 summary is rejected", () => {
	expect(summarySchema.safeParse({ strategy: "hopeful" }).success).toBe(false);
});
