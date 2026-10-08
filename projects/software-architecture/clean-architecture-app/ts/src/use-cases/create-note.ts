// EN: SECOND LAYER: use cases. A use case is one thing the application does for its user,
//     written as a sequence of steps: validate through the entity, apply the rules of this
//     application, store. It imports the entities and its own ports, and nothing else. Read the
//     file again and notice what is missing: no request, no status code, no SQL, no `console`.
//     The same class serves the HTTP API and the terminal.
// PT: SEGUNDA CAMADA: casos de uso. Um caso de uso é uma coisa que a aplicação faz pelo seu
//     usuário, escrita como uma sequência de passos: validar pela entidade, aplicar as regras
//     desta aplicação, guardar. Ele importa as entidades e as suas próprias portas, e mais nada.
//     Leia o arquivo de novo e repare no que falta: nenhuma requisição, nenhum código de status,
//     nenhum SQL, nenhum `console`. A mesma classe atende a API HTTP e o terminal.

import { Note } from "../entities/note";
import { err, ok, type Result } from "../entities/result";
import { type ApplicationError, type NoteData, toNoteData } from "./note-data";
import type { Clock, IdGenerator, NoteRepository } from "./ports";

export interface CreateNoteInput {
	title: string;
	body: string;
}

export class CreateNote {
	// EN: Dependency injection: the use case receives its collaborators, it does not build them.
	//     Whoever calls `new CreateNote(...)` decides whether the notes go to memory or to
	//     PostgreSQL, and that caller is the composition root, in `main/`.
	// PT: Injeção de dependência: o caso de uso recebe os seus colaboradores, não os constrói.
	//     Quem chama `new CreateNote(...)` decide se as notas vão para a memória ou para o
	//     PostgreSQL, e quem chama é a raiz de composição, em `main/`.
	constructor(
		private readonly repository: NoteRepository,
		private readonly ids: IdGenerator,
		private readonly clock: Clock,
	) {}

	async execute(input: CreateNoteInput): Promise<Result<NoteData, ApplicationError>> {
		const now = this.clock.now();
		const note = Note.create({
			id: this.ids.next(),
			title: input.title,
			body: input.body,
			createdAt: now,
			updatedAt: now,
		});
		if (!note.ok) {
			return note;
		}

		// EN: "No two notes with the same title" is a rule of THIS application, not of what a
		//     note is. Another product could allow it. That is why it lives in the use case and
		//     not in the entity, and why it needs the repository: one note alone cannot know
		//     about the others.
		// PT: "Não há duas notas com o mesmo título" é uma regra DESTA aplicação, não do que uma
		//     nota é. Outro produto poderia permitir. Por isso ela mora no caso de uso e não na
		//     entidade, e por isso precisa do repositório: uma nota sozinha não tem como saber
		//     das outras.
		const sameTitle = await this.repository.findByTitle(note.value.title.value);
		if (sameTitle !== undefined) {
			return err({ kind: "duplicate-title", message: `a note titled "${sameTitle.title.value}" already exists` });
		}

		await this.repository.save(note.value);
		return ok(toNoteData(note.value));
	}
}
