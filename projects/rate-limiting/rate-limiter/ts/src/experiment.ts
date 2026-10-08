import { createLimiter } from "./factory";
import { LeakyBucket } from "./leaky-bucket";
import { ALGORITHMS, type LimiterConfig } from "./limiter";

// EN: The burst experiment. The SAME list of arrival times is given to every algorithm, all
//     configured as "10 requests per second", and we record which requests each one admits.
//     It is a simulation with an injected clock: nothing sleeps, nothing depends on the
//     machine, and running it twice gives the same numbers.
// PT: O experimento de rajada. A MESMA lista de instantes de chegada é entregue a todos os
//     algoritmos, todos configurados como "10 requisições por segundo", e registramos quais
//     requisições cada um admite. É uma simulação com relógio injetado: nada espera, nada
//     depende da máquina, e rodar duas vezes dá os mesmos números.

export const EXPERIMENT_CONFIG = { limit: 10, windowMs: 1000, binMs: 100, durationMs: 8000 } as const;

export interface Phase {
	id: string;
	fromMs: number;
	toMs: number;
	label: { en: string; pt: string };
}

// EN: Four phases, each built to expose one behaviour.
// PT: Quatro fases, cada uma montada para expor um comportamento.
export const PHASES: readonly Phase[] = [
	{ id: "calm", fromMs: 0, toMs: 1000, label: { en: "under the limit", pt: "abaixo do limite" } },
	{ id: "boundary", fromMs: 1000, toMs: 3000, label: { en: "burst across a boundary", pt: "rajada na fronteira" } },
	{ id: "overload", fromMs: 3000, toMs: 6000, label: { en: "sustained overload", pt: "sobrecarga contínua" } },
	{
		id: "instant",
		fromMs: 6000,
		toMs: 8000,
		label: { en: "instant burst after silence", pt: "rajada instantânea após silêncio" },
	},
];

export function buildTraffic(): number[] {
	const arrivals: number[] = [];
	// EN: Calm: 5 requests in the first second, half the limit. Everyone must admit them all.
	// PT: Calmaria: 5 requisições no primeiro segundo, metade do limite. Todos devem admitir tudo.
	for (let t = 100; t < 1000; t += 200) {
		arrivals.push(t);
	}
	// EN: Boundary burst: 10 requests in the last 100 ms of one fixed window and 10 in the
	//     first 100 ms of the next. Twenty requests in 200 ms, twice the limit.
	// PT: Rajada na fronteira: 10 requisições nos últimos 100 ms de uma janela fixa e 10 nos
	//     primeiros 100 ms da seguinte. Vinte requisições em 200 ms, o dobro do limite.
	for (let t = 1900; t < 2100; t += 10) {
		arrivals.push(t);
	}
	// EN: Sustained overload: 20 requests per second for two seconds, twice the limit.
	// PT: Sobrecarga contínua: 20 requisições por segundo durante dois segundos, o dobro do limite.
	for (let t = 3000; t < 5000; t += 50) {
		arrivals.push(t);
	}
	// EN: Instant burst: after two silent seconds, 15 requests in the same millisecond.
	// PT: Rajada instantânea: depois de dois segundos de silêncio, 15 requisições no mesmo milissegundo.
	for (let i = 0; i < 15; i++) {
		arrivals.push(7000);
	}
	return arrivals;
}

export interface Series {
	id: string;
	/** Events (admissions, or departures for the leaky bucket output) in each time bin. */
	perBin: number[];
	perPhase: number[];
	total: number;
	/** The largest number of events inside any interval of one window: the real burst let through. */
	peakPerWindow: number;
}

export interface ExperimentResult {
	config: typeof EXPERIMENT_CONFIG;
	phases: readonly Phase[];
	offered: Series;
	series: Series[];
}

// EN: The honest measure of a limiter is not "how many per calendar second" but "how many in
//     the worst interval of one window, wherever it starts". Every event is tried as the start
//     of such an interval [t, t + W).
// PT: A medida honesta de um limitador não é "quantas por segundo do relógio", e sim "quantas
//     no pior intervalo de uma janela, comece onde começar". Cada evento é testado como início
//     de um intervalo desses, [t, t + W).
export function peakPerWindow(times: readonly number[], windowMs: number): number {
	let peak = 0;
	let end = 0;
	for (let start = 0; start < times.length; start++) {
		const from = times[start] ?? 0;
		while (end < times.length && (times[end] ?? 0) < from + windowMs) {
			end += 1;
		}
		peak = Math.max(peak, end - start);
	}
	return peak;
}

function summarise(id: string, times: readonly number[]): Series {
	const { binMs, durationMs, windowMs } = EXPERIMENT_CONFIG;
	const perBin = new Array<number>(durationMs / binMs).fill(0);
	for (const time of times) {
		const bin = Math.floor(time / binMs);
		perBin[bin] = (perBin[bin] ?? 0) + 1;
	}
	const sorted = [...times].sort((a, b) => a - b);
	return {
		id,
		perBin,
		perPhase: PHASES.map((phase) => times.filter((time) => time >= phase.fromMs && time < phase.toMs).length),
		total: times.length,
		peakPerWindow: peakPerWindow(sorted, windowMs),
	};
}

export function runExperiment(): ExperimentResult {
	const config: LimiterConfig = { limit: EXPERIMENT_CONFIG.limit, windowMs: EXPERIMENT_CONFIG.windowMs };
	const traffic = buildTraffic();
	const series = ALGORITHMS.map((algorithm) => {
		const limiter = createLimiter(algorithm, config);
		return summarise(
			algorithm,
			traffic.filter((time) => limiter.allow(time)),
		);
	});
	// EN: One extra series for the leaky bucket: WHEN its admitted requests leave the queue.
	//     Admission looks like the token bucket; the departures are where the smoothing shows.
	// PT: Uma série a mais para o leaky bucket: QUANDO as requisições admitidas saem da fila.
	//     A admissão se parece com a do token bucket; é nas saídas que a suavização aparece.
	const shaper = new LeakyBucket(config);
	const departures: number[] = [];
	for (const time of traffic) {
		const departAt = shaper.schedule(time);
		if (departAt !== null) {
			departures.push(departAt);
		}
	}
	series.push(summarise("leaky-bucket-output", departures));
	return { config: EXPERIMENT_CONFIG, phases: PHASES, offered: summarise("offered", traffic), series };
}
