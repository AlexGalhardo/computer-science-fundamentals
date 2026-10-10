import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as after from "../src/lsp/after";
import * as before from "../src/lsp/before";
import type { AccountSpec } from "../src/lsp/types";

const specs: AccountSpec[] = [
	{ kind: "checking", balanceCents: 10000 },
	{ kind: "fixed-term", balanceCents: 50000 },
	{ kind: "savings", balanceCents: 500 },
];

interface Module {
	chargeMonthlyFee(specs: AccountSpec[], feeCents: number): number[];
	availableNow(specs: AccountSpec[]): number;
}

// EN: Same tests, both versions (see tests/srp.test.ts for the idea).
// PT: Mesmos testes, duas versões (a ideia está em tests/srp.test.ts).
// ES: Mismas pruebas, dos versiones (la idea está en tests/srp.test.ts).
function behaviour(name: string, module: Module): void {
	describe(`lsp: ${name}`, () => {
		test("charges the fee where a withdrawal is possible and the balance is enough", () => {
			// checking pays 1200; fixed-term is never charged; savings has less than the fee
			expect(module.chargeMonthlyFee(specs, 1200)).toEqual([8800, 50000, 500]);
		});

		test("counts only money that can be withdrawn today", () => {
			expect(module.availableNow(specs)).toBe(10500);
		});

		test("handles an empty list", () => {
			expect(module.chargeMonthlyFee([], 1200)).toEqual([]);
			expect(module.availableNow([])).toBe(0);
		});
	});
}

behaviour("before", before);
behaviour("after", after);

describe("lsp: what the refactor removes", () => {
	const code = (file: string): string =>
		readFileSync(join(import.meta.dir, "..", "src", "lsp", file), "utf8")
			.split("\n")
			.filter((line) => !line.trim().startsWith("//"))
			.join("\n");

	// EN: The symptom of a broken substitution, counted in the source: clients that ask for the
	//     concrete type, and an inherited method that only throws.
	// PT: O sintoma de uma substituição quebrada, contado no código-fonte: clientes que perguntam
	//     o tipo concreto, e um método herdado que só lança exceção.
	// ES: El síntoma de una sustitución rota, contado en el código fuente: clientes que preguntan
	//     el tipo concreto, y un método heredado que solo lanza una excepción.
	test("the clients no longer ask for the concrete type", () => {
		expect(code("before.ts").match(/instanceof/g)?.length).toBe(2);
		expect(code("after.ts").match(/instanceof/g)).toBeNull();
		expect(code("before.ts")).toContain("cannot be withdrawn");
		expect(code("after.ts")).not.toContain("cannot be withdrawn");
	});
});
