import { describe, expect, test } from "bun:test";
import { createFixedApp } from "../src/fixed/fixed-app";
import { FAKE_USER, FORGED_EMAIL, LEGITIMATE_NEW_EMAIL } from "../src/shared/config";
import { createVulnerableApp } from "../src/vulnerable/vulnerable-app";
import { forgedGet, forgedPost, legitimateChange, logIn, postChange, readCsrfTokenFromPage } from "./scenarios";

// EN: No browser here. These tests call the apps in-process and attach the cookie by hand, so
//     they answer one question only: "if the cookie DOES arrive on a forged request, what does
//     the server do?". Whether the browser sends the cookie is the job of the Playwright tests.
// PT: Sem navegador aqui. Estes testes chamam os apps dentro do processo e anexam o cookie à
//     mão, então respondem a uma única pergunta: "se o cookie CHEGAR em uma requisição forjada,
//     o que o servidor faz?". Se o navegador envia o cookie é assunto dos testes com Playwright.
// ES: Aquí no hay navegador. Estas pruebas llaman a las apps dentro del proceso y adjuntan la cookie a
//     mano, así que responden una única pregunta: "si la cookie LLEGA en una solicitud falsificada,
//     ¿qué hace el servidor?". Si el navegador envía la cookie es tema de las pruebas con Playwright.
describe("vulnerable app: the flaw is observable", () => {
	test("a forged POST carrying only the cookie changes the e-mail", async () => {
		const { app, state } = createVulnerableApp();
		const { cookieHeader } = await logIn(app);

		const response = await forgedPost(app, cookieHeader);

		expect(response.status).toBe(303);
		expect(state.email).toBe(FORGED_EMAIL);
		expect(state.observations().attempts.at(-1)).toMatchObject({ method: "POST", outcome: "changed" });
	});

	test("a forged GET changes the e-mail too", async () => {
		const { app, state } = createVulnerableApp();
		const { cookieHeader } = await logIn(app);

		const response = await forgedGet(app, cookieHeader);

		expect(response.status).toBe(303);
		expect(state.email).toBe(FORGED_EMAIL);
	});

	test("the legitimate form works", async () => {
		const { app, state } = createVulnerableApp();
		const { cookieHeader } = await logIn(app);

		const response = await legitimateChange(app, cookieHeader);

		expect(response.status).toBe(303);
		expect(state.email).toBe(LEGITIMATE_NEW_EMAIL);
	});
});

describe("fixed app: the same attempts are blocked and normal use still works", () => {
	test("a forged POST carrying the cookie but no token is refused with 403", async () => {
		const { app, state } = createFixedApp();
		const { cookieHeader } = await logIn(app);

		const response = await forgedPost(app, cookieHeader);

		expect(response.status).toBe(403);
		expect(state.email).toBe(FAKE_USER.initialEmail);
		expect(state.observations().attempts.at(-1)).toMatchObject({
			hadSessionCookie: true,
			outcome: "rejected-bad-token",
		});
	});

	test("a forged GET is refused with 405 and changes nothing", async () => {
		const { app, state } = createFixedApp();
		const { cookieHeader } = await logIn(app);

		const response = await forgedGet(app, cookieHeader);

		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("POST");
		expect(state.email).toBe(FAKE_USER.initialEmail);
	});

	test("the legitimate form works", async () => {
		const { app, state } = createFixedApp();
		const { cookieHeader } = await logIn(app);

		const response = await legitimateChange(app, cookieHeader);

		expect(response.status).toBe(303);
		expect(state.email).toBe(LEGITIMATE_NEW_EMAIL);
	});

	test("a wrong token is refused", async () => {
		const { app, state } = createFixedApp();
		const { cookieHeader } = await logIn(app);

		const response = await postChange(app, cookieHeader, { email: FORGED_EMAIL, csrfToken: "FAKE-TOKEN-not-real" });

		expect(response.status).toBe(403);
		expect(state.email).toBe(FAKE_USER.initialEmail);
	});

	// EN: "Tied to the session": a valid token of ANOTHER session must not work. Otherwise an
	//     attacker could log in to their own account, copy their own token and put it in the
	//     forged form.
	// PT: "Amarrado à sessão": um token válido de OUTRA sessão não pode funcionar. Senão um
	//     atacante poderia logar na própria conta, copiar o próprio token e colocá-lo no
	//     formulário forjado.
	// ES: "Atado a la sesión": un token válido de OTRA sesión no puede funcionar. De lo contrario un
	//     atacante podría iniciar sesión en su propia cuenta, copiar su propio token y ponerlo en el
	//     formulario falsificado.
	test("a valid token from another session is refused", async () => {
		const { app, state } = createFixedApp();
		const victim = await logIn(app);
		const other = await logIn(app);
		const otherToken = await readCsrfTokenFromPage(app, other.cookieHeader);
		expect(otherToken).not.toBeNull();

		const response = await postChange(app, victim.cookieHeader, {
			email: FORGED_EMAIL,
			csrfToken: otherToken ?? "",
		});

		expect(response.status).toBe(403);
		expect(state.email).toBe(FAKE_USER.initialEmail);
	});

	test("a request with no session is refused with 401", async () => {
		const { app, state } = createFixedApp();

		const response = await postChange(app, "", { email: FORGED_EMAIL });

		expect(response.status).toBe(401);
		expect(state.observations().attempts.at(-1)).toMatchObject({
			hadSessionCookie: false,
			outcome: "rejected-no-session",
		});
	});

	test("an invalid e-mail is refused by the Zod schema even with a valid token", async () => {
		const { app, state } = createFixedApp();
		const { cookieHeader } = await logIn(app);
		const token = await readCsrfTokenFromPage(app, cookieHeader);

		const response = await postChange(app, cookieHeader, { email: "not-an-e-mail", csrfToken: token ?? "" });

		expect(response.status).toBe(400);
		expect(state.email).toBe(FAKE_USER.initialEmail);
	});
});

describe("one defence at a time (server side)", () => {
	test("token only: the forged POST is refused although the cookie has no SameSite", async () => {
		const { app, state } = createFixedApp({ sameSite: null, requireToken: true });
		const { cookieHeader, setCookie } = await logIn(app);

		const response = await forgedPost(app, cookieHeader);

		expect(setCookie).not.toContain("SameSite");
		expect(response.status).toBe(403);
		expect(state.email).toBe(FAKE_USER.initialEmail);
	});

	// EN: An honest limit: SameSite is enforced by the BROWSER. If the cookie arrives anyway
	//     (an old browser, or a request from a sibling subdomain, which is "same site"), an app
	//     with SameSite alone has nothing left to refuse it with. That is why the fix uses both.
	// PT: Um limite honesto: o SameSite é aplicado pelo NAVEGADOR. Se o cookie chegar mesmo
	//     assim (um navegador antigo, ou uma requisição de um subdomínio irmão, que é "same
	//     site"), um app só com SameSite não tem mais com o que recusá-la. Por isso a correção
	//     usa as duas defesas.
	// ES: Un límite honesto: SameSite lo aplica el NAVEGADOR. Si la cookie llega de todos modos
	//     (un navegador antiguo, o una solicitud de un subdominio hermano, que es "same
	//     site"), una app con solo SameSite ya no tiene con qué rechazarla. Por eso la corrección
	//     usa las dos defensas.
	test("SameSite only: if the cookie arrives anyway, nothing on the server stops the change", async () => {
		const { app, state } = createFixedApp({ sameSite: "Strict", requireToken: false });
		const { cookieHeader, setCookie } = await logIn(app);

		const response = await forgedPost(app, cookieHeader);

		expect(setCookie).toContain("SameSite=Strict");
		expect(response.status).toBe(303);
		expect(state.email).toBe(FORGED_EMAIL);
	});
});
