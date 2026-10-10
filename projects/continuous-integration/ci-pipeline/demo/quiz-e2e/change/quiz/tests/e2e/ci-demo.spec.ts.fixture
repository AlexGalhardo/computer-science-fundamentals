import { expect, test } from "@playwright/test";

// EN: Demonstration change. The test is formatted and well typed, so the `typescript` job
//     accepts it. It fails only when a real browser opens the page and looks for the heading.
// PT: Mudança de demonstração. O teste está formatado e bem tipado, então o job `typescript` o
//     aceita. Ele só falha quando um navegador de verdade abre a página e procura o título.
// ES: Cambio de demostración. La prueba está formateada y bien tipada, así que el job
//     `typescript` la acepta. Solo falla cuando un navegador real abre la página y busca el título.
test("the home page has a heading that nobody wrote", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "A heading that does not exist" })).toBeVisible({
		timeout: 3000,
	});
});
