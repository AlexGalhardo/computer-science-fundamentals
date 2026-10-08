import { describe, expect, test } from "bun:test";
import { z } from "zod";

// EN: Two application instances, one Redis, and a crowd of concurrent requests split between
//     the two. This test runs inside docker-compose, on an internal network.
//
//     Load is only ever sent to this lab: the targets come from a variable that defaults to
//     the two compose services, and the test refuses to start when any host is not local.
// PT: Duas instâncias da aplicação, um Redis, e uma multidão de requisições concorrentes
//     divididas entre as duas. Este teste roda dentro do docker-compose, em uma rede interna.
//
//     A carga só é enviada para este laboratório: os alvos vêm de uma variável cujo padrão são
//     os dois serviços do compose, e o teste se recusa a começar quando algum host não é local.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "limiter-a", "limiter-b"]);

const env = z
	.object({
		TARGETS: z.string().default("http://limiter-a:3000,http://limiter-b:3000"),
		LIMIT: z.coerce.number().int().min(1),
		WINDOW_MS: z.coerce.number().int().min(1),
	})
	.parse(process.env);

const targets = env.TARGETS.split(",").map((target) => new URL(target));
for (const target of targets) {
	if (!LOCAL_HOSTS.has(target.hostname)) {
		throw new Error(`refusing to send load to ${target.hostname}: only local lab services are allowed`);
	}
}

const REQUESTS = 400;

interface Outcome {
	admitted: number;
	rejected: number;
	retryAfter: string[];
	elapsedMs: number;
}

const bodySchema = z.object({ allowed: z.boolean(), remaining: z.number(), instance: z.string() });

// EN: Every request is created before any answer is awaited, so they are all in flight at the
//     same time, alternating between the two instances.
// PT: Todas as requisições são criadas antes de se esperar qualquer resposta, então estão todas
//     em voo ao mesmo tempo, alternando entre as duas instâncias.
async function crowd(strategy: string): Promise<Outcome> {
	const key = `${strategy}-${crypto.randomUUID()}`;
	const started = performance.now();
	const responses = await Promise.all(
		Array.from({ length: REQUESTS }, (_, index) => {
			const target = targets[index % targets.length];
			return fetch(new URL(`/hit?strategy=${strategy}&key=${key}`, target));
		}),
	);
	const outcome: Outcome = { admitted: 0, rejected: 0, retryAfter: [], elapsedMs: 0 };
	for (const response of responses) {
		bodySchema.parse(await response.json());
		if (response.status === 200) {
			outcome.admitted += 1;
		} else {
			expect(response.status).toBe(429);
			outcome.rejected += 1;
			outcome.retryAfter.push(response.headers.get("retry-after") ?? "");
		}
	}
	outcome.elapsedMs = performance.now() - started;
	return outcome;
}

describe(`two instances, one Redis, ${REQUESTS} concurrent requests, limit ${env.LIMIT}`, () => {
	// EN: The limit is one shared budget, not one budget per instance: a client that spends
	//     everything through instance A is refused by instance B on the very next request.
	//     Requests go one at a time here, so the outcome does not depend on timing.
	// PT: O limite é um orçamento compartilhado, não um orçamento por instância: um cliente que
	//     gasta tudo pela instância A é recusado pela instância B já na requisição seguinte.
	//     Aqui as requisições vão uma por vez, então o resultado não depende de tempo.
	test("what a client spends on one instance is gone on the other", async () => {
		expect(targets.length).toBe(2);
		const key = `shared-${crypto.randomUUID()}`;
		const hit = (target: URL | undefined): Promise<Response> =>
			fetch(new URL(`/hit?strategy=fixed-window&key=${key}`, target));
		for (let index = 0; index < env.LIMIT; index++) {
			const response = await hit(targets[0]);
			expect(response.status).toBe(200);
			expect(bodySchema.parse(await response.json()).remaining).toBe(env.LIMIT - index - 1);
		}
		const refused = await hit(targets[1]);
		expect(refused.status).toBe(429);
		const body = bodySchema.parse(await refused.json());
		const first = bodySchema.parse(await (await hit(targets[0])).json());
		expect(body.instance).not.toBe(first.instance);
	});

	test("atomic fixed window: the two instances together admit exactly the limit", async () => {
		// EN: Several rounds, each with a fresh client key: a race that shows up once in ten
		//     runs must still be caught.
		// PT: Várias rodadas, cada uma com uma chave de cliente nova: uma corrida que aparece
		//     uma vez em dez execuções ainda precisa ser pega.
		for (let round = 0; round < 5; round++) {
			const outcome = await crowd("fixed-window");
			expect(outcome.admitted).toBe(env.LIMIT);
			expect(outcome.rejected).toBe(REQUESTS - env.LIMIT);
		}
	});

	test("atomic token bucket: never more than the capacity plus what was refilled meanwhile", async () => {
		for (let round = 0; round < 5; round++) {
			const outcome = await crowd("token-bucket");
			const refilled = Math.ceil((outcome.elapsedMs * env.LIMIT) / env.WINDOW_MS);
			expect(outcome.admitted).toBeGreaterThanOrEqual(env.LIMIT);
			expect(outcome.admitted).toBeLessThanOrEqual(env.LIMIT + refilled);
		}
	});

	test("a rejection is a 429 with Retry-After in whole seconds, within the window", async () => {
		const outcome = await crowd("fixed-window");
		expect(outcome.retryAfter.length).toBe(REQUESTS - env.LIMIT);
		for (const value of outcome.retryAfter) {
			expect(value).toMatch(/^[1-9][0-9]*$/);
			expect(Number(value)).toBeLessThanOrEqual(Math.ceil(env.WINDOW_MS / 1000));
		}
	});

	test("naive read-then-write: the same crowd gets more than the limit through", async () => {
		// EN: This is the bug the script fixes. Each Redis command is atomic, but GET followed
		//     by INCR is not: many requests read the counter before anyone has incremented it.
		//     A race depends on timing, and some rounds do admit exactly the limit by luck. So
		//     rounds are repeated until one exceeds it, up to a maximum of twenty.
		// PT: Este é o bug que o script corrige. Cada comando do Redis é atômico, mas GET
		//     seguido de INCR não é: muitas requisições leem o contador antes de alguém incrementá-lo.
		//     Uma corrida depende de tempo, e algumas rodadas admitem exatamente o limite por
		//     sorte. Por isso as rodadas se repetem até uma ultrapassá-lo, no máximo vinte vezes.
		const admitted: number[] = [];
		for (let round = 0; round < 20 && Math.max(0, ...admitted) <= env.LIMIT; round++) {
			admitted.push((await crowd("naive")).admitted);
		}
		console.log(`naive admitted ${admitted.join(", ")} per round, with limit ${env.LIMIT}`);
		expect(Math.max(...admitted)).toBeGreaterThan(env.LIMIT);
	});
});
