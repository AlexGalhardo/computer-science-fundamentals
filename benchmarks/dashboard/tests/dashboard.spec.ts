// EN: Browser tests of the dashboard, run by `bun run test:dashboard` inside the pinned
//     Playwright image with no network at all. The page is opened from disk (file://), the
//     way a reader would open it, and the tests check that every chart is drawn, that every
//     section teaches (explanation card, "why" card, "careful" card), that the tooltips work
//     with keyboard and touch, and that the page fits a 320 px screen in both themes.
// PT: Testes de navegador do dashboard, rodados pelo `bun run test:dashboard` dentro da imagem
//     fixada do Playwright, sem rede nenhuma. A página é aberta do disco (file://), do jeito
//     que uma pessoa abriria, e os testes conferem que todo gráfico é desenhado, que toda seção
//     ensina (cartão de explicação, cartão "por quê", cartão "cuidado"), que os tooltips
//     funcionam com teclado e toque, e que a página cabe em uma tela de 320 px nos dois temas.
// ES: Pruebas de navegador del dashboard, ejecutadas por `bun run test:dashboard` dentro de la
//     imagen fijada de Playwright, sin ninguna red. La página se abre desde el disco (file://),
//     como la abriría una persona, y las pruebas comprueban que cada gráfico se dibuja, que cada
//     sección enseña (tarjeta de explicación, tarjeta "por qué", tarjeta "cuidado"), que los
//     tooltips funcionan con teclado y toque, y que la página cabe en una pantalla de 320 px en
//     los dos temas.

import { expect, type Page, test } from "@playwright/test";

const SITE = `file://${process.env.SITE ?? "/site/index.html"}`;

const SECTIONS: Record<string, string[]> = {
	cpu: ["cpu-nbody", "cpu-sieve"],
	parallelism: ["par-speedup", "par-efficiency"],
	concurrency: ["conc-time", "conc-memory"],
	http: ["http-rps", "http-latency", "http-cpu", "http-memory"],
	memory: ["mem-trees-peak", "mem-trees-time", "mem-idle-time", "mem-idle-peak"],
	build: ["build-cold", "build-warm"],
	size: ["size-artifact", "size-total"],
	database: ["db-ops", "db-latency", "db-cpu", "db-memory"],
};
const CHARTS = Object.values(SECTIONS).flat();

interface Watch {
	external: string[];
	errors: string[];
}

// EN: Opens the page while recording every request that is not a local file and every script
//     error. Requests to http(s) are also aborted, so a forgotten CDN link fails the test even
//     on a machine that has a network.
// PT: Abre a página registrando toda requisição que não é um arquivo local e todo erro de
//     script. Requisições http(s) também são abortadas, então um link de CDN esquecido derruba
//     o teste mesmo em uma máquina com rede.
// ES: Abre la página registrando toda petición que no es un archivo local y todo error de
//     script. Las peticiones http(s) también se abortan, así un enlace de CDN olvidado hace
//     fallar la prueba incluso en una máquina con red.
async function open(page: Page, lang: "en" | "pt" | "es" = "en"): Promise<Watch> {
	const watch: Watch = { external: [], errors: [] };
	page.on("request", (request) => {
		if (!request.url().startsWith("file://")) {
			watch.external.push(request.url());
		}
	});
	page.on("pageerror", (error) => watch.errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") {
			watch.errors.push(message.text());
		}
	});
	await page.route(/^https?:/, (route) => route.abort());
	await page.addInitScript((value) => {
		try {
			localStorage.setItem("bench-lang", value);
		} catch {
			// EN: Storage blocked: the page falls back to the browser language.
			// PT: Armazenamento bloqueado: a página usa o idioma do navegador.
			// ES: Almacenamiento bloqueado: la página usa el idioma del navegador.
		}
	}, lang);
	await page.goto(SITE);
	await expect(page.locator("h1")).toBeVisible();
	return watch;
}

test("opens from disk with no network request and no script error", async ({ page }) => {
	const watch = await open(page);
	await page.waitForLoadState("load");
	expect(watch.external).toEqual([]);
	expect(watch.errors).toEqual([]);
});

test("every chart renders with marks, a generated caption and a data table", async ({ page }) => {
	await open(page);
	for (const id of CHARTS) {
		const chart = page.locator(`[data-chart="${id}"]`);
		await expect(chart.locator("svg"), id).toBeVisible();
		expect(await chart.locator("svg .bar, svg .line").count(), `${id} has marks`).toBeGreaterThan(0);
		expect(
			((await page.locator(`[data-caption="${id}"]`).textContent()) ?? "").length,
			`${id} has a caption`,
		).toBeGreaterThan(20);
		const figure = page.locator(`[data-figure="${id}"]`);
		await expect(figure.locator("table"), `${id} has a table`).toHaveCount(1);
		await expect(figure.locator(".bg-why"), `${id} has a why card`).toHaveCount(1);
		await expect(figure.locator(".bg-care"), `${id} has a careful card`).toHaveCount(1);
	}
	expect(await page.locator("[data-chart]").count()).toBe(CHARTS.length);
});

test("every section opens with an explanation card", async ({ page }) => {
	await open(page);
	for (const [section, charts] of Object.entries(SECTIONS)) {
		const card = page.locator(`#${section} [data-explain]`);
		await expect(card, section).toBeVisible();
		// EN: What is measured, the analogy, why it matters, how to read the charts.
		// PT: O que é medido, a analogia, por que importa, como ler os gráficos.
		// ES: Qué se mide, la analogía, por qué importa, cómo leer los gráficos.
		await expect(card.locator("dt"), section).toHaveCount(4);
		await expect(page.locator(`#${section} [data-figure]`), section).toHaveCount(charts.length);
	}
	await expect(page.locator("[data-language-card]")).toHaveCount(7);
	await expect(page.locator("#methodology")).toBeVisible();
});

test("every tooltip term has a glossary entry", async ({ page }) => {
	await open(page);
	const missing = await page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>("[data-term]")]
			.filter((button) => document.getElementById(button.getAttribute("aria-describedby") ?? "") === null)
			.map((button) => button.dataset.term),
	);
	expect(missing).toEqual([]);
	expect(await page.locator("[data-term]").count()).toBeGreaterThan(60);
	expect(await page.locator("#glossary dd").count()).toBeGreaterThan(35);
});

test("a tooltip opens with the keyboard and closes with Escape", async ({ page }) => {
	await open(page);
	const term = page.locator("#cpu [data-term]").first();
	await term.focus();
	const tip = page.locator("#tip");
	await expect(tip).toBeVisible();
	const described = await term.getAttribute("aria-describedby");
	const definition = (await page.locator(`#${described}`).textContent()) ?? "";
	expect(definition.length).toBeGreaterThan(20);
	await expect(tip).toContainText(definition);
	await page.keyboard.press("Escape");
	await expect(tip).toBeHidden();
	await page.keyboard.press("Enter");
	await expect(tip).toBeVisible();
});

test("a bar shows its numbers on hover", async ({ page }) => {
	await open(page);
	await page.locator('[data-chart="cpu-nbody"] .mark').first().hover();
	await expect(page.locator("#tip")).toContainText("C++");
});

test("the language filter hides a language in the charts", async ({ page }) => {
	await open(page);
	const bars = page.locator('[data-chart="cpu-nbody"] .bar');
	await expect(bars).toHaveCount(7);
	const before = await page.locator('[data-caption="cpu-nbody"]').textContent();
	await page.locator('#language-filter input[value="python"]').uncheck();
	await expect(bars).toHaveCount(6);
	expect(await page.locator('[data-caption="cpu-nbody"]').textContent()).not.toBe(before);
	await expect(page.locator('[data-chart="par-speedup"] .line')).toHaveCount(6);
});

test("the request and phase switches redraw their charts", async ({ page }) => {
	await open(page);
	for (const [section, chart, option] of [
		["http", "http-rps", "primes"],
		["database", "db-ops", "pool"],
	]) {
		const caption = page.locator(`[data-caption="${chart}"]`);
		const before = await page.locator(`[data-chart="${chart}"]`).innerHTML();
		await page.locator(`#${section} button[data-option="${option}"]`).click();
		await expect(page.locator(`#${section} button[data-option="${option}"]`)).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(await page.locator(`[data-chart="${chart}"]`).innerHTML()).not.toBe(before);
		await expect(caption).not.toBeEmpty();
	}
});

test("the page is available in English, Portuguese and Spanish", async ({ page }) => {
	await open(page, "en");
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.locator("#glossary h2")).toHaveText("Glossary");
	await page.locator('#language-switch button[data-lang="pt"]').click();
	await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
	await expect(page.locator("#glossary h2")).toHaveText("Glossário");
	await expect(page.locator('[data-chart="cpu-nbody"] svg')).toBeVisible();
	expect(await page.locator("[data-chart] svg").count()).toBe(CHARTS.length);
	await page.locator('#language-switch button[data-lang="es"]').click();
	await expect(page.locator("html")).toHaveAttribute("lang", "es");
	await expect(page.locator("#glossary h2")).toHaveText("Glosario");
	await expect(page.locator('[data-chart="cpu-nbody"] svg')).toBeVisible();
	expect(await page.locator("[data-chart] svg").count()).toBe(CHARTS.length);
});

// EN: WCAG contrast ratio between two colours: (lighter + 0.05) / (darker + 0.05), where each
//     term is the relative luminance. AA asks for at least 4.5 for normal text.
// PT: Razão de contraste da WCAG entre duas cores: (mais clara + 0,05) / (mais escura + 0,05),
//     onde cada termo é a luminância relativa. O nível AA pede pelo menos 4,5 para texto normal.
// ES: Razón de contraste de WCAG entre dos colores: (más claro + 0,05) / (más oscuro + 0,05),
//     donde cada término es la luminancia relativa. El nivel AA pide al menos 4,5 para texto normal.
async function lowContrast(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
		const rgba = (colour: string): [number, number, number, number] => {
			if (canvas === null) {
				return [0, 0, 0, 1];
			}
			canvas.clearRect(0, 0, 1, 1);
			canvas.fillStyle = colour;
			canvas.fillRect(0, 0, 1, 1);
			const [r = 0, g = 0, b = 0, a = 255] = canvas.getImageData(0, 0, 1, 1).data;
			return [r, g, b, a / 255];
		};
		const luminance = ([r, g, b]: number[]): number => {
			const channel = (value = 0): number => {
				const c = value / 255;
				return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
			};
			return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
		};
		const background = (node: Element): number[] => {
			for (let current: Element | null = node; current !== null; current = current.parentElement) {
				const colour = rgba(getComputedStyle(current).backgroundColor);
				if (colour[3] > 0.99) {
					return colour;
				}
			}
			return [255, 255, 255, 1];
		};
		const failures: string[] = [];
		for (const node of document.querySelectorAll("main *, header *")) {
			const own = [...node.childNodes].some(
				(child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? "").trim() !== "",
			);
			if (!own || node.closest("[hidden]") !== null) {
				continue;
			}
			const style = getComputedStyle(node);
			const ink = rgba(node instanceof SVGElement ? style.fill : style.color);
			const paper = background(node);
			const [high, low] = [luminance(ink), luminance(paper)].sort((a, b) => b - a) as [number, number];
			const ratio = (high + 0.05) / (low + 0.05);
			if (ratio < 4.5) {
				failures.push(`${node.tagName} "${(node.textContent ?? "").trim().slice(0, 30)}" ${ratio.toFixed(2)}`);
			}
		}
		return [...new Set(failures)];
	});
}

test("text meets WCAG AA contrast in the light and in the dark theme", async ({ page }) => {
	await page.emulateMedia({ colorScheme: "light" });
	await open(page);
	expect(await lowContrast(page)).toEqual([]);
	await page.locator("#theme-toggle").click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	expect(await lowContrast(page)).toEqual([]);
});

test("the theme follows the system and the toggle overrides it", async ({ page }) => {
	const pageColour = (): Promise<string> => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
	await page.emulateMedia({ colorScheme: "dark" });
	await open(page);
	const dark = await pageColour();
	await page.locator("#theme-toggle").click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	const light = await pageColour();
	expect(light).not.toBe(dark);
	await page.emulateMedia({ colorScheme: "light" });
	await page.locator("#theme-toggle").click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	expect(await pageColour()).toBe(dark);
});

test.describe("on a 320 px phone", () => {
	test.use({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });

	test("nothing scrolls sideways, in every language", async ({ page }) => {
		for (const lang of ["en", "pt", "es"] as const) {
			await open(page, lang);
			for (const id of CHARTS) {
				await expect(page.locator(`[data-chart="${id}"] svg`), id).toBeVisible();
			}
			const overflow = await page.evaluate(() => ({
				page: document.documentElement.scrollWidth,
				wide: [...document.querySelectorAll("svg")].filter(
					(node) => node.getBoundingClientRect().right > window.innerWidth + 1,
				).length,
			}));
			expect(overflow.page, lang).toBeLessThanOrEqual(320);
			expect(overflow.wide, lang).toBe(0);
		}
	});

	test("a tooltip opens with a tap and stays inside the screen", async ({ page }) => {
		await open(page);
		const term = page.locator("#http [data-term]").first();
		await term.scrollIntoViewIfNeeded();
		await term.tap();
		const tip = page.locator("#tip");
		await expect(tip).toBeVisible();
		const box = await tip.boundingBox();
		expect(box).not.toBeNull();
		expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
		expect((box?.x ?? 0) + (box?.width ?? 999)).toBeLessThanOrEqual(320);
		await term.tap();
		await expect(tip).toBeHidden();
	});

	test("a bar shows its numbers on tap", async ({ page }) => {
		await open(page);
		const mark = page.locator('[data-chart="mem-idle-time"] .mark').first();
		await mark.scrollIntoViewIfNeeded();
		await mark.tap();
		await expect(page.locator("#tip")).toBeVisible();
	});
});
