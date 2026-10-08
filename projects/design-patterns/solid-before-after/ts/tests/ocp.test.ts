import { describe, expect, test } from "bun:test";
import * as after from "../src/ocp/after";
import * as before from "../src/ocp/before";

// EN: Same tests, both versions (see tests/srp.test.ts for the idea).
// PT: Mesmos testes, duas versões (a ideia está em tests/srp.test.ts).
function behaviour(name: string, discountCents: (kind: string, totalCents: number) => number): void {
	describe(`ocp: ${name}`, () => {
		test("gives each known kind its discount", () => {
			expect(discountCents("regular", 20000)).toBe(0);
			expect(discountCents("premium", 20000)).toBe(2000);
			expect(discountCents("employee", 20000)).toBe(6000);
		});

		test("rounds to the nearest cent", () => {
			expect(discountCents("premium", 1995)).toBe(200);
		});

		test("refuses a kind it does not know", () => {
			expect(() => discountCents("student", 20000)).toThrow("unknown customer kind: student");
		});
	});
}

behaviour("before", before.discountCents);
behaviour("after", after.discountCents);

describe("ocp: what the refactor allows", () => {
	// EN: The new requirement of the README, met from outside: no file in `src/` is edited.
	// PT: O requisito novo do README, atendido de fora: nenhum arquivo de `src/` é editado.
	test("a new kind is added without editing the calculator", () => {
		const student: after.DiscountRule = { kind: "student", discount: (total) => Math.round(total * 0.15) };
		const discountCents = after.createDiscounts([...after.defaultRules, student]);
		expect(discountCents("student", 20000)).toBe(3000);
		expect(discountCents("premium", 20000)).toBe(2000);
	});
});
