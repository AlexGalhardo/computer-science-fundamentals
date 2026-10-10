// EN: Schema and helpers of the shop. One product with a stock counter, and one row in `orders`
//     for every sale. The number that matters is not the stock: it is how many orders exist.
//     Selling 25 orders of a product that had 10 units is overselling.
// PT: Schema e funções auxiliares da loja. Um produto com um contador de estoque, e uma linha em
//     `orders` para cada venda. O número que importa não é o estoque: é quantos pedidos existem.
//     Vender 25 pedidos de um produto que tinha 10 unidades é vender além do estoque.
// ES: Schema y funciones auxiliares de la tienda. Un producto con un contador de stock, y una fila en
//     `orders` por cada venta. El número que importa no es el stock: es cuántos pedidos existen.
//     Vender 25 pedidos de un producto que tenía 10 unidades es vender más allá del stock.

import { Pool } from "pg";

export const PRODUCT_ID = 1;

// EN: `version` is used only by the optimistic strategy: it counts how many times the row was
//     written. There is deliberately no `CHECK (stock >= 0)`: the naive code writes an absolute
//     value computed from a stale read, so the stock never goes negative and the constraint
//     would not catch the bug.
// PT: `version` é usada só pela estratégia otimista: conta quantas vezes a linha foi gravada.
//     De propósito não há `CHECK (stock >= 0)`: o código ingênuo grava um valor absoluto calculado
//     a partir de uma leitura velha, então o estoque nunca fica negativo e a restrição não
//     pegaria o bug.
// ES: `version` la usa solo la estrategia optimista: cuenta cuántas veces se escribió la fila.
//     A propósito no hay `CHECK (stock >= 0)`: el código ingenuo escribe un valor absoluto calculado
//     a partir de una lectura vieja, así que el stock nunca queda negativo y la restricción no
//     atraparía el bug.
const SCHEMA = [
	`CREATE TABLE IF NOT EXISTS products (
		id integer PRIMARY KEY,
		name text NOT NULL,
		stock integer NOT NULL,
		version integer NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS orders (
		id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
		product_id integer NOT NULL REFERENCES products (id),
		buyer_id text NOT NULL,
		strategy text NOT NULL,
		created_at timestamptz NOT NULL DEFAULT now()
	)`,
];

export interface Stats {
	stock: number;
	orders: number;
}

export function createPool(databaseUrl: string, size: number): Pool {
	return new Pool({ connectionString: databaseUrl, max: size });
}

export async function migrate(pool: Pool): Promise<void> {
	for (const statement of SCHEMA) {
		await pool.query(statement);
	}
}

export async function reset(pool: Pool, stock: number): Promise<void> {
	await pool.query("TRUNCATE orders");
	await pool.query(
		`INSERT INTO products (id, name, stock, version) VALUES ($1, 'Fake concert ticket', $2, 0)
		 ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, version = 0`,
		[PRODUCT_ID, stock],
	);
}

export async function stats(pool: Pool): Promise<Stats> {
	const result = await pool.query<{ stock: number; orders: number }>(
		`SELECT p.stock, (SELECT count(*)::int FROM orders o WHERE o.product_id = p.id) AS orders
		 FROM products p WHERE p.id = $1`,
		[PRODUCT_ID],
	);
	const row = result.rows[0];
	if (row === undefined) {
		throw new Error("product not found, call reset first");
	}
	return { stock: row.stock, orders: row.orders };
}
