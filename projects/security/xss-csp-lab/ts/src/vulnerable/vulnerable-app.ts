// ============================================================================================
// EN: VULNERABLE ON PURPOSE. This file contains cross-site scripting (XSS) flaws so that the
//     lab can show them. Never copy it, never import it from another project, and never serve
//     it outside the internal Docker network of this lab. The safe version is
//     `../fixed/fixed-app.ts`.
// PT: VULNERÁVEL DE PROPÓSITO. Este arquivo contém falhas de cross-site scripting (XSS) para
//     que o laboratório possa mostrá-las. Nunca o copie, nunca o importe de outro projeto e
//     nunca o sirva fora da rede Docker interna deste laboratório. A versão segura é
//     `../fixed/fixed-app.ts`.
// ES: VULNERABLE A PROPÓSITO. Este archivo contiene fallas de cross-site scripting (XSS) para
//     que el laboratorio pueda mostrarlas. Nunca lo copies, nunca lo importes desde otro proyecto y
//     nunca lo sirvas fuera de la red Docker interna de este laboratorio. La versión segura es
//     `../fixed/fixed-app.ts`.
// ============================================================================================

import { Elysia } from "elysia";
import { createGuestbookStore, type GuestbookEntry } from "../guestbook-store";
import { HTML_CONTENT_TYPE, JS_CONTENT_TYPE, type LabApp } from "../lab-app";
import { renderPage } from "../layout";
import { CONTENT_SECURITY_POLICY } from "../security-headers";

const BANNER = "VULNERABLE ON PURPOSE - lab only";
const DOM_CLIENT = new URL("./vulnerable-dom-client.js", import.meta.url);

function html(body: string, headers: Record<string, string> = {}): Response {
	return new Response(body, { headers: { "content-type": HTML_CONTENT_TYPE, ...headers } });
}

// EN: No validation at all: whatever arrives in the form is taken as it is.
// PT: Nenhuma validação: o que chegar no formulário é aceito como está.
// ES: Ninguna validación: lo que llegue en el formulario se acepta tal como está.
function field(body: unknown, name: string): string {
	if (typeof body !== "object" || body === null) return "";
	const value = (body as Record<string, unknown>)[name];
	return typeof value === "string" ? value : "";
}

// EN: THE FLAW (stored XSS). The author and the message are pasted into the HTML with string
//     concatenation. HTML has no way to know that these characters were "data": if the text
//     contains `<script>`, the browser of EVERY later visitor sees a script element and runs it.
//     It is called "stored" because the text sits in the server and is served again and again.
// PT: A FALHA (XSS armazenado). O autor e a mensagem são colados no HTML por concatenação de
//     strings. O HTML não tem como saber que esses caracteres eram "dados": se o texto contém
//     `<script>`, o navegador de TODO visitante seguinte enxerga um elemento script e o executa.
//     Chama-se "armazenado" porque o texto fica no servidor e é servido de novo e de novo.
// ES: LA FALLA (XSS almacenado). El autor y el mensaje se pegan en el HTML por concatenación de
//     cadenas. El HTML no tiene cómo saber que esos caracteres eran "datos": si el texto contiene
//     `<script>`, el navegador de CADA visitante siguiente ve un elemento script y lo ejecuta.
//     Se llama "almacenado" porque el texto queda en el servidor y se sirve una y otra vez.
function renderGuestbook(entries: readonly GuestbookEntry[]): string {
	const items = entries
		.map(
			(entry) =>
				`<li><strong data-lab="user-content">${entry.author}</strong>: <span data-lab="user-content">${entry.message}</span></li>`,
		)
		.join("\n");
	return renderPage({
		title: "Guestbook",
		banner: BANNER,
		body: `<ul>
${items}
</ul>
<form method="post" action="/guestbook">
<label>Name <input name="author"></label>
<label>Message <input name="message"></label>
<button type="submit">Sign</button>
</form>`,
	});
}

// EN: THE FLAW (reflected XSS). The search term comes from the URL and goes straight back into
//     the page. Nothing is stored: the script travels inside a link, and whoever opens that
//     link runs it. `action` is only the address of the form, a constant chosen by this file.
// PT: A FALHA (XSS refletido). O termo de busca vem da URL e volta direto para a página. Nada é
//     armazenado: o script viaja dentro de um link, e quem abrir esse link o executa. `action`
//     é só o endereço do formulário, uma constante escolhida por este arquivo.
// ES: LA FALLA (XSS reflejado). El término de búsqueda viene de la URL y vuelve directo a la página. Nada se
//     almacena: el script viaja dentro de un enlace, y quien abra ese enlace lo ejecuta. `action`
//     es solo la dirección del formulario, una constante elegida por este archivo.
function renderSearch(term: string, action: string, banner: string): string {
	return renderPage({
		title: "Search",
		banner,
		body: `<form method="get" action="${action}">
<label>Search <input name="q"></label>
<button type="submit">Go</button>
</form>
<p>Results for:
<span data-lab="user-content">${term}</span>
</p>
<p>No results. This lab has nothing to search.</p>`,
	});
}

// EN: DOM-based XSS: the server sends a harmless page. The flaw is in the script the page
//     loads (`vulnerable-dom-client.js`), which runs in the browser.
// PT: XSS baseado em DOM: o servidor envia uma página inofensiva. A falha está no script que a
//     página carrega (`vulnerable-dom-client.js`), que roda no navegador.
// ES: XSS basado en DOM: el servidor envía una página inofensiva. La falla está en el script que la
//     página carga (`vulnerable-dom-client.js`), que corre en el navegador.
function renderWelcome(): string {
	return renderPage({
		title: "Welcome",
		banner: BANNER,
		body: `<p>Hello,
<span id="visitor-name" data-lab="user-content"></span>
</p>`,
		scripts: ["/static/vulnerable-dom-client.js"],
	});
}

export function createVulnerableApp(): LabApp {
	const guestbook = createGuestbookStore();
	return (
		new Elysia()
			.get("/health", () => ({ ok: true }))
			.get("/guestbook", () => html(renderGuestbook(guestbook.list())))
			.post("/guestbook", ({ body }) => {
				guestbook.add({ author: field(body, "author"), message: field(body, "message") });
				return new Response(null, { status: 303, headers: { location: "/guestbook" } });
			})
			.get("/search", ({ query }) => html(renderSearch(query.q ?? "", "/search", BANNER)))
			// EN: "Vulnerable page with CSP only". The encoding bug is still here: the page is the
			//     same as /search. The only difference is the Content-Security-Policy header. The
			//     browser receives the injected <script>, and refuses to run it because the policy
			//     allows scripts only from files of this server. This shows CSP working as a second
			//     layer. It is NOT a fix: the markup is still injected (an attacker can still add
			//     fake forms, links or text), browsers without CSP support get no protection, and one
			//     loose directive such as 'unsafe-inline' brings the flaw back. Encode first.
			// PT: "Página vulnerável só com CSP". O bug de codificação continua aqui: a página é a
			//     mesma de /search. A única diferença é o cabeçalho Content-Security-Policy. O
			//     navegador recebe o <script> injetado e se recusa a executá-lo porque a política só
			//     permite scripts de arquivos deste servidor. Isso mostra a CSP funcionando como
			//     segunda camada. NÃO é uma correção: a marcação continua sendo injetada (um atacante
			//     ainda pode inserir formulários, links ou textos falsos), navegadores sem suporte a
			//     CSP ficam sem proteção, e uma única diretiva frouxa como 'unsafe-inline' traz a
			//     falha de volta. Codifique primeiro.
			// ES: "Página vulnerable solo con CSP". El error de codificación sigue aquí: la página es la
			//     misma de /search. La única diferencia es la cabecera Content-Security-Policy. El
			//     navegador recibe el <script> inyectado y se niega a ejecutarlo porque la política solo
			//     permite scripts de archivos de este servidor. Esto muestra la CSP funcionando como
			//     segunda capa. NO es una corrección: el marcado sigue inyectándose (un atacante
			//     aún puede insertar formularios, enlaces o textos falsos), los navegadores sin soporte de
			//     CSP quedan sin protección, y una sola directiva laxa como 'unsafe-inline' trae la
			//     falla de vuelta. Codifica primero.
			.get("/csp-only/search", ({ query }) =>
				html(
					renderSearch(query.q ?? "", "/csp-only/search", `${BANNER} - encoding bug kept, CSP header added`),
					{
						"content-security-policy": CONTENT_SECURITY_POLICY,
					},
				),
			)
			.get("/welcome", () => html(renderWelcome()))
			.get(
				"/static/vulnerable-dom-client.js",
				() => new Response(Bun.file(DOM_CLIENT), { headers: { "content-type": JS_CONTENT_TYPE } }),
			)
	);
}
