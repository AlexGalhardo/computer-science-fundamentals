// EN: Entry point of the API container: validate the environment, connect, create the table,
//     start the write-behind flusher and listen.
// PT: Ponto de entrada do contêiner da API: validar o ambiente, conectar, criar a tabela, ligar
//     o descarregador do write-behind e escutar.

import { createApp, createLab, resetLab } from "./app";
import { Cache } from "./cache";
import { loadConfig } from "./config";
import { Database } from "./db";

const config = loadConfig();
const db = Database.connect(config.DATABASE_URL, config.POOL_SIZE);
await db.migrate();
const lab = createLab(db, await Cache.connect(config.REDIS_URL));
await resetLab(lab);

// EN: The "behind" of write-behind: a timer that sends the pending writes to the database. A
//     failed flush is logged and retried on the next tick, because the batch was put back.
// PT: O "behind" do write-behind: um temporizador que manda as escritas pendentes para o banco.
//     Uma descarga que falha é registrada e tentada de novo no próximo ciclo, porque o lote foi
//     devolvido à fila.
setInterval(() => {
	lab.store.flush().catch((error: unknown) => console.error("write-behind flush failed:", error));
}, config.FLUSH_INTERVAL_MS);

createApp(lab).listen({ port: config.PORT, hostname: "0.0.0.0" });
console.log(`cache-strategies API listening on port ${config.PORT}`);
