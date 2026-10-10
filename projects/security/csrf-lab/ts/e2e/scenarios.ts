import { type APIRequestContext, expect, type Page } from "@playwright/test";
import { z } from "zod";
import { APP_PORT, appUrl, FAKE_USER, type LabAppHost } from "../src/shared/config";

const OTHER_ORIGIN = `http://other-origin:${APP_PORT}`;

const observationsSchema = z.object({
	email: z.string(),
	attempts: z.array(
		z.object({
			method: z.string(),
			hadSessionCookie: z.boolean(),
			secFetchSite: z.string().nullable(),
			origin: z.string().nullable(),
			outcome: z.string(),
		}),
	),
});

export type Observations = z.infer<typeof observationsSchema>;
export type Attempt = Observations["attempts"][number];

export type ForgeryResult = {
	// EN: The e-mail stored in the app after the visit to the other origin.
	// PT: O e-mail guardado no app depois da visita à outra origem.
	// ES: El correo guardado en la app después de la visita al otro origen.
	emailAfter: string;
	// EN: What the server received on the forged request (see `Attempt` in lab-state.ts).
	// PT: O que o servidor recebeu na requisição forjada (veja `Attempt` em lab-state.ts).
	// ES: Lo que recibió el servidor en la solicitud falsificada (ve `Attempt` en lab-state.ts).
	attempt: Attempt;
};

// EN: `request` is Playwright's plain HTTP client. It is not the browser and has no cookies, so
//     it is used only for the lab instrumentation routes.
// PT: `request` é o cliente HTTP simples do Playwright. Ele não é o navegador e não tem
//     cookies, então é usado apenas para as rotas de instrumentação do laboratório.
// ES: `request` es el cliente HTTP simple de Playwright. No es el navegador y no tiene
//     cookies, así que se usa solo para las rutas de instrumentación del laboratorio.
export async function resetApp(request: APIRequestContext, host: LabAppHost): Promise<void> {
	const response = await request.post(`${appUrl(host)}/lab/reset`);
	expect(response.ok()).toBe(true);
}

export async function readObservations(request: APIRequestContext, host: LabAppHost): Promise<Observations> {
	const response = await request.get(`${appUrl(host)}/lab/observations`);
	return observationsSchema.parse(await response.json());
}

export async function logInThroughTheForm(page: Page, host: LabAppHost): Promise<void> {
	await page.goto(appUrl(host));
	await page.locator('input[name="username"]').fill(FAKE_USER.username);
	await page.locator('input[name="password"]').fill(FAKE_USER.password);
	await page.getByRole("button", { name: "Log in" }).click();
	await expect(page.locator("#current-user")).toHaveText(FAKE_USER.username);
}

// EN: What the user sees: typing the app's address is a navigation started by the user, not by
//     another site, so even a `SameSite=Strict` cookie is sent and the profile is shown.
// PT: O que o usuário vê: digitar o endereço do app é uma navegação iniciada pelo usuário, não
//     por outro site, então até um cookie `SameSite=Strict` é enviado e o perfil aparece.
// ES: Lo que ve el usuario: escribir la dirección de la app es una navegación iniciada por el usuario, no
//     por otro sitio, así que incluso una cookie `SameSite=Strict` se envía y aparece el perfil.
export async function emailShownToTheUser(page: Page, host: LabAppHost): Promise<string> {
	await page.goto(appUrl(host));
	return (await page.locator("#current-email").textContent()) ?? "";
}

// EN: THE scenario of the lab, the same for every version of the app:
//     1. the user logs in to the app through its own form;
//     2. the same browser tab visits the other origin, and the user touches nothing there;
//     3. the forging page sends the browser to the app (a link "click" or a form submit).
//     The function returns what happened, and each test decides what to expect.
// PT: O cenário do laboratório, o mesmo para todas as versões do app:
//     1. o usuário faz login no app pelo formulário do próprio app;
//     2. a mesma aba do navegador visita a outra origem, e o usuário não toca em nada ali;
//     3. a página forjadora manda o navegador para o app (um "clique" em link ou envio de formulário).
//     A função devolve o que aconteceu, e cada teste decide o que esperar.
// ES: El escenario del laboratorio, el mismo para todas las versiones de la app:
//     1. el usuario inicia sesión en la app por el formulario de la propia app;
//     2. la misma pestaña del navegador visita el otro origen, y el usuario no toca nada allí;
//     3. la página falsificadora manda al navegador hacia la app (un "clic" en un enlace o el envío de un formulario).
//     La función devuelve lo que ocurrió, y cada prueba decide qué esperar.
export async function forgeryScenario(
	page: Page,
	request: APIRequestContext,
	host: LabAppHost,
	kind: "get" | "post",
): Promise<ForgeryResult> {
	await resetApp(request, host);
	await logInThroughTheForm(page, host);

	// EN: The forging page leaves by itself as soon as it starts loading. Waiting only for
	//     "commit" (the response has arrived) instead of the full load avoids a race where
	//     the browser reports the first navigation as interrupted by the second one.
	// PT: A página forjadora sai sozinha assim que começa a carregar. Esperar apenas o
	//     "commit" (a resposta chegou) em vez do carregamento completo evita uma corrida em
	//     que o navegador relata a primeira navegação como interrompida pela segunda.
	// ES: La página falsificadora sale sola en cuanto empieza a cargar. Esperar solo el
	//     "commit" (la respuesta llegó) en lugar de la carga completa evita una carrera en
	//     la que el navegador informa la primera navegación como interrumpida por la segunda.
	await page.goto(`${OTHER_ORIGIN}/forge/${kind}?target=${host}`, { waitUntil: "commit" });
	await page.waitForURL((url) => url.hostname === host);

	const observations = await readObservations(request, host);
	const attempt = observations.attempts.at(-1);
	if (attempt === undefined) {
		throw new Error("the forged request never reached the app");
	}
	return { emailAfter: observations.email, attempt };
}

// EN: Normal use: the user changes the e-mail through the app's own form.
// PT: Uso normal: o usuário troca o e-mail pelo formulário do próprio app.
// ES: Uso normal: el usuario cambia el correo por el formulario de la propia app.
export async function legitimateFormScenario(
	page: Page,
	request: APIRequestContext,
	host: LabAppHost,
	newEmail: string,
): Promise<string> {
	await resetApp(request, host);
	await logInThroughTheForm(page, host);

	await page.locator('input[name="email"]').fill(newEmail);
	await page.getByRole("button", { name: "Change e-mail" }).click();
	await expect(page.locator("#current-email")).toHaveText(newEmail);

	return (await readObservations(request, host)).email;
}
