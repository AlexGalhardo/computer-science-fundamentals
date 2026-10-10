// EN: The experiment itself: run every sample at every size, record the operation count and the
//     time, and fit a curve to the counts.
// PT: O experimento em si: roda cada amostra em cada tamanho, registra a contagem de operações e
//     o tempo, e ajusta uma curva às contagens.
// ES: El experimento en sí: ejecuta cada muestra en cada tamaño, registra el conteo de operaciones
//     y el tiempo, y ajusta una curva a los conteos.

import { type FitReport, fitCurve } from "./fit";
import { type ComplexityClass, SAMPLES, type Sample } from "./samples";

export interface Measurement {
	n: number;
	/** Operations counted by the instrumented algorithm. */
	operations: number;
	/** Operations predicted by the closed formula. */
	expected: number;
	/** Median wall-clock time of the algorithm alone, in milliseconds. */
	timeMs: number;
}

export interface SampleReport {
	id: ComplexityClass;
	title: string;
	operation: string;
	formula: string;
	points: Measurement[];
	fit: FitReport;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[sorted.length >> 1] ?? 0;
}

// EN: Time is noisy: the garbage collector, the JIT compiler and other processes all interfere.
//     So the same input runs several times and the median is kept, which ignores the odd slow
//     run. The operation count needs none of this: it is the same on every run and every machine.
// PT: Tempo tem ruído: o coletor de lixo, o compilador JIT e outros processos interferem. Por
//     isso a mesma entrada roda várias vezes e fica a mediana, que ignora a execução lenta
//     ocasional. A contagem de operações não precisa disso: é igual em toda execução e máquina.
// ES: El tiempo tiene ruido: el recolector de basura, el compilador JIT y otros procesos
//     interfieren. Por eso la misma entrada se ejecuta varias veces y nos quedamos con la
//     mediana, que ignora la ejecución lenta ocasional. El conteo de operaciones no necesita
//     esto: es igual en toda ejecución y en toda máquina.
export function measure(sample: Sample, n: number, repetitions: number): Measurement {
	const input = sample.prepare(n);
	const times: number[] = [];
	let operations = 0;
	for (let repetition = 0; repetition < repetitions; repetition++) {
		const start = performance.now();
		operations = sample.run(input).operations;
		times.push(performance.now() - start);
	}
	return { n, operations, expected: sample.formula(n), timeMs: median(times) };
}

export function runSample(sample: Sample, repetitions = 5): SampleReport {
	const points = sample.sizes.map((n) => measure(sample, n, repetitions));
	return {
		id: sample.id,
		title: sample.title,
		operation: sample.operation,
		formula: sample.formulaText,
		points,
		fit: fitCurve(points.map((point) => ({ n: point.n, y: point.operations }))),
	};
}

export function runLab(repetitions = 5): SampleReport[] {
	return SAMPLES.map((sample) => runSample(sample, repetitions));
}
