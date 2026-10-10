import { RedisClient } from "bun";
import { z } from "zod";
import { createApp } from "./app";
import { RedisLimiter } from "./redis-limiter";

// EN: One application instance. docker-compose starts two of them from the same image, both
//     pointing at the same Redis. Environment variables are external input, so they are parsed
//     with a schema and the process refuses to start with a bad value.
// PT: Uma instância da aplicação. O docker-compose sobe duas a partir da mesma imagem, as duas
//     apontando para o mesmo Redis. Variáveis de ambiente são entrada externa, então passam por
//     um schema e o processo se recusa a subir com um valor inválido.
// ES: Una instancia de la aplicación. docker-compose levanta dos a partir de la misma imagen, las
//     dos apuntando al mismo Redis. Las variables de entorno son entrada externa, así que pasan
//     por un schema y el proceso se niega a arrancar con un valor inválido.
const env = z
	.object({
		REDIS_URL: z.string().url(),
		INSTANCE: z.string().min(1),
		PORT: z.coerce.number().int().min(1).max(65535).default(3000),
		LIMIT: z.coerce.number().int().min(1),
		WINDOW_MS: z.coerce.number().int().min(1),
	})
	.parse(process.env);

const redis = new RedisClient(env.REDIS_URL);
await redis.connect();
const limiter = new RedisLimiter(redis, { limit: env.LIMIT, windowMs: env.WINDOW_MS });

const server = Bun.serve({
	port: env.PORT,
	fetch: createApp({
		instance: env.INSTANCE,
		hit: (strategy, clientKey) => limiter.hit(strategy, clientKey),
		healthy: async () => (await redis.send("PING", [])) === "PONG",
	}),
});

console.log(`${env.INSTANCE} listening on ${server.port}, limit ${env.LIMIT} per ${env.WINDOW_MS} ms`);
