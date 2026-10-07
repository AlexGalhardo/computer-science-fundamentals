// EN: VULNERABLE ON PURPOSE. A login API with five flaws, each one marked "FLAW" below. It exists
//     only to make them observable inside this lab. Never copy this file and never import it
//     outside this lab.
// PT: VULNERÁVEL DE PROPÓSITO. Uma API de login com cinco falhas, cada uma marcada com "FLAW"
//     abaixo. Existe só para torná-las observáveis dentro deste laboratório. Nunca copie este
//     arquivo e nunca o importe fora deste laboratório.

import { randomBytes } from "node:crypto";
import { Elysia } from "elysia";
import { ACCOUNTS } from "../data";
import { jsonResponse, readCookie } from "../http";
import { storeMd5, verifyLegacyPassword } from "./vulnerable-password-storage";

export const VULNERABLE_COOKIE = "sid";

interface VulnerableSession {
	username: string | null;
}

// EN: The user table of the vulnerable API: username to unsalted MD5.
// PT: A tabela de usuários da API vulnerável: nome de usuário para MD5 sem sal.
export function createVulnerableUserTable(): Map<string, string> {
	return new Map(ACCOUNTS.map((account) => [account.username, storeMd5(account.password)]));
}

function textField(body: unknown, name: string): string {
	if (typeof body !== "object" || body === null || !(name in body)) return "";
	const value = (body as Record<string, unknown>)[name];
	return typeof value === "string" ? value : "";
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
export function createVulnerableApp(users: Map<string, string>) {
	const sessions = new Map<string, VulnerableSession>();

	// EN: FLAW 1, the cookie has no attributes besides the path. Without `HttpOnly` any script
	//     on the page reads it (`document.cookie`). Without `Secure` it also travels over plain
	//     HTTP. Without `SameSite` it is attached to requests started by other sites.
	// PT: FLAW 1, o cookie não tem nenhum atributo além do caminho. Sem `HttpOnly`, qualquer
	//     script da página o lê (`document.cookie`). Sem `Secure`, ele também viaja por HTTP
	//     puro. Sem `SameSite`, ele é anexado a requisições iniciadas por outros sites.
	function sessionCookie(id: string): string {
		return `${VULNERABLE_COOKIE}=${id}; Path=/`;
	}

	function currentSession(request: Request): { id: string; session: VulnerableSession } | undefined {
		const id = readCookie(request, VULNERABLE_COOKIE);
		if (id === undefined) return undefined;
		const session = sessions.get(id);
		return session === undefined ? undefined : { id, session };
	}

	return (
		new Elysia()
			// EN: Visiting the site creates an anonymous session, as many applications do (to
			//     hold a cart or a language). This is not a flaw by itself.
			// PT: Visitar o site cria uma sessão anônima, como muitas aplicações fazem (para
			//     guardar um carrinho ou um idioma). Isto sozinho não é uma falha.
			.get("/home", ({ request }) => {
				const current = currentSession(request);
				if (current !== undefined) return jsonResponse(200, { user: current.session.username });
				const id = randomBytes(32).toString("base64url");
				sessions.set(id, { username: null });
				return jsonResponse(200, { user: null }, { "set-cookie": sessionCookie(id) });
			})
			.post("/login", ({ request, body }) => {
				const username = textField(body, "username");
				const password = textField(body, "password");

				// EN: FLAW 2, two different answers. "unknown_user" against "wrong_password"
				//     tells anybody which usernames are registered (user enumeration).
				// PT: FLAW 2, duas respostas diferentes. "unknown_user" contra "wrong_password"
				//     conta a qualquer um quais nomes de usuário estão cadastrados (enumeração
				//     de usuários).
				const stored = users.get(username);
				if (stored === undefined) return jsonResponse(401, { error: "unknown_user" });

				// EN: FLAW 3, no attempt limit. The thousandth wrong password for the same
				//     account is evaluated exactly like the first one.
				// PT: FLAW 3, sem limite de tentativas. A milésima senha errada para a mesma
				//     conta é avaliada exatamente como a primeira.
				if (!verifyLegacyPassword(password, stored)) return jsonResponse(401, { error: "wrong_password" });

				// EN: FLAW 4, session fixation. When the browser already has a session id, the
				//     server keeps that same id and only marks it as logged in. Whoever knew the
				//     id before the login (because they planted it in the victim's browser, or
				//     saw it on a shared computer) is now logged in as the victim.
				// PT: FLAW 4, fixação de sessão. Quando o navegador já tem um id de sessão, o
				//     servidor mantém esse mesmo id e só o marca como logado. Quem conhecia o id
				//     antes do login (porque o plantou no navegador da vítima, ou o viu em um
				//     computador compartilhado) agora está logado como a vítima.
				const current = currentSession(request);
				if (current !== undefined) {
					current.session.username = username;
					return jsonResponse(200, { user: username });
				}
				const id = randomBytes(32).toString("base64url");
				sessions.set(id, { username });
				return jsonResponse(200, { user: username }, { "set-cookie": sessionCookie(id) });
			})
			.get("/me", ({ request }) => {
				const username = currentSession(request)?.session.username ?? null;
				if (username === null) return jsonResponse(401, { error: "not_logged_in" });
				return jsonResponse(200, { user: username });
			})
			// EN: FLAW 5, logout only asks the browser to forget the cookie. The session stays
			//     valid on the server, forever (there is no timeout either), so a copy of the
			//     id keeps working after the user "logged out".
			// PT: FLAW 5, o logout só pede ao navegador para esquecer o cookie. A sessão
			//     continua válida no servidor, para sempre (também não há expiração), então uma
			//     cópia do id continua funcionando depois que o usuário "saiu".
			.post("/logout", () =>
				jsonResponse(200, { loggedOut: true }, { "set-cookie": `${VULNERABLE_COOKIE}=; Path=/; Max-Age=0` }),
			)
	);
}
