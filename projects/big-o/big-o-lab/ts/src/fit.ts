// EN: Curve fitting. Given measured points (n, y), which growth curve explains them best?
//     For each candidate g(n) we look for the straight line y = a + c * g(n) that passes closest
//     to the points, and keep the candidate with the smallest error.
// PT: Ajuste de curvas. Dados pontos medidos (n, y), qual curva de crescimento os explica melhor?
//     Para cada candidata g(n) procuramos a reta y = a + c * g(n) que passa mais perto dos
//     pontos, e ficamos com a candidata de menor erro.
// ES: Ajuste de curvas. Dados unos puntos medidos (n, y), ¿qué curva de crecimiento los explica
//     mejor? Para cada candidata g(n) buscamos la recta y = a + c * g(n) que pasa más cerca de
//     los puntos, y nos quedamos con la candidata de menor error.

import type { ComplexityClass } from "./samples";

export interface Point {
	n: number;
	y: number;
}

export interface Candidate {
	id: ComplexityClass;
	label: string;
	g(n: number): number;
}

// EN: The candidates, from the slowest to the fastest growth. The order matters for ties.
// PT: As candidatas, do crescimento mais lento ao mais rápido. A ordem importa nos empates.
// ES: Las candidatas, del crecimiento más lento al más rápido. El orden importa en los empates.
export const CANDIDATES: Candidate[] = [
	{ id: "constant", label: "O(1)", g: () => 1 },
	{ id: "logarithmic", label: "O(log n)", g: (n) => Math.log2(n) },
	{ id: "linear", label: "O(n)", g: (n) => n },
	{ id: "linearithmic", label: "O(n log n)", g: (n) => n * Math.log2(n) },
	{ id: "quadratic", label: "O(n^2)", g: (n) => n * n },
	{ id: "exponential", label: "O(2^n)", g: (n) => 2 ** n },
];

export interface Fit {
	id: ComplexityClass;
	label: string;
	/** c in y = a + c * g(n). */
	scale: number;
	/** a in y = a + c * g(n). */
	intercept: number;
	/** Root mean square error divided by the mean of y. 0 is a perfect fit. */
	error: number;
}

function mean(values: number[]): number {
	return values.reduce((total, value) => total + value, 0) / values.length;
}

// EN: Ordinary least squares with one variable. The best line through the points (x, y) has
//     slope c = covariance(x, y) / variance(x) and passes through the point of the means.
//     The intercept a absorbs fixed overheads, and the constant c is exactly the constant that
//     Big O notation hides: the fit finds it, the class ignores it.
// PT: Mínimos quadrados com uma variável. A melhor reta pelos pontos (x, y) tem inclinação
//     c = covariância(x, y) / variância(x) e passa pelo ponto das médias. O termo a absorve
//     custos fixos, e a constante c é exatamente a constante que a notação O esconde: o ajuste
//     a encontra, a classe a ignora.
// ES: Mínimos cuadrados con una variable. La mejor recta por los puntos (x, y) tiene pendiente
//     c = covarianza(x, y) / varianza(x) y pasa por el punto de las medias. El término a absorbe
//     costos fijos, y la constante c es exactamente la constante que la notación O esconde: el
//     ajuste la encuentra, la clase la ignora.
export function fitCandidate(points: Point[], candidate: Candidate): Fit {
	const xs = points.map((point) => candidate.g(point.n));
	const ys = points.map((point) => point.y);
	const base = { id: candidate.id, label: candidate.label };
	// EN: 2^n overflows to Infinity for large n. Such a curve cannot describe the data.
	// PT: 2^n estoura para Infinity quando n é grande. Uma curva assim não descreve os dados.
	// ES: 2^n se desborda a Infinity cuando n es grande. Una curva así no describe los datos.
	if (points.length === 0 || xs.some((x) => !Number.isFinite(x))) {
		return { ...base, scale: 0, intercept: 0, error: Number.POSITIVE_INFINITY };
	}
	const meanX = mean(xs);
	const meanY = mean(ys);
	const variance = mean(xs.map((x) => (x - meanX) ** 2));
	const covariance = mean(xs.map((x, index) => (x - meanX) * ((ys[index] ?? 0) - meanY)));
	// EN: With no variance in x (the constant candidate) the line is flat: y = mean of y.
	// PT: Sem variância em x (a candidata constante) a reta é horizontal: y = média de y.
	// ES: Sin varianza en x (la candidata constante) la recta es horizontal: y = media de y.
	const scale = variance === 0 ? 0 : covariance / variance;
	const intercept = meanY - scale * meanX;
	const squaredErrors = xs.map((x, index) => ((ys[index] ?? 0) - (intercept + scale * x)) ** 2);
	const rootMeanSquare = Math.sqrt(mean(squaredErrors));
	// EN: Dividing by the mean of y makes the error relative, so samples that count billions of
	//     operations and samples that count a handful can be read on the same scale.
	// PT: Dividir pela média de y torna o erro relativo, para que amostras que contam bilhões de
	//     operações e amostras que contam meia dúzia sejam lidas na mesma escala.
	// ES: Dividir por la media de y vuelve relativo el error, para que las muestras que cuentan
	//     miles de millones de operaciones y las que cuentan un puñado se lean en la misma escala.
	const error = meanY === 0 ? rootMeanSquare : rootMeanSquare / Math.abs(meanY);
	return { ...base, scale, intercept, error };
}

export interface FitReport {
	best: Fit;
	candidates: Fit[];
}

// EN: A faster-growing curve only wins when it is clearly better. Constant data is fitted
//     perfectly by every candidate (with c = 0), and the honest answer there is the simplest
//     curve, so a tie goes to the candidate that comes first.
// PT: Uma curva de crescimento mais rápido só vence quando é claramente melhor. Dados constantes
//     são ajustados perfeitamente por todas as candidatas (com c = 0), e a resposta honesta
//     nesse caso é a curva mais simples, então o empate fica com a candidata que vem primeiro.
// ES: Una curva de crecimiento más rápido solo gana cuando es claramente mejor. Los datos
//     constantes los ajusta perfectamente cada candidata (con c = 0), y la respuesta honesta ahí
//     es la curva más simple, así que el empate se lo lleva la candidata que viene primero.
const TIE_TOLERANCE = 1e-9;

export function fitCurve(points: Point[]): FitReport {
	const candidates = CANDIDATES.map((candidate) => fitCandidate(points, candidate));
	let best = candidates[0];
	for (const fit of candidates) {
		if (best === undefined || fit.error < best.error - TIE_TOLERANCE) {
			best = fit;
		}
	}
	if (best === undefined) {
		throw new Error("there is no candidate curve");
	}
	return { best, candidates };
}
