// EN: Entry point of the HTTP delivery mechanism: read the configuration, compose, listen.
// PT: Ponto de entrada do mecanismo de entrega HTTP: ler a configuração, compor, escutar.
// ES: Punto de entrada del mecanismo de entrega HTTP: leer la configuración, componer, escuchar.

import { createHttpServer } from "../drivers/elysia-server";
import { composeApplication } from "./composition";
import { loadConfig } from "./config";

const config = loadConfig();
const application = await composeApplication(config);

createHttpServer(application.httpController).listen({ port: config.PORT, hostname: "0.0.0.0" });
console.log(`clean-architecture-app HTTP API listening on port ${config.PORT}`);
