// EN: `bun run demo` classifies a set of well-known recurrences, checks three of them against a
//     real recursive function, prints everything and writes the results for people (Markdown),
//     tools (JSON) and the static page (a script).
// PT: `bun run demo` classifica um conjunto de recorrências conhecidas, confere três delas com
//     uma função recursiva de verdade, imprime tudo e grava os resultados para pessoas
//     (Markdown), ferramentas (JSON) e a página estática (um script).

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Classification, classify, formatRecurrence, type RecurrenceInput } from "./classify";
import { describe } from "./cli";
import { type EmpiricalReport, empiricalCheck } from "./empirical";

interface Example {
	name: string;
	input: RecurrenceInput;
}

export const EXAMPLES: Example[] = [
	{ name: "binary search", input: { a: 1, b: 2, d: 0 } },
	{ name: "merge sort", input: { a: 2, b: 2, d: 1 } },
	{ name: "binary tree traversal", input: { a: 2, b: 2, d: 0 } },
	{ name: "Karatsuba multiplication", input: { a: 3, b: 2, d: 1 } },
	{ name: "Strassen matrix multiplication (7-way split)", input: { a: 7, b: 2, d: 2 } },
	{ name: "schoolbook matrix multiplication by blocks", input: { a: 8, b: 2, d: 2 } },
	{ name: "median-like halving with linear work", input: { a: 1, b: 2, d: 1 } },
	{ name: "two halves with quadratic work", input: { a: 2, b: 2, d: 2 } },
	{ name: "two halves with n log n work (gap)", input: { a: 2, b: 2, d: 1, k: 1 } },
	{ name: "two halves with n / log n work (gap)", input: { a: 2, b: 2, d: 1, k: -1 } },
];

// EN: The three recurrences of the acceptance criterion, with sizes n = b^depth. Strassen stops
//     at 2^7 because its tree already has about a million calls there.
// PT: As três recorrências do critério de aceite, com tamanhos n = b^profundidade. Strassen
//     para em 2^7 porque sua árvore já tem cerca de um milhão de chamadas ali.
export const EMPIRICAL: { name: string; input: RecurrenceInput; depths: number[] }[] = [
	{ name: "merge sort", input: { a: 2, b: 2, d: 1 }, depths: [8, 10, 12, 14, 15, 16] },
	{ name: "binary search", input: { a: 1, b: 2, d: 0 }, depths: [8, 12, 16, 20, 23, 24] },
	{ name: "7-way split", input: { a: 7, b: 2, d: 2 }, depths: [2, 3, 4, 5, 6, 7] },
];

// EN: The page lets the reader pick a, b and f(n). Every combination it offers is classified
//     here, by the tested TypeScript code, so the page never reimplements the theorem.
// PT: A página deixa o leitor escolher a, b e f(n). Toda combinação oferecida é classificada
//     aqui, pelo código TypeScript testado, então a página nunca reimplementa o teorema.
export function classificationGrid(): Classification[] {
	const grid: Classification[] = [];
	for (let a = 1; a <= 9; a++) {
		for (const b of [2, 3, 4]) {
			for (const d of [0, 1, 2, 3]) {
				for (const k of [0, 1]) {
					grid.push(classify({ a, b, d, k }));
				}
			}
		}
	}
	return grid;
}

function solutionText(classification: Classification): string {
	if (classification.solution !== null) {
		return classification.solution;
	}
	return classification.extendedSolution === null
		? "none"
		: `none (extended case 2: ${classification.extendedSolution})`;
}

export function renderMarkdown(
	generatedAt: string,
	examples: { name: string; classification: Classification }[],
	checks: { name: string; report: EmpiricalReport }[],
): string {
	const lines = [
		"# Results: master-theorem",
		"",
		`Generated at ${generatedAt} with \`docker compose run --rm ts-demo\` (Bun ${Bun.version}, image oven/bun:1.4.2).`,
		"Everything here is a count, not a time, so the numbers are the same on every machine.",
		"",
		"## Classified recurrences",
		"",
		"| Algorithm | Recurrence | log_b a | Result | Solution |",
		"| --- | --- | ---: | --- | --- |",
		...examples.map(
			({ name, classification }) =>
				`| ${name} | \`${formatRecurrence(classification.recurrence)}\` | ${classification.criticalExponent.toFixed(3)} | ${classification.case} | ${solutionText(classification)} |`,
		),
		"",
		"## Empirical check",
		"",
		"A generated recursive function really runs and counts its calls and its work. `work / g(n)` uses the predicted class g(n) and must settle on a constant. The drift is the relative change of that ratio between the two largest sizes: it must be the smallest for the predicted class.",
	];
	for (const { name, report } of checks) {
		lines.push(
			"",
			`### ${name}: \`${formatRecurrence(report.classification.recurrence)}\`, predicted ${report.classification.solution}`,
			"",
			"| n | calls | work | work / g(n) |",
			"| ---: | ---: | ---: | ---: |",
			...report.samples.map(
				(sample) =>
					`| ${sample.n.toLocaleString("en-US")} | ${sample.calls.toLocaleString("en-US")} | ${sample.work.toLocaleString("en-US")} | ${sample.ratio.toFixed(4)} |`,
			),
			"",
			`Drift: predicted class ${report.drift.predicted.toFixed(4)}, one log factor less ${report.drift.oneLogLess.toFixed(4)}, one log factor more ${report.drift.oneLogMore.toFixed(4)}. Agrees: **${report.agrees ? "yes" : "no"}**.`,
		);
	}
	return `${lines.join("\n")}\n`;
}

function main(): void {
	const examples = EXAMPLES.map((example) => ({ name: example.name, classification: classify(example.input) }));
	for (const example of examples) {
		console.log(`\n=== ${example.name} ===`);
		console.log(describe(example.classification));
	}

	const checks = EMPIRICAL.map((item) => ({ name: item.name, report: empiricalCheck(item.input, item.depths) }));
	console.log("\n=== empirical check ===");
	for (const { name, report } of checks) {
		const largest = report.samples[report.samples.length - 1];
		console.log(
			`${name}: predicted ${report.classification.solution}, ${largest?.calls.toLocaleString("en-US")} calls at n = ${largest?.n.toLocaleString("en-US")}, work / g(n) = ${largest?.ratio.toFixed(4)}, agrees: ${report.agrees ? "yes" : "no"}`,
		);
	}

	const generatedAt = new Date().toISOString();
	const results = { project: "master-theorem", generatedAt, examples, checks, grid: classificationGrid() };
	const directory = resolve(process.env.RESULTS_DIR ?? join(import.meta.dir, "..", "..", "results"));
	mkdirSync(directory, { recursive: true });
	const json = JSON.stringify(results, null, "\t");
	writeFileSync(join(directory, "results.json"), `${json}\n`);
	// EN: A page opened from disk cannot fetch a JSON file, but it can load a script.
	// PT: Uma página aberta do disco não consegue buscar um arquivo JSON, mas consegue carregar um script.
	writeFileSync(join(directory, "results.js"), `window.MASTER_THEOREM_RESULTS = ${json};\n`);
	writeFileSync(join(directory, "results.md"), renderMarkdown(generatedAt, examples, checks));
	console.log(`\nresults written to ${directory}`);
	if (checks.some((check) => !check.report.agrees)) {
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}
