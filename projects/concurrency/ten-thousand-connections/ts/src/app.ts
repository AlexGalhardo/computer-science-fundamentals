// EN: The routes of the TypeScript server, as one function from Request to Response. Bun runs
//     this function on a single thread, the event loop. `await Bun.sleep(ms)` does not block
//     that thread: it registers a timer and returns to the loop, which is then free to serve
//     other connections. Ten thousand waiting requests are ten thousand small promise objects,
//     not ten thousand threads.
// PT: As rotas do servidor TypeScript, como uma função de Request para Response. O Bun roda
//     esta função em uma única thread, o event loop. `await Bun.sleep(ms)` não bloqueia essa
//     thread: registra um timer e volta para o loop, que fica livre para atender outras
//     conexões. Dez mil requisições esperando são dez mil pequenos objetos promise, não dez
//     mil threads.
// ES: Las rutas del servidor TypeScript, como una función de Request a Response. Bun ejecuta
//     esta función en un único thread, el event loop. `await Bun.sleep(ms)` no bloquea ese
//     thread: registra un timer y vuelve al loop, que queda libre para atender otras
//     conexiones. Diez mil solicitudes esperando son diez mil pequeños objetos promise, no diez
//     mil threads.

export const MAX_DELAY_MS = 60_000;
const MAX_ECHO_BYTES = 1 << 20;

let inFlight = 0;

function json(status: number, value: unknown): Response {
	return Response.json(value, { status });
}

async function route(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const allow = (method: string): Response | undefined =>
		request.method === method ? undefined : new Response("method not allowed", { status: 405 });

	switch (url.pathname) {
		case "/health":
			return allow("GET") ?? new Response("ok", { headers: { "Content-Type": "text/plain" } });
		case "/echo": {
			const refused = allow("POST");
			if (refused !== undefined) {
				return refused;
			}
			const body = await request.arrayBuffer();
			if (body.byteLength > MAX_ECHO_BYTES) {
				return json(413, { error: "body is too large" });
			}
			const contentType = request.headers.get("Content-Type") ?? "application/octet-stream";
			return new Response(body, { headers: { "Content-Type": contentType } });
		}
		case "/delay": {
			const refused = allow("GET");
			if (refused !== undefined) {
				return refused;
			}
			// EN: The query string is external input, so it is checked before use.
			// PT: A query string é entrada externa, então é conferida antes do uso.
			// ES: La query string es entrada externa, así que se verifica antes de usarla.
			const text = url.searchParams.get("ms") ?? "";
			const ms = Number(text);
			if (!/^\d+$/.test(text) || ms > MAX_DELAY_MS) {
				return json(400, { error: `ms must be an integer from 0 to ${MAX_DELAY_MS}` });
			}
			await Bun.sleep(ms);
			return json(200, { waitedMs: ms });
		}
		case "/stats":
			return (
				allow("GET") ??
				json(200, {
					runtime: `bun ${Bun.version}`,
					// This request counts itself, so it is subtracted.
					inFlight: inFlight - 1,
					rssKb: Math.round(process.memoryUsage().rss / 1024),
				})
			);
		default:
			return new Response("not found", { status: 404 });
	}
}

export async function handle(request: Request): Promise<Response> {
	inFlight += 1;
	try {
		return await route(request);
	} finally {
		inFlight -= 1;
	}
}
