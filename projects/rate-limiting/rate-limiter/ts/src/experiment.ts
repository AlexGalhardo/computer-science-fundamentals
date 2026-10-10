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
// ES: El experimento de ráfaga. La MISMA lista de instantes de llegada se entrega a todos los
//     algoritmos, todos configurados como "10 solicitudes por segundo", y registramos cuáles
//     solicitudes admite cada uno. Es una simulación con reloj inyectado: nada espera, nada
//     depende de la máquina, y ejecutarla dos veces da los mismos números.

export const EXPERIMENT_CONFIG = { limit: 10, windowMs: 1000, binMs: 100, durationMs: 8000 } as const;

export interface Phase {
	id: string;
	fromMs: number;
	toMs: number;
	label: { en: string; pt: string; es: string };
}

// EN: Four phases, each built to expose one behaviour.
// PT: Quatro fases, cada uma montada para expor um comportamento.
// ES: Cuatro fases, cada una armada para exponer un comportamiento.
export const PHASES: readonly Phase[] = [
	{
		id: "calm",
		fromMs: 0,
		toMs: 1000,
		label: { en: "under the limit", pt: "abaixo do limite", es: "bajo el límite" },
	},
	{
		id: "boundary",
		fromMs: 1000,
		toMs: 3000,
		label: { en: "burst across a boundary", pt: "rajada na fronteira", es: "ráfaga en la frontera" },
	},
	{
		id: "overload",
		fromMs: 3000,
		toMs: 6000,
		label: { en: "sustained overload", pt: "sobrecarga contínua", es: "sobrecarga continua" },
	},
	{
		id: "instant",
		fromMs: 6000,
		toMs: 8000,
		label: {
			en: "instant burst after silence",
			pt: "rajada instantânea após silêncio",
			es: "ráfaga instantánea tras el silencio",
		},
	},
];

export function buildTraffic(): number[] {
	const arrivals: number[] = [];
	// EN: Calm: 5 requests in the first second, half the limit. Everyone must admit them all.
	// PT: Calmaria: 5 requisições no primeiro segundo, metade do limite. Todos devem admitir tudo.
	// ES: Calma: 5 solicitudes en el primer segundo, la mitad del límite. Todos deben admitirlo todo.
	for (let t = 100; t < 1000; t += 200) {
		arrivals.push(t);
	}
	// EN: Boundary burst: 10 requests in the last 100 ms of one fixed window and 10 in the
	//     first 100 ms of the next. Twenty requests in 200 ms, twice the limit.
	// PT: Rajada na fronteira: 10 requisições nos últimos 100 ms de uma janela fixa e 10 nos
	//     primeiros 100 ms da seguinte. Vinte requisições em 200 ms, o dobro do limite.
	// ES: Ráfaga en la frontera: 10 solicitudes en los últimos 100 ms de una ventana fija y 10 en
	//     los primeros 100 ms de la siguiente. Veinte solicitudes en 200 ms, el doble del límite.
	for (let t = 1900; t < 2100; t += 10) {
		arrivals.push(t);
	}
	// EN: Sustained overload: 20 requests per second for two seconds, twice the limit.
	// PT: Sobrecarga contínua: 20 requisições por segundo durante dois segundos, o dobro do limite.
	// ES: Sobrecarga continua: 20 solicitudes por segundo durante dos segundos, el doble del límite.
	for (let t = 3000; t < 5000; t += 50) {
		arrivals.push(t);
	}
	// EN: Instant burst: after two silent seconds, 15 requests in the same millisecond.
	// PT: Rajada instantânea: depois de dois segundos de silêncio, 15 requisições no mesmo milissegundo.
	// ES: Ráfaga instantánea: tras dos segundos de silencio, 15 solicitudes en el mismo milisegundo.
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
// ES: La medida honesta de un limitador no es "cuántas por segundo del reloj", sino "cuántas en
//     el peor intervalo de una ventana, empiece donde empiece". Cada evento se prueba como inicio
//     de uno de esos intervalos, [t, t + W).
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
	// ES: Una serie más para el leaky bucket: CUÁNDO salen de la cola sus solicitudes admitidas.
	//     La admisión se parece a la del token bucket; el suavizado aparece en las salidas.
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
