// EN: The report is pure code, so it is tested without containers: aggregation, the acceptance
//     check, the README injection, and the guard that keeps k6 pointed at the lab.
// PT: O relatório é código puro, então é testado sem contêineres: agregação, a conferência do
//     aceite, a injeção no README, e a guarda que mantém o k6 apontado para o laboratório.

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { z } from "zod";
import { loadConfig, settingsSchema } from "../src/config";
import {
	aggregateHitRate,
	aggregateStampede,
	type HitRateSummary,
	injectTable,
	renderHitRateTable,
	renderStampedeTable,
	type StampedeSummary,
	type Summary,
	summarySchema,
	violations,
} from "../src/report";

function stampede(overrides: Partial<StampedeSummary>): StampedeSummary {
	return {
		experiment: "stampede",
		mode: "none",
		round: 1,
		users: 300,
		durationS: 9,
		ttlMs: 2000,
		slowQueryMs: 100,
		requests: 9000,
		unexpected: 0,
		expiries: 3,
		queries: 900,
		burstMin: 300,
		burstMedian: 300,
		burstMax: 300,
		medianMs: 2,
		p95Ms: 900,
		maxMs: 1600,
		...overrides,
	};
}

function hitRate(overrides: Partial<HitRateSummary>): HitRateSummary {
	return {
		experiment: "hit-rate",
		strategy: "cache-aside",
		ttlMs: 1000,
		round: 1,
		users: 20,
		products: 200,
		durationS: 5,
		queryCostMs: 5,
		writeShare: 0.02,
		reads: 980,
		hits: 784,
		misses: 196,
		hitRate: 0.8,
		writes: 20,
		unexpected: 0,
		dbReads: 196,
		dbWrites: 20,
		dbRowsWritten: 20,
		readMedianMs: 1,
		readP95Ms: 8,
		hitMedianMs: 1,
		missMedianMs: 7,
		writeMedianMs: 2,
		writeP95Ms: 4,
		...overrides,
	};
}

const fixed = { expiries: 4, queries: 4, burstMin: 1, burstMedian: 1, burstMax: 1 };
const good: Summary[] = [
	stampede({}),
	stampede({ mode: "lock", ...fixed }),
	stampede({ mode: "early", ...fixed }),
	hitRate({}),
	hitRate({ strategy: "write-through" }),
	hitRate({ strategy: "write-behind" }),
];

describe("acceptance check", () => {
	test("a run that shows the lesson has no violation", () => {
		expect(violations(good)).toEqual([]);
	});

	test("an unprotected run without a herd is a violation", () => {
		const problems = violations([stampede({ burstMedian: 12 }), ...good.slice(1)]);
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("at least 100 queries per expiry");
	});

	test("a fix that lets two queries through is a violation", () => {
		const leaky = stampede({ mode: "lock", ...fixed, queries: 5, burstMax: 2 });
		expect(violations([good[0] as Summary, leaky, ...good.slice(2)])[0]).toContain("exactly 1 query per expiry");
	});

	test("a missing experiment is a violation", () => {
		expect(violations(good.slice(0, 5))).toEqual(["hit-rate write-behind: no load test run found"]);
	});

	test("a summary with a wrong shape is refused", () => {
		expect(summarySchema.safeParse({ ...stampede({}), mode: "magic" }).success).toBe(false);
		expect(summarySchema.safeParse({ ...hitRate({}), hitRate: 1.5 }).success).toBe(false);
	});
});

describe("aggregation and tables", () => {
	test("stampede rows add up the rounds and keep the worst burst", () => {
		const rows = aggregateStampede([
			stampede({ round: 1, p95Ms: 800 }),
			stampede({ round: 2, p95Ms: 1000, burstMin: 250, burstMedian: 280, queries: 830 }),
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			rounds: 2,
			expiries: 6,
			queries: 1730,
			burstMin: 250,
			burstMedian: 280,
			burstMax: 300,
		});
		expect(rows[0]?.p95MsMean).toBe(900);
		expect(rows[0]?.p95MsStddev).toBeCloseTo(141.42, 1);
	});

	test("hit rate rows are grouped by strategy and time to live", () => {
		const rows = aggregateHitRate([
			hitRate({ ttlMs: 5000, hitRate: 0.9 }),
			hitRate({ ttlMs: 250, hitRate: 0.5 }),
			hitRate({ ttlMs: 250, round: 2, hitRate: 0.7 }),
		]);
		expect(rows.map((row) => [row.ttlMs, row.rounds])).toEqual([
			[250, 2],
			[5000, 1],
		]);
		expect(rows[0]?.hitRateMean).toBeCloseTo(0.6);
		// 196 database reads in 1000 requests, in both rounds.
		expect(rows[0]?.dbReadsPer1000).toBeCloseTo(196);
	});

	test("tables exist in both languages", () => {
		expect(renderStampedeTable(aggregateStampede(good), "en")).toContain("| `lock` | 1 | 4 | 4 | **1** | 1 |");
		expect(renderStampedeTable(aggregateStampede(good), "pt")).toContain("Consultas por expiração");
		expect(renderHitRateTable(aggregateHitRate(good), "pt")).toContain(
			"| `cache-aside` | 1000 ms | 1 | 80.0% ± 0.0 |",
		);
	});

	test("a table is replaced between its markers and nothing else changes", () => {
		const readme = "intro\n<!-- stampede:start -->\nold\n<!-- stampede:end -->\noutro\n";
		expect(injectTable(readme, "stampede", "NEW")).toBe(
			"intro\n<!-- stampede:start -->\nNEW\n<!-- stampede:end -->\noutro\n",
		);
		expect(() => injectTable(readme, "hit-rate", "NEW")).toThrow();
	});
});

describe("configuration", () => {
	test("defaults point at the docker-compose services", () => {
		const config = loadConfig({});
		expect(config.REDIS_URL).toBe("redis://redis:6379");
		expect(config.FLUSH_INTERVAL_MS).toBe(200);
	});

	test("invalid values are refused", () => {
		expect(() => loadConfig({ PORT: "0" })).toThrow();
		expect(() => loadConfig({ REDIS_URL: "not a url" })).toThrow();
		expect(settingsSchema.safeParse({ ttlMs: 0 }).success).toBe(false);
	});
});

// EN: The guard lives in the k6 folder, which docker-compose mounts read-only into the test
//     container. It is plain JavaScript, so what it exports is checked before it is called.
// PT: A guarda mora na pasta do k6, que o docker-compose monta só para leitura no contêiner de
//     teste. É JavaScript puro, então o que ela exporta é conferido antes de ser chamado.
describe("k6 target guard", () => {
	const guardSchema = z.object({
		assertLocalTarget: z.custom<(url: string) => string>((value) => typeof value === "function"),
	});
	const k6Dir = process.env.K6_DIR ?? join(import.meta.dir, "..", "..", "k6");

	test("accepts only local targets", async () => {
		const loaded: unknown = await import(join(k6Dir, "guard.js"));
		const { assertLocalTarget } = guardSchema.parse(loaded);
		expect(assertLocalTarget("http://api:3000")).toBe("http://api:3000");
		expect(assertLocalTarget("http://localhost:3000")).toBe("http://localhost:3000");
		expect(assertLocalTarget("http://127.0.0.1")).toBe("http://127.0.0.1");
		for (const target of [
			"http://example.com",
			"https://api:3000",
			"http://api.example.com:3000",
			"http://localhost.example.com",
			"http://api:3000/path",
			"http://user@api:3000",
			"",
		]) {
			expect(() => assertLocalTarget(target)).toThrow("refusing to run");
		}
	});
});
