// EN: One server, three doors to the same domain: `/rest/...`, `/graphql` and `/rpc`.
// PT: Um servidor, três portas para o mesmo domínio: `/rest/...`, `/graphql` e `/rpc`.
// ES: Un servidor, tres puertas al mismo dominio: `/rest/...`, `/graphql` y `/rpc`.

import { Elysia } from "elysia";
import type { Pool } from "pg";
import { graphqlRoutes } from "./graphql";
import { jsonRpcRoutes } from "./jsonrpc";
import { restRoutes } from "./rest";

export interface RunningApp {
	baseUrl: string;
	stop: () => Promise<void>;
}

// EN: Port 0 asks the operating system for any free port, and the server listens on loopback
//     only. Tests and benchmark talk to it over real HTTP, so headers and body sizes are the
//     ones a client would see, and nothing is reachable from outside the container.
// PT: A porta 0 pede ao sistema operacional qualquer porta livre, e o servidor escuta só em
//     loopback. Testes e benchmark falam com ele por HTTP de verdade, então cabeçalhos e tamanhos
//     de corpo são os que um cliente veria, e nada fica alcançável de fora do contêiner.
// ES: El puerto 0 le pide al sistema operativo cualquier puerto libre, y el servidor escucha solo en
//     loopback. Las pruebas y el benchmark le hablan por HTTP real, así que los encabezados y los
//     tamaños de cuerpo son los que vería un cliente, y nada es alcanzable desde fuera del contenedor.
export function startApp(pool: Pool): RunningApp {
	const app = new Elysia()
		.use(restRoutes(pool))
		.use(graphqlRoutes(pool))
		.use(jsonRpcRoutes(pool))
		.listen({ port: 0, hostname: "127.0.0.1" });
	const port = app.server?.port;
	if (port === undefined) {
		throw new Error("the HTTP server did not start");
	}
	return {
		baseUrl: `http://127.0.0.1:${port}`,
		stop: async () => {
			await app.stop();
		},
	};
}
