import { z } from "zod";

// EN: The back end of the lab. Three containers run this same code and differ only in their
//     name, which is what "identical instances behind a load balancer" means. Every answer
//     carries the name of the instance in the `X-Instance` header, so the client can count
//     which instance the proxy chose without asking the proxy anything.
// PT: O back end do laboratório. Três contêineres rodam este mesmo código e só diferem no nome,
//     que é o que "instâncias idênticas atrás de um balanceador de carga" significa. Toda
//     resposta leva o nome da instância no cabeçalho `X-Instance`, então o cliente consegue
//     contar qual instância o proxy escolheu sem perguntar nada ao proxy.
// ES: El back end del laboratorio. Tres contenedores ejecutan este mismo código y solo difieren en
//     el nombre, que es lo que significa "instancias idénticas detrás de un balanceador de carga".
//     Cada respuesta lleva el nombre de la instancia en el encabezado `X-Instance`, así que el
//     cliente puede contar qué instancia eligió el proxy sin preguntarle nada al proxy.

export type OutageMode = "crash" | "freeze";

export interface AppHooks {
	/** Stops listening for `ms` milliseconds, then listens again. Implemented by the server. */
	crash: (ms: number) => void;
	now: () => number;
	sleep: (ms: number) => Promise<void>;
}

export interface App {
	handle: (request: Request) => Promise<Response>;
}

const milliseconds = z.coerce.number().int().min(0).max(60_000);
const outageQuery = z.object({ mode: z.enum(["crash", "freeze"]), ms: milliseconds });

function json(body: unknown, instance: string, status = 200): Response {
	return Response.json(body, { status, headers: { "X-Instance": instance } });
}

export function createApp(instance: string, hooks: AppHooks): App {
	let served = 0;
	let delayMs = 0;
	let frozenUntil = 0;

	// EN: A frozen process is the nasty kind of failure: the port is open and connections are
	//     accepted, but no answer comes. A proxy can only find out with a timeout.
	// PT: Um processo congelado é o tipo ruim de falha: a porta está aberta e as conexões são
	//     aceitas, mas nenhuma resposta chega. Um proxy só descobre com um timeout.
	// ES: Un proceso congelado es el tipo malo de falla: el puerto está abierto y las conexiones se
	//     aceptan, pero no llega ninguna respuesta. Un proxy solo lo descubre con un timeout.
	const waitWhileFrozen = async (): Promise<void> => {
		const remaining = frozenUntil - hooks.now();
		if (remaining > 0) {
			await hooks.sleep(remaining);
		}
	};

	const control = (url: URL): Response => {
		if (url.pathname === "/control/reset") {
			served = 0;
			delayMs = 0;
			return json({ instance, served, delayMs }, instance);
		}
		if (url.pathname === "/control/delay") {
			const ms = milliseconds.safeParse(url.searchParams.get("ms"));
			if (!ms.success) {
				return json({ error: "ms must be an integer from 0 to 60000" }, instance, 400);
			}
			delayMs = ms.data;
			return json({ instance, delayMs }, instance);
		}
		if (url.pathname === "/control/outage") {
			const query = outageQuery.safeParse(Object.fromEntries(url.searchParams));
			if (!query.success) {
				return json({ error: "mode must be crash or freeze, ms an integer from 0 to 60000" }, instance, 400);
			}
			if (query.data.mode === "freeze") {
				frozenUntil = hooks.now() + query.data.ms;
			} else {
				hooks.crash(query.data.ms);
			}
			return json({ instance, ...query.data }, instance);
		}
		return json({ error: "not found" }, instance, 404);
	};

	const handle = async (request: Request): Promise<Response> => {
		const url = new URL(request.url);
		if (url.pathname.startsWith("/control/")) {
			return request.method === "POST" ? control(url) : json({ error: "use POST" }, instance, 405);
		}
		if (request.method !== "GET") {
			return json({ error: "use GET" }, instance, 405);
		}
		await waitWhileFrozen();
		switch (url.pathname) {
			case "/health":
				return json({ status: "ok" }, instance);
			case "/work":
				// EN: The artificial delay stands for real work (a query, a computation). It is how
				//     the lab makes one instance slower than the others.
				// PT: O atraso artificial representa trabalho real (uma consulta, um cálculo). É
				//     assim que o laboratório deixa uma instância mais lenta que as outras.
				// ES: El retraso artificial representa trabajo real (una consulta, un cálculo). Así es
				//     como el laboratorio hace que una instancia sea más lenta que las otras.
				served += 1;
				if (delayMs > 0) {
					await hooks.sleep(delayMs);
				}
				return json({ instance }, instance);
			case "/stats":
				return json({ instance, served, delayMs }, instance);
			default:
				return json({ error: "not found" }, instance, 404);
		}
	};

	return { handle };
}
