// EN: `bun run ts/src/demo.ts` solves 64 random instances of 5 to 12 cities with the exact
//     solver and with the two heuristics, and prints how far each heuristic is from the optimum.
//     This is what a heuristic trades away: it answers in microseconds, and in exchange the
//     answer is "close", not "best".
// PT: `bun run ts/src/demo.ts` resolve 64 instâncias aleatórias de 5 a 12 cidades com o
//     resolvedor exato e com as duas heurísticas, e imprime quão longe cada heurística fica do
//     ótimo. É isso que uma heurística entrega em troca: responde em microssegundos, e em
//     contrapartida a resposta é "perto", não "a melhor".

import { heldKarp } from "./held-karp";
import { nearestNeighbour, twoOpt } from "./heuristics";
import { randomInstance } from "./instance";

export interface Gap {
	n: number;
	seed: number;
	optimum: number;
	nearestNeighbour: number;
	twoOpt: number;
}

export function measureGaps(instancesPerSize: number, sizes: readonly number[]): Gap[] {
	const gaps: Gap[] = [];
	for (const n of sizes) {
		for (let seed = 1; seed <= instancesPerSize; seed++) {
			const dist = randomInstance(n, seed);
			gaps.push({
				n,
				seed,
				optimum: heldKarp(dist).length,
				nearestNeighbour: nearestNeighbour(dist).length,
				twoOpt: twoOpt(dist).length,
			});
		}
	}
	return gaps;
}

if (import.meta.main) {
	const sizes = [5, 6, 7, 8, 9, 10, 11, 12];
	const gaps = measureGaps(8, sizes);
	console.log("| cities | instances | nearest neighbour: mean | worst | 2-opt: mean | worst | 2-opt optimal |");
	console.log("| ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
	const line = (label: string, rows: Gap[]): void => {
		const ratio = (pick: (gap: Gap) => number): number[] => rows.map((gap) => pick(gap) / gap.optimum);
		const mean = (values: number[]): string => (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3);
		const worst = (values: number[]): string => Math.max(...values).toFixed(3);
		const nn = ratio((gap) => gap.nearestNeighbour);
		const opt = ratio((gap) => gap.twoOpt);
		const exact = rows.filter((gap) => gap.twoOpt === gap.optimum).length;
		console.log(
			`| ${label} | ${rows.length} | ${mean(nn)} | ${worst(nn)} | ${mean(opt)} | ${worst(opt)} | ${exact} of ${rows.length} |`,
		);
	};
	for (const n of sizes) {
		line(
			String(n),
			gaps.filter((gap) => gap.n === n),
		);
	}
	line("all", gaps);
}
