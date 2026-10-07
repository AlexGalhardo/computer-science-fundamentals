// EN: A tiny shared piece of HTTP plumbing: an error that carries a status code, and the function
//     that turns it into a JSON response. It contains no token logic.
// PT: Um pequeno encanamento HTTP compartilhado: um erro que carrega um código de status, e a
//     função que o transforma em uma resposta JSON. Não contém nenhuma lógica de token.

// EN: The three refusals of this lab. 400: the request is malformed. 401: we do not know who you
//     are (no token, or a token we do not accept). 403: we know who you are and the answer is no.
// PT: As três recusas deste laboratório. 400: a requisição está malformada. 401: não sabemos quem
//     você é (sem token, ou um token que não aceitamos). 403: sabemos quem você é e a resposta é não.
export type RefusalStatus = 400 | 401 | 403;

export class HttpError extends Error {
	readonly status: RefusalStatus;

	constructor(status: RefusalStatus, code: string) {
		super(code);
		this.name = "HttpError";
		this.status = status;
	}
}

// EN: The body of a refusal is only a short code. A rejected token always gets the same
//     `invalid_token`, whatever the reason: telling a stranger "the signature was right and the
//     audience was wrong" would be a free hint. The precise reason goes to the server log.
// PT: O corpo de uma recusa é só um código curto. Um token rejeitado sempre recebe o mesmo
//     `invalid_token`, seja qual for o motivo: dizer a um estranho "a assinatura estava certa e
//     a audiência errada" seria uma dica de graça. O motivo exato vai para o log do servidor.
export function toErrorResponse(error: unknown): Response | undefined {
	if (!(error instanceof HttpError)) return undefined;
	return Response.json({ error: error.message }, { status: error.status });
}

// EN: Reads the token from `Authorization: Bearer <token>`. Returns null when the header is
//     missing or has another shape.
// PT: Lê o token de `Authorization: Bearer <token>`. Devolve null quando o cabeçalho não existe
//     ou tem outro formato.
export function bearerToken(request: Request): string | null {
	const header = request.headers.get("authorization");
	if (header === null || !header.startsWith("Bearer ")) return null;
	return header.slice("Bearer ".length);
}
