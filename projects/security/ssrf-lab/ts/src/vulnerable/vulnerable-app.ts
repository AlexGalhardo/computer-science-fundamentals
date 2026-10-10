// EN: VULNERABLE ON PURPOSE. This ElysiaJS app exists only to demonstrate server-side request
//     forgery (SSRF) inside this local lab. Never copy it and never import it from anywhere
//     outside this mini-project. The safe version is `../fixed/fixed-app.ts`.
// PT: VULNERÁVEL DE PROPÓSITO. Este app ElysiaJS existe só para demonstrar server-side request
//     forgery (SSRF) dentro deste laboratório local. Nunca copie e nunca importe de fora deste
//     mini-projeto. A versão segura é `../fixed/fixed-app.ts`.
// ES: VULNERABLE A PROPÓSITO. Esta app ElysiaJS existe solo para demostrar server-side request
//     forgery (SSRF) dentro de este laboratorio local. Nunca la copies ni la importes desde fuera de este
//     miniproyecto. La versión segura es `../fixed/fixed-app.ts`.

import { Elysia } from "elysia";
import { buildPreview } from "../preview";

function urlField(body: unknown): string {
	if (typeof body !== "object" || body === null) {
		return "";
	}
	const value: unknown = (body as Record<string, unknown>).url;
	return typeof value === "string" ? value : "";
}

// EN: The flaw is one line: `fetch(url)` with a URL chosen by the user. The request leaves from
//     the SERVER, so it carries the server's place in the network: it can reach hosts that the
//     user cannot reach directly, such as an internal service with no login. Four mistakes pile
//     up here: no check of where the URL points, redirects followed automatically (the default
//     of `fetch`), no limit on the size of the answer and no timeout.
// PT: A falha é uma linha: `fetch(url)` com uma URL escolhida pelo usuário. A requisição sai do
//     SERVIDOR, então carrega a posição do servidor na rede: ela alcança hosts que o usuário não
//     alcança diretamente, como um serviço interno sem login. Quatro erros se somam aqui: nenhuma
//     checagem de para onde a URL aponta, redirecionamentos seguidos automaticamente (o padrão
//     do `fetch`), nenhum limite para o tamanho da resposta e nenhum tempo limite.
// ES: La falla es una línea: `fetch(url)` con una URL elegida por el usuario. La solicitud sale del
//     SERVIDOR, así que lleva la posición del servidor en la red: alcanza hosts que el usuario no
//     alcanza directamente, como un servicio interno sin inicio de sesión. Cuatro errores se suman aquí: ninguna
//     comprobación de adónde apunta la URL, redirecciones seguidas automáticamente (el valor por defecto
//     de `fetch`), ningún límite para el tamaño de la respuesta y ningún tiempo límite.
//
// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createVulnerableApp() {
	return new Elysia().post("/preview", async ({ body, status }) => {
		try {
			const response = await fetch(urlField(body));
			return { preview: buildPreview(response.url, response.status, await response.text()) };
		} catch {
			return status(502, { error: "could not fetch the URL" });
		}
	});
}
