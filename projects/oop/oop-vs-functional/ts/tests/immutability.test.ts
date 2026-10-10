import { describe, expect, test } from "bun:test";
import { addLine, addRule, emptyCart, type Cart as FunctionalCart, price, withTax } from "../src/functional/cart";
import { Cart, CartLine } from "../src/oop/cart";
import { runWithFunctions } from "../src/run";
import { loadScenarios } from "../src/scenarios";

// EN: `Object.freeze` makes any write to the object throw a TypeError (modules run in strict
//     mode). Freezing every level of the input turns "this function does not mutate its
//     arguments" from a promise into something the test can observe.
// PT: `Object.freeze` faz qualquer escrita no objeto lançar TypeError (módulos rodam em modo
//     estrito). Congelar todos os níveis da entrada transforma "esta função não altera seus
//     argumentos" de promessa em algo que o teste consegue observar.
// ES: `Object.freeze` hace que cualquier escritura en el objeto lance TypeError (los módulos
//     corren en modo estricto). Congelar todos los niveles de la entrada convierte "esta función
//     no modifica sus argumentos" de una promesa en algo que la prueba puede observar.
function deepFreeze<T>(value: T): T {
	if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const inner of Object.values(value)) {
			deepFreeze(inner);
		}
	}
	return value;
}

describe("the functional version mutates no input", () => {
	test("every shared scenario runs on deeply frozen input and gives the expected result", () => {
		for (const scenario of loadScenarios()) {
			const frozen = deepFreeze(structuredClone(scenario));
			expect(runWithFunctions(frozen)).toEqual(scenario.expected);
		}
	});

	test("each function leaves its frozen arguments exactly as they were", () => {
		const cart: FunctionalCart = deepFreeze({
			lines: [{ sku: "PEN", unitPriceCents: 250, quantity: 4 }],
			rules: [{ kind: "percent-coupon", code: "WELCOME10", percent: 10 }],
			tax: { kind: "flat", basisPoints: 825 },
		});
		const before = structuredClone(cart);

		const bigger = addLine(cart, deepFreeze({ sku: "BOOK", unitPriceCents: 4000, quantity: 1 }));
		const withCoupon = addRule(cart, deepFreeze({ kind: "fixed-coupon", code: "FIVE", amountCents: 500 }));
		const untaxed = withTax(cart, deepFreeze({ kind: "none" }));
		price(cart);

		expect(cart).toEqual(before);
		expect(bigger.lines).toHaveLength(2);
		expect(withCoupon.rules).toHaveLength(2);
		expect(untaxed.tax).toEqual({ kind: "none" });
	});

	test("the shared empty cart is not changed by using it", () => {
		addLine(emptyCart, { sku: "PEN", unitPriceCents: 250, quantity: 1 });
		expect(emptyCart).toEqual({ lines: [], rules: [], tax: { kind: "none" } });
	});

	test("pricing the same cart twice gives the same receipt", () => {
		const cart = addLine(emptyCart, { sku: "PEN", unitPriceCents: 250, quantity: 4 });
		expect(price(cart)).toEqual(price(cart));
	});
});

// EN: The contrast. With objects, `add` returns nothing and changes the cart in place: every
//     variable that points to the cart sees the new line. With functions, the old value is
//     still there after the "change".
// PT: O contraste. Com objetos, `add` não devolve nada e altera o carrinho no lugar: toda
//     variável que aponta para o carrinho enxerga a linha nova. Com funções, o valor antigo
//     continua lá depois da "alteração".
// ES: El contraste. Con objetos, `add` no devuelve nada y modifica el carrito en el mismo lugar:
//     toda variable que apunta al carrito ve la línea nueva. Con funciones, el valor antiguo
//     sigue ahí después del "cambio".
describe("objects change in place, values do not", () => {
	test("a second reference to the object cart sees the added line", () => {
		const cart = new Cart();
		const sameCart = cart;
		cart.add(new CartLine("PEN", 250, 4));
		expect(sameCart.lines()).toHaveLength(1);
	});

	test("the functional cart held before the addition still has no line", () => {
		const before = emptyCart;
		const after = addLine(before, { sku: "PEN", unitPriceCents: 250, quantity: 4 });
		expect(before.lines).toHaveLength(0);
		expect(after.lines).toHaveLength(1);
		expect(after).not.toBe(before);
	});
});
