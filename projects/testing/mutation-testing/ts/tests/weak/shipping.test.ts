import { expect, test } from "bun:test";
import { isAccepted, shippingCents } from "../../src/shipping";

// EN: THE WEAK SUITE. Together these tests execute every line of shipping.ts, so the coverage
//     report says 100%. But look at what they assert: that a result is a number, that it is
//     positive, that something is thrown. They run the code without checking what it computes.
//     Coverage measures which lines were executed, not whether anyone looked at the result.
// PT: A SUÍTE FRACA. Juntos, estes testes executam todas as linhas de shipping.ts, então o
//     relatório de cobertura diz 100%. Mas veja o que eles afirmam: que um resultado é um
//     número, que é positivo, que algo é lançado. Eles rodam o código sem conferir o que ele
//     calcula. A cobertura mede quais linhas foram executadas, não se alguém olhou o resultado.
// ES: LA SUITE DÉBIL. Juntas, estas pruebas ejecutan todas las líneas de shipping.ts, así que el
//     informe de cobertura dice 100%. Pero mira lo que afirman: que un resultado es un
//     número, que es positivo, que algo se lanza. Ejecutan el código sin comprobar lo que
//     calcula. La cobertura mide qué líneas se ejecutaron, no si alguien miró el resultado.

test("a light local parcel has a positive price", () => {
	expect(shippingCents({ weightKg: 1, distanceKm: 10, express: false })).toBeGreaterThan(0);
});

test("a heavy, distant, express parcel has a price", () => {
	const cents = shippingCents({ weightKg: 10, distanceKm: 500, express: true });
	expect(typeof cents).toBe("number");
	expect(Number.isFinite(cents)).toBe(true);
});

test("a parcel with no weight is rejected", () => {
	expect(() => shippingCents({ weightKg: 0, distanceKm: 10, express: false })).toThrow();
});

test("isAccepted answers with a boolean", () => {
	expect(typeof isAccepted({ weightKg: 5, distanceKm: 10, express: false })).toBe("boolean");
});
