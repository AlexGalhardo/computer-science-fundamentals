// EN: The API on Node.js, served by `node:http`. The same file is used twice:
//     - `node dist/node-server.cjs`: one process, one event loop.
//     - PM2 cluster mode (`ecosystem.config.cjs`): PM2 starts this file N times through the
//       `cluster` module of Node. The workers share the listening port, the primary process hands
//       each new connection to one of them, and they share NO memory: each has its own heap.
//     Nothing here knows about the cluster. That is the point of the process model: the code of
//     a stateless server does not change, only the number of processes running it.
// PT: A API no Node.js, servida pelo `node:http`. O mesmo arquivo é usado duas vezes:
//     - `node dist/node-server.cjs`: um processo, um event loop.
//     - Modo cluster do PM2 (`ecosystem.config.cjs`): o PM2 inicia este arquivo N vezes pelo
//       módulo `cluster` do Node. Os workers dividem a porta, o processo primário entrega cada
//       conexão nova a um deles, e eles NÃO compartilham memória: cada um tem o seu heap.
//     Nada aqui sabe do cluster. Esse é o ponto do modelo de processos: o código de um servidor
//     sem estado não muda, só muda o número de processos que o executam.

import { createServer } from "node:http";
import { route } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();

const server = createServer((request, response) => {
	route(request.method ?? "GET", request.url ?? "/", { setup: config.SETUP })
		.then((result) => {
			response.writeHead(result.status, { "Content-Type": "application/json" });
			response.end(JSON.stringify(result.body));
		})
		.catch((error: unknown) => {
			console.error(error);
			response.writeHead(500, { "Content-Type": "application/json" });
			response.end(JSON.stringify({ error: "internal error" }));
		});
});

server.listen(config.PORT, () => {
	console.log(`${config.SETUP}: Node ${process.versions.node} listening on ${config.PORT}, pid ${process.pid}`);
});
