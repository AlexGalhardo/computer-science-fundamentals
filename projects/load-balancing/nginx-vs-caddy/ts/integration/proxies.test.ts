import { expect, test } from "bun:test";
import { loadConfig, type ProxyName } from "../src/lab/config";
import {
	ALGORITHMS,
	clientAddress,
	type FailureOptions,
	runDistribution,
	runFailure,
	VICTIM,
} from "../src/lab/experiments";

// EN: These tests need the whole stack, so they run only inside docker-compose
//     (`docker compose run --rm lab-test`), on the internal network.
// PT: Estes testes precisam da pilha inteira, então rodam só dentro do docker-compose
//     (`docker compose run --rm lab-test`), na rede interna.
// ES: Estas pruebas necesitan la pila completa, así que corren solo dentro de docker-compose
//     (`docker compose run --rm lab-test`), en la red interna.

const config = loadConfig(process.env);
const PROXIES: ProxyName[] = ["nginx", "caddy"];

for (const proxy of PROXIES) {
	for (const algorithm of ALGORITHMS) {
		test(`${proxy}: ${algorithm} stays within 5 points of the expected shares`, async () => {
			const run = await runDistribution(config, proxy, algorithm);
			expect(run.unanswered).toBe(0);
			expect(run.counts.reduce((sum, count) => sum + count, 0)).toBe(3000);
			expect(run.worst).toBeLessThanOrEqual(0.05);
			if (algorithm === "ip-hash") {
				expect(run.sticky).toEqual({ clients: 500, sticky: 500 });
			}
		});
	}

	test(`${proxy}: the control routes of the instances are not reachable through the proxy`, async () => {
		const response = await fetch(`${config.proxies[proxy]}/control/reset`, { method: "POST" });
		expect(response.status).toBe(404);
		expect(response.headers.get("X-Instance")).toBeNull();
	});
}

// EN: The documented detail of NGINX: only the first three octets of an IPv4 address are
//     hashed, so two clients of the same /24 network always share a server.
// PT: O detalhe documentado do NGINX: só os três primeiros octetos de um endereço IPv4 entram
//     no hash, então dois clientes da mesma rede /24 sempre dividem um servidor.
// ES: El detalle documentado de NGINX: solo los tres primeros octetos de una dirección IPv4
//     entran en el hash, así que dos clientes de la misma red /24 siempre comparten un servidor.
test("nginx: ip_hash sends a whole /24 network to one instance", async () => {
	for (let network = 0; network < 40; network++) {
		const instances = new Set<string | null>();
		for (const host of [1, 77, 254]) {
			const response = await fetch(`${config.proxies.nginx}/iphash`, {
				headers: { "X-Forwarded-For": clientAddress(network, host) },
			});
			instances.add(response.headers.get("X-Instance"));
		}
		expect(instances.size).toBe(1);
	}
});

// EN: A shorter failure run than the one of the report: the failure lasts 3 s inside 7 s.
// PT: Uma execução de falha mais curta que a do relatório: a falha dura 3 s dentro de 7 s.
// ES: Una ejecución de falla más corta que la del informe: la falla dura 3 s dentro de 7 s.
const quick: FailureOptions = {
	ratePerSecond: 100,
	durationMs: 7000,
	outageAtMs: 1500,
	outageMs: 3000,
	timeoutMs: 3000,
	slowMs: 250,
};

test("nginx: the default configuration already hides a crashed instance", async () => {
	const summary = await runFailure(config, "nginx", "default", "crash", quick);
	expect(summary.requests).toBe(700);
	expect(summary.errors).toBe(0);
});

test("caddy: the default configuration keeps sending requests to a crashed instance", async () => {
	const summary = await runFailure(config, "caddy", "default", "crash", quick);
	// One request in three for 3 s at 100 requests per second is about 100 errors.
	expect(summary.errors).toBeGreaterThan(50);
	expect(summary.errors).toBeLessThan(150);
	expect(summary.recoveryMs).toBeGreaterThan(2000);
});

for (const proxy of PROXIES) {
	test(`${proxy}: the tuned configuration loses no request when ${VICTIM} crashes`, async () => {
		const summary = await runFailure(config, proxy, "tuned", "crash", quick);
		expect(summary.requests).toBe(700);
		expect(summary.errors).toBe(0);
	});

	test(`${proxy}: the tuned configuration loses no request when ${VICTIM} freezes`, async () => {
		const summary = await runFailure(config, proxy, "tuned", "freeze", quick);
		expect(summary.errors).toBe(0);
		// Only the requests that found the failure wait for the 1 s timeout.
		expect(summary.slow).toBeLessThan(60);
	});
}
