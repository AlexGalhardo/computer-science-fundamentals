import { describe, expect, test } from "bun:test";
import { bruteForce } from "../src/brute-force";
import { measureGaps } from "../src/demo";
import { heldKarp } from "../src/held-karp";
import { nearestNeighbour, twoOpt } from "../src/heuristics";
import { isValidTour, type Matrix, randomInstance, tourLength } from "../src/instance";

// EN: The documented factors (see the README). On instances of up to 12 cities the tour of each
//     heuristic is never longer than the optimum times its factor.
// PT: Os fatores documentados (veja o README). Em instâncias de até 12 cidades o passeio de cada
//     heurística nunca é mais longo que o ótimo vezes o seu fator.
// ES: Los factores documentados (mira el README). En instancias de hasta 12 ciudades el recorrido de cada
//     heurística nunca es más largo que el óptimo por su factor.
export const NEAREST_NEIGHBOUR_FACTOR = 1.6;
export const TWO_OPT_FACTOR = 1.2;

// EN: A square of side 10 with a city in the middle of the bottom edge. The best tour walks the
//     perimeter: 5 + 5 + 10 + 10 + 10 = 40.
// PT: Um quadrado de lado 10 com uma cidade no meio da aresta de baixo. O melhor passeio anda
//     pelo perímetro: 5 + 5 + 10 + 10 + 10 = 40.
// ES: Un cuadrado de lado 10 con una ciudad en medio de la arista de abajo. El mejor recorrido anda
//     por el perímetro: 5 + 5 + 10 + 10 + 10 = 40.
const SQUARE: Matrix = (() => {
	const cities = [
		[0, 0],
		[5, 0],
		[10, 0],
		[10, 10],
		[0, 10],
	] as const;
	return cities.map(([ax, ay]) => cities.map(([bx, by]) => Math.round(Math.hypot(ax - bx, ay - by))));
})();

describe("exact solvers", () => {
	test("known instance", () => {
		const brute = bruteForce(SQUARE);
		expect(brute).not.toBe("timeout");
		expect(brute === "timeout" ? -1 : brute.length).toBe(40);
		expect(heldKarp(SQUARE).length).toBe(40);
	});

	test("tiny instances", () => {
		for (const n of [0, 1, 2, 3]) {
			const dist = randomInstance(n, 1);
			const brute = bruteForce(dist);
			const dp = heldKarp(dist);
			expect(brute === "timeout" ? -1 : brute.length).toBe(dp.length);
			expect(isValidTour(n, dp.tour)).toBe(true);
		}
	});

	// EN: The acceptance criterion: brute force and Held-Karp find a tour of the same, optimal
	//     length on every instance of up to 10 cities, and each tour really has that length.
	//     The visiting order itself may differ when two tours tie, or by direction.
	// PT: O critério de aceite: força bruta e Held-Karp acham um passeio do mesmo comprimento,
	//     ótimo, em toda instância de até 10 cidades, e cada passeio tem mesmo esse comprimento.
	//     A ordem de visita em si pode diferir quando dois passeios empatam, ou pelo sentido.
	// ES: El criterio de aceptación: la fuerza bruta y Held-Karp hallan un recorrido de la misma longitud,
	//     óptima, en toda instancia de hasta 10 ciudades, y cada recorrido tiene realmente esa longitud.
	//     El orden de visita en sí puede diferir cuando dos recorridos empatan, o por el sentido.
	test("brute force and Held-Karp agree up to 10 cities", () => {
		for (let n = 2; n <= 10; n++) {
			for (let seed = 1; seed <= (n <= 8 ? 20 : 4); seed++) {
				const dist = randomInstance(n, seed);
				const brute = bruteForce(dist);
				const dp = heldKarp(dist);
				if (brute === "timeout") {
					throw new Error("brute force has no deadline here");
				}
				expect(brute.length).toBe(dp.length);
				expect(isValidTour(n, brute.tour)).toBe(true);
				expect(isValidTour(n, dp.tour)).toBe(true);
				expect(tourLength(dist, brute.tour)).toBe(brute.length);
				expect(tourLength(dist, dp.tour)).toBe(dp.length);
			}
		}
	});

	test("brute force stops at its deadline", () => {
		expect(bruteForce(randomInstance(13, 1), { deadlineMs: 20 })).toBe("timeout");
	});
});

describe("heuristics", () => {
	test("return valid tours", () => {
		for (const n of [1, 2, 3, 4, 12, 60]) {
			const dist = randomInstance(n, 3);
			for (const solution of [nearestNeighbour(dist), twoOpt(dist)]) {
				expect(isValidTour(n, solution.tour)).toBe(true);
				expect(tourLength(dist, solution.tour)).toBe(solution.length);
			}
			expect(twoOpt(dist).length).toBeLessThanOrEqual(nearestNeighbour(dist).length);
		}
	});

	test("stay within the documented factor of the optimum up to 12 cities", () => {
		for (const gap of measureGaps(8, [5, 6, 7, 8, 9, 10, 11, 12])) {
			expect(gap.nearestNeighbour).toBeGreaterThanOrEqual(gap.optimum);
			expect(gap.twoOpt).toBeGreaterThanOrEqual(gap.optimum);
			expect(gap.nearestNeighbour / gap.optimum).toBeLessThanOrEqual(NEAREST_NEIGHBOUR_FACTOR);
			expect(gap.twoOpt / gap.optimum).toBeLessThanOrEqual(TWO_OPT_FACTOR);
		}
	});
});
