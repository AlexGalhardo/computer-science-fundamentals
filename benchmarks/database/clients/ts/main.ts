// EN: Database client of the benchmark in TypeScript, with Bun's built-in PostgreSQL client
//     (Bun.sql), so there is no package to install. The four phases are the same in the 7
//     languages: insert n rows one by one, read each by primary key, run a query with a filter
//     and an aggregate, and read by key again from 8 async tasks sharing a pool of 8
//     connections. One thread is enough here: the program spends its time waiting for the
//     database, and the event loop handles many waits at once.
// PT: Cliente de banco de dados do benchmark em TypeScript, com o cliente PostgreSQL embutido
//     do Bun (Bun.sql), então não há pacote para instalar. As quatro fases são as mesmas nas 7
//     linguagens: inserir n linhas uma a uma, ler cada uma pela chave primária, rodar uma
//     consulta com filtro e agregação, e ler pela chave de novo a partir de 8 tarefas
//     assíncronas dividindo um pool de 8 conexões. Uma thread basta aqui: o programa passa o
//     tempo esperando o banco, e o event loop cuida de muitas esperas ao mesmo tempo.

import { readFileSync } from "node:fs";
import { SQL } from "bun";

const QUERY_OPS = 200;
const CATEGORIES = 10;

interface Phase {
	ops: number;
	elapsedMs: number;
	latencies: number[];
}

function summary(phase: Phase): { ops: number; elapsedMs: number; p50Ms: number; p95Ms: number; p99Ms: number } {
	const sorted = [...phase.latencies].sort((a, b) => a - b);
	const at = (q: number): number => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
	return { ops: phase.ops, elapsedMs: phase.elapsedMs, p50Ms: at(0.5), p95Ms: at(0.95), p99Ms: at(0.99) };
}

// EN: Runs fn for every id and records how long each call took.
// PT: Roda fn para cada id e registra quanto tempo cada chamada levou.
async function timed(ids: number[], fn: (i: number) => Promise<void>): Promise<Phase> {
	const latencies: number[] = [];
	const start = performance.now();
	for (const i of ids) {
		const before = performance.now();
		await fn(i);
		latencies.push(performance.now() - before);
	}
	return { ops: ids.length, elapsedMs: performance.now() - start, latencies };
}

function sequence(from: number, to: number, step: number): number[] {
	const ids: number[] = [];
	for (let i = from; i <= to; i += step) {
		ids.push(i);
	}
	return ids;
}

const n = Number(process.argv[2] ?? 1000);
const workers = Number(process.argv[3] ?? 8);
const options = {
	hostname: process.env.PGHOST ?? "localhost",
	port: Number(process.env.PGPORT ?? 5432),
	username: process.env.PGUSER ?? "bench",
	password: process.env.PGPASSWORD ?? "bench",
	database: process.env.PGDATABASE ?? "bench",
};

let checksum = 0;
const sql = new SQL({ ...options, max: 1 });
await sql`DROP TABLE IF EXISTS items_ts`;
await sql`CREATE TABLE items_ts (id integer PRIMARY KEY, name text NOT NULL, category integer NOT NULL, price integer NOT NULL)`;

const all = sequence(1, n, 1);
const insert = await timed(all, async (i) => {
	await sql`INSERT INTO items_ts (id, name, category, price) VALUES (${i}, ${`item-${i}`}, ${i % CATEGORIES}, ${(i * 37) % 1000})`;
});

const read = await timed(all, async (i) => {
	const rows = await sql`SELECT name, price FROM items_ts WHERE id = ${i}`;
	checksum += Number(rows[0].price);
});

const query = await timed(sequence(0, QUERY_OPS - 1, 1), async (i) => {
	const rows =
		await sql`SELECT count(*) AS count, coalesce(sum(price), 0) AS sum FROM items_ts WHERE category = ${i % CATEGORIES}`;
	checksum += Number(rows[0].count) + Number(rows[0].sum);
});

// EN: A pool keeps connections open and lends one to each query. Here `max` is the pool size.
// PT: Um pool mantém conexões abertas e empresta uma a cada consulta. Aqui `max` é o tamanho do pool.
const pool = new SQL({ ...options, max: workers });
await Promise.all(sequence(1, workers, 1).map(() => pool`SELECT 1`));
const poolStart = performance.now();
const parts = await Promise.all(
	sequence(0, workers - 1, 1).map((w) =>
		timed(sequence(w + 1, n, workers), async (i) => {
			const rows = await pool`SELECT name, price FROM items_ts WHERE id = ${i}`;
			checksum += Number(rows[0].price);
		}),
	),
);
const pooled: Phase = {
	ops: parts.reduce((sum, part) => sum + part.ops, 0),
	elapsedMs: performance.now() - poolStart,
	latencies: parts.flatMap((part) => part.latencies),
};

await sql`DROP TABLE items_ts`;
await pool.close();
await sql.close();

// EN: CPU time and peak memory of this client process, as counted by the kernel.
// PT: Tempo de CPU e pico de memória deste processo cliente, contados pelo kernel.
const usage = process.cpuUsage();
const peak = /VmHWM:\s+(\d+)/.exec(readFileSync("/proc/self/status", "utf8"));
console.log(
	JSON.stringify({
		language: "ts",
		driver: "Bun.sql",
		n,
		concurrency: workers,
		checksum: String(checksum),
		cpuMs: (usage.user + usage.system) / 1000,
		memoryKb: Number(peak?.[1] ?? 0),
		phases: { insert: summary(insert), read: summary(read), query: summary(query), pool: summary(pooled) },
	}),
);
