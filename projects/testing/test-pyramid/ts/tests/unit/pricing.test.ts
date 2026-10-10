import { describe, expect, test } from "bun:test";
import { type CartLine, discountCents, formatCents, subtotalCents, totalCents } from "../../src/pricing";

// EN: UNIT LEVEL. One module, called directly, with nothing around it: no database, no server,
//     no browser. These tests run in milliseconds and, when one fails, it names the function
//     that is wrong. The price is that they say nothing about how the modules fit together.
// PT: NÍVEL UNITÁRIO. Um módulo, chamado direto, sem nada em volta: sem banco, sem servidor, sem
//     navegador. Estes testes rodam em milissegundos e, quando um falha, ele aponta a função
//     errada. O preço é que não dizem nada sobre como os módulos se encaixam.
// ES: NIVEL UNITARIO. Un módulo, llamado directamente, sin nada alrededor: sin base de datos, sin servidor, sin
//     navegador. Estas pruebas se ejecutan en milisegundos y, cuando una falla, señala la función
//     equivocada. El precio es que no dicen nada sobre cómo encajan los módulos.
function line(unitPriceCents: number, quantity: number): CartLine {
	return { productId: "any", name: "Any", unitPriceCents, quantity };
}

describe("subtotalCents", () => {
	test("an empty cart costs nothing", () => {
		expect(subtotalCents([])).toBe(0);
	});

	test("multiplies price by quantity and adds the lines", () => {
		expect(subtotalCents([line(2500, 2), line(750, 1)])).toBe(5750);
	});
});

// EN: Boundary values: the rule changes at 100.00, so the tests sit right below it, exactly on
//     it and above it. The seeded "unit" bug (`>` for `>=`) survives every value except 10000.
// PT: Valores-limite: a regra muda em 100,00, então os testes ficam logo abaixo, exatamente em
//     cima e acima. O bug semeado "unit" (`>` no lugar de `>=`) sobrevive a todo valor, menos 10000.
// ES: Valores límite: la regla cambia en 100,00, así que las pruebas quedan justo debajo, exactamente
//     encima y por encima. El bug sembrado "unit" (`>` en lugar de `>=`) sobrevive a todo valor, menos 10000.
describe("discountCents", () => {
	test("no discount one cent below the threshold", () => {
		expect(discountCents(9999)).toBe(0);
	});

	test("10% exactly at the threshold", () => {
		expect(discountCents(10_000)).toBe(1000);
	});

	test("10% above the threshold", () => {
		expect(discountCents(20_000)).toBe(2000);
	});
});

describe("totalCents", () => {
	test("is the subtotal when there is no discount", () => {
		expect(totalCents([line(2500, 1)])).toBe(2500);
	});

	test("subtracts the discount", () => {
		expect(totalCents([line(5000, 4)])).toBe(18_000);
	});
});

describe("formatCents", () => {
	test("always shows two decimal places", () => {
		expect(formatCents(7500)).toBe("75.00");
		expect(formatCents(5)).toBe("0.05");
	});
});
