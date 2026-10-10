import { describe, expect, test } from "bun:test";
import { Checkout, economy, express, pickup, type ShippingStrategy } from "../src/strategy/after";
import { shippingCost } from "../src/strategy/before";

describe("strategy: before", () => {
	test("prices the kinds written inside the function", () => {
		expect(shippingCost("express", 2)).toBe(2800);
		expect(shippingCost("economy", 2)).toBe(800);
		expect(shippingCost("pickup", 2)).toBe(0);
	});

	// EN: The flaw: a caller cannot bring a new kind. The only way in is to edit the function.
	// PT: O defeito: um chamador não consegue trazer uma modalidade nova. O único caminho é
	//     editar a função.
	// ES: El defecto: un llamador no puede traer una modalidad nueva. El único camino es editar la
	//     función.
	test("a new kind fails until the function itself is edited", () => {
		expect(() => shippingCost("drone", 2)).toThrow("unknown shipping kind");
	});
});

describe("strategy: after", () => {
	test("gives the same prices as the conditional version", () => {
		for (const strategy of [express, economy, pickup]) {
			expect(strategy.cost(2)).toBe(shippingCost(strategy.name, 2));
		}
	});

	test("the checkout delegates to whichever strategy it received", () => {
		expect(new Checkout(express).total(10000, 2)).toBe(12800);
		expect(new Checkout(pickup).total(10000, 2)).toBe(10000);
	});

	test("a new kind is added without editing any existing file", () => {
		const drone: ShippingStrategy = { name: "drone", cost: (weightKg) => 3500 + weightKg * 900 };
		expect(new Checkout(drone).total(10000, 2)).toBe(15300);
	});
});
