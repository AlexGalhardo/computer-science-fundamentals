// EN: `bun run report/scaling.ts [resultsDir]`
//     Reads `results.json`, written by the benchmark runner, and derives what this mini-project
//     is about: speed-up, efficiency and the serial fraction that Amdahl's law needs to explain
//     each measurement. It writes `scaling.md` and `scaling.json` next to the input.
// PT: `bun run report/scaling.ts [resultsDir]`
//     Lê o `results.json`, escrito pelo runner de benchmark, e deriva o assunto deste
//     mini-projeto: speed-up, eficiência e a fração serial de que a lei de Amdahl precisa para
//     explicar cada medição. Escreve `scaling.md` e `scaling.json` ao lado da entrada.

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface BenchRow {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	meanMs: number;
	stddevMs: number;
	/** Fastest of the measured runs. Missing in hand-written test rows, where the mean is used. */
	minMs?: number;
	checksum?: string;
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

export interface ScalingPoint {
	workers: number;
	meanMs: number;
	stddevMs: number;
	bestMs: number;
	/** Speed-up between the fastest runs: best sequential time over best parallel time. */
	speedup: number;
	efficiency: number;
	/** Speed-up between the mean times, with the uncertainty propagated from the two deviations. */
	meanSpeedup: number;
	meanSpeedupError: number;
	/** Karp-Flatt metric. Undefined for one worker, where Amdahl's law says nothing. */
	serialFraction?: number;
}

export interface ScalingSeries {
	language: string;
	workload: string;
	schedule: string;
	baselineMs: number;
	baselineStddevMs: number;
	baselineBestMs: number;
	points: ScalingPoint[];
	/** Serial fraction fitted over every point with more than one worker, from the best runs. */
	fittedSerialFraction: number;
	/** The same fit made on the mean times, which carry the noise of the machine. */
	fittedSerialFractionMean: number;
}

export interface ScalingReport {
	project: string;
	generatedAt: string;
	n: number;
	/** One checksum per workload: every language, schedule and worker count printed this value. */
	checksums: Record<string, string>;
	series: ScalingSeries[];
}

// EN: Speed-up is how many times faster the parallel run is than the sequential program.
//     The baseline is the sequential implementation, not the parallel one with one worker:
//     that is the absolute speed-up, the gain a user actually sees.
// PT: Speed-up é quantas vezes a execução paralela é mais rápida que o programa sequencial.
//     A base é a implementação sequencial, e não a paralela com um trabalhador: esse é o
//     speed-up absoluto, o ganho que o usuário de fato percebe.
export function speedup(sequentialMs: number, parallelMs: number): number {
	return sequentialMs / parallelMs;
}

// EN: Efficiency is the speed-up per worker: 1 means every worker delivered a full worker of
//     gain, 0.5 means half of the hardware was wasted.
// PT: Eficiência é o speed-up por trabalhador: 1 significa que cada trabalhador entregou um
//     trabalhador inteiro de ganho, 0,5 significa que metade do hardware foi desperdiçada.
export function efficiency(speedupValue: number, workers: number): number {
	return speedupValue / workers;
}

// EN: Amdahl's law: with serial fraction s, the time on N workers is s + (1 - s) / N of the
//     sequential time, so the speed-up is the inverse of that sum.
// PT: Lei de Amdahl: com fração serial s, o tempo em N trabalhadores é s + (1 - s) / N do
//     tempo sequencial, então o speed-up é o inverso dessa soma.
export function amdahl(serialFraction: number, workers: number): number {
	return 1 / (serialFraction + (1 - serialFraction) / workers);
}

// EN: The Karp-Flatt metric inverts Amdahl's law for one measurement: which serial fraction
//     would explain this speed-up on this many workers? From 1/S = s + (1 - s)/N comes
//     s = (1/S - 1/N) / (1 - 1/N). If it stays constant as N grows, the loss is truly serial
//     code. If it grows with N, the loss is overhead (imbalance, contention, shared cores).
// PT: A métrica de Karp-Flatt inverte a lei de Amdahl para uma medição: que fração serial
//     explicaria este speed-up com esta quantidade de trabalhadores? De 1/S = s + (1 - s)/N
//     vem s = (1/S - 1/N) / (1 - 1/N). Se ela fica constante quando N cresce, a perda é código
//     realmente serial. Se cresce com N, a perda é sobrecarga (desbalanceamento, contenção,
//     núcleos compartilhados).
export function karpFlatt(speedupValue: number, workers: number): number {
	if (workers <= 1) {
		throw new Error("the serial fraction is undefined for one worker");
	}
	return (1 / speedupValue - 1 / workers) / (1 - 1 / workers);
}

// EN: The fit. Amdahl's law is a straight line through the origin when written as
//     y = s * x, with y = 1/S - 1/N and x = 1 - 1/N. Least squares for such a line has a
//     closed form: s = sum(x * y) / sum(x * x). One number summarises all worker counts.
// PT: O ajuste. A lei de Amdahl é uma reta que passa pela origem quando escrita como
//     y = s * x, com y = 1/S - 1/N e x = 1 - 1/N. Os mínimos quadrados para uma reta assim têm
//     forma fechada: s = soma(x * y) / soma(x * x). Um número resume todas as quantidades de
//     trabalhadores.
export function fitSerialFraction(points: { workers: number; speedup: number }[]): number {
	let numerator = 0;
	let denominator = 0;
	for (const point of points) {
		if (point.workers <= 1) {
			continue;
		}
		const x = 1 - 1 / point.workers;
		const y = 1 / point.speedup - 1 / point.workers;
		numerator += x * y;
		denominator += x * x;
	}
	if (denominator === 0) {
		throw new Error("the fit needs at least one measurement with more than one worker");
	}
	return numerator / denominator;
}

// EN: The input is a file on disk, so its shape is checked before use. This script runs in a
//     plain Bun container with no packages installed, hence the hand-written check.
// PT: A entrada é um arquivo em disco, então o formato é conferido antes do uso. Este script
//     roda em um contêiner Bun sem pacotes instalados, daí a verificação escrita à mão.
export function parseReport(value: unknown): BenchReport {
	if (typeof value !== "object" || value === null || !("rows" in value) || !Array.isArray(value.rows)) {
		throw new Error("results.json: expected an object with a list of rows");
	}
	for (const item of value.rows as unknown[]) {
		const row = item as Record<string, unknown>;
		const texts = ["language", "implementation", "variant"].every((key) => typeof row[key] === "string");
		const numbers = ["n", "meanMs", "stddevMs"].every((key) => typeof row[key] === "number");
		if (!texts || !numbers || !Number.isInteger(Number(row.variant))) {
			throw new Error(`results.json: malformed row ${JSON.stringify(item)}`);
		}
	}
	return value as BenchReport;
}

function mean(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function splitImplementation(implementation: string): { workload: string; mode: string } {
	const dash = implementation.lastIndexOf("-");
	return { workload: implementation.slice(0, dash), mode: implementation.slice(dash + 1) };
}

// EN: Acceptance criterion of the mini-project: the parallel results equal the sequential
//     ones exactly. Every row of a workload, in every language, schedule and worker count,
//     must have printed the same checksum. One different value stops the report.
// PT: Critério de aceitação do mini-projeto: os resultados paralelos são exatamente iguais aos
//     sequenciais. Toda linha de uma carga, em toda linguagem, escalonamento e quantidade de
//     trabalhadores, precisa ter impresso o mesmo checksum. Um valor diferente interrompe o
//     relatório.
export function checksumsByWorkload(rows: BenchRow[]): Record<string, string> {
	const checksums: Record<string, string> = {};
	for (const row of rows) {
		const { workload } = splitImplementation(row.implementation);
		if (row.checksum === undefined) {
			throw new Error(`${row.language} ${row.implementation}: no checksum`);
		}
		const known = checksums[workload];
		if (known === undefined) {
			checksums[workload] = row.checksum;
		} else if (known !== row.checksum) {
			throw new Error(
				`${row.language} ${row.implementation} with ${row.variant} workers printed ${row.checksum}, expected ${known}`,
			);
		}
	}
	return checksums;
}

export function buildScaling(report: BenchReport): ScalingReport {
	const checksums = checksumsByWorkload(report.rows);
	const series: ScalingSeries[] = [];
	const languages = [...new Set(report.rows.map((row) => row.language))];
	const workloads = [...new Set(report.rows.map((row) => splitImplementation(row.implementation).workload))].sort(
		(a, b) => b.localeCompare(a),
	);
	for (const workload of workloads) {
		for (const language of languages) {
			const rows = report.rows.filter(
				(row) => row.language === language && splitImplementation(row.implementation).workload === workload,
			);
			// EN: The sequential program ignores the worker count, so the grid measured it once
			//     per variant. Those repeated rows are averaged into one baseline.
			// PT: O programa sequencial ignora a quantidade de trabalhadores, então a grade o
			//     mediu uma vez por variante. Essas linhas repetidas viram uma única base, pela
			//     média.
			const sequential = rows.filter((row) => splitImplementation(row.implementation).mode === "seq");
			if (sequential.length === 0) {
				throw new Error(`${language} ${workload}: no sequential row to use as the baseline`);
			}
			const baselineMs = mean(sequential.map((row) => row.meanMs));
			const baselineStddevMs = Math.sqrt(mean(sequential.map((row) => row.stddevMs ** 2)));
			// EN: Other programs on the machine can only make a run slower, never faster. So the
			//     fastest run is the best estimate of what the program costs when left alone, and
			//     the speed-up is computed between fastest runs. The mean and its deviation are
			//     kept next to it, because they show how noisy the measurement was.
			// PT: Outros programas na máquina só conseguem deixar uma execução mais lenta, nunca
			//     mais rápida. Então a execução mais rápida é a melhor estimativa do custo do
			//     programa quando ninguém o atrapalha, e o speed-up é calculado entre as execuções
			//     mais rápidas. A média e o desvio ficam ao lado, porque mostram o ruído da medição.
			const baselineBestMs = Math.min(...sequential.map((row) => row.minMs ?? row.meanMs));
			const schedules = [...new Set(rows.map((row) => splitImplementation(row.implementation).mode))]
				.filter((mode) => mode !== "seq")
				.sort((a, b) => b.localeCompare(a));
			for (const schedule of schedules) {
				const points: ScalingPoint[] = rows
					.filter((row) => splitImplementation(row.implementation).mode === schedule)
					.map((row) => {
						const workers = Number(row.variant);
						const bestMs = row.minMs ?? row.meanMs;
						const value = speedup(baselineBestMs, bestMs);
						const meanValue = speedup(baselineMs, row.meanMs);
						// EN: The speed-up is a ratio of two noisy times, so its relative error is
						//     the two relative errors combined.
						// PT: O speed-up é a razão de dois tempos com ruído, então o seu erro
						//     relativo é a combinação dos dois erros relativos.
						const relativeError = Math.hypot(baselineStddevMs / baselineMs, row.stddevMs / row.meanMs);
						return {
							workers,
							meanMs: row.meanMs,
							stddevMs: row.stddevMs,
							bestMs,
							speedup: value,
							efficiency: efficiency(value, workers),
							meanSpeedup: meanValue,
							meanSpeedupError: meanValue * relativeError,
							serialFraction: workers > 1 ? karpFlatt(value, workers) : undefined,
						};
					})
					.sort((a, b) => a.workers - b.workers);
				series.push({
					language,
					workload,
					schedule,
					baselineMs,
					baselineStddevMs,
					baselineBestMs,
					points,
					fittedSerialFraction: fitSerialFraction(points),
					fittedSerialFractionMean: fitSerialFraction(
						points.map((point) => ({ workers: point.workers, speedup: point.meanSpeedup })),
					),
				});
			}
		}
	}
	return {
		project: report.project,
		generatedAt: report.generatedAt,
		n: report.rows[0]?.n ?? 0,
		checksums,
		series,
	};
}

function percent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

function ms(value: number): string {
	return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

export function renderScaling(scaling: ScalingReport, report: BenchReport): string {
	const lines = [
		`# Scaling by cores: speed-up, efficiency and Amdahl fit`,
		"",
		`Derived by \`report/scaling.ts\` from \`results.json\` (generated at ${scaling.generatedAt}, n = ${scaling.n.toLocaleString("en-US")}, ${report.runs} runs per row after ${report.warmup} warm-up). Machine, runtime versions and exact commands are in [results.md](results.md).`,
		"",
		"- `Mean ± sd` is the whole process measured by hyperfine: mean and standard deviation of the runs. `Best` is the fastest run.",
		"- `Speed-up` is the best sequential time divided by the best time with N workers. Other load on the machine can only slow a run down, so the fastest runs are the closest to the program itself.",
		"- `Efficiency` is that speed-up divided by N.",
		"- `Serial fraction` is the Karp-Flatt metric: the s that Amdahl's law needs to explain that row.",
		"- `Speed-up (mean)` is the same ratio between mean times, with the uncertainty that follows from the two standard deviations. It shows how much the noise of the machine moves the result.",
		"",
		"## Results are identical",
		"",
		"Every row of a workload printed the same checksum, in the three languages, both schedules and all worker counts, sequential rows included.",
		"",
		"| Workload | Checksum |",
		"| --- | --- |",
		...Object.entries(scaling.checksums).map(([workload, checksum]) => `| ${workload} | \`${checksum}\` |`),
		"",
	];
	const workloads = [...new Set(scaling.series.map((item) => item.workload))];
	for (const workload of workloads) {
		lines.push(`## ${workload}`, "");
		lines.push(
			"| Language | Schedule | Workers | Mean ± sd (ms) | Best (ms) | Speed-up | Efficiency | Serial fraction | Speed-up (mean) |",
			"| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
		);
		const sequentialShown = new Set<string>();
		for (const item of scaling.series.filter((entry) => entry.workload === workload)) {
			if (!sequentialShown.has(item.language)) {
				sequentialShown.add(item.language);
				lines.push(
					`| ${item.language} | sequential | 1 | ${ms(item.baselineMs)} ± ${ms(item.baselineStddevMs)} | ${ms(item.baselineBestMs)} | 1.00 | 100.0% | | 1.00 |`,
				);
			}
			for (const point of item.points) {
				lines.push(
					`| ${item.language} | ${item.schedule} | ${point.workers} | ${ms(point.meanMs)} ± ${ms(point.stddevMs)} | ${ms(point.bestMs)} | ${point.speedup.toFixed(2)} | ${percent(point.efficiency)} | ${point.serialFraction === undefined ? "" : percent(point.serialFraction)} | ${point.meanSpeedup.toFixed(2)} ± ${point.meanSpeedupError.toFixed(2)} |`,
				);
			}
		}
		lines.push("");
	}
	lines.push(
		"## Amdahl fit",
		"",
		"One serial fraction per series, fitted by least squares over 2, 4 and 8 workers, from the best runs. `Limit` is 1/s, the speed-up Amdahl's law allows with unlimited workers. `Predicted` is what the fitted law gives for 8 workers, next to what was measured. `Fit on means` is the same fit made on the mean times.",
		"",
		"| Workload | Language | Schedule | Fitted serial fraction | Limit (1/s) | Predicted S(8) | Measured S(8) | Fit on means |",
		"| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
	);
	for (const item of scaling.series) {
		const s = item.fittedSerialFraction;
		const last = item.points.at(-1);
		const limit = s > 0 ? (1 / s).toFixed(1) : "none";
		const predicted = last === undefined ? "" : amdahl(s, last.workers).toFixed(2);
		const measured = last === undefined ? "" : last.speedup.toFixed(2);
		lines.push(
			`| ${item.workload} | ${item.language} | ${item.schedule} | ${percent(s)} | ${limit} | ${predicted} | ${measured} | ${percent(item.fittedSerialFractionMean)} |`,
		);
	}
	lines.push("");
	return lines.join("\n");
}

if (import.meta.main) {
	const dir = resolve(process.argv[2] ?? join(import.meta.dir, "..", "results"));
	const report = parseReport(JSON.parse(readFileSync(join(dir, "results.json"), "utf8")));
	const scaling = buildScaling(report);
	writeFileSync(join(dir, "scaling.json"), `${JSON.stringify(scaling, null, "\t")}\n`);
	writeFileSync(join(dir, "scaling.md"), renderScaling(scaling, report));
	console.log(`${scaling.series.length} series written to ${join(dir, "scaling.md")}`);
}
