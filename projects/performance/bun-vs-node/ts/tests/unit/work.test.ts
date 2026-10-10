import { expect, test } from "bun:test";
import { route } from "../../src/app";
import { countPrimes, simulateIo } from "../../src/work";

const info = { setup: "bun" };

// EN: Known values of the prime-counting function, so the CPU-bound work is real work and every
//     runtime must return the same answer.
// PT: Valores conhecidos da função de contagem de primos, para que o trabalho CPU-bound seja
//     trabalho de verdade e todo runtime precise devolver a mesma resposta.
// ES: Valores conocidos de la función de conteo de primos, para que el trabajo CPU-bound sea trabajo
//     de verdad y todo runtime deba devolver la misma respuesta.
test("countPrimes matches the known counts", () => {
	expect(countPrimes(2)).toBe(0);
	expect(countPrimes(3)).toBe(1);
	expect(countPrimes(100)).toBe(25);
	expect(countPrimes(1_000)).toBe(168);
	expect(countPrimes(10_000)).toBe(1_229);
});

test("simulateIo waits about the requested time", async () => {
	const started = performance.now();
	await simulateIo(30);
	expect(performance.now() - started).toBeGreaterThanOrEqual(25);
});

test("route answers each endpoint with plain data", async () => {
	expect(await route("GET", "/cpu?n=100", info)).toEqual({ status: 200, body: { n: 100, primes: 25 } });
	expect(await route("GET", "/io?ms=1", info)).toEqual({ status: 200, body: { waitedMs: 1 } });
	const health = await route("GET", "/health", info);
	expect(health.body).toMatchObject({ setup: "bun", runtime: "bun", pid: process.pid });
	const memory = await route("GET", "/memory", info);
	expect(memory.body.bytes).toBeGreaterThan(0);
});

// EN: Input from the network is validated: a missing limit would let one request freeze the server.
// PT: A entrada que vem da rede é validada: sem limite, uma requisição congelaria o servidor.
// ES: La entrada que viene de la red se valida: sin límite, una solicitud congelaría el servidor.
test("route rejects invalid input, unknown paths and other methods", async () => {
	expect((await route("GET", "/cpu?n=abc", info)).status).toBe(400);
	expect((await route("GET", "/cpu?n=999999999", info)).status).toBe(400);
	expect((await route("GET", "/io?ms=-1", info)).status).toBe(400);
	expect((await route("GET", "/nope", info)).status).toBe(404);
	expect((await route("POST", "/cpu", info)).status).toBe(405);
});

// EN: The lesson in one test, with no server: while the CPU-bound call runs, the event loop cannot
//     fire a timer that is already due. The timer was set for 1 ms and fires only after the count.
// PT: A lição em um teste, sem servidor: enquanto a chamada CPU-bound executa, o event loop não
//     consegue disparar um timer que já venceu. O timer era de 1 ms e só dispara depois da contagem.
// ES: La lección en una prueba, sin servidor: mientras la llamada CPU-bound se ejecuta, el event loop
//     no puede disparar un temporizador que ya venció. El temporizador era de 1 ms y solo dispara
//     después del conteo.
test("CPU-bound work blocks the event loop", async () => {
	const started = performance.now();
	let timerFiredAt = 0;
	const timer = new Promise<void>((resolve) =>
		setTimeout(() => {
			timerFiredAt = performance.now() - started;
			resolve();
		}, 1),
	);
	countPrimes(400_000);
	const cpuTook = performance.now() - started;
	await timer;
	expect(timerFiredAt).toBeGreaterThanOrEqual(cpuTook);
});
