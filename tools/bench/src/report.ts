// EN: Turns measured rows into the two committed artifacts: a Markdown table for people and a
//     JSON file for the static dashboard.
// PT: Transforma as linhas medidas nos dois artefatos versionados: uma tabela Markdown para
//     pessoas e um arquivo JSON para o dashboard estático.
// ES: Transforma las filas medidas en los dos artefactos versionados: una tabla Markdown para
//     personas y un archivo JSON para el dashboard estático.

export interface BenchRow {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	/** Mean and standard deviation of the whole process, measured by hyperfine. */
	meanMs: number;
	stddevMs: number;
	minMs: number;
	maxMs: number;
	/** CPU time (user plus system) of the whole process. Above the wall-clock time means several cores worked. */
	cpuMs: number;
	/** Peak resident memory of the whole process, sampled by hyperfine. */
	peakMemoryKb: number;
	/** Time of the measured section, reported by the program itself. */
	elapsedMs: number;
	memoryKb: number;
	checksum?: string;
	command: string;
}

export interface BenchReport {
	project: string;
	generatedAt: string;
	machine: Record<string, string>;
	runtimes: Record<string, string>;
	runs: number;
	warmup: number;
	rows: BenchRow[];
}

export function rowKey(row: Pick<BenchRow, "language" | "implementation" | "variant" | "n">): string {
	return `${row.language}/${row.implementation}/${row.variant}/${row.n}`;
}

export function sortRows(rows: BenchRow[]): BenchRow[] {
	return [...rows].sort(
		(a, b) =>
			a.implementation.localeCompare(b.implementation) ||
			a.variant.localeCompare(b.variant) ||
			a.n - b.n ||
			a.language.localeCompare(b.language),
	);
}

function fixed(value: number): string {
	return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

export function renderMarkdown(report: BenchReport): string {
	const lines = [
		`# Benchmark: ${report.project}`,
		"",
		`Generated at ${report.generatedAt}. ${report.runs} runs per row after ${report.warmup} warm-up run(s).`,
		"",
		"## Machine",
		"",
		...Object.entries(report.machine).map(([key, value]) => `- ${key}: ${value}`),
		"",
		"## Runtimes",
		"",
		...Object.entries(report.runtimes).map(([key, value]) => `- ${key}: ${value}`),
		"",
		"## Results",
		"",
		"`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.",
		"",
		"| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |",
		"| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |",
		...report.rows.map(
			(row) =>
				`| ${row.implementation} | ${row.variant} | ${row.n} | ${row.language} | ${fixed(row.meanMs)} ± ${fixed(row.stddevMs)} | ${fixed(row.minMs)} to ${fixed(row.maxMs)} | ${fixed(row.cpuMs)} | ${fixed(row.elapsedMs)} | ${Math.round(row.peakMemoryKb)} |`,
		),
		"",
		"## Commands",
		"",
		...[...new Set(report.rows.map((row) => `- \`${row.language}\`: \`${row.command}\``))],
		"",
	];
	return lines.join("\n");
}
