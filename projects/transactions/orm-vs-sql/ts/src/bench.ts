// EN: The benchmark: `docker compose run --rm bench`. It measures the latency of the four
//     read queries in the three approaches and the cost of the N+1 pattern, then writes
//     results/ and the tables of both READMEs.
// PT: O benchmark: `docker compose run --rm bench`. Mede a latência das quatro consultas de
//     leitura nas três abordagens e o custo do padrão N+1, e depois grava results/ e as tabelas
//     dos dois READMEs.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import { capture } from "./capture";
import { loadConfig } from "./config";
import { APPROACHES, type Approach, type Context, createContext, resetDatabase } from "./context";
import { FIVE_QUERIES, N_PLUS_ONE, type Runnable } from "./queries";
import { inject, latencyRows, mean, type NPlusOneRow, renderLatency, renderNPlusOne } from "./stats";

const WARMUP = 100;
const N_PLUS_ONE_RUNS = 5;

async function timeOne(context: Context, query: Runnable, approach: Approach): Promise<number> {
	const start = performance.now();
	await query.run(context, approach);
	return performance.now() - start;
}

// EN: Like with like. All approaches run in the same process against the same database, one
//     call at a time, after a warm-up that is thrown away (the first calls pay for JIT
//     compilation, connection setup and cold caches). Inside a round the approaches take turns
//     call by call, so a slow moment of the machine hits the three of them and not only one.
// PT: Comparar iguais. Todas as abordagens rodam no mesmo processo contra o mesmo banco, uma
//     chamada por vez, depois de um aquecimento que é descartado (as primeiras chamadas pagam a
//     compilação JIT, a abertura de conexões e os caches frios). Dentro de uma rodada as
//     abordagens se revezam chamada a chamada, então um momento lento da máquina atinge as três e
//     não só uma.
async function measureLatency(
	context: Context,
	query: Runnable,
	iterations: number,
	rounds: number,
): Promise<Record<Approach, number[][]>> {
	const samples: Record<Approach, number[][]> = { raw: [], prisma: [], drizzle: [] };
	for (let warm = 0; warm < WARMUP; warm += 1) {
		for (const approach of APPROACHES) {
			await query.run(context, approach);
		}
	}
	for (let round = 0; round < rounds; round += 1) {
		const current: Record<Approach, number[]> = { raw: [], prisma: [], drizzle: [] };
		for (let iteration = 0; iteration < iterations; iteration += 1) {
			for (const approach of APPROACHES) {
				current[approach].push(await timeOne(context, query, approach));
			}
		}
		for (const approach of APPROACHES) {
			samples[approach].push(current[approach]);
		}
	}
	return samples;
}

const config = loadConfig();
await resetDatabase(config.DATABASE_URL);

const quiet = createContext({ databaseUrl: config.DATABASE_URL, record: false });
const latency = new Map<string, Record<Approach, number[][]>>();
const nPlusOneTimes = new Map<Approach, { naive: number; fixed: number }>();
try {
	for (const query of FIVE_QUERIES.filter((item) => item.readOnly)) {
		latency.set(query.name, await measureLatency(quiet, query, config.BENCH_ITERATIONS, config.BENCH_ROUNDS));
	}
	for (const approach of APPROACHES) {
		await N_PLUS_ONE.naive.run(quiet, approach);
		await N_PLUS_ONE.fixed.run(quiet, approach);
		const naive: number[] = [];
		const fixed: number[] = [];
		for (let run = 0; run < N_PLUS_ONE_RUNS; run += 1) {
			naive.push(await timeOne(quiet, N_PLUS_ONE.naive, approach));
			fixed.push(await timeOne(quiet, N_PLUS_ONE.fixed, approach));
		}
		nPlusOneTimes.set(approach, { naive: mean(naive), fixed: mean(fixed) });
	}
} finally {
	await quiet.close();
}

// EN: Statements are counted in a second pass with the recorder on, so that recording does not
//     slow down the timed pass.
// PT: Os comandos são contados em uma segunda passada com o gravador ligado, para a gravação não
//     atrasar a passada cronometrada.
const recording = createContext({ databaseUrl: config.DATABASE_URL, record: true });
const nPlusOne: NPlusOneRow[] = [];
let serverVersion = "unknown";
try {
	for (const approach of APPROACHES) {
		const naive = await capture(recording, N_PLUS_ONE.naive, approach);
		const fixed = await capture(recording, N_PLUS_ONE.fixed, approach);
		const times = nPlusOneTimes.get(approach) ?? { naive: 0, fixed: 0 };
		nPlusOne.push({
			approach,
			naiveStatements: naive.statements.length,
			fixedStatements: fixed.statements.length,
			naiveMs: times.naive,
			fixedMs: times.fixed,
		});
	}
	const version = await recording.raw.query<{ server_version: string }>("SHOW server_version");
	serverVersion = version[0]?.server_version ?? "unknown";
} finally {
	await recording.close();
}

const rows = latencyRows(latency);
const processors = cpus();
const environment = {
	generatedAt: new Date().toISOString(),
	command: "docker compose run --rm bench",
	machine: `${processors[0]?.model ?? "unknown CPU"}, ${processors.length} logical cores, ${(totalmem() / 2 ** 30).toFixed(1)} GiB visible to Docker`,
	database: `PostgreSQL ${serverVersion} (postgres:18.6-alpine)`,
	runtime: `Bun ${Bun.version} (oven/bun:1.4.2)`,
	libraries: "pg 8.23.1, Prisma 7.10.0 with @prisma/adapter-pg 7.10.0, Drizzle ORM 0.45.3",
	iterations: config.BENCH_ITERATIONS,
	rounds: config.BENCH_ROUNDS,
	warmup: WARMUP,
};

const report = `# Prisma, Drizzle and raw SQL: benchmark results

Generated at ${environment.generatedAt} by \`${environment.command}\`.

## Latency per approach

${environment.rounds} rounds of ${environment.iterations} sequential calls per query and approach, after ${environment.warmup} discarded warm-up calls. The application and the database run in two containers on the same machine, so the network cost is close to zero and the difference between the approaches is mostly the work done by each library.

${renderLatency(rows, "en")}

"± between rounds" is the standard deviation of the means of the rounds. A difference smaller than it is noise.

## N+1 and its fix

Listing 150 authors with their posts. Time is the mean of ${N_PLUS_ONE_RUNS} runs.

${renderNPlusOne(nPlusOne, "en")}

## Environment

| Item | Value |
| --- | --- |
| Machine | ${environment.machine} |
| Database | ${environment.database} |
| Runtime | ${environment.runtime} |
| Libraries | ${environment.libraries} |

Numbers depend on the machine. Compare the approaches with each other, not with another computer.
`;

const resultsDir = join(config.PROJECT_DIR, "results");
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, "results.md"), report);
writeFileSync(
	join(resultsDir, "results.json"),
	`${JSON.stringify({ environment, latency: rows, nPlusOne }, null, "\t")}\n`,
);
for (const [file, language] of [
	["README.md", "en"],
	["README.pt-BR.md", "pt"],
] as const) {
	const path = join(config.PROJECT_DIR, file);
	const withLatency = inject(readFileSync(path, "utf8"), "latency", renderLatency(rows, language));
	writeFileSync(path, inject(withLatency, "n-plus-one", renderNPlusOne(nPlusOne, language)));
}

console.log(renderLatency(rows, "en"));
console.log(`\n${renderNPlusOne(nPlusOne, "en")}`);
