// EN: THIRD LAYER: interface adapters. An adapter translates between two formats: the one that
//     suits the outside (an HTTP request, a line typed in a terminal, a database row) and the
//     one that suits the use cases. A controller has three steps and no business rule:
//     turn the request into the input of a use case, call it, turn the result into a response.
// PT: TERCEIRA CAMADA: adaptadores de interface. Um adaptador traduz entre dois formatos: o que
//     convém ao lado de fora (uma requisição HTTP, uma linha digitada no terminal, uma linha do
//     banco) e o que convém aos casos de uso. Um controller tem três passos e nenhuma regra de
//     negócio: transformar a requisição na entrada de um caso de uso, chamá-lo, transformar o
//     resultado em uma resposta.

import { z } from "zod";
import type { NoteUseCases } from "../use-cases";
import type { ApplicationError } from "../use-cases/note-data";

// EN: These two types are the whole "web" this controller knows. They are declared here, not
//     imported from Elysia, so the controller is tested with plain objects and survives a
//     change of web framework. The driver in `drivers/elysia-server.ts` converts to and from them.
// PT: Estes dois tipos são toda a "web" que este controller conhece. São declarados aqui, não
//     importados do Elysia, então o controller é testado com objetos simples e sobrevive a uma
//     troca de framework web. O driver em `drivers/elysia-server.ts` converte de e para eles.
export interface HttpRequest {
	params: Record<string, string | undefined>;
	body: unknown;
}

export interface HttpResponse {
	status: number;
	body?: unknown;
}

// EN: Two validations, two places. Here, at the boundary, Zod checks the SHAPE of what arrived:
//     is there a title, is it text. Whether an 81-character title is acceptable is a business
//     rule, and the entity answers that. The size limits below only stop absurd payloads early.
// PT: Duas validações, dois lugares. Aqui, na fronteira, o Zod confere o FORMATO do que chegou:
//     existe um título, ele é texto. Se um título de 81 caracteres é aceitável é uma regra de
//     negócio, e quem responde é a entidade. Os limites de tamanho abaixo só barram cedo os
//     payloads absurdos.
const idSchema = z.string().min(1).max(100);
const createSchema = z.object({
	title: z.string().max(10_000),
	body: z.string().max(100_000).default(""),
});
const updateSchema = z
	.object({
		title: z.string().max(10_000).optional(),
		body: z.string().max(100_000).optional(),
	})
	.refine((value) => value.title !== undefined || value.body !== undefined, "send a title, a body or both");

// EN: The vocabulary of HTTP lives in the adapter. The use case answered "duplicate-title";
//     that this is a 409 is a decision of this delivery mechanism only.
// PT: O vocabulário do HTTP mora no adaptador. O caso de uso respondeu "duplicate-title";
//     que isso é um 409 é uma decisão apenas deste mecanismo de entrega.
const STATUS_OF_ERROR: Record<ApplicationError["kind"], number> = {
	"invalid-title": 400,
	"invalid-body": 400,
	"invalid-dates": 400,
	"duplicate-title": 409,
	"note-not-found": 404,
};

function failure(error: ApplicationError): HttpResponse {
	return { status: STATUS_OF_ERROR[error.kind], body: { error: error.kind, message: error.message } };
}

function malformed(error: z.ZodError): HttpResponse {
	return { status: 400, body: { error: "malformed-request", message: z.prettifyError(error) } };
}

export class NoteHttpController {
	constructor(private readonly useCases: NoteUseCases) {}

	async create(request: HttpRequest): Promise<HttpResponse> {
		const input = createSchema.safeParse(request.body);
		if (!input.success) {
			return malformed(input.error);
		}
		const result = await this.useCases.createNote.execute(input.data);
		return result.ok ? { status: 201, body: result.value } : failure(result.error);
	}

	async list(): Promise<HttpResponse> {
		return { status: 200, body: await this.useCases.listNotes.execute() };
	}

	async update(request: HttpRequest): Promise<HttpResponse> {
		const id = idSchema.safeParse(request.params.id);
		if (!id.success) {
			return malformed(id.error);
		}
		const input = updateSchema.safeParse(request.body);
		if (!input.success) {
			return malformed(input.error);
		}
		const result = await this.useCases.updateNote.execute({ id: id.data, ...input.data });
		return result.ok ? { status: 200, body: result.value } : failure(result.error);
	}

	async remove(request: HttpRequest): Promise<HttpResponse> {
		const id = idSchema.safeParse(request.params.id);
		if (!id.success) {
			return malformed(id.error);
		}
		const result = await this.useCases.removeNote.execute({ id: id.data });
		return result.ok ? { status: 204 } : failure(result.error);
	}
}
