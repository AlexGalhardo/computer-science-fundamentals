// EN: The arithmetic of an objective, as small pure functions. The Prometheus rules in
//     `prometheus/rules.yaml` compute the same things in PromQL; these functions are the
//     reference the tests check them against, and the demo uses them to explain its numbers.
// PT: A aritmética de um objetivo, em pequenas funções puras. As regras do Prometheus em
//     `prometheus/rules.yaml` calculam as mesmas coisas em PromQL; estas funções são a
//     referência contra a qual os testes as conferem, e a demo as usa para explicar os números.

export interface Slo {
	name: string;
	/** Share of good events promised, from 0 to 1. 0.99 means "99% of requests". */
	objective: number;
	/** Burn rate above which the alert pages. */
	burnRateThreshold: number;
}

export const AVAILABILITY: Slo = { name: "availability", objective: 0.99, burnRateThreshold: 14.4 };
export const LATENCY: Slo = { name: "latency", objective: 0.95, burnRateThreshold: 6 };

/** Latency threshold of a good request, in seconds. It is a bucket limit of the histogram. */
export const LATENCY_THRESHOLD_SECONDS = 0.1;

/** The window the objective is promised over, in hours (30 days). */
export const SLO_WINDOW_HOURS = 720;

function assertObjective(objective: number): void {
	if (!(objective > 0 && objective < 1)) {
		throw new Error("an objective must be between 0 and 1, exclusive: 100% leaves no budget");
	}
}

/**
 * The error budget: the share of events that may be bad. 99% leaves 1%.
 *
 * EN: It is a budget because it is meant to be spent: on releases, experiments and the
 *     failures nobody planned. An objective of 100% would leave nothing to spend.
 * PT: É um orçamento porque existe para ser gasto: em lançamentos, experimentos e nas falhas
 *     que ninguém planejou. Um objetivo de 100% não deixaria nada para gastar.
 */
export function errorBudget(objective: number): number {
	assertObjective(objective);
	return 1 - objective;
}

/**
 * Burn rate: how many times faster than "exactly on budget" the budget is being spent.
 *
 * EN: Burn rate 1 spends the whole budget in exactly the window. With a 99% objective, 14.4%
 *     of bad requests is a burn rate of 0.144 / 0.01 = 14.4.
 * PT: Burn rate 1 gasta o orçamento inteiro exatamente na janela. Com objetivo de 99%, 14,4%
 *     de requisições ruins é um burn rate de 0,144 / 0,01 = 14,4.
 */
export function burnRate(badRatio: number, objective: number): number {
	return badRatio / errorBudget(objective);
}

/** Hours until the budget of the whole window is gone, at a constant burn rate. 720 / 14.4 = 50. */
export function hoursToExhaustion(rate: number, windowHours = SLO_WINDOW_HOURS): number {
	return rate <= 0 ? Number.POSITIVE_INFINITY : windowHours / rate;
}

/** Share of the budget spent by burning at `rate` for `hours`. 14.4 for 1 hour = 14.4 / 720 = 2%. */
export function budgetSpent(rate: number, hours: number, windowHours = SLO_WINDOW_HOURS): number {
	return (rate * hours) / windowHours;
}

/** Share of the budget left after `bad` bad events out of `total`. Negative when overspent. */
export function budgetRemaining(bad: number, total: number, objective: number): number {
	if (total === 0) {
		return 1;
	}
	return 1 - bad / total / errorBudget(objective);
}

/**
 * The alert condition: both windows above the threshold.
 *
 * EN: The long window proves that a real part of the budget went, so a short spike does not
 *     page. The short window proves that it is still happening, so the alert stops soon after
 *     the problem does instead of staying on until the long window forgets.
 * PT: A janela longa prova que uma parte real do orçamento se foi, então um pico breve não
 *     aciona ninguém. A janela curta prova que ainda está acontecendo, então o alerta para
 *     logo depois do problema, em vez de continuar até a janela longa esquecer.
 */
export function shouldAlert(longWindowBurn: number, shortWindowBurn: number, threshold: number): boolean {
	return longWindowBurn > threshold && shortWindowBurn > threshold;
}
