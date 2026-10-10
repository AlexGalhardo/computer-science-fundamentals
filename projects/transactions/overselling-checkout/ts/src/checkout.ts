// EN: Four ways of buying one unit. The first is the bug, the other three are fixes. All four do
//     the same business steps (read the stock, check it, think, write it, insert the order) and
//     differ only in how they protect the gap between the read and the write.
// PT: Quatro jeitos de comprar uma unidade. O primeiro é o bug, os outros três são correções. Os
//     quatro fazem os mesmos passos de negócio (ler o estoque, conferir, pensar, gravar, inserir
//     o pedido) e diferem só em como protegem o intervalo entre a leitura e a escrita.
// ES: Cuatro formas de comprar una unidad. La primera es el bug, las otras tres son correcciones. Las
//     cuatro hacen los mismos pasos de negocio (leer el stock, verificar, pensar, escribir, insertar
//     el pedido) y difieren solo en cómo protegen el intervalo entre la lectura y la escritura.

import type { Pool, PoolClient } from "pg";

export const STRATEGIES = ["naive", "optimistic", "pessimistic", "serializable"] as const;
export type Strategy = (typeof STRATEGIES)[number];

export type CheckoutResult =
	| { status: "sold"; attempts: number }
	| { status: "sold_out"; attempts: number }
	/** The fix gave up after too many conflicts. The buyer may try again. */
	| { status: "conflict"; attempts: number };

export interface CheckoutOptions {
	productId: number;
	buyerId: string;
	thinkTimeMs: number;
	maxAttempts: number;
}

type Attempt = "sold" | "sold_out" | "retry";

const SERIALIZATION_FAILURE = "40001";
const DEADLOCK_DETECTED = "40P01";

function sqlState(error: unknown): string | undefined {
	if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
		return error.code;
	}
	return undefined;
}

async function insertOrder(client: PoolClient, options: CheckoutOptions, strategy: Strategy): Promise<void> {
	await client.query("INSERT INTO orders (product_id, buyer_id, strategy) VALUES ($1, $2, $3)", [
		options.productId,
		options.buyerId,
		strategy,
	]);
}

// EN: Every strategy runs inside a transaction, including the naive one. This is the point of
//     the lab: BEGIN and COMMIT give atomicity, not isolation from other buyers. If anything
//     throws, the transaction is rolled back and the connection goes back to the pool.
// PT: Toda estratégia roda dentro de uma transação, inclusive a ingênua. Este é o ponto do
//     laboratório: BEGIN e COMMIT dão atomicidade, não isolamento dos outros compradores. Se algo
//     lançar erro, a transação é desfeita e a conexão volta para o pool.
// ES: Toda estrategia corre dentro de una transacción, incluida la ingenua. Este es el punto del
//     laboratorio: BEGIN y COMMIT dan atomicidad, no aislamiento de los otros compradores. Si algo
//     lanza un error, la transacción se deshace y la conexión vuelve al pool.
async function inTransaction<T>(pool: Pool, begin: string, work: (client: PoolClient) => Promise<T>): Promise<T> {
	const client = await pool.connect();
	try {
		await client.query(begin);
		const result = await work(client);
		await client.query("COMMIT");
		return result;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

// EN: NAIVE (the bug). Read, check, write. Under READ COMMITTED, twenty buyers can read
//     "stock = 10" at the same moment, each one decides there is stock, and each one writes 9
//     and inserts an order. The stock looks right and the orders table has too many rows.
// PT: INGÊNUA (o bug). Ler, conferir, gravar. Em READ COMMITTED, vinte compradores podem ler
//     "stock = 10" no mesmo instante, cada um decide que há estoque, e cada um grava 9 e insere
//     um pedido. O estoque parece certo e a tabela de pedidos tem linhas demais.
// ES: INGENUA (el bug). Leer, verificar, escribir. En READ COMMITTED, veinte compradores pueden leer
//     "stock = 10" en el mismo instante, cada uno decide que hay stock, y cada uno escribe 9 e inserta
//     un pedido. El stock parece correcto y la tabla de pedidos tiene demasiadas filas.
async function naive(pool: Pool, options: CheckoutOptions): Promise<Attempt> {
	return inTransaction(pool, "BEGIN", async (client) => {
		const read = await client.query<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [
			options.productId,
		]);
		const stock = read.rows[0]?.stock ?? 0;
		if (stock <= 0) {
			return "sold_out";
		}
		await Bun.sleep(options.thinkTimeMs);
		await client.query("UPDATE products SET stock = $1 WHERE id = $2", [stock - 1, options.productId]);
		await insertOrder(client, options, "naive");
		return "sold";
	});
}

// EN: OPTIMISTIC. Nobody is blocked while thinking. The read also fetches a version number, and
//     the write succeeds only "if the version is still the one I read". When another buyer got
//     there first, the UPDATE matches zero rows: nothing was written, and the buyer starts again
//     from a fresh read. Conflicts are detected at the end instead of prevented at the start.
// PT: OTIMISTA. Ninguém fica bloqueado enquanto pensa. A leitura também traz um número de versão,
//     e a escrita só vale "se a versão ainda for a que eu li". Quando outro comprador chegou
//     antes, o UPDATE casa com zero linhas: nada foi gravado, e o comprador recomeça de uma
//     leitura nova. Os conflitos são detectados no fim em vez de evitados no começo.
// ES: OPTIMISTA. Nadie queda bloqueado mientras piensa. La lectura también trae un número de versión,
//     y la escritura solo vale "si la versión sigue siendo la que leí". Cuando otro comprador llegó
//     antes, el UPDATE coincide con cero filas: no se escribió nada, y el comprador recomienza desde
//     una lectura nueva. Los conflictos se detectan al final en lugar de evitarse al comienzo.
async function optimistic(pool: Pool, options: CheckoutOptions): Promise<Attempt> {
	return inTransaction(pool, "BEGIN", async (client) => {
		const read = await client.query<{ stock: number; version: number }>(
			"SELECT stock, version FROM products WHERE id = $1",
			[options.productId],
		);
		const row = read.rows[0];
		if (row === undefined || row.stock <= 0) {
			return "sold_out";
		}
		await Bun.sleep(options.thinkTimeMs);
		const write = await client.query(
			"UPDATE products SET stock = $1, version = version + 1 WHERE id = $2 AND version = $3",
			[row.stock - 1, options.productId, row.version],
		);
		if (write.rowCount === 0) {
			return "retry";
		}
		await insertOrder(client, options, "optimistic");
		return "sold";
	});
}

// EN: PESSIMISTIC. `SELECT ... FOR UPDATE` locks the row at the read. The next buyer waits in
//     line at its own SELECT until this transaction ends, and then reads the new stock. The gap
//     between read and write is closed, at the price of making every buyer wait for the others.
// PT: PESSIMISTA. `SELECT ... FOR UPDATE` bloqueia a linha já na leitura. O próximo comprador
//     espera na fila no seu próprio SELECT até esta transação terminar, e então lê o estoque
//     novo. O intervalo entre leitura e escrita fica fechado, ao preço de cada comprador esperar
//     pelos outros.
// ES: PESIMISTA. `SELECT ... FOR UPDATE` bloquea la fila ya en la lectura. El siguiente comprador
//     espera en la fila en su propio SELECT hasta que esta transacción termine, y entonces lee el stock
//     nuevo. El intervalo entre lectura y escritura queda cerrado, al precio de que cada comprador espere
//     a los demás.
async function pessimistic(pool: Pool, options: CheckoutOptions): Promise<Attempt> {
	return inTransaction(pool, "BEGIN", async (client) => {
		const read = await client.query<{ stock: number }>("SELECT stock FROM products WHERE id = $1 FOR UPDATE", [
			options.productId,
		]);
		const stock = read.rows[0]?.stock ?? 0;
		if (stock <= 0) {
			return "sold_out";
		}
		await Bun.sleep(options.thinkTimeMs);
		await client.query("UPDATE products SET stock = $1 WHERE id = $2", [stock - 1, options.productId]);
		await insertOrder(client, options, "pessimistic");
		return "sold";
	});
}

// EN: SERIALIZABLE. The code is the naive code. Only the BEGIN changes. PostgreSQL lets the
//     transactions run and aborts with SQLSTATE 40001 any one whose result could not have come
//     from running them one at a time. The catch is the contract: the caller MUST retry.
// PT: SERIALIZABLE. O código é o código ingênuo. Só o BEGIN muda. O PostgreSQL deixa as transações
//     rodarem e aborta com SQLSTATE 40001 aquela cujo resultado não poderia ter saído de
//     executá-las uma de cada vez. O porém é o contrato: quem chama PRECISA tentar de novo.
// ES: SERIALIZABLE. El código es el código ingenuo. Solo cambia el BEGIN. PostgreSQL deja que las
//     transacciones corran y aborta con SQLSTATE 40001 aquella cuyo resultado no podría haber salido de
//     ejecutarlas una por una. El inconveniente es el contrato: quien llama DEBE reintentar.
async function serializable(pool: Pool, options: CheckoutOptions): Promise<Attempt> {
	try {
		return await inTransaction(pool, "BEGIN ISOLATION LEVEL SERIALIZABLE", async (client) => {
			const read = await client.query<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [
				options.productId,
			]);
			const stock = read.rows[0]?.stock ?? 0;
			if (stock <= 0) {
				return "sold_out";
			}
			await Bun.sleep(options.thinkTimeMs);
			await client.query("UPDATE products SET stock = $1 WHERE id = $2", [stock - 1, options.productId]);
			await insertOrder(client, options, "serializable");
			return "sold";
		});
	} catch (error) {
		const code = sqlState(error);
		if (code === SERIALIZATION_FAILURE || code === DEADLOCK_DETECTED) {
			return "retry";
		}
		throw error;
	}
}

const ATTEMPTS: Record<Strategy, (pool: Pool, options: CheckoutOptions) => Promise<Attempt>> = {
	naive,
	optimistic,
	pessimistic,
	serializable,
};

// EN: The retry loop shared by the strategies that can lose a conflict. The random pause
//     (jitter) keeps the losers from all coming back at the same instant and colliding again.
//     After `maxAttempts` the buyer gets an honest "conflict" instead of waiting forever.
// PT: O laço de novas tentativas, comum às estratégias que podem perder um conflito. A pausa
//     aleatória (jitter) evita que os perdedores voltem todos no mesmo instante e colidam de
//     novo. Depois de `maxAttempts` o comprador recebe um "conflict" honesto em vez de esperar
//     para sempre.
// ES: El bucle de reintentos, común a las estrategias que pueden perder un conflicto. La pausa
//     aleatoria (jitter) evita que los perdedores vuelvan todos en el mismo instante y choquen de
//     nuevo. Después de `maxAttempts` el comprador recibe un "conflict" honesto en lugar de esperar
//     para siempre.
export async function checkout(pool: Pool, strategy: Strategy, options: CheckoutOptions): Promise<CheckoutResult> {
	for (let attempts = 1; attempts <= options.maxAttempts; attempts += 1) {
		const outcome = await ATTEMPTS[strategy](pool, options);
		if (outcome !== "retry") {
			return { status: outcome, attempts };
		}
		await Bun.sleep(Math.random() * 5 * Math.min(attempts, 4));
	}
	return { status: "conflict", attempts: options.maxAttempts };
}
