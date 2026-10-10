import { err, ok, type Result } from "../entities/result";
import { type ApplicationError, type NoteData, toNoteData } from "./note-data";
import type { Clock, NoteRepository } from "./ports";

export interface UpdateNoteInput {
	id: string;
	title?: string;
	body?: string;
}

export class UpdateNote {
	constructor(
		private readonly repository: NoteRepository,
		private readonly clock: Clock,
	) {}

	// EN: The use case orchestrates and the entity decides. Whether the new title is acceptable
	//     is asked to `note.edit`. Whether the title is free in this application is asked to the
	//     repository. The use case only puts the answers in order.
	// PT: O caso de uso orquestra e a entidade decide. Se o novo título é aceitável é perguntado
	//     a `note.edit`. Se o título está livre nesta aplicação é perguntado ao repositório.
	//     O caso de uso só coloca as respostas em ordem.
	// ES: El caso de uso orquesta y la entidad decide. Si el nuevo título es aceptable se le
	//     pregunta a `note.edit`. Si el título está libre en esta aplicación se le pregunta al
	//     repositorio. El caso de uso solo pone las respuestas en orden.
	async execute(input: UpdateNoteInput): Promise<Result<NoteData, ApplicationError>> {
		const current = await this.repository.findById(input.id);
		if (current === undefined) {
			return err({ kind: "note-not-found", message: `no note with id "${input.id}"` });
		}

		const edited = current.edit({ title: input.title, body: input.body }, this.clock.now());
		if (!edited.ok) {
			return edited;
		}

		const sameTitle = await this.repository.findByTitle(edited.value.title.value);
		if (sameTitle !== undefined && sameTitle.id !== edited.value.id) {
			return err({ kind: "duplicate-title", message: `a note titled "${sameTitle.title.value}" already exists` });
		}

		await this.repository.save(edited.value);
		return ok(toNoteData(edited.value));
	}
}
