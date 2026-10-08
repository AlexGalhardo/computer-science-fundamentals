// EN: Small statistics and Markdown helpers for the benchmark report. They are pure functions,
//     so they are tested without a server or a database.
// PT: Pequenas funções de estatística e de Markdown para o relatório do benchmark. São funções
//     puras, então são testadas sem servidor nem banco de dados.

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

// EN: Percentile by the nearest-rank method: sort, then take the value at position p% of the
//     list. p95 describes the slow tail that a mean hides.
// PT: Percentil pelo método do posto mais próximo: ordenar e pegar o valor na posição p% da
//     lista. O p95 descreve a cauda lenta que a média esconde.
export function percentile(values: readonly number[], p: number): number {
	if (values.length === 0) {
		return 0;
	}
	const sorted = [...values].sort((a, b) => a - b);
	const rank = Math.min(sorted.length, Math.max(1, Math.ceil((p / 100) * sorted.length)));
	return sorted[rank - 1] ?? 0;
}

export interface ReadRow {
	read: string;
	style: string;
	/** HTTP round trips needed by one read. */
	requests: number;
	/** Bytes of the request bodies of one read. */
	requestBytes: number;
	/** Bytes of the response bodies of one read. */
	responseBytes: number;
	/** SQL statements the server ran for one read. */
	dbQueries: number;
	/** Mean of the round means, in milliseconds. */
	meanMs: number;
	/** Standard deviation between the rounds. */
	stddevMs: number;
	p50Ms: number;
	p95Ms: number;
}

export interface NPlusOneRow {
	endpoint: string;
	dbQueries: number;
	meanMs: number;
	stddevMs: number;
}

export function summarise(
	rounds: readonly (readonly number[])[],
): Pick<ReadRow, "meanMs" | "stddevMs" | "p50Ms" | "p95Ms"> {
	const roundMeans = rounds.map(mean);
	const all = rounds.flat();
	return {
		meanMs: mean(roundMeans),
		stddevMs: stddev(roundMeans),
		p50Ms: percentile(all, 50),
		p95Ms: percentile(all, 95),
	};
}

function ms(value: number): string {
	return value.toFixed(3);
}

export function renderReads(rows: readonly ReadRow[]): string {
	const lines = [
		"| Read | Style | HTTP requests | Request bytes | Response bytes | SQL statements | Mean (ms) | Std dev (ms) | p50 (ms) | p95 (ms) |",
		"| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
	];
	for (const row of rows) {
		lines.push(
			`| ${row.read} | ${row.style} | ${row.requests} | ${row.requestBytes} | ${row.responseBytes} | ${row.dbQueries} | ${ms(row.meanMs)} | ${ms(row.stddevMs)} | ${ms(row.p50Ms)} | ${ms(row.p95Ms)} |`,
		);
	}
	return lines.join("\n");
}

export function renderNPlusOne(rows: readonly NPlusOneRow[]): string {
	const lines = ["| Endpoint | SQL statements | Mean (ms) | Std dev (ms) |", "| --- | ---: | ---: | ---: |"];
	for (const row of rows) {
		lines.push(`| \`${row.endpoint}\` | ${row.dbQueries} | ${ms(row.meanMs)} | ${ms(row.stddevMs)} |`);
	}
	return lines.join("\n");
}
