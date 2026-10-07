// EN: One protocol test suite for the three servers. It knows nothing about the language
//     behind each address: it only speaks HTTP. If the three pass, a client cannot tell them
//     apart, which is what makes the load test a fair comparison.
// PT: Uma única suíte de testes de protocolo para os três servidores. Ela não sabe nada sobre a
//     linguagem atrás de cada endereço: só fala HTTP. Se os três passam, um cliente não
//     consegue distingui-los, e é isso que torna o teste de carga uma comparação justa.

import { beforeAll, describe, expect, test } from "bun:test";
import { isLocalTarget } from "../load/target.js";

const targets = (process.env.TARGETS ?? "http://localhost:8080").split(",").map((target) => target.trim());

interface Stats {
	runtime: string;
	inFlight: number;
	rssKb: number;
}

// EN: A response body is external input: its shape is checked before it is trusted.
// PT: O corpo de uma resposta é entrada externa: o formato é conferido antes de confiar nele.
function parseStats(value: unknown): Stats {
	if (typeof value !== "object" || value === null) {
		throw new Error("stats is not an object");
	}
	const { runtime, inFlight, rssKb } = value as Record<string, unknown>;
	if (typeof runtime !== "string" || typeof inFlight !== "number" || typeof rssKb !== "number") {
		throw new Error(`unexpected stats: ${JSON.stringify(value)}`);
	}
	return { runtime, inFlight, rssKb };
}

for (const target of targets) {
	// EN: The same rule as the load test: this suite only talks to local services.
	// PT: A mesma regra do teste de carga: esta suíte só fala com serviços locais.
	if (!isLocalTarget(target)) {
		throw new Error(`refusing to test ${target}: only local targets are allowed`);
	}

	describe(target, () => {
		// EN: The servers start at the same time as this suite, so it waits until each one answers.
		// PT: Os servidores sobem junto com esta suíte, então ela espera até cada um responder.
		beforeAll(async () => {
			for (let attempt = 0; attempt < 60; attempt++) {
				const up = await fetch(`${target}/health`).then(
					(response) => response.ok,
					() => false,
				);
				if (up) {
					return;
				}
				await Bun.sleep(500);
			}
			throw new Error(`${target} did not answer /health in 30 seconds`);
		}, 40_000);

		test("GET /health answers ok", async () => {
			const response = await fetch(`${target}/health`);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("ok");
		});

		test("POST /echo returns the same bytes and content type", async () => {
			const body = JSON.stringify({ message: "olá, mundo", n: 42 });
			const response = await fetch(`${target}/echo`, {
				method: "POST",
				body,
				headers: { "Content-Type": "application/json" },
			});
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toContain("application/json");
			expect(await response.text()).toBe(body);
		});

		test("POST /echo handles an empty body and a 64 KiB body", async () => {
			const empty = await fetch(`${target}/echo`, { method: "POST" });
			expect(empty.status).toBe(200);
			expect(await empty.text()).toBe("");

			const big = "x".repeat(64 * 1024);
			const response = await fetch(`${target}/echo`, { method: "POST", body: big });
			expect(await response.text()).toBe(big);
		});

		test("GET /delay waits about the time asked", async () => {
			const start = performance.now();
			const response = await fetch(`${target}/delay?ms=200`);
			const elapsed = performance.now() - start;
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ waitedMs: 200 });
			expect(elapsed).toBeGreaterThanOrEqual(195);
			expect(elapsed).toBeLessThan(3000);
		});

		test("GET /delay rejects values that are not an integer from 0 to 60000", async () => {
			for (const query of ["", "?ms=abc", "?ms=-1", "?ms=1.5", "?ms=60001"]) {
				const response = await fetch(`${target}/delay${query}`);
				expect(response.status).toBe(400);
				await response.arrayBuffer();
			}
		});

		// EN: 300 requests that each wait 500 ms. A server that handled one connection at a
		//     time would need 150 seconds. A concurrent one needs about half a second.
		// PT: 300 requisições que esperam 500 ms cada. Um servidor que tratasse uma conexão por
		//     vez precisaria de 150 segundos. Um servidor concorrente precisa de meio segundo.
		test("300 delayed requests are served at the same time", async () => {
			const start = performance.now();
			const responses = await Promise.all(
				Array.from({ length: 300 }, () => fetch(`${target}/delay?ms=500`).then((response) => response.status)),
			);
			expect(responses.every((status) => status === 200)).toBe(true);
			expect(performance.now() - start).toBeLessThan(10_000);
		}, 30_000);

		test("GET /stats reports the requests in flight and the memory", async () => {
			const idle = parseStats(await (await fetch(`${target}/stats`)).json());
			expect(idle.runtime.length).toBeGreaterThan(0);
			expect(idle.rssKb).toBeGreaterThan(0);

			const waiting = Array.from({ length: 20 }, () => fetch(`${target}/delay?ms=800`));
			await Bun.sleep(300);
			const busy = parseStats(await (await fetch(`${target}/stats`)).json());
			expect(busy.inFlight).toBeGreaterThanOrEqual(20);
			for (const response of await Promise.all(waiting)) {
				await response.arrayBuffer();
			}
		});

		test("unknown path is 404 and wrong method is 405", async () => {
			expect((await fetch(`${target}/nope`)).status).toBe(404);
			expect((await fetch(`${target}/echo`)).status).toBe(405);
			expect((await fetch(`${target}/health`, { method: "POST" })).status).toBe(405);
		});
	});
}
