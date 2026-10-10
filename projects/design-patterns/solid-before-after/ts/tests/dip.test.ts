import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as after from "../src/dip/after";
import * as before from "../src/dip/before";
import type { Cart, CheckoutApp } from "../src/dip/infrastructure";

const cart: Cart = {
	email: "ana@example.test",
	items: [
		{ sku: "book", quantity: 2, unitCents: 5000 },
		{ sku: "pen", quantity: 1, unitCents: 250 },
	],
};

// EN: Same tests, both versions (see tests/srp.test.ts for the idea).
// PT: Mesmos testes, duas versões (a ideia está em tests/srp.test.ts).
// ES: Mismas pruebas, dos versiones (la idea está en tests/srp.test.ts).
function behaviour(name: string, createCheckout: () => CheckoutApp): void {
	describe(`dip: ${name}`, () => {
		test("totals the cart and numbers the orders", () => {
			const app = createCheckout();
			expect(app.checkout(cart)).toEqual({ orderId: "o-1", totalCents: 10250 });
			expect(app.checkout(cart).orderId).toBe("o-2");
		});

		test("stores the order and confirms it to the customer", () => {
			const app = createCheckout();
			app.checkout(cart);
			expect(app.stored()).toEqual(["INSERT INTO orders VALUES ('o-1', 10250)"]);
			expect(app.sent()).toEqual(["SMTP to ana@example.test: Order o-1 confirmed"]);
		});

		test("refuses an empty cart and leaves nothing behind", () => {
			const app = createCheckout();
			expect(() => app.checkout({ email: "ana@example.test", items: [] })).toThrow("the cart is empty");
			expect(app.stored()).toEqual([]);
			expect(app.sent()).toEqual([]);
		});
	});
}

behaviour("before", before.createCheckout);
behaviour("after", after.createCheckout);

describe("dip: what the refactor allows", () => {
	// EN: The rule alone, with two plain objects in the place of SMTP and SQL.
	// PT: A regra sozinha, com dois objetos simples no lugar do SMTP e do SQL.
	// ES: La regla sola, con dos objetos simples en lugar de SMTP y SQL.
	test("the business rule is tested with no infrastructure class", () => {
		const saved: string[] = [];
		const told: string[] = [];
		const service = new after.CheckoutService(
			{ save: (orderId, totalCents) => saved.push(`${orderId}=${totalCents}`) },
			{ orderConfirmed: (email, orderId) => told.push(`${email}:${orderId}`) },
		);
		service.checkout(cart);
		expect(saved).toEqual(["o-1=10250"]);
		expect(told).toEqual(["ana@example.test:o-1"]);
	});

	// EN: Where the concrete classes are created, read from the source. In `before` it is the
	//     rule itself. In `after` it is only `createCheckout`, after the class has ended.
	// PT: Onde as classes concretas são criadas, lido no código-fonte. Em `before` é a própria
	//     regra. Em `after` é só `createCheckout`, depois que a classe terminou.
	// ES: Dónde se crean las clases concretas, leído en el código fuente. En `before` es la propia
	//     regla. En `after` es solo `createCheckout`, después de que la clase termina.
	test("the rule no longer creates its own details", () => {
		const classBody = (file: string): string => {
			const source = readFileSync(join(import.meta.dir, "..", "src", "dip", file), "utf8");
			const fromClass = source.slice(source.indexOf("class CheckoutService"));
			return fromClass.split(/\r?\n\}\r?\n/)[0] ?? "";
		};
		expect(classBody("before.ts")).toContain("new SmtpMailer()");
		expect(classBody("before.ts")).toContain("new SqlOrderTable()");
		expect(classBody("after.ts")).not.toMatch(/SmtpMailer|SqlOrderTable/);
	});
});
