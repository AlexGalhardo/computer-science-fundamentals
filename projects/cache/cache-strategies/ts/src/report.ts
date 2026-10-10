// EN: Turns the k6 summaries of the load test into the committed results tables, and checks the
//     acceptance criteria on the way: without protection each expiry must cost hundreds of
//     database queries, and with the lock or the early refresh it must cost exactly one.
// PT: Transforma os resumos do k6 do teste de carga nas tabelas de resultados versionadas, e
//     confere os critérios de aceite no caminho: sem proteção cada expiração precisa custar
//     centenas de consultas ao banco, e com a trava ou a renovação antecipada precisa custar
//     exatamente uma.
// ES: Convierte los resúmenes de k6 de la prueba de carga en las tablas de resultados
//     versionadas, y verifica los criterios de aceptación en el camino: sin protección cada
//     expiración debe costar cientos de consultas a la base de datos, y con el bloqueo o la
//     renovación anticipada debe costar exactamente una.

import { z } from "zod";
import { MODES, type Mode } from "./stampede";
import { STRATEGIES, type Strategy } from "./strategies";

// EN: The summaries are files written by another tool, so they are validated like any input.
// PT: Os resumos são arquivos escritos por outra ferramenta, então são validados como qualquer entrada.
// ES: Los resúmenes son archivos escritos por otra herramienta, así que se validan como cualquier entrada.
const count = z.number().int().min(0);
const amount = z.number().min(0);

export const stampedeSchema = z.object({
	experiment: z.literal("stampede"),
	mode: z.enum(MODES),
	round: z.number().int().min(1),
	users: count,
	durationS: amount,
	ttlMs: count,
	slowQueryMs: count,
	requests: count,
	unexpected: count,
	expiries: count,
	queries: count,
	burstMin: count,
	burstMedian: count,
	burstMax: count,
	medianMs: amount,
	p95Ms: amount,
	maxMs: amount,
});

export const hitRateSchema = z.object({
	experiment: z.literal("hit-rate"),
	strategy: z.enum(STRATEGIES),
	ttlMs: count,
	round: z.number().int().min(1),
	users: count,
	products: count,
	durationS: amount,
	queryCostMs: count,
	writeShare: amount,
	reads: count,
	hits: count,
	misses: count,
	hitRate: z.number().min(0).max(1),
	writes: count,
	unexpected: count,
	dbReads: count,
	dbWrites: count,
	dbRowsWritten: count,
	readMedianMs: amount,
	readP95Ms: amount,
	hitMedianMs: amount,
	missMedianMs: amount,
	writeMedianMs: amount,
	writeP95Ms: amount,
});

export const summarySchema = z.discriminatedUnion("experiment", [stampedeSchema, hitRateSchema]);

export type StampedeSummary = z.infer<typeof stampedeSchema>;
export type HitRateSummary = z.infer<typeof hitRateSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type Language = "en" | "pt" | "es";

/** "Hundreds" in the acceptance criterion: the smallest unprotected burst that still counts. */
export const HERD_THRESHOLD = 100;

export interface StampedeRow {
	mode: Mode;
	rounds: number;
	expiries: number;
	queries: number;
	/** Queries per expiry over all rounds: the worst median, the smallest and the largest burst. */
	burstMin: number;
	burstMedian: number;
	burstMax: number;
	p95MsMean: number;
	p95MsStddev: number;
	maxMs: number;
}

export interface HitRateRow {
	strategy: Strategy;
	ttlMs: number;
	rounds: number;
	hitRateMean: number;
	hitRateStddev: number;
	readMedianMs: number;
	readP95MsMean: number;
	readP95MsStddev: number;
	writeMedianMs: number;
	writeP95MsMean: number;
	/** Database statements per 1000 requests of the client, reads and writes apart. */
	dbReadsPer1000: number;
	dbWritesPer1000: number;
}

function mean(values: number[]): number {
	return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

// EN: Sample standard deviation. A difference between two rows that is smaller than this spread
//     is noise, not a result.
// PT: Desvio padrão amostral. Uma diferença entre duas linhas menor que essa dispersão é ruído,
//     não resultado.
// ES: Desviación estándar muestral. Una diferencia entre dos filas menor que esta dispersión es
//     ruido, no un resultado.
function stddev(values: number[]): number {
	if (values.length < 2) {
		return 0;
	}
	const average = mean(values);
	return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

export function aggregateStampede(summaries: Summary[]): StampedeRow[] {
	const rows: StampedeRow[] = [];
	for (const mode of MODES) {
		const runs = summaries.filter(
			(run): run is StampedeSummary => run.experiment === "stampede" && run.mode === mode,
		);
		if (runs.length === 0) {
			continue;
		}
		const p95 = runs.map((run) => run.p95Ms);
		rows.push({
			mode,
			rounds: runs.length,
			expiries: runs.reduce((sum, run) => sum + run.expiries, 0),
			queries: runs.reduce((sum, run) => sum + run.queries, 0),
			burstMin: Math.min(...runs.map((run) => run.burstMin)),
			burstMedian:
				mode === "none"
					? Math.min(...runs.map((run) => run.burstMedian))
					: Math.max(...runs.map((run) => run.burstMedian)),
			burstMax: Math.max(...runs.map((run) => run.burstMax)),
			p95MsMean: mean(p95),
			p95MsStddev: stddev(p95),
			maxMs: Math.max(...runs.map((run) => run.maxMs)),
		});
	}
	return rows;
}

export function aggregateHitRate(summaries: Summary[]): HitRateRow[] {
	const runs = summaries.filter((run): run is HitRateSummary => run.experiment === "hit-rate");
	const ttls = [...new Set(runs.map((run) => run.ttlMs))].sort((a, b) => a - b);
	const rows: HitRateRow[] = [];
	for (const strategy of STRATEGIES) {
		for (const ttlMs of ttls) {
			const group = runs.filter((run) => run.strategy === strategy && run.ttlMs === ttlMs);
			if (group.length === 0) {
				continue;
			}
			const requests = group.reduce((sum, run) => sum + run.reads + run.writes, 0);
			const per1000 = (total: number): number => (requests === 0 ? 0 : (total * 1000) / requests);
			rows.push({
				strategy,
				ttlMs,
				rounds: group.length,
				hitRateMean: mean(group.map((run) => run.hitRate)),
				hitRateStddev: stddev(group.map((run) => run.hitRate)),
				readMedianMs: mean(group.map((run) => run.readMedianMs)),
				readP95MsMean: mean(group.map((run) => run.readP95Ms)),
				readP95MsStddev: stddev(group.map((run) => run.readP95Ms)),
				writeMedianMs: mean(group.map((run) => run.writeMedianMs)),
				writeP95MsMean: mean(group.map((run) => run.writeP95Ms)),
				dbReadsPer1000: per1000(group.reduce((sum, run) => sum + run.dbReads, 0)),
				dbWritesPer1000: per1000(group.reduce((sum, run) => sum + run.dbWrites, 0)),
			});
		}
	}
	return rows;
}

// EN: The acceptance criteria as code. Returns one sentence per violation, empty when the load
//     test showed what the lesson claims.
// PT: Os critérios de aceite em código. Devolve uma frase por violação, vazio quando o teste de
//     carga mostrou o que a lição afirma.
// ES: Los criterios de aceptación como código. Devuelve una frase por cada violación, vacío
//     cuando la prueba de carga mostró lo que afirma la lección.
export function violations(summaries: Summary[]): string[] {
	const problems: string[] = [];
	for (const mode of MODES) {
		if (!summaries.some((run) => run.experiment === "stampede" && run.mode === mode)) {
			problems.push(`stampede ${mode}: no load test run found`);
		}
	}
	for (const strategy of STRATEGIES) {
		if (!summaries.some((run) => run.experiment === "hit-rate" && run.strategy === strategy)) {
			problems.push(`hit-rate ${strategy}: no load test run found`);
		}
	}
	for (const run of summaries) {
		if (run.experiment === "hit-rate") {
			if (run.unexpected > 0) {
				problems.push(
					`hit-rate ${run.strategy} ttl ${run.ttlMs} round ${run.round}: ${run.unexpected} unexpected responses`,
				);
			}
			continue;
		}
		const where = `stampede ${run.mode} round ${run.round}`;
		if (run.unexpected > 0) {
			problems.push(`${where}: ${run.unexpected} unexpected responses`);
		}
		if (run.expiries < 2) {
			problems.push(`${where}: only ${run.expiries} expiries observed, the run is too short`);
		}
		if (run.mode === "none") {
			if (run.burstMedian < HERD_THRESHOLD) {
				problems.push(
					`${where}: expected at least ${HERD_THRESHOLD} queries per expiry, the median was ${run.burstMedian}`,
				);
			}
		} else if (run.burstMax !== 1 || run.queries !== run.expiries) {
			problems.push(`${where}: expected exactly 1 query per expiry, the largest burst was ${run.burstMax}`);
		}
	}
	return problems;
}

function table(header: string[], rows: (string | number)[][]): string {
	return [
		`| ${header.join(" | ")} |`,
		`| ${header.map(() => "---").join(" | ")} |`,
		...rows.map((row) => `| ${row.join(" | ")} |`),
	].join("\n");
}

function range(min: number, max: number, language: Language): string {
	return min === max ? String(min) : `${min} ${language === "en" ? "to" : "a"} ${max}`;
}

export function renderStampedeTable(rows: StampedeRow[], language: Language): string {
	const headers: Record<Language, string[]> = {
		en: [
			"Protection",
			"Rounds",
			"Expiries",
			"Database queries",
			"Queries per expiry (median)",
			"Queries per expiry (range)",
			"p95 latency, ms (mean ± sd)",
			"Slowest request (ms)",
		],
		pt: [
			"Proteção",
			"Rodadas",
			"Expirações",
			"Consultas ao banco",
			"Consultas por expiração (mediana)",
			"Consultas por expiração (faixa)",
			"Latência p95, ms (média ± dp)",
			"Requisição mais lenta (ms)",
		],
		es: [
			"Protección",
			"Rondas",
			"Expiraciones",
			"Consultas a la base de datos",
			"Consultas por expiración (mediana)",
			"Consultas por expiración (rango)",
			"Latencia p95, ms (media ± de)",
			"Solicitud más lenta (ms)",
		],
	};
	return table(
		headers[language],
		rows.map((row) => [
			`\`${row.mode}\``,
			row.rounds,
			row.expiries,
			row.queries,
			`**${row.burstMedian}**`,
			range(row.burstMin, row.burstMax, language),
			`${row.p95MsMean.toFixed(0)} ± ${row.p95MsStddev.toFixed(0)}`,
			row.maxMs.toFixed(0),
		]),
	);
}

export function renderHitRateTable(rows: HitRateRow[], language: Language): string {
	const headers: Record<Language, string[]> = {
		en: [
			"Strategy",
			"Time to live",
			"Rounds",
			"Hit rate (mean ± sd)",
			"Read median (ms)",
			"Read p95, ms (mean ± sd)",
			"Write median (ms)",
			"Write p95 (ms)",
			"DB reads per 1000 requests",
			"DB writes per 1000 requests",
		],
		pt: [
			"Estratégia",
			"Tempo de vida",
			"Rodadas",
			"Taxa de acerto (média ± dp)",
			"Leitura, mediana (ms)",
			"Leitura p95, ms (média ± dp)",
			"Escrita, mediana (ms)",
			"Escrita p95 (ms)",
			"Leituras no banco por 1000 requisições",
			"Escritas no banco por 1000 requisições",
		],
		es: [
			"Estrategia",
			"Tiempo de vida",
			"Rondas",
			"Tasa de aciertos (media ± de)",
			"Lectura, mediana (ms)",
			"Lectura p95, ms (media ± de)",
			"Escritura, mediana (ms)",
			"Escritura p95 (ms)",
			"Lecturas en la base de datos por 1000 solicitudes",
			"Escrituras en la base de datos por 1000 solicitudes",
		],
	};
	return table(
		headers[language],
		rows.map((row) => [
			`\`${row.strategy}\``,
			`${row.ttlMs} ms`,
			row.rounds,
			`${(row.hitRateMean * 100).toFixed(1)}% ± ${(row.hitRateStddev * 100).toFixed(1)}`,
			row.readMedianMs.toFixed(2),
			`${row.readP95MsMean.toFixed(1)} ± ${row.readP95MsStddev.toFixed(1)}`,
			row.writeMedianMs.toFixed(2),
			row.writeP95MsMean.toFixed(1),
			row.dbReadsPer1000.toFixed(1),
			row.dbWritesPer1000.toFixed(1),
		]),
	);
}

export interface Environment {
	generatedAt: string;
	machine: string;
	database: string;
	cache: string;
	runtime: string;
	loadTool: string;
	command: string;
	poolSize: number;
	flushIntervalMs: number;
}

export function renderResults(
	stampede: StampedeRow[],
	hitRate: HitRateRow[],
	summaries: Summary[],
	environment: Environment,
): string {
	const hot = summaries.find((run): run is StampedeSummary => run.experiment === "stampede");
	const mixed = summaries.find((run): run is HitRateSummary => run.experiment === "hit-rate");
	const hotLoad =
		hot === undefined
			? ""
			: `${hot.users} virtual users read one hot key for ${hot.durationS} s, pausing 100 ms between reads. The cached copy lives ${hot.ttlMs} ms and the query behind it takes ${hot.slowQueryMs} ms. No warm-up: the cold start is the first stampede.`;
	const mixedLoad =
		mixed === undefined
			? ""
			: `${mixed.users} virtual users, ${mixed.products} products chosen with a skew towards the low ids, ${(mixed.writeShare * 100).toFixed(0)}% writes, ${mixed.durationS} s measured after a warm-up that is not counted. Each database read costs an extra ${mixed.queryCostMs} ms.`;
	return `# Cache strategies and stampede: load test results

Generated at ${environment.generatedAt} by \`${environment.command}\`.

## Stampede: database queries per expiry

Workload: ${hotLoad}

${renderStampedeTable(stampede, "en")}

- **Expiries** counts every time the hot key had to be loaded: the cold start, each expiry and each early refresh.
- **Queries per expiry** is counted by the API. A query that starts while another load of the hot key is still running belongs to the same expiry. The median column shows the worst round: the lowest median for \`none\`, the highest for the fixes.
- \`lock\`: one request wins \`SET lock NX PX\` and queries, the others wait for its copy. \`early\`: one request refreshes the key in the background before it expires, and nobody waits.

## Hit rate and latency per strategy and time to live

Workload: ${mixedLoad}

${renderHitRateTable(hitRate, "en")}

- **Hit rate** is the share of reads answered with \`X-Cache: hit\`.
- **DB reads** and **DB writes** are statements sent to PostgreSQL per 1000 client requests. A write-behind batch is one statement for many products.

## Environment

| Item | Value |
| --- | --- |
| Machine | ${environment.machine} |
| Database | ${environment.database} |
| Cache | ${environment.cache} |
| Runtime | ${environment.runtime} |
| Load tool | ${environment.loadTool} |
| Connection pool | ${environment.poolSize} connections |
| Write-behind flush interval | ${environment.flushIntervalMs} ms |

Numbers depend on the machine, and they are noisy: the runs are short and the machine was shared with other work. Compare the rows with each other, not with another computer. The counts of the stampede table (queries per expiry) are the stable part; the latencies are not.
`;
}

// EN: The READMEs keep each table between two HTML comments, so the report can replace it
//     without touching the text around it.
// PT: Os READMEs guardam cada tabela entre dois comentários HTML, então o relatório consegue
//     trocá-la sem tocar no texto em volta.
// ES: Los README guardan cada tabla entre dos comentarios HTML, así que el reporte puede
//     reemplazarla sin tocar el texto que la rodea.
export function injectTable(readme: string, name: string, tableText: string): string {
	const start = `<!-- ${name}:start -->`;
	const end = `<!-- ${name}:end -->`;
	const from = readme.indexOf(start);
	const to = readme.indexOf(end);
	if (from < 0 || to < from) {
		throw new Error(`README has no ${start} ... ${end} block`);
	}
	return `${readme.slice(0, from + start.length)}\n${tableText}\n${readme.slice(to)}`;
}
