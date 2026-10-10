// EN: Entry point of the API container: validate the environment, create the table, listen.
// PT: Ponto de entrada do contêiner da API: validar o ambiente, criar a tabela, escutar.
// ES: Punto de entrada del contenedor de la API: validar el entorno, crear la tabla, escuchar.

import { createApp } from "./app";
import { loadConfig } from "./config";
import { createPool, migrate } from "./db";

const config = loadConfig();
const pool = createPool({ databaseUrl: config.DATABASE_URL, size: config.POOL_SIZE, waitMs: config.POOL_WAIT_MS });
await migrate(pool);

createApp({ pool, poolSize: config.POOL_SIZE, queryMs: config.QUERY_MS, poolWaitMs: config.POOL_WAIT_MS }).listen({
	port: config.PORT,
	hostname: "0.0.0.0",
});
console.log(`k6-scenarios API listening on port ${config.PORT} with a pool of ${config.POOL_SIZE} connections`);
