// EN: `bun run ts/src/bench.ts <solver> <n>` solves the instance of n cities (seed 1) and prints
//     one JSON line in the benchmark contract. The checksum is the length of the tour found:
//     the two exact solvers must print the same value, the heuristics may print a larger one.
// PT: `bun run ts/src/bench.ts <resolvedor> <n>` resolve a instância de n cidades (semente 1) e
//     imprime uma linha JSON no contrato de benchmark. O checksum é o comprimento do passeio
//     encontrado: os dois resolvedores exatos precisam imprimir o mesmo valor, as heurísticas
//     podem imprimir um valor maior.
// ES: `bun run ts/src/bench.ts <resolvedor> <n>` resuelve la instancia de n ciudades (semilla 1) e
//     imprime una línea JSON en el contrato de benchmark. El checksum es la longitud del recorrido
//     encontrado: los dos solucionadores exactos deben imprimir el mismo valor, las heurísticas
//     pueden imprimir un valor mayor.

import { bruteForce } from "./brute-force";
import { HELD_KARP_MAX_CITIES, heldKarp } from "./held-karp";
import { nearestNeighbour, twoOpt } from "./heuristics";
import { type Matrix, randomInstance } from "./instance";

// EN: Brute force gives up after 12 seconds and reports "timeout". Without this cap a single
//     row of 14 cities would take minutes and 16 cities would take days.
// PT: A força bruta desiste após 12 segundos e informa "timeout". Sem esse limite uma única
//     linha de 14 cidades levaria minutos e 16 cidades levariam dias.
// ES: La fuerza bruta se rinde tras 12 segundos e informa "timeout". Sin ese límite una sola
//     fila de 14 ciudades tardaría minutos y 16 ciudades tardarían días.
const BRUTE_FORCE_DEADLINE_MS = 12_000;
const MAX_CITIES = 2000;
const SEED = 1;

const SOLVERS: Readonly<Record<string, (dist: Matrix) => string>> = {
	"brute-force": (dist) => {
		const result = bruteForce(dist, { deadlineMs: BRUTE_FORCE_DEADLINE_MS });
		return result === "timeout" ? "timeout" : String(result.length);
	},
	"held-karp": (dist) => String(heldKarp(dist).length),
	"nearest-neighbour": (dist) => String(nearestNeighbour(dist).length),
	"two-opt": (dist) => String(twoOpt(dist).length),
};

const [implementation = "", size = ""] = process.argv.slice(2);
const solve = SOLVERS[implementation];
const n = Number(size);
const limit = implementation === "held-karp" ? HELD_KARP_MAX_CITIES : MAX_CITIES;
if (solve === undefined || !Number.isInteger(n) || n < 1 || n > limit) {
	console.error(`usage: bench.ts <${Object.keys(SOLVERS).join("|")}> <n from 1 to ${limit}>`);
	process.exit(2);
}

const dist = randomInstance(n, SEED);
const start = performance.now();
const checksum = solve(dist);
const elapsedMs = performance.now() - start;

console.log(
	JSON.stringify({
		n,
		elapsedMs,
		memoryKb: process.resourceUsage().maxRSS,
		language: "ts",
		implementation,
		checksum,
	}),
);
