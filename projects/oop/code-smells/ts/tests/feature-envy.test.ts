import { describe, expect, test } from "bun:test";
import * as after from "../src/feature-envy/after";
import * as before from "../src/feature-envy/before";
import type { InvoiceInput, RenderInvoice } from "../src/feature-envy/contract";

const versions: [string, RenderInvoice][] = [
	["before", before.renderInvoice],
	["after", after.renderInvoice],
];

const input: InvoiceInput = {
	customer: {
		name: "Ana Souza",
		street: "Rua das Flores",
		number: "12",
		city: "Campinas",
		state: "SP",
		zip: "13000000",
	},
	lines: [
		{ description: "notebook", unitCents: 1500, quantity: 2 },
		{ description: "pen", unitCents: 250, quantity: 1 },
	],
};

describe.each(versions)("feature envy, %s", (_name, renderInvoice) => {
	test("the invoice has the address label, the lines and the total", () => {
		expect(renderInvoice(input)).toBe(
			[
				"Invoice for Ana Souza",
				"Rua das Flores, 12",
				"Campinas - SP",
				"13000-000",
				"2 x notebook  30.00",
				"1 x pen  2.50",
				"Total  32.50",
			].join("\n"),
		);
	});

	test("an invoice with no lines totals zero", () => {
		expect(renderInvoice({ ...input, lines: [] })).toEndWith("13000-000\nTotal  0.00");
	});
});

// EN: What the refactoring bought: the address label exists once and anyone can reuse it.
// PT: O que a refatoração comprou: a etiqueta de endereço existe uma vez e qualquer um a reusa.
describe("feature envy, only possible after", () => {
	test("a shipping label needs no invoice and no printer", () => {
		const address = new after.Address("Rua das Flores", "12", "Campinas", "SP", "13000000");
		expect(address.label()).toEqual(["Rua das Flores, 12", "Campinas - SP", "13000-000"]);
	});
});
