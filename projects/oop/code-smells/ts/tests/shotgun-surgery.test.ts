import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { billing as after } from "../src/shotgun-surgery/after";
import { billing as before } from "../src/shotgun-surgery/before";
import type { Billing } from "../src/shotgun-surgery/contract";

const versions: [string, Billing][] = [
	["before", before],
	["after", after],
];

describe.each(versions)("shotgun surgery, %s", (_name, billing) => {
	test("the cart line multiplies and formats", () => {
		expect(billing.cartLine("pen", 250, 2)).toBe("2 x pen  R$ 5,00");
		expect(billing.cartLine("desk", 123456, 1)).toBe("1 x desk  R$ 1.234,56");
	});

	test("the invoice total adds and formats", () => {
		expect(billing.invoiceTotal([250, 4000, 5])).toBe("Total: R$ 42,55");
		expect(billing.invoiceTotal([100000000, 23456701])).toBe("Total: R$ 1.234.567,01");
		expect(billing.invoiceTotal([])).toBe("Total: R$ 0,00");
	});

	test("the report row pads the label and formats", () => {
		expect(billing.reportRow("pen", 5)).toBe("pen......... R$ 0,05");
		expect(billing.reportRow("furniture", 99900000)).toBe("furniture... R$ 999.000,00");
	});
});

// EN: The smell, measured. A test that reads the source: in how many files is the currency
//     symbol written? That is the number of files a change of currency would touch.
// PT: O mau cheiro, medido. Um teste que lê o código-fonte: em quantos arquivos o símbolo da
//     moeda está escrito? Esse é o número de arquivos que uma troca de moeda tocaria.
function filesThatKnowTheCurrency(version: string): string[] {
	const folder = new URL(`../src/shotgun-surgery/${version}/`, import.meta.url);
	return readdirSync(folder)
		.filter((name) => readFileSync(new URL(name, folder), "utf8").includes("R$ "))
		.sort();
}

describe("shotgun surgery, where the knowledge lives", () => {
	test("before: three files to edit", () => {
		expect(filesThatKnowTheCurrency("before")).toEqual(["cart.ts", "invoice.ts", "report.ts"]);
	});

	test("after: one file to edit", () => {
		expect(filesThatKnowTheCurrency("after")).toEqual(["money.ts"]);
	});
});
