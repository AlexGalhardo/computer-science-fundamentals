// EN: `bun run ts/src/generate.ts [sizes...]` writes the shared input files in `data/`, one
//     integer per line: `random-<n>.txt`, `sorted-<n>.txt` and `reversed-<n>.txt`. The three
//     shapes hold the same numbers in a different order, so a difference in time between them
//     comes from the order alone. All seven languages read these same files.
// PT: `bun run ts/src/generate.ts [tamanhos...]` escreve os arquivos de entrada compartilhados
//     em `data/`, um inteiro por linha: `random-<n>.txt`, `sorted-<n>.txt` e `reversed-<n>.txt`.
//     Os três formatos têm os mesmos números em ordem diferente, então uma diferença de tempo
//     entre eles vem só da ordem. As sete linguagens leem esses mesmos arquivos.
// ES: `bun run ts/src/generate.ts [tamaños...]` escribe los archivos de entrada compartidos
//     en `data/`, un entero por línea: `random-<n>.txt`, `sorted-<n>.txt` y `reversed-<n>.txt`.
//     Las tres formas tienen los mismos números en distinto orden, así que una diferencia de tiempo
//     entre ellas viene solo del orden. Los siete lenguajes leen esos mismos archivos.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { DATA_DIR, dataFile, randomValues, VARIANTS, type Variant } from "./input";

const SEED = 20_260_101;
const DEFAULT_SIZES = [1_000, 10_000, 100_000, 500_000, 1_000_000];
const MAX_SIZE = 1_000_000;

function parseSizes(args: string[]): number[] {
	if (args.length === 0) {
		return DEFAULT_SIZES;
	}
	return args.map((arg) => {
		const n = Number(arg);
		if (!Number.isInteger(n) || n < 0 || n > MAX_SIZE) {
			throw new Error(`invalid size "${arg}": expected an integer from 0 to ${MAX_SIZE}`);
		}
		return n;
	});
}

function shape(values: number[], variant: Variant): ArrayLike<number> {
	if (variant === "random") {
		return values;
	}
	// EN: The generator is not one of the algorithms under study, so it may use the library sort.
	// PT: O gerador não é um dos algoritmos em estudo, então pode usar a ordenação da biblioteca.
	// ES: El generador no es uno de los algoritmos en estudio, así que puede usar la ordenación de la biblioteca.
	const sorted = Int32Array.from(values).sort();
	return variant === "sorted" ? sorted : sorted.reverse();
}

mkdirSync(DATA_DIR, { recursive: true });
for (const n of parseSizes(process.argv.slice(2))) {
	const values = randomValues(n, SEED);
	for (const variant of VARIANTS) {
		const file = dataFile(variant, n);
		if (existsSync(file)) {
			continue;
		}
		const lines = Array.from(shape(values, variant), String);
		writeFileSync(file, lines.length > 0 ? `${lines.join("\n")}\n` : "");
		console.log(`wrote ${file}`);
	}
}
