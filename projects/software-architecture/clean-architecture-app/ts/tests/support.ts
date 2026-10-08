import { Note } from "../src/entities/note";
import type { NoteUseCases } from "../src/use-cases";
import { CreateNote } from "../src/use-cases/create-note";
import { ListNotes, RemoveNote } from "../src/use-cases/list-and-remove-notes";
import type { Clock, IdGenerator, NoteRepository } from "../src/use-cases/ports";
import { UpdateNote } from "../src/use-cases/update-note";

// EN: Test doubles for the two unpredictable ports. With them a test knows in advance the id
//     and the timestamp of every note, so it can compare whole objects.
// PT: Dublês de teste para as duas portas imprevisíveis. Com eles um teste sabe de antemão o id
//     e o horário de cada nota, então consegue comparar objetos inteiros.
export class FixedClock implements Clock {
	constructor(private current: Date = new Date("2026-01-01T10:00:00.000Z")) {}

	now(): Date {
		return this.current;
	}

	advanceMinutes(minutes: number): void {
		this.current = new Date(this.current.getTime() + minutes * 60_000);
	}
}

export class SequentialIds implements IdGenerator {
	private count = 0;

	next(): string {
		this.count += 1;
		return `note-${this.count}`;
	}
}

// EN: The same wiring the composition root does, with the doubles in place of the real clock
//     and ids. The repository is a parameter: any implementation of the port fits.
// PT: A mesma montagem que a raiz de composição faz, com os dublês no lugar do relógio e dos ids
//     de verdade. O repositório é um parâmetro: qualquer implementação da porta serve.
export function buildUseCases(repository: NoteRepository, clock: Clock = new FixedClock()): NoteUseCases {
	return {
		createNote: new CreateNote(repository, new SequentialIds(), clock),
		listNotes: new ListNotes(repository),
		updateNote: new UpdateNote(repository, clock),
		removeNote: new RemoveNote(repository),
	};
}

export function validNote(id: string, title: string, minute = 0): Note {
	const at = new Date(Date.UTC(2026, 0, 1, 10, minute));
	const note = Note.create({ id, title, body: `body of ${title}`, createdAt: at, updatedAt: at });
	if (!note.ok) {
		throw new Error(note.error.message);
	}
	return note.value;
}
