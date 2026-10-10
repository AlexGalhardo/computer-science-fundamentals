// EN: The four load profiles of the lesson, as data. A profile is a list of phases, and a phase is
//     "reach this arrival rate (requests per second) and stay there for so many seconds". What
//     makes a test a load, stress, spike or soak test is only the SHAPE of this curve:
//       load   - ramp to the traffic of a normal busy day and hold it: is the system sized for it?
//       stress - keep climbing past the normal traffic, step by step: where does it break?
//       spike  - jump to a multiple of the traffic in one second and come back: does it recover?
//       soak   - hold a constant traffic for a long time: what degrades only with time?
//     This file is plain JavaScript because k6 imports it directly, and the Bun tests and the
//     report import it too, so the three always agree on the shapes.
//     The runs here are scaled down to seconds so the whole demo takes minutes. A real soak test
//     runs for hours: its job is to find leaks and slow growth, which need time to appear.
// PT: Os quatro perfis de carga da lição, como dados. Um perfil é uma lista de fases, e uma fase é
//     "chegue a esta taxa de chegada (requisições por segundo) e fique nela por tantos segundos".
//     O que faz um teste ser de carga, estresse, pico ou resistência é só a FORMA dessa curva:
//       load   - sobe até o tráfego de um dia movimentado normal e mantém: o sistema dá conta?
//       stress - continua subindo além do tráfego normal, degrau por degrau: onde ele quebra?
//       spike  - salta para um múltiplo do tráfego em um segundo e volta: ele se recupera?
//       soak   - mantém um tráfego constante por muito tempo: o que só degrada com o tempo?
//     Este arquivo é JavaScript puro porque o k6 o importa direto, e os testes do Bun e o
//     relatório também o importam, então os três sempre concordam sobre as formas.
//     As execuções aqui são reduzidas a segundos para a demonstração inteira levar minutos. Um
//     teste de resistência real roda por horas: o papel dele é achar vazamentos e crescimento
//     lento, que precisam de tempo para aparecer.
// ES: Los cuatro perfiles de carga de la lección, como datos. Un perfil es una lista de fases, y una
//     fase es "llega a esta tasa de llegada (solicitudes por segundo) y quédate en ella tantos
//     segundos". Lo que hace que una prueba sea de carga, estrés, pico o resistencia es solo la FORMA
//     de esa curva:
//       load   - sube hasta el tráfico de un día ocupado normal y se mantiene: ¿el sistema aguanta?
//       stress - sigue subiendo más allá del tráfico normal, escalón por escalón: ¿dónde se rompe?
//       spike  - salta a un múltiplo del tráfico en un segundo y vuelve: ¿se recupera?
//       soak   - mantiene un tráfico constante durante mucho tiempo: ¿qué se degrada solo con el tiempo?
//     Este archivo es JavaScript puro porque k6 lo importa directamente, y las pruebas de Bun y el
//     reporte también lo importan, así que los tres siempre coinciden sobre las formas.
//     Las ejecuciones aquí se reducen a segundos para que toda la demostración tome minutos. Una
//     prueba de resistencia real corre durante horas: su papel es encontrar fugas y crecimiento
//     lento, que necesitan tiempo para aparecer.

/**
 * @typedef {object} Phase
 * @property {string} name     Tag put on every request sent during the phase.
 * @property {number} seconds  Length of the phase.
 * @property {number} rate     Arrival rate, in requests per second, reached by the phase.
 * @property {boolean} [ramp]  True: climb linearly during the whole phase. False: jump in one second and hold.
 */

/**
 * @typedef {object} Profile
 * @property {string} title
 * @property {number} startRate  Arrival rate at second zero.
 * @property {Phase[]} phases
 */

/** The budget every scenario is judged against. */
export const P95_BUDGET_MS = 250;
export const ERROR_BUDGET = 0.01;

/** @type {Record<"load" | "stress" | "spike" | "soak", Profile>} */
export const PROFILES = {
	load: {
		title: "Load test",
		startRate: 10,
		phases: [
			{ name: "ramp-up", seconds: 5, rate: 150, ramp: true },
			{ name: "steady", seconds: 20, rate: 150 },
			{ name: "ramp-down", seconds: 5, rate: 10, ramp: true },
		],
	},
	stress: {
		title: "Stress test",
		startRate: 50,
		phases: [
			{ name: "050-rps", seconds: 6, rate: 50 },
			{ name: "100-rps", seconds: 6, rate: 100 },
			{ name: "150-rps", seconds: 6, rate: 150 },
			{ name: "200-rps", seconds: 6, rate: 200 },
			{ name: "250-rps", seconds: 6, rate: 250 },
			{ name: "300-rps", seconds: 6, rate: 300 },
		],
	},
	spike: {
		title: "Spike test",
		startRate: 40,
		phases: [
			{ name: "before", seconds: 8, rate: 40 },
			{ name: "spike", seconds: 6, rate: 500 },
			{ name: "recovery", seconds: 16, rate: 40 },
		],
	},
	soak: {
		title: "Soak test",
		startRate: 130,
		phases: [
			{ name: "first-10s", seconds: 10, rate: 130 },
			{ name: "middle", seconds: 40, rate: 130 },
			{ name: "last-10s", seconds: 10, rate: 130 },
		],
	},
};

export const SCENARIOS = /** @type {Array<keyof typeof PROFILES>} */ (Object.keys(PROFILES));

/**
 * Turns the phases into the `stages` of the k6 `ramping-arrival-rate` executor.
 *
 * @param {Profile} profile
 * @returns {Array<{ target: number, duration: string }>}
 */
export function stagesOf(profile) {
	const stages = [];
	for (const phase of profile.phases) {
		if (phase.ramp === true) {
			stages.push({ target: phase.rate, duration: `${phase.seconds}s` });
		} else {
			stages.push({ target: phase.rate, duration: "1s" });
			stages.push({ target: phase.rate, duration: `${phase.seconds - 1}s` });
		}
	}
	return stages;
}

/**
 * Name of the phase that is running `elapsedSeconds` after the start of the scenario.
 *
 * @param {Profile} profile
 * @param {number} elapsedSeconds
 * @returns {string}
 */
export function phaseAt(profile, elapsedSeconds) {
	let end = 0;
	for (const phase of profile.phases) {
		end += phase.seconds;
		if (elapsedSeconds < end) {
			return phase.name;
		}
	}
	return profile.phases[profile.phases.length - 1].name;
}

/**
 * @param {Profile} profile
 * @returns {number}
 */
export function totalSeconds(profile) {
	return profile.phases.reduce((sum, phase) => sum + phase.seconds, 0);
}

/**
 * @param {Profile} profile
 * @returns {number}
 */
export function peakRate(profile) {
	return Math.max(profile.startRate, ...profile.phases.map((phase) => phase.rate));
}

// EN: The capacity of a connection pool, by the utilisation law: `size` connections, each busy
//     for `queryMs` per request, serve at most size / queryMs requests per millisecond. Above
//     that rate the queue for a connection can only grow.
// PT: A capacidade de um pool de conexões, pela lei da utilização: `size` conexões, cada uma
//     ocupada por `queryMs` por requisição, atendem no máximo size / queryMs requisições por
//     milissegundo. Acima dessa taxa a fila por uma conexão só pode crescer.
// ES: La capacidad de un pool de conexiones, según la ley de utilización: `size` conexiones, cada
//     una ocupada `queryMs` por solicitud, atienden como máximo size / queryMs solicitudes por
//     milisegundo. Por encima de esa tasa la cola por una conexión solo puede crecer.
/**
 * @param {number} size
 * @param {number} queryMs
 * @returns {number} requests per second
 */
export function poolCapacity(size, queryMs) {
	return (size * 1000) / queryMs;
}
