// EN: Environment variables are external input, so they are validated at the edge. The defaults
//     point at the services of docker-compose, with obviously fake lab credentials.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. Os padrões apontam
//     para os serviços do docker-compose, com credenciais de laboratório claramente falsas.

import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	// EN: THE BOTTLENECK. Two connections is the "before" of the lesson. The fix is this one
	//     number: the load test runs again with POOL_SIZE=20 and nothing else changed.
	// PT: O GARGALO. Duas conexões é o "antes" da lição. A correção é este único número: o teste
	//     de carga roda de novo com POOL_SIZE=20 e nada mais muda.
	POOL_SIZE: z.coerce.number().int().min(1).max(90).default(2),
	/** How long the query of every request takes in the database, standing in for real work. */
	QUERY_MS: z.coerce.number().int().min(0).max(1_000).default(20),
	/** How long a request waits for a free connection before the API answers 503. */
	POOL_WAIT_MS: z.coerce.number().int().min(1).max(60_000).default(2_000),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		DATABASE_URL: env.DATABASE_URL,
		PORT: env.PORT,
		POOL_SIZE: env.POOL_SIZE,
		QUERY_MS: env.QUERY_MS,
		POOL_WAIT_MS: env.POOL_WAIT_MS,
	});
}
