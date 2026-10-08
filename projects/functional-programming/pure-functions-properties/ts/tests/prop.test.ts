import { describe, expect, test } from "bun:test";
import { check, int, listOf, nextSeed, randomInt } from "../src/prop";

describe("prop: the generator is pure", () => {
	test("the same seed gives the same value and the same next seed", () => {
		expect(randomInt(42, 0, 99)).toEqual(randomInt(42, 0, 99));
		expect(nextSeed(42)).toBe(1083814273);
	});

	test("values stay inside the bounds", () => {
		expect(check(int(-5, 5), (n) => n >= -5 && n <= 5, { runs: 500 })).toEqual({ ok: true, runs: 500 });
	});
});

describe("prop: shrinking", () => {
	// EN: The property "every number is below 50" is false. Whatever large number the
	//     generator finds first, shrinking must end at the boundary, 50.
	// PT: A propriedade "todo número é menor que 50" é falsa. Qualquer que seja o número
	//     grande que o gerador ache primeiro, a redução precisa terminar na fronteira, 50.
	test("an integer shrinks to the smallest failing value", () => {
		const result = check(int(0, 1000), (n) => n < 50);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.shrunk).toBe(50);
		}
	});

	// EN: "No list has three elements or more" is false, and the smallest list that shows it
	//     is three zeros.
	// PT: "Nenhuma lista tem três elementos ou mais" é falsa, e a menor lista que mostra isso
	//     são três zeros.
	test("a list shrinks to the shortest failing list of the simplest elements", () => {
		const result = check(listOf(int(0, 100), 10), (xs) => xs.length < 3);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.shrunk).toEqual([0, 0, 0]);
		}
	});
});
