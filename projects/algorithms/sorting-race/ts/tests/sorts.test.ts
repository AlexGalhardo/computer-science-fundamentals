import { describe, expect, test } from "bun:test";
import { checksum, MAX_VALUE, randomValues } from "../src/input";
import { SORTS } from "../src/registry";

// EN: The two properties that define "sorted correctly". Checking only the order is not
//     enough: a function that returns [1, 1, 1] is ordered and wrong. The output must also be
//     a permutation of the input, that is, hold the same values the same number of times.
// PT: As duas propriedades que definem "ordenado corretamente". Conferir só a ordem não basta:
//     uma função que devolve [1, 1, 1] está em ordem e está errada. A saída também precisa ser
//     uma permutação da entrada, isto é, ter os mesmos valores o mesmo número de vezes.
// ES: Las dos propiedades que definen "ordenado correctamente". Comprobar solo el orden no basta:
//     una función que devuelve [1, 1, 1] está en orden y está mal. La salida también debe ser
//     una permutación de la entrada, es decir, tener los mismos valores el mismo número de veces.
function isSorted(values: readonly number[]): boolean {
	for (let i = 1; i < values.length; i++) {
		if ((values[i - 1] as number) > (values[i] as number)) {
			return false;
		}
	}
	return true;
}

function isPermutation(a: readonly number[], b: readonly number[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	const counts = new Map<number, number>();
	for (const value of a) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	for (const value of b) {
		const left = counts.get(value) ?? 0;
		if (left === 0) {
			return false;
		}
		counts.set(value, left - 1);
	}
	return true;
}

// EN: The same six cases are repeated in the tests of every other language.
// PT: Os mesmos seis casos são repetidos nos testes de todas as outras linguagens.
// ES: Los mismos seis casos se repiten en las pruebas de todos los demás lenguajes.
const CASES: ReadonlyArray<[name: string, input: number[]]> = [
	["empty", []],
	["single element", [42]],
	["sorted", [1, 2, 3, 4, 5, 6, 7, 8]],
	["reversed", [8, 7, 6, 5, 4, 3, 2, 1]],
	["duplicated", [5, 3, 5, 1, 3, 3, 0, MAX_VALUE, 5, 0, MAX_VALUE]],
	["random", randomValues(1_000, 7)],
];

for (const [name, sort] of Object.entries(SORTS)) {
	describe(name, () => {
		for (const [label, input] of CASES) {
			test(label, () => {
				const before = [...input];
				const output = sort(input);
				expect(isSorted(output)).toBe(true);
				expect(isPermutation(input, output)).toBe(true);
				// EN: A pure function must leave its argument untouched.
				// PT: Uma função pura precisa deixar o argumento intacto.
				// ES: Una función pura debe dejar el argumento intacto.
				expect(input).toEqual(before);
			});
		}

		test("property: 200 random arrays of random length", () => {
			const lengths = randomValues(200, 99);
			lengths.forEach((raw, index) => {
				// EN: A small value range forces many repeated keys in some of the arrays.
				// PT: Uma faixa pequena de valores força muitas chaves repetidas em parte dos vetores.
				// ES: Un rango pequeño de valores fuerza muchas claves repetidas en parte de los arreglos.
				const modulus = index % 2 === 0 ? MAX_VALUE : 10;
				const input = randomValues(raw % 300, index + 1).map((value) => value % modulus);
				const output = sort(input);
				expect(isSorted(output)).toBe(true);
				expect(isPermutation(input, output)).toBe(true);
			});
		});
	});
}

test("checksum depends on the order", () => {
	expect(checksum([1, 2, 3])).toBe("1026");
	expect(checksum([3, 2, 1])).not.toBe(checksum([1, 2, 3]));
});
