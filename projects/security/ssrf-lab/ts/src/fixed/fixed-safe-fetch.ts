// EN: The fixed way to fetch a URL chosen by a user. Every hop of the request goes through the
//     same gate, in this order:
//       1. scheme: only http and https;
//       2. host name: must be on an allow-list;
//       3. address: the name is resolved and EVERY resolved address must be public;
//       4. connection: made to the address that was just validated, not to the name again;
//       5. redirects: never followed automatically, each `Location` goes back to step 1;
//       6. limits: one deadline for the whole operation and a maximum body size.
// PT: O jeito corrigido de buscar uma URL escolhida por um usuário. Cada salto da requisição
//     passa pelo mesmo portão, nesta ordem:
//       1. esquema: só http e https;
//       2. nome do host: precisa estar em uma lista de permissão;
//       3. endereço: o nome é resolvido e TODOS os endereços resolvidos precisam ser públicos;
//       4. conexão: feita para o endereço que acabou de ser validado, não para o nome de novo;
//       5. redirecionamentos: nunca seguidos automaticamente, cada `Location` volta ao passo 1;
//       6. limites: um prazo único para a operação inteira e um tamanho máximo de corpo.
// ES: La manera corregida de buscar una URL elegida por un usuario. Cada salto de la solicitud
//     pasa por la misma compuerta, en este orden:
//       1. esquema: solo http y https;
//       2. nombre del host: debe estar en una lista de permitidos;
//       3. dirección: el nombre se resuelve y TODAS las direcciones resueltas deben ser públicas;
//       4. conexión: hecha a la dirección que acaba de validarse, no al nombre de nuevo;
//       5. redirecciones: nunca se siguen automáticamente, cada `Location` vuelve al paso 1;
//       6. límites: un plazo único para toda la operación y un tamaño máximo de cuerpo.

import { lookup } from "node:dns/promises";
import { isIP, isIPv6 } from "node:net";
import { classifyAddress, isAddressAllowed } from "./fixed-address-classifier";

export interface FetchPolicy {
	/** Host names the feature may fetch, in lower case. Everything else is refused. */
	allowedHosts: readonly string[];
	/** Ports the feature may connect to. */
	allowedPorts: readonly number[];
	/** How many redirects may be followed. Every one of them is validated like the first URL. */
	maxRedirects: number;
	/** Largest body accepted, in bytes. */
	maxBytes: number;
	/** Deadline for the whole operation (all hops and the body), in milliseconds. */
	timeoutMs: number;
}

/** Turns a host name into its IP addresses. Injected so tests can replace the DNS. */
export type Resolver = (hostname: string) => Promise<string[]>;

export type RefusalReason =
	| "invalid-url"
	| "scheme-not-allowed"
	| "credentials-in-url"
	| "host-not-allowed"
	| "port-not-allowed"
	| "dns-failed"
	| "address-not-allowed"
	| "too-many-redirects"
	| "response-too-large"
	| "timeout"
	| "upstream-error";

export type SafeFetchResult =
	| { ok: true; status: number; finalUrl: string; body: string }
	| { ok: false; reason: RefusalReason; detail: string };

const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);
const DEFAULT_PORTS: Readonly<Record<string, number>> = { "http:": 80, "https:": 443 };

function refuse(reason: RefusalReason, detail: string): SafeFetchResult {
	return { ok: false, reason, detail };
}

// EN: `all: true` asks for every address of the name, not only the first one. A name may have
//     several records, and the operating system is free to pick any of them.
// PT: `all: true` pede todos os endereços do nome, não só o primeiro. Um nome pode ter vários
//     registros, e o sistema operacional é livre para escolher qualquer um deles.
// ES: `all: true` pide todas las direcciones del nombre, no solo la primera. Un nombre puede tener varios
//     registros, y el sistema operativo es libre de elegir cualquiera de ellos.
export const systemResolver: Resolver = async (hostname) => {
	const records = await lookup(hostname, { all: true });
	return records.map((record) => record.address);
};

// EN: Steps 1 and 2: checks that need only the text of the URL. They are cheap and reject most
//     nonsense early, but they are NOT enough alone: an allowed name says nothing about the
//     address it resolves to.
// PT: Passos 1 e 2: checagens que só precisam do texto da URL. São baratas e recusam cedo a maior
//     parte do que não faz sentido, mas NÃO bastam sozinhas: um nome permitido não diz nada sobre
//     o endereço para o qual ele resolve.
// ES: Pasos 1 y 2: comprobaciones que solo necesitan el texto de la URL. Son baratas y rechazan pronto la mayor
//     parte de lo que no tiene sentido, pero NO bastan por sí solas: un nombre permitido no dice nada sobre
//     la dirección a la que resuelve.
function checkUrlText(url: URL, policy: FetchPolicy): SafeFetchResult | null {
	const defaultPort = DEFAULT_PORTS[url.protocol];
	if (defaultPort === undefined) {
		// EN: `fetch` in server runtimes understands more than the web: `file:` reads the disk of
		//     the server, for example. Only the two web schemes are accepted.
		// PT: O `fetch` de runtimes de servidor entende mais do que a web: `file:` lê o disco do
		//     servidor, por exemplo. Só os dois esquemas da web são aceitos.
		// ES: El `fetch` de los runtimes de servidor entiende más que la web: `file:` lee el disco del
		//     servidor, por ejemplo. Solo se aceptan los dos esquemas de la web.
		return refuse("scheme-not-allowed", `scheme ${url.protocol} is not http or https`);
	}
	if (url.username !== "" || url.password !== "") {
		// EN: In `http://allowed@other/`, the host is `other`. The parser already knows that, but
		//     a link preview never needs credentials in a URL, so the form is refused outright.
		// PT: Em `http://allowed@other/`, o host é `other`. O parser já sabe disso, mas uma prévia
		//     de link nunca precisa de credenciais na URL, então a forma é recusada de vez.
		// ES: En `http://allowed@other/`, el host es `other`. El parser ya lo sabe, pero una vista previa
		//     de enlace nunca necesita credenciales en la URL, así que esa forma se rechaza de plano.
		return refuse("credentials-in-url", "URLs with a user name or password are not accepted");
	}
	// EN: The comparison is exact, on the host name the parser extracted. Never use `includes`
	//     or `endsWith` on the raw text: "allowed.example.evil.test" contains "allowed.example".
	// PT: A comparação é exata, sobre o nome de host que o parser extraiu. Nunca use `includes` ou
	//     `endsWith` no texto cru: "allowed.example.evil.test" contém "allowed.example".
	// ES: La comparación es exacta, sobre el nombre de host que extrajo el parser. Nunca uses `includes` ni
	//     `endsWith` sobre el texto crudo: "allowed.example.evil.test" contiene "allowed.example".
	if (!policy.allowedHosts.includes(url.hostname.toLowerCase())) {
		return refuse("host-not-allowed", `host ${url.hostname} is not on the allow-list`);
	}
	const port = url.port === "" ? defaultPort : Number(url.port);
	if (!policy.allowedPorts.includes(port)) {
		return refuse("port-not-allowed", `port ${port} is not on the allow-list`);
	}
	return null;
}

// EN: Step 3. If ANY address of the name is not public, the request is refused: accepting a name
//     because "one of its addresses is fine" would leave the choice of address to chance. The
//     URL parser writes an IPv6 literal inside brackets, which are removed first.
// PT: Passo 3. Se QUALQUER endereço do nome não for público, a requisição é recusada: aceitar um
//     nome porque "um dos endereços serve" deixaria a escolha do endereço ao acaso. O parser de
//     URL escreve um literal IPv6 entre colchetes, que são removidos antes.
// ES: Paso 3. Si CUALQUIER dirección del nombre no es pública, la solicitud se rechaza: aceptar un
//     nombre porque "una de las direcciones sirve" dejaría la elección de la dirección al azar. El parser de
//     URL escribe un literal IPv6 entre corchetes, que se quitan antes.
async function resolveToPublicAddress(url: URL, resolve: Resolver): Promise<string | SafeFetchResult> {
	const host = url.hostname.replace(/^\[|\]$/g, "");
	let addresses: string[];
	if (isIP(host) !== 0) {
		addresses = [host];
	} else {
		try {
			addresses = await resolve(host);
		} catch {
			return refuse("dns-failed", `could not resolve ${host}`);
		}
	}
	const first = addresses[0];
	if (first === undefined) {
		return refuse("dns-failed", `${host} has no address`);
	}
	const forbidden = addresses.find((address) => !isAddressAllowed(address));
	if (forbidden !== undefined) {
		return refuse("address-not-allowed", `${host} resolves to a ${classifyAddress(forbidden)} address`);
	}
	return first;
}

// EN: Step 4. Between "resolve and check" and "connect" there is a gap: if `fetch` received the
//     name, it would ask the DNS a second time, and the second answer could be different from
//     the one that was checked (time of check versus time of use). So the connection is made to
//     the checked ADDRESS, and the original name travels only in the `Host` header, which is
//     what the remote server uses to pick the site.
//     For https the certificate must still be checked against the name, so the name is passed
//     as the TLS server name. The lab has no HTTPS service, so that branch is not covered by the
//     tests of this lab.
// PT: Passo 4. Entre "resolver e conferir" e "conectar" existe um intervalo: se o `fetch`
//     recebesse o nome, ele perguntaria ao DNS uma segunda vez, e a segunda resposta poderia ser
//     diferente da que foi conferida (tempo de checagem contra tempo de uso). Então a conexão é
//     feita para o ENDEREÇO conferido, e o nome original viaja só no cabeçalho `Host`, que é o
//     que o servidor remoto usa para escolher o site.
//     Em https o certificado ainda precisa ser conferido contra o nome, então o nome é passado
//     como nome de servidor do TLS. O laboratório não tem serviço HTTPS, então esse ramo não é
//     coberto pelos testes deste laboratório.
// ES: Paso 4. Entre "resolver y comprobar" y "conectar" hay un intervalo: si `fetch`
//     recibiera el nombre, preguntaría al DNS una segunda vez, y la segunda respuesta podría ser
//     distinta de la que se comprobó (tiempo de comprobación contra tiempo de uso). Así que la conexión se
//     hace a la DIRECCIÓN comprobada, y el nombre original viaja solo en la cabecera `Host`, que es lo
//     que el servidor remoto usa para elegir el sitio.
//     En https el certificado aún debe comprobarse contra el nombre, así que el nombre se pasa
//     como nombre de servidor de TLS. El laboratorio no tiene servicio HTTPS, así que esa rama no está
//     cubierta por las pruebas de este laboratorio.
async function fetchPinned(url: URL, address: string, signal: AbortSignal): Promise<Response> {
	const pinned = new URL(url);
	pinned.hostname = isIPv6(address) ? `[${address}]` : address;
	return fetch(pinned, {
		// EN: "manual" hands the 3xx answer back instead of following it, so step 5 can validate
		//     the next URL before any connection is made.
		// PT: "manual" devolve a resposta 3xx em vez de segui-la, então o passo 5 consegue validar
		//     a próxima URL antes de qualquer conexão.
		// ES: "manual" devuelve la respuesta 3xx en lugar de seguirla, así el paso 5 puede validar
		//     la siguiente URL antes de cualquier conexión.
		redirect: "manual",
		signal,
		headers: { host: url.host },
		...(url.protocol === "https:" ? { tls: { serverName: url.hostname } } : {}),
	});
}

// EN: Step 6, the size limit. The body is read piece by piece and the reading stops as soon as
//     the limit is crossed. `Content-Length` is only a hint from the other side, so it can
//     refuse early but can never be the only check.
// PT: Passo 6, o limite de tamanho. O corpo é lido pedaço por pedaço e a leitura para assim que o
//     limite é ultrapassado. `Content-Length` é só uma dica do outro lado, então serve para
//     recusar cedo, mas nunca pode ser a única checagem.
// ES: Paso 6, el límite de tamaño. El cuerpo se lee trozo por trozo y la lectura se detiene en cuanto
//     se supera el límite. `Content-Length` es solo una pista del otro lado, así que sirve para
//     rechazar pronto, pero nunca puede ser la única comprobación.
async function readLimitedBody(response: Response, maxBytes: number): Promise<string | null> {
	if (Number(response.headers.get("content-length") ?? "0") > maxBytes) {
		await response.body?.cancel();
		return null;
	}
	if (response.body === null) {
		return "";
	}
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			return null;
		}
		chunks.push(value);
	}
	return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function safeFetch(
	rawUrl: string,
	policy: FetchPolicy,
	resolve: Resolver = systemResolver,
): Promise<SafeFetchResult> {
	if (!URL.canParse(rawUrl)) {
		return refuse("invalid-url", "not an absolute URL");
	}
	// EN: One deadline for everything. A timeout per hop would let a chain of slow redirects
	//     keep the server busy for several times the limit.
	// PT: Um prazo único para tudo. Um tempo limite por salto deixaria uma cadeia de
	//     redirecionamentos lentos ocupar o servidor por várias vezes o limite.
	// ES: Un plazo único para todo. Un tiempo límite por salto dejaría que una cadena de
	//     redirecciones lentas ocupara el servidor durante varias veces el límite.
	const signal = AbortSignal.timeout(policy.timeoutMs);
	let url = new URL(rawUrl);

	try {
		for (let redirects = 0; ; redirects++) {
			const refusal = checkUrlText(url, policy);
			if (refusal !== null) {
				return refusal;
			}
			const address = await resolveToPublicAddress(url, resolve);
			if (typeof address !== "string") {
				return address;
			}
			const response = await fetchPinned(url, address, signal);
			const location = response.headers.get("location");
			if (!REDIRECT_STATUSES.has(response.status) || location === null) {
				const body = await readLimitedBody(response, policy.maxBytes);
				if (body === null) {
					return refuse("response-too-large", `body is larger than ${policy.maxBytes} bytes`);
				}
				return { ok: true, status: response.status, finalUrl: url.href, body };
			}
			// EN: Step 5. A redirect is the remote server choosing the next URL. That URL is as
			//     untrusted as the first one, so the loop starts again from the scheme check.
			//     A relative `Location` is resolved against the current URL.
			// PT: Passo 5. Um redirecionamento é o servidor remoto escolhendo a próxima URL. Essa
			//     URL é tão não confiável quanto a primeira, então o laço recomeça da checagem de
			//     esquema. Um `Location` relativo é resolvido contra a URL atual.
			// ES: Paso 5. Una redirección es el servidor remoto eligiendo la siguiente URL. Esa
			//     URL es tan poco confiable como la primera, así que el ciclo vuelve a empezar desde la comprobación del
			//     esquema. Un `Location` relativo se resuelve contra la URL actual.
			await response.body?.cancel();
			if (redirects >= policy.maxRedirects) {
				return refuse("too-many-redirects", `more than ${policy.maxRedirects} redirects`);
			}
			if (!URL.canParse(location, url.href)) {
				return refuse("invalid-url", "the redirect target is not a valid URL");
			}
			url = new URL(location, url);
		}
	} catch {
		return signal.aborted
			? refuse("timeout", `no complete answer within ${policy.timeoutMs} ms`)
			: refuse("upstream-error", "the remote server could not be reached");
	}
}
