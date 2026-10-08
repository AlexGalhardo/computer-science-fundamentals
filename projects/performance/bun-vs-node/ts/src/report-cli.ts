// EN: `docker compose run --rm report`. Reads the raw k6 summaries from `k6-results/` (git-ignored),
//     writes `results/` and the table of both READMEs, and exits with an error when a setup was
//     not measured or a request failed.
// PT: `docker compose run --rm report`. Lê os resumos brutos do k6 em `k6-results/` (ignorada pelo
//     git), grava `results/` e a tabela dos dois READMEs, e termina com erro quando uma
//     configuração não foi medida ou uma requisição falhou.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";
import { z } from "zod";
import { aggregate, injectTable, renderResults, renderTable, type Summary, summarySchema, violations } from "./report";

const env = z
	.object({
		PROJECT_DIR: z
			.string()
			.min(1)
			.default(resolve(import.meta.dir, "..", "..")),
		LOAD_TEST_COMMAND: z.string().min(1).default("./load-test-unix.sh"),
		IMAGES: z.string().min(1).default("unknown"),
		K6_IMAGE: z.string().min(1).default("grafana/k6"),
		CPU_LIMIT: z.string().min(1).default("unknown"),
		WORKERS: z.string().min(1).default("unknown"),
	})
	.parse(process.env);

const rawDir = join(env.PROJECT_DIR, "k6-results");
const summaries: Summary[] = readdirSync(rawDir)
	.filter((name) => name.endsWith(".json"))
	.sort()
	.map((name) => summarySchema.parse(JSON.parse(readFileSync(join(rawDir, name), "utf8"))));

const first = summaries[0];
if (first === undefined) {
	console.error(`no k6 summary found in ${rawDir}: run the load test first`);
	process.exit(1);
}

const MEMORY_SOURCES: Record<Summary["memorySource"], string> = {
	"cgroup-peak": "cgroup `memory.peak`",
	"cgroup-current":
		"cgroup `memory.current`, the use at the end of the run, because this kernel has no `memory.peak`",
	"process-rss": "resident set size of one process, because no cgroup file was readable",
};
const rows = aggregate(summaries);
const processors = cpus();
const environment = {
	generatedAt: new Date().toISOString(),
	command: env.LOAD_TEST_COMMAND,
	machine: `${processors[0]?.model ?? "unknown CPU"}, ${processors.length} logical cores, ${(totalmem() / 2 ** 30).toFixed(1)} GiB visible to Docker`,
	images: env.IMAGES,
	loadTool: `k6 (${env.K6_IMAGE}), on the same machine and the same internal Docker network as the server`,
	workload: `after a warm-up that is not measured, ${first.durationS} s of ${first.cpuVus} virtual users calling \`GET /cpu?n=${first.cpuN}\` (counts the primes below n), then ${first.durationS} s of ${first.ioVus} virtual users calling \`GET /io?ms=${first.ioMs}\` (waits on a timer). Closed model: each virtual user waits for the answer before sending the next request. One setup runs at a time.`,
	limits: `each server container is limited to ${env.CPU_LIMIT} CPUs. \`node-pm2\` runs ${env.WORKERS} workers in cluster mode, \`bun\` and \`node\` run one process`,
	memorySource: MEMORY_SOURCES[first.memorySource],
};

const resultsDir = join(env.PROJECT_DIR, "results");
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
	const path = join(env.PROJECT_DIR, file);
	writeFileSync(path, injectTable(readFileSync(path, "utf8"), renderTable(rows, language)));
}

console.log(renderTable(rows, "en"));
const problems = violations(summaries);
for (const problem of problems) {
	console.error(`acceptance violated: ${problem}`);
}
process.exit(problems.length > 0 ? 1 : 0);
