import { expect, test } from "@playwright/test";
import { FAKE_AUTHOR, IMAGE_INPUT, NORMAL_INPUT, SCRIPT_INPUT } from "../../src/lab-inputs";
import { loadLabTargets } from "../../src/lab-targets";
import { CONTENT_SECURITY_POLICY } from "../../src/security-headers";
import { CSP_VIOLATION_COUNTER, domScenario, reflectedScenario, storedScenario } from "./scenarios";

// EN: Browser tests, in a real Chromium, inside the lab network. The same scenarios run
//     against both apps: on the vulnerable one the injected code runs, on the fixed one it is
//     displayed as text and ordinary use keeps working.
// PT: Testes de navegador, em um Chromium de verdade, dentro da rede do laboratório. Os mesmos
//     cenários rodam contra os dois apps: no vulnerável o código injetado roda, no corrigido
//     ele é exibido como texto e o uso comum continua funcionando.
// ES: Pruebas de navegador, en un Chromium de verdad, dentro de la red del laboratorio. Los mismos
//     escenarios corren contra las dos apps: en la vulnerable el código inyectado corre, en la corregida
//     se muestra como texto y el uso común sigue funcionando.

const targets = loadLabTargets(process.env);

test.beforeEach(async ({ page }) => {
	await page.addInitScript(CSP_VIOLATION_COUNTER);
});

test.describe("vulnerable app: the injected code runs", () => {
	test("stored XSS: a guestbook message runs for the next visitor", async ({ page }) => {
		const seen = await storedScenario(page, targets.vulnerable, FAKE_AUTHOR, SCRIPT_INPUT);
		expect(seen.scriptExecuted).toBe(true);
		expect(seen.injectedElements).toBeGreaterThan(0);
		expect(seen.cspHeader).toBeNull();
	});

	test("reflected XSS: a search link runs the code it carries", async ({ page }) => {
		const seen = await reflectedScenario(page, `${targets.vulnerable}/search`, SCRIPT_INPUT);
		expect(seen.scriptExecuted).toBe(true);
		expect(seen.injectedElements).toBe(1);
	});

	test("DOM-based XSS: innerHTML turns the URL fragment into an element", async ({ page }) => {
		const seen = await domScenario(page, targets.vulnerable, IMAGE_INPUT);
		expect(seen.scriptExecuted).toBe(true);
		expect(seen.injectedElements).toBe(1);
	});

	test("ordinary input does not run anything", async ({ page }) => {
		const seen = await reflectedScenario(page, `${targets.vulnerable}/search`, NORMAL_INPUT);
		expect(seen.scriptExecuted).toBe(false);
		expect(seen.visibleText).toContain(NORMAL_INPUT);
	});
});

test.describe("fixed app: the same attempts are shown as text", () => {
	test("stored: the message is displayed, not executed", async ({ page }) => {
		const seen = await storedScenario(page, targets.fixed, FAKE_AUTHOR, SCRIPT_INPUT);
		expect(seen.scriptExecuted).toBe(false);
		expect(seen.injectedElements).toBe(0);
		expect(seen.visibleText).toContain(SCRIPT_INPUT);
		expect(seen.cspHeader).toBe(CONTENT_SECURITY_POLICY);
		expect(seen.cspViolations).toBe(0);
	});

	test("reflected: the search term is displayed, not executed", async ({ page }) => {
		const seen = await reflectedScenario(page, `${targets.fixed}/search`, SCRIPT_INPUT);
		expect(seen.scriptExecuted).toBe(false);
		expect(seen.injectedElements).toBe(0);
		expect(seen.visibleText).toContain(SCRIPT_INPUT);
		expect(seen.cspViolations).toBe(0);
	});

	test("DOM-based: textContent writes the fragment as text", async ({ page }) => {
		const seen = await domScenario(page, targets.fixed, IMAGE_INPUT);
		expect(seen.scriptExecuted).toBe(false);
		expect(seen.injectedElements).toBe(0);
		expect(seen.visibleText).toContain(IMAGE_INPUT);
		expect(seen.cspViolations).toBe(0);
	});

	test("normal use still works on the three pages", async ({ page }) => {
		const stored = await storedScenario(page, targets.fixed, FAKE_AUTHOR, NORMAL_INPUT);
		expect(stored.visibleText).toContain(FAKE_AUTHOR);
		expect(stored.visibleText).toContain(NORMAL_INPUT);

		const reflected = await reflectedScenario(page, `${targets.fixed}/search`, NORMAL_INPUT);
		expect(reflected.visibleText).toContain(NORMAL_INPUT);

		// EN: The page script comes from a file of the same server, so `script-src 'self'` lets
		//     it run: the policy blocks injected code without breaking the application.
		// PT: O script da página vem de um arquivo do mesmo servidor, então `script-src 'self'` o
		//     deixa rodar: a política bloqueia código injetado sem quebrar a aplicação.
		// ES: El script de la página viene de un archivo del mismo servidor, así que `script-src 'self'` lo
		//     deja correr: la política bloquea el código inyectado sin romper la aplicación.
		const dom = await domScenario(page, targets.fixed, FAKE_AUTHOR);
		expect(dom.visibleText).toContain(FAKE_AUTHOR);
		expect(dom.cspViolations).toBe(0);
	});
});

// EN: CSP as a second layer. This route of the vulnerable app keeps the encoding bug and only
//     adds the policy header. The markup IS injected (injectedElements is 1), and the browser
//     refuses to run it (a violation is reported and the flag stays off). Read the two
//     assertions together: CSP reduced the damage, it did not remove the bug. That is why the
//     fixed app encodes the output first and uses CSP only as the safety net.
// PT: CSP como segunda camada. Esta rota do app vulnerável mantém o bug de codificação e só
//     acrescenta o cabeçalho da política. A marcação É injetada (injectedElements é 1), e o
//     navegador se recusa a executá-la (uma violação é reportada e a marca continua desligada).
//     Leia as duas asserções juntas: a CSP reduziu o dano, não removeu o bug. É por isso que o
//     app corrigido codifica a saída primeiro e usa a CSP só como rede de segurança.
// ES: CSP como segunda capa. Esta ruta de la app vulnerable mantiene el error de codificación y solo
//     añade la cabecera de la política. El marcado SÍ se inyecta (injectedElements es 1), y el
//     navegador se niega a ejecutarlo (se reporta una violación y la marca sigue desactivada).
//     Lee las dos aserciones juntas: la CSP redujo el daño, no eliminó el error. Por eso la
//     app corregida codifica primero la salida y usa la CSP solo como red de seguridad.
test.describe("vulnerable page with CSP only: defence in depth", () => {
	test("the inline script is injected but the policy blocks it", async ({ page }) => {
		const seen = await reflectedScenario(page, `${targets.vulnerable}/csp-only/search`, SCRIPT_INPUT);
		expect(seen.cspHeader).toBe(CONTENT_SECURITY_POLICY);
		expect(seen.injectedElements).toBe(1);
		expect(seen.scriptExecuted).toBe(false);
		expect(seen.cspViolations).toBeGreaterThan(0);
	});

	test("the inline event handler is blocked too", async ({ page }) => {
		const seen = await reflectedScenario(page, `${targets.vulnerable}/csp-only/search`, IMAGE_INPUT);
		expect(seen.injectedElements).toBe(1);
		expect(seen.scriptExecuted).toBe(false);
		expect(seen.cspViolations).toBeGreaterThan(0);
	});
});
