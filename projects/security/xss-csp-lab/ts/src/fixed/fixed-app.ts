// EN: The fixed app. Same pages and same routes as the vulnerable one, with three changes:
//     1. every piece of user text goes through `escapeHtml` at the moment it is written into
//        HTML (output encoding);
//     2. the browser script uses `textContent` instead of `innerHTML` (safe DOM API);
//     3. every response carries a Content Security Policy (second layer).
//     External input is also validated with Zod.
// PT: O app corrigido. Mesmas páginas e mesmas rotas do vulnerável, com três mudanças:
//     1. todo texto do usuário passa por `escapeHtml` no momento em que é escrito no HTML
//        (codificação de saída);
//     2. o script do navegador usa `textContent` em vez de `innerHTML` (API segura do DOM);
//     3. toda resposta leva uma Content Security Policy (segunda camada).
//     A entrada externa também é validada com Zod.

import { Elysia } from "elysia";
import { z } from "zod";
import { createGuestbookStore, type GuestbookEntry } from "../guestbook-store";
import { HTML_CONTENT_TYPE, JS_CONTENT_TYPE, type LabApp } from "../lab-app";
import { renderPage } from "../layout";
import { SECURITY_HEADERS } from "../security-headers";
import { escapeHtml } from "./fixed-escape-html";

const BANNER = "FIXED - output encoding, safe DOM API and CSP";
const DOM_CLIENT = new URL("./fixed-dom-client.js", import.meta.url);

// EN: Validation checks shape and size: a name has 1 to 40 characters, a message up to 500.
//     Notice what it does NOT do: it does not look for `<script>` or remove `<`. A visitor is
//     allowed to write about HTML. Validation limits what is accepted; it is the encoding at
//     output time that makes the text harmless.
// PT: A validação confere formato e tamanho: um nome tem de 1 a 40 caracteres, uma mensagem até
//     500. Repare no que ela NÃO faz: não procura `<script>` nem remove `<`. Um visitante pode
//     escrever sobre HTML. A validação limita o que é aceito; é a codificação na saída que
//     torna o texto inofensivo.
const guestbookBody = z.object({
	author: z.string().trim().min(1).max(40),
	message: z.string().trim().min(1).max(500),
});
const searchQuery = z.object({ q: z.string().max(200).default("") });

function respond(
	body: string | Blob | null,
	init: { status?: number; headers?: Record<string, string> } = {},
): Response {
	return new Response(body, { status: init.status ?? 200, headers: { ...SECURITY_HEADERS, ...init.headers } });
}

function html(body: string): Response {
	return respond(body, { headers: { "content-type": HTML_CONTENT_TYPE } });
}

// EN: The error message is a constant. Echoing the rejected value here would open the same
//     hole again, one screen later.
// PT: A mensagem de erro é uma constante. Repetir aqui o valor rejeitado abriria o mesmo buraco
//     de novo, uma tela depois.
function invalidInput(): Response {
	return respond("Invalid input.", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
}

// EN: THE FIX (stored). The entry is escaped here, at the last moment before it becomes HTML.
//     The store keeps the original text, so the same entry could later be sent as JSON or
//     e-mail with the encoding that fits that other place.
// PT: A CORREÇÃO (armazenado). A entrada é escapada aqui, no último momento antes de virar HTML.
//     O armazenamento guarda o texto original, então a mesma entrada poderia depois ser enviada
//     como JSON ou e-mail com a codificação adequada àquele outro lugar.
function renderGuestbook(entries: readonly GuestbookEntry[]): string {
	const items = entries
		.map(
			(entry) =>
				`<li><strong data-lab="user-content">${escapeHtml(entry.author)}</strong>: <span data-lab="user-content">${escapeHtml(entry.message)}</span></li>`,
		)
		.join("\n");
	return renderPage({
		title: "Guestbook",
		banner: BANNER,
		body: `<ul>
${items}
</ul>
<form method="post" action="/guestbook">
<label>Name <input name="author" maxlength="40" required></label>
<label>Message <input name="message" maxlength="500" required></label>
<button type="submit">Sign</button>
</form>`,
	});
}

// EN: THE FIX (reflected). The term is escaped before it is written between the tags, so
//     `<script>` arrives as `&lt;script&gt;` and is displayed as text.
// PT: A CORREÇÃO (refletido). O termo é escapado antes de ser escrito entre as tags, então
//     `<script>` chega como `&lt;script&gt;` e é exibido como texto.
function renderSearch(term: string): string {
	return renderPage({
		title: "Search",
		banner: BANNER,
		body: `<form method="get" action="/search">
<label>Search <input name="q" maxlength="200"></label>
<button type="submit">Go</button>
</form>
<p>Results for:
<span data-lab="user-content">${escapeHtml(term)}</span>
</p>
<p>No results. This lab has nothing to search.</p>`,
	});
}

function renderWelcome(): string {
	return renderPage({
		title: "Welcome",
		banner: BANNER,
		body: `<p>Hello,
<span id="visitor-name" data-lab="user-content"></span>
</p>`,
		scripts: ["/static/fixed-dom-client.js"],
	});
}

export function createFixedApp(): LabApp {
	const guestbook = createGuestbookStore();
	return new Elysia()
		.get("/health", () =>
			respond(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } }),
		)
		.get("/guestbook", () => html(renderGuestbook(guestbook.list())))
		.post("/guestbook", ({ body }) => {
			const parsed = guestbookBody.safeParse(body);
			if (!parsed.success) return invalidInput();
			guestbook.add(parsed.data);
			return respond(null, { status: 303, headers: { location: "/guestbook" } });
		})
		.get("/search", ({ query }) => {
			const parsed = searchQuery.safeParse(query);
			if (!parsed.success) return invalidInput();
			return html(renderSearch(parsed.data.q));
		})
		.get("/welcome", () => html(renderWelcome()))
		.get("/static/fixed-dom-client.js", () =>
			respond(Bun.file(DOM_CLIENT), { headers: { "content-type": JS_CONTENT_TYPE } }),
		);
}
