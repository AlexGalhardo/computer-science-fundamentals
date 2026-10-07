import type { Matrix, Solution } from "./instance";

// EN: Held-Karp: dynamic programming over subsets. The key observation is that, to extend a
//     partial path, it does not matter in which order its cities were visited. Only two things
//     matter: WHICH cities were visited (a set) and WHERE the path ends. So
//         cost(S, j) = shortest path that starts at city 0, visits exactly the set S, ends at j
//         cost(S, j) = min over k in S \ {j} of  cost(S \ {j}, k) + dist[k][j]
//     There are 2^n sets and n endings, each computed from n candidates: O(n² · 2^n) time and
//     O(n · 2^n) memory. That is still exponential, but far below (n - 1)!: for 20 cities it is
//     about 4·10^8 steps instead of 1.2·10^17. Memory is the new limit.
// PT: Held-Karp: programação dinâmica sobre subconjuntos. A observação central é que, para
//     estender um caminho parcial, não importa em que ordem suas cidades foram visitadas. Só
//     duas coisas importam: QUAIS cidades foram visitadas (um conjunto) e ONDE o caminho termina.
//         cost(S, j) = menor caminho que parte da cidade 0, visita exatamente o conjunto S e termina em j
//         cost(S, j) = mínimo, sobre k em S \ {j}, de  cost(S \ {j}, k) + dist[k][j]
//     São 2^n conjuntos e n finais, cada um calculado a partir de n candidatos: tempo
//     O(n² · 2^n) e memória O(n · 2^n). Ainda é exponencial, mas muito abaixo de (n - 1)!: para
//     20 cidades são cerca de 4·10^8 passos em vez de 1,2·10^17. A memória é o novo limite.
export const HELD_KARP_MAX_CITIES = 22;
const UNREACHED = 0x7fffffff;

export function heldKarp(dist: Matrix): Solution {
	const n = dist.length;
	if (n === 0) {
		return { tour: [], length: 0 };
	}
	if (n === 1) {
		return { tour: [0], length: 0 };
	}
	if (n > HELD_KARP_MAX_CITIES) {
		throw new RangeError(`Held-Karp needs O(n · 2^n) memory: at most ${HELD_KARP_MAX_CITIES} cities`);
	}

	// EN: A set of cities is a bit mask: bit c is 1 when city c + 1 is in the set. City 0 is the
	//     fixed start and is left out, which halves the table. cost[mask * m + j] holds
	//     cost(S, j + 1), and parent[...] remembers the k that gave the minimum.
	// PT: Um conjunto de cidades é uma máscara de bits: o bit c é 1 quando a cidade c + 1 está no
	//     conjunto. A cidade 0 é a partida fixa e fica de fora, o que reduz a tabela à metade.
	//     cost[mask * m + j] guarda cost(S, j + 1), e parent[...] lembra o k que deu o mínimo.
	const m = n - 1;
	const full = (1 << m) - 1;
	const cost = new Int32Array((full + 1) * m).fill(UNREACHED);
	const parent = new Int8Array((full + 1) * m).fill(-1);
	const flat = Int32Array.from(dist.flat());

	for (let j = 0; j < m; j++) {
		cost[(1 << j) * m + j] = flat[j + 1] as number;
	}
	// EN: Masks in increasing numeric order: removing a bit always gives a smaller number, so
	//     every subproblem a mask needs was filled before it. This is the tabulation order.
	// PT: Máscaras em ordem numérica crescente: remover um bit sempre dá um número menor, então
	//     todo subproblema de que uma máscara precisa foi preenchido antes dela. Esta é a ordem
	//     da tabulação.
	for (let mask = 1; mask <= full; mask++) {
		for (let j = 0; j < m; j++) {
			if ((mask & (1 << j)) === 0) {
				continue;
			}
			const previous = mask ^ (1 << j);
			if (previous === 0) {
				continue;
			}
			let best = UNREACHED;
			let bestK = -1;
			for (let k = 0; k < m; k++) {
				if ((previous & (1 << k)) === 0) {
					continue;
				}
				const candidate = (cost[previous * m + k] as number) + (flat[(k + 1) * n + j + 1] as number);
				if (candidate < best) {
					best = candidate;
					bestK = k;
				}
			}
			cost[mask * m + j] = best;
			parent[mask * m + j] = bestK;
		}
	}

	let length = UNREACHED;
	let end = -1;
	for (let j = 0; j < m; j++) {
		const candidate = (cost[full * m + j] as number) + (flat[(j + 1) * n] as number);
		if (candidate < length) {
			length = candidate;
			end = j;
		}
	}

	// EN: Walk the parents backwards from the last city to rebuild the tour.
	// PT: Percorre os pais de trás para frente, a partir da última cidade, para remontar o passeio.
	const tour: number[] = [];
	let mask = full;
	while (end !== -1) {
		tour.push(end + 1);
		const k = parent[mask * m + end] as number;
		mask ^= 1 << end;
		end = k;
	}
	tour.push(0);
	tour.reverse();
	return { tour, length };
}
