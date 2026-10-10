import { expect, test } from "@playwright/test";

// EN: The small suite of the end-to-end demo. It is run with the real Playwright configuration
//     of the quiz (quiz/playwright.config.ts), against the page in fixture/site.
// PT: A pequena suíte da demo de ponta a ponta. Ela roda com a configuração real do Playwright
//     do quiz (quiz/playwright.config.ts), contra a página em fixture/site.
// ES: La pequeña suite de la demo de punta a punta. Corre con la configuración real de
//     Playwright del quiz (quiz/playwright.config.ts), contra la página en fixture/site.
test("the home page shows its title", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "Sample quiz" })).toBeVisible();
});

test("the start button shows the first question", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByText("What does CI stand for?")).toBeHidden();
	await page.getByRole("button", { name: "Start" }).click();
	await expect(page.getByText("What does CI stand for?")).toBeVisible();
});
