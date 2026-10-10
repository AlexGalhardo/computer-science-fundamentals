import { expect, test } from "@playwright/test";

// EN: END-TO-END LEVEL. A real Chromium opens the page, clicks and reads the screen, so the
//     whole stack is exercised at once: browser script, HTTP, handler, SQL. It is the only level
//     that runs `public/app.js`. It is also the slowest and the vaguest: a red test here says
//     "the journey is broken", not where. That is why there are three of them and not thirty.
// PT: NÍVEL DE PONTA A PONTA. Um Chromium de verdade abre a página, clica e lê a tela, então a
//     pilha inteira é exercitada de uma vez: script do navegador, HTTP, handler, SQL. É o único
//     nível que roda o `public/app.js`. Também é o mais lento e o mais vago: um teste vermelho
//     aqui diz "a jornada quebrou", não onde. Por isso são três, e não trinta.
// ES: NIVEL DE EXTREMO A EXTREMO. Un Chromium de verdad abre la página, hace clic y lee la pantalla, así que la
//     pila entera se ejercita de una vez: script del navegador, HTTP, handler, SQL. Es el único
//     nivel que ejecuta `public/app.js`. También es el más lento y el más vago: una prueba roja
//     aquí dice "el recorrido se rompió", no dónde. Por eso son tres, y no treinta.

// EN: The shop has a single cart on the server, shared by every visitor. Emptying it before
//     each test is what keeps the tests independent of each other and of their order.
// PT: A loja tem um único carrinho no servidor, compartilhado por todos os visitantes.
//     Esvaziá-lo antes de cada teste é o que mantém os testes independentes entre si e da ordem.
// ES: La tienda tiene un único carrito en el servidor, compartido por todos los visitantes.
//     Vaciarlo antes de cada prueba es lo que mantiene las pruebas independientes entre sí y del orden.
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
// ES: Los localizadores describen lo que una persona ve (un botón llamado "Add Mouse to cart"), y
//     las aserciones esperan a que la página llegue al estado esperado. No se necesita ninguna espera fija.
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
	// ES: Cada clic va seguido de la comprobación de su efecto, así el siguiente clic solo ocurre
	//     después de que la página alcanzó el estado. Tres clics a ciegas seguidos competirían con el redibujado.
	for (const quantity of [1, 2, 3]) {
		await add.click();
		await expect(cart.getByRole("listitem")).toHaveText([`Keyboard x ${quantity}`]);
	}

	await expect(page.getByTestId("cart-discount")).toHaveText("15.00");
	await expect(page.getByTestId("cart-total")).toHaveText("135.00");
});
