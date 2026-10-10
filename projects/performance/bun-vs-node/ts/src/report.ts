// EN: Turns the k6 summaries into the committed results table. Each setup ran several rounds, and
//     the table shows the median with the range (lowest to highest round), because one run on a
//     shared machine is an anecdote: a difference smaller than the range is not a result.
// PT: Transforma os resumos do k6 na tabela de resultados versionada. Cada configuração rodou
//     várias rodadas, e a tabela mostra a mediana com a faixa (da menor à maior rodada), porque uma
//     execução em máquina compartilhada é uma anedota: diferença menor que a faixa não é resultado.
// ES: Convierte los resúmenes de k6 en la tabla de resultados versionada. Cada configuración corrió
//     varias rondas, y la tabla muestra la mediana con el rango (de la ronda menor a la mayor), porque
//     una ejecución en una máquina compartida es una anécdota: una diferencia menor que el rango no
//     es un resultado.

import { z } from "zod";

export const SETUPS = ["bun", "node", "node-pm2"] as const;
export type Setup = (typeof SETUPS)[number];

const phaseSchema = z.object({
	requests: z.number().int().min(0),
	windowMs: z.number().min(0),
	requestsPerSecond: z.number().min(0),
	medianMs: z.number().min(0),
	p95Ms: z.number().min(0),
});

// EN: The summaries are files written by another tool, so they are validated like any input.
// PT: Os resumos são arquivos escritos por outra ferramenta, então são validados como qualquer entrada.
// ES: Los resúmenes son archivos escritos por otra herramienta, así que se validan como cualquier entrada.
export const summarySchema = z.object({
	setup: z.enum(SETUPS),
	round: z.number().int().min(1),
	runtime: z.enum(["bun", "node"]),
	runtimeVersion: z.string().min(1),
	cpuVus: z.number().int().min(1),
	ioVus: z.number().int().min(1),
	cpuN: z.number().int().min(1),
	ioMs: z.number().int().min(0),
	durationS: z.number().int().min(1),
	checksRate: z.number().min(0).max(1),
	cpu: phaseSchema,
	io: phaseSchema,
	memoryBytes: z.number().min(0),
	memorySource: z.enum(["cgroup-peak", "cgroup-current", "process-rss"]),
});

export type Summary = z.infer<typeof summarySchema>;

/** Median, lowest and highest value of the rounds. */
export interface Spread {
	median: number;
	min: number;
	max: number;
}

export interface Row {
	setup: Setup;
	runtime: string;
	rounds: number;
	cpuRps: Spread;
	cpuP95Ms: Spread;
	ioRps: Spread;
	ioP95Ms: Spread;
	memoryMib: Spread;
}

export type Language = "en" | "pt" | "es";

export function spread(values: number[]): Spread {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 1 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
	return { median, min: sorted[0] ?? 0, max: sorted[sorted.length - 1] ?? 0 };
}

export function aggregate(summaries: Summary[]): Row[] {
	const rows: Row[] = [];
	for (const setup of SETUPS) {
		const runs = summaries.filter((summary) => summary.setup === setup);
		const first = runs[0];
		if (first === undefined) {
			continue;
		}
		rows.push({
			setup,
			runtime: `${first.runtime === "bun" ? "Bun" : "Node.js"} ${first.runtimeVersion}`,
			rounds: runs.length,
			cpuRps: spread(runs.map((run) => run.cpu.requestsPerSecond)),
			cpuP95Ms: spread(runs.map((run) => run.cpu.p95Ms)),
			ioRps: spread(runs.map((run) => run.io.requestsPerSecond)),
			ioP95Ms: spread(runs.map((run) => run.io.p95Ms)),
			memoryMib: spread(runs.map((run) => run.memoryBytes / 2 ** 20)),
		});
	}
	return rows;
}

// EN: What must hold for the table to mean anything: the three setups were measured, and no
//     request failed. Which setup is faster is NOT asserted: that is the measurement, not a rule.
// PT: O que precisa valer para a tabela significar algo: as três configurações foram medidas, e
//     nenhuma requisição falhou. Qual configuração é mais rápida NÃO é afirmado: isso é a medição,
//     não uma regra.
// ES: Lo que debe cumplirse para que la tabla signifique algo: las tres configuraciones se midieron y
//     ninguna solicitud falló. Cuál configuración es más rápida NO se afirma: eso es la medición, no
//     una regla.
export function violations(summaries: Summary[]): string[] {
	const problems: string[] = [];
	for (const setup of SETUPS) {
		if (!summaries.some((summary) => summary.setup === setup)) {
			problems.push(`no run for setup "${setup}"`);
		}
	}
	for (const summary of summaries) {
		const label = `${summary.setup} round ${summary.round}`;
		if (summary.checksRate < 1) {
			problems.push(`${label}: ${((1 - summary.checksRate) * 100).toFixed(2)}% of the requests failed`);
		}
		if (summary.cpu.requests === 0 || summary.io.requests === 0) {
			problems.push(`${label}: a phase completed no request`);
		}
	}
	return problems;
}

function range(value: Spread, digits = 0): string {
	return `${value.median.toFixed(digits)} (${value.min.toFixed(digits)} to ${value.max.toFixed(digits)})`;
}

const HEADERS: Record<Language, string[]> = {
	en: [
		"Setup",
		"Runtime",
		"Rounds",
		"CPU-bound: requests/s",
		"CPU-bound: p95 (ms)",
		"I/O-bound: requests/s",
		"I/O-bound: p95 (ms)",
		"Peak memory (MiB)",
	],
	pt: [
		"Configuração",
		"Runtime",
		"Rodadas",
		"CPU-bound: requisições/s",
		"CPU-bound: p95 (ms)",
		"I/O-bound: requisições/s",
		"I/O-bound: p95 (ms)",
		"Pico de memória (MiB)",
	],
	es: [
		"Configuración",
		"Runtime",
		"Rondas",
		"CPU-bound: solicitudes/s",
		"CPU-bound: p95 (ms)",
		"I/O-bound: solicitudes/s",
		"I/O-bound: p95 (ms)",
		"Pico de memoria (MiB)",
	],
};

export function renderTable(rows: Row[], language: Language): string {
	const lines = [`| ${HEADERS[language].join(" | ")} |`, `| ${HEADERS[language].map(() => "---").join(" | ")} |`];
	for (const row of rows) {
		lines.push(
			`| \`${row.setup}\` | ${row.runtime} | ${row.rounds} | ${range(row.cpuRps)} | ${range(row.cpuP95Ms)} | ${range(row.ioRps)} | ${range(row.ioP95Ms, 1)} | ${range(row.memoryMib)} |`,
		);
	}
	return lines.join("\n");
}

export interface Environment {
	generatedAt: string;
	command: string;
	machine: string;
	images: string;
	loadTool: string;
	workload: string;
	limits: string;
	memorySource: string;
}

export function renderResults(rows: Row[], environment: Environment): string {
	return `# Bun against Node: load test results

Generated at ${environment.generatedAt} by \`${environment.command}\`.

Workload: ${environment.workload}

Each cell is the **median of the rounds, with the lowest and the highest round in parentheses**.

${renderTable(rows, "en")}

- **Requests/s** is the number of answers of the phase divided by the time from its first request sent to its last answer received.
- **p95** is the 95th percentile of the request duration measured by k6: 95% of the requests of the phase took at most this long.
- **Peak memory** is the highest memory use of the whole container since it started (${environment.memorySource}), read after the load. For \`node-pm2\` that is the PM2 daemon plus every worker.

## Environment

| Item | Value |
| --- | --- |
| Machine | ${environment.machine} |
| Images | ${environment.images} |
| Load tool | ${environment.loadTool} |
| Limits | ${environment.limits} |

Other agents and programs were using the same machine during the measurement, so the numbers are noisy. Compare the setups with each other, look at the range before believing a difference, and do not compare with another computer.
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
