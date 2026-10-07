// EN: Environment variables are external input, so they are validated at the edge. The defaults
//     point at the `db` service of docker-compose, with obviously fake lab credentials.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. Os padrões apontam
//     para o serviço `db` do docker-compose, com credenciais de laboratório claramente falsas.

import { z } from "zod";

const envSchema = z.object({
	/** Owner of the database: used by the vulnerable app, which is part of the lesson. */
	OWNER_DATABASE_URL: z.url().default("postgres://lab_owner:lab-fake-owner-password@db:5432/lab"),
	/** Role with SELECT on `users` and `products` only: used by the fixed app. */
	READONLY_DATABASE_URL: z.url().default("postgres://lab_readonly:lab-fake-readonly-password@db:5432/lab"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		OWNER_DATABASE_URL: env.OWNER_DATABASE_URL,
		READONLY_DATABASE_URL: env.READONLY_DATABASE_URL,
	});
}
