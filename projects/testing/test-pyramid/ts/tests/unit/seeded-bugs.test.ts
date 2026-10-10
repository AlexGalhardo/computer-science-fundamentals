import { afterEach, expect, test } from "bun:test";
import { activeBug } from "../../src/seeded-bugs";

// EN: This test changes a global (an environment variable), so it puts the original value back
//     afterwards. A test that leaks state makes the next test depend on the order of execution.
// PT: Este teste altera um global (uma variável de ambiente), então devolve o valor original
//     depois. Um teste que vaza estado faz o próximo depender da ordem de execução.
// ES: Esta prueba modifica un global (una variable de entorno), así que devuelve el valor original
//     después. Una prueba que filtra estado hace que la siguiente dependa del orden de ejecución.
const original = process.env.SEEDED_BUG;

afterEach(() => {
	if (original === undefined) {
		delete process.env.SEEDED_BUG;
	} else {
		process.env.SEEDED_BUG = original;
	}
});

test("an unknown bug name is rejected instead of silently ignored", () => {
	process.env.SEEDED_BUG = "typo";
	expect(() => activeBug()).toThrow();
});

test("a known bug name is accepted", () => {
	process.env.SEEDED_BUG = "smoke";
	expect(activeBug()).toBe("smoke");
});
