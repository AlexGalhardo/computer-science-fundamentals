import type { Page, Response } from "@playwright/test";
import { MARKER } from "../../src/lab-inputs";

// EN: The three scenarios of the lab, written once and run against both apps. Each one does
//     what a visitor would do in a real browser and then reports what happened on the page.
//     The scenario does not know which app it is talking to: the test decides what to expect.
// PT: Os três cenários do laboratório, escritos uma vez e executados contra os dois apps. Cada
//     um faz o que um visitante faria em um navegador de verdade e depois relata o que
//     aconteceu na página. O cenário não sabe com qual app está falando: é o teste que decide o
//     que esperar.

export interface Observation {
	// EN: True when the browser ran the injected code (the flag was set on the page).
	// PT: Verdadeiro quando o navegador executou o código injetado (a marca foi ligada na página).
	scriptExecuted: boolean;
	// EN: How many <script> or <img> elements exist INSIDE the places reserved for user text.
	//     Zero means the text stayed text. More than zero means markup was injected.
	// PT: Quantos elementos <script> ou <img> existem DENTRO dos lugares reservados para texto do
	//     usuário. Zero significa que o texto continuou sendo texto. Mais que zero significa que
	//     marcação foi injetada.
	injectedElements: number;
	// EN: What a person reads on the screen in those places.
	// PT: O que uma pessoa lê na tela nesses lugares.
	visibleText: string;
	cspHeader: string | null;
	// EN: How many times the browser reported "I blocked something because of the policy".
	// PT: Quantas vezes o navegador avisou "bloqueei algo por causa da política".
	cspViolations: number;
}

// EN: Installed before any page script runs. It only counts the `securitypolicyviolation`
//     events the browser fires when the policy blocks something.
// PT: Instalado antes de qualquer script da página rodar. Ele só conta os eventos
//     `securitypolicyviolation` que o navegador dispara quando a política bloqueia algo.
export const CSP_VIOLATION_COUNTER = `
window.__labCspViolations = 0;
document.addEventListener("securitypolicyviolation", () => {
	window.__labCspViolations += 1;
});
`;

async function observe(page: Page, response: Response | null): Promise<Observation> {
	const userContent = page.locator('[data-lab="user-content"]');
	return {
		scriptExecuted: await page.evaluate<boolean>(`window.${MARKER} === true`),
		injectedElements: await userContent.locator("script, img").count(),
		visibleText: (await userContent.allInnerTexts()).join("\n"),
		cspHeader: response === null ? null : ((await response.allHeaders())["content-security-policy"] ?? null),
		cspViolations: await page.evaluate<number>("window.__labCspViolations"),
	};
}

// EN: "networkidle" waits until the page has made no request for half a second. The image of
//     the DOM-based input fails to load during that time, so its `onerror` handler has already
//     had its chance to run when the page is observed.
// PT: "networkidle" espera até a página ficar meio segundo sem fazer requisições. A imagem da
//     entrada baseada em DOM falha ao carregar nesse intervalo, então o manipulador `onerror`
//     já teve a sua chance de rodar quando a página é observada.
async function visit(page: Page, url: string): Promise<Observation> {
	const response = await page.goto(url, { waitUntil: "networkidle" });
	return observe(page, response);
}

// EN: Stored: sign the guestbook through the form, then open the guestbook again, as any later
//     visitor would.
// PT: Armazenado: assinar o livro de visitas pelo formulário e depois abrir o livro de novo,
//     como qualquer visitante seguinte faria.
export async function storedScenario(
	page: Page,
	baseUrl: string,
	author: string,
	message: string,
): Promise<Observation> {
	await page.goto(`${baseUrl}/guestbook`);
	await page.getByLabel("Name").fill(author);
	await page.getByLabel("Message").fill(message);
	await page.getByRole("button", { name: "Sign" }).click();
	await page.waitForURL(`${baseUrl}/guestbook`);
	return visit(page, `${baseUrl}/guestbook`);
}

// EN: Reflected: open a link whose query string carries the input.
// PT: Refletido: abrir um link cuja query string carrega a entrada.
export async function reflectedScenario(page: Page, searchUrl: string, input: string): Promise<Observation> {
	return visit(page, `${searchUrl}?q=${encodeURIComponent(input)}`);
}

// EN: DOM-based: open a link whose fragment (after #) carries the input. The server never sees
//     the fragment.
// PT: Baseado em DOM: abrir um link cujo fragmento (depois do #) carrega a entrada. O servidor
//     nunca vê o fragmento.
export async function domScenario(page: Page, baseUrl: string, input: string): Promise<Observation> {
	return visit(page, `${baseUrl}/welcome#${encodeURIComponent(input)}`);
}
