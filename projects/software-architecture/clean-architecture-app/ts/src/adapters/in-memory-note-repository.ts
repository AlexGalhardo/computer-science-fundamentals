import type { Note } from "../entities/note";
import type { NoteRepository } from "../use-cases/ports";

// EN: The simplest adapter for the `NoteRepository` port: a `Map`. It is a real implementation,
//     not a trick for tests: the use cases cannot tell it from PostgreSQL. It also shows that
//     the port asks for nothing that only a database could give. The notes are lost when the
//     process ends, which is the one reason to plug in another adapter.
// PT: O adaptador mais simples para a porta `NoteRepository`: um `Map`. É uma implementação de
//     verdade, não um truque para testes: os casos de uso não conseguem distingui-lo do
//     PostgreSQL. Ele também mostra que a porta não pede nada que só um banco poderia dar.
//     As notas se perdem quando o processo termina, que é o único motivo para plugar outro adaptador.
export class InMemoryNoteRepository implements NoteRepository {
	// EN: A `Map` keeps insertion order, and saving an existing key keeps its position, so
	//     `list` returns the oldest note first, as the port promises.
	// PT: Um `Map` mantém a ordem de inserção, e gravar uma chave existente mantém a posição,
	//     então `list` devolve a nota mais antiga primeiro, como a porta promete.
	private readonly notes = new Map<string, Note>();

	async save(note: Note): Promise<void> {
		this.notes.set(note.id, note);
	}

	async findById(id: string): Promise<Note | undefined> {
		return this.notes.get(id);
	}

	async findByTitle(title: string): Promise<Note | undefined> {
		for (const note of this.notes.values()) {
			if (note.title.value === title) {
				return note;
			}
		}
		return undefined;
	}

	async list(): Promise<Note[]> {
		return [...this.notes.values()];
	}

	async remove(id: string): Promise<boolean> {
		return this.notes.delete(id);
	}
}
