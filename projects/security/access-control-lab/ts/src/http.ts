// EN: A tiny shared piece of HTTP plumbing: an error that carries a status code, and the function
//     that turns it into a JSON response. It contains no authorisation decision.
// PT: Um pequeno encanamento HTTP compartilhado: um erro que carrega um código de status, e a
//     função que o transforma em uma resposta JSON. Não contém nenhuma decisão de autorização.
// ES: Una pequeña tubería HTTP compartida: un error que lleva un código de estado, y la
//     función que lo transforma en una respuesta JSON. No contiene ninguna decisión de autorización.

// EN: The four refusals of this lab. 400: the request is malformed. 401: we do not know who you
//     are. 403: we know who you are and the answer is no. 404: there is nothing here (for you).
// PT: As quatro recusas deste laboratório. 400: a requisição está malformada. 401: não sabemos
//     quem você é. 403: sabemos quem você é e a resposta é não. 404: não há nada aqui (para você).
// ES: Los cuatro rechazos de este laboratorio. 400: la solicitud está mal formada. 401: no sabemos
//     quién eres. 403: sabemos quién eres y la respuesta es no. 404: no hay nada aquí (para ti).
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
// ES: El cuerpo de un rechazo es solo un código corto. Nunca devuelve el registro, el dueño ni el motivo
//     en detalle, porque un mensaje de error también es una manera de filtrar datos.
export function toErrorResponse(error: unknown): Response | undefined {
	if (!(error instanceof HttpError)) return undefined;
	return Response.json({ error: error.message }, { status: error.status });
}
