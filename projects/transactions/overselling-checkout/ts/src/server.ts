// EN: Entry point of the API container: validate the environment, create the tables, listen.
// PT: Ponto de entrada do contêiner da API: validar o ambiente, criar as tabelas, escutar.
// ES: Punto de entrada del contenedor de la API: validar el entorno, crear las tablas, escuchar.

import { createApp } from "./app";
import { loadConfig } from "./config";
import { createPool, migrate, reset } from "./db";

const config = loadConfig();
const pool = createPool(config.DATABASE_URL, config.POOL_SIZE);
await migrate(pool);
await reset(pool, 10);

createApp({ pool, thinkTimeMs: config.THINK_TIME_MS, maxAttempts: config.MAX_ATTEMPTS }).listen({
	port: config.PORT,
	hostname: "0.0.0.0",
});
console.log(`overselling-checkout API listening on port ${config.PORT}`);
