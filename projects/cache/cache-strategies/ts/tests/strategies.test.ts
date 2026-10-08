// EN: One consistency test per strategy, and each test is named after the guarantee it proves
//     (or the guarantee the strategy does NOT give). They run against a real Redis and a real
//     PostgreSQL, the same containers the API uses.
// PT: Um teste de consistência por estratégia, e cada teste leva o nome da garantia que ele
//     prova (ou da garantia que a estratégia NÃO dá). Eles rodam contra um Redis e um PostgreSQL
//     de verdade, os mesmos contêineres que a API usa.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createApp, createLab, type Lab, resetLab } from "../src/app";
import { Cache } from "../src/cache";
import { loadConfig } from "../src/config";
import { Database } from "../src/db";
import { productKey } from "../src/strategies";

const config = loadConfig();
const TTL_MS = 400;
let lab: Lab;

beforeAll(async () => {
	const db = Database.connect(config.DATABASE_URL, config.POOL_SIZE);
	await db.migrate();
	lab = createLab(db, await Cache.connect(config.REDIS_URL));
});

beforeEach(async () => {
	lab.store.hooks = {};
	await resetLab(lab, { products: 10, ttlMs: TTL_MS });
});

afterAll(async () => {
	lab.cache.close();
	await lab.db.close();
});

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function priceInDatabase(id: number): Promise<number | undefined> {
	return (await lab.db.readProduct(id))?.price;
}

async function priceInCache(id: number): Promise<number | undefined> {
	const raw = await lab.cache.get(productKey(id));
	return raw === null ? undefined : (JSON.parse(raw) as { price: number }).price;
}

describe("cache-aside", () => {
	test("a read fills the cache, and the next read does not touch the database", async () => {
		const first = await lab.store.read("cache-aside", 1);
		const second = await lab.store.read("cache-aside", 1);
		expect(first?.source).toBe("database");
		expect(second?.source).toBe("cache");
		expect(lab.db.counters.reads).toBe(1);
		expect(lab.store.counters).toMatchObject({ hits: 1, misses: 1 });
	});

	test("guarantee: after a write returns, the cached copy is gone and the next read is fresh", async () => {
		await lab.store.read("cache-aside", 1);
		await lab.store.write("cache-aside", 1, 5000);
		expect(await priceInCache(1)).toBeUndefined();
		const read = await lab.store.read("cache-aside", 1);
		expect(read).toMatchObject({ source: "database", product: { price: 5000 } });
	});

	// EN: The race this strategy does NOT prevent, replayed step by step:
	//       reader: miss, reads the database (old price) ... and stops before storing it
	//       writer: updates the database, deletes the key (there is nothing to delete yet)
	//       reader: stores the OLD price
	//     Nothing will correct the cached copy except its time to live. That is why every
	//     cache-aside entry needs one.
	// PT: A corrida que esta estratégia NÃO impede, repetida passo a passo:
	//       leitor: falha, lê o banco (preço antigo) ... e para antes de gravar
	//       escritor: atualiza o banco, apaga a chave (ainda não há nada para apagar)
	//       leitor: grava o preço ANTIGO
	//     Nada vai corrigir a cópia no cache a não ser o tempo de vida. É por isso que toda
	//     entrada de cache-aside precisa de um.
	test("limit: a read racing a write can cache the old value, and only the time to live removes it", async () => {
		let release: () => void = () => {};
		const paused = new Promise<void>((resolve) => {
			release = resolve;
		});
		let reachedPause: () => void = () => {};
		const readerIsPaused = new Promise<void>((resolve) => {
			reachedPause = resolve;
		});
		lab.store.hooks.beforeCacheFill = async () => {
			reachedPause();
			await paused;
		};

		const oldPrice = await priceInDatabase(1);
		const slowRead = lab.store.read("cache-aside", 1);
		await readerIsPaused;
		lab.store.hooks = {};
		await lab.store.write("cache-aside", 1, 7777);
		release();
		await slowRead;

		expect(await priceInDatabase(1)).toBe(7777);
		expect(await priceInCache(1)).toBe(oldPrice);
		expect((await lab.store.read("cache-aside", 1))?.product.price).toBe(oldPrice);

		await sleep(TTL_MS + 100);
		expect((await lab.store.read("cache-aside", 1))?.product.price).toBe(7777);
	});
});

describe("write-through", () => {
	test("guarantee: when a write returns, database and cache both hold the new value", async () => {
		await lab.store.write("write-through", 2, 4200);
		expect(await priceInDatabase(2)).toBe(4200);
		expect(await priceInCache(2)).toBe(4200);
	});

	test("guarantee: the read after a write is a hit and costs no database query", async () => {
		await lab.store.write("write-through", 2, 4200);
		lab.db.resetCounters();
		const read = await lab.store.read("write-through", 2);
		expect(read).toMatchObject({ source: "cache", product: { price: 4200 } });
		expect(lab.db.counters.reads).toBe(0);
	});

	test("the database goes first: a write it rejects never reaches the cache", async () => {
		// EN: 2^31 does not fit the integer column, so PostgreSQL refuses the statement.
		// PT: 2^31 não cabe na coluna integer, então o PostgreSQL recusa o comando.
		await lab.store.read("write-through", 2);
		const before = await priceInCache(2);
		await expect(lab.store.write("write-through", 2, 2 ** 31)).rejects.toThrow();
		expect(await priceInCache(2)).toBe(before);
		expect(await priceInDatabase(2)).toBe(before);
	});

	test("the cached copy still has a time to live", async () => {
		await lab.store.write("write-through", 2, 4200);
		const ttl = await lab.cache.pttl(productKey(2));
		expect(ttl).toBeGreaterThan(0);
		expect(ttl).toBeLessThanOrEqual(TTL_MS);
	});
});

describe("write-behind", () => {
	test("guarantee: readers of the cache see the write at once, the database only after the flush", async () => {
		const before = await priceInDatabase(3);
		await lab.store.write("write-behind", 3, 9100);
		expect((await lab.store.read("write-behind", 3))?.product.price).toBe(9100);
		expect(await priceInDatabase(3)).toBe(before);

		expect(await lab.store.flush()).toBe(1);
		expect(await priceInDatabase(3)).toBe(9100);
	});

	test("guarantee: many writes to one product inside an interval become one database write", async () => {
		lab.db.resetCounters();
		for (const price of [100, 200, 300, 400, 500]) {
			await lab.store.write("write-behind", 3, price);
		}
		await lab.store.write("write-behind", 4, 600);
		expect(lab.db.counters.writes).toBe(0);

		expect(await lab.store.flush()).toBe(2);
		expect(lab.db.counters).toMatchObject({ writes: 1, rowsWritten: 2 });
		expect(await priceInDatabase(3)).toBe(500);
		expect(await priceInDatabase(4)).toBe(600);
		expect(await lab.store.flush()).toBe(0);
	});

	test("a pending write survives the expiry of its cached copy", async () => {
		await lab.store.write("write-behind", 3, 9100);
		await sleep(TTL_MS + 100);
		expect(await priceInCache(3)).toBeUndefined();
		expect(await lab.store.read("write-behind", 3)).toMatchObject({ source: "pending", product: { price: 9100 } });
	});

	// EN: The price of answering before the database knows: if Redis loses its memory between
	//     the acknowledgement and the flush, the client was told "saved" and the data is gone.
	// PT: O preço de responder antes de o banco saber: se o Redis perder a memória entre a
	//     confirmação e a descarga, o cliente ouviu "salvo" e o dado sumiu.
	test("limit: an acknowledged write is lost when the cache dies before the flush", async () => {
		const before = await priceInDatabase(3);
		const acknowledged = await lab.store.write("write-behind", 3, 9100);
		expect(acknowledged?.price).toBe(9100);

		await lab.cache.flushAll();
		expect(await lab.store.flush()).toBe(0);
		expect(await priceInDatabase(3)).toBe(before);
		expect((await lab.store.read("write-behind", 3))?.product.price).toBe(before);
	});
});

describe("HTTP API", () => {
	function call(method: string, path: string, body?: unknown): Promise<Response> {
		return createApp(lab).handle(
			new Request(`http://localhost${path}`, {
				method,
				headers: { "Content-Type": "application/json" },
				body: body === undefined ? undefined : JSON.stringify(body),
			}),
		);
	}

	test("X-Cache says miss, then hit", async () => {
		const first = await call("GET", "/products/cache-aside/5");
		const second = await call("GET", "/products/cache-aside/5");
		expect(first.headers.get("x-cache")).toBe("miss");
		expect(second.headers.get("x-cache")).toBe("hit");
	});

	test("invalid input is refused before it reaches the stores", async () => {
		expect((await call("GET", "/products/no-such-strategy/1")).status).toBe(422);
		expect((await call("GET", "/products/cache-aside/abc")).status).toBe(422);
		expect((await call("PUT", "/products/cache-aside/1", { price: "free" })).status).toBe(422);
		expect((await call("POST", "/admin/reset", { ttlMs: -1 })).status).toBe(422);
		expect(lab.db.counters.reads + lab.db.counters.writes).toBe(0);
	});

	test("an unknown product is 404 and is not cached", async () => {
		expect((await call("GET", "/products/cache-aside/999")).status).toBe(404);
		expect(await lab.cache.get(productKey(999))).toBeNull();
	});
});
