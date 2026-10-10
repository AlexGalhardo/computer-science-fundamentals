// EN: Environment variables are external input, so they are validated at the edge. The defaults
//     point at the services of docker-compose, with obviously fake lab credentials.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. Os padrões apontam
//     para os serviços do docker-compose, com credenciais de laboratório claramente falsas.
// ES: Las variables de entorno son entrada externa, así que se validan en el borde. Los valores por defecto
//     apuntan a los servicios de docker-compose, con credenciales de laboratorio claramente falsas.

import { resolve } from "node:path";
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	// EN: Time the application "thinks" between reading the stock and writing it, standing in
	//     for real work such as validating a coupon. Every strategy pays the same think time.
	// PT: Tempo que a aplicação "pensa" entre ler o estoque e gravá-lo, no lugar de um trabalho
	//     real como validar um cupom. Todas as estratégias pagam o mesmo tempo.
	// ES: Tiempo que la aplicación "piensa" entre leer el stock y escribirlo, en lugar de un trabajo
	//     real como validar un cupón. Todas las estrategias pagan el mismo tiempo.
	THINK_TIME_MS: z.coerce.number().int().min(0).max(1000).default(2),
	POOL_SIZE: z.coerce.number().int().min(1).max(90).default(20),
	MAX_ATTEMPTS: z.coerce.number().int().min(1).max(100).default(30),
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
		PORT: env.PORT,
		THINK_TIME_MS: env.THINK_TIME_MS,
		POOL_SIZE: env.POOL_SIZE,
		MAX_ATTEMPTS: env.MAX_ATTEMPTS,
		PROJECT_DIR: env.PROJECT_DIR,
	});
}
