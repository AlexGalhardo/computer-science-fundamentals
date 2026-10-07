// EN: Turns results/results.json (written by `bun run bench`) into results/throughput.md:
//     millions of increments per second for each language, fix and number of workers, plus the
//     final value of the counter, which shows the updates lost by the buggy versions.
//     Run from the repository root: `bun run projects/concurrency/counter-race/throughput.ts`
// PT: Transforma results/results.json (escrito por `bun run bench`) em results/throughput.md:
//     milhões de incrementos por segundo para cada linguagem, correção e número de workers, mais
//     o valor final do contador, que mostra as atualizações perdidas pelas versões com bug.
//     Rode na raiz do repositório: `bun run projects/concurrency/counter-race/throughput.ts`

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Row {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	elapsedMs: number;
	checksum?: string;
}

interface Report {
	generatedAt: string;
	machine: Record<string, string>;
	runtimes: Record<string, string>;
	rows: Row[];
}

const resultsDir = join(import.meta.dir, "results");
const report = JSON.parse(readFileSync(join(resultsDir, "results.json"), "utf8")) as Report;
const workerCounts = [...new Set(report.rows.map((row) => row.variant))].sort((a, b) => Number(a) - Number(b));
const keys = [...new Set(report.rows.map((row) => `${row.language}|${row.implementation}`))];

const find = (key: string, workers: string): Row | undefined =>
	report.rows.find((row) => `${row.language}|${row.implementation}` === key && row.variant === workers);

const lines = [
	"# Counter race: throughput by number of workers",
	"",
	`Derived from \`results.json\` (generated at ${report.generatedAt}) by \`throughput.ts\`. Machine and runtime versions are in [results.md](results.md).`,
	"",
	"Each cell is millions of increments per second: 1,000,000 increments divided by the time of the measured section (one run, after the hyperfine runs). The total work is the same in every column, split among the workers.",
	"",
	`| Language | Implementation | ${workerCounts.map((count) => `${count} worker${count === "1" ? "" : "s"}`).join(" | ")} | Final value with 8 workers |`,
	`| --- | --- | ${workerCounts.map(() => "---:").join(" | ")} | ---: |`,
];
for (const key of keys) {
	const [language, implementation] = key.split("|");
	const cells = workerCounts.map((workers) => {
		const row = find(key, workers);
		return row === undefined ? "-" : (row.n / row.elapsedMs / 1000).toFixed(1);
	});
	lines.push(`| ${language} | ${implementation} | ${cells.join(" | ")} | ${find(key, "8")?.checksum ?? "-"} |`);
}
lines.push(
	"",
	"A final value below 1,000,000 means lost updates. The buggy versions are fast because they are wrong: they skip the work that makes the answer right.",
	"",
);
writeFileSync(join(resultsDir, "throughput.md"), lines.join("\n"));
console.log(lines.join("\n"));
