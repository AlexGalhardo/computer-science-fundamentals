import { expect, test } from "bun:test";

// EN: Demonstration change. The code is formatted and well typed, but it is wrong: it returns
//     the discount instead of the price after the discount. Only a test that runs it can tell.
// PT: Mudança de demonstração. O código está formatado e bem tipado, mas está errado: devolve o
//     desconto em vez do preço depois do desconto. Só um teste que o executa consegue perceber.
// ES: Cambio de demostración. El código está formateado y bien tipado, pero está mal: devuelve
//     el descuento en vez del precio después del descuento. Solo una prueba que lo ejecuta lo nota.
function priceWithDiscount(price: number, percent: number): number {
	return (price * percent) / 100;
}

test("a 10% discount on 200 costs 180", () => {
	expect(priceWithDiscount(200, 10)).toBe(180);
});
