import type { OutageMode } from "../api/app";
import {
	countByInstance,
	expectedFromServiceTimes,
	expectedFromWeights,
	type FailureSummary,
	shares,
	stickyClients,
	summariseFailure,
	withinTolerance,
} from "./analysis";
import { INSTANCES, type LabConfig, type ProxyName } from "./config";
import { closedLoop, openLoop } from "./load";

export type Algorithm = "round-robin" | "weighted-round-robin" | "least-connections" | "ip-hash";

export interface AlgorithmPlan {
	/** Path that both proxies publish for this algorithm. */
	route: string;
	/** Artificial service time of api-1, api-2 and api-3 during the run, in ms. */
	serviceTimesMs: [number, number, number];
	expected: number[];
	why: string;
}

// EN: Each algorithm comes with the share it promises. The experiment is only worth something
//     because the expected numbers are written down before the measurement.
// PT: Cada algoritmo vem com a fatia que promete. O experimento só vale alguma coisa porque os
//     números esperados são escritos antes da medição.
// ES: Cada algoritmo viene con la parte que promete. El experimento solo vale algo porque los
//     números esperados se escriben antes de la medición.
export const PLANS: Record<Algorithm, AlgorithmPlan> = {
	"round-robin": {
		route: "/rr",
		serviceTimesMs: [0, 0, 0],
		expected: expectedFromWeights([1, 1, 1]),
		why: "equal weights, one third each",
	},
	"weighted-round-robin": {
		route: "/wrr",
		serviceTimesMs: [0, 0, 0],
		expected: expectedFromWeights([3, 2, 1]),
		why: "weights 3, 2, 1",
	},
	"least-connections": {
		route: "/lc",
		serviceTimesMs: [10, 10, 40],
		expected: expectedFromServiceTimes([10, 10, 40]),
		why: "api-3 takes 40 ms against 10 ms, so shares follow 1/time = 4 : 4 : 1",
	},
	"ip-hash": {
		route: "/iphash",
		serviceTimesMs: [0, 0, 0],
		expected: expectedFromWeights([1, 1, 1]),
		why: "500 clients in 500 different /24 networks, hashed over three instances",
	},
};

export const ALGORITHMS = Object.keys(PLANS) as Algorithm[];

export interface DistributionOptions {
	total: number;
	concurrency: number;
	clients: number;
}

export const DISTRIBUTION_DEFAULTS: DistributionOptions = { total: 3000, concurrency: 30, clients: 500 };

export interface DistributionRun {
	counts: number[];
	shares: number[];
	/** Requests that no instance answered. Any value above 0 makes the run invalid. */
	unanswered: number;
	/** Largest distance from the expected share. */
	worst: number;
	ok: boolean;
	/** Only for ip-hash: how many simulated clients always reached the same instance. */
	sticky?: { clients: number; sticky: number };
}

// EN: Simulated client `n` gets an address in its own /24 network, inside 198.18.0.0/15, the
//     range reserved for benchmarks (RFC 2544), which is never a real host. One /24 per client
//     matters: NGINX hashes only the first three octets of an IPv4 address, so clients in the
//     same /24 would count as one.
// PT: O cliente simulado `n` recebe um endereço em sua própria rede /24, dentro de
//     198.18.0.0/15, a faixa reservada para benchmarks (RFC 2544), que nunca é um host real.
//     Um /24 por cliente importa: o NGINX faz o hash só dos três primeiros octetos de um
//     endereço IPv4, então clientes no mesmo /24 contariam como um só.
// ES: El cliente simulado `n` recibe una dirección en su propia red /24, dentro de
//     198.18.0.0/15, el rango reservado para benchmarks (RFC 2544), que nunca es un host real.
//     Un /24 por cliente importa: NGINX hace el hash solo de los tres primeros octetos de una
//     dirección IPv4, así que clientes en el mismo /24 contarían como uno solo.
export function clientAddress(client: number, host = 10): string {
	return `198.${18 + ((client >> 8) & 1)}.${client & 255}.${host}`;
}

async function post(url: string): Promise<void> {
	const response = await fetch(url, { method: "POST", signal: AbortSignal.timeout(5000) });
	if (!response.ok) {
		throw new Error(`${url} answered ${response.status}`);
	}
	await response.arrayBuffer();
}

async function prepareInstances(config: LabConfig, serviceTimesMs: number[]): Promise<void> {
	await Promise.all(
		config.apis.map(async (api, index) => {
			await post(`${api}/control/reset`);
			await post(`${api}/control/delay?ms=${serviceTimesMs[index] ?? 0}`);
		}),
	);
}

export async function runDistribution(
	config: LabConfig,
	proxy: ProxyName,
	algorithm: Algorithm,
	options: DistributionOptions = DISTRIBUTION_DEFAULTS,
): Promise<DistributionRun> {
	const plan = PLANS[algorithm];
	await waitForFullRotation(`${config.proxies[proxy]}${plan.route}`);
	await prepareInstances(config, plan.serviceTimesMs);
	const clientOf = (index: number): number => index % options.clients;
	const samples = await closedLoop({
		url: `${config.proxies[proxy]}${plan.route}`,
		total: options.total,
		concurrency: options.concurrency,
		// EN: The lab network is trusted by both proxies, so this header plays the role of the
		//     client address. On the internet a proxy must never believe it from a stranger.
		// PT: A rede do laboratório é confiável para os dois proxies, então este cabeçalho faz
		//     o papel do endereço do cliente. Na internet um proxy nunca deve acreditar nele
		//     vindo de um desconhecido.
		// ES: La red del laboratorio es de confianza para los dos proxies, así que este encabezado
		//     hace el papel de la dirección del cliente. En internet un proxy nunca debe creerle
		//     a un desconocido.
		headers:
			algorithm === "ip-hash" ? (index) => ({ "X-Forwarded-For": clientAddress(clientOf(index)) }) : undefined,
	});
	await prepareInstances(config, [0, 0, 0]);
	const counts = countByInstance(samples, INSTANCES);
	const observed = shares(counts);
	const check = withinTolerance(observed, plan.expected);
	const unanswered = samples.filter((sample) => sample.instance === null).length;
	const run: DistributionRun = {
		counts,
		shares: observed,
		unanswered,
		worst: check.worst,
		ok: check.ok && unanswered === 0,
	};
	if (algorithm === "ip-hash") {
		run.sticky = stickyClients(
			samples.map((sample) => ({ client: String(clientOf(sample.index)), instance: sample.instance })),
		);
		run.ok = run.ok && run.sticky.sticky === run.sticky.clients;
	}
	return run;
}

export type FailureConfig = "default" | "tuned";

export const FAILURE_ROUTES: Record<FailureConfig, string> = { default: "/rr", tuned: "/tuned" };

export interface FailureOptions {
	ratePerSecond: number;
	durationMs: number;
	outageAtMs: number;
	outageMs: number;
	/** The client gives up after this long, and the request counts as an error. */
	timeoutMs: number;
	slowMs: number;
}

export const FAILURE_DEFAULTS: FailureOptions = {
	ratePerSecond: 100,
	durationMs: 14_000,
	outageAtMs: 2000,
	outageMs: 4000,
	timeoutMs: 3000,
	slowMs: 250,
};

export const VICTIM = "api-3";

// EN: A run must start with the three instances in rotation. After a failure a proxy can keep
//     an instance out for several seconds, so the lab waits until all three have answered.
// PT: Uma execução precisa começar com as três instâncias em rotação. Depois de uma falha um
//     proxy pode manter uma instância fora por vários segundos, então o laboratório espera até
//     as três terem respondido.
// ES: Una ejecución debe empezar con las tres instancias en rotación. Tras una falla un proxy puede
//     mantener una instancia fuera durante varios segundos, así que el laboratorio espera hasta
//     que las tres hayan respondido.
export async function waitForFullRotation(url: string, timeoutMs = 30_000): Promise<void> {
	const deadline = performance.now() + timeoutMs;
	while (performance.now() < deadline) {
		// Different client addresses, so that a hash route can reach the three instances too.
		const samples = await closedLoop({
			url,
			total: 60,
			concurrency: 3,
			timeoutMs: 2000,
			headers: (index) => ({ "X-Forwarded-For": clientAddress(index) }),
		});
		const allOk = samples.every((sample) => sample.status === 200);
		if (allOk && countByInstance(samples, INSTANCES).every((count) => count > 0)) {
			return;
		}
		await Bun.sleep(250);
	}
	throw new Error(`${url}: the three instances were not in rotation after ${timeoutMs} ms`);
}

export async function runFailure(
	config: LabConfig,
	proxy: ProxyName,
	failureConfig: FailureConfig,
	mode: OutageMode,
	options: FailureOptions = FAILURE_DEFAULTS,
): Promise<FailureSummary> {
	const url = `${config.proxies[proxy]}${FAILURE_ROUTES[failureConfig]}`;
	const victimUrl = config.apis[INSTANCES.indexOf(VICTIM)];
	await prepareInstances(config, [0, 0, 0]);
	await waitForFullRotation(url);
	const { samples, eventAtMs } = await openLoop({
		url,
		ratePerSecond: options.ratePerSecond,
		durationMs: options.durationMs,
		timeoutMs: options.timeoutMs,
		event: {
			atMs: options.outageAtMs,
			run: () => post(`${victimUrl}/control/outage?mode=${mode}&ms=${options.outageMs}`),
		},
	});
	const outageStartMs = eventAtMs ?? options.outageAtMs;
	return summariseFailure(samples, {
		outageStartMs,
		outageEndMs: outageStartMs + options.outageMs,
		victim: VICTIM,
		slowMs: options.slowMs,
	});
}
