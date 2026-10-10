import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { SESSION_COOKIE } from "./config";

export type SameSite = "Strict" | "Lax";

export const emailSchema = z.email().max(254);

// EN: A session cookie is just a response header. The attributes after the value are
//     instructions to the browser:
//     - `HttpOnly`: page scripts cannot read it.
//     - `Path=/`: send it to every path of this host.
//     - `SameSite`: whether to send it on requests that START on another site. This is the
//       attribute this lab is about. When it is missing, each browser applies its own default.
//     A real site served over HTTPS also adds `Secure`. The lab is plain HTTP inside Docker,
//     and a browser refuses to store a `Secure` cookie from plain HTTP, so it is left out here.
// PT: Um cookie de sessão é só um cabeçalho de resposta. Os atributos depois do valor são
//     instruções para o navegador:
//     - `HttpOnly`: scripts da página não conseguem lê-lo.
//     - `Path=/`: envie para todos os caminhos deste host.
//     - `SameSite`: se deve ser enviado em requisições que COMEÇAM em outro site. É o atributo
//       de que este laboratório trata. Quando ele falta, cada navegador aplica o seu padrão.
//     Um site real em HTTPS também adiciona `Secure`. O laboratório usa HTTP puro dentro do
//     Docker, e o navegador se recusa a guardar um cookie `Secure` vindo de HTTP puro, por isso
//     ele fica de fora aqui.
// ES: Una cookie de sesión es solo una cabecera de respuesta. Los atributos después del valor son
//     instrucciones para el navegador:
//     - `HttpOnly`: los scripts de la página no pueden leerla.
//     - `Path=/`: envíala a todas las rutas de este host.
//     - `SameSite`: si debe enviarse en solicitudes que EMPIEZAN en otro sitio. Es el atributo
//       del que trata este laboratorio. Cuando falta, cada navegador aplica su valor por defecto.
//     Un sitio real en HTTPS también añade `Secure`. El laboratorio usa HTTP plano dentro de
//     Docker, y el navegador se niega a guardar una cookie `Secure` que venga de HTTP plano, por eso
//     queda fuera aquí.
export function buildSessionCookie(sessionId: string, sameSite: SameSite | null): string {
	const attributes = [`${SESSION_COOKIE}=${sessionId}`, "Path=/", "HttpOnly"];
	if (sameSite !== null) {
		attributes.push(`SameSite=${sameSite}`);
	}
	return attributes.join("; ");
}

// EN: The browser sends back every cookie of the host in one `Cookie` header, as
//     `name=value; other=value`. The server never sees the attributes again, only the values.
// PT: O navegador devolve todos os cookies do host em um único cabeçalho `Cookie`, no formato
//     `nome=valor; outro=valor`. O servidor nunca mais vê os atributos, apenas os valores.
// ES: El navegador devuelve todas las cookies del host en una única cabecera `Cookie`, con el formato
//     `nombre=valor; otro=valor`. El servidor nunca vuelve a ver los atributos, solo los valores.
export function readCookie(request: Request, name: string): string | null {
	const header = request.headers.get("cookie");
	if (header === null) {
		return null;
	}
	for (const part of header.split(";")) {
		const separator = part.indexOf("=");
		if (separator === -1) {
			continue;
		}
		if (part.slice(0, separator).trim() === name) {
			return part.slice(separator + 1).trim();
		}
	}
	return null;
}

// EN: A normal `===` on strings stops at the first different character, so the time it takes
//     leaks how many leading characters were right. `timingSafeEqual` always looks at every
//     byte. It needs inputs of the same length, so both sides are hashed first: a SHA-256
//     digest always has 32 bytes, whatever the input was.
// PT: Um `===` comum entre strings para no primeiro caractere diferente, então o tempo gasto
//     revela quantos caracteres iniciais estavam certos. `timingSafeEqual` sempre olha todos os
//     bytes. Ele exige entradas do mesmo tamanho, por isso os dois lados passam antes por um
//     hash: um resumo SHA-256 sempre tem 32 bytes, qualquer que seja a entrada.
// ES: Un `===` común entre cadenas se detiene en el primer carácter distinto, así que el tiempo gastado
//     revela cuántos caracteres iniciales eran correctos. `timingSafeEqual` siempre mira todos los
//     bytes. Exige entradas del mismo tamaño, por eso los dos lados pasan antes por un
//     hash: un resumen SHA-256 siempre tiene 32 bytes, sea cual sea la entrada.
export function constantTimeEqual(left: string, right: string): boolean {
	const leftDigest = createHash("sha256").update(left).digest();
	const rightDigest = createHash("sha256").update(right).digest();
	return timingSafeEqual(leftDigest, rightDigest);
}

// EN: Any text that came from a request must be escaped before it is placed inside HTML,
//     otherwise it could be read by the browser as markup (that flaw is XSS, another lab).
// PT: Todo texto que veio de uma requisição precisa ser escapado antes de entrar no HTML, senão
//     o navegador poderia lê-lo como marcação (essa falha é o XSS, assunto de outro laboratório).
// ES: Todo texto que vino de una solicitud debe escaparse antes de entrar en el HTML, de lo contrario
//     el navegador podría leerlo como marcado (esa falla es el XSS, tema de otro laboratorio).
export function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function htmlResponse(html: string, status = 200): Response {
	return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export function textResponse(text: string, status: number, headers: Record<string, string> = {}): Response {
	return new Response(`${text}\n`, { status, headers: { "content-type": "text/plain; charset=utf-8", ...headers } });
}

// EN: 303 "See Other" tells the browser to fetch the next page with GET. Answering a form POST
//     with a redirect also means that reloading the page does not submit the form again.
// PT: 303 "See Other" manda o navegador buscar a próxima página com GET. Responder a um POST de
//     formulário com um redirecionamento também evita que recarregar a página reenvie o formulário.
// ES: 303 "See Other" manda al navegador buscar la siguiente página con GET. Responder a un POST de
//     formulario con una redirección también evita que recargar la página reenvíe el formulario.
export function redirect(location: string, headers: Record<string, string> = {}): Response {
	return new Response(null, { status: 303, headers: { location, ...headers } });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
