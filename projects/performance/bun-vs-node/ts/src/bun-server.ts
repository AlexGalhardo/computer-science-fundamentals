// EN: The API on Bun: one process, one event loop, served by `Bun.serve` (the HTTP server built
//     into the runtime).
// PT: A API no Bun: um processo, um event loop, servida pelo `Bun.serve` (o servidor HTTP embutido
//     no runtime).
// ES: La API en Bun: un proceso, un event loop, servida por `Bun.serve` (el servidor HTTP integrado
//     en el runtime).

import { route } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();

const server = Bun.serve({
	port: config.PORT,
	async fetch(request) {
		const result = await route(request.method, request.url, { setup: config.SETUP });
		return Response.json(result.body, { status: result.status });
	},
});

console.log(`${config.SETUP}: Bun ${Bun.version} listening on ${server.port}, pid ${process.pid}`);
