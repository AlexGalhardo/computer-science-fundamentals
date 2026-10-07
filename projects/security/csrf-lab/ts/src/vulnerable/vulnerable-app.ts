// ============================================================================================
// EN: VULNERABLE ON PURPOSE. This file is teaching material for the CSRF lab. It must never be
//     copied into a real project or imported by any other mini-project. The safe version is
//     `src/fixed/fixed-app.ts`.
// PT: VULNERÁVEL DE PROPÓSITO. Este arquivo é material didático do laboratório de CSRF. Ele
//     nunca deve ser copiado para um projeto real nem importado por outro mini-projeto. A versão
//     segura é `src/fixed/fixed-app.ts`.
// ============================================================================================
import { type AnyElysia, Elysia } from "elysia";
import { buildSessionCookie, emailSchema, htmlResponse, isRecord, redirect, textResponse } from "../shared/http";
import { LabState, labRoutes } from "../shared/lab-state";
import { renderHome } from "../shared/pages";

export type VulnerableApp = {
	app: AnyElysia;
	state: LabState;
};

export function createVulnerableApp(): VulnerableApp {
	const state = new LabState();

	// EN: FLAW 1. The only proof this function asks for is the session cookie. The browser
	//     attaches cookies by itself, based on where the request GOES, not on which page asked
	//     for it. So the cookie proves "this browser is logged in", and nothing about "the user
	//     meant to do this". Any page the user visits can trigger this request.
	// PT: FALHA 1. A única prova que esta função pede é o cookie de sessão. O navegador anexa
	//     cookies sozinho, com base em para ONDE a requisição vai, não em qual página a pediu.
	//     Então o cookie prova "este navegador está logado", e nada sobre "o usuário quis fazer
	//     isto". Qualquer página que o usuário visitar consegue disparar esta requisição.
	function changeEmail(request: Request, rawEmail: unknown): Response {
		if (state.sessionFromRequest(request) === null) {
			state.record(request, "rejected-no-session");
			return textResponse("Not logged in.", 401);
		}
		const email = emailSchema.safeParse(rawEmail);
		if (!email.success) {
			state.record(request, "rejected-invalid-input");
			return textResponse("Invalid e-mail.", 400);
		}
		state.email = email.data;
		state.record(request, "changed");
		return redirect("/");
	}

	const app = new Elysia()
		.use(labRoutes(state))
		.get("/", ({ request }) => {
			const session = state.sessionFromRequest(request);
			return htmlResponse(
				renderHome({
					title: "Fake profile (VULNERABLE version)",
					note: "Lab app, vulnerable on purpose. Fake data only.",
					username: session?.username ?? null,
					email: state.email,
					csrfToken: null,
				}),
			);
		})
		.post("/login", ({ body }) => {
			const form = isRecord(body) ? body : {};
			if (
				typeof form.username !== "string" ||
				typeof form.password !== "string" ||
				!state.checkCredentials(form.username, form.password)
			) {
				return textResponse("Wrong user or password.", 401);
			}
			const session = state.createSession(null);
			// EN: FLAW 2. No `SameSite` attribute. The app leaves it to each browser to decide
			//     whether this cookie travels on requests started by other sites.
			// PT: FALHA 2. Sem o atributo `SameSite`. O app deixa cada navegador decidir se este
			//     cookie viaja em requisições iniciadas por outros sites.
			return redirect("/", { "set-cookie": buildSessionCookie(session.id, null) });
		})
		// EN: FLAW 3. A GET request changes state. GET is meant to be safe (read only), and
		//     browsers rely on that: following a link is a GET, and even the `SameSite=Lax`
		//     default sends cookies when a link from another site is followed.
		// PT: FALHA 3. Uma requisição GET altera estado. GET deveria ser seguro (só leitura), e
		//     os navegadores contam com isso: seguir um link é um GET, e até o padrão
		//     `SameSite=Lax` envia cookies quando um link vindo de outro site é seguido.
		.get("/email/change", ({ request, query }) => changeEmail(request, query.email))
		// EN: The form of the app itself uses POST, and has no token, so a form on any other
		//     page is indistinguishable from this one.
		// PT: O formulário do próprio app usa POST e não tem token, então um formulário em
		//     qualquer outra página é indistinguível deste.
		.post("/email/change", ({ request, body }) => changeEmail(request, isRecord(body) ? body.email : undefined));

	return { app, state };
}
