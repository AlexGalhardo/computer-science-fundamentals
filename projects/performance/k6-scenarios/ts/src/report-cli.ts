// EN: `docker compose run --rm report`. Reads the raw k6 summaries from `k6-results/` (git-ignored),
//     writes one Markdown summary per scenario in `results/` plus the table of both READMEs, and
//     exits with an error when the runs did not show what the lesson claims.
// PT: `docker compose run --rm report`. Lê os resumos brutos do k6 em `k6-results/` (ignorada pelo
//     git), grava um resumo Markdown por cenário em `results/` mais a tabela dos dois READMEs, e
//     termina com erro quando as execuções não mostraram o que a lição afirma.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";
import { z } from "zod";
import { SCENARIOS } from "../../k6/profiles.js";
import {
	find,
	injectTable,
	renderOverview,
	renderResults,
	renderScenario,
	type Summary,
	summarySchema,
	violations,
} from "./report";

const env = z
	.object({
		PROJECT_DIR: z
			.string()
			.min(1)
			.default(resolve(import.meta.dir, "..", "..")),
		LOAD_TEST_COMMAND: z.string().min(1).default("./load-test-unix.sh"),
		DATABASE_IMAGE: z.string().min(1).default("unknown"),
		RUNTIME: z.string().min(1).default("unknown"),
		K6_IMAGE: z.string().min(1).default("grafana/k6"),
	})
	.parse(process.env);

const rawDir = join(env.PROJECT_DIR, "k6-results");
const summaries: Summary[] = readdirSync(rawDir)
	.filter((name) => name.endsWith(".json"))
	.sort()
	.map((name) => summarySchema.parse(JSON.parse(readFileSync(join(rawDir, name), "utf8"))));

const processors = cpus();
const environment = {
	generatedAt: new Date().toISOString(),
	command: env.LOAD_TEST_COMMAND,
	machine: `${processors[0]?.model ?? "unknown CPU"}, ${processors.length} logical cores, ${(totalmem() / 2 ** 30).toFixed(1)} GiB visible to Docker`,
	database: env.DATABASE_IMAGE,
	runtime: `Bun ${Bun.version}, ${env.RUNTIME}`,
	loadTool: `k6 (${env.K6_IMAGE}), on the same machine and the same internal Docker network as the API`,
};

const resultsDir = join(env.PROJECT_DIR, "results");
mkdirSync(resultsDir, { recursive: true });
for (const scenario of SCENARIOS) {
	const before = find(summaries, scenario, "before");
	const after = find(summaries, scenario, "after");
	if (before !== undefined && after !== undefined) {
		writeFileSync(join(resultsDir, `${scenario}.md`), renderScenario(scenario, before, after));
	}
}
writeFileSync(join(resultsDir, "results.md"), renderResults(summaries, environment));
for (const [file, language] of [
	["README.md", "en"],
	["README.pt-BR.md", "pt"],
] as const) {
	const path = join(env.PROJECT_DIR, file);
	writeFileSync(path, injectTable(readFileSync(path, "utf8"), renderOverview(summaries, language)));
}

console.log(renderOverview(summaries, "en"));
const problems = violations(summaries);
for (const problem of problems) {
	console.error(`acceptance violated: ${problem}`);
}
process.exit(problems.length > 0 ? 1 : 0);
