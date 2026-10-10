// EN: Environment variables are external input, so they are validated at the edge. The defaults
//     point at the services of docker-compose, with obviously fake lab credentials.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. Os padrões apontam
//     para os serviços do docker-compose, com credenciais de laboratório claramente falsas.
// ES: Las variables de entorno son entrada externa, así que se validan en el borde. Los valores por defecto
//     apuntan a los servicios de docker-compose, con credenciales de laboratorio claramente falsas.

import { resolve } from "node:path";
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@orders-db:5432/lab"),
	BROKER_URL: z.url().default("amqp://lab:lab-fake-password@broker:5672"),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	ORDER_SERVICE_URL: z.url().default("http://order-service:3000"),
	PAYMENT_SERVICE_URL: z.url().default("http://payment-service:3000"),
	/** How often the relay looks for unpublished outbox rows. */
	RELAY_INTERVAL_MS: z.coerce.number().int().min(10).max(10_000).default(100),
	/** Folder of the mini-project, where `results/` lives. */
	PROJECT_DIR: z
		.string()
		.min(1)
		.default(resolve(import.meta.dir, "..", "..", "..")),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		DATABASE_URL: env.DATABASE_URL,
		BROKER_URL: env.BROKER_URL,
		PORT: env.PORT,
		ORDER_SERVICE_URL: env.ORDER_SERVICE_URL,
		PAYMENT_SERVICE_URL: env.PAYMENT_SERVICE_URL,
		RELAY_INTERVAL_MS: env.RELAY_INTERVAL_MS,
		PROJECT_DIR: env.PROJECT_DIR,
	});
}
