import { describe, expect, test } from "bun:test";
import { createFixedApp } from "../src/fixed/fixed-app";
import { escapeHtml } from "../src/fixed/fixed-escape-html";
import type { LabApp } from "../src/lab-app";
import { FAKE_AUTHOR, NORMAL_INPUT, SCRIPT_INPUT } from "../src/lab-inputs";
import { CONTENT_SECURITY_POLICY } from "../src/security-headers";
import { createVulnerableApp } from "../src/vulnerable/vulnerable-app";

// EN: Server-side tests, with no browser and no network: `app.handle` receives a Request and
//     returns the Response. They check what the server WRITES (raw markup or encoded text, and
//     the policy header). Whether a browser then runs the script is proved by the Playwright
//     tests in `tests/e2e`. The same scenario functions run against both apps.
// PT: Testes do lado do servidor, sem navegador e sem rede: `app.handle` recebe uma Request e
//     devolve a Response. Eles conferem o que o servidor ESCREVE (marcação crua ou texto
//     codificado, e o cabeçalho da política). Se um navegador depois executa o script é provado
//     pelos testes Playwright em `tests/e2e`. As mesmas funções de cenário rodam contra os dois
//     apps.
// ES: Pruebas del lado del servidor, sin navegador y sin red: `app.handle` recibe una Request y
//     devuelve la Response. Comprueban lo que el servidor ESCRIBE (marcado crudo o texto
//     codificado, y la cabecera de la política). Si un navegador después ejecuta el script lo prueban
//     las pruebas Playwright en `tests/e2e`. Las mismas funciones de escenario corren contra las dos
//     apps.

const ORIGIN = "http://lab.test";

interface Rendered {
	status: number;
	html: string;
	csp: string | null;
}

async function get(app: LabApp, path: string): Promise<Rendered> {
	const response = await app.handle(new Request(`${ORIGIN}${path}`));
	return {
		status: response.status,
		html: await response.text(),
		csp: response.headers.get("content-security-policy"),
	};
}

async function searchScenario(app: LabApp, input: string, path = "/search"): Promise<Rendered> {
	return get(app, `${path}?q=${encodeURIComponent(input)}`);
}

async function guestbookScenario(app: LabApp, author: string, message: string): Promise<Rendered> {
	const posted = await app.handle(
		new Request(`${ORIGIN}/guestbook`, { method: "POST", body: new URLSearchParams({ author, message }) }),
	);
	if (posted.status !== 303) return { status: posted.status, html: await posted.text(), csp: null };
	return get(app, "/guestbook");
}

describe("vulnerable app: the flaw is observable in the HTML", () => {
	test("reflected: the search term is written raw", async () => {
		const page = await searchScenario(createVulnerableApp(), SCRIPT_INPUT);
		expect(page.html).toContain(SCRIPT_INPUT);
		expect(page.csp).toBeNull();
	});

	test("stored: the guestbook message is written raw for every later visitor", async () => {
		const app = createVulnerableApp();
		const page = await guestbookScenario(app, FAKE_AUTHOR, SCRIPT_INPUT);
		expect(page.html).toContain(SCRIPT_INPUT);
		expect((await get(app, "/guestbook")).html).toContain(SCRIPT_INPUT);
	});

	test("CSP only: the markup is still raw, only the header is added", async () => {
		const page = await searchScenario(createVulnerableApp(), SCRIPT_INPUT, "/csp-only/search");
		expect(page.html).toContain(SCRIPT_INPUT);
		expect(page.csp).toBe(CONTENT_SECURITY_POLICY);
	});
});

describe("fixed app: the same attempts are blocked", () => {
	test("reflected: the search term is encoded and the policy is sent", async () => {
		const page = await searchScenario(createFixedApp(), SCRIPT_INPUT);
		expect(page.status).toBe(200);
		expect(page.html).not.toContain(SCRIPT_INPUT);
		expect(page.html).toContain(escapeHtml(SCRIPT_INPUT));
		expect(page.csp).toBe(CONTENT_SECURITY_POLICY);
	});

	test("stored: the message is accepted, kept and encoded at output", async () => {
		const page = await guestbookScenario(createFixedApp(), FAKE_AUTHOR, SCRIPT_INPUT);
		expect(page.status).toBe(200);
		expect(page.html).not.toContain(SCRIPT_INPUT);
		expect(page.html).toContain(escapeHtml(SCRIPT_INPUT));
		expect(page.csp).toBe(CONTENT_SECURITY_POLICY);
	});

	test("the author field is encoded too", async () => {
		const page = await guestbookScenario(createFixedApp(), "<b>bob-fake</b>", "hello");
		expect(page.html).not.toContain("<b>bob-fake</b>");
		expect(page.html).toContain("&lt;b&gt;bob-fake&lt;/b&gt;");
	});

	test("the fixed pages have no inline script and load their script from a file", async () => {
		const app = createFixedApp();
		const welcome = await get(app, "/welcome");
		expect(welcome.html).toContain('<script src="/static/fixed-dom-client.js"></script>');
		expect(welcome.html).not.toMatch(/<script>/);
		const script = await get(app, "/static/fixed-dom-client.js");
		expect(script.status).toBe(200);
		expect(script.html).toContain(".textContent =");
		expect(script.html).not.toContain(".innerHTML =");
	});

	test("the route kept only for the CSP demonstration does not exist", async () => {
		expect((await searchScenario(createFixedApp(), "x", "/csp-only/search")).status).toBe(404);
	});
});

describe("fixed app: normal use still works", () => {
	test("text with special characters is accepted and can be read back", async () => {
		const app = createFixedApp();
		expect((await searchScenario(app, NORMAL_INPUT)).html).toContain(escapeHtml(NORMAL_INPUT));
		const page = await guestbookScenario(app, FAKE_AUTHOR, NORMAL_INPUT);
		expect(page.status).toBe(200);
		expect(page.html).toContain(FAKE_AUTHOR);
		expect(page.html).toContain(escapeHtml(NORMAL_INPUT));
	});

	test("an empty search shows the page", async () => {
		expect((await get(createFixedApp(), "/search")).status).toBe(200);
	});
});

describe("fixed app: Zod rejects input with the wrong shape", () => {
	test("an empty or oversized guestbook entry is refused and never echoed", async () => {
		const app = createFixedApp();
		expect((await guestbookScenario(app, "", "hello")).status).toBe(400);
		const tooLong = await guestbookScenario(app, FAKE_AUTHOR, "x".repeat(501));
		expect(tooLong.status).toBe(400);
		expect(tooLong.html).toBe("Invalid input.");
	});

	test("an oversized search term is refused", async () => {
		expect((await searchScenario(createFixedApp(), "x".repeat(201))).status).toBe(400);
	});
});
