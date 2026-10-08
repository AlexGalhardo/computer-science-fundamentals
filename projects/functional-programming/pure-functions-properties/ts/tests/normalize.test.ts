import { describe, expect, test } from "bun:test";
import cases from "../../cases.json";
import { normalizeCode } from "../src/normalize";
import { check, runString } from "../src/prop";

describe("normalize", () => {
	for (const [name, code] of cases.normalize.examples) {
		test(`"${name}" -> "${code}"`, () => {
			expect(normalizeCode(name ?? "")).toBe(code ?? "");
		});
	}

	// EN: Idempotence: applying the function twice equals applying it once. The alphabet has
	//     spaces, a tab, both letter cases and a hyphen, the characters the function treats
	//     differently.
	// PT: Idempotência: aplicar a função duas vezes é igual a aplicar uma. O alfabeto tem
	//     espaços, tabulação, letras maiúsculas e minúsculas e hífen, os caracteres que a
	//     função trata de forma diferente.
	test("normalizing twice equals normalizing once", () => {
		const names = runString("a B\t-", 8, 3);
		const result = check(names, (name) => normalizeCode(normalizeCode(name)) === normalizeCode(name), {
			runs: 500,
		});
		expect(result).toEqual({ ok: true, runs: 500 });
	});
});
