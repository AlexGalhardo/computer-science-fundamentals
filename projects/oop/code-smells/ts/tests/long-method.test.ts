import { describe, expect, test } from "bun:test";
import * as after from "../src/long-method/after";
import * as before from "../src/long-method/before";
import type { FormatReceipt, Order } from "../src/long-method/contract";

const versions: [string, FormatReceipt][] = [
	["before", before.formatReceipt],
	["after", after.formatReceipt],
];

const pens = { name: "pen", unitCents: 250, quantity: 4 };
const book = { name: "book", unitCents: 4000, quantity: 1 };

// EN: The same tests run on both versions. They are the safety net of the refactoring.
// PT: Os mesmos testes rodam nas duas versões. Eles são a rede de segurança da refatoração.
// ES: Los mismos tests corren en ambas versiones. Son la red de seguridad de la refactorización.
describe.each(versions)("long method, %s", (_name, formatReceipt) => {
	test("a plain order pays shipping", () => {
		expect(formatReceipt({ customer: "Ana", items: [pens, book] })).toBe(
			[
				"Receipt for Ana",
				"4 x pen  10.00",
				"1 x book  40.00",
				"Subtotal  50.00",
				"Shipping  15.00",
				"Total  65.00",
			].join("\n"),
		);
	});

	test("coupon TEN takes 10% off", () => {
		const text = formatReceipt({ customer: "Ana", items: [pens, book], coupon: "TEN" });
		expect(text).toContain("Discount (TEN)  -5.00");
		expect(text).toEndWith("Total  60.00");
	});

	test("coupon BULK needs 10 units", () => {
		const few = formatReceipt({ customer: "Ana", items: [pens], coupon: "BULK" });
		const many = formatReceipt({ customer: "Ana", items: [{ ...pens, quantity: 10 }], coupon: "BULK" });
		expect(few).not.toContain("Discount");
		expect(many).toContain("Discount (BULK)  -5.00");
		expect(many).toEndWith("Total  35.00");
	});

	test("shipping is free from 100.00 after the discount", () => {
		const order: Order = { customer: "Bia", items: [{ name: "desk", unitCents: 11000, quantity: 1 }] };
		expect(formatReceipt(order)).toEndWith("Shipping  free\nTotal  110.00");
		expect(formatReceipt({ ...order, coupon: "TEN" })).toEndWith("Shipping  15.00\nTotal  114.00");
	});

	test("an unknown coupon changes nothing", () => {
		expect(formatReceipt({ customer: "Ana", items: [pens], coupon: "NOPE" })).toEndWith("Total  25.00");
	});

	test("invalid orders are refused", () => {
		expect(() => formatReceipt({ customer: "Ana", items: [] })).toThrow("empty order");
		expect(() => formatReceipt({ customer: "Ana", items: [{ ...pens, quantity: 0 }] })).toThrow("invalid quantity");
		expect(() => formatReceipt({ customer: "Ana", items: [{ ...pens, unitCents: -1 }] })).toThrow("invalid price");
	});
});

// EN: What the refactoring bought: a rule can now be tested without building a receipt.
// PT: O que a refatoração comprou: uma regra agora pode ser testada sem montar um recibo.
// ES: Lo que la refactorización compró: una regla ahora puede probarse sin armar un recibo.
describe("long method, only possible after", () => {
	test("the shipping rule alone", () => {
		expect(after.shippingCents(9999)).toBe(1500);
		expect(after.shippingCents(10000)).toBe(0);
	});
});
