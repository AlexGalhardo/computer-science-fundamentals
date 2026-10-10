// EN: End-to-end tests. They drive a real browser against the static build of the quiz, made
//     from the small fixture in `tests/fixtures/content` (one area, three questions), so they
//     never depend on the real questions. Alternatives are shuffled on every attempt, so the
//     tests find a button by `data-alt` (the original index), never by its position.
// PT: Testes de ponta a ponta. Eles dirigem um navegador de verdade contra o build estático do
//     quiz, feito a partir do fixture pequeno em `tests/fixtures/content` (uma área, três
//     questões), então nunca dependem das questões reais. As alternativas são embaralhadas a
//     cada tentativa, então os testes acham um botão por `data-alt` (o índice original), nunca
//     pela posição.
// ES: Pruebas de extremo a extremo. Manejan un navegador real contra el build estático del
//     quiz, hecho a partir del fixture pequeño en `tests/fixtures/content` (un área, tres
//     preguntas), así que nunca dependen de las preguntas reales. Las alternativas se mezclan en
//     cada intento, así que las pruebas encuentran un botón por `data-alt` (el índice original),
//     nunca por la posición.

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

// EN: The selects are Base UI components, not native `<select>` elements, so Playwright's
//     `selectOption` does not work on them. This helper does what a student does: it opens the
//     list with a click, clicks the option, and waits for the list to close with the new value.
// PT: Os selects são componentes do Base UI, não elementos `<select>` nativos, então o
//     `selectOption` do Playwright não funciona neles. Este helper faz o que um estudante faz:
//     abre a lista com um clique, clica na opção e espera a lista fechar com o novo valor.
// ES: Los selects son componentes de Base UI, no elementos `<select>` nativos, así que el
//     `selectOption` de Playwright no funciona en ellos. Este helper hace lo que hace un
//     estudiante: abre la lista con un clic, hace clic en la opción y espera a que la lista
//     cierre con el nuevo valor.
async function pick(page: Page, select: "difficulty" | "size", value: string): Promise<void> {
	const trigger = page.getByTestId(select);
	await trigger.click();
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	await page.getByTestId(`${select}-option-${value}`).click();
	await expect(page.getByRole("listbox")).toHaveCount(0);
	await expect(trigger).toHaveAttribute("data-value", value);
}

async function startRun(page: Page, language = "en"): Promise<void> {
	await page.goto(`/${language}/big-o/`);
	await pick(page, "size", "all");
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
			// ES: La correcta y la incorrecta quedan marcadas, y las alternativas quedan bloqueadas.
			const key = keyOf(id);
			const right = page.locator(`[data-testid="alternative"][data-alt="${key}"]`);
			const wrong = page.locator(`[data-testid="alternative"][data-alt="${(key + 1) % 5}"]`);
			await expect(right).toHaveAttribute("data-state", "right");
			await expect(wrong).toHaveAttribute("data-state", "wrong");
			// EN: `force` skips the wait for an enabled element: the button is locked on purpose.
			// PT: `force` pula a espera por um elemento habilitado: o botão está travado de propósito.
			// ES: `force` omite la espera de un elemento habilitado: el botón está bloqueado a propósito.
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
		await pick(page, "size", "all");
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
		// EN: The bar is a meter: assistive technology reads the same "1 of 3" as numbers.
		// PT: A barra é um medidor: a tecnologia assistiva lê o mesmo "1 de 3" como números.
		// ES: La barra es un medidor: la tecnología de asistencia lee el mismo "1 de 3" como números.
		const meter = page.getByTestId("area-big-o").getByRole("meter");
		await expect(meter).toHaveAttribute("aria-valuenow", "1");
		await expect(meter).toHaveAttribute("aria-valuemax", "3");
		await expect(meter).toHaveAttribute("aria-valuetext", "1/3 right");
		const filled = await page
			.getByTestId("progress-bar-big-o")
			.evaluate((bar) => bar.getBoundingClientRect().width / (bar.parentElement?.clientWidth ?? 1));
		expect(filled).toBeGreaterThan(0.3);
		expect(filled).toBeLessThan(0.37);

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
			await pick(page, "difficulty", level);
			const expected = fixture.filter((question) => question.difficulty === level);
			await expect(page.getByTestId("matching")).toHaveText(String(expected.length));
			await page.getByTestId("start").click();
			await expect(page.getByTestId("position")).toContainText(`1 of ${expected.length}`);
			expect(expected.map((question) => question.id)).toContain(await currentId(page));
		});
	}
});

test.describe("selects of the area page", () => {
	test("the difficulty select is labelled and works with the keyboard only", async ({ page }) => {
		await page.goto("/en/big-o/");
		const select = page.getByRole("combobox", { name: "Difficulty" });
		await expect(select).toHaveAttribute("data-testid", "difficulty");
		await expect(select).toHaveText(/^All levels/);
		const box = await select.boundingBox();
		expect(box?.height).toBeGreaterThanOrEqual(44);

		// EN: Enter opens the list on the selected option, the arrow goes to the next one (All,
		//     then Basic), and Enter chooses it and closes the list.
		// PT: O Enter abre a lista na opção selecionada, a seta vai para a próxima (Todas, depois
		//     Básica), e o Enter a escolhe e fecha a lista.
		// ES: Enter abre la lista en la opción seleccionada, la flecha va a la siguiente (Todas,
		//     luego Básica), y Enter la elige y cierra la lista.
		await select.focus();
		await page.keyboard.press("Enter");
		await expect(page.getByRole("listbox")).toBeVisible();
		await expect(page.getByRole("option")).toHaveCount(4);
		for (const name of ["All levels", "Basic", "Intermediate", "Advanced"]) {
			await expect(page.getByRole("option", { name, exact: true })).toBeVisible();
		}
		await expect(page.getByRole("option", { name: "All levels" })).toHaveAttribute("aria-selected", "true");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
		await expect(page.getByRole("listbox")).toHaveCount(0);
		await expect(select).toHaveText(/^Basic/);
		await expect(select).toBeFocused();
		const basic = fixture.filter((question) => question.difficulty === "basic").length;
		await expect(page.getByTestId("matching")).toHaveText(String(basic));

		// EN: Escape closes the list and keeps the value.
		// PT: O Escape fecha a lista e mantém o valor.
		// ES: Escape cierra la lista y mantiene el valor.
		await page.keyboard.press("ArrowDown");
		await expect(page.getByRole("listbox")).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(page.getByRole("listbox")).toHaveCount(0);
		await expect(select).toContainText("Basic");
	});

	for (const theme of ["light", "dark"] as const) {
		test(`an open select passes the accessibility check and fits 320 px in the ${theme} theme`, async ({
			page,
		}) => {
			await page.addInitScript((value) => localStorage.setItem("quiz.theme", value), theme);
			await page.setViewportSize({ width: 320, height: 740 });
			await page.goto("/en/big-o/");
			await page.getByTestId("size").click();
			const list = page.getByRole("listbox");
			await expect(list).toBeVisible();
			await expectAccessible(page);
			await expectNoHorizontalOverflow(page);
			const option = await page.getByTestId("size-option-20").boundingBox();
			expect(option?.height).toBeGreaterThanOrEqual(44);
			expect((option?.x ?? -1) >= 0 && (option?.x ?? 0) + (option?.width ?? 0) <= 320).toBe(true);
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

		await expect(page.getByTestId("lang-pt")).toHaveAttribute("aria-pressed", "true");
		await page.getByTestId("lang-en").click();
		await expect(page).toHaveURL(/\/en\/big-o\/quiz\/$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await expect(page.getByTestId("lang-en")).toHaveAttribute("aria-pressed", "true");
		await expect(page.getByTestId("lang-pt")).toHaveAttribute("aria-pressed", "false");
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
		// ES: La elección se recuerda: la dirección `/` ahora va al inglés.
		await page.goto("/");
		await expect(page).toHaveURL(/\/en\/$/);
	});

	test("the language group works with the keyboard, and the pressed language cannot be unpressed", async ({
		page,
	}) => {
		await page.goto("/en/big-o/");
		const group = page.getByRole("group", { name: "Language" });
		await expect(group.getByRole("button")).toHaveCount(3);
		await page.getByTestId("lang-en").click();
		await expect(page.getByTestId("lang-en")).toHaveAttribute("aria-pressed", "true");
		await expect(page).toHaveURL(/\/en\/big-o\/$/);

		// EN: The arrow moves inside the group, and Enter presses the language under focus.
		// PT: A seta anda dentro do grupo, e o Enter pressiona o idioma em foco.
		// ES: La flecha se mueve dentro del grupo, y Enter presiona el idioma en foco.
		await page.keyboard.press("ArrowRight");
		await expect(page.getByTestId("lang-pt")).toBeFocused();
		// EN: The focus ring is drawn inside the button, because the group clips what is outside.
		// PT: O anel de foco é desenhado dentro do botão, porque o grupo recorta o que fica fora.
		// ES: El anillo de foco se dibuja dentro del botón, porque el grupo recorta lo de afuera.
		const ring = await page.getByTestId("lang-pt").evaluate((element) => {
			const style = getComputedStyle(element);
			return { style: style.outlineStyle, offset: Number.parseFloat(style.outlineOffset) };
		});
		expect(ring.style).toBe("solid");
		expect(ring.offset).toBeLessThan(0);
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(/\/pt\/big-o\/$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
		await expect(page.getByTestId("lang-pt")).toHaveAttribute("aria-pressed", "true");
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
		const toggle = page.getByRole("button", { name: "Dark theme" });
		await expect(toggle).toHaveAttribute("data-testid", "theme-toggle");
		await expect(toggle).toHaveAttribute("aria-pressed", "false");
		await toggle.click();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		await page.reload();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		// EN: The dark theme is black and white: the background is pure black.
		// PT: O tema escuro é preto e branco: o fundo é preto puro.
		// ES: El tema oscuro es blanco y negro: el fondo es negro puro.
		const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
		expect(background).toBe("rgb(0, 0, 0)");

		// EN: The keyboard takes it back to the light theme.
		// PT: O teclado o leva de volta ao tema claro.
		// ES: El teclado lo lleva de vuelta al tema claro.
		await toggle.focus();
		await page.keyboard.press("Space");
		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		await expect(toggle).toHaveAttribute("aria-pressed", "false");
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
			// ES: Áreas táctiles: las alternativas, los interruptores y la navegación miden al menos 44 por 44 px.
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
			// ES: Las dos cajas se leen en un solo paso dentro de la página. Leer una después de la
			//     otra mezclaría posiciones de antes y de después del desplazamiento hasta la explicación.
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
				// ES: Una columna: la explicación queda debajo de las alternativas, y la página se desplazó
				//     hasta ella después de la respuesta.
				expect(explanation.y).toBeGreaterThan(alternatives.y);
				await expect(page.locator("#explanation-title")).toBeInViewport();
			} else {
				expect(explanation.x).toBeGreaterThan(alternatives.x + alternatives.width - 1);
			}

			// EN: A long line of code scrolls inside its own block, not the page.
			// PT: Uma linha longa de código rola dentro do próprio bloco, não na página.
			// ES: Una línea larga de código se desplaza dentro de su propio bloque, no en la página.
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

// EN: The theory summary sits under the form that starts the quiz. These tests read it as a
//     student would: the contents list jumps to a section, the popup of a term opens with the
//     keyboard, a click and the mouse, and the three languages show the same sections.
// PT: O resumo teórico fica abaixo do formulário que começa o quiz. Estes testes o leem como um
//     estudante: o sumário pula para uma seção, o popup de um termo abre pelo teclado, por um
//     clique e pelo mouse, e os três idiomas mostram as mesmas seções.
// ES: El resumen teórico queda debajo del formulario que empieza el quiz. Estas pruebas lo leen
//     como un estudiante: el índice salta a una sección, el popup de un término se abre con el
//     teclado, con un clic y con el mouse, y los tres idiomas muestran las mismas secciones.
test.describe("theory summary of an area", () => {
	test("comes after the start form, with an introduction and linked contents", async ({ page }) => {
		await page.goto("/en/big-o/");
		const theory = page.getByTestId("theory");
		await expect(theory.getByRole("heading", { name: "Theory summary" })).toBeVisible();
		await expect(theory).toContainText("Searching means finding one item among many.");
		const start = await page.getByTestId("start").boundingBox();
		const summary = await theory.boundingBox();
		expect(summary?.y ?? 0).toBeGreaterThan(start?.y ?? Number.POSITIVE_INFINITY);

		const contents = theory.getByRole("navigation", { name: "Contents" });
		await expect(contents.getByRole("link")).toHaveText(["Linear search", "Binary search", "Which one to use"]);
		await contents.getByRole("link", { name: "Binary search" }).click();
		await expect(page).toHaveURL(/#binary-search$/);
		await expect(page.locator("#binary-search")).toBeInViewport();
	});

	test("draws every kind of block", async ({ page }) => {
		await page.goto("/en/big-o/");
		const theory = page.getByTestId("theory");
		await expect(theory.getByTestId("theory-code")).toContainText("item === target");
		await expect(theory.getByTestId("theory-diagram")).toContainText("middle");
		await expect(theory.getByRole("table")).toContainText("Binary steps");
		await expect(theory.getByTestId("theory-chart")).toContainText("1,024 steps");
		await expect(theory.getByText("Think of it like this")).toBeVisible();
		await expect(theory.getByTestId("theory-video")).toHaveAttribute("href", /^https:\/\//);
	});

	const MEANING = "the work grows in step with the number of items";

	test("a tooltip shows its meaning when the term gets focus", async ({ page }) => {
		await page.goto("/en/big-o/");
		const term = page.getByTestId("theory-tooltip").first();
		const popup = page.getByTestId("theory-tooltip-popup");
		// EN: The meaning is the accessible description of the term even with the popup closed,
		//     which is the relationship a tooltip has.
		// PT: O significado é a descrição acessível do termo mesmo com o popup fechado, que é a
		//     relação que um tooltip tem.
		// ES: El significado es la descripción accesible del término incluso con el popup
		//     cerrado, que es la relación que tiene un tooltip.
		await expect(term).toHaveAccessibleDescription(MEANING);
		await expect(popup).toHaveCount(0);

		// EN: Shift+Tab and Tab give the term real keyboard focus.
		// PT: Shift+Tab e Tab dão ao termo foco de teclado de verdade.
		// ES: Shift+Tab y Tab le dan al término foco de teclado de verdad.
		await term.focus();
		await page.keyboard.press("Shift+Tab");
		await page.keyboard.press("Tab");
		await expect(term).toBeFocused();
		await expect(popup).toBeVisible();
		await expect(popup).toContainText(MEANING);
		await expect(term).toHaveAttribute("aria-expanded", "true");
		const outline = await term.evaluate((element) => getComputedStyle(element).outlineStyle);
		expect(outline).not.toBe("none");

		await page.keyboard.press("Escape");
		await expect(popup).toHaveCount(0);
		await expect(term).toBeFocused();

		// EN: Enter opens it again. Tab goes to the close button inside the popup, and one more
		//     Tab leaves the popup, which closes it: the keyboard is never trapped.
		// PT: O Enter abre de novo. O Tab vai para o botão de fechar dentro do popup, e mais um
		//     Tab sai do popup, o que o fecha: o teclado nunca fica preso.
		// ES: Enter lo abre de nuevo. Tab va al botón de cerrar dentro del popup, y un Tab más
		//     sale del popup, lo que lo cierra: el teclado nunca queda atrapado.
		await page.keyboard.press("Enter");
		await expect(popup).toBeVisible();
		await page.keyboard.press("Tab");
		await expect(popup.getByRole("button", { name: "Close" })).toBeFocused();
		await expect(popup).toBeVisible();
		await page.keyboard.press("Tab");
		await expect(popup).toHaveCount(0);
		await expect(term).not.toBeFocused();

		// EN: Going back with Shift+Tab opens it by focus, and leaving backwards closes it.
		// PT: Voltar com Shift+Tab abre pelo foco, e sair para trás fecha.
		// ES: Volver con Shift+Tab lo abre por el foco, y salir hacia atrás lo cierra.
		await page.keyboard.press("Shift+Tab");
		await expect(term).toBeFocused();
		await expect(popup).toBeVisible();
		await page.keyboard.press("Shift+Tab");
		await expect(popup).toHaveCount(0);
	});

	test("a tooltip opens with a click and closes with a click outside", async ({ page }) => {
		await page.goto("/en/big-o/");
		const term = page.getByTestId("theory-tooltip").first();
		const popup = page.getByTestId("theory-tooltip-popup");
		await term.click();
		await expect(popup).toBeVisible();
		await expect(page.getByRole("dialog", { name: (await term.innerText()).trim() })).toContainText(MEANING);
		await page.getByRole("heading", { name: "Theory summary" }).click();
		await expect(popup).toHaveCount(0);

		// EN: The close button of the popup is a full touch target.
		// PT: O botão de fechar do popup é um alvo de toque completo.
		// ES: El botón de cerrar del popup es un área táctil completa.
		await term.click();
		const close = page.getByTestId("theory-tooltip-close");
		const box = await close.boundingBox();
		expect(box?.width).toBeGreaterThanOrEqual(44);
		expect(box?.height).toBeGreaterThanOrEqual(44);
		await close.click();
		await expect(popup).toHaveCount(0);
	});

	test("a tooltip opens when the mouse rests on the term", async ({ page }) => {
		await page.goto("/en/big-o/");
		const term = page.getByTestId("theory-tooltip").first();
		const popup = page.getByTestId("theory-tooltip-popup");
		await term.hover();
		await expect(popup).toBeVisible();
		await expect(popup).toContainText(MEANING);
		await page.mouse.move(0, 0);
		await expect(popup).toHaveCount(0);
	});

	for (const theme of ["light", "dark"] as const) {
		test(`an open tooltip opens with a tap, fits 320 px and passes the accessibility check in the ${theme} theme`, async ({
			browser,
		}) => {
			// EN: A phone: a touch screen 320 px wide, where there is no hover at all.
			// PT: Um celular: uma tela de toque com 320 px de largura, onde não existe hover.
			// ES: Un celular: una pantalla táctil de 320 px de ancho, donde no existe el hover.
			const context = await browser.newContext({
				hasTouch: true,
				isMobile: true,
				viewport: { width: 320, height: 740 },
			});
			const page = await context.newPage();
			await page.addInitScript((value) => localStorage.setItem("quiz.theme", value), theme);
			await page.goto("/en/big-o/");
			const term = page.getByTestId("theory-tooltip").first();
			const popup = page.getByTestId("theory-tooltip-popup");
			await term.tap();
			await expect(popup).toBeVisible();
			await expect(popup).toContainText(MEANING);
			await expectAccessible(page);
			await expectNoHorizontalOverflow(page);
			const box = await popup.boundingBox();
			expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 320).toBe(true);
			await context.close();
		});
	}

	for (const [language, title, section] of [
		["pt", "Resumo teórico", "Busca binária"],
		["es", "Resumen teórico", "Búsqueda binaria"],
	] as const) {
		test(`the ${language} page has the same sections, translated`, async ({ page }) => {
			await page.goto(`/${language}/big-o/#binary-search`);
			const theory = page.getByTestId("theory");
			await expect(theory.getByRole("heading", { name: title })).toBeVisible();
			await expect(page.locator("#binary-search")).toContainText(section);
		});
	}

	for (const theme of ["light", "dark"] as const) {
		test(`the area page with the summary passes the accessibility check in the ${theme} theme`, async ({
			page,
		}) => {
			await page.addInitScript((value) => localStorage.setItem("quiz.theme", value), theme);
			await page.goto("/en/big-o/");
			await expect(page.getByTestId("theory")).toBeVisible();
			const results = await new AxeBuilder({ page }).analyze();
			expect(results.violations.map((violation) => violation.id)).toEqual([]);
		});
	}
});
