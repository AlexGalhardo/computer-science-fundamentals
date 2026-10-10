// EN: `bun run ts/src/bench.ts <algorithm> <variant> <n>` reads `data/<variant>-<n>.txt`, sorts
//     it and prints one JSON line in the benchmark contract. Only the call to the sort is
//     timed: reading and parsing the file would otherwise dominate the fast algorithms.
// PT: `bun run ts/src/bench.ts <algoritmo> <variante> <n>` lê `data/<variante>-<n>.txt`, ordena
//     e imprime uma linha JSON no contrato de benchmark. Só a chamada da ordenação é
//     cronometrada: ler e interpretar o arquivo dominaria o tempo dos algoritmos rápidos.
// ES: `bun run ts/src/bench.ts <algoritmo> <variante> <n>` lee `data/<variante>-<n>.txt`, ordena
//     e imprime una línea JSON en el contrato de benchmark. Solo se cronometra la llamada a la
//     ordenación: leer e interpretar el archivo dominaría el tiempo de los algoritmos rápidos.

import { checksum, dataFile, isVariant, readValues, VARIANTS } from "./input";
import { SORTS } from "./registry";

const [implementation = "", variant = "", size = ""] = process.argv.slice(2);
const sort = SORTS[implementation];
const n = Number(size);
if (sort === undefined || !isVariant(variant) || !Number.isInteger(n) || n < 0) {
	console.error(`usage: bench.ts <${Object.keys(SORTS).join("|")}> <${VARIANTS.join("|")}> <n>`);
	process.exit(2);
}

const values = readValues(dataFile(variant, n), n);

// EN: The sort runs up to 5 times, while the total stays under 300 ms, and the fastest run is
//     reported. Other programs share the machine, and the minimum is the measurement least
//     disturbed by them. A slow sort (bubble at 10,000) runs only once.
// PT: A ordenação roda até 5 vezes, enquanto o total fica abaixo de 300 ms, e a execução mais
//     rápida é informada. Outros programas dividem a máquina, e o mínimo é a medida menos
//     perturbada por eles. Uma ordenação lenta (bubble com 10.000) roda só uma vez.
// ES: La ordenación corre hasta 5 veces, mientras el total se mantiene por debajo de 300 ms, y se
//     informa la ejecución más rápida. Otros programas comparten la máquina, y el mínimo es la
//     medida menos perturbada por ellos. Una ordenación lenta (bubble con 10,000) corre solo una vez.
const MAX_REPETITIONS = 5;
const BUDGET_MS = 300;
let sorted: number[] = [];
let elapsedMs = Number.POSITIVE_INFINITY;
let spentMs = 0;
for (let repetition = 0; repetition < MAX_REPETITIONS && (repetition === 0 || spentMs < BUDGET_MS); repetition++) {
	const start = performance.now();
	sorted = sort(values);
	const elapsed = performance.now() - start;
	elapsedMs = Math.min(elapsedMs, elapsed);
	spentMs += elapsed;
}

console.log(
	JSON.stringify({
		n,
		elapsedMs,
		// EN: maxRSS is the peak resident memory of the process, in kibibytes on Linux.
		// PT: maxRSS é o pico de memória residente do processo, em kibibytes no Linux.
		// ES: maxRSS es el pico de memoria residente del proceso, en kibibytes en Linux.
		memoryKb: process.resourceUsage().maxRSS,
		language: "ts",
		implementation,
		checksum: checksum(sorted),
	}),
);
