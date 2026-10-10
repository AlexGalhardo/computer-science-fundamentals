import { type AnyElysia, Elysia } from "elysia";
import { z } from "zod";
import {
	buildSessionCookie,
	emailSchema,
	htmlResponse,
	isRecord,
	redirect,
	type SameSite,
	textResponse,
} from "../shared/http";
import { LabState, labRoutes } from "../shared/lab-state";
import { renderHome } from "../shared/pages";
import { generateCsrfToken, verifyCsrfToken } from "./fixed-csrf-token";

// EN: The real fix uses BOTH defences. The switches exist only so the lab can turn one of them
//     off and show, in a browser, what each one does by itself.
// PT: A correção de verdade usa as DUAS defesas. As chaves existem apenas para que o
//     laboratório consiga desligar uma delas e mostrar, em um navegador, o que cada uma faz
//     sozinha.
// ES: La corrección de verdad usa las DOS defensas. Los interruptores existen solo para que el
//     laboratorio pueda desactivar una de ellas y mostrar, en un navegador, qué hace cada una
//     por sí sola.
export type FixedAppOptions = {
	sameSite: SameSite | null;
	requireToken: boolean;
};

export const FULL_DEFENCES: FixedAppOptions = { sameSite: "Strict", requireToken: true };

export type FixedApp = {
	app: AnyElysia;
	state: LabState;
};

const loginSchema = z.object({
	username: z.string().min(1).max(64),
	password: z.string().min(1).max(128),
});

const changeEmailSchema = z.object({ email: emailSchema });

export function createFixedApp(options: FixedAppOptions = FULL_DEFENCES): FixedApp {
	const state = new LabState();

	const app = new Elysia()
		.use(labRoutes(state))
		.get("/", ({ request }) => {
			const session = state.sessionFromRequest(request);
			return htmlResponse(
				renderHome({
					title: "Fake profile (fixed version)",
					note: "Lab app. Fake data only.",
					username: session?.username ?? null,
					email: state.email,
					// EN: The token is written only into the page of the logged-in user.
					// PT: O token é escrito apenas na página do usuário logado.
					// ES: El token se escribe solo en la página del usuario con sesión iniciada.
					csrfToken: options.requireToken ? (session?.csrfToken ?? null) : null,
				}),
			);
		})
		.post("/login", ({ body }) => {
			const form = loginSchema.safeParse(body);
			if (!form.success || !state.checkCredentials(form.data.username, form.data.password)) {
				return textResponse("Wrong user or password.", 401);
			}
			// EN: FIX 1. The token is born with the session and stored next to it on the server.
			// PT: CORREÇÃO 1. O token nasce com a sessão e fica guardado junto dela no servidor.
			// ES: CORRECCIÓN 1. El token nace con la sesión y queda guardado junto a ella en el servidor.
			const session = state.createSession(options.requireToken ? generateCsrfToken() : null);
			// EN: FIX 2. `SameSite=Strict` is written explicitly: the browser must not attach this
			//     cookie to any request that starts on another site. The app no longer depends on
			//     the default of whichever browser the user has.
			// PT: CORREÇÃO 2. `SameSite=Strict` é escrito explicitamente: o navegador não deve
			//     anexar este cookie a nenhuma requisição que comece em outro site. O app deixa de
			//     depender do padrão do navegador que o usuário tiver.
			// ES: CORRECCIÓN 2. `SameSite=Strict` se escribe explícitamente: el navegador no debe
			//     adjuntar esta cookie a ninguna solicitud que empiece en otro sitio. La app deja de
			//     depender del valor por defecto del navegador que tenga el usuario.
			return redirect("/", { "set-cookie": buildSessionCookie(session.id, options.sameSite) });
		})
		// EN: FIX 3. State changes only through POST. A GET on this path changes nothing and
		//     answers 405 "Method Not Allowed", so a link or a redirect cannot trigger the change.
		// PT: CORREÇÃO 3. O estado só muda por POST. Um GET neste caminho não altera nada e
		//     responde 405 "Method Not Allowed", então um link ou um redirecionamento não consegue
		//     disparar a alteração.
		// ES: CORRECCIÓN 3. El estado solo cambia por POST. Un GET en este camino no modifica nada y
		//     responde 405 "Method Not Allowed", así que un enlace o una redirección no puede
		//     disparar el cambio.
		.get("/email/change", ({ request }) => {
			state.record(request, "rejected-method");
			return textResponse("Use the form: this action only accepts POST.", 405, { allow: "POST" });
		})
		.post("/email/change", ({ request, body }) => {
			const session = state.sessionFromRequest(request);
			if (session === null) {
				state.record(request, "rejected-no-session");
				return textResponse("Not logged in.", 401);
			}
			// EN: The cookie said "this browser is logged in". The token answers the question the
			//     cookie cannot: "did this request come from a form that OUR server rendered?".
			//     It is checked before the e-mail is even looked at.
			// PT: O cookie disse "este navegador está logado". O token responde à pergunta que o
			//     cookie não consegue: "esta requisição veio de um formulário que o NOSSO servidor
			//     renderizou?". Ele é conferido antes mesmo de se olhar o e-mail.
			// ES: La cookie dijo "este navegador tiene la sesión iniciada". El token responde la pregunta que la
			//     cookie no puede: "¿esta solicitud vino de un formulario que NUESTRO servidor
			//     renderizó?". Se comprueba incluso antes de mirar el correo.
			if (
				options.requireToken &&
				!verifyCsrfToken(session.csrfToken, isRecord(body) ? body.csrfToken : undefined)
			) {
				state.record(request, "rejected-bad-token");
				return textResponse("Missing or wrong anti-CSRF token.", 403);
			}
			const form = changeEmailSchema.safeParse(body);
			if (!form.success) {
				state.record(request, "rejected-invalid-input");
				return textResponse("Invalid e-mail.", 400);
			}
			state.email = form.data.email;
			state.record(request, "changed");
			return redirect("/");
		});

	return { app, state };
}
