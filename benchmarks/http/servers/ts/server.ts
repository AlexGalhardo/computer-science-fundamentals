// EN: HTTP server of the benchmark in TypeScript, with Bun's built-in server (Bun.serve).
//     Model: one thread and an event loop. The network work happens in native code, and the
//     handler below runs on the single JavaScript thread, one request at a time. That is very
//     efficient for short handlers, and it means a CPU-bound request (like /primes) makes
//     every other request wait: this server never uses more than about one core.
//     Protocol (the same in the 7 languages): GET /health, POST /echo, GET /primes?limit=N.
// PT: Servidor HTTP do benchmark em TypeScript, com o servidor embutido do Bun (Bun.serve).
//     Modelo: uma thread e um event loop. O trabalho de rede acontece em código nativo, e o
//     handler abaixo roda na única thread JavaScript, uma requisição por vez. Isso é muito
//     eficiente para handlers curtos, e significa que uma requisição presa à CPU (como
//     /primes) faz todas as outras esperarem: este servidor nunca usa mais que cerca de um
//     núcleo.
//     Protocolo (o mesmo nas 7 linguagens): GET /health, POST /echo, GET /primes?limit=N.

// EN: An empty export makes this file a module, so its names stay private to it.
// PT: Um export vazio torna este arquivo um módulo, então seus nomes ficam privados a ele.
export {};

const MAX_LIMIT = 100000;

function isPrime(k: number): boolean {
	if (k < 2) return false;
	if (k < 4) return true;
	if (k % 2 === 0) return false;
	for (let d = 3; d * d <= k; d += 2) {
		if (k % d === 0) return false;
	}
	return true;
}

// EN: The CPU-bound endpoint: count the primes up to limit by trial division.
// PT: O endpoint preso à CPU: conta os primos até limit por divisão por tentativa.
function countPrimes(limit: number): number {
	let count = 0;
	for (let k = 2; k <= limit; k++) {
		if (isPrime(k)) count++;
	}
	return count;
}

// EN: The echo endpoint parses the JSON body and serialises it again, so it measures the JSON
//     library and the HTTP stack, not a copy of bytes.
// PT: O endpoint de eco interpreta o corpo JSON e o serializa de novo, então mede a biblioteca
//     de JSON e a pilha HTTP, não uma cópia de bytes.
async function echo(request: Request): Promise<Response> {
	let value: unknown;
	try {
		value = await request.json();
	} catch {
		return Response.json({ error: "invalid json" }, { status: 400 });
	}
	return Response.json({ language: "ts", echo: value });
}

function primes(url: URL): Response {
	const raw = url.searchParams.get("limit") ?? "";
	const limit = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
	if (!Number.isInteger(limit) || limit < 2 || limit > MAX_LIMIT) {
		return Response.json({ error: "invalid limit" }, { status: 400 });
	}
	return Response.json({ language: "ts", limit, count: countPrimes(limit) });
}

Bun.serve({
	port: 8080,
	hostname: "0.0.0.0",
	fetch(request: Request): Response | Promise<Response> {
		const url = new URL(request.url);
		if (request.method === "GET" && url.pathname === "/health") {
			return new Response("ok");
		}
		if (request.method === "POST" && url.pathname === "/echo") {
			return echo(request);
		}
		if (request.method === "GET" && url.pathname === "/primes") {
			return primes(url);
		}
		return new Response("not found", { status: 404 });
	},
});
