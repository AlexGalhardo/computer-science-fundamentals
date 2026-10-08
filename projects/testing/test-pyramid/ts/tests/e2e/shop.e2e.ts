import { expect, test } from "@playwright/test";

// EN: END-TO-END LEVEL. A real Chromium opens the page, clicks and reads the screen, so the
//     whole stack is exercised at once: browser script, HTTP, handler, SQL. It is the only level
//     that runs `public/app.js`. It is also the slowest and the vaguest: a red test here says
//     "the journey is broken", not where. That is why there are three of them and not thirty.
// PT: NÍVEL DE PONTA A PONTA. Um Chromium de verdade abre a página, clica e lê a tela, então a
//     pilha inteira é exercitada de uma vez: script do navegador, HTTP, handler, SQL. É o único
//     nível que roda o `public/app.js`. Também é o mais lento e o mais vago: um teste vermelho
//     aqui diz "a jornada quebrou", não onde. Por isso são três, e não trinta.

// EN: The shop has a single cart on the server, shared by every visitor. Emptying it before
//     each test is what keeps the tests independent of each other and of their order.
// PT: A loja tem um único carrinho no servidor, compartilhado por todos os visitantes.
//     Esvaziá-lo antes de cada teste é o que mantém os testes independentes entre si e da ordem.
test.beforeEach(async ({ page, request }) => {
	await request.delete("/api/cart");
	await page.goto("/");
});

test("the page lists the three products", async ({ page }) => {
	await expect(page.getByRole("list", { name: "Products" }).getByRole("listitem")).toHaveCount(3);
});

// EN: Locators describe what a person sees (a button called "Add Mouse to cart"), and the
//     assertions wait until the page reaches the expected state. No fixed sleep is needed.
// PT: Os localizadores descrevem o que uma pessoa vê (um botão chamado "Add Mouse to cart"), e
//     as asserções esperam a página chegar ao estado esperado. Nenhuma espera fixa é necessária.
test("adding two products shows them in the cart with the total", async ({ page }) => {
	await page.getByRole("button", { name: "Add Keyboard to cart" }).click();
	await page.getByRole("button", { name: "Add Mouse to cart" }).click();

	const cart = page.getByRole("list", { name: "Cart" });
	await expect(cart.getByRole("listitem")).toHaveText(["Keyboard x 1", "Mouse x 1"]);
	await expect(page.getByTestId("cart-total")).toHaveText("75.00");
});

test("three keyboards get the discount", async ({ page }) => {
	const add = page.getByRole("button", { name: "Add Keyboard to cart" });
	const cart = page.getByRole("list", { name: "Cart" });
	// EN: Each click is followed by a check of its effect, so the next click only happens after
	//     the page caught up. Three blind clicks in a row would race against the redraw.
	// PT: Cada clique é seguido da conferência do seu efeito, então o próximo clique só acontece
	//     depois que a página alcançou o estado. Três cliques cegos seguidos disputariam com o redesenho.
	for (const quantity of [1, 2, 3]) {
		await add.click();
		await expect(cart.getByRole("listitem")).toHaveText([`Keyboard x ${quantity}`]);
	}

	await expect(page.getByTestId("cart-discount")).toHaveText("15.00");
	await expect(page.getByTestId("cart-total")).toHaveText("135.00");
});
