import { describe, expect, test } from "bun:test";
import cases from "../../cases.json";
import { type Order, priceOrder, priceOrderImpure } from "../src/checkout";
import { check, int, listOf, oneOf, tuple } from "../src/prop";

describe("checkout: the pure version is tested with plain values", () => {
	// EN: No mock, no fake clock, no setup: the instant is just another argument.
	// PT: Sem mock, sem relógio falso, sem preparação: o instante é só mais um argumento.
	for (const example of cases.checkout.examples) {
		test(example.name, () => {
			expect(priceOrder(example.order, cases.checkout.now)).toEqual(example.expected);
		});
	}

	test("the same arguments always give the same result", () => {
		const order: Order = { items: [{ unitCents: 250, quantity: 4 }], coupon: { percent: 20, expiresAt: 50 } };
		expect(priceOrder(order, 10)).toEqual(priceOrder(order, 10));
	});
});

describe("checkout: the impure version", () => {
	// EN: Same order, two calls, two different answers: the hidden counter leaks into the
	//     result. This is the definition of "not referentially transparent".
	// PT: Mesmo pedido, duas chamadas, duas respostas diferentes: o contador oculto vaza para
	//     o resultado. É a definição de "não é referencialmente transparente".
	test("returns different values for the same argument", () => {
		const order: Order = { items: [{ unitCents: 100, quantity: 1 }], coupon: null };
		const first = priceOrderImpure(order);
		const second = priceOrderImpure(order);
		expect(second).not.toEqual(first);
		expect(second.receiptNumber).toBe(first.receiptNumber + 1);
	});
});

describe("checkout: invariants", () => {
	// EN: A generated order: up to 8 items and maybe a coupon. The generator works with
	//     tuples, and `toOrder` gives them names.
	// PT: Um pedido gerado: até 8 itens e talvez um cupom. O gerador trabalha com tuplas, e
	//     `toOrder` dá nome a elas.
	const orders = tuple(
		listOf(tuple(int(0, 100_000), int(0, 20)), 8),
		oneOf([false, true]),
		int(0, 100),
		int(0, 2000),
		int(0, 2000),
	);
	type Generated = [Array<[number, number]>, boolean, number, number, number];
	const toOrder = ([items, hasCoupon, percent, expiresAt]: Generated): Order => ({
		items: items.map(([unitCents, quantity]) => ({ unitCents, quantity })),
		coupon: hasCoupon ? { percent, expiresAt } : null,
	});

	// EN: Invariants are facts that hold for every order, whatever the numbers: the discount
	//     is never negative and never larger than the subtotal, and the three fields add up.
	// PT: Invariantes são fatos que valem para todo pedido, quaisquer que sejam os números: o
	//     desconto nunca é negativo nem maior que o subtotal, e os três campos fecham a conta.
	test("0 <= discount <= subtotal and total = subtotal - discount", () => {
		const result = check(
			orders,
			(generated) => {
				const price = priceOrder(toOrder(generated), generated[4]);
				return (
					price.discountCents >= 0 &&
					price.discountCents <= price.subtotalCents &&
					price.totalCents === price.subtotalCents - price.discountCents
				);
			},
			{ runs: 300 },
		);
		expect(result).toEqual({ ok: true, runs: 300 });
	});

	test("an expired coupon never changes the total", () => {
		const result = check(
			orders,
			(generated) => {
				const order = toOrder(generated);
				const afterExpiry = (order.coupon?.expiresAt ?? 0) + 1;
				return priceOrder(order, afterExpiry).discountCents === 0;
			},
			{ runs: 300 },
		);
		expect(result).toEqual({ ok: true, runs: 300 });
	});
});
