// EN: `docker compose run --rm report`. Reads the raw k6 summaries from `k6-results/`, writes
//     `results/` and the table of both READMEs, and exits with an error when the load test did
//     not show what the lesson claims.
// PT: `docker compose run --rm report`. Lê os resumos brutos do k6 em `k6-results/`, grava
//     `results/` e a tabela dos dois READMEs, e termina com erro quando o teste de carga não
//     mostrou o que a lição afirma.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import { loadConfig } from "./config";
import { createPool } from "./db";
import { aggregate, injectTable, renderResults, renderTable, type Summary, summarySchema, violations } from "./report";

const config = loadConfig();
const rawDir = join(config.PROJECT_DIR, "k6-results");
const summaries: Summary[] = readdirSync(rawDir)
	.filter((name) => name.endsWith(".json"))
	.sort()
	.map((name) => summarySchema.parse(JSON.parse(readFileSync(join(rawDir, name), "utf8"))));

const pool = createPool(config.DATABASE_URL, 1);
const version = await pool.query<{ server_version: string }>("SHOW server_version");
await pool.end();

const rows = aggregate(summaries);
const processors = cpus();
const environment = {
	generatedAt: new Date().toISOString(),
	machine: `${processors[0]?.model ?? "unknown CPU"}, ${processors.length} logical cores, ${(totalmem() / 2 ** 30).toFixed(1)} GiB visible to Docker`,
	database: `PostgreSQL ${version.rows[0]?.server_version ?? "unknown"} (postgres:18.6-alpine)`,
	runtime: `Bun ${Bun.version} (oven/bun:1.4.2), ElysiaJS 1.4.30, pg 8.23.1`,
	loadTool: `k6 (${process.env.K6_IMAGE ?? "grafana/k6"})`,
	command: process.env.LOAD_TEST_COMMAND ?? "./load-test-unix.sh",
	thinkTimeMs: config.THINK_TIME_MS,
	poolSize: config.POOL_SIZE,
};

const resultsDir = join(config.PROJECT_DIR, "results");
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, "results.md"), renderResults(rows, environment));
writeFileSync(
	join(resultsDir, "results.json"),
	`${JSON.stringify({ environment, rows, runs: summaries }, null, "\t")}\n`,
);
for (const [file, language] of [
	["README.md", "en"],
	["README.pt-BR.md", "pt"],
] as const) {
	const path = join(config.PROJECT_DIR, file);
	writeFileSync(path, injectTable(readFileSync(path, "utf8"), renderTable(rows, language)));
}

console.log(renderTable(rows, "en"));
const problems = violations(summaries);
for (const problem of problems) {
	console.error(`acceptance violated: ${problem}`);
}
process.exit(problems.length > 0 ? 1 : 0);
