// EN: A tiny shared piece of HTTP plumbing: an error that carries a status code, and the function
//     that turns it into a JSON response. It contains no authorisation decision.
// PT: Um pequeno encanamento HTTP compartilhado: um erro que carrega um código de status, e a
//     função que o transforma em uma resposta JSON. Não contém nenhuma decisão de autorização.

// EN: The four refusals of this lab. 400: the request is malformed. 401: we do not know who you
//     are. 403: we know who you are and the answer is no. 404: there is nothing here (for you).
// PT: As quatro recusas deste laboratório. 400: a requisição está malformada. 401: não sabemos
//     quem você é. 403: sabemos quem você é e a resposta é não. 404: não há nada aqui (para você).
export type RefusalStatus = 400 | 401 | 403 | 404;

export class HttpError extends Error {
	readonly status: RefusalStatus;

	constructor(status: RefusalStatus, code: string) {
		super(code);
		this.name = "HttpError";
		this.status = status;
	}
}

// EN: The body of a refusal is only a short code. It never echoes the record, the owner or the
//     reason in detail, because an error message is also a way to leak data.
// PT: O corpo de uma recusa é só um código curto. Ele nunca devolve o registro, o dono ou o motivo
//     em detalhe, porque uma mensagem de erro também é um jeito de vazar dados.
export function toErrorResponse(error: unknown): Response | undefined {
	if (!(error instanceof HttpError)) return undefined;
	return Response.json({ error: error.message }, { status: error.status });
}
