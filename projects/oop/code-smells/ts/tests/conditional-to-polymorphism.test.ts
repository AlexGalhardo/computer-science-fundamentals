import { describe, expect, test } from "bun:test";
import {
	type DeliveryMethod,
	shippingLine as lineAfter,
} from "../src/conditional-to-polymorphism/after/delivery-method";
import { Express } from "../src/conditional-to-polymorphism/after/express";
import { Pickup } from "../src/conditional-to-polymorphism/after/pickup";
import { Standard } from "../src/conditional-to-polymorphism/after/standard";
import { shippingLine as lineBefore } from "../src/conditional-to-polymorphism/before/checkout";
import type { Kind } from "../src/conditional-to-polymorphism/before/kind";

// EN: The two versions name a delivery kind differently: a string before, an object after. `M`
//     is that handle, and the suite receives the three handles plus the function under test.
// PT: As duas versões dão nome a um tipo de entrega de formas diferentes: uma string antes, um
//     objeto depois. `M` é esse identificador, e a suíte recebe os três identificadores mais a
//     função em teste.
interface Version<M> {
	standard: M;
	express: M;
	pickup: M;
	shippingLine(method: M, grams: number, orderNumber: number): string;
}

function suite<M>(name: string, version: Version<M>): void {
	describe(`conditional to polymorphism, ${name}`, () => {
		test("standard: base price plus each started kilo, 5 days", () => {
			expect(version.shippingLine(version.standard, 1, 42)).toBe("standard: 15.00, days 5, ST-000042");
			expect(version.shippingLine(version.standard, 2500, 42)).toBe("standard: 21.00, days 5, ST-000042");
		});

		test("express: more expensive, 1 day", () => {
			expect(version.shippingLine(version.express, 1000, 7)).toBe("express: 30.00, days 1, EX-000007");
			expect(version.shippingLine(version.express, 1001, 7)).toBe("express: 35.00, days 1, EX-000007");
		});

		test("pickup: free, same day", () => {
			expect(version.shippingLine(version.pickup, 9000, 123456)).toBe("pickup: 0.00, days 0, PK-123456");
		});
	});
}

suite<Kind>("before", { standard: "standard", express: "express", pickup: "pickup", shippingLine: lineBefore });
suite<DeliveryMethod>("after", {
	standard: new Standard(),
	express: new Express(),
	pickup: new Pickup(),
	shippingLine: lineAfter,
});

// EN: The point of the refactoring, as a test. A fourth kind is written right here, outside the
//     production code, and the refactored checkout handles it with no edit at all. The version
//     with conditionals cannot be extended from outside: the new kind reaches the end of the
//     first chain and throws.
// PT: O objetivo da refatoração, em forma de teste. Um quarto tipo é escrito aqui mesmo, fora do
//     código de produção, e o checkout refatorado o atende sem edição alguma. A versão com
//     condicionais não pode ser estendida de fora: o tipo novo chega ao fim da primeira cadeia e
//     lança erro.
describe("conditional to polymorphism, adding a variant", () => {
	class Drone implements DeliveryMethod {
		readonly name = "drone";
		readonly trackingPrefix = "DR";

		costCents(grams: number): number {
			return 4000 + 2 * grams;
		}

		days(): number {
			return 0;
		}
	}

	test("after: a new class is enough", () => {
		expect(lineAfter(new Drone(), 500, 9)).toBe("drone: 50.00, days 0, DR-000009");
	});

	test("before: every chain must be edited first", () => {
		expect(() => lineBefore("drone" as Kind, 500, 9)).toThrow("unknown delivery kind: drone");
	});
});
