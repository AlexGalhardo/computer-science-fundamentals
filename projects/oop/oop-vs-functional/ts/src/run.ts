// EN: The two ways of running one scenario. Both return the same neutral `Outcome`, so the
//     tests and the demo can compare the two versions with each other and with the expectation.
//     Read the two functions side by side: this is the client code of each style.
// PT: As duas formas de rodar um cenário. As duas devolvem o mesmo `Outcome` neutro, então os
//     testes e a demo conseguem comparar as duas versões entre si e com o esperado. Leia as duas
//     funções lado a lado: este é o código cliente de cada estilo.
// ES: Las dos formas de ejecutar un escenario. Ambas devuelven el mismo `Outcome` neutro, así que
//     las pruebas y la demo pueden comparar las dos versiones entre sí y con lo esperado. Lee las
//     dos funciones lado a lado: este es el código cliente de cada estilo.

import { addLine, addRule, emptyCart, price, withTax } from "./functional/cart";
import { Cart, CartLine } from "./oop/cart";
import { CartError } from "./oop/cart-error";
import type { DiscountRule } from "./oop/discount-rule";
import { BulkDiscount } from "./oop/rules/bulk-discount";
import { FixedCoupon } from "./oop/rules/fixed-coupon";
import { PercentCoupon } from "./oop/rules/percent-coupon";
import { TakePayDiscount } from "./oop/rules/take-pay-discount";
import { FlatTax, NoTax } from "./oop/tax-policy";
import type { Outcome, RuleSpec, Scenario } from "./scenarios";

// EN: The one place of the object version that knows the concrete classes: where the objects
//     are created. Everything after this point sees only the `DiscountRule` interface.
// PT: O único lugar da versão com objetos que conhece as classes concretas: onde os objetos são
//     criados. Tudo depois deste ponto enxerga só a interface `DiscountRule`.
// ES: El único lugar de la versión con objetos que conoce las clases concretas: donde se crean los
//     objetos. Todo lo que viene después de este punto ve solo la interfaz `DiscountRule`.
function createRule(spec: RuleSpec): DiscountRule {
	switch (spec.kind) {
		case "percent-coupon":
			return new PercentCoupon(spec.code, spec.percent);
		case "fixed-coupon":
			return new FixedCoupon(spec.code, spec.amountCents);
		case "bulk":
			return new BulkDiscount(spec.sku, spec.minQuantity, spec.percent);
		case "take-pay":
			return new TakePayDiscount(spec.sku, spec.take, spec.pay);
	}
}

// EN: Objects: one cart is created and then changed step by step. An invalid value throws, so
//     the happy path has no checks and the error is caught in one place.
// PT: Objetos: um carrinho é criado e depois alterado passo a passo. Um valor inválido lança
//     exceção, então o caminho feliz não tem verificações e o erro é capturado em um só lugar.
// ES: Objetos: se crea un carrito y luego se modifica paso a paso. Un valor inválido lanza una
//     excepción, así que el camino feliz no tiene verificaciones y el error se captura en un solo
//     lugar.
export function runWithObjects(scenario: Scenario): Outcome {
	try {
		const cart = new Cart();
		for (const item of scenario.items) {
			cart.add(new CartLine(item.sku, item.unitPriceCents, item.quantity));
		}
		for (const rule of scenario.rules) {
			cart.addRule(createRule(rule));
		}
		cart.setTaxPolicy(scenario.tax.kind === "flat" ? new FlatTax(scenario.tax.basisPoints) : new NoTax());
		const receipt = cart.checkout();
		return { kind: "receipt", receipt: { ...receipt, discounts: [...receipt.discounts] } };
	} catch (error) {
		if (error instanceof CartError) {
			return { kind: "error", code: error.code };
		}
		throw error;
	}
}

// EN: Functions: each step takes a cart and returns a new one, so building the cart is a chain
//     of `reduce`. The scenario data is already in the shape the functions expect (structural
//     typing), so there is nothing to construct. The error comes back as a value.
// PT: Funções: cada passo recebe um carrinho e devolve um novo, então montar o carrinho é uma
//     cadeia de `reduce`. Os dados do cenário já têm a forma que as funções esperam (tipagem
//     estrutural), então não há o que construir. O erro volta como um valor.
// ES: Funciones: cada paso recibe un carrito y devuelve uno nuevo, así que armar el carrito es una
//     cadena de `reduce`. Los datos del escenario ya tienen la forma que las funciones esperan
//     (tipado estructural), así que no hay nada que construir. El error vuelve como un valor.
export function runWithFunctions(scenario: Scenario): Outcome {
	const withLines = scenario.items.reduce(addLine, emptyCart);
	const withRules = scenario.rules.reduce(addRule, withLines);
	const result = price(withTax(withRules, scenario.tax));
	return result.ok
		? { kind: "receipt", receipt: { ...result.receipt, discounts: [...result.receipt.discounts] } }
		: { kind: "error", code: result.error };
}

export function formatOutcome(outcome: Outcome): string {
	if (outcome.kind === "error") {
		return `  rejected: ${outcome.code}`;
	}
	const { subtotalCents, discounts, taxCents, totalCents } = outcome.receipt;
	const money = (cents: number): string => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
	return [
		`  subtotal ${money(subtotalCents)}`,
		...discounts.map((discount) => `  - ${money(discount.amountCents)}  ${discount.label}`),
		`  tax ${money(taxCents)}`,
		`  total ${money(totalCents)}`,
	].join("\n");
}
