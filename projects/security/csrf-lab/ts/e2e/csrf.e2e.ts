import { expect, test } from "@playwright/test";
import { FAKE_USER, FORGED_EMAIL, LAB_APP_HOSTS, LEGITIMATE_NEW_EMAIL } from "../src/shared/config";
import { emailShownToTheUser, forgeryScenario, legitimateFormScenario } from "./scenarios";

// EN: A cookie with NO SameSite attribute is handled differently by each browser. These are
//     the defaults of the browsers shipped in the pinned Playwright image, measured in this lab
//     (they are the reason for the rule "never rely on the browser default"):
//     - Chromium: treats it as `Lax`, but with an exception called "Lax + POST": while the
//       cookie is less than 2 minutes old it is still sent on a cross-site top-level POST.
//     - Firefox: sends it on a cross-site top-level POST.
//     - WebKit: does NOT send it on a cross-site POST.
//     - All three send it on a cross-site top-level GET navigation (a followed link).
// PT: Um cookie SEM o atributo SameSite é tratado de forma diferente por cada navegador. Estes
//     são os padrões dos navegadores que vêm na imagem fixada do Playwright, medidos neste
//     laboratório (eles são o motivo da regra "nunca dependa do padrão do navegador"):
//     - Chromium: trata como `Lax`, mas com uma exceção chamada "Lax + POST": enquanto o
//       cookie tem menos de 2 minutos ele ainda é enviado em um POST cross-site de nível superior.
//     - Firefox: envia em um POST cross-site de nível superior.
//     - WebKit: NÃO envia em um POST cross-site.
//     - Os três enviam em uma navegação GET cross-site de nível superior (um link seguido).
function defaultCookieTravelsOnCrossSitePost(browserName: string): boolean {
	return browserName !== "webkit";
}

test.describe("app-vulnerable: the forged request changes the state", () => {
	test("GET forgery: a link followed from the other origin changes the e-mail", async ({ page, request }) => {
		const result = await forgeryScenario(page, request, "app-vulnerable", "get");

		expect(result.attempt).toMatchObject({ method: "GET", hadSessionCookie: true, outcome: "changed" });
		expect(result.emailAfter).toBe(FORGED_EMAIL);
		// EN: The user never submitted the app's form, and yet this is what the profile shows.
		// PT: O usuário nunca enviou o formulário do app, e mesmo assim é isto que o perfil mostra.
		expect(await emailShownToTheUser(page, "app-vulnerable")).toBe(FORGED_EMAIL);
	});

	test("POST forgery: an auto-submitted form on the other origin", async ({ page, request, browserName }) => {
		const result = await forgeryScenario(page, request, "app-vulnerable", "post");

		expect(result.attempt.method).toBe("POST");
		expect(result.attempt.origin).toBe("http://other-origin:3000");
		if (defaultCookieTravelsOnCrossSitePost(browserName)) {
			expect(result.attempt).toMatchObject({ hadSessionCookie: true, outcome: "changed" });
			expect(result.emailAfter).toBe(FORGED_EMAIL);
			expect(await emailShownToTheUser(page, "app-vulnerable")).toBe(FORGED_EMAIL);
		} else {
			// EN: The app did nothing right here. It was saved by this browser's default, and
			//     only on this path: the GET forgery above works in this same browser.
			// PT: O app não fez nada certo aqui. Ele foi salvo pelo padrão deste navegador, e
			//     só neste caminho: a forja por GET acima funciona neste mesmo navegador.
			expect(result.attempt).toMatchObject({ hadSessionCookie: false, outcome: "rejected-no-session" });
			expect(result.emailAfter).toBe(FAKE_USER.initialEmail);
		}
	});
});

test.describe("app-token-only: the token alone refuses the forged POST", () => {
	test("POST forgery: refused, also when the cookie arrives", async ({ page, request, browserName }) => {
		const result = await forgeryScenario(page, request, "app-token-only", "post");

		if (defaultCookieTravelsOnCrossSitePost(browserName)) {
			// EN: The cookie arrived, so the server knew who the user was, and still said no.
			// PT: O cookie chegou, então o servidor sabia quem era o usuário, e mesmo assim disse não.
			expect(result.attempt).toMatchObject({ hadSessionCookie: true, outcome: "rejected-bad-token" });
		} else {
			expect(result.attempt).toMatchObject({ hadSessionCookie: false, outcome: "rejected-no-session" });
		}
		expect(result.emailAfter).toBe(FAKE_USER.initialEmail);
	});

	test("GET forgery: the cookie arrives, but GET changes nothing", async ({ page, request }) => {
		const result = await forgeryScenario(page, request, "app-token-only", "get");

		expect(result.attempt).toMatchObject({ method: "GET", hadSessionCookie: true, outcome: "rejected-method" });
		expect(result.emailAfter).toBe(FAKE_USER.initialEmail);
	});
});

test.describe("app-samesite-only: SameSite=Strict alone keeps the cookie at home", () => {
	for (const kind of ["get", "post"] as const) {
		test(`${kind.toUpperCase()} forgery: the server receives no session cookie`, async ({ page, request }) => {
			const result = await forgeryScenario(page, request, "app-samesite-only", kind);

			expect(result.attempt.hadSessionCookie).toBe(false);
			expect(result.emailAfter).toBe(FAKE_USER.initialEmail);
			// EN: The session still exists: the cookie was only withheld from the cross-site request.
			// PT: A sessão continua existindo: o cookie só foi retido na requisição cross-site.
			expect(await emailShownToTheUser(page, "app-samesite-only")).toBe(FAKE_USER.initialEmail);
		});
	}
});

test.describe("app-fixed: the same scenario is rejected", () => {
	test("POST forgery: no cookie arrives and the e-mail does not change", async ({ page, request }) => {
		const result = await forgeryScenario(page, request, "app-fixed", "post");

		expect(result.attempt).toMatchObject({
			method: "POST",
			hadSessionCookie: false,
			outcome: "rejected-no-session",
		});
		expect(result.emailAfter).toBe(FAKE_USER.initialEmail);
		expect(await emailShownToTheUser(page, "app-fixed")).toBe(FAKE_USER.initialEmail);
	});

	test("GET forgery: no cookie arrives and GET is not accepted", async ({ page, request }) => {
		const result = await forgeryScenario(page, request, "app-fixed", "get");

		expect(result.attempt).toMatchObject({ method: "GET", hadSessionCookie: false, outcome: "rejected-method" });
		expect(result.emailAfter).toBe(FAKE_USER.initialEmail);
		expect(await emailShownToTheUser(page, "app-fixed")).toBe(FAKE_USER.initialEmail);
	});
});

test.describe("the legitimate form works on every version", () => {
	for (const host of LAB_APP_HOSTS) {
		test(`${host}: the user changes the e-mail through the app's own form`, async ({ page, request }) => {
			const emailAfter = await legitimateFormScenario(page, request, host, LEGITIMATE_NEW_EMAIL);

			expect(emailAfter).toBe(LEGITIMATE_NEW_EMAIL);
		});
	}
});
