// EN: `bun run demo` runs the lab, prints one table per sample and writes the results as
//     Markdown (for people), JSON (for tools) and a script (for the static dashboard).
// PT: `bun run demo` roda o laboratório, imprime uma tabela por amostra e grava os resultados em
//     Markdown (para pessoas), JSON (para ferramentas) e um script (para o dashboard estático).
// ES: `bun run demo` ejecuta el laboratorio, imprime una tabla por muestra y escribe los
//     resultados como Markdown (para personas), JSON (para herramientas) y un script (para el
//     dashboard estático).

import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";
import { runLab, type SampleReport } from "./lab";

export interface LabResults {
	project: string;
	generatedAt: string;
	command: string;
	repetitions: number;
	machine: Record<string, string>;
	samples: SampleReport[];
}

const REPETITIONS = 5;

function formatNumber(value: number): string {
	return value.toLocaleString("en-US");
}

function formatError(value: number): string {
	return Number.isFinite(value) ? value.toExponential(2) : "does not fit";
}

function table(sample: SampleReport): string {
	const lines = [
		`| n | ${sample.operation} | formula | time (ms) |`,
		"| ---: | ---: | ---: | ---: |",
		...sample.points.map(
			(point) =>
				`| ${formatNumber(point.n)} | ${formatNumber(point.operations)} | ${formatNumber(point.expected)} | ${point.timeMs.toFixed(4)} |`,
		),
	];
	return lines.join("\n");
}

function fitTable(sample: SampleReport): string {
	const lines = [
		"| candidate | relative error |",
		"| --- | ---: |",
		...sample.fit.candidates.map((fit) => {
			const mark = fit.id === sample.fit.best.id ? " (best)" : "";
			return `| ${fit.label}${mark} | ${formatError(fit.error)} |`;
		}),
	];
	return lines.join("\n");
}

export function renderMarkdown(results: LabResults): string {
	const machine = Object.entries(results.machine).map(([key, value]) => `- ${key}: ${value}`);
	const sections = results.samples.map((sample) =>
		[
			`## ${sample.id}: ${sample.title}`,
			"",
			`Counted operation: ${sample.operation}. Closed formula: \`${sample.formula}\`.`,
			`Best fit: **${sample.fit.best.label}**, relative error ${formatError(sample.fit.best.error)}.`,
			"",
			table(sample),
			"",
			fitTable(sample),
		].join("\n"),
	);
	return [
		`# Results: ${results.project}`,
		"",
		`Generated at ${results.generatedAt} with \`${results.command}\`.`,
		`Time is the median of ${results.repetitions} runs of the algorithm alone. Operation counts are exact.`,
		"",
		"## Machine",
		"",
		...machine,
		"",
		...sections.flatMap((section) => [section, ""]),
	].join("\n");
}

function main(): void {
	const results: LabResults = {
		project: "big-o-lab",
		generatedAt: new Date().toISOString(),
		command: "docker compose run --rm ts-demo",
		repetitions: REPETITIONS,
		// EN: Times only mean something next to the machine that produced them.
		// PT: Tempos só significam algo ao lado da máquina que os produziu.
		// ES: Los tiempos solo significan algo junto a la máquina que los produjo.
		machine: {
			CPU: cpus()[0]?.model ?? "unknown",
			"logical cores": String(cpus().length),
			memory: `${(totalmem() / 1024 ** 3).toFixed(1)} GiB`,
			platform: `${process.platform} ${process.arch}`,
			runtime: `Bun ${Bun.version} (oven/bun:1.4.2)`,
		},
		samples: runLab(REPETITIONS),
	};

	for (const sample of results.samples) {
		console.log(`\n${sample.id}: ${sample.title}`);
		console.log(table(sample));
		console.log(`best fit: ${sample.fit.best.label} (relative error ${formatError(sample.fit.best.error)})`);
	}

	// EN: Infinity is not valid JSON, so a curve that does not fit is stored as null.
	// PT: Infinity não é JSON válido, então uma curva que não se ajusta é gravada como null.
	// ES: Infinity no es JSON válido, así que una curva que no se ajusta se guarda como null.
	const json = JSON.stringify(results, (_key, value) => (value === Number.POSITIVE_INFINITY ? null : value), "\t");
	const directory = resolve(process.env.RESULTS_DIR ?? join(import.meta.dir, "..", "..", "results"));
	mkdirSync(directory, { recursive: true });
	writeFileSync(join(directory, "results.json"), `${json}\n`);
	// EN: A page opened from disk cannot fetch a JSON file, but it can load a script.
	// PT: Uma página aberta do disco não consegue buscar um arquivo JSON, mas consegue carregar um script.
	// ES: Una página abierta desde el disco no puede pedir un archivo JSON, pero sí puede cargar un script.
	writeFileSync(join(directory, "results.js"), `window.BIG_O_LAB_RESULTS = ${json};\n`);
	writeFileSync(join(directory, "results.md"), renderMarkdown(results));
	console.log(`\nresults written to ${directory}`);
}

if (import.meta.main) {
	main();
}
