// EN: An empirical check of the theorem. A recursive function is generated from (a, b, f), it
//     really runs, and its calls and its work are counted. If the theorem predicts Theta(g(n)),
//     the measured work divided by g(n) must settle on a constant as n grows.
// PT: Uma conferência empírica do teorema. Uma função recursiva é gerada a partir de (a, b, f),
//     ela roda de verdade, e suas chamadas e seu trabalho são contados. Se o teorema prevê
//     Theta(g(n)), o trabalho medido dividido por g(n) precisa se estabilizar em uma constante
//     quando n cresce.
// ES: Una comprobación empírica del teorema. Se genera una función recursiva a partir de (a, b, f),
//     se ejecuta de verdad, y se cuentan sus llamadas y su trabajo. Si el teorema predice
//     Theta(g(n)), el trabajo medido dividido por g(n) debe estabilizarse en una constante
//     a medida que n crece.

import { type Classification, classify, type Recurrence, type RecurrenceInput } from "./classify";
import { drivingCost } from "./tree";

export interface Counters {
	/** How many times the function was called, base cases included. */
	calls: number;
	/** Sum of f(size) over all calls: the total cost T(n). */
	work: number;
}

// EN: Builds the function the recurrence describes: do f(n) of work, then call yourself `a`
//     times on an input of size n / b. Nothing is memoised, so every call of the recursion tree
//     really happens and is counted once.
// PT: Constrói a função que a recorrência descreve: faça f(n) de trabalho, depois chame a si
//     mesma `a` vezes em uma entrada de tamanho n / b. Nada é memoizado, então toda chamada da
//     árvore de recursão acontece de verdade e é contada uma vez.
// ES: Construye la función que describe la recurrencia: haz f(n) de trabajo, luego llámate a ti
//     misma `a` veces con una entrada de tamaño n / b. Nada se memoiza, así que cada llamada del
//     árbol de recursión ocurre de verdad y se cuenta una vez.
export function generateRecursive(recurrence: Recurrence): (n: number) => Counters {
	return (n) => {
		const counters: Counters = { calls: 0, work: 0 };
		const solve = (size: number): void => {
			counters.calls++;
			counters.work += drivingCost(recurrence, size);
			if (size <= 1) {
				return;
			}
			const smaller = Math.floor(size / recurrence.b);
			for (let call = 0; call < recurrence.a; call++) {
				solve(smaller);
			}
		};
		solve(n);
		return counters;
	};
}

export interface Growth {
	power: number;
	logPower: number;
}

// EN: The predicted class as numbers: n^power * (log n)^logPower.
// PT: A classe prevista em números: n^power * (log n)^logPower.
// ES: La clase predicha en números: n^power * (log n)^logPower.
export function predictedGrowth(classification: Classification): Growth | null {
	const { d, k } = classification.recurrence;
	switch (classification.case) {
		case "case-1":
			return { power: classification.criticalExponent, logPower: 0 };
		case "case-2":
			return { power: d, logPower: 1 };
		case "case-3":
			return { power: d, logPower: k };
		default:
			return k > 0 ? { power: d, logPower: k + 1 } : null;
	}
}

function evaluate(growth: Growth, n: number): number {
	return n ** growth.power * Math.log2(n) ** growth.logPower;
}

export interface Sample {
	n: number;
	calls: number;
	work: number;
	/** work / g(n) for the predicted g. */
	ratio: number;
}

export interface EmpiricalReport {
	classification: Classification;
	samples: Sample[];
	/** Relative change of work / g(n) between the two largest sizes, for three candidates. */
	drift: { predicted: number; oneLogLess: number; oneLogMore: number };
	agrees: boolean;
}

// EN: How much work / g(n) still moves between the two largest sizes. For the right g it is
//     close to 0. For a g that is off by even one log factor, the ratio keeps growing or
//     shrinking, so its drift stays clearly larger.
// PT: Quanto work / g(n) ainda se move entre os dois maiores tamanhos. Para a g certa, fica
//     perto de 0. Para uma g errada por um único fator log, a razão continua crescendo ou
//     diminuindo, então sua deriva fica claramente maior.
// ES: Cuánto se sigue moviendo work / g(n) entre los dos tamaños más grandes. Para la g correcta
//     queda cerca de 0. Para una g equivocada por un solo factor log, la razón sigue creciendo o
//     disminuyendo, así que su deriva queda claramente mayor.
function drift(samples: Sample[], growth: Growth): number {
	const last = samples[samples.length - 1];
	const previous = samples[samples.length - 2];
	if (last === undefined || previous === undefined) {
		return Number.POSITIVE_INFINITY;
	}
	const lastRatio = last.work / evaluate(growth, last.n);
	const previousRatio = previous.work / evaluate(growth, previous.n);
	return Math.abs(lastRatio / previousRatio - 1);
}

const MAX_DRIFT = 0.05;

// EN: The sizes are powers of b, so n / b is always exact. The measured growth "agrees" when the
//     predicted class is steadier than its two neighbours, one log factor below and one above.
// PT: Os tamanhos são potências de b, então n / b é sempre exato. O crescimento medido
//     "concorda" quando a classe prevista é mais estável que suas duas vizinhas, um fator log
//     abaixo e um acima.
// ES: Los tamaños son potencias de b, así que n / b siempre es exacto. El crecimiento medido
//     "concuerda" cuando la clase predicha es más estable que sus dos vecinas, un factor log
//     por debajo y uno por encima.
export function empiricalCheck(input: RecurrenceInput, depths: number[]): EmpiricalReport {
	const classification = classify(input);
	const growth = predictedGrowth(classification);
	if (growth === null) {
		throw new Error("there is no predicted class to compare with");
	}
	const run = generateRecursive(classification.recurrence);
	const samples = depths.map((depth) => {
		const n = classification.recurrence.b ** depth;
		const counters = run(n);
		return { n, ...counters, ratio: counters.work / evaluate(growth, n) };
	});
	const result = {
		predicted: drift(samples, growth),
		oneLogLess: drift(samples, { ...growth, logPower: growth.logPower - 1 }),
		oneLogMore: drift(samples, { ...growth, logPower: growth.logPower + 1 }),
	};
	const agrees =
		result.predicted < MAX_DRIFT && result.predicted < result.oneLogLess && result.predicted < result.oneLogMore;
	return { classification, samples, drift: result, agrees };
}
