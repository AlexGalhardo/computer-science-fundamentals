// EN: Database access with a counter. Every request gets its own `Db`, which wraps the shared
//     connection pool and counts the statements it sends. The count travels back to the client
//     in the `x-db-queries` response header, and that is how the tests see the N+1 problem
//     instead of guessing it from the latency.
// PT: Acesso ao banco com um contador. Cada requisição recebe o seu `Db`, que embrulha o pool de
//     conexões compartilhado e conta os comandos enviados. A contagem volta para o cliente no
//     cabeçalho de resposta `x-db-queries`, e é assim que os testes enxergam o problema N+1 em
//     vez de adivinhá-lo pela latência.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import type { z } from "zod";
import { buildSeed } from "./seed";

export const QUERY_COUNT_HEADER = "x-db-queries";

export class Db {
	queries = 0;

	constructor(private readonly pool: Pool) {}

	// EN: Rows come from outside the type system, so each query names the Zod schema of its rows.
	//     Values always travel as parameters ($1, $2), never inside the SQL text.
	// PT: As linhas vêm de fora do sistema de tipos, então cada consulta indica o schema Zod das
	//     suas linhas. Os valores sempre viajam como parâmetros ($1, $2), nunca dentro do texto SQL.
	async query<T>(rowSchema: z.ZodType<T>, text: string, params: readonly unknown[] = []): Promise<T[]> {
		this.queries += 1;
		const result = await this.pool.query(text, [...params]);
		return result.rows.map((row: unknown) => rowSchema.parse(row));
	}
}

export function createPool(databaseUrl: string): Pool {
	return new Pool({ connectionString: databaseUrl, max: 10 });
}

// EN: Drops, recreates and fills the tables with the same deterministic data every time, so a
//     test can assert on exact titles and the benchmark always reads the same rows.
// PT: Apaga, recria e preenche as tabelas com os mesmos dados determinísticos todas as vezes,
//     então um teste pode conferir títulos exatos e o benchmark sempre lê as mesmas linhas.
export async function resetDatabase(pool: Pool): Promise<void> {
	const schema = readFileSync(join(import.meta.dir, "..", "sql", "schema.sql"), "utf8");
	const seed = buildSeed();
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await client.query(schema);
		// EN: `unnest` turns one array per column into rows, so each table is filled by a single
		//     statement instead of one INSERT per row.
		// PT: `unnest` transforma um array por coluna em linhas, então cada tabela é preenchida
		//     por um único comando em vez de um INSERT por linha.
		await client.query(
			"INSERT INTO authors (id, name, country, bio) SELECT * FROM unnest($1::int[], $2::text[], $3::text[], $4::text[])",
			[
				seed.authors.map((author) => author.id),
				seed.authors.map((author) => author.name),
				seed.authors.map((author) => author.country),
				seed.authors.map((author) => author.bio),
			],
		);
		await client.query(
			"INSERT INTO books (id, author_id, title, year, pages, isbn, summary) SELECT * FROM unnest($1::int[], $2::int[], $3::text[], $4::int[], $5::int[], $6::text[], $7::text[])",
			[
				seed.books.map((book) => book.id),
				seed.books.map((book) => book.authorId),
				seed.books.map((book) => book.title),
				seed.books.map((book) => book.year),
				seed.books.map((book) => book.pages),
				seed.books.map((book) => book.isbn),
				seed.books.map((book) => book.summary),
			],
		);
		await client.query(
			"INSERT INTO reviews (book_id, rating, reviewer, body) SELECT * FROM unnest($1::int[], $2::int[], $3::text[], $4::text[])",
			[
				seed.reviews.map((review) => review.bookId),
				seed.reviews.map((review) => review.rating),
				seed.reviews.map((review) => review.reviewer),
				seed.reviews.map((review) => review.text),
			],
		);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}
