import { type Matrix, type Solution, tourLength } from "./instance";

// EN: Nearest neighbour: a greedy heuristic. From the current city always go to the closest
//     city not visited yet. It runs in O(n²) and always returns a valid tour, but it gives no
//     guarantee of quality: the cheap early choices can force long legs at the end.
// PT: Vizinho mais próximo: uma heurística gulosa. Da cidade atual, vai sempre à cidade ainda
//     não visitada mais próxima. Roda em O(n²) e sempre devolve um passeio válido, mas não dá
//     garantia de qualidade: as escolhas baratas do início podem forçar trechos longos no fim.
export function nearestNeighbour(dist: Matrix): Solution {
	const n = dist.length;
	if (n === 0) {
		return { tour: [], length: 0 };
	}
	const visited = new Array<boolean>(n).fill(false);
	const tour = [0];
	visited[0] = true;
	for (let step = 1; step < n; step++) {
		const row = dist[tour[step - 1] as number] as readonly number[];
		let next = -1;
		for (let city = 0; city < n; city++) {
			// EN: The strict `<` keeps the lowest index on a tie, so every language picks the same city.
			// PT: O `<` estrito mantém o menor índice no empate, então toda linguagem escolhe a mesma cidade.
			if (!visited[city] && (next === -1 || (row[city] as number) < (row[next] as number))) {
				next = city;
			}
		}
		visited[next] = true;
		tour.push(next);
	}
	return { tour, length: tourLength(dist, tour) };
}

// EN: 2-opt: local search. Take two legs of the tour, a→b and c→d, and reconnect them as a→c
//     and b→d, which reverses the stretch between b and c. If the tour gets shorter, keep the
//     change. Repeat until no pair of legs improves it. On a plane, this removes every crossing.
//     The result is a local optimum: no single 2-opt move improves it, but a better tour may
//     still exist.
// PT: 2-opt: busca local. Pega dois trechos do passeio, a→b e c→d, e os religa como a→c e b→d,
//     o que inverte o pedaço entre b e c. Se o passeio encurtar, mantém a mudança. Repete até
//     nenhum par de trechos melhorar. No plano, isso remove todo cruzamento. O resultado é um
//     ótimo local: nenhum movimento 2-opt o melhora, mas um passeio melhor ainda pode existir.
export function twoOpt(dist: Matrix, start: readonly number[] = nearestNeighbour(dist).tour): Solution {
	const n = start.length;
	const tour = [...start];
	const d = (from: number, to: number): number => (dist[from] as readonly number[])[to] as number;
	let improved = n >= 4;
	while (improved) {
		improved = false;
		for (let i = 0; i < n - 1; i++) {
			for (let j = i + 2; j < n; j++) {
				if (i === 0 && j === n - 1) {
					continue;
				}
				const a = tour[i] as number;
				const b = tour[i + 1] as number;
				const c = tour[j] as number;
				const e = tour[(j + 1) % n] as number;
				// EN: Only the two legs change, so the gain is computed in O(1).
				// PT: Só os dois trechos mudam, então o ganho é calculado em O(1).
				if (d(a, c) + d(b, e) < d(a, b) + d(c, e)) {
					for (let lo = i + 1, hi = j; lo < hi; lo++, hi--) {
						const tmp = tour[lo] as number;
						tour[lo] = tour[hi] as number;
						tour[hi] = tmp;
					}
					improved = true;
				}
			}
		}
	}
	return { tour, length: tourLength(dist, tour) };
}
