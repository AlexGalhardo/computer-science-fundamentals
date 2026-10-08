// EN: `docker compose run --rm report`. Reads the raw k6 summaries from `k6-results/`, writes
//     `results/` and the tables of both READMEs, and exits with an error when the load test did
//     not show what the lesson claims.
// PT: `docker compose run --rm report`. Lê os resumos brutos do k6 em `k6-results/`, grava
//     `results/` e as tabelas dos dois READMEs, e termina com erro quando o teste de carga não
//     mostrou o que a lição afirma.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import { Cache } from "./cache";
import { loadConfig } from "./config";
import { Database } from "./db";
import {
	aggregateHitRate,
	aggregateStampede,
	type Environment,
	injectTable,
	renderHitRateTable,
	renderResults,
	renderStampedeTable,
	type Summary,
	summarySchema,
	violations,
} from "./report";

const config = loadConfig();
const rawDir = join(config.PROJECT_DIR, "k6-results");
const summaries: Summary[] = readdirSync(rawDir)
	.filter((name) => name.endsWith(".json"))
	.sort()
	.map((name) => summarySchema.parse(JSON.parse(readFileSync(join(rawDir, name), "utf8"))));

const db = Database.connect(config.DATABASE_URL, 1);
const postgresVersion = await db.serverVersion();
await db.close();
const cache = await Cache.connect(config.REDIS_URL);
const redisVersion = await cache.serverVersion();
cache.close();

const stampede = aggregateStampede(summaries);
const hitRate = aggregateHitRate(summaries);
const processors = cpus();
const environment: Environment = {
	generatedAt: new Date().toISOString(),
	machine: `${processors[0]?.model ?? "unknown CPU"}, ${processors.length} logical cores, ${(totalmem() / 2 ** 30).toFixed(1)} GiB visible to Docker`,
	database: `PostgreSQL ${postgresVersion} (${process.env.POSTGRES_IMAGE ?? "postgres"})`,
	cache: `Redis ${redisVersion} (${process.env.REDIS_IMAGE ?? "redis"}), no persistence, default configuration`,
	runtime: `Bun ${Bun.version} (oven/bun:1.4.2) with its built-in Redis client, ElysiaJS 1.4.30, pg 8.23.1`,
	loadTool: `k6 (${process.env.K6_IMAGE ?? "grafana/k6"})`,
	command: process.env.LOAD_TEST_COMMAND ?? "./load-test-unix.sh",
	poolSize: config.POOL_SIZE,
	flushIntervalMs: config.FLUSH_INTERVAL_MS,
};

const resultsDir = join(config.PROJECT_DIR, "results");
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, "results.md"), renderResults(stampede, hitRate, summaries, environment));
writeFileSync(
	join(resultsDir, "results.json"),
	`${JSON.stringify({ environment, stampede, hitRate, runs: summaries }, null, "\t")}\n`,
);
for (const [file, language] of [
	["README.md", "en"],
	["README.pt-BR.md", "pt"],
] as const) {
	const path = join(config.PROJECT_DIR, file);
	const withStampede = injectTable(readFileSync(path, "utf8"), "stampede", renderStampedeTable(stampede, language));
	writeFileSync(path, injectTable(withStampede, "hit-rate", renderHitRateTable(hitRate, language)));
}

console.log(renderStampedeTable(stampede, "en"));
console.log(renderHitRateTable(hitRate, "en"));
const problems = violations(summaries);
for (const problem of problems) {
	console.error(`acceptance violated: ${problem}`);
}
process.exit(problems.length > 0 ? 1 : 0);
