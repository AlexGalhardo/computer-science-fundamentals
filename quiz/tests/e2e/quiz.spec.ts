// EN: End-to-end tests. They drive a real browser against the static build of the quiz, made
//     from the small fixture in `tests/fixtures/content` (one area, three questions), so they
//     never depend on the real questions. Alternatives are shuffled on every attempt, so the
//     tests find a button by `data-alt` (the original index), never by its position.
// PT: Testes de ponta a ponta. Eles dirigem um navegador de verdade contra o build estático do
//     quiz, feito a partir do fixture pequeno em `tests/fixtures/content` (uma área, três
//     questões), então nunca dependem das questões reais. As alternativas são embaralhadas a
//     cada tentativa, então os testes acham um botão por `data-alt` (o índice original), nunca
//     pela posição.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

interface FixtureQuestion {
	id: string;
	difficulty: string;
	answer: number;
	en: { statement: string; concept: string };
	pt: { statement: string; concept: string };
	es: { statement: string; concept: string };
}

const fixture = JSON.parse(
	readFileSync(join(import.meta.dirname, "..", "fixtures", "content", "big-o", "searching.json"), "utf8"),
) as FixtureQuestion[];
const answers = new Map(fixture.map((question) => [question.id, question.answer]));
const FULL = "big-o-searching-01";
const BARE = "big-o-searching-02";

async function currentId(page: Page): Promise<string> {
	const id = await page.getByTestId("question-screen").getAttribute("data-question-id");
	if (id === null) {
		throw new Error("no question on screen");
	}
	return id;
}

function keyOf(id: string): number {
	const key = answers.get(id);
	if (key === undefined) {
		throw new Error(`unknown question ${id}`);
	}
	return key;
}

async function answerCurrent(page: Page, correctly: boolean): Promise<string> {
	const id = await currentId(page);
	const key = keyOf(id);
	await page.locator(`[data-testid="alternative"][data-alt="${correctly ? key : (key + 1) % 5}"]`).click();
	await expect(page.getByTestId("verdict")).toBeVisible();
	return id;
}

async function startRun(page: Page, language = "en"): Promise<void> {
	await page.goto(`/${language}/big-o/`);
	await page.getByTestId("size").selectOption("all");
	await page.getByTestId("start").click();
	await expect(page.getByTestId("question-screen")).toBeVisible();
}

/** Answers every question of the run. `plan` says, per question id, whether to answer correctly. */
async function completeRun(page: Page, plan: (id: string) => boolean): Promise<Map<string, boolean>> {
	const given = new Map<string, boolean>();
	for (let index = 0; index < fixture.length; index++) {
		const id = await currentId(page);
		given.set(id, plan(id));
		await answerCurrent(page, plan(id));
		await page.getByTestId("next").click();
		if (index < fixture.length - 1) {
			await expect(page.getByTestId("question-screen")).not.toHaveAttribute("data-question-id", id);
		}
	}
	await expect(page.getByTestId("score")).toBeVisible();
	return given;
}

/** Walks the run, answering correctly, until the wanted question is on screen. */
async function goToQuestion(page: Page, wanted: string): Promise<void> {
	await startRun(page);
	while ((await currentId(page)) !== wanted) {
		const id = await answerCurrent(page, true);
		await page.getByTestId("next").click();
		await expect(page.getByTestId("question-screen")).not.toHaveAttribute("data-question-id", id);
	}
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
	);
	expect(overflow).toBeLessThanOrEqual(0);
}

async function expectAccessible(page: Page): Promise<void> {
	const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
	expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

test.describe("question screen (QZ-3)", () => {
	for (const viewport of [
		{ name: "desktop", width: 1280, height: 800 },
		{ name: "phone", width: 390, height: 800 },
	]) {
		test(`the explanation appears only after the click, on ${viewport.name}`, async ({ page }) => {
			await page.setViewportSize(viewport);
			await startRun(page);
			await expect(page.getByTestId("explanation-empty")).toBeVisible();
			await expect(page.getByTestId("explanation")).toHaveCount(0);
			await expect(page.getByTestId("next")).toBeDisabled();

			const id = await answerCurrent(page, false);
			await expect(page.getByTestId("explanation")).toBeVisible();
			await expect(page.getByTestId("explanation-empty")).toHaveCount(0);
			await expect(page.getByTestId("next")).toBeEnabled();
			await expect(page.getByTestId("verdict")).toContainText("Incorrect");

			// EN: Right and wrong are marked, and the alternatives are locked.
			// PT: Certa e errada ficam marcadas, e as alternativas ficam travadas.
			const key = keyOf(id);
			const right = page.locator(`[data-testid="alternative"][data-alt="${key}"]`);
			const wrong = page.locator(`[data-testid="alternative"][data-alt="${(key + 1) % 5}"]`);
			await expect(right).toHaveAttribute("data-state", "right");
			await expect(wrong).toHaveAttribute("data-state", "wrong");
			// EN: `force` skips the wait for an enabled element: the button is locked on purpose.
			// PT: `force` pula a espera por um elemento habilitado: o botão está travado de propósito.
			await right.click({ force: true });
			await expect(wrong).toHaveAttribute("data-state", "wrong");
			await expect(page.getByTestId("verdict")).toContainText("Incorrect");
		});
	}

	test("a question with every field renders the four parts of the explanation", async ({ page }) => {
		await goToQuestion(page, FULL);
		await answerCurrent(page, true);
		const explanation = page.getByTestId("explanation");
		await expect(explanation).toContainText(fixture[0]?.en.concept ?? "");
		await expect(page.getByTestId("why-right")).toContainText("Each comparison discards half");
		await expect(page.getByTestId("why-wrong").locator("li")).toHaveCount(4);
		await expect(page.getByTestId("example")).toContainText("while (lo <= hi)");
		await expect(page.getByTestId("mini-project")).toHaveAttribute(
			"href",
			/quiz\/tests\/fixtures\/sample-project$/,
		);
		await expect(page.getByTestId("source")).toContainText("Fixture lecture");
	});

	test("a question without example and mini-project renders no empty block", async ({ page }) => {
		await goToQuestion(page, BARE);
		await answerCurrent(page, true);
		await expect(page.getByTestId("why-wrong").locator("li")).toHaveCount(4);
		await expect(page.getByTestId("example")).toHaveCount(0);
		await expect(page.getByTestId("mini-project")).toHaveCount(0);
		await expect(page.getByTestId("explanation").getByText("Example", { exact: true })).toHaveCount(0);
		await expect(page.getByTestId("source")).toBeVisible();
	});

	test("a run of three questions is completed with the keyboard only", async ({ page }) => {
		await startRun(page);
		const keys = ["1", "c", "E"];
		for (const [index, key] of keys.entries()) {
			const id = await currentId(page);
			await page.keyboard.press(key);
			await expect(page.getByTestId("verdict")).toBeVisible();
			if (index === 0) {
				await expectAccessible(page);
			}
			await page.keyboard.press("Enter");
			if (index < keys.length - 1) {
				await expect(page.getByTestId("question-screen")).not.toHaveAttribute("data-question-id", id);
			}
		}
		await expect(page.getByTestId("score")).toBeVisible();
	});

	test("focus is visible on an alternative reached with Tab", async ({ page }) => {
		await startRun(page);
		const first = page.getByTestId("alternative").first();
		await first.focus();
		await page.keyboard.press("Shift+Tab");
		await page.keyboard.press("Tab");
		await expect(first).toBeFocused();
		const outline = await first.evaluate((element) => getComputedStyle(element).outlineStyle);
		expect(outline).not.toBe("none");
	});
});

test.describe("navigation and score (QZ-4)", () => {
	test("home, area, run of three questions and result, with a matching score", async ({ page }) => {
		await page.goto("/en/");
		await expect(page.getByTestId("area-big-o")).toContainText("3 questions");
		await page.getByTestId("area-big-o").click();
		await page.getByTestId("size").selectOption("all");
		await page.getByTestId("start").click();
		const given = await completeRun(page, (id) => id !== BARE);

		const right = [...given.values()].filter(Boolean).length;
		await expect(page.getByTestId("score")).toHaveAttribute("data-right", String(right));
		await expect(page.getByTestId("score")).toHaveAttribute("data-total", "3");
		await expect(page.getByTestId("score")).toContainText("2 of 3");
		await expect(page.getByTestId("wrong-question")).toHaveCount(1);
		await expect(page.getByTestId("wrong-question")).toContainText(fixture[1]?.en.statement ?? "");
	});

	test("the address / sends the visitor to the language of the browser", async ({ browser }) => {
		const context = await browser.newContext({ locale: "pt-BR" });
		const page = await context.newPage();
		await page.goto("/");
		await expect(page).toHaveURL(/\/pt\/$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
		await context.close();
	});

	test("a Spanish browser lands on the Spanish pages", async ({ browser }) => {
		const context = await browser.newContext({ locale: "es-AR" });
		const page = await context.newPage();
		await page.goto("/");
		await expect(page).toHaveURL(/\/es\/$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "es");
		await context.close();
	});
});

test.describe("features (QZ-5)", () => {
	test("answers survive a reload, and reset clears them", async ({ page }) => {
		await startRun(page);
		await completeRun(page, (id) => id === FULL);
		await page.goto("/en/big-o/");
		await expect(page.getByTestId("count-right")).toHaveText("1");
		await expect(page.getByTestId("count-wrong")).toHaveText("2");
		await page.reload();
		await expect(page.getByTestId("count-right")).toHaveText("1");
		await expect(page.getByTestId("count-wrong")).toHaveText("2");
		await page.goto("/en/");
		await expect(page.getByTestId("progress-big-o")).toContainText("1/3");

		await page.goto("/en/big-o/");
		await page.getByTestId("reset").click();
		await expect(page.getByTestId("count-right")).toHaveText("0");
		await expect(page.getByTestId("count-wrong")).toHaveText("0");
		await page.reload();
		await expect(page.getByTestId("count-open")).toHaveText("3");
	});

	test("review mode shows exactly the wrong ones, and none after they are answered correctly", async ({ page }) => {
		await startRun(page);
		await completeRun(page, (id) => id === FULL);
		await page.goto("/en/big-o/");
		await expect(page.getByTestId("wrong-matching")).toHaveText("2");

		await page.getByTestId("review-wrong").click();
		await expect(page.getByTestId("position")).toContainText("1 of 2");
		const seen: string[] = [];
		for (let index = 0; index < 2; index++) {
			seen.push(await answerCurrent(page, true));
			await page.getByTestId("next").click();
		}
		expect(seen.sort()).toEqual(fixture.map((question) => question.id).filter((id) => id !== FULL));
		await expect(page.getByTestId("all-right")).toBeVisible();

		await page.goto("/en/big-o/");
		await expect(page.getByTestId("wrong-matching")).toHaveText("0");
		await expect(page.getByTestId("review-wrong")).toBeDisabled();
	});

	for (const level of ["basic", "intermediate", "advanced"]) {
		test(`the ${level} filter shows only ${level} questions`, async ({ page }) => {
			await page.goto("/en/big-o/");
			await page.getByTestId("difficulty").selectOption(level);
			const expected = fixture.filter((question) => question.difficulty === level);
			await expect(page.getByTestId("matching")).toHaveText(String(expected.length));
			await page.getByTestId("start").click();
			await expect(page.getByTestId("position")).toContainText(`1 of ${expected.length}`);
			expect(expected.map((question) => question.id)).toContain(await currentId(page));
		});
	}
});

test.describe("languages (QZ-6)", () => {
	test("switching language keeps the question, the chosen answer and the explanation", async ({ page }) => {
		await startRun(page, "pt");
		await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
		const id = await answerCurrent(page, false);
		const question = fixture.find((candidate) => candidate.id === id);
		const chosen = (keyOf(id) + 1) % 5;
		await expect(page.getByTestId("statement")).toHaveText(question?.pt.statement ?? "");
		await expect(page.getByTestId("verdict")).toContainText("Incorreta");

		await page.getByTestId("lang-en").click();
		await expect(page).toHaveURL(/\/en\/big-o\/quiz\/$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await expect(page.getByTestId("question-screen")).toHaveAttribute("data-question-id", id);
		await expect(page.getByTestId("statement")).toHaveText(question?.en.statement ?? "");
		await expect(page.locator(`[data-testid="alternative"][data-alt="${chosen}"]`)).toHaveAttribute(
			"data-state",
			"wrong",
		);
		await expect(page.getByTestId("verdict")).toContainText("Incorrect");
		await expect(page.getByTestId("explanation")).toContainText(question?.en.concept ?? "");

		await page.getByTestId("lang-es").click();
		await expect(page).toHaveURL(/\/es\/big-o\/quiz\/$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "es");
		await expect(page.getByTestId("question-screen")).toHaveAttribute("data-question-id", id);
		await expect(page.getByTestId("statement")).toHaveText(question?.es.statement ?? "");
		await expect(page.getByTestId("verdict")).toContainText("Incorrecta");
		await expect(page.getByTestId("explanation")).toContainText(question?.es.concept ?? "");
		await page.getByTestId("lang-en").click();
		await expect(page).toHaveURL(/\/en\/big-o\/quiz\/$/);

		// EN: The choice is remembered: the address `/` now goes to English.
		// PT: A escolha é lembrada: o endereço `/` agora vai para o inglês.
		await page.goto("/");
		await expect(page).toHaveURL(/\/en\/$/);
	});
});

test.describe("header", () => {
	test("the Source Code link opens the main repository in a new tab", async ({ page }) => {
		await page.goto("/en/");
		const link = page.getByTestId("source-code");
		await expect(link).toHaveAttribute("href", "https://github.com/AlexGalhardo/computer-science-fundamentals");
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", "noopener noreferrer");
		await expect(link).toContainText("Source Code");
	});
});

test.describe("theme (QZ-7)", () => {
	test("the toggle changes the theme and a reload keeps it", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/en/");
		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		await page.getByTestId("theme-toggle").click();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await page.reload();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
		expect(background).toBe("rgb(11, 17, 32)");
	});

	test("the first visit follows the system preference", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/en/");
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	});

	for (const theme of ["light", "dark"] as const) {
		test(`the question screen passes the contrast check in the ${theme} theme`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: theme });
			await goToQuestion(page, FULL);
			await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
			await expectAccessible(page);
			await answerCurrent(page, false);
			await expectAccessible(page);
		});
	}
});

test.describe("mobile (QZ-8)", () => {
	for (const width of [320, 390, 768, 1280]) {
		test(`the full flow has no horizontal overflow at ${width} px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 740 });
			await page.goto("/en/");
			await expectNoHorizontalOverflow(page);
			await goToQuestion(page, FULL);
			await expectNoHorizontalOverflow(page);

			// EN: Touch targets: alternatives, toggles and navigation are at least 44 by 44 px.
			// PT: Alvos de toque: alternativas, alternadores e navegação têm ao menos 44 por 44 px.
			const targets = [
				page.getByTestId("alternative").first(),
				page.getByTestId("next"),
				page.getByTestId("theme-toggle"),
				page.getByTestId("lang-pt"),
				page.getByTestId("source-code"),
			];
			for (const target of targets) {
				const box = await target.boundingBox();
				expect(box?.width).toBeGreaterThanOrEqual(44);
				expect(box?.height).toBeGreaterThanOrEqual(44);
			}

			await answerCurrent(page, true);
			await expectNoHorizontalOverflow(page);
			// EN: Both boxes are read in one step inside the page. Reading them one after the
			//     other would mix positions from before and after the scroll to the explanation.
			// PT: As duas caixas são lidas em um único passo dentro da página. Ler uma depois da
			//     outra misturaria posições de antes e de depois da rolagem até a explicação.
			const { alternatives, explanation } = await page.evaluate(() => {
				const box = (selector: string): { x: number; y: number; width: number } => {
					const all = document.querySelectorAll(selector);
					const rect = all[all.length - 1]?.getBoundingClientRect();
					if (rect === undefined) {
						throw new Error(`${selector} not found`);
					}
					return { x: rect.x, y: rect.y, width: rect.width };
				};
				return { alternatives: box('[data-testid="alternative"]'), explanation: box("#explanation-title") };
			});
			if (width < 768) {
				// EN: One column: the explanation is under the alternatives, and the page
				//     scrolled to it after the answer.
				// PT: Uma coluna: a explicação fica abaixo das alternativas, e a página rolou
				//     até ela depois da resposta.
				expect(explanation.y).toBeGreaterThan(alternatives.y);
				await expect(page.locator("#explanation-title")).toBeInViewport();
			} else {
				expect(explanation.x).toBeGreaterThan(alternatives.x + alternatives.width - 1);
			}

			// EN: A long line of code scrolls inside its own block, not the page.
			// PT: Uma linha longa de código rola dentro do próprio bloco, não na página.
			const example = page.getByTestId("example");
			const fits = await example.evaluate(
				(element) => element.getBoundingClientRect().right <= window.innerWidth,
			);
			expect(fits).toBe(true);

			await page.getByTestId("next").click();
			await expectNoHorizontalOverflow(page);
		});
	}
});
