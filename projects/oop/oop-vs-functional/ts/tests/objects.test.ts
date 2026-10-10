import { describe, expect, test } from "bun:test";
import { Cart, CartLine } from "../src/oop/cart";
import { CartError } from "../src/oop/cart-error";
import type { DiscountRule } from "../src/oop/discount-rule";
import { PercentCoupon } from "../src/oop/rules/percent-coupon";
import { FlatTax } from "../src/oop/tax-policy";

describe("encapsulation", () => {
	test("an invalid line cannot be created", () => {
		expect(() => new CartLine("PEN", 250, 0)).toThrow(CartError);
		expect(() => new CartLine("PEN", 250, 1.5)).toThrow("invalid-quantity");
		expect(() => new CartLine("PEN", -1, 1)).toThrow("invalid-price");
	});

	// EN: `lines()` hands out a copy. The cast removes the `readonly` of the type on purpose, to
	//     show that even a caller that cheats cannot reach the array inside the cart.
	// PT: `lines()` entrega uma cópia. O cast tira o `readonly` do tipo de propósito, para mostrar
	//     que nem quem trapaceia alcança o array de dentro do carrinho.
	// ES: `lines()` entrega una copia. El cast quita el `readonly` del tipo a propósito, para
	//     mostrar que ni siquiera quien hace trampa alcanza el array de dentro del carrito.
	test("changing the list returned by lines() does not change the cart", () => {
		const cart = new Cart();
		cart.add(new CartLine("PEN", 250, 4));
		const copy = cart.lines() as CartLine[];
		copy.push(new CartLine("BOOK", 4000, 1));
		copy.length = 0;
		expect(cart.lines()).toHaveLength(1);
		expect(cart.checkout().subtotalCents).toBe(1000);
	});
});

describe("polymorphism", () => {
	// EN: TypeScript types are structural: any object with the two methods is a DiscountRule,
	//     with no class and no `implements`. The cart cannot tell it from the built-in rules.
	// PT: Os tipos do TypeScript são estruturais: qualquer objeto com os dois métodos é um
	//     DiscountRule, sem classe e sem `implements`. O carrinho não o distingue das regras
	//     que já existem.
	// ES: Los tipos de TypeScript son estructurales: cualquier objeto con los dos métodos es un
	//     DiscountRule, sin clase y sin `implements`. El carrito no lo distingue de las reglas que
	//     ya existen.
	test("the cart accepts a rule it has never seen", () => {
		const oneCentOff: DiscountRule = {
			discountCents: () => 1,
			describe: () => "one cent off",
		};
		const cart = new Cart();
		cart.add(new CartLine("PEN", 250, 4));
		cart.addRule(new PercentCoupon("WELCOME10", 10));
		cart.addRule(oneCentOff);
		expect(cart.checkout()).toEqual({
			subtotalCents: 1000,
			discounts: [
				{ label: "coupon WELCOME10: 10% off", amountCents: 100 },
				{ label: "one cent off", amountCents: 1 },
			],
			taxCents: 0,
			totalCents: 899,
		});
	});

	test("the tax policy can be replaced on a living cart", () => {
		const cart = new Cart();
		cart.add(new CartLine("GUM", 200, 1));
		expect(cart.checkout().totalCents).toBe(200);
		cart.setTaxPolicy(new FlatTax(825));
		expect(cart.checkout().totalCents).toBe(217);
	});
});
