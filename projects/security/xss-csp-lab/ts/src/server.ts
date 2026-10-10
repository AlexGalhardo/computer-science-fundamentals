// EN: Entry point of the `vulnerable` and `fixed` containers. This is the only file allowed to
//     import the vulnerable app, and it only serves it inside the internal Docker network of
//     the lab: the compose file publishes no port on the host.
// PT: Ponto de entrada dos contêineres `vulnerable` e `fixed`. Este é o único arquivo autorizado
//     a importar o app vulnerável, e ele só o serve dentro da rede Docker interna do
//     laboratório: o arquivo compose não publica nenhuma porta no host.
// ES: Punto de entrada de los contenedores `vulnerable` y `fixed`. Este es el único archivo autorizado
//     a importar la app vulnerable, y solo la sirve dentro de la red Docker interna del
//     laboratorio: el archivo compose no publica ningún puerto en el host.

import { loadConfig } from "./config";
import { createFixedApp } from "./fixed/fixed-app";
import type { LabApp } from "./lab-app";
import { createVulnerableApp } from "./vulnerable/vulnerable-app";

const config = loadConfig(process.env);
const app: LabApp = config.APP_VERSION === "vulnerable" ? createVulnerableApp() : createFixedApp();

Bun.serve({
	port: config.PORT,
	hostname: "0.0.0.0",
	fetch: (request) => app.handle(request),
});
console.log(`xss-csp-lab (${config.APP_VERSION}) listening on port ${config.PORT}`);
