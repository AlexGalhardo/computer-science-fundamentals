// EN: OUTERMOST LAYER: frameworks and drivers. This is the only file of the project that
//     imports the web framework. Its whole job is glue: take what Elysia parsed, hand it to the
//     controller as a plain `HttpRequest`, and turn the plain `HttpResponse` into a real one.
//     Replacing Elysia means rewriting these few lines and nothing inside them.
// PT: CAMADA MAIS EXTERNA: frameworks e drivers. Este é o único arquivo do projeto que importa
//     o framework web. O trabalho dele é só cola: pegar o que o Elysia interpretou, entregar ao
//     controller como um `HttpRequest` simples, e transformar o `HttpResponse` simples em um de
//     verdade. Trocar o Elysia significa reescrever estas poucas linhas e nada do que está dentro delas.
// ES: CAPA MÁS EXTERNA: frameworks y drivers. Este es el único archivo del proyecto que importa
//     el framework web. Su trabajo es solo pegamento: tomar lo que Elysia interpretó, entregarlo
//     al controller como un `HttpRequest` simple, y convertir el `HttpResponse` simple en uno de
//     verdad. Reemplazar Elysia significa reescribir estas pocas líneas y nada de lo que hay dentro.

import { Elysia } from "elysia";
import type { HttpResponse, NoteHttpController } from "../adapters/note-http-controller";

function send(response: HttpResponse): Response {
	if (response.body === undefined) {
		return new Response(null, { status: response.status });
	}
	return Response.json(response.body, { status: response.status });
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno queda a cargo de la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createHttpServer(controller: NoteHttpController) {
	return (
		new Elysia()
			// EN: An unexpected failure (a bug, the database down) becomes a generic 500. The
			//     details go to the server log, never to the client.
			// PT: Uma falha inesperada (um bug, o banco fora do ar) vira um 500 genérico. Os
			//     detalhes vão para o log do servidor, nunca para o cliente.
			// ES: Una falla inesperada (un bug, la base de datos caída) se convierte en un 500
			//     genérico. Los detalles van al log del servidor, nunca al cliente.
			.onError(({ code, error }) => {
				if (code === "NOT_FOUND") {
					return send({ status: 404, body: { error: "route-not-found", message: "no such route" } });
				}
				if (code === "PARSE") {
					return send({
						status: 400,
						body: { error: "malformed-request", message: "the body is not valid JSON" },
					});
				}
				console.error(error);
				return send({ status: 500, body: { error: "internal-error", message: "unexpected error" } });
			})
			.get("/health", () => ({ ok: true }))
			.get("/notes", async () => send(await controller.list()))
			.post("/notes", async ({ body }) => send(await controller.create({ params: {}, body })))
			.put("/notes/:id", async ({ params, body }) => send(await controller.update({ params, body })))
			.delete("/notes/:id", async ({ params }) => send(await controller.remove({ params, body: undefined })))
	);
}
