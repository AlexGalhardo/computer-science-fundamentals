// EN: A tiny shared piece of HTTP plumbing: an error that carries a status code, and the function
//     that turns it into a JSON response. It contains no security decision.
// PT: Um pequeno encanamento HTTP compartilhado: um erro que carrega um código de status, e a
//     função que o transforma em uma resposta JSON. Não contém nenhuma decisão de segurança.
// ES: Una pequeña tubería HTTP compartida: un error que lleva un código de estado, y la
//     función que lo transforma en una respuesta JSON. No contiene ninguna decisión de seguridad.

// EN: The refusals of this lab. 400: the request is malformed. 401: we do not know who you are.
//     404: there is no such file (for you). 413: the body is larger than the limit.
//     415: the type of the file is not accepted.
// PT: As recusas deste laboratório. 400: a requisição está malformada. 401: não sabemos quem você
//     é. 404: esse arquivo não existe (para você). 413: o corpo é maior que o limite.
//     415: o tipo do arquivo não é aceito.
// ES: Los rechazos de este laboratorio. 400: la solicitud está mal formada. 401: no sabemos quién
//     eres. 404: ese archivo no existe (para ti). 413: el cuerpo es mayor que el límite.
//     415: el tipo del archivo no se acepta.
export type RefusalStatus = 400 | 401 | 404 | 413 | 415;

export class HttpError extends Error {
	readonly status: RefusalStatus;

	constructor(status: RefusalStatus, code: string) {
		super(code);
		this.name = "HttpError";
		this.status = status;
	}
}

// EN: The body of a refusal is only a short code. It never echoes a path of the server, because
//     an error message is also a way to leak how the disk is organised.
// PT: O corpo de uma recusa é só um código curto. Ele nunca devolve um caminho do servidor, porque
//     uma mensagem de erro também é um jeito de vazar como o disco está organizado.
// ES: El cuerpo de un rechazo es solo un código corto. Nunca devuelve una ruta del servidor, porque
//     un mensaje de error también es una manera de filtrar cómo está organizado el disco.
export function toErrorResponse(error: unknown): Response | undefined {
	if (!(error instanceof HttpError)) return undefined;
	return Response.json({ error: error.message }, { status: error.status });
}
