import { readFileSync } from "node:fs";
import { join } from "node:path";

export const VARIANTS = ["random", "sorted", "reversed"] as const;
export type Variant = (typeof VARIANTS)[number];

export const MAX_VALUE = 2 ** 31 - 1;
export const DATA_DIR = "data";

export function isVariant(value: string): value is Variant {
	return (VARIANTS as readonly string[]).includes(value);
}

export function dataFile(variant: Variant, n: number): string {
	return join(DATA_DIR, `${variant}-${n}.txt`);
}

// EN: xorshift32, a tiny pseudo-random generator. The same seed always produces the same
//     sequence, so every language and every run sorts exactly the same numbers. Without a fixed
//     seed two benchmark runs would not be comparable.
// PT: xorshift32, um gerador pseudoaleatório minúsculo. A mesma semente sempre produz a mesma
//     sequência, então toda linguagem e toda execução ordenam exatamente os mesmos números. Sem
//     semente fixa, duas execuções do benchmark não seriam comparáveis.
// ES: xorshift32, un generador pseudoaleatorio minúsculo. La misma semilla siempre produce la misma
//     secuencia, así que todo lenguaje y toda ejecución ordenan exactamente los mismos números. Sin
//     semilla fija, dos ejecuciones del benchmark no serían comparables.
export function randomValues(n: number, seed: number): number[] {
	let state = seed >>> 0 || 1;
	const values = new Array<number>(n);
	for (let i = 0; i < n; i++) {
		state ^= state << 13;
		state >>>= 0;
		state ^= state >>> 17;
		state ^= state << 5;
		state >>>= 0;
		values[i] = state >>> 1;
	}
	return values;
}

// EN: The file is external input, so every line is checked before it reaches an algorithm:
//     radix sort, for instance, is only correct for integers from 0 to 2^31 - 1.
// PT: O arquivo é entrada externa, então cada linha é conferida antes de chegar a um algoritmo:
//     o radix sort, por exemplo, só é correto para inteiros de 0 a 2^31 - 1.
// ES: El archivo es entrada externa, así que cada línea se comprueba antes de llegar a un algoritmo:
//     el radix sort, por ejemplo, solo es correcto para enteros de 0 a 2^31 - 1.
export function readValues(path: string, expected: number): number[] {
	const lines = readFileSync(path, "utf8").split("\n");
	if (lines.at(-1) === "") {
		lines.pop();
	}
	if (lines.length !== expected) {
		throw new Error(`${path}: expected ${expected} values, found ${lines.length}`);
	}
	return lines.map((line, index) => {
		const value = Number(line);
		if (line === "" || !Number.isInteger(value) || value < 0 || value > MAX_VALUE) {
			throw new Error(`${path}:${index + 1}: not an integer from 0 to ${MAX_VALUE}`);
		}
		return value;
	});
}

// EN: Order-sensitive digest of the output: h = (h * 31 + value) mod 1,000,000,007. Every
//     language computes the same formula, so equal checksums prove that the implementations
//     produced the same sequence. The modulus keeps every intermediate value below 2^53, the
//     limit of exact integers in a JavaScript number.
// PT: Resumo da saída sensível à ordem: h = (h * 31 + valor) mod 1.000.000.007. Toda linguagem
//     calcula a mesma fórmula, então checksums iguais provam que as implementações produziram a
//     mesma sequência. O módulo mantém todo valor intermediário abaixo de 2^53, o limite dos
//     inteiros exatos em um number de JavaScript.
// ES: Resumen de la salida sensible al orden: h = (h * 31 + valor) mod 1.000.000.007. Todo lenguaje
//     calcula la misma fórmula, así que checksums iguales prueban que las implementaciones produjeron
//     la misma secuencia. El módulo mantiene todo valor intermedio por debajo de 2^53, el límite de los
//     enteros exactos en un number de JavaScript.
export function checksum(values: readonly number[]): string {
	let hash = 0;
	for (const value of values) {
		hash = (hash * 31 + value) % 1_000_000_007;
	}
	return String(hash);
}
