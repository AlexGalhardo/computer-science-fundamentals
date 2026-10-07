import { z } from "zod";
import { appUrl, FAKE_USER, FORGED_EMAIL, type LabAppHost, LEGITIMATE_NEW_EMAIL } from "./shared/config";

// EN: A narrated walk-through with `fetch`. Important: `fetch` in a script is NOT a browser. It
//     has no cookie jar and no SameSite rules, so this demo attaches the cookie by hand and
//     shows only the SERVER side: what each version does when the cookie arrives on a request
//     the user did not write. The browser side (does the cookie travel at all?) is shown by the
//     Playwright tests: `docker compose run --rm e2e`.
// PT: Um passo a passo narrado com `fetch`. Importante: `fetch` em um script NÃO é um navegador.
//     Ele não tem pote de cookies nem regras de SameSite, então esta demo anexa o cookie à mão e
//     mostra apenas o lado do SERVIDOR: o que cada versão faz quando o cookie chega em uma
//     requisição que o usuário não escreveu. O lado do navegador (o cookie chega a viajar?) é
//     mostrado pelos testes com Playwright: `docker compose run --rm e2e`.

const observationsSchema = z.object({ email: z.string() });

function say(text = ""): void {
	console.log(text);
}

function form(fields: Record<string, string>, cookie?: string): RequestInit {
	const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
	if (cookie !== undefined) {
		headers.cookie = cookie;
	}
	// EN: `redirect: "manual"` keeps the 303 visible instead of silently following it.
	// PT: `redirect: "manual"` mantém o 303 visível em vez de segui-lo em silêncio.
	return { method: "POST", headers, body: new URLSearchParams(fields).toString(), redirect: "manual" };
}

async function currentEmail(host: LabAppHost): Promise<string> {
	const response = await fetch(`${appUrl(host)}/lab/observations`);
	return observationsSchema.parse(await response.json()).email;
}

type Login = { setCookie: string; cookie: string };

async function logIn(host: LabAppHost): Promise<Login> {
	await fetch(`${appUrl(host)}/lab/reset`, { method: "POST" });
	const response = await fetch(
		`${appUrl(host)}/login`,
		form({ username: FAKE_USER.username, password: FAKE_USER.password }),
	);
	const setCookie = response.headers.getSetCookie()[0];
	if (setCookie === undefined) {
		throw new Error(`login on ${host} failed with status ${response.status}`);
	}
	return { setCookie, cookie: setCookie.split(";")[0] ?? "" };
}

async function walkThrough(host: LabAppHost, label: string): Promise<void> {
	say(`=== ${label} (http://${host}:3000) ===`);

	const login = await logIn(host);
	const hasSameSite = /;\s*SameSite=/i.test(login.setCookie);
	say(`1. Login as ${FAKE_USER.username}. The server answers with:`);
	say(`     Set-Cookie: ${login.setCookie.replace(/=[^;]+/, "=<session id hidden>")}`);
	say(
		hasSameSite
			? "   SameSite is explicit: the browser is told not to send this cookie on cross-site requests."
			: "   No SameSite attribute: whether a cross-site request carries this cookie is up to each browser.",
	);
	say(`   E-mail now: ${await currentEmail(host)}`);

	say("2. Forged POST: cookie attached, only the field a forging page can know (email), no token.");
	const forgedPost = await fetch(`${appUrl(host)}/email/change`, form({ email: FORGED_EMAIL }, login.cookie));
	say(`     POST /email/change -> ${forgedPost.status} ${(await forgedPost.text()).trim()}`);
	say(`   E-mail now: ${await currentEmail(host)}`);

	await fetch(`${appUrl(host)}/lab/reset`, { method: "POST" });
	const second = await logIn(host);
	say("3. Forged GET (a link): cookie attached, the e-mail in the query string.");
	const forgedGet = await fetch(`${appUrl(host)}/email/change?email=${encodeURIComponent(FORGED_EMAIL)}`, {
		headers: { cookie: second.cookie },
		redirect: "manual",
	});
	say(`     GET /email/change?email=... -> ${forgedGet.status} ${(await forgedGet.text()).trim()}`);
	say(`   E-mail now: ${await currentEmail(host)}`);

	await fetch(`${appUrl(host)}/lab/reset`, { method: "POST" });
	const third = await logIn(host);
	say("4. Legitimate use: read the app's own page, then submit its own form.");
	const page = await (await fetch(`${appUrl(host)}/`, { headers: { cookie: third.cookie } })).text();
	const token = /name="csrfToken" value="([^"]+)"/.exec(page)?.[1];
	const fields: Record<string, string> = { email: LEGITIMATE_NEW_EMAIL };
	if (token === undefined) {
		say("   The form has no hidden token field.");
	} else {
		fields.csrfToken = token;
		say(`   The form carries a hidden csrfToken (${token.length} characters, tied to this session).`);
	}
	const legitimate = await fetch(`${appUrl(host)}/email/change`, form(fields, third.cookie));
	say(`     POST /email/change -> ${legitimate.status}`);
	say(`   E-mail now: ${await currentEmail(host)}`);

	await fetch(`${appUrl(host)}/lab/reset`, { method: "POST" });
	say();
}

say("CSRF lab demo. Everything below is fake data on an internal Docker network.");
say("The cookie is attached by hand: this shows what the SERVER does when the cookie arrives.");
say();
await walkThrough("app-vulnerable", "VULNERABLE version");
await walkThrough("app-fixed", "FIXED version");
say("Summary:");
say("- Vulnerable: the cookie alone is accepted as proof, by POST and by GET. Both forgeries change the e-mail.");
say("- Fixed: the forged POST is refused (403, no token), the GET is refused (405), the real form works.");
say("- Whether a browser attaches the cookie to a cross-site request: docker compose run --rm e2e");
