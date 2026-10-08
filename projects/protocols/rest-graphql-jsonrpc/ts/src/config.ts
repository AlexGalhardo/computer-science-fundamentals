// EN: Environment variables are external input, so they are validated at the edge. The default
//     points at the `db` service of docker-compose, with obviously fake lab credentials.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. O padrão aponta
//     para o serviço `db` do docker-compose, com credenciais de laboratório claramente falsas.

import { resolve } from "node:path";
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
	/** Folder of the mini-project, where `results/` and the READMEs live. */
	PROJECT_DIR: z
		.string()
		.min(1)
		.default(resolve(import.meta.dir, "..", "..")),
	BENCH_ITERATIONS: z.coerce.number().int().min(10).max(100_000).default(300),
	BENCH_ROUNDS: z.coerce.number().int().min(1).max(20).default(3),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		DATABASE_URL: env.DATABASE_URL,
		PROJECT_DIR: env.PROJECT_DIR,
		BENCH_ITERATIONS: env.BENCH_ITERATIONS,
		BENCH_ROUNDS: env.BENCH_ROUNDS,
	});
}
