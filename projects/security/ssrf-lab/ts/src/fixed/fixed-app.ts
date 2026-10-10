// EN: The fixed ElysiaJS app. Same route as the vulnerable one. The input is validated with Zod
//     and the fetch goes through `safeFetch`, which checks the scheme, the host name, the
//     resolved address and every redirect, and limits size and time (`fixed-safe-fetch.ts`).
// PT: O app ElysiaJS corrigido. Mesma rota do vulnerável. A entrada é validada com Zod e a busca
//     passa pelo `safeFetch`, que confere o esquema, o nome do host, o endereço resolvido e cada
//     redirecionamento, e limita tamanho e tempo (`fixed-safe-fetch.ts`).
// ES: La app ElysiaJS corregida. La misma ruta que la vulnerable. La entrada se valida con Zod y la búsqueda
//     pasa por `safeFetch`, que comprueba el esquema, el nombre del host, la dirección resuelta y cada
//     redirección, y limita tamaño y tiempo (`fixed-safe-fetch.ts`).

import { Elysia } from "elysia";
import { z } from "zod";
import type { Config } from "../config";
import { buildPreview } from "../preview";
import { type FetchPolicy, type RefusalReason, type Resolver, safeFetch, systemResolver } from "./fixed-safe-fetch";

// EN: Zod answers "is this a URL of a sane size?". It does not answer "is it safe to fetch?":
//     that needs the DNS and is the job of `safeFetch`. The URL travels in a JSON body, so it
//     stays one string however many commas or ampersands it contains.
// PT: O Zod responde "isto é uma URL de tamanho razoável?". Ele não responde "é seguro buscar?":
//     isso depende do DNS e é trabalho do `safeFetch`. A URL viaja em um corpo JSON, então
//     continua sendo uma string só, tenha quantas vírgulas ou "&" tiver.
// ES: Zod responde "¿esto es una URL de tamaño razonable?". No responde "¿es seguro buscarla?":
//     eso depende del DNS y es trabajo de `safeFetch`. La URL viaja en un cuerpo JSON, así que
//     sigue siendo una sola cadena, tenga cuantas comas o "&" tenga.
const previewBody = z.object({
	url: z.url().max(2048),
});

// EN: The policy of the feature. A link preview of this fake product only ever needs the fake
//     public site, so that is the whole allow-list. The limits are small on purpose: a preview
//     needs the first bytes of a page, and a user is waiting for it.
// PT: A política da funcionalidade. Uma prévia de link deste produto falso só precisa do site
//     público falso, então essa é a lista de permissão inteira. Os limites são pequenos de
//     propósito: uma prévia precisa dos primeiros bytes de uma página, e há um usuário esperando.
// ES: La política de la funcionalidad. Una vista previa de enlace de este producto falso solo necesita el sitio
//     público falso, así que esa es toda la lista de permitidos. Los límites son pequeños a
//     propósito: una vista previa necesita los primeros bytes de una página, y hay un usuario esperando.
export function buildPolicy(config: Config): FetchPolicy {
	return {
		allowedHosts: [new URL(config.PUBLIC_SITE_ORIGIN).hostname.toLowerCase()],
		allowedPorts: [80, 443, 8080],
		maxRedirects: 3,
		maxBytes: 64 * 1024,
		timeoutMs: 2000,
	};
}

// EN: A refusal by policy is 403, a remote server that failed is 502 and one that took too long
//     is 504. The answer names the rule that refused, never what the internal network answered.
// PT: Uma recusa por política é 403, um servidor remoto que falhou é 502 e um que demorou demais
//     é 504. A resposta diz qual regra recusou, nunca o que a rede interna respondeu.
// ES: Un rechazo por política es 403, un servidor remoto que falló es 502 y uno que tardó demasiado
//     es 504. La respuesta dice qué regla rechazó, nunca lo que respondió la red interna.
function httpStatusFor(reason: RefusalReason): 403 | 422 | 502 | 504 {
	switch (reason) {
		case "invalid-url":
		case "scheme-not-allowed":
		case "credentials-in-url":
			return 422;
		case "host-not-allowed":
		case "port-not-allowed":
		case "address-not-allowed":
		case "too-many-redirects":
			return 403;
		case "timeout":
			return 504;
		case "dns-failed":
		case "response-too-large":
		case "upstream-error":
			return 502;
	}
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createFixedApp(policy: FetchPolicy, resolve: Resolver = systemResolver) {
	return new Elysia().post(
		"/preview",
		async ({ body, status }) => {
			const result = await safeFetch(body.url, policy, resolve);
			if (!result.ok) {
				return status(httpStatusFor(result.reason), { error: "blocked", reason: result.reason });
			}
			return { preview: buildPreview(result.finalUrl, result.status, result.body) };
		},
		{ body: previewBody },
	);
}
