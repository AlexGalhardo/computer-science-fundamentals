import { describe, expect, test } from "bun:test";
import * as after from "../src/srp/after";
import * as before from "../src/srp/before";
import type { IssuedInvoice, Order } from "../src/srp/types";

const order: Order = {
	id: "inv-7",
	customer: "Ana",
	state: "SP",
	lines: [
		{ description: "Book", quantity: 2, unitCents: 5000 },
		{ description: "Pen", quantity: 3, unitCents: 250 },
	],
};

// EN: The behaviour of the module, written once and run against both versions. These tests were
//     written for `before` and did not change for `after`: that is what makes the second
//     version a refactor and not a rewrite.
// PT: O comportamento do módulo, escrito uma vez e executado contra as duas versões. Estes
//     testes foram escritos para `before` e não mudaram para `after`: é isso que faz da segunda
//     versão uma refatoração, e não uma reescrita.
// ES: El comportamiento del módulo, escrito una vez y ejecutado contra las dos versiones. Estas
//     pruebas se escribieron para `before` y no cambiaron para `after`: eso es lo que hace de
//     la segunda versión una refactorización, y no una reescritura.
function behaviour(name: string, issueInvoice: (order: Order) => IssuedInvoice): void {
	describe(`srp: ${name}`, () => {
		test("adds the state tax to the subtotal", () => {
			// 2 x 5000 + 3 x 250 = 10750; 18% of 10750 = 1935; total 12685
			expect(issueInvoice(order).totalCents).toBe(12685);
			// 20% of 10750 = 2150; total 12900
			expect(issueInvoice({ ...order, state: "RJ" }).totalCents).toBe(12900);
		});

		test("writes the receipt line by line", () => {
			expect(issueInvoice(order).receipt).toBe(
				[
					"Invoice inv-7 for Ana",
					"2 x Book @ 50.00 = 100.00",
					"3 x Pen @ 2.50 = 7.50",
					"Subtotal: 107.50",
					"Tax (18%): 19.35",
					"Total: 126.85",
				].join("\n"),
			);
		});

		test("produces the record that is stored", () => {
			expect(issueInvoice(order).record).toBe("inv-7;Ana;SP;12685");
		});

		test("refuses an order with no lines", () => {
			expect(() => issueInvoice({ ...order, lines: [] })).toThrow("an invoice needs at least one line");
		});
	});
}

behaviour("before", before.issueInvoice);
behaviour("after", after.issueInvoice);

describe("srp: what the refactor allows", () => {
	// EN: Only possible after the split: the tax rule is checked with no text in sight.
	// PT: Só é possível depois da separação: a regra de imposto é verificada sem texto algum.
	// ES: Solo es posible después de la separación: la regla del impuesto se verifica sin texto alguno.
	test("each responsibility can be tested alone", () => {
		const totals = after.calculateTotals(order);
		expect(totals).toEqual({ subtotalCents: 10750, ratePercent: 18, taxCents: 1935, totalCents: 12685 });
		expect(after.toRecord(order, totals)).toBe("inv-7;Ana;SP;12685");
	});
});
