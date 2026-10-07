import type { Matrix, Solution } from "./instance";

// EN: Brute force: try every visiting order and keep the shortest. Fixing city 0 as the start
//     removes the rotations of the same tour, which leaves (n - 1)! orders. There is no pruning
//     on purpose: this is the baseline that shows where exhaustive search stops being usable.
//     10 cities are 362,880 orders, 13 cities are 479 million, 16 cities are 1.3 trillion.
// PT: Força bruta: tenta toda ordem de visita e fica com a mais curta. Fixar a cidade 0 como
//     partida elimina as rotações do mesmo passeio, o que deixa (n - 1)! ordens. Não há poda de
//     propósito: esta é a linha de base que mostra onde a busca exaustiva deixa de ser usável.
//     10 cidades são 362.880 ordens, 13 cidades são 479 milhões, 16 cidades são 1,3 trilhão.
export interface BruteForceOptions {
	/** Give up after this many milliseconds. The benchmark uses it to cap hopeless sizes. */
	deadlineMs?: number;
}

export function bruteForce(dist: Matrix, options: BruteForceOptions = {}): Solution | "timeout" {
	const n = dist.length;
	if (n === 0) {
		return { tour: [], length: 0 };
	}
	const deadline = options.deadlineMs === undefined ? undefined : performance.now() + options.deadlineMs;
	const current = Array.from({ length: n }, (_, city) => city);
	let best = Number.POSITIVE_INFINITY;
	let bestTour = [...current];
	let leaves = 0;
	let timedOut = false;

	// EN: Positions 0..depth-1 are fixed. Each remaining city takes position `depth` in turn
	//     (swap in, recurse, swap back). `length` is the cost of the fixed prefix.
	// PT: As posições 0..depth-1 estão fixas. Cada cidade restante ocupa a posição `depth` por
	//     vez (troca, recursão, destroca). `length` é o custo do prefixo fixo.
	function permute(depth: number, length: number): void {
		if (timedOut) {
			return;
		}
		const last = current[depth - 1] as number;
		if (depth === n) {
			const total = length + ((dist[last] as readonly number[])[0] as number);
			if (total < best) {
				best = total;
				bestTour = [...current];
			}
			// EN: Reading the clock is slow, so it is checked once every 2^20 complete tours.
			// PT: Ler o relógio é lento, então ele é conferido uma vez a cada 2^20 passeios completos.
			leaves++;
			if (deadline !== undefined && (leaves & 0xfffff) === 0 && performance.now() > deadline) {
				timedOut = true;
			}
			return;
		}
		const row = dist[last] as readonly number[];
		for (let i = depth; i < n; i++) {
			const city = current[i] as number;
			current[i] = current[depth] as number;
			current[depth] = city;
			permute(depth + 1, length + (row[city] as number));
			current[depth] = current[i] as number;
			current[i] = city;
		}
	}

	permute(1, 0);
	return timedOut ? "timeout" : { tour: bestTour, length: best };
}
