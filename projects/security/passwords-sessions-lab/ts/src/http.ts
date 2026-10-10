// EN: Shared HTTP plumbing with no security decision inside: reading the `Cookie` header of a
//     request, and reading the `Set-Cookie` header of a response the way a browser would. Which
//     attributes a cookie gets is decided by each version of the API, not here.
// PT: Encanamento HTTP compartilhado, sem nenhuma decisão de segurança dentro: ler o cabeçalho
//     `Cookie` de uma requisição, e ler o cabeçalho `Set-Cookie` de uma resposta do jeito que um
//     navegador leria. Quais atributos um cookie recebe é decisão de cada versão da API, não daqui.
// ES: Tubería HTTP compartida, sin ninguna decisión de seguridad dentro: leer la cabecera
//     `Cookie` de una solicitud, y leer la cabecera `Set-Cookie` de una respuesta como lo
//     leería un navegador. Qué atributos recibe una cookie es decisión de cada versión de la API, no de aquí.

// EN: A browser sends back only `name=value` pairs, separated by "; ". The attributes (HttpOnly,
//     Secure, SameSite...) travel only from the server to the browser, never the other way.
// PT: O navegador devolve só pares `nome=valor`, separados por "; ". Os atributos (HttpOnly,
//     Secure, SameSite...) viajam só do servidor para o navegador, nunca no sentido contrário.
// ES: El navegador devuelve solo pares `nombre=valor`, separados por "; ". Los atributos (HttpOnly,
//     Secure, SameSite...) viajan solo del servidor al navegador, nunca en sentido contrario.
export function readCookie(request: Request, name: string): string | undefined {
	const header = request.headers.get("cookie");
	if (header === null) return undefined;
	for (const pair of header.split(";")) {
		const separator = pair.indexOf("=");
		if (separator === -1) continue;
		if (pair.slice(0, separator).trim() === name) return pair.slice(separator + 1).trim();
	}
	return undefined;
}

export interface ParsedSetCookie {
	name: string;
	value: string;
	// EN: Attribute names in lower case. A flag without a value (HttpOnly, Secure) maps to "".
	// PT: Nomes dos atributos em minúsculas. Uma flag sem valor (HttpOnly, Secure) vira "".
	// ES: Nombres de los atributos en minúsculas. Una flag sin valor (HttpOnly, Secure) pasa a ser "".
	attributes: Map<string, string>;
}

// EN: Splits one `Set-Cookie` header into its name, value and attributes, so tests and the demo
//     can check the flags instead of searching text.
// PT: Separa um cabeçalho `Set-Cookie` em nome, valor e atributos, para os testes e a demo
//     conferirem as flags em vez de procurar texto.
// ES: Separa una cabecera `Set-Cookie` en nombre, valor y atributos, para que las pruebas y la demo
//     comprueben las flags en lugar de buscar texto.
export function parseSetCookie(header: string): ParsedSetCookie | undefined {
	const [first, ...rest] = header.split(";");
	if (first === undefined) return undefined;
	const separator = first.indexOf("=");
	if (separator === -1) return undefined;
	const attributes = new Map<string, string>();
	for (const part of rest) {
		const [key, ...value] = part.split("=");
		if (key === undefined || key.trim() === "") continue;
		attributes.set(key.trim().toLowerCase(), value.join("=").trim());
	}
	return { name: first.slice(0, separator).trim(), value: first.slice(separator + 1).trim(), attributes };
}

export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
	return Response.json(body, { status, headers });
}
