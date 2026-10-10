// EN: A travelling salesman instance: n cities on a 1000 x 1000 grid and the matrix of
//     distances between them. Distances are Euclidean, rounded to integers. Integer distances
//     make the length of a tour exact, so two solvers (or two languages) can be compared with
//     `===` instead of a tolerance.
// PT: Uma instância do caixeiro-viajante: n cidades em uma grade de 1000 x 1000 e a matriz de
//     distâncias entre elas. As distâncias são euclidianas, arredondadas para inteiros.
//     Distâncias inteiras tornam o comprimento de um passeio exato, então dois resolvedores (ou
//     duas linguagens) podem ser comparados com `===` em vez de uma tolerância.
// ES: Una instancia del viajante de comercio: n ciudades en una cuadrícula de 1000 x 1000 y la matriz
//     de distancias entre ellas. Las distancias son euclidianas, redondeadas a enteros.
//     Las distancias enteras hacen exacta la longitud de un recorrido, así que dos solucionadores (o
//     dos lenguajes) pueden compararse con `===` en lugar de una tolerancia.
export type Matrix = readonly (readonly number[])[];

export interface Solution {
	/** Visiting order, starting at city 0. The return to city 0 is implied. */
	tour: number[];
	length: number;
}

export const GRID = 1000;

// EN: Lehmer generator (state * 48271 mod 2^31 - 1). The product stays below 2^53, so
//     JavaScript computes it exactly and Rust produces the same cities from the same seed.
// PT: Gerador de Lehmer (estado * 48271 mod 2^31 - 1). O produto fica abaixo de 2^53, então o
//     JavaScript o calcula de forma exata e o Rust produz as mesmas cidades da mesma semente.
// ES: Generador de Lehmer (estado * 48271 mod 2^31 - 1). El producto queda por debajo de 2^53, así que
//     JavaScript lo calcula de forma exacta y Rust produce las mismas ciudades con la misma semilla.
export function randomInstance(n: number, seed: number): Matrix {
	let state = ((seed * 1000 + n) % 2147483646) + 1;
	const next = (): number => {
		state = (state * 48271) % 2147483647;
		return state;
	};
	const cities = Array.from({ length: n }, () => ({ x: next() % GRID, y: next() % GRID }));
	return cities.map((a) => cities.map((b) => Math.round(Math.hypot(a.x - b.x, a.y - b.y))));
}

export function tourLength(dist: Matrix, tour: readonly number[]): number {
	let total = 0;
	for (let i = 0; i < tour.length; i++) {
		const from = tour[i] as number;
		const to = tour[(i + 1) % tour.length] as number;
		total += (dist[from] as readonly number[])[to] as number;
	}
	return total;
}

// EN: A tour is valid when it starts at city 0 and visits every city exactly once.
// PT: Um passeio é válido quando começa na cidade 0 e visita cada cidade exatamente uma vez.
// ES: Un recorrido es válido cuando empieza en la ciudad 0 y visita cada ciudad exactamente una vez.
export function isValidTour(n: number, tour: readonly number[]): boolean {
	return (
		tour.length === n &&
		(n === 0 || tour[0] === 0) &&
		new Set(tour).size === n &&
		tour.every((c) => c >= 0 && c < n)
	);
}
