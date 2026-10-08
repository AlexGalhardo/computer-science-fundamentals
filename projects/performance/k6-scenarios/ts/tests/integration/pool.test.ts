// EN: Tests against a real PostgreSQL (the `db` service of docker-compose). They show the
//     bottleneck in miniature, without k6: the same requests, the same query time, and only the
//     pool size changes how long the batch takes.
// PT: Testes contra um PostgreSQL de verdade (o serviço `db` do docker-compose). Eles mostram o
//     gargalo em miniatura, sem k6: as mesmas requisições, o mesmo tempo de consulta, e só o
//     tamanho do pool muda quanto o lote demora.

import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Pool } from "pg";
import { z } from "zod";
import { createApp } from "../../src/app";
import { loadConfig } from "../../src/config";
import { createPool, findProduct, migrate, PoolTimeoutError, PRODUCT_COUNT } from "../../src/db";

const config = loadConfig();
const pools: Pool[] = [];

function pool(size: number, waitMs = 5_000): Pool {
	const created = createPool({ databaseUrl: config.DATABASE_URL, size, waitMs });
	pools.push(created);
	return created;
}

async function elapsed(work: () => Promise<unknown>): Promise<number> {
	const started = performance.now();
	await work();
	return performance.now() - started;
}

beforeAll(async () => {
	const admin = pool(1);
	await migrate(admin);
	// Running it twice must be harmless.
	await migrate(admin);
});

afterAll(async () => {
	await Promise.all(pools.map((item) => item.end()));
});

test("findProduct reads a seeded product and returns undefined for an unknown id", async () => {
	const shared = pool(2);
	expect(await findProduct(shared, 7, 0, 1_000)).toEqual({ id: 7, name: "Fake product 7", priceCents: 700 });
	expect(await findProduct(shared, PRODUCT_COUNT + 1, 0, 1_000)).toBeUndefined();
});

// EN: Six requests of 100 ms each. With one connection they run one after the other (about
//     600 ms). With six connections they run side by side (about 100 ms). The query did not get
//     faster: the waiting for a connection disappeared.
// PT: Seis requisições de 100 ms cada. Com uma conexão elas rodam uma depois da outra (cerca de
//     600 ms). Com seis conexões rodam lado a lado (cerca de 100 ms). A consulta não ficou mais
//     rápida: a espera por uma conexão desapareceu.
test("a small pool makes concurrent requests wait in line", async () => {
	const batch = (shared: Pool): Promise<unknown> =>
		Promise.all(Array.from({ length: 6 }, (_, index) => findProduct(shared, index + 1, 100, 5_000)));
	const small = pool(1);
	const large = pool(6);
	// Open the connections first, so the cost of connecting is not part of the comparison.
	await batch(large);
	await findProduct(small, 1, 0, 5_000);

	const smallMs = await elapsed(() => batch(small));
	const largeMs = await elapsed(() => batch(large));
	expect(smallMs).toBeGreaterThanOrEqual(580);
	expect(largeMs).toBeLessThan(400);
	expect(smallMs).toBeGreaterThan(2 * largeMs);
});

test("a request that waits longer than the limit fails with PoolTimeoutError", async () => {
	const tiny = pool(1, 100);
	const slow = findProduct(tiny, 1, 500, 100);
	// The second request finds the only connection busy for 500 ms and may wait 100 ms.
	await expect(findProduct(tiny, 2, 0, 100)).rejects.toBeInstanceOf(PoolTimeoutError);
	expect(await slow).toMatchObject({ id: 1 });
});

test("the API answers 200, 404, 422 and sheds load with 503", async () => {
	const shared = pool(1, 100);
	const app = createApp({ pool: shared, poolSize: 1, queryMs: 300, poolWaitMs: 100 });
	const get = (path: string): Promise<Response> => app.handle(new Request(`http://localhost${path}`));

	expect((await get("/health")).status).toBe(200);
	expect((await get("/products/abc")).status).toBe(422);
	expect((await get("/products/0")).status).toBe(422);

	// Two requests at once on a pool of one: the first holds the connection for 300 ms, and the
	// second gives up after 100 ms.
	const [first, second] = await Promise.all([get("/products/3"), get("/products/4")]);
	expect([first.status, second.status].sort()).toEqual([200, 503]);

	expect((await get(`/products/${PRODUCT_COUNT + 1}`)).status).toBe(404);

	const stats = z
		.object({
			poolSize: z.number(),
			queryMs: z.number(),
			poolWaitMs: z.number(),
			open: z.number(),
			idle: z.number(),
			waiting: z.number(),
			shed: z.number(),
		})
		.parse(await (await get("/stats")).json());
	expect(stats).toMatchObject({ poolSize: 1, queryMs: 300, poolWaitMs: 100, waiting: 0, shed: 1 });
});
