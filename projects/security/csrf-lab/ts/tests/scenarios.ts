import { FAKE_USER, FORGED_EMAIL, LEGITIMATE_NEW_EMAIL, SESSION_COOKIE } from "../src/shared/config";

// EN: The smallest thing both apps have in common: something that answers a Request. The same
//     scenario functions below run against the vulnerable app and against the fixed one.
// PT: A menor coisa que os dois apps têm em comum: algo que responde a uma Request. As mesmas
//     funções de cenário abaixo rodam contra o app vulnerável e contra o corrigido.
export type Handler = { handle(request: Request): Promise<Response> };

const BASE = "http://app-under-test:3000";

function form(fields: Record<string, string>): RequestInit {
	return {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams(fields).toString(),
	};
}

export type LoggedIn = {
	setCookie: string;
	// EN: What a browser would send back: only `name=value`, never the attributes.
	// PT: O que um navegador devolveria: apenas `nome=valor`, nunca os atributos.
	cookieHeader: string;
};

export async function logIn(app: Handler): Promise<LoggedIn> {
	const response = await app.handle(
		new Request(`${BASE}/login`, form({ username: FAKE_USER.username, password: FAKE_USER.password })),
	);
	const setCookie = response.headers.get("set-cookie");
	if (response.status !== 303 || setCookie === null) {
		throw new Error(`login failed with status ${response.status}`);
	}
	const pair = setCookie.split(";")[0] ?? "";
	if (!pair.startsWith(`${SESSION_COOKIE}=`)) {
		throw new Error("login did not set the session cookie");
	}
	return { setCookie, cookieHeader: pair };
}

// EN: These two functions play the worst case: a browser that DID attach the session cookie to
//     a request written by another site. That is what happens when `SameSite` does not stop
//     it. The forging page knows the path and the field name, and nothing else.
// PT: Estas duas funções encenam o pior caso: um navegador que ANEXOU o cookie de sessão a uma
//     requisição escrita por outro site. É o que acontece quando o `SameSite` não a barra. A
//     página forjadora conhece o caminho e o nome do campo, e mais nada.
export async function forgedPost(app: Handler, cookieHeader: string): Promise<Response> {
	const init = form({ email: FORGED_EMAIL });
	return app.handle(
		new Request(`${BASE}/email/change`, {
			...init,
			headers: { ...init.headers, cookie: cookieHeader, origin: "http://other-origin:3000" },
		}),
	);
}

export async function forgedGet(app: Handler, cookieHeader: string): Promise<Response> {
	return app.handle(
		new Request(`${BASE}/email/change?email=${encodeURIComponent(FORGED_EMAIL)}`, {
			headers: { cookie: cookieHeader },
		}),
	);
}

export async function readCsrfTokenFromPage(app: Handler, cookieHeader: string): Promise<string | null> {
	const page = await app.handle(new Request(`${BASE}/`, { headers: { cookie: cookieHeader } }));
	const match = /name="csrfToken" value="([^"]+)"/.exec(await page.text());
	return match?.[1] ?? null;
}

// EN: The legitimate user: opens the app's own page, and submits the app's own form with
//     whatever hidden fields the server put there.
// PT: O usuário legítimo: abre a página do próprio app e envia o formulário do próprio app com
//     os campos ocultos que o servidor tiver colocado ali.
export async function legitimateChange(app: Handler, cookieHeader: string): Promise<Response> {
	const token = await readCsrfTokenFromPage(app, cookieHeader);
	const fields: Record<string, string> = { email: LEGITIMATE_NEW_EMAIL };
	if (token !== null) {
		fields.csrfToken = token;
	}
	const init = form(fields);
	return app.handle(
		new Request(`${BASE}/email/change`, { ...init, headers: { ...init.headers, cookie: cookieHeader } }),
	);
}

export async function postChange(
	app: Handler,
	cookieHeader: string,
	fields: Record<string, string>,
): Promise<Response> {
	const init = form(fields);
	return app.handle(
		new Request(`${BASE}/email/change`, { ...init, headers: { ...init.headers, cookie: cookieHeader } }),
	);
}
