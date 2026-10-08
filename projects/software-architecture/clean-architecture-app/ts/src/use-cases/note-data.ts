import type { DomainError } from "../entities/errors";
import type { Note } from "../entities/note";

// EN: A DTO (data transfer object): plain fields, no methods. This is what crosses the boundary
//     towards the outside, in place of the entity. Controllers and presenters can turn it into
//     JSON or text without ever holding an object that carries business rules.
// PT: Um DTO (objeto de transferência de dados): campos simples, sem métodos. É isto que cruza
//     a fronteira para fora, no lugar da entidade. Controllers e presenters conseguem
//     transformá-lo em JSON ou texto sem nunca segurar um objeto que carrega regras de negócio.
export interface NoteData {
	id: string;
	title: string;
	body: string;
	/** ISO 8601, UTC. */
	createdAt: string;
	updatedAt: string;
}

export function toNoteData(note: Note): NoteData {
	return {
		id: note.id,
		title: note.title.value,
		body: note.body,
		createdAt: note.createdAt.toISOString(),
		updatedAt: note.updatedAt.toISOString(),
	};
}

// EN: Errors of the application are the errors of the domain plus the ones that only make sense
//     for this application: a title already in use, a note that does not exist.
// PT: Os erros da aplicação são os erros do domínio mais os que só fazem sentido para esta
//     aplicação: um título já usado, uma nota que não existe.
export type ApplicationError =
	| DomainError
	| { readonly kind: "duplicate-title"; readonly message: string }
	| { readonly kind: "note-not-found"; readonly message: string };
