import type { Sample } from "./load";

// EN: Pure functions that turn samples into the numbers of the report. Nothing here touches the
//     network, so all of it is unit tested.
// PT: Funções puras que transformam amostras nos números do relatório. Nada aqui toca a rede,
//     então tudo é testado com testes unitários.

/** Acceptance criterion of the mini-project: observed share within 5 percentage points. */
export const TOLERANCE = 0.05;

export function countByInstance(samples: Sample[], instances: readonly string[]): number[] {
	return instances.map((name) => samples.filter((sample) => sample.instance === name).length);
}

export function shares(counts: number[]): number[] {
	const total = counts.reduce((sum, count) => sum + count, 0);
	return counts.map((count) => (total === 0 ? 0 : count / total));
}

// EN: Round robin and its weighted form promise a share proportional to the weight:
//     weights 3, 2, 1 mean 3/6, 2/6 and 1/6 of the requests.
// PT: O round robin e sua forma ponderada prometem uma fatia proporcional ao peso:
//     pesos 3, 2, 1 significam 3/6, 2/6 e 1/6 das requisições.
export function expectedFromWeights(weights: number[]): number[] {
	return shares(weights);
}

// EN: Least connections under a closed loop keeps the same number of requests in flight on
//     every instance. An instance that holds k requests and takes t ms for each finishes
//     k / t requests per ms, so the shares are proportional to 1 / t. With 10, 10 and 40 ms:
//     1/10 : 1/10 : 1/40 = 4 : 4 : 1, so the slow instance serves 1/9 of the requests.
// PT: O least connections em laço fechado mantém o mesmo número de requisições em andamento em
//     cada instância. Uma instância que segura k requisições e leva t ms em cada uma termina
//     k / t requisições por ms, então as fatias são proporcionais a 1 / t. Com 10, 10 e 40 ms:
//     1/10 : 1/10 : 1/40 = 4 : 4 : 1, então a instância lenta atende 1/9 das requisições.
export function expectedFromServiceTimes(serviceTimesMs: number[]): number[] {
	return shares(serviceTimesMs.map((time) => 1 / time));
}

export interface ToleranceCheck {
	ok: boolean;
	/** Largest distance between an observed and an expected share, as a fraction of 1. */
	worst: number;
}

export function withinTolerance(observed: number[], expected: number[], tolerance = TOLERANCE): ToleranceCheck {
	const worst = Math.max(...observed.map((share, index) => Math.abs(share - (expected[index] ?? 0))));
	return { ok: worst <= tolerance, worst };
}

// EN: A hash policy makes two promises. Stickiness: one client always reaches the same
//     instance. Spread: many different clients are divided among the instances. This function
//     checks the first promise. `clientOf` says which simulated client sent request `index`.
// PT: Uma política de hash faz duas promessas. Fixação: um cliente sempre chega à mesma
//     instância. Espalhamento: muitos clientes diferentes são divididos entre as instâncias.
//     Esta função confere a primeira promessa. `clientOf` diz qual cliente simulado mandou a
//     requisição `index`.
export function stickyClients(pairs: { client: string; instance: string | null }[]): {
	clients: number;
	sticky: number;
} {
	const seen = new Map<string, Set<string | null>>();
	for (const pair of pairs) {
		const instances = seen.get(pair.client) ?? new Set();
		instances.add(pair.instance);
		seen.set(pair.client, instances);
	}
	const sticky = [...seen.values()].filter((instances) => instances.size === 1 && !instances.has(null)).length;
	return { clients: seen.size, sticky };
}

export interface FailureWindow {
	/** When the instance was broken and when it came back, in ms since the start of the run. */
	outageStartMs: number;
	outageEndMs: number;
	victim: string;
	/** A request slower than this was hurt by the failure even when it ended with 200. */
	slowMs: number;
}

export interface FailureSummary {
	requests: number;
	/** No answer, or an answer that is not 200. */
	errors: number;
	/** Answered with 200, but slower than `slowMs`. */
	slow: number;
	/** From the failure to the start of the last request that was lost or slow. 0 when none. */
	recoveryMs: number;
	/** From the return of the instance to its first answer. null when it got no traffic again. */
	backInRotationMs: number | null;
}

// EN: "Recovery time" needs a definition that a program can check. Here: the clients stopped
//     noticing the failure after the last request that failed or was slow, so recovery is the
//     distance from the failure to the moment that request was sent.
// PT: "Tempo de recuperação" precisa de uma definição que um programa consiga conferir. Aqui:
//     os clientes pararam de perceber a falha depois da última requisição que falhou ou ficou
//     lenta, então a recuperação é a distância da falha até o momento em que essa requisição
//     foi enviada.
export function summariseFailure(samples: Sample[], window: FailureWindow): FailureSummary {
	const failed = (sample: Sample): boolean => sample.status !== 200;
	const slow = (sample: Sample): boolean => sample.status === 200 && sample.latencyMs > window.slowMs;
	const hurt = samples.filter((sample) => sample.startMs >= window.outageStartMs && (failed(sample) || slow(sample)));
	const lastHurt = Math.max(0, ...hurt.map((sample) => sample.startMs - window.outageStartMs));
	const back = samples
		.filter((sample) => sample.instance === window.victim && sample.startMs >= window.outageEndMs)
		.map((sample) => sample.startMs - window.outageEndMs);
	return {
		requests: samples.length,
		errors: samples.filter(failed).length,
		slow: samples.filter(slow).length,
		recoveryMs: Math.round(lastHurt),
		backInRotationMs: back.length === 0 ? null : Math.round(Math.min(...back)),
	};
}

export interface Spread {
	median: number;
	min: number;
	max: number;
}

// EN: One run on a shared machine proves little. Every number of the report is the median of
//     several runs, shown with the smallest and the largest value.
// PT: Uma execução em máquina compartilhada prova pouco. Todo número do relatório é a mediana
//     de várias execuções, mostrada com o menor e o maior valor.
export function spread(values: number[]): Spread {
	if (values.length === 0) {
		throw new Error("spread of no values");
	}
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 1
			? (sorted[middle] as number)
			: ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
	return { median, min: sorted[0] as number, max: sorted[sorted.length - 1] as number };
}
