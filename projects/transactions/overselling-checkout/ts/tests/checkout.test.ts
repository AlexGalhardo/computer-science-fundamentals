import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import { createApp } from "../src/app";
import { STRATEGIES, type Strategy } from "../src/checkout";
import { loadConfig } from "../src/config";
import { createPool, migrate, PRODUCT_ID, reset, stats } from "../src/db";

const BUYERS = 200;
const STOCK = 10;

const config = loadConfig();
let pool: Pool;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
	pool = createPool(config.DATABASE_URL, config.POOL_SIZE);
	await migrate(pool);
	app = createApp({ pool, thinkTimeMs: config.THINK_TIME_MS, maxAttempts: config.MAX_ATTEMPTS });
});

afterAll(async () => {
	await pool.end();
});

function post(path: string, body: unknown): Promise<Response> {
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

// EN: 200 requests are started before any of them is awaited, so they all compete for the
//     same 10 units, exactly like the k6 load test does over HTTP.
// PT: 200 requisições são iniciadas antes de qualquer uma ser aguardada, então todas disputam as
//     mesmas 10 unidades, exatamente como o teste de carga do k6 faz por HTTP.
// ES: 200 peticiones se inician antes de esperar ninguna, así que todas se disputan las
//     mismas 10 unidades, exactamente como lo hace la prueba de carga de k6 por HTTP.
async function rush(strategy: Strategy): Promise<Record<number, number>> {
	await reset(pool, STOCK);
	const responses = await Promise.all(
		Array.from({ length: BUYERS }, (_, index) => post(`/checkout/${strategy}`, { buyerId: `fake-buyer-${index}` })),
	);
	const byStatus: Record<number, number> = {};
	for (const response of responses) {
		byStatus[response.status] = (byStatus[response.status] ?? 0) + 1;
	}
	return byStatus;
}

describe("200 concurrent buyers, 10 units", () => {
	test("naive checkout sells more than 10", async () => {
		const byStatus = await rush("naive");
		const after = await stats(pool);
		expect(after.orders).toBeGreaterThan(STOCK);
		expect(byStatus[201]).toBe(after.orders);
		// EN: The stock never goes negative, which is why this bug hides from a quick look.
		// PT: O estoque nunca fica negativo, e é por isso que este bug se esconde de uma olhada rápida.
		// ES: El stock nunca queda negativo, y por eso este bug se esconde de una mirada rápida.
		expect(after.stock).toBeGreaterThanOrEqual(0);
	}, 30_000);

	for (const strategy of STRATEGIES.filter((item) => item !== "naive")) {
		test(`${strategy} checkout sells exactly 10`, async () => {
			const byStatus = await rush(strategy);
			expect(await stats(pool)).toEqual({ stock: 0, orders: STOCK });
			expect(byStatus[201]).toBe(STOCK);
			expect((byStatus[409] ?? 0) + (byStatus[503] ?? 0)).toBe(BUYERS - STOCK);
			expect(Object.keys(byStatus).every((status) => ["201", "409", "503"].includes(status))).toBe(true);
		}, 30_000);
	}
});

describe("what a row lock blocks", () => {
	test("SELECT FOR UPDATE blocks another FOR UPDATE, but not a plain SELECT", async () => {
		await reset(pool, STOCK);
		const holder = await pool.connect();
		const other = await pool.connect();
		try {
			await holder.query("BEGIN");
			await holder.query("SELECT stock FROM products WHERE id = $1 FOR UPDATE", [PRODUCT_ID]);
			// EN: Readers do not take row locks in PostgreSQL (MVCC), so this returns at once. This
			//     is why locking only the write path does not fix a naive read.
			// PT: Leitores não pegam bloqueio de linha no PostgreSQL (MVCC), então isto volta na hora.
			//     É por isso que bloquear só o caminho de escrita não corrige uma leitura ingênua.
			// ES: Los lectores no toman bloqueo de fila en PostgreSQL (MVCC), así que esto vuelve al instante.
			//     Por eso bloquear solo el camino de escritura no corrige una lectura ingenua.
			const plain = await other.query<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [
				PRODUCT_ID,
			]);
			expect(plain.rows[0]?.stock).toBe(STOCK);
			// EN: NOWAIT turns "wait for the lock" into an immediate error, SQLSTATE 55P03.
			// PT: NOWAIT troca "esperar o bloqueio" por um erro imediato, SQLSTATE 55P03.
			// ES: NOWAIT cambia "esperar el bloqueo" por un error inmediato, SQLSTATE 55P03.
			await expect(
				other.query("SELECT stock FROM products WHERE id = $1 FOR UPDATE NOWAIT", [PRODUCT_ID]),
			).rejects.toMatchObject({ code: "55P03" });
		} finally {
			await holder.query("ROLLBACK");
			holder.release();
			other.release();
		}
	});
});

describe("input validation", () => {
	test("an unknown strategy is rejected before any transaction starts", async () => {
		await reset(pool, STOCK);
		const response = await post("/checkout/hopeful", { buyerId: "fake-buyer-1" });
		expect(response.status).toBe(422);
		expect(await stats(pool)).toEqual({ stock: STOCK, orders: 0 });
	});

	test("a body without buyerId is rejected", async () => {
		const response = await post("/checkout/pessimistic", {});
		expect(response.status).toBe(422);
	});

	test("reset refuses a negative stock", async () => {
		const response = await post("/admin/reset", { stock: -1 });
		expect(response.status).toBe(422);
	});

	test("a sale answers 201 and a sold-out product answers 409", async () => {
		await reset(pool, 1);
		const first = await post("/checkout/pessimistic", { buyerId: "fake-buyer-1" });
		const second = await post("/checkout/pessimistic", { buyerId: "fake-buyer-2" });
		expect(first.status).toBe(201);
		expect(await first.json()).toEqual({ status: "sold", attempts: 1 });
		expect(second.status).toBe(409);
	});
});
