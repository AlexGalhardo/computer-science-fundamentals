// EN: The database side of the API: a small catalogue of fake products and one query per request.
//     Everything interesting here is about the CONNECTION POOL. Opening a PostgreSQL connection is
//     expensive (a TCP handshake, authentication and a new server process), so an application
//     keeps a few open and lends them out. A request borrows one, runs its query and gives it back.
//     When every connection is lent out, the next request does not fail: it waits in a queue
//     inside the pool. That wait is invisible to the database (each query is as fast as ever) and
//     to the CPU (it is idle), and it is exactly what a load test makes visible.
// PT: O lado de banco de dados da API: um pequeno catálogo de produtos falsos e uma consulta por
//     requisição. Tudo de interessante aqui é sobre o POOL DE CONEXÕES. Abrir uma conexão com o
//     PostgreSQL é caro (handshake TCP, autenticação e um novo processo no servidor), então a
//     aplicação mantém algumas abertas e as empresta. Uma requisição pega uma, roda a consulta e
//     devolve. Quando todas estão emprestadas, a próxima requisição não falha: ela espera em uma
//     fila dentro do pool. Essa espera é invisível para o banco (cada consulta continua rápida) e
//     para a CPU (ela está ociosa), e é exatamente o que um teste de carga torna visível.

import { Pool, type PoolClient } from "pg";

export const PRODUCT_COUNT = 100;

export interface Product {
	id: number;
	name: string;
	priceCents: number;
}

export interface PoolOptions {
	databaseUrl: string;
	size: number;
	/** Longest time a request may wait for a free connection, in milliseconds. */
	waitMs: number;
}

/** Thrown when no connection became free within the waiting limit. */
export class PoolTimeoutError extends Error {
	constructor(waitMs: number) {
		super(`no database connection became free within ${waitMs} ms`);
		this.name = "PoolTimeoutError";
	}
}

export function createPool(options: PoolOptions): Pool {
	return new Pool({
		connectionString: options.databaseUrl,
		max: options.size,
		// EN: Without a limit a request would wait forever and the queue would grow without bound.
		//     Giving up after a while and answering 503 is called load shedding: a fast, honest
		//     "not now" is better than an answer that arrives after the client has gone away.
		// PT: Sem um limite, uma requisição esperaria para sempre e a fila cresceria sem parar.
		//     Desistir depois de um tempo e responder 503 se chama load shedding: um "agora não"
		//     rápido e honesto é melhor que uma resposta que chega depois que o cliente já foi embora.
		connectionTimeoutMillis: options.waitMs,
	});
}

export async function migrate(pool: Pool): Promise<void> {
	await pool.query(
		`CREATE TABLE IF NOT EXISTS products (
			id integer PRIMARY KEY,
			name text NOT NULL,
			price_cents integer NOT NULL
		)`,
	);
	await pool.query(
		`INSERT INTO products (id, name, price_cents)
		 SELECT n, 'Fake product ' || n, 100 * n FROM generate_series(1, $1) AS n
		 ON CONFLICT (id) DO NOTHING`,
		[PRODUCT_COUNT],
	);
}

async function borrow(pool: Pool, waitMs: number): Promise<PoolClient> {
	try {
		return await pool.connect();
	} catch (error) {
		// EN: node-postgres reports the waiting limit with this message. Any other failure (the
		//     database is down, wrong password) is a different problem and is passed on untouched.
		// PT: O node-postgres informa o limite de espera com esta mensagem. Qualquer outra falha (o
		//     banco caiu, senha errada) é um problema diferente e segue adiante sem alteração.
		if (error instanceof Error && error.message.includes("timeout exceeded when trying to connect")) {
			throw new PoolTimeoutError(waitMs);
		}
		throw error;
	}
}

/**
 * Reads one product. The query holds its connection for about `queryMs`, because `pg_sleep` runs
 * inside the database: that stands for a query that really takes that long.
 */
export async function findProduct(
	pool: Pool,
	id: number,
	queryMs: number,
	waitMs: number,
): Promise<Product | undefined> {
	const client = await borrow(pool, waitMs);
	try {
		const result = await client.query<{ id: number; name: string; price_cents: number }>(
			"SELECT id, name, price_cents, pg_sleep($2::float8 / 1000) FROM products WHERE id = $1",
			[id, queryMs],
		);
		const row = result.rows[0];
		return row === undefined ? undefined : { id: row.id, name: row.name, priceCents: row.price_cents };
	} finally {
		// EN: Always give the connection back, even when the query throws. A connection that is
		//     never released is a leak: the pool shrinks by one for ever.
		// PT: Sempre devolva a conexão, mesmo quando a consulta lança erro. Uma conexão que nunca é
		//     devolvida é um vazamento: o pool encolhe em uma para sempre.
		client.release();
	}
}
