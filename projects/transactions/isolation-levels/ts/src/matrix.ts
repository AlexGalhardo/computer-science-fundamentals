// EN: Runs every anomaly at every isolation level and turns the outcomes into the matrix of the
//     README. The table is never typed by hand: it is what the database actually did.
// PT: Roda cada anomalia em cada nível de isolamento e transforma os resultados na matriz do
//     README. A tabela nunca é digitada à mão: ela é o que o banco de dados realmente fez.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ANOMALIES, type Anomaly, type AnomalyId, LEVELS, type Level, SCHEMA } from "./anomalies";
import { type Lab, type LogEntry, runScenario } from "./harness";

export interface Cell {
	anomaly: AnomalyId;
	level: Level;
	occurred: boolean;
	/** SQLSTATE codes raised during the scenario, for example 40001. */
	errorCodes: string[];
	log: LogEntry[];
}

export type Language = "en" | "pt";

export async function prepareSchema(lab: Lab): Promise<void> {
	for (const statement of SCHEMA) {
		await lab.sessions.observer.client.query(statement);
	}
}

export async function runCell(lab: Lab, anomaly: Anomaly, level: Level): Promise<Cell> {
	for (const statement of anomaly.setup) {
		await lab.sessions.observer.client.query(statement);
	}
	const run = await runScenario(lab, anomaly.steps(level));
	const errorCodes = [...new Set(run.log.flatMap((entry) => (entry.errorCode ? [entry.errorCode] : [])))];
	return { anomaly: anomaly.id, level, occurred: anomaly.occurred(run.outcomes), errorCodes, log: run.log };
}

export async function runMatrix(lab: Lab): Promise<Cell[]> {
	await prepareSchema(lab);
	const cells: Cell[] = [];
	for (const anomaly of ANOMALIES) {
		for (const level of LEVELS) {
			cells.push(await runCell(lab, anomaly, level));
		}
	}
	return cells;
}

export function findCell(cells: Cell[], anomaly: AnomalyId, level: Level): Cell {
	const cell = cells.find((item) => item.anomaly === anomaly && item.level === level);
	if (cell === undefined) {
		throw new Error(`no result for ${anomaly} at ${level}`);
	}
	return cell;
}

// EN: An anomaly can be prevented in two ways, and the matrix shows which. With no error, the
//     transaction simply kept reading its snapshot. With SQLSTATE 40001, PostgreSQL aborted one
//     transaction, and the application is expected to run it again.
// PT: Uma anomalia pode ser evitada de dois jeitos, e a matriz mostra qual. Sem erro, a transação
//     simplesmente continuou lendo o seu snapshot. Com SQLSTATE 40001, o PostgreSQL abortou uma
//     transação, e espera-se que a aplicação a execute de novo.
function cellText(cell: Cell, language: Language): string {
	if (cell.occurred) {
		return language === "en" ? "**occurs**" : "**ocorre**";
	}
	const prevented = language === "en" ? "prevented" : "evitada";
	const error = language === "en" ? "error" : "erro";
	return cell.errorCodes.length > 0 ? `${prevented} (${error} ${cell.errorCodes.join(", ")})` : prevented;
}

export function renderMatrix(cells: Cell[], language: Language): string {
	const header = [language === "en" ? "Anomaly" : "Anomalia", ...LEVELS];
	const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
	for (const anomaly of ANOMALIES) {
		const row = LEVELS.map((level) => cellText(findCell(cells, anomaly.id, level), language));
		lines.push(`| ${[anomaly.name[language], ...row].join(" | ")} |`);
	}
	return lines.join("\n");
}

// EN: The strongest level that still shows the anomaly and the level right above it. These two
//     runs are the interesting ones: the same script, one level apart, with opposite outcomes.
// PT: O nível mais forte que ainda mostra a anomalia e o nível logo acima. Essas duas execuções
//     são as interessantes: o mesmo roteiro, um nível de diferença, resultados opostos.
export function boundary(cells: Cell[], anomaly: AnomalyId): { lastAllowed?: Level; firstPrevented?: Level } {
	const allowed = LEVELS.filter((level) => findCell(cells, anomaly, level).occurred);
	const lastAllowed = allowed.at(-1);
	const firstPrevented = LEVELS.find(
		(level) =>
			!findCell(cells, anomaly, level).occurred &&
			(lastAllowed === undefined || LEVELS.indexOf(level) > LEVELS.indexOf(lastAllowed)),
	);
	return { lastAllowed, firstPrevented };
}

function formatMs(value: number | undefined): string {
	return value === undefined ? "" : value.toFixed(3);
}

export function renderTimeline(cell: Cell): string {
	const lines = [
		`### ${cell.anomaly} at ${cell.level}: ${cell.occurred ? "occurs" : "prevented"}`,
		"",
		`First step sent at ${cell.log[0]?.wallClock ?? "?"}. Times are milliseconds since the scenario started.`,
		"",
		"| # | Session | Step | Started | Blocked | Finished | Result |",
		"| --- | --- | --- | --- | --- | --- | --- |",
	];
	for (const entry of cell.log) {
		const result = entry.status === "ok" ? "ok" : `error ${entry.errorCode ?? ""}`.trim();
		lines.push(
			`| ${entry.order} | ${entry.session} | ${entry.label} | ${formatMs(entry.startedAtMs)} | ${formatMs(entry.blockedAtMs)} | ${formatMs(entry.finishedAtMs)} | ${result} |`,
		);
	}
	return lines.join("\n");
}

export function renderTimelines(cells: Cell[]): string {
	const sections: string[] = [];
	for (const anomaly of ANOMALIES) {
		const { lastAllowed, firstPrevented } = boundary(cells, anomaly.id);
		for (const level of [lastAllowed, firstPrevented]) {
			if (level !== undefined) {
				sections.push(renderTimeline(findCell(cells, anomaly.id, level)));
			}
		}
	}
	return sections.join("\n\n");
}

const START = "<!-- matrix:start -->";
const END = "<!-- matrix:end -->";

export function injectMatrix(document: string, table: string): string {
	const start = document.indexOf(START);
	const end = document.indexOf(END);
	if (start < 0 || end < start) {
		throw new Error(`markers ${START} and ${END} not found`);
	}
	return `${document.slice(0, start + START.length)}\n${table}\n${document.slice(end)}`;
}

export function writeResults(projectDir: string, cells: Cell[], serverVersion: string): void {
	const resultsDir = join(projectDir, "results");
	mkdirSync(resultsDir, { recursive: true });
	const summary = cells.map(({ anomaly, level, occurred, errorCodes }) => ({ anomaly, level, occurred, errorCodes }));
	writeFileSync(
		join(resultsDir, "matrix.json"),
		`${JSON.stringify({ database: serverVersion, cells: summary }, null, "\t")}\n`,
	);
	writeFileSync(
		join(resultsDir, "matrix.md"),
		`# Isolation level against anomaly\n\nGenerated by the tests (\`docker compose run --rm ts-test\`) on ${serverVersion}.\n\n${renderMatrix(cells, "en")}\n`,
	);
	writeFileSync(
		join(resultsDir, "timeline.md"),
		`# Timestamp log of the interleavings\n\nGenerated by the tests on ${serverVersion}. For each anomaly: the strongest level that still shows it, then the next level, where it is prevented. A value in "Blocked" is the moment the server confirmed that the statement was waiting for a lock.\n\n${renderTimelines(cells)}\n`,
	);
	for (const [file, language] of [
		["README.md", "en"],
		["README.pt-BR.md", "pt"],
	] as const) {
		const path = join(projectDir, file);
		writeFileSync(path, injectMatrix(readFileSync(path, "utf8"), renderMatrix(cells, language)));
	}
}

export async function serverVersion(lab: Lab): Promise<string> {
	const result = await lab.sessions.observer.client.query<{ server_version: string }>("SHOW server_version");
	return `PostgreSQL ${result.rows[0]?.server_version ?? "unknown"}`;
}
