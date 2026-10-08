// EN: A benchmark is reported with its spread, never as one best run: the middle value says
//     what to expect, and the distance between the fastest and the slowest run says how much
//     to trust it.
// PT: Um benchmark é reportado com a sua dispersão, nunca como uma única melhor execução: o
//     valor do meio diz o que esperar, e a distância entre a execução mais rápida e a mais
//     lenta diz o quanto confiar nele.

export function median(values: number[]): number {
	if (values.length === 0) {
		throw new Error("median of no values");
	}
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const upper = sorted[middle] ?? 0;
	return sorted.length % 2 === 1 ? upper : ((sorted[middle - 1] ?? 0) + upper) / 2;
}

export interface Spread {
	median: number;
	min: number;
	max: number;
	/** (max - min) / median, as a percentage. */
	spreadPercent: number;
}

export function spread(values: number[]): Spread {
	const mid = median(values);
	const min = Math.min(...values);
	const max = Math.max(...values);
	return { median: mid, min, max, spreadPercent: mid === 0 ? 0 : (100 * (max - min)) / mid };
}
