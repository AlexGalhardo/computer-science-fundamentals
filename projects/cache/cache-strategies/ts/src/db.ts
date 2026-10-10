// EN: PostgreSQL is the source of truth: a small `products` table. Every statement sent to it
//     is counted, because the whole lesson is measured in "how many times did we bother the
//     database".
// PT: O PostgreSQL é a fonte da verdade: uma tabela `products` pequena. Todo comando enviado a
//     ele é contado, porque a lição inteira é medida em "quantas vezes incomodamos o banco".
// ES: PostgreSQL es la fuente de la verdad: una tabla `products` pequeña. Cada sentencia que se
//     le envía se cuenta, porque toda la lección se mide en "cuántas veces molestamos a la base
//     de datos".

import { Pool } from "pg";
import { z } from "zod";

export const productSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	/** Price in cents, so there is no floating point money. */
	price: z.number().int(),
});

export type Product = z.infer<typeof productSchema>;

export interface DbCounters {
	/** `SELECT` statements executed. */
	reads: number;
	/** `UPDATE` statements executed. A write-behind batch is one statement. */
	writes: number;
	/** Rows changed by those statements. */
	rowsWritten: number;
}

const SCHEMA = `CREATE TABLE IF NOT EXISTS products (
	id integer PRIMARY KEY,
	name text NOT NULL,
	price integer NOT NULL
)`;

export class Database {
	readonly counters: DbCounters = { reads: 0, writes: 0, rowsWritten: 0 };

	constructor(private readonly pool: Pool) {}

	static connect(databaseUrl: string, poolSize: number): Database {
		return new Database(new Pool({ connectionString: databaseUrl, max: poolSize }));
	}

	async migrate(): Promise<void> {
		await this.pool.query(SCHEMA);
	}

	/** Empties the table and creates `count` products, ids 1 to `count`, with price 1000 + id. */
	async seed(count: number): Promise<void> {
		await this.pool.query("TRUNCATE products");
		await this.pool.query(
			`INSERT INTO products (id, name, price)
			 SELECT n, 'Fake product ' || n, 1000 + n FROM generate_series(1, $1::int) AS n`,
			[count],
		);
	}

	resetCounters(): void {
		this.counters.reads = 0;
		this.counters.writes = 0;
		this.counters.rowsWritten = 0;
	}

	// EN: `pg_sleep` makes the query as expensive as the experiment asks. A real expensive query
	//     would hold the connection in the same way: the pool has 20 connections, so 300
	//     simultaneous misses wait in line for them. That line is the stampede.
	// PT: O `pg_sleep` deixa a consulta tão cara quanto o experimento pedir. Uma consulta cara de
	//     verdade seguraria a conexão do mesmo jeito: o pool tem 20 conexões, então 300 falhas
	//     simultâneas fazem fila por elas. Essa fila é o estouro da manada.
	// ES: `pg_sleep` vuelve la consulta tan costosa como pida el experimento. Una consulta costosa
	//     de verdad retendría la conexión de la misma manera: el pool tiene 20 conexiones, así que
	//     300 fallos simultáneos hacen cola por ellas. Esa cola es el stampede.
	async readProduct(id: number, costMs = 0): Promise<Product | null> {
		this.counters.reads += 1;
		const result = await this.pool.query<Product>(
			"SELECT id, name, price FROM products, pg_sleep($2::float8 / 1000) WHERE id = $1",
			[id, costMs],
		);
		return result.rows[0] ?? null;
	}

	async writePrice(id: number, price: number): Promise<Product | null> {
		this.counters.writes += 1;
		const result = await this.pool.query<Product>(
			"UPDATE products SET price = $2 WHERE id = $1 RETURNING id, name, price",
			[id, price],
		);
		this.counters.rowsWritten += result.rowCount ?? 0;
		return result.rows[0] ?? null;
	}

	// EN: The write-behind flush: many products in ONE statement and one round-trip. Batching is
	//     the reason this strategy is cheap for the database.
	// PT: A descarga do write-behind: muitos produtos em UM comando e uma única viagem. O lote é
	//     o motivo de essa estratégia ser barata para o banco.
	// ES: El vaciado del write-behind: muchos productos en UNA sola sentencia y un solo viaje de
	//     ida y vuelta. El lote es la razón de que esta estrategia sea barata para la base de datos.
	async writePrices(products: Product[]): Promise<number> {
		if (products.length === 0) {
			return 0;
		}
		this.counters.writes += 1;
		const result = await this.pool.query(
			`UPDATE products AS p SET price = v.price
			 FROM unnest($1::int[], $2::int[]) AS v (id, price) WHERE p.id = v.id`,
			[products.map((product) => product.id), products.map((product) => product.price)],
		);
		const rows = result.rowCount ?? 0;
		this.counters.rowsWritten += rows;
		return rows;
	}

	async serverVersion(): Promise<string> {
		const result = await this.pool.query<{ server_version: string }>("SHOW server_version");
		return result.rows[0]?.server_version ?? "unknown";
	}

	async close(): Promise<void> {
		await this.pool.end();
	}
}
