// EN: The stampede in-process: 200 reads of the hot key are started before any of them is
//     awaited, so they all find the cache in the same state, like the k6 users do over HTTP.
// PT: O estouro da manada dentro do processo: 200 leituras da chave quente são iniciadas antes
//     de qualquer uma ser aguardada, então todas encontram o cache no mesmo estado, como os
//     usuários do k6 fazem por HTTP.
// ES: El stampede dentro del proceso: 200 lecturas de la clave caliente se inician antes de que
//     se espere a alguna, así que todas encuentran el caché en el mismo estado, como lo hacen
//     los usuarios de k6 por HTTP.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createLab, type Lab, resetLab } from "../src/app";
import { Cache } from "../src/cache";
import { loadConfig } from "../src/config";
import { Database } from "../src/db";
import type { HotResult, Mode } from "../src/stampede";

const config = loadConfig();
const READERS = 200;
const SETTINGS = { ttlMs: 600, slowQueryMs: 60, earlyRefreshMs: 300 };
let lab: Lab;

beforeAll(async () => {
	const db = Database.connect(config.DATABASE_URL, config.POOL_SIZE);
	await db.migrate();
	lab = createLab(db, await Cache.connect(config.REDIS_URL));
});

afterAll(async () => {
	lab.cache.close();
	await lab.db.close();
});

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function herd(mode: Mode): Promise<HotResult[]> {
	return Promise.all(Array.from({ length: READERS }, () => lab.hot.read(mode)));
}

describe("cold cache, 200 simultaneous readers", () => {
	test("none: every reader queries the database", async () => {
		await resetLab(lab, SETTINGS);
		const results = await herd("none");
		expect(results.every((result) => result.source === "database")).toBe(true);
		expect(lab.hot.stats()).toEqual({ expiries: 1, queries: READERS, bursts: [READERS] });
	});

	test("lock: one reader queries the database and 199 wait for its copy", async () => {
		await resetLab(lab, SETTINGS);
		const results = await herd("lock");
		expect(results.filter((result) => result.source === "database")).toHaveLength(1);
		expect(new Set(results.map((result) => result.product.price)).size).toBe(1);
		expect(lab.hot.stats()).toEqual({ expiries: 1, queries: 1, bursts: [1] });
	});

	test("early: a cold cache falls back to the lock, still one query", async () => {
		await resetLab(lab, SETTINGS);
		await herd("early");
		expect(lab.hot.stats()).toEqual({ expiries: 1, queries: 1, bursts: [1] });
	});
});

describe("the key expires under load", () => {
	// EN: Readers arrive in waves of 50 every 20 ms for longer than two times to live, so the
	//     key expires (or comes up for refresh) at least twice while it is being read.
	// PT: Os leitores chegam em ondas de 50 a cada 20 ms por mais de dois tempos de vida, então
	//     a chave expira (ou entra em renovação) pelo menos duas vezes enquanto é lida.
	// ES: Los lectores llegan en oleadas de 50 cada 20 ms durante más de dos tiempos de vida, así
	//     que la clave expira (o entra en renovación) al menos dos veces mientras se la lee.
	async function waves(mode: Mode): Promise<HotResult[]> {
		const pending: Promise<HotResult>[] = [];
		const end = Date.now() + SETTINGS.ttlMs * 2.5;
		while (Date.now() < end) {
			for (let index = 0; index < 50; index++) {
				pending.push(lab.hot.read(mode));
			}
			await sleep(20);
		}
		return Promise.all(pending);
	}

	test("none: each expiry sends a herd to the database", async () => {
		await resetLab(lab, SETTINGS);
		await waves("none");
		const { expiries, bursts } = lab.hot.stats();
		expect(expiries).toBeGreaterThanOrEqual(2);
		expect(Math.min(...bursts)).toBeGreaterThan(50);
	});

	test("lock: exactly one query per expiry", async () => {
		await resetLab(lab, SETTINGS);
		await waves("lock");
		const { expiries, queries, bursts } = lab.hot.stats();
		expect(expiries).toBeGreaterThanOrEqual(2);
		expect(queries).toBe(expiries);
		expect(Math.max(...bursts)).toBe(1);
	});

	test("early: exactly one query per refresh, and after the cold start nobody waits", async () => {
		await resetLab(lab, SETTINGS);
		await lab.hot.read("early");
		const results = await waves("early");
		const { expiries, queries, bursts } = lab.hot.stats();
		expect(expiries).toBeGreaterThanOrEqual(3);
		expect(queries).toBe(expiries);
		expect(Math.max(...bursts)).toBe(1);
		expect(results.every((result) => result.source === "cache")).toBe(true);
		// EN: Let the last background refresh finish before the next test resets the lab.
		// PT: Deixa a última renovação em segundo plano terminar antes de o próximo teste reiniciar o laboratório.
		// ES: Deja que la última renovación en segundo plano termine antes de que la siguiente prueba reinicie el laboratorio.
		await sleep(SETTINGS.slowQueryMs + 100);
	});
});
