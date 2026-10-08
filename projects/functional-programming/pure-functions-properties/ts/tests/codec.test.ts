import { describe, expect, test } from "bun:test";
import cases from "../../cases.json";
import { decode, decodeBuggy, encode } from "../src/codec";
import { check, runString } from "../src/prop";

// EN: Strings made of runs of "a", "b" and "c", up to 6 runs of up to 12 characters each.
// PT: Textos feitos de sequências de "a", "b" e "c", até 6 sequências de até 12 caracteres.
const texts = runString("abc", 6, 12);

describe("codec: example tests", () => {
	// EN: The examples are the ones a person would write by hand, and every one of them
	//     passes against BOTH decoders. They do not tell the correct one from the buggy one.
	// PT: Os exemplos são os que uma pessoa escreveria à mão, e todos passam nos DOIS
	//     decodificadores. Eles não distinguem o correto do que tem o erro.
	for (const [plain, encoded] of cases.codec.examples) {
		test(`"${plain}" <-> "${encoded}"`, () => {
			expect(encode(plain ?? "")).toBe(encoded ?? "");
			expect(decode(encoded ?? "")).toBe(plain ?? "");
			expect(decodeBuggy(encoded ?? "")).toBe(plain ?? "");
		});
	}
});

describe("codec: round-trip property", () => {
	// EN: Round trip: decoding what was encoded gives back the original, for any input.
	// PT: Ida e volta: decodificar o que foi codificado devolve o original, para qualquer entrada.
	test("decode(encode(text)) == text holds for the correct decoder", () => {
		expect(check(texts, (text) => decode(encode(text)) === text, { runs: 500 })).toEqual({ ok: true, runs: 500 });
	});

	test("the same property finds the seeded bug and shrinks it to ten equal characters", () => {
		const result = check(texts, (text) => decodeBuggy(encode(text)) === text, { runs: 500 });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.shrunk).toBe("aaaaaaaaaa");
			expect(result.original.length).toBeGreaterThan(result.shrunk.length);
			expect(decodeBuggy(encode(result.shrunk))).toBe("");
		}
	});

	// EN: Reproducible: the seed is the whole state of the generator, so the same seed gives
	//     the same failure, byte for byte.
	// PT: Reproduzível: a semente é todo o estado do gerador, então a mesma semente dá a mesma
	//     falha, byte a byte.
	test("the same seed reproduces the same counterexample", () => {
		const run = () => check(texts, (text) => decodeBuggy(encode(text)) === text, { runs: 500, seed: 7 });
		expect(run()).toEqual(run());
	});
});
