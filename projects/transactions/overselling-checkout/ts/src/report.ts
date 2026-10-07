// EN: Turns the k6 summaries of the load test into the committed results table, and checks the
//     acceptance criteria on the way: the naive checkout must oversell, and every fix must sell
//     exactly the stock.
// PT: Transforma os resumos do k6 do teste de carga na tabela de resultados versionada, e confere
//     os critérios de aceite no caminho: o checkout ingênuo precisa vender demais, e cada correção
//     precisa vender exatamente o estoque.

import { z } from "zod";
import { STRATEGIES, type Strategy } from "./checkout";

// EN: The summaries are files written by another tool, so they are validated like any input.
// PT: Os resumos são arquivos escritos por outra ferramenta, então são validados como qualquer entrada.
export const summarySchema = z.object({
	strategy: z.enum(STRATEGIES),
	round: z.number().int().min(1),
	buyers: z.number().int().min(1),
	initialStock: z.number().int().min(0),
	sold: z.number().int().min(0),
	soldOut: z.number().int().min(0),
	conflict: z.number().int().min(0),
	unexpected: z.number().int().min(0),
	finalOrders: z.number().int().min(0),
	finalStock: z.number().int(),
	windowMs: z.number().min(0),
	requestsPerSecond: z.number().min(0),
	medianMs: z.number().min(0),
	p95Ms: z.number().min(0),
});

export type Summary = z.infer<typeof summarySchema>;

export interface Row {
	strategy: Strategy;
	rounds: number;
	buyers: number;
	initialStock: number;
	ordersMin: number;
	ordersMax: number;
	rpsMean: number;
	rpsStddev: number;
	soldOutMean: number;
	conflictMean: number;
	/** Share of the requests that did not end in a sale, from 0 to 1. */
	rejectedRate: number;
	unexpected: number;
	p95MsMean: number;
}

export type Language = "en" | "pt";

function mean(values: number[]): number {
	return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

// EN: Sample standard deviation. A difference between two strategies that is smaller than this
//     spread is noise, not a result.
// PT: Desvio padrão amostral. Uma diferença entre duas estratégias menor que essa dispersão é
//     ruído, não resultado.
function stddev(values: number[]): number {
	if (values.length < 2) {
		return 0;
	}
	const average = mean(values);
	return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

export function aggregate(summaries: Summary[]): Row[] {
	const rows: Row[] = [];
	for (const strategy of STRATEGIES) {
		const runs = summaries.filter((summary) => summary.strategy === strategy);
		const first = runs[0];
		if (first === undefined) {
			continue;
		}
		const orders = runs.map((run) => run.finalOrders);
		const rps = runs.map((run) => run.requestsPerSecond);
		rows.push({
			strategy,
			rounds: runs.length,
			buyers: first.buyers,
			initialStock: first.initialStock,
			ordersMin: Math.min(...orders),
			ordersMax: Math.max(...orders),
			rpsMean: mean(rps),
			rpsStddev: stddev(rps),
			soldOutMean: mean(runs.map((run) => run.soldOut)),
			conflictMean: mean(runs.map((run) => run.conflict)),
			rejectedRate: mean(runs.map((run) => (run.soldOut + run.conflict) / run.buyers)),
			unexpected: runs.reduce((sum, run) => sum + run.unexpected, 0),
			p95MsMean: mean(runs.map((run) => run.p95Ms)),
		});
	}
	return rows;
}

// EN: The acceptance criteria as code. Returns one sentence per violation, empty when the load
//     test showed what the lesson claims.
// PT: Os critérios de aceite em código. Devolve uma frase por violação, vazio quando o teste de
//     carga mostrou o que a lição afirma.
export function violations(summaries: Summary[]): string[] {
	const problems: string[] = [];
	for (const strategy of STRATEGIES) {
		if (!summaries.some((summary) => summary.strategy === strategy)) {
			problems.push(`${strategy}: no load test run found`);
		}
	}
	for (const run of summaries) {
		const where = `${run.strategy} round ${run.round}`;
		if (run.unexpected > 0) {
			problems.push(`${where}: ${run.unexpected} unexpected responses`);
		}
		if (run.strategy === "naive") {
			if (run.finalOrders <= run.initialStock) {
				problems.push(`${where}: expected overselling, got ${run.finalOrders} orders`);
			}
		} else if (run.finalOrders !== run.initialStock || run.finalStock !== 0) {
			problems.push(
				`${where}: expected exactly ${run.initialStock} orders and stock 0, got ${run.finalOrders} orders and stock ${run.finalStock}`,
			);
		}
	}
	return problems;
}

function range(min: number, max: number): string {
	return min === max ? String(min) : `${min} to ${max}`;
}

export function renderTable(rows: Row[], language: Language): string {
	const header =
		language === "en"
			? [
					"Strategy",
					"Rounds",
					"Orders created",
					"Requests/s (mean ± sd)",
					"Rejected: sold out (mean)",
					"Rejected: gave up after conflicts (mean)",
					"Rejected share",
					"p95 latency (ms)",
				]
			: [
					"Estratégia",
					"Rodadas",
					"Pedidos criados",
					"Requisições/s (média ± dp)",
					"Rejeitadas: esgotado (média)",
					"Rejeitadas: desistiu após conflitos (média)",
					"Parcela rejeitada",
					"Latência p95 (ms)",
				];
	const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
	for (const row of rows) {
		const orders = range(row.ordersMin, row.ordersMax).replace("to", language === "en" ? "to" : "a");
		lines.push(
			`| ${[
				`\`${row.strategy}\``,
				row.rounds,
				row.strategy === "naive" ? `**${orders}**` : orders,
				`${row.rpsMean.toFixed(0)} ± ${row.rpsStddev.toFixed(0)}`,
				row.soldOutMean.toFixed(1),
				row.conflictMean.toFixed(1),
				`${(row.rejectedRate * 100).toFixed(1)}%`,
				row.p95MsMean.toFixed(0),
			].join(" | ")} |`,
		);
	}
	return lines.join("\n");
}

export interface Environment {
	generatedAt: string;
	machine: string;
	database: string;
	runtime: string;
	loadTool: string;
	command: string;
	thinkTimeMs: number;
	poolSize: number;
}

export function renderResults(rows: Row[], environment: Environment): string {
	const first = rows[0];
	const load = first === undefined ? "" : `${first.buyers} concurrent buyers, ${first.initialStock} units in stock`;
	return `# Overselling at checkout: load test results

Generated at ${environment.generatedAt} by \`${environment.command}\`.

Workload: ${load}, one purchase attempt per buyer, all started together. Each strategy ran in separate rounds, and the product was reset before each round.

${renderTable(rows, "en")}

- **Orders created** is the number of rows in \`orders\` after the round. Anything above the stock is overselling.
- **Requests/s** is the number of buyers divided by the time from the first request sent to the last response received.
- **Rejected** requests are the buyers that did not get a unit: \`409\` when the product was sold out, \`503\` when a fix gave up after too many conflicts.

## Environment

| Item | Value |
| --- | --- |
| Machine | ${environment.machine} |
| Database | ${environment.database} |
| Runtime | ${environment.runtime} |
| Load tool | ${environment.loadTool} |
| Think time between read and write | ${environment.thinkTimeMs} ms |
| Connection pool | ${environment.poolSize} connections |

Numbers depend on the machine. Compare the strategies with each other, not with another computer.
`;
}

const START = "<!-- results:start -->";
const END = "<!-- results:end -->";

export function injectTable(document: string, table: string): string {
	const start = document.indexOf(START);
	const end = document.indexOf(END);
	if (start < 0 || end < start) {
		throw new Error(`markers ${START} and ${END} not found`);
	}
	return `${document.slice(0, start + START.length)}\n${table}\n${document.slice(end)}`;
}
