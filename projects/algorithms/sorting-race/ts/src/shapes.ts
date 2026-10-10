// EN: `bun run ts/src/shapes.ts [n]` times the six algorithms on the three input shapes
//     (random, sorted, reversed) of the same n values and prints a Markdown table. The
//     cross-language benchmark races only the random shape, to keep it to a few minutes. This
//     script shows the other axis in one language: the same numbers in a different order can
//     change the cost of an algorithm from linear to quadratic, or not change it at all.
// PT: `bun run ts/src/shapes.ts [n]` cronometra os seis algoritmos nos três formatos de entrada
//     (random, sorted, reversed) dos mesmos n valores e imprime uma tabela Markdown. O benchmark
//     entre linguagens corre só o formato aleatório, para caber em poucos minutos. Este script
//     mostra o outro eixo em uma linguagem: os mesmos números em outra ordem podem mudar o
//     custo de um algoritmo de linear para quadrático, ou não mudar nada.
// ES: `bun run ts/src/shapes.ts [n]` cronometra los seis algoritmos en las tres formas de entrada
//     (random, sorted, reversed) de los mismos n valores e imprime una tabla Markdown. El benchmark
//     entre lenguajes corre solo la forma aleatoria, para caber en pocos minutos. Este script
//     muestra el otro eje en un lenguaje: los mismos números en otro orden pueden cambiar el
//     costo de un algoritmo de lineal a cuadrático, o no cambiar nada.

import { existsSync } from "node:fs";
import { dataFile, readValues, VARIANTS } from "./input";
import { SORTS } from "./registry";

const RUNS = 5;
const WARMUP = 2;
const n = Number(process.argv[2] ?? "10000");
if (!Number.isInteger(n) || n < 0 || !VARIANTS.every((variant) => existsSync(dataFile(variant, n)))) {
	console.error(`no input files for n=${process.argv[2] ?? "10000"}. Run: bun run ts/src/generate.ts <n>`);
	process.exit(2);
}

// EN: Median of several runs after a warm-up, with the range next to it. The warm-up lets the
//     JIT compile the hot loops, and the range shows how much the measurement moves.
// PT: Mediana de várias execuções após um aquecimento, com o intervalo ao lado. O aquecimento
//     deixa o JIT compilar os laços quentes, e o intervalo mostra quanto a medida oscila.
// ES: Mediana de varias ejecuciones tras un calentamiento, con el intervalo al lado. El calentamiento
//     deja que el JIT compile los bucles calientes, y el intervalo muestra cuánto oscila la medida.
function measure(sort: (values: readonly number[]) => number[], values: readonly number[]): string {
	const times: number[] = [];
	for (let run = 0; run < WARMUP + RUNS; run++) {
		const start = performance.now();
		sort(values);
		const elapsed = performance.now() - start;
		if (run >= WARMUP) {
			times.push(elapsed);
		}
	}
	times.sort((a, b) => a - b);
	const median = times[Math.floor(times.length / 2)] as number;
	return `${median.toFixed(2)} (${(times[0] as number).toFixed(2)} to ${(times.at(-1) as number).toFixed(2)})`;
}

const inputs = VARIANTS.map((variant) => readValues(dataFile(variant, n), n));

console.log(`# Input shapes, TypeScript, n = ${n.toLocaleString("en-US")}\n`);
console.log(`Median of ${RUNS} runs in milliseconds after ${WARMUP} warm-up runs, with the range in parentheses.`);
console.log("Measured section only (the call to the sort), inside one process.\n");
console.log(`| algorithm | ${VARIANTS.join(" | ")} |`);
console.log(`| --- | ${VARIANTS.map(() => "---:").join(" | ")} |`);
for (const [name, sort] of Object.entries(SORTS)) {
	console.log(`| ${name} | ${inputs.map((values) => measure(sort, values)).join(" | ")} |`);
}
