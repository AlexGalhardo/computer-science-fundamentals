// EN: Environment variables are external input, so they are validated at the edge. The defaults
//     point at the services of docker-compose, with obviously fake lab credentials.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. Os padrões apontam
//     para os serviços do docker-compose, com credenciais de laboratório claramente falsas.

import { resolve } from "node:path";
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
	REDIS_URL: z.url().default("redis://redis:6379"),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	POOL_SIZE: z.coerce.number().int().min(1).max(90).default(20),
	// EN: How often the write-behind queue is flushed to PostgreSQL. It is also the amount of
	//     acknowledged work that is lost if Redis dies: everything written since the last flush.
	// PT: De quanto em quanto tempo a fila do write-behind é descarregada no PostgreSQL. É também
	//     a quantidade de trabalho confirmado que se perde se o Redis morrer: tudo o que foi
	//     escrito desde a última descarga.
	FLUSH_INTERVAL_MS: z.coerce.number().int().min(10).max(60_000).default(200),
	/** Folder of the mini-project, where `results/`, `k6-results/` and the READMEs live. */
	PROJECT_DIR: z
		.string()
		.min(1)
		.default(resolve(import.meta.dir, "..", "..")),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		DATABASE_URL: env.DATABASE_URL,
		REDIS_URL: env.REDIS_URL,
		PORT: env.PORT,
		POOL_SIZE: env.POOL_SIZE,
		FLUSH_INTERVAL_MS: env.FLUSH_INTERVAL_MS,
		PROJECT_DIR: env.PROJECT_DIR,
	});
}

// EN: The knobs of one experiment. They are not environment variables because the load test
//     changes them between runs, through `POST /admin/reset`, without restarting the API.
// PT: Os botões de um experimento. Não são variáveis de ambiente porque o teste de carga os muda
//     entre as execuções, por `POST /admin/reset`, sem reiniciar a API.
export const settingsSchema = z.object({
	/** Number of rows in `products`. */
	products: z.number().int().min(1).max(10_000).default(200),
	/** Time to live of a cached product, in milliseconds. */
	ttlMs: z.number().int().min(10).max(600_000).default(2000),
	/** Artificial cost of a normal product query, standing in for a join or an aggregation. */
	queryCostMs: z.number().int().min(0).max(1000).default(0),
	/** Cost of the query behind the hot key of the stampede experiment. */
	slowQueryMs: z.number().int().min(0).max(5000).default(100),
	/** Early refresh: how long before the expiry the value is refreshed in the background. */
	earlyRefreshMs: z.number().int().min(1).max(600_000).default(600),
});

export type Settings = z.infer<typeof settingsSchema>;
