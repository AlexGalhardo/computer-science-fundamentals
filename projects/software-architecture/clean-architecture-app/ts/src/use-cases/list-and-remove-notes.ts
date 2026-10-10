import { err, ok, type Result } from "../entities/result";
import { type ApplicationError, type NoteData, toNoteData } from "./note-data";
import type { NoteRepository } from "./ports";

export class ListNotes {
	constructor(private readonly repository: NoteRepository) {}

	async execute(): Promise<NoteData[]> {
		const notes = await this.repository.list();
		return notes.map(toNoteData);
	}
}

export interface RemoveNoteInput {
	id: string;
}

export class RemoveNote {
	constructor(private readonly repository: NoteRepository) {}

	// EN: A note that is not there is an expected answer, so it comes back as a `Result`. The
	//     HTTP adapter will turn it into 404 and the terminal adapter into exit code 1, and this
	//     class knows neither.
	// PT: Uma nota que não está lá é uma resposta esperada, então volta como `Result`. O
	//     adaptador HTTP vai transformá-la em 404 e o adaptador de terminal em código de saída 1,
	//     e esta classe não conhece nenhum dos dois.
	// ES: Una nota que no está es una respuesta esperada, así que vuelve como `Result`. El
	//     adaptador HTTP la convertirá en 404 y el adaptador de terminal en código de salida 1, y
	//     esta clase no conoce ninguno de los dos.
	async execute(input: RemoveNoteInput): Promise<Result<{ id: string }, ApplicationError>> {
		const removed = await this.repository.remove(input.id);
		if (!removed) {
			return err({ kind: "note-not-found", message: `no note with id "${input.id}"` });
		}
		return ok({ id: input.id });
	}
}
