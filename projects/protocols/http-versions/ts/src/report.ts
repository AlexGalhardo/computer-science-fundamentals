// EN: Pure functions that turn raw page loads into the committed results: statistics, the
//     Markdown table, and the compact waterfall data the static dashboard draws.
// PT: Funções puras que transformam cargas de página cruas nos resultados versionados:
//     estatísticas, a tabela Markdown, e os dados compactos de cascata que o dashboard estático
//     desenha.

import type { ResourceEntry } from "./browser";
import type { ConditionId, ProtocolId } from "./targets";

export function mean(values: readonly number[]): number {
	return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stddev(values: readonly number[]): number {
	if (values.length < 2) {
		return 0;
	}
	const average = mean(values);
	return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

export function median(values: readonly number[]): number {
	if (values.length === 0) {
		return 0;
	}
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/** Index of the run whose value is closest to the median: the "typical" run. */
export function typicalIndex(values: readonly number[]): number {
	const target = median(values);
	let best = 0;
	for (let index = 1; index < values.length; index += 1) {
		if (Math.abs((values[index] ?? 0) - target) < Math.abs((values[best] ?? 0) - target)) {
			best = index;
		}
	}
	return best;
}

export interface Cell {
	protocol: ProtocolId;
	protocolLabel: string;
	condition: ConditionId;
	netem: string | null;
	port: number;
	/** Total load time of each run, in milliseconds. */
	runsMs: number[];
	meanMs: number;
	stddevMs: number;
	medianMs: number;
	minMs: number;
	maxMs: number;
	/** Mean time to open the connection of the document. */
	connectMeanMs: number;
	/** Mean time at which half of the images had fully arrived. */
	halfImagesMeanMs: number;
	/** Start and end of every resource of the typical run, as [startMs, endMs], sorted by start. */
	waterfall: [number, number][];
	/** Load time of the typical run, the one the waterfall was taken from. */
	waterfallLoadMs: number;
}

// EN: A waterfall is one horizontal bar per resource, from the moment the browser asked for it
//     to the moment the last byte arrived. Only the two numbers are kept, rounded to a tenth of
//     a millisecond, so nine waterfalls of 200 bars stay small enough to commit.
// PT: Uma cascata é uma barra horizontal por recurso, do momento em que o navegador o pediu até
//     o momento em que o último byte chegou. Só os dois números são guardados, arredondados para
//     um décimo de milissegundo, então nove cascatas de 200 barras ficam pequenas o bastante para
//     versionar.
export function toWaterfall(resources: readonly ResourceEntry[]): [number, number][] {
	const round = (value: number): number => Math.round(value * 10) / 10;
	return resources
		.map((entry): [number, number] => [round(entry.startMs), round(entry.endMs)])
		.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

export function summariseCell(
	base: Pick<Cell, "protocol" | "protocolLabel" | "condition" | "netem" | "port">,
	runs: readonly { loadMs: number; connectMs: number; resources: readonly ResourceEntry[] }[],
): Cell {
	const runsMs = runs.map((run) => run.loadMs);
	const typical = runs[typicalIndex(runsMs)];
	return {
		...base,
		runsMs: runsMs.map((value) => Math.round(value * 10) / 10),
		meanMs: mean(runsMs),
		stddevMs: stddev(runsMs),
		medianMs: median(runsMs),
		minMs: Math.min(...runsMs),
		maxMs: Math.max(...runsMs),
		connectMeanMs: mean(runs.map((run) => run.connectMs)),
		halfImagesMeanMs: mean(runs.map((run) => median(run.resources.map((entry) => entry.endMs)))),
		waterfall: toWaterfall(typical?.resources ?? []),
		waterfallLoadMs: typical?.loadMs ?? 0,
	};
}

const CONDITION_TITLES: Record<ConditionId, string> = {
	clean: "no shaping",
	latency: "latency",
	"latency-loss": "latency and loss",
};

export function conditionTitle(cell: Pick<Cell, "condition" | "netem">): string {
	const title = CONDITION_TITLES[cell.condition];
	return cell.netem === null ? title : `${title} (\`netem ${cell.netem}\`)`;
}

export function renderTable(cells: readonly Cell[]): string {
	const lines = [
		"| Condition | Protocol | Port | Mean (ms) | Std dev (ms) | Median (ms) | Min (ms) | Max (ms) | Connection setup (ms) | Half of the images (ms) |",
		"| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
	];
	for (const cell of cells) {
		const numbers = [
			cell.meanMs,
			cell.stddevMs,
			cell.medianMs,
			cell.minMs,
			cell.maxMs,
			cell.connectMeanMs,
			cell.halfImagesMeanMs,
		].map((value) => value.toFixed(0));
		lines.push(`| ${conditionTitle(cell)} | ${cell.protocolLabel} | ${cell.port} | ${numbers.join(" | ")} |`);
	}
	return lines.join("\n");
}
