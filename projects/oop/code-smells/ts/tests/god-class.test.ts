import { describe, expect, test } from "bun:test";
import * as after from "../src/god-class/after";
import * as before from "../src/god-class/before";
import type { CreateShop } from "../src/god-class/contract";

const versions: [string, CreateShop][] = [
	["before", before.createShop],
	["after", after.createShop],
];

describe.each(versions)("god class, %s", (_name, createShop) => {
	const stocked = () => {
		const shop = createShop({ PEN: 250, BOOK: 4000 });
		shop.restock("PEN", 5);
		shop.restock("BOOK", 1);
		return shop;
	};

	test("an order takes stock, gets a number and sends an e-mail", () => {
		const shop = stocked();
		expect(shop.placeOrder("ana@shop.example", "PEN", 3)).toBe("ORD-1");
		expect(shop.placeOrder("bia@shop.example", "PEN", 1)).toBe("ORD-2");
		expect(shop.stockOf("PEN")).toBe(1);
		expect(shop.outbox()).toEqual([
			"To: ana@shop.example | Order ORD-1: 3 x PEN, total 7.50",
			"To: bia@shop.example | Order ORD-2: 1 x PEN, total 2.50",
		]);
	});

	test("selling the last unit warns the stock team", () => {
		const shop = stocked();
		shop.placeOrder("ana@shop.example", "BOOK", 1);
		expect(shop.outbox()[1]).toBe("To: stock@shop.example | BOOK is sold out");
	});

	test("the report adds up by product, in alphabetical order", () => {
		const shop = stocked();
		shop.placeOrder("ana@shop.example", "PEN", 3);
		shop.placeOrder("ana@shop.example", "BOOK", 1);
		shop.placeOrder("bia@shop.example", "PEN", 2);
		expect(shop.salesReport()).toBe("BOOK: 1 units, 40.00\nPEN: 5 units, 12.50\nTOTAL: 52.50");
	});

	test("a refused order changes nothing", () => {
		const shop = stocked();
		expect(() => shop.placeOrder("ana@shop.example", "PEN", 6)).toThrow("out of stock: PEN");
		expect(() => shop.placeOrder("ana@shop.example", "INK", 1)).toThrow("unknown product INK");
		expect(() => shop.placeOrder("ana@shop.example", "PEN", 0)).toThrow("invalid quantity");
		expect(() => shop.restock("PEN", -1)).toThrow("invalid quantity");
		expect(shop.stockOf("PEN")).toBe(5);
		expect(shop.outbox()).toEqual([]);
		expect(shop.salesReport()).toBe("TOTAL: 0.00");
	});

	test("the outbox cannot be changed from outside", () => {
		const shop = stocked();
		(shop.outbox() as string[]).push("forged");
		expect(shop.outbox()).toEqual([]);
	});
});

// EN: What the refactoring bought: each responsibility can be tested with nothing else around.
// PT: O que a refatoração comprou: cada responsabilidade pode ser testada sem nada em volta.
// ES: Lo que la refactorización compró: cada responsabilidad puede probarse sin nada alrededor.
describe("god class, only possible after", () => {
	test("the stock rule without prices, e-mails or reports", () => {
		const inventory = new after.Inventory();
		inventory.add("PEN", 2);
		expect(inventory.remove("PEN", 2)).toBe(0);
		expect(() => inventory.remove("PEN", 1)).toThrow("out of stock: PEN");
	});

	test("a shop that shares one outbox with the test", () => {
		const outbox = new after.Outbox();
		const inventory = new after.Inventory();
		inventory.add("PEN", 1);
		const shop = new after.CoordinatingShop(
			inventory,
			new after.PriceList({ PEN: 250 }),
			outbox,
			new after.SalesLedger(),
		);
		shop.placeOrder("ana@shop.example", "PEN", 1);
		expect(outbox.messages()).toHaveLength(2);
	});
});
