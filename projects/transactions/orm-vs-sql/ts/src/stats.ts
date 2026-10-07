// EN: Small statistics and Markdown helpers for the benchmark report. They are pure functions,
//     so they are tested without a database.
// PT: Pequenas funções de estatística e de Markdown para o relatório do benchmark. São funções
//     puras, então são testadas sem banco de dados.

import { APPROACHES, type Approach } from "./context";

export function mean(values: number[]): number {
	return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stddev(values: number[]): number {
	if (values.length < 2) {
		return 0;
	}
	const average = mean(values);
	return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

// EN: Percentile by the nearest-rank method: sort, then take the value at position p% of the
//     list. p95 = "95% of the calls were at least this fast", which describes the slow tail
//     that a mean hides.
// PT: Percentil pelo método do posto mais próximo: ordenar e pegar o valor na posição p% da
//     lista. p95 = "95% das chamadas foram pelo menos tão rápidas quanto isto", o que descreve a
//     cauda lenta que a média esconde.
export function percentile(values: number[], p: number): number {
	if (values.length === 0) {
		return 0;
	}
	const sorted = [...values].sort((a, b) => a - b);
	const rank = Math.min(sorted.length, Math.max(1, Math.ceil((p / 100) * sorted.length)));
	return sorted[rank - 1] ?? 0;
}

export interface LatencyRow {
	query: string;
	approach: Approach;
	/** Mean of the means of each round, in milliseconds. */
	meanMs: number;
	/** Standard deviation between the rounds. */
	stddevMs: number;
	p50Ms: number;
	p95Ms: number;
	/** Mean divided by the mean of raw SQL for the same query. */
	timesRaw: number;
}

export function latencyRows(samples: Map<string, Record<Approach, number[][]>>): LatencyRow[] {
	const rows: LatencyRow[] = [];
	for (const [query, byApproach] of samples) {
		const rawMean = mean(byApproach.raw.map(mean));
		for (const approach of APPROACHES) {
			const rounds = byApproach[approach];
			const roundMeans = rounds.map(mean);
			const all = rounds.flat();
			rows.push({
				query,
				approach,
				meanMs: mean(roundMeans),
				stddevMs: stddev(roundMeans),
				p50Ms: percentile(all, 50),
				p95Ms: percentile(all, 95),
				timesRaw: rawMean > 0 ? mean(roundMeans) / rawMean : 0,
			});
		}
	}
	return rows;
}

export type Language = "en" | "pt";

function table(header: string[], lines: (string | number)[][]): string {
	return [
		`| ${header.join(" | ")} |`,
		`| ${header.map(() => "---").join(" | ")} |`,
		...lines.map((line) => `| ${line.join(" | ")} |`),
	].join("\n");
}

export function renderLatency(rows: LatencyRow[], language: Language): string {
	const header =
		language === "en"
			? ["Query", "Approach", "Mean (ms)", "± between rounds", "p50 (ms)", "p95 (ms)", "Times raw SQL"]
			: ["Consulta", "Abordagem", "Média (ms)", "± entre rodadas", "p50 (ms)", "p95 (ms)", "Vezes o SQL puro"];
	return table(
		header,
		rows.map((row) => [
			`\`${row.query}\``,
			row.approach,
			row.meanMs.toFixed(3),
			row.stddevMs.toFixed(3),
			row.p50Ms.toFixed(3),
			row.p95Ms.toFixed(3),
			`${row.timesRaw.toFixed(2)}x`,
		]),
	);
}

export interface NPlusOneRow {
	approach: Approach;
	naiveStatements: number;
	fixedStatements: number;
	naiveMs: number;
	fixedMs: number;
}

export function renderNPlusOne(rows: NPlusOneRow[], language: Language): string {
	const header =
		language === "en"
			? ["Approach", "Statements, N+1", "Statements, fix", "Time, N+1 (ms)", "Time, fix (ms)", "Speed-up"]
			: ["Abordagem", "Comandos, N+1", "Comandos, correção", "Tempo, N+1 (ms)", "Tempo, correção (ms)", "Ganho"];
	return table(
		header,
		rows.map((row) => [
			row.approach,
			row.naiveStatements,
			row.fixedStatements,
			row.naiveMs.toFixed(1),
			row.fixedMs.toFixed(1),
			`${(row.fixedMs > 0 ? row.naiveMs / row.fixedMs : 0).toFixed(1)}x`,
		]),
	);
}

export function inject(document: string, marker: string, content: string): string {
	const startTag = `<!-- ${marker}:start -->`;
	const endTag = `<!-- ${marker}:end -->`;
	const start = document.indexOf(startTag);
	const end = document.indexOf(endTag);
	if (start < 0 || end < start) {
		throw new Error(`markers ${startTag} and ${endTag} not found`);
	}
	return `${document.slice(0, start + startTag.length)}\n${content}\n${document.slice(end)}`;
}
