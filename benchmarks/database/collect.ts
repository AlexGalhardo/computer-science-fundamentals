// EN: Collector of the database workload (`bun run database`). It starts one PostgreSQL, then
//     runs the client of each language several times. Each client does the same four phases
//     and prints, for every phase, how many operations it did, how long they took and the
//     latency percentiles, plus its own CPU time and peak memory. The collector refuses to
//     write results if the clients do not agree on the checksum of what they read.
// PT: Coletor da carga de banco de dados (`bun run database`). Ele sobe um PostgreSQL e depois
//     roda o cliente de cada linguagem várias vezes. Cada cliente faz as mesmas quatro fases e
//     imprime, para cada fase, quantas operações fez, quanto tempo levaram e os percentis de
//     latência, além do próprio tempo de CPU e pico de memória. O coletor se recusa a escrever
//     resultados se os clientes não concordarem no checksum do que leram.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LANGUAGES, type Language, machineInfo, mustRun, run, spread } from "../scripts/lib";

const dir = import.meta.dir;
const RUNS = Number(process.env.DATABASE_RUNS ?? 3);
const ROWS = Number(process.env.DATABASE_ROWS ?? 5000);
const WORKERS = 8;
const PHASES = ["insert", "read", "query", "pool"] as const;

export const DRIVERS: Record<Language, { driver: string; version: string[] }> = {
	cpp: { driver: "libpq (official C client, from Debian trixie)", version: ["cat", "/opt/libpq-version"] },
	rust: { driver: "sqlx 0.9.0 on tokio 1.53.2", version: ["true"] },
	go: { driver: "pgx 5.11.0 (pgxpool)", version: ["true"] },
	java: { driver: "PostgreSQL JDBC 42.7.14 + HikariCP 7.1.0", version: ["true"] },
	ts: { driver: "Bun.sql (built into Bun 1.4.2)", version: ["true"] },
	elixir: { driver: "Postgrex 0.22.4", version: ["true"] },
	python: { driver: "psycopg 3.3.6 + psycopg-pool 3.3.3", version: ["true"] },
};

interface PhaseResult {
	ops: number;
	elapsedMs: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
}

export interface ClientResult {
	language: string;
	checksum: string;
	cpuMs: number;
	memoryKb: number;
	phases: Record<(typeof PHASES)[number], PhaseResult>;
}

export function compose(args: string[]): string {
	return mustRun(["docker", "compose", "--profile", "clients", ...args], { cwd: dir });
}

export function runClient(language: string, rows: number, workers: number): ClientResult {
	const output = compose(["run", "--rm", "-T", `client-${language}`, String(rows), String(workers)]);
	const line = output.split(/\r?\n/).findLast((item) => item.trim().startsWith("{"));
	if (line === undefined) {
		throw new Error(`client-${language} printed no result:\n${output}`);
	}
	return JSON.parse(line) as ClientResult;
}

const fixed = (value: number): string =>
	value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);

function main(): void {
	const services = LANGUAGES.map((language) => `client-${language}`);
	console.log("  building the client images");
	compose(["build", ...services]);
	compose(["down", "-v", "--remove-orphans"]);
	compose(["up", "-d", "--wait", "postgres"]);

	const rows = [];
	const runtimes: Record<string, string> = {};
	const checksums = new Map<string, string>();
	try {
		for (const language of LANGUAGES) {
			const image = `sef-bd-database-${language}:local`;
			const extra = mustRun([
				"docker",
				"run",
				"--rm",
				"--network",
				"none",
				"--entrypoint",
				DRIVERS[language].version[0] ?? "true",
				image,
				...DRIVERS[language].version.slice(1),
			]).trim();
			runtimes[language] = `${DRIVERS[language].driver}${extra === "" ? "" : ` ${extra}`} (${image})`;

			// EN: One small run first, thrown away: it warms the database cache and the image.
			// PT: Uma execução pequena antes, descartada: ela aquece o cache do banco e a imagem.
			runClient(language, 500, WORKERS);
			const results: ClientResult[] = [];
			for (let attempt = 1; attempt <= RUNS; attempt++) {
				const result = runClient(language, ROWS, WORKERS);
				results.push(result);
				console.log(
					`  ${language} run ${attempt}: ${PHASES.map((phase) => `${phase} ${Math.round(result.phases[phase].ops / (result.phases[phase].elapsedMs / 1000))} ops/s`).join(", ")}`,
				);
			}
			checksums.set(language, [...new Set(results.map((result) => result.checksum))].join(","));
			for (const phase of PHASES) {
				const ops = spread(
					results.map((result) => result.phases[phase].ops / (result.phases[phase].elapsedMs / 1000)),
				);
				const meanOf = (pick: (item: PhaseResult) => number): number =>
					spread(results.map((result) => pick(result.phases[phase]))).mean;
				rows.push({
					language,
					implementation: phase,
					variant: phase === "pool" ? `${WORKERS}-workers` : "1-connection",
					n: results[0]?.phases[phase].ops ?? 0,
					opsPerSecond: ops.mean,
					opsStddev: ops.stddev,
					opsMin: ops.min,
					opsMax: ops.max,
					p50Ms: meanOf((item) => item.p50Ms),
					p95Ms: meanOf((item) => item.p95Ms),
					p99Ms: meanOf((item) => item.p99Ms),
					// EN: CPU time and memory belong to the whole client run, all four phases together.
					// PT: O tempo de CPU e a memória são da execução inteira do cliente, as quatro fases juntas.
					clientCpuMs: spread(results.map((result) => result.cpuMs)).mean,
					clientPeakMemoryKb: Math.max(...results.map((result) => result.memoryKb)),
					checksum: results[0]?.checksum,
					command: `docker compose --profile clients run --rm -T client-${language} ${ROWS} ${WORKERS}`,
				});
			}
		}
	} finally {
		run(["docker", "compose", "--profile", "clients", "down", "-v", "--remove-orphans"], { cwd: dir });
	}

	if (new Set(checksums.values()).size !== 1) {
		throw new Error(`the clients disagree on the checksum: ${JSON.stringify(Object.fromEntries(checksums))}`);
	}

	rows.sort((a, b) => PHASES.indexOf(a.implementation) - PHASES.indexOf(b.implementation));
	const report = {
		project: "database",
		generatedAt: new Date().toISOString(),
		machine: machineInfo(),
		runtimes,
		runs: RUNS,
		warmup: 1,
		settings: {
			rows: ROWS,
			workers: WORKERS,
			queryOps: 200,
			clientCpus: 4,
			databaseCpus: 4,
			database: "postgres:18.6, data on tmpfs",
		},
		rows,
	};
	const outDir = join(dir, "results");
	mkdirSync(outDir, { recursive: true });
	const json = JSON.stringify(report, null, "\t");
	writeFileSync(join(outDir, "results.json"), `${json}\n`);
	writeFileSync(join(outDir, "results.js"), `window.BENCH_RESULTS = ${json};\n`);
	writeFileSync(
		join(outDir, "results.md"),
		[
			"# Benchmark: database",
			"",
			`Generated at ${report.generatedAt}. ${RUNS} measured runs per language after 1 small warm-up run. ${ROWS} rows, ${WORKERS} workers in the pool phase. PostgreSQL 18.6 with its data on tmpfs, client and server limited to 4 CPUs each.`,
			"",
			"## Machine",
			"",
			...Object.entries(report.machine).map(([key, value]) => `- ${key}: ${value}`),
			"",
			"## Drivers",
			"",
			...Object.entries(runtimes).map(([key, value]) => `- ${key}: ${value}`),
			"",
			"## Results",
			"",
			"`ops/s` is the mean of the runs ± standard deviation. Latencies are per operation, mean of the runs. `client CPU` and `client memory` belong to the whole client run (the four phases together).",
			"",
			"| Phase | Language | ops/s | range (ops/s) | p50 (ms) | p95 (ms) | p99 (ms) | client CPU (ms) | client memory (MiB) |",
			"| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
			...rows.map(
				(row) =>
					`| ${row.implementation} | ${row.language} | ${Math.round(row.opsPerSecond)} ± ${Math.round(row.opsStddev)} | ${Math.round(row.opsMin)} to ${Math.round(row.opsMax)} | ${fixed(row.p50Ms)} | ${fixed(row.p95Ms)} | ${fixed(row.p99Ms)} | ${Math.round(row.clientCpuMs)} | ${fixed(row.clientPeakMemoryKb / 1024)} |`,
			),
			"",
			"## Commands",
			"",
			"Run from `benchmarks/database/`:",
			"",
			...LANGUAGES.map(
				(language) =>
					`- \`${language}\`: \`docker compose --profile clients run --rm -T client-${language} ${ROWS} ${WORKERS}\``,
			),
			"",
		].join("\n"),
	);
	console.log(`${rows.length} rows written to ${outDir}`);
}

if (import.meta.main) {
	main();
}
