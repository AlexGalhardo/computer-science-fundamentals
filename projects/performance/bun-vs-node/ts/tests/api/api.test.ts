// EN: One suite, three servers. `TARGETS` lists the setups as `name=url` pairs, and every test
//     below runs once per setup: the API must behave the same whatever runtime or process model
//     serves it. Only the number of processes answering is allowed to differ.
// PT: Uma suíte, três servidores. `TARGETS` lista as configurações como pares `nome=url`, e cada
//     teste abaixo roda uma vez por configuração: a API precisa se comportar igual seja qual for
//     o runtime ou o modelo de processos que a serve. Só o número de processos respondendo pode diferir.

import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { requireLocalTarget } from "../../../load/target.js";

const env = z
	.object({
		TARGETS: z.string().min(1),
		WORKERS: z.coerce.number().int().min(1).default(4),
	})
	.parse(process.env);

// EN: The same rule as the load test: a test never talks to a host that is not local.
// PT: A mesma regra do teste de carga: um teste nunca fala com um host que não seja local.
const targets = env.TARGETS.split(",").map((pair) => {
	const [name = "", url = ""] = pair.split("=");
	return { name, url: requireLocalTarget(url) };
});

const healthSchema = z.object({
	setup: z.string(),
	runtime: z.enum(["bun", "node"]),
	runtimeVersion: z.string().min(1),
	pid: z.number().int().positive(),
});

async function getJson(url: string): Promise<{ status: number; body: unknown }> {
	// EN: `Connection: close` opens a new connection per request. The cluster hands out
	//     connections, not requests, so a reused connection would always reach the same worker.
	// PT: `Connection: close` abre uma conexão nova por requisição. O cluster distribui conexões,
	//     não requisições, então uma conexão reutilizada chegaria sempre ao mesmo worker.
	const response = await fetch(url, { headers: { Connection: "close" } });
	return { status: response.status, body: await response.json() };
}

test("the three setups are under test", () => {
	expect(targets.map((target) => target.name).sort()).toEqual(["bun", "node", "node-pm2"]);
});

describe.each(targets)("$name", ({ name, url }) => {
	test("GET /health names the setup and the runtime", async () => {
		const { status, body } = await getJson(`${url}/health`);
		expect(status).toBe(200);
		const health = healthSchema.parse(body);
		expect(health.setup).toBe(name);
		expect(health.runtime).toBe(name === "bun" ? "bun" : "node");
	});

	test("GET /cpu counts the primes below n", async () => {
		expect(await getJson(`${url}/cpu?n=100`)).toEqual({ status: 200, body: { n: 100, primes: 25 } });
		expect(await getJson(`${url}/cpu?n=10000`)).toEqual({ status: 200, body: { n: 10_000, primes: 1_229 } });
		expect(await getJson(`${url}/cpu`)).toEqual({ status: 200, body: { n: 200_000, primes: 17_984 } });
	});

	test("GET /io waits and answers", async () => {
		const started = performance.now();
		expect(await getJson(`${url}/io?ms=50`)).toEqual({ status: 200, body: { waitedMs: 50 } });
		expect(performance.now() - started).toBeGreaterThanOrEqual(45);
	});

	// EN: Fifty requests that each wait 100 ms finish in far less than 50 x 100 ms on every setup,
	//     including the single-process ones: waiting does not occupy the event loop.
	// PT: Cinquenta requisições que esperam 100 ms cada terminam em muito menos que 50 x 100 ms em
	//     todas as configurações, inclusive as de processo único: esperar não ocupa o event loop.
	test("I/O-bound requests overlap on one event loop", async () => {
		const started = performance.now();
		const answers = await Promise.all(Array.from({ length: 50 }, () => getJson(`${url}/io?ms=100`)));
		expect(answers.every((answer) => answer.status === 200)).toBe(true);
		expect(performance.now() - started).toBeLessThan(2_000);
	});

	test("GET /memory reports the memory of the container", async () => {
		const { status, body } = await getJson(`${url}/memory`);
		expect(status).toBe(200);
		const memory = z.object({ bytes: z.number().positive(), source: z.string() }).parse(body);
		expect(memory.source.startsWith("cgroup")).toBe(true);
	});

	test("invalid input, unknown paths and other methods are refused", async () => {
		expect((await getJson(`${url}/cpu?n=abc`)).status).toBe(400);
		expect((await getJson(`${url}/cpu?n=999999999`)).status).toBe(400);
		expect((await getJson(`${url}/io?ms=-1`)).status).toBe(400);
		expect((await getJson(`${url}/nope`)).status).toBe(404);
		const post = await fetch(`${url}/cpu`, { method: "POST" });
		expect(post.status).toBe(405);
	});

	// EN: The only visible difference between the setups: how many processes answer on the port.
	// PT: A única diferença visível entre as configurações: quantos processos respondem na porta.
	test("the number of processes answering matches the process model", async () => {
		const answers = await Promise.all(Array.from({ length: 80 }, () => getJson(`${url}/health`)));
		const pids = new Set(answers.map((answer) => healthSchema.parse(answer.body).pid));
		if (name === "node-pm2") {
			expect(pids.size).toBeGreaterThan(1);
			expect(pids.size).toBeLessThanOrEqual(env.WORKERS);
		} else {
			expect(pids.size).toBe(1);
		}
	});
});
