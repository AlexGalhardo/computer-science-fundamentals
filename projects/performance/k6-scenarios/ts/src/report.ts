// EN: Turns the k6 summaries into the committed Markdown reports, and checks the acceptance
//     criteria on the way: every scenario must cross a threshold before the fix and cross none
//     after it, and the stress test must show a latency knee before the fix and none after.
// PT: Transforma os resumos do k6 nos relatórios Markdown versionados, e confere os critérios de
//     aceite no caminho: todo cenário precisa ultrapassar um threshold antes da correção e nenhum
//     depois, e o teste de estresse precisa mostrar um joelho de latência antes da correção e
//     nenhum depois.

import { z } from "zod";
import { P95_BUDGET_MS, PROFILES, poolCapacity, SCENARIOS } from "../../k6/profiles.js";

export type Scenario = (typeof SCENARIOS)[number];
export type Variant = "before" | "after";
export type Language = "en" | "pt";

const scenarioSchema = z.custom<Scenario>(
	(value) => typeof value === "string" && (SCENARIOS as string[]).includes(value),
);

const phaseSchema = z.object({
	name: z.string().min(1),
	seconds: z.number().min(0),
	targetRate: z.number().min(0),
	requests: z.number().int().min(0),
	medianMs: z.number().min(0),
	p95Ms: z.number().min(0),
});

// EN: The summaries are files written by another tool, so they are validated like any input.
// PT: Os resumos são arquivos escritos por outra ferramenta, então são validados como qualquer entrada.
export const summarySchema = z.object({
	scenario: scenarioSchema,
	variant: z.enum(["before", "after"]),
	poolSize: z.number().int().min(1),
	queryMs: z.number().int().min(0),
	poolWaitMs: z.number().int().min(1),
	requests: z.number().int().min(0),
	failedRate: z.number().min(0).max(1),
	droppedIterations: z.number().int().min(0),
	medianMs: z.number().min(0),
	p95Ms: z.number().min(0),
	p99Ms: z.number().min(0),
	maxMs: z.number().min(0),
	phases: z.array(phaseSchema).min(1),
	thresholds: z.array(z.object({ metric: z.string().min(1), expression: z.string().min(1), ok: z.boolean() })).min(1),
});

export type Summary = z.infer<typeof summarySchema>;
export type Phase = z.infer<typeof phaseSchema>;

export function find(summaries: Summary[], scenario: Scenario, variant: Variant): Summary | undefined {
	return summaries.find((summary) => summary.scenario === scenario && summary.variant === variant);
}

export function crossed(summary: Summary): number {
	return summary.thresholds.filter((threshold) => !threshold.ok).length;
}

// EN: The knee of a latency curve is the load where latency stops being flat and shoots up: the
//     arrival rate has reached the capacity of the bottleneck, and from there every extra request
//     only makes the queue longer. Here it is the first step whose p95 is at least five times the
//     p95 of the first step AND above the latency budget. Both conditions, so that a jump from
//     20 ms to 100 ms on a noisy machine is not called a knee.
// PT: O joelho de uma curva de latência é a carga em que a latência deixa de ser plana e dispara:
//     a taxa de chegada alcançou a capacidade do gargalo, e dali em diante cada requisição a mais
//     só aumenta a fila. Aqui é o primeiro degrau cujo p95 é pelo menos cinco vezes o p95 do
//     primeiro degrau E está acima do orçamento de latência. As duas condições, para que um salto
//     de 20 ms para 100 ms em uma máquina com ruído não seja chamado de joelho.
export const KNEE_FACTOR = 5;

export function knee(summary: Summary): Phase | undefined {
	const baseline = summary.phases[0]?.p95Ms ?? 0;
	return summary.phases.find((phase) => phase.p95Ms >= KNEE_FACTOR * baseline && phase.p95Ms >= P95_BUDGET_MS);
}

export function violations(summaries: Summary[]): string[] {
	const problems: string[] = [];
	for (const scenario of SCENARIOS) {
		const before = find(summaries, scenario, "before");
		const after = find(summaries, scenario, "after");
		if (before === undefined || after === undefined) {
			problems.push(`${scenario}: needs one run before the fix and one after`);
			continue;
		}
		if (before.poolSize >= after.poolSize) {
			problems.push(
				`${scenario}: the fix must enlarge the pool (before ${before.poolSize}, after ${after.poolSize})`,
			);
		}
		if (crossed(before) === 0) {
			problems.push(`${scenario}: no threshold was crossed before the fix`);
		}
		if (crossed(after) > 0) {
			problems.push(`${scenario}: ${crossed(after)} threshold(s) crossed after the fix`);
		}
	}
	const stressBefore = find(summaries, "stress", "before");
	const stressAfter = find(summaries, "stress", "after");
	if (stressBefore !== undefined && knee(stressBefore) === undefined) {
		problems.push("stress: no latency knee before the fix");
	}
	if (stressAfter !== undefined && knee(stressAfter) !== undefined) {
		problems.push("stress: a latency knee is still there after the fix");
	}
	return problems;
}

const SHAPES: Record<Scenario, Record<Language, string>> = {
	load: {
		en: "ramp to 150 req/s in 5 s, hold 20 s, ramp down",
		pt: "sobe a 150 req/s em 5 s, mantém 20 s, desce",
	},
	stress: {
		en: "steps of 6 s: 50, 100, 150, 200, 250, 300 req/s",
		pt: "degraus de 6 s: 50, 100, 150, 200, 250, 300 req/s",
	},
	spike: {
		en: "40 req/s, jump to 500 req/s for 6 s, back to 40 req/s for 16 s",
		pt: "40 req/s, salto para 500 req/s por 6 s, volta a 40 req/s por 16 s",
	},
	soak: {
		en: "constant 130 req/s for 60 s (scaled down: a real soak runs for hours)",
		pt: "130 req/s constantes por 60 s (reduzido: um soak real roda por horas)",
	},
};

const REVEALS: Record<Scenario, string> = {
	load: "A load test applies the traffic of a normal busy period and asks one question: does the system meet its service level at the load it was built for? With a pool of 2 connections it does not: 150 requests per second is above what the pool can serve, so the queue for a connection grows during the whole steady phase.",
	stress: "A stress test keeps raising the load past the normal level to find where the system stops coping, and how it behaves there. The table of phases is the latency curve: flat while the arrival rate is below the capacity of the pool, then a knee. The knee is the capacity of the bottleneck, read from the outside.",
	spike: "A spike test jumps to a multiple of the normal traffic in about a second and comes back. It asks whether the system survives the burst and how long it takes to recover. Look at the `recovery` phase: the traffic is back to normal there, and any latency above the budget is the backlog of the spike still being drained.",
	soak: "A soak test holds a constant load for a long time, because some problems need time: a queue that grows a little every second, memory that is never freed, a table that fills up. Compare the first 10 seconds with the last 10: the same arrival rate, and a different latency. A test that stopped after a few seconds would have missed it. This run lasts one minute so the demo is short. A real soak test runs for hours.",
};

function ms(value: number): string {
	return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

function percent(rate: number): string {
	return `${(rate * 100).toFixed(2)}%`;
}

function verdict(summary: Summary, language: Language): string {
	if (crossed(summary) === 0) {
		return language === "en" ? "pass" : "passou";
	}
	return language === "en" ? "**FAIL**" : "**FALHOU**";
}

function cell(summary: Summary, language: Language): string {
	const failed = language === "en" ? "failed" : "com erro";
	return `${verdict(summary, language)}: p95 ${ms(summary.p95Ms)} ms, ${percent(summary.failedRate)} ${failed}`;
}

/** The overview table of the READMEs: one row per scenario, before against after. */
export function renderOverview(summaries: Summary[], language: Language): string {
	const first = (variant: Variant): number | undefined =>
		summaries.find((summary) => summary.variant === variant)?.poolSize;
	const headers =
		language === "en"
			? ["Scenario", "Shape", `Before (pool of ${first("before")})`, `After (pool of ${first("after")})`]
			: ["Cenário", "Forma", `Antes (pool de ${first("before")})`, `Depois (pool de ${first("after")})`];
	const lines = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`];
	for (const scenario of SCENARIOS) {
		const before = find(summaries, scenario, "before");
		const after = find(summaries, scenario, "after");
		if (before === undefined || after === undefined) {
			continue;
		}
		lines.push(
			`| [\`${scenario}\`](results/${scenario}.md) | ${SHAPES[scenario][language]} | ${cell(before, language)} | ${cell(after, language)} |`,
		);
	}
	return lines.join("\n");
}

function thresholdTable(before: Summary, after: Summary): string {
	const lines = ["| Threshold | Before the fix | After the fix |", "| --- | --- | --- |"];
	for (const threshold of before.thresholds) {
		const other = after.thresholds.find(
			(item) => item.metric === threshold.metric && item.expression === threshold.expression,
		);
		const mark = (ok: boolean | undefined): string => (ok === undefined ? "n/a" : ok ? "pass" : "**FAIL**");
		lines.push(
			`| \`${threshold.metric}\`: \`${threshold.expression}\` | ${mark(threshold.ok)} | ${mark(other?.ok)} |`,
		);
	}
	return lines.join("\n");
}

function phaseTable(before: Summary, after: Summary): string {
	const lines = [
		"| Phase | Target rate (req/s) | Seconds | Before: requests | Before: median (ms) | Before: p95 (ms) | After: requests | After: median (ms) | After: p95 (ms) |",
		"| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
	];
	before.phases.forEach((phase, index) => {
		const other = after.phases[index];
		lines.push(
			`| \`${phase.name}\` | ${phase.targetRate} | ${phase.seconds} | ${phase.requests} | ${ms(phase.medianMs)} | ${ms(phase.p95Ms)} | ${other?.requests ?? "n/a"} | ${other === undefined ? "n/a" : ms(other.medianMs)} | ${other === undefined ? "n/a" : ms(other.p95Ms)} |`,
		);
	});
	return lines.join("\n");
}

function totalsTable(before: Summary, after: Summary): string {
	const row = (label: string, pick: (summary: Summary) => string): string =>
		`| ${label} | ${pick(before)} | ${pick(after)} |`;
	return [
		"| | Before the fix | After the fix |",
		"| --- | --- | --- |",
		row("Connection pool", (s) => `${s.poolSize} connections`),
		row(
			"Capacity of the pool (connections / query time)",
			(s) => `${poolCapacity(s.poolSize, s.queryMs).toFixed(0)} req/s`,
		),
		row("Requests answered", (s) => String(s.requests)),
		row("Failed requests (not 2xx or 3xx)", (s) => percent(s.failedRate)),
		row("Iterations k6 could not start (`dropped_iterations`)", (s) => String(s.droppedIterations)),
		row("Median latency", (s) => `${ms(s.medianMs)} ms`),
		row("p95 latency", (s) => `${ms(s.p95Ms)} ms`),
		row("p99 latency", (s) => `${ms(s.p99Ms)} ms`),
		row("Slowest request", (s) => `${ms(s.maxMs)} ms`),
		row("Thresholds crossed", (s) => `${crossed(s)} of ${s.thresholds.length}`),
		row("k6 result", (s) => (crossed(s) === 0 ? "pass (exit code 0)" : "**FAIL** (exit code 99)")),
	].join("\n");
}

function kneeParagraph(before: Summary, after: Summary): string {
	const found = knee(before);
	const baseline = before.phases[0];
	if (found === undefined || baseline === undefined) {
		return "No latency knee was found before the fix.";
	}
	const afterKnee = knee(after);
	return `## The latency knee

Before the fix, p95 latency is ${ms(baseline.p95Ms)} ms at ${baseline.targetRate} req/s and ${ms(found.p95Ms)} ms at ${found.targetRate} req/s: the knee is at the \`${found.name}\` step. The pool of ${before.poolSize} connections serves at most ${before.poolSize} / ${before.queryMs} ms = ${poolCapacity(before.poolSize, before.queryMs).toFixed(0)} requests per second (a little less in practice, because a query costs more than its ${before.queryMs} ms of sleep). Below that rate a connection is almost always free and latency is flat. A step right at that rate already shows waiting in its median. From the first step clearly above it, requests arrive faster than they leave, the queue for a connection grows for as long as the step lasts, and the waiting limit of ${before.poolWaitMs} ms turns the queue into 503 answers.

After the fix, the pool of ${after.poolSize} connections can serve ${poolCapacity(after.poolSize, after.queryMs).toFixed(0)} requests per second, above the highest step of the test, and ${afterKnee === undefined ? "the curve stays flat: no step has a knee" : `a knee is still there at \`${afterKnee.name}\``}.`;
}

/** The committed Markdown summary of one scenario. */
export function renderScenario(scenario: Scenario, before: Summary, after: Summary): string {
	const profile = PROFILES[scenario];
	return `# ${profile.title} (\`${scenario}\`)

Shape: ${SHAPES[scenario].en}. Executor: \`ramping-arrival-rate\` (open model). Every request is \`GET /products/:id\`, which holds one database connection for about ${before.queryMs} ms.

${REVEALS[scenario]}

## Result

${totalsTable(before, after)}

## Thresholds

${thresholdTable(before, after)}

## Phases

${phaseTable(before, after)}
${scenario === "stress" ? `\n${kneeParagraph(before, after)}\n` : ""}`;
}

export interface Environment {
	generatedAt: string;
	command: string;
	machine: string;
	database: string;
	runtime: string;
	loadTool: string;
}

export function renderResults(summaries: Summary[], environment: Environment): string {
	const before = summaries.find((summary) => summary.variant === "before");
	return `# Load test scenarios with k6: results

Generated at ${environment.generatedAt} by \`${environment.command}\`.

The same four k6 scenarios ran twice against the same API: before the fix (small connection pool) and after it (larger pool). Nothing else changed. A scenario fails when it crosses a threshold: p95 latency of ${P95_BUDGET_MS} ms or more, overall or in any phase, or 1% or more failed requests.

${renderOverview(summaries, "en").replaceAll("](results/", "](")}

One Markdown summary per scenario: [load.md](load.md), [stress.md](stress.md), [spike.md](spike.md), [soak.md](soak.md). The raw k6 output is in \`k6-results/\`, which is git-ignored.

## Environment

| Item | Value |
| --- | --- |
| Machine | ${environment.machine} |
| Database | ${environment.database} |
| Runtime | ${environment.runtime} |
| Load tool | ${environment.loadTool} |
| Query time | ${before?.queryMs ?? "?"} ms per request (\`pg_sleep\`) |
| Waiting limit for a connection | ${before?.poolWaitMs ?? "?"} ms, then \`503\` |

Each scenario ran once before and once after the fix. Other agents and programs were using the same machine, so the exact latencies are noisy. The verdicts are not: before the fix the load is above the capacity of the pool by a wide margin, and after the fix it is below it by a wide margin.
`;
}

const START = "<!-- results:start -->";
const END = "<!-- results:end -->";

/** Replaces the table between the two markers of a README, leaving the rest untouched. */
export function injectTable(readme: string, table: string): string {
	const start = readme.indexOf(START);
	const end = readme.indexOf(END);
	if (start < 0 || end < start) {
		throw new Error("README has no results markers");
	}
	return `${readme.slice(0, start + START.length)}\n${table}\n${readme.slice(end)}`;
}
