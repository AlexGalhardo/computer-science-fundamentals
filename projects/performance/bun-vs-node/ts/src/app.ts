// EN: The API, written once and with no knowledge of who serves it. `route` receives a method and
//     a URL and returns plain data (status and body). Bun and Node each wrap it with their own
//     native HTTP server (`Bun.serve` and `node:http`), so the comparison measures the runtimes
//     and not two different applications.
// PT: A API, escrita uma vez e sem saber quem a serve. `route` recebe um método e uma URL e devolve
//     dados simples (status e corpo). Bun e Node a embrulham cada um com o seu servidor HTTP nativo
//     (`Bun.serve` e `node:http`), então a comparação mede os runtimes e não duas aplicações diferentes.
// ES: La API, escrita una vez y sin saber quién la sirve. `route` recibe un método y una URL y
//     devuelve datos simples (estado y cuerpo). Bun y Node la envuelven cada uno con su servidor HTTP
//     nativo (`Bun.serve` y `node:http`), así que la comparación mide los runtimes y no dos
//     aplicaciones distintas.

import { z } from "zod";
import { readContainerMemory } from "./memory";
import { countPrimes, simulateIo } from "./work";

export interface RouteResult {
	status: number;
	body: Record<string, unknown>;
}

export interface AppInfo {
	/** Name of the setup being served: `bun`, `node` or `node-pm2`. */
	setup: string;
}

// EN: The query string comes from the network, so it is validated at the edge. The upper limits
//     matter here: without them one request with a huge `n` would freeze the event loop for minutes.
// PT: A query string vem da rede, então é validada na borda. Os limites superiores importam aqui:
//     sem eles, uma requisição com um `n` enorme congelaria o event loop por minutos.
// ES: La query string viene de la red, así que se valida en el borde. Los límites superiores importan
//     aquí: sin ellos, una solicitud con un `n` enorme congelaría el event loop por minutos.
const cpuQuery = z.object({ n: z.coerce.number().int().min(2).max(2_000_000).default(200_000) });
const ioQuery = z.object({ ms: z.coerce.number().int().min(0).max(1_000).default(20) });

function badRequest(error: z.ZodError): RouteResult {
	return { status: 400, body: { error: error.issues.map((issue) => issue.message).join("; ") } };
}

export async function route(method: string, rawUrl: string, info: AppInfo): Promise<RouteResult> {
	if (method !== "GET") {
		return { status: 405, body: { error: "only GET is supported" } };
	}
	const url = new URL(rawUrl, "http://local");
	const query = Object.fromEntries(url.searchParams);

	switch (url.pathname) {
		case "/health":
			// EN: The process id is in the answer on purpose. With one process it never changes. Under
			//     PM2 cluster mode several workers share the port, and different requests show different ids.
			// PT: O id do processo está na resposta de propósito. Com um processo ele nunca muda. No modo
			//     cluster do PM2 vários workers dividem a porta, e requisições diferentes mostram ids diferentes.
			// ES: El id del proceso está en la respuesta a propósito. Con un proceso nunca cambia. En el
			//     modo cluster de PM2 varios workers comparten el puerto, y solicitudes distintas muestran
			//     ids distintos.
			return {
				status: 200,
				body: {
					setup: info.setup,
					runtime: process.versions.bun === undefined ? "node" : "bun",
					runtimeVersion: process.versions.bun ?? process.versions.node,
					pid: process.pid,
				},
			};
		case "/cpu": {
			const parsed = cpuQuery.safeParse(query);
			if (!parsed.success) {
				return badRequest(parsed.error);
			}
			return { status: 200, body: { n: parsed.data.n, primes: countPrimes(parsed.data.n) } };
		}
		case "/io": {
			const parsed = ioQuery.safeParse(query);
			if (!parsed.success) {
				return badRequest(parsed.error);
			}
			await simulateIo(parsed.data.ms);
			return { status: 200, body: { waitedMs: parsed.data.ms } };
		}
		case "/memory":
			return { status: 200, body: { ...readContainerMemory() } };
		default:
			return { status: 404, body: { error: "not found" } };
	}
}
