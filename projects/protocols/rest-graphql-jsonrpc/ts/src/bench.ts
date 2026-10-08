// EN: The benchmark: `docker compose run --rm bench`. For a list, a detail and a nested read it
//     measures, per style, the HTTP round trips, the body bytes, the SQL statements and the
//     latency. Then it measures the N+1 request with and without batching, and writes results/.
// PT: O benchmark: `docker compose run --rm bench`. Para uma leitura de lista, uma de detalhe e
//     uma aninhada ele mede, por estilo, as idas e voltas HTTP, os bytes dos corpos, os comandos
//     SQL e a latência. Depois mede a requisição N+1 com e sem lote, e grava results/.

import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import { startApp } from "./app";
import { type ApiClient, createClient, STYLES, type Style } from "./clients";
import { loadConfig } from "./config";
import { createPool, resetDatabase } from "./db";
import { readShelf } from "./nplus1";
import { mean, type NPlusOneRow, type ReadRow, renderNPlusOne, renderReads, stddev, summarise } from "./stats";

const WARMUP = 50;
const N_PLUS_ONE_RUNS = 20;
const LIST_SIZE = 50;
const BOOK_ID = 7;

interface Read {
	name: string;
	run: (client: ApiClient) => Promise<unknown>;
}

const READS: Read[] = [
	{ name: `list (id and title of ${LIST_SIZE} books)`, run: (client) => client.listTitles(LIST_SIZE) },
	{ name: "detail (4 fields of 1 book)", run: (client) => client.getCard(BOOK_ID) },
	{ name: "nested (1 book, its author, its reviews)", run: (client) => client.getPage(BOOK_ID) },
];

const config = loadConfig();
const pool = createPool(config.DATABASE_URL);
await resetDatabase(pool);
const app = startApp(pool);

const readRows: ReadRow[] = [];
const nPlusOneRows: NPlusOneRow[] = [];
try {
	const clients = Object.fromEntries(STYLES.map((style) => [style, createClient(style, app.baseUrl)])) as Record<
		Style,
		ApiClient
	>;
	for (const read of READS) {
		// EN: Like with like. The three styles hit the same server and the same rows, one call at
		//     a time, after a warm-up that is thrown away (the first calls pay for JIT compilation
		//     and for opening connections). Inside a round the styles take turns call by call, so
		//     a slow moment of the machine hits the three of them and not only one.
		// PT: Comparar iguais. Os três estilos atingem o mesmo servidor e as mesmas linhas, uma
		//     chamada por vez, depois de um aquecimento que é descartado (as primeiras chamadas
		//     pagam a compilação JIT e a abertura de conexões). Dentro de uma rodada os estilos se
		//     revezam chamada a chamada, então um momento lento da máquina atinge os três e não
		//     só um.
		for (let warm = 0; warm < WARMUP; warm += 1) {
			for (const style of STYLES) {
				await read.run(clients[style]);
			}
		}
		const samples: Record<Style, number[][]> = { rest: [], graphql: [], jsonrpc: [] };
		for (let round = 0; round < config.BENCH_ROUNDS; round += 1) {
			const current: Record<Style, number[]> = { rest: [], graphql: [], jsonrpc: [] };
			for (let iteration = 0; iteration < config.BENCH_ITERATIONS; iteration += 1) {
				for (const style of STYLES) {
					const start = performance.now();
					await read.run(clients[style]);
					current[style].push(performance.now() - start);
				}
			}
			for (const style of STYLES) {
				samples[style].push(current[style]);
			}
		}
		for (const style of STYLES) {
			// EN: Requests, bytes and statements do not vary between calls, so one metered call
			//     is enough for them.
			// PT: Requisições, bytes e comandos não variam entre chamadas, então uma chamada
			//     medida basta para eles.
			const client = createClient(style, app.baseUrl);
			await read.run(client);
			const meter = client.meter;
			readRows.push({
				read: read.name,
				style,
				requests: meter.requests,
				requestBytes: meter.requestBytes,
				responseBytes: meter.responseBytes,
				dbQueries: meter.dbQueries,
				...summarise(samples[style]),
			});
		}
	}

	for (const path of ["/graphql-naive", "/graphql"] as const) {
		await readShelf(app.baseUrl, path);
		const times: number[] = [];
		let dbQueries = 0;
		for (let run = 0; run < N_PLUS_ONE_RUNS; run += 1) {
			const shelf = await readShelf(app.baseUrl, path);
			times.push(shelf.elapsedMs);
			dbQueries = shelf.dbQueries;
		}
		nPlusOneRows.push({ endpoint: path, dbQueries, meanMs: mean(times), stddevMs: stddev(times) });
	}
} finally {
	await app.stop();
	await pool.end();
}

const machine = {
	cpu: cpus()[0]?.model ?? "unknown",
	cores: cpus().length,
	memoryGb: Math.round(totalmem() / 1024 ** 3),
	bun: Bun.version,
	platform: `${process.platform} ${process.arch}`,
};
const command = "docker compose run --rm bench";
const report = [
	"# rest-graphql-jsonrpc: results",
	"",
	`- Command: \`${command}\``,
	`- Machine: ${machine.cpu}, ${machine.cores} cores, ${machine.memoryGb} GB visible to the container, ${machine.platform}`,
	`- Runtime: Bun ${machine.bun}, PostgreSQL from the \`db\` service of docker-compose`,
	`- Method: ${WARMUP} warm-up calls discarded, then ${config.BENCH_ROUNDS} rounds of ${config.BENCH_ITERATIONS} calls per style, styles interleaved. Client, server and database on the same machine, HTTP/1.1 over loopback, bodies not compressed.`,
	"- Std dev is the standard deviation between the round means. A difference smaller than it is not a difference.",
	"",
	"## Latency and payload per style",
	"",
	renderReads(readRows),
	"",
	"## N+1 in GraphQL: 100 books with author and reviews",
	"",
	`Mean of ${N_PLUS_ONE_RUNS} runs after one warm-up call.`,
	"",
	renderNPlusOne(nPlusOneRows),
	"",
].join("\n");

const resultsDir = join(config.PROJECT_DIR, "results");
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, "results.md"), report);
writeFileSync(
	join(resultsDir, "results.json"),
	`${JSON.stringify({ command, machine, reads: readRows, nPlusOne: nPlusOneRows }, null, "\t")}\n`,
);
console.log(report);
