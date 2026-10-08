import { expect, test } from "bun:test";
import { PROFILES, SCENARIOS } from "../../../k6/profiles.js";
import {
	crossed,
	injectTable,
	knee,
	renderOverview,
	renderScenario,
	type Scenario,
	type Summary,
	summarySchema,
	type Variant,
	violations,
} from "../../src/report";

// EN: A made-up k6 summary. Before the fix, the phases above 100 req/s are slow and the global
//     thresholds are crossed. After the fix, everything is fast.
// PT: Um resumo de k6 inventado. Antes da correção, as fases acima de 100 req/s são lentas e os
//     thresholds globais são ultrapassados. Depois da correção, tudo é rápido.
function summary(scenario: Scenario, variant: Variant, overrides: Partial<Summary> = {}): Summary {
	const slow = variant === "before";
	return {
		scenario,
		variant,
		poolSize: slow ? 2 : 20,
		queryMs: 20,
		poolWaitMs: 2_000,
		requests: 4_000,
		failedRate: slow ? 0.3 : 0,
		droppedIterations: 0,
		medianMs: slow ? 1_500 : 22,
		p95Ms: slow ? 2_010 : 30,
		p99Ms: slow ? 2_020 : 40,
		maxMs: slow ? 2_100 : 60,
		phases: PROFILES[scenario].phases.map((phase) => ({
			name: phase.name,
			seconds: phase.seconds,
			targetRate: phase.rate,
			requests: phase.rate * phase.seconds,
			medianMs: slow && phase.rate >= 100 ? 1_500 : 22,
			p95Ms: slow && phase.rate >= 100 ? 2_010 : 30,
		})),
		thresholds: [
			{ metric: "http_req_duration", expression: "p(95)<250", ok: !slow },
			{ metric: "http_req_failed", expression: "rate<0.01", ok: !slow },
		],
		...overrides,
	};
}

function allRuns(): Summary[] {
	return SCENARIOS.flatMap((scenario) => [summary(scenario, "before"), summary(scenario, "after")]);
}

test("crossed counts the thresholds that failed", () => {
	expect(crossed(summary("load", "before"))).toBe(2);
	expect(crossed(summary("load", "after"))).toBe(0);
});

test("the knee is the first step that is five times the first step and above the budget", () => {
	expect(knee(summary("stress", "before"))?.name).toBe("100-rps");
	expect(knee(summary("stress", "after"))).toBeUndefined();
	// Five times slower but still inside the budget: noise, not a knee.
	const noisy = summary("stress", "after");
	const third = noisy.phases[2];
	if (third !== undefined) {
		third.p95Ms = 200;
	}
	expect(knee(noisy)).toBeUndefined();
});

test("violations accepts fail-before and pass-after for the four scenarios", () => {
	expect(violations(allRuns())).toEqual([]);
});

test("violations reports each way the lesson can fail to show", () => {
	const missing = allRuns().filter((run) => !(run.scenario === "soak" && run.variant === "after"));
	expect(violations(missing)).toEqual(["soak: needs one run before the fix and one after"]);

	const passedBefore = allRuns().map((run) =>
		run.scenario === "load" && run.variant === "before" ? summary("load", "before", { thresholds: [okay()] }) : run,
	);
	expect(violations(passedBefore)).toEqual(["load: no threshold was crossed before the fix"]);

	const failedAfter = allRuns().map((run) =>
		run.scenario === "spike" && run.variant === "after" ? summary("spike", "after", { thresholds: [bad()] }) : run,
	);
	expect(violations(failedAfter)).toEqual(["spike: 1 threshold(s) crossed after the fix"]);

	const samePool = allRuns().map((run) => (run.scenario === "soak" ? { ...run, poolSize: 2 } : run));
	expect(violations(samePool)).toEqual(["soak: the fix must enlarge the pool (before 2, after 2)"]);

	const noKnee = allRuns().map((run) =>
		run.scenario === "stress" && run.variant === "before"
			? { ...run, phases: summary("stress", "after").phases }
			: run,
	);
	expect(violations(noKnee)).toEqual(["stress: no latency knee before the fix"]);
});

function okay(): Summary["thresholds"][number] {
	return { metric: "http_req_duration", expression: "p(95)<250", ok: true };
}

function bad(): Summary["thresholds"][number] {
	return { metric: "http_req_duration", expression: "p(95)<250", ok: false };
}

test("the overview has one row per scenario, in both languages", () => {
	const english = renderOverview(allRuns(), "en");
	expect(english).toContain("| Scenario | Shape | Before (pool of 2) | After (pool of 20) |");
	expect(english).toContain("| [`load`](results/load.md) |");
	expect(english).toContain("**FAIL**: p95 2010 ms, 30.00% failed | pass: p95 30.0 ms, 0.00% failed |");
	expect(english.split("\n")).toHaveLength(2 + 4);
	expect(renderOverview(allRuns(), "pt")).toContain("**FALHOU**: p95 2010 ms, 30.00% com erro | passou:");
});

test("the scenario summary shows thresholds and phases, and the knee only for stress", () => {
	const stress = renderScenario("stress", summary("stress", "before"), summary("stress", "after"));
	expect(stress).toContain("# Stress test (`stress`)");
	expect(stress).toContain("| `http_req_duration`: `p(95)<250` | **FAIL** | pass |");
	expect(stress).toContain("| `100-rps` | 100 | 6 | 600 | 1500 | 2010 | 600 | 22.0 | 30.0 |");
	expect(stress).toContain("the knee is at the `100-rps` step");
	expect(stress).toContain("2 / 20 ms = 100 requests per second");
	expect(renderScenario("soak", summary("soak", "before"), summary("soak", "after"))).not.toContain("knee is at");
});

test("a malformed k6 summary is rejected", () => {
	expect(summarySchema.safeParse(summary("load", "before")).success).toBe(true);
	expect(summarySchema.safeParse({ ...summary("load", "before"), scenario: "chaos" }).success).toBe(false);
	expect(summarySchema.safeParse({ ...summary("load", "before"), failedRate: 3 }).success).toBe(false);
});

test("injectTable replaces only what is between the markers", () => {
	const readme = "before\n<!-- results:start -->\nold\n<!-- results:end -->\nafter\n";
	expect(injectTable(readme, "new")).toBe("before\n<!-- results:start -->\nnew\n<!-- results:end -->\nafter\n");
	expect(() => injectTable("no markers", "new")).toThrow("no results markers");
});
