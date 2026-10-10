import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SEEDED_BUGS, type SeededBug } from "../src/seeded-bugs";

// EN: The demo of this mini-project. It runs every suite against every seeded bug and prints
//     which suite turned red. Nothing in the table is written by hand: a cell says FAIL only
//     when the suite really exited with an error. The first row (no bug) is also the cost
//     report: how many tests each suite has and how long it takes.
// PT: A demo deste mini-projeto. Ela roda cada suíte contra cada bug semeado e imprime qual
//     suíte ficou vermelha. Nada na tabela é escrito à mão: uma célula diz FAIL só quando a
//     suíte realmente terminou com erro. A primeira linha (sem bug) também é o relatório de
//     custo: quantos testes cada suíte tem e quanto tempo leva.
// ES: La demo de este mini-proyecto. Ejecuta cada suite contra cada bug sembrado e imprime qué
//     suite se puso roja. Nada en la tabla se escribe a mano: una celda dice FAIL solo cuando la
//     suite realmente terminó con error. La primera fila (sin bug) es también el informe de
//     costo: cuántas pruebas tiene cada suite y cuánto tarda.
interface Suite {
	name: "unit" | "integration" | "regression" | "smoke" | "e2e";
	command: string[];
	needsServer: boolean;
}

interface Run {
	bug: SeededBug;
	suite: Suite["name"];
	passed: boolean;
	tests: number;
	durationMs: number;
}

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROOT = join(import.meta.dir, "..");

const SUITES: readonly Suite[] = [
	{ name: "unit", command: ["bun", "test", "tests/unit"], needsServer: false },
	{ name: "integration", command: ["bun", "test", "tests/integration"], needsServer: false },
	{ name: "regression", command: ["bun", "test", "tests/regression"], needsServer: false },
	{ name: "smoke", command: ["bun", "test", "tests/smoke"], needsServer: true },
	{ name: "e2e", command: ["bun", "run", "e2e"], needsServer: true },
];

// EN: The server is "ready" when the port answers anything at all, even an error. Readiness
//     must not depend on /health, or the seeded smoke bug would be caught by this script
//     instead of by the smoke suite.
// PT: O servidor está "pronto" quando a porta responde qualquer coisa, até um erro. A prontidão
//     não pode depender de /health, ou o bug semeado de fumaça seria pego por este script em
//     vez de pela suíte de fumaça.
// ES: El servidor está "listo" cuando el puerto responde cualquier cosa, incluso un error. La
//     disponibilidad no puede depender de /health, o el bug sembrado de humo sería atrapado por este
//     script en lugar de por la suite de humo.
async function waitForServer(): Promise<void> {
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			await fetch(`${BASE_URL}/`);
			return;
		} catch {
			await Bun.sleep(100);
		}
	}
	throw new Error("the shop server did not start");
}

// EN: Both runners end with a summary such as "9 pass" / "1 fail" (bun test) or "3 passed" /
//     "1 failed" (Playwright), so one pattern counts the tests of both.
// PT: Os dois executores terminam com um resumo como "9 pass" / "1 fail" (bun test) ou
//     "3 passed" / "1 failed" (Playwright), então um padrão conta os testes dos dois.
// ES: Los dos ejecutores terminan con un resumen como "9 pass" / "1 fail" (bun test) o
//     "3 passed" / "1 failed" (Playwright), así que un patrón cuenta las pruebas de ambos.
function countTests(output: string): number {
	const count = (word: string): number => Number(output.match(new RegExp(`(\\d+) ${word}`))?.[1] ?? 0);
	return count("pass") + count("fail");
}

async function runSuite(suite: Suite, bug: SeededBug): Promise<Run> {
	const env = { ...process.env, SEEDED_BUG: bug, BASE_URL, PORT: String(PORT) };
	const server = suite.needsServer
		? Bun.spawn(["bun", "run", "src/server.ts"], { cwd: ROOT, env, stdout: "ignore", stderr: "ignore" })
		: undefined;
	try {
		if (server !== undefined) {
			await waitForServer();
		}
		const started = performance.now();
		const child = Bun.spawn(suite.command, { cwd: ROOT, env, stdout: "pipe", stderr: "pipe" });
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);
		const durationMs = Math.round(performance.now() - started);
		return { bug, suite: suite.name, passed: exitCode === 0, tests: countTests(stdout + stderr), durationMs };
	} finally {
		server?.kill();
		await server?.exited;
	}
}

function table(header: string[], rows: string[][]): string {
	const line = (cells: string[]): string => `| ${cells.join(" | ")} |`;
	return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
}

function report(runs: Run[]): string {
	const cell = (bug: SeededBug, suite: Suite["name"]): Run => {
		const run = runs.find((item) => item.bug === bug && item.suite === suite);
		if (run === undefined) {
			throw new Error(`missing run ${bug}/${suite}`);
		}
		return run;
	};
	const matrix = table(
		["Seeded bug", ...SUITES.map((suite) => suite.name)],
		SEEDED_BUGS.map((bug) => [bug, ...SUITES.map((suite) => (cell(bug, suite.name).passed ? "pass" : "**FAIL**"))]),
	);
	const cost = table(
		["Suite", "Tests", "Duration (ms)", "ms per test"],
		SUITES.map((suite) => {
			const run = cell("none", suite.name);
			return [suite.name, String(run.tests), String(run.durationMs), (run.durationMs / run.tests).toFixed(1)];
		}),
	);
	return [
		"# test-pyramid: which suite catches which seeded bug",
		"",
		"Written by `docker compose run --rm matrix`. `FAIL` means the suite exited with an error, so it caught the bug.",
		"",
		matrix,
		"",
		"## Count and duration of each suite (no seeded bug)",
		"",
		"The duration is the whole command, including the start of the test runner (and of Chromium for `e2e`).",
		"",
		cost,
		"",
	].join("\n");
}

// EN: The lesson the table must show: with no bug everything is green, and each bug is caught
//     by the suite of its own level. If that stops being true, the demo itself fails.
// PT: A lição que a tabela precisa mostrar: sem bug tudo fica verde, e cada bug é pego pela
//     suíte do seu próprio nível. Se isso deixar de ser verdade, a própria demo falha.
// ES: La lección que la tabla debe mostrar: sin bug todo queda verde, y cada bug lo atrapa la
//     suite de su propio nivel. Si eso deja de ser verdad, la propia demo falla.
function problems(runs: Run[]): string[] {
	const found: string[] = [];
	for (const run of runs) {
		if (run.bug === "none" && !run.passed) {
			found.push(`suite ${run.suite} fails without any seeded bug`);
		}
		if (run.bug === run.suite && run.passed) {
			found.push(`suite ${run.suite} did not catch the bug seeded at its own level`);
		}
	}
	return found;
}

const runs: Run[] = [];
for (const bug of SEEDED_BUGS) {
	for (const suite of SUITES) {
		const run = await runSuite(suite, bug);
		console.log(
			`bug=${bug} suite=${suite.name} ${run.passed ? "pass" : "FAIL"} (${run.tests} tests, ${run.durationMs} ms)`,
		);
		runs.push(run);
	}
}

const markdown = report(runs);
console.log(`\n${markdown}`);

const resultsDir = process.env.RESULTS_DIR ?? join(ROOT, "results");
mkdirSync(resultsDir, { recursive: true });
// EN: The old file is removed first because it may belong to another user (a previous run with
//     a different uid): replacing a file needs write access to the folder, not to the file.
// PT: O arquivo antigo é removido antes porque pode pertencer a outro usuário (uma execução
//     anterior com outro uid): substituir um arquivo exige escrita na pasta, não no arquivo.
// ES: El archivo antiguo se elimina antes porque puede pertenecer a otro usuario (una ejecución
//     anterior con otro uid): reemplazar un archivo requiere escritura en la carpeta, no en el archivo.
const target = join(resultsDir, "bug-matrix.md");
rmSync(target, { force: true });
writeFileSync(target, markdown);

const found = problems(runs);
for (const problem of found) {
	console.error(`unexpected: ${problem}`);
}
process.exit(found.length === 0 ? 0 : 1);
