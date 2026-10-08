import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { createApp } from "../../src/app";
import { CartRepository, migrate } from "../../src/cart-repository";
import { totalCents } from "../../src/pricing";

// EN: REGRESSION SUITE. Every test here was born from a bug that reached a user. The recipe is
//     always the same: write a test that reproduces the report and fails, fix the code, keep the
//     test forever. A regression suite is not a level of the pyramid, it cuts across the levels:
//     #17 is checked on a pure function, #23 through the HTTP handler. Its value is memory: the
//     cases here are exactly the ones nobody thought of when the first tests were written.
// PT: SUÍTE DE REGRESSÃO. Cada teste aqui nasceu de um bug que chegou a um usuário. A receita é
//     sempre a mesma: escrever um teste que reproduz o relato e falha, corrigir o código, manter
//     o teste para sempre. Uma suíte de regressão não é um nível da pirâmide, ela atravessa os
//     níveis: o #17 é conferido em uma função pura, o #23 pelo handler HTTP. O valor dela é a
//     memória: os casos daqui são justamente os que ninguém imaginou ao escrever os primeiros testes.

test("bug #17: a 10% discount on 100.05 must not leave half a cent in the total", () => {
	// 3 x 33.35 = 100.05, and 10% of 10005 cents is 1000.5 cents.
	const total = totalCents([{ productId: "any", name: "Any", unitPriceCents: 3335, quantity: 3 }]);
	expect(Number.isInteger(total)).toBe(true);
	expect(total).toBe(9004);
});

test("bug #23: a negative quantity must be rejected, not subtracted from the cart", async () => {
	const db = new Database(":memory:");
	migrate(db);
	const repository = new CartRepository(db);
	const app = createApp(repository);
	repository.add("keyboard", 2);

	const response = await app(
		new Request("http://shop.test/api/cart", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ productId: "keyboard", quantity: -1 }),
		}),
	);

	expect(response.status).toBe(400);
	expect(repository.list()).toEqual([{ productId: "keyboard", quantity: 2 }]);
});
