// EN: One protocol test suite for the seven servers. It runs inside the internal Docker
//     network (`docker compose run tools`), against the servers named in SERVERS. If a server
//     answered differently from the others, its numbers would not be comparable, so this
//     suite must pass before any load is generated.
// PT: Uma única suíte de testes de protocolo para os sete servidores. Ela roda dentro da rede
//     interna do Docker (`docker compose run tools`), contra os servidores listados em SERVERS.
//     Se um servidor respondesse diferente dos outros, seus números não seriam comparáveis,
//     então esta suíte precisa passar antes de qualquer carga ser gerada.

import { beforeAll, describe, expect, test } from "bun:test";

const languages = (process.env.SERVERS ?? "cpp,rust,go,java,ts,elixir,python").split(",");

async function waitUntilReady(base: string): Promise<void> {
	const deadline = Date.now() + 60_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`${base}/health`);
			if (response.ok) {
				return;
			}
		} catch {
			// EN: Connection refused: the server is still starting, try again.
			// PT: Conexão recusada: o servidor ainda está subindo, tenta de novo.
		}
		await Bun.sleep(250);
	}
	throw new Error(`${base} did not become ready in 60 s`);
}

for (const language of languages) {
	const base = `http://server-${language}:8080`;

	describe(`server-${language}`, () => {
		beforeAll(() => waitUntilReady(base), 70_000);

		test("GET /health answers 200 ok", async () => {
			const response = await fetch(`${base}/health`);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("ok");
		});

		test("POST /echo returns the parsed body and the language", async () => {
			const body = {
				message: "olá, mundo",
				numbers: [1, 2, 3, -4, 0],
				nested: { ok: true, off: false, nothing: null, list: [] },
			};
			const response = await fetch(`${base}/echo`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toStartWith("application/json");
			expect(await response.json()).toEqual({ language, echo: body });
		});

		test("POST /echo rejects malformed JSON with 400", async () => {
			const response = await fetch(`${base}/echo`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: '{"message": ',
			});
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "invalid json" });
		});

		test("GET /primes counts the primes up to the limit", async () => {
			for (const [limit, count] of [
				[2, 1],
				[10, 4],
				[100, 25],
				[5000, 669],
			]) {
				const response = await fetch(`${base}/primes?limit=${limit}`);
				expect(response.status).toBe(200);
				expect(response.headers.get("content-type")).toStartWith("application/json");
				expect(await response.json()).toEqual({ language, limit, count });
			}
		});

		test("GET /primes rejects a missing, non-numeric or out-of-range limit with 400", async () => {
			for (const query of ["", "?limit=", "?limit=abc", "?limit=1", "?limit=100001", "?limit=-5"]) {
				const response = await fetch(`${base}/primes${query}`);
				expect(response.status).toBe(400);
				expect(await response.json()).toEqual({ error: "invalid limit" });
			}
		});

		test("an unknown path answers 404", async () => {
			const response = await fetch(`${base}/nope`);
			expect(response.status).toBe(404);
		});
	});
}
