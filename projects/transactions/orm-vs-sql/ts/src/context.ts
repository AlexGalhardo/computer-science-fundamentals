// EN: The three ways of talking to the same PostgreSQL, built side by side, each with a
//     recorder that keeps every SQL statement it sends. The recorder is how the lab answers
//     "what SQL does the ORM generate?" and "how many statements did that loop really issue?".
// PT: Os três jeitos de falar com o mesmo PostgreSQL, montados lado a lado, cada um com um
//     gravador que guarda todo comando SQL enviado. O gravador é como o laboratório responde
//     "que SQL o ORM gera?" e "quantos comandos aquele laço realmente emitiu?".
// ES: Las tres formas de hablar con el mismo PostgreSQL, montadas lado a lado, cada una con un
//     registrador que guarda toda sentencia SQL enviada. El registrador es cómo el laboratorio responde
//     "¿qué SQL genera el ORM?" y "¿cuántas sentencias emitió realmente ese bucle?".

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import * as schema from "./drizzle-schema";
import { PrismaClient } from "./generated/prisma/client";

export const APPROACHES = ["raw", "prisma", "drizzle"] as const;
export type Approach = (typeof APPROACHES)[number];

export type Row = Record<string, unknown>;

// EN: Raw SQL through node-postgres. `query` always binds parameters ($1, $2...), never
//     concatenates them into the text, which is what keeps SQL injection out.
// PT: SQL puro pelo node-postgres. `query` sempre passa os parâmetros separados ($1, $2...),
//     nunca concatenados no texto, e é isso que mantém a injeção de SQL do lado de fora.
// ES: SQL puro con node-postgres. `query` siempre pasa los parámetros por separado ($1, $2...),
//     nunca concatenados en el texto, y eso es lo que mantiene la inyección SQL afuera.
export interface RawDb {
	query: <T extends Row>(text: string, params?: unknown[]) => Promise<T[]>;
	transaction: <T>(work: (tx: RawDb) => Promise<T>) => Promise<T>;
}

export interface Context {
	raw: RawDb;
	prisma: PrismaClient;
	drizzle: NodePgDatabase<typeof schema>;
	/** Statements sent by each approach since the last `clearStatements`. */
	statements: Record<Approach, string[]>;
	clearStatements: () => void;
	close: () => Promise<void>;
}

export interface ContextOptions {
	databaseUrl: string;
	/** Recording costs a little time, so the benchmark turns it off. */
	record: boolean;
}

function rawDb(pool: Pool, log: string[], record: boolean): RawDb {
	const on = (client: Pool | PoolClient): RawDb["query"] => {
		return async <T extends Row>(text: string, params: unknown[] = []): Promise<T[]> => {
			if (record) {
				log.push(text);
			}
			const result = await client.query(text, params);
			return result.rows as T[];
		};
	};
	return {
		query: on(pool),
		// EN: A transaction must run on ONE connection. Taking a client from the pool and
		//     using it for BEGIN, the work and COMMIT guarantees that. Sending BEGIN through the
		//     pool could put each statement on a different connection.
		// PT: Uma transação precisa rodar em UMA conexão. Pegar um cliente do pool e usá-lo para
		//     o BEGIN, o trabalho e o COMMIT garante isso. Enviar o BEGIN pelo pool poderia
		//     colocar cada comando em uma conexão diferente.
		// ES: Una transacción debe ejecutarse en UNA conexión. Tomar un cliente del pool y usarlo para
		//     el BEGIN, el trabajo y el COMMIT lo garantiza. Enviar el BEGIN por el pool podría
		//     poner cada sentencia en una conexión diferente.
		transaction: async <T>(work: (tx: RawDb) => Promise<T>): Promise<T> => {
			const client = await pool.connect();
			const query = on(client);
			const tx: RawDb = { query, transaction: () => Promise.reject(new Error("nested transaction")) };
			try {
				await query("BEGIN");
				const result = await work(tx);
				await query("COMMIT");
				return result;
			} catch (error) {
				await query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		},
	};
}

export function createContext(options: ContextOptions): Context {
	const statements: Record<Approach, string[]> = { raw: [], prisma: [], drizzle: [] };
	const rawPool = new Pool({ connectionString: options.databaseUrl, max: 5 });
	const drizzlePool = new Pool({ connectionString: options.databaseUrl, max: 5 });

	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString: options.databaseUrl, max: 5 }),
		log: options.record ? [{ emit: "event", level: "query" }] : [],
	});
	if (options.record) {
		prisma.$on("query", (event) => {
			statements.prisma.push(event.query);
		});
	}

	const drizzleDb = drizzle({
		client: drizzlePool,
		schema,
		logger: options.record ? { logQuery: (query) => statements.drizzle.push(query) } : false,
	});

	return {
		raw: rawDb(rawPool, statements.raw, options.record),
		prisma,
		drizzle: drizzleDb,
		statements,
		clearStatements: () => {
			for (const approach of APPROACHES) {
				statements[approach].length = 0;
			}
		},
		close: async () => {
			await prisma.$disconnect();
			await rawPool.end();
			await drizzlePool.end();
		},
	};
}

// EN: Recreates the tables and the seed data, so every test file starts from the same rows.
// PT: Recria as tabelas e os dados iniciais, então todo arquivo de teste parte das mesmas linhas.
// ES: Recrea las tablas y los datos iniciales, así que todo archivo de prueba parte de las mismas filas.
export async function resetDatabase(databaseUrl: string): Promise<void> {
	const pool = new Pool({ connectionString: databaseUrl, max: 1 });
	try {
		await pool.query(readFileSync(join(import.meta.dir, "..", "sql", "schema.sql"), "utf8"));
	} finally {
		await pool.end();
	}
}
