import { describe, expect, test } from "bun:test";
import { isAccepted, type Parcel, shippingCents } from "../../src/shipping";

// EN: THE STRONG SUITE. Same module, same 100% line coverage, but each test states the exact
//     value expected, and every limit of the rules is tested on the limit and right next to it.
//     Each survivor of the weak suite pointed at one missing assertion, and this file is the
//     result of answering them one by one.
// PT: A SUÍTE FORTE. Mesmo módulo, os mesmos 100% de cobertura de linhas, mas cada teste afirma
//     o valor exato esperado, e todo limite das regras é testado em cima do limite e logo ao
//     lado. Cada sobrevivente da suíte fraca apontava uma asserção que faltava, e este arquivo
//     é o resultado de responder a eles um por um.
function parcel(overrides: Partial<Parcel>): Parcel {
	return { weightKg: 1, distanceKm: 10, express: false, ...overrides };
}

describe("isAccepted: weight must be above 0 and at most 30 kg", () => {
	test("rejects 0 kg and accepts a weight just above it", () => {
		expect(isAccepted(parcel({ weightKg: 0 }))).toBe(false);
		expect(isAccepted(parcel({ weightKg: 0.5 }))).toBe(true);
	});

	test("accepts exactly 30 kg and rejects a weight just above it", () => {
		expect(isAccepted(parcel({ weightKg: 30 }))).toBe(true);
		expect(isAccepted(parcel({ weightKg: 30.5 }))).toBe(false);
	});
});

describe("shippingCents", () => {
	test("throws a RangeError for a parcel that is not accepted", () => {
		expect(() => shippingCents(parcel({ weightKg: 31 }))).toThrow(RangeError);
	});

	test("charges only the base price up to 2 kg", () => {
		expect(shippingCents(parcel({ weightKg: 1 }))).toBe(500);
		expect(shippingCents(parcel({ weightKg: 2 }))).toBe(500);
	});

	test("charges 150 cents for each kg above 2", () => {
		expect(shippingCents(parcel({ weightKg: 3 }))).toBe(650);
		expect(shippingCents(parcel({ weightKg: 10 }))).toBe(1700);
	});

	test("adds 300 cents from exactly 100 km", () => {
		expect(shippingCents(parcel({ distanceKm: 99 }))).toBe(500);
		expect(shippingCents(parcel({ distanceKm: 100 }))).toBe(800);
	});

	test("doubles the price of an express parcel", () => {
		expect(shippingCents(parcel({ express: true }))).toBe(1000);
		expect(shippingCents(parcel({ weightKg: 10, distanceKm: 500, express: true }))).toBe(4000);
	});
});
