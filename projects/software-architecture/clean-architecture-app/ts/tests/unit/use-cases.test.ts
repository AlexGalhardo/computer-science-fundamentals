// EN: THE POINT OF THE ARCHITECTURE, AS A TEST FILE. Every business rule of the application is
//     exercised here, and look at the imports: no web framework, no database driver, no
//     environment variable. The test container has no network at all (see docker-compose.yml),
//     so these tests could not reach a database even by accident. They run in milliseconds.
// PT: O OBJETIVO DA ARQUITETURA, COMO UM ARQUIVO DE TESTE. Toda regra de negócio da aplicação é
//     exercitada aqui, e olhe os imports: nenhum framework web, nenhum driver de banco, nenhuma
//     variável de ambiente. O contêiner de teste não tem rede nenhuma (veja docker-compose.yml),
//     então estes testes não alcançariam um banco nem por acidente. Rodam em milissegundos.

import { beforeEach, describe, expect, test } from "bun:test";
import { InMemoryNoteRepository } from "../../src/adapters/in-memory-note-repository";
import type { NoteUseCases } from "../../src/use-cases";
import { buildUseCases, FixedClock } from "../support";

let clock: FixedClock;
let repository: InMemoryNoteRepository;
let useCases: NoteUseCases;

beforeEach(() => {
	clock = new FixedClock(new Date("2026-01-01T10:00:00.000Z"));
	repository = new InMemoryNoteRepository();
	useCases = buildUseCases(repository, clock);
});

describe("CreateNote", () => {
	test("creates a note with the id and the time given by the ports", async () => {
		const result = await useCases.createNote.execute({ title: "  Groceries ", body: "milk" });

		expect(result).toEqual({
			ok: true,
			value: {
				id: "note-1",
				title: "Groceries",
				body: "milk",
				createdAt: "2026-01-01T10:00:00.000Z",
				updatedAt: "2026-01-01T10:00:00.000Z",
			},
		});
		expect((await repository.findById("note-1"))?.title.value).toBe("Groceries");
	});

	test("returns the error of the entity and stores nothing", async () => {
		const result = await useCases.createNote.execute({ title: "   ", body: "" });

		expect(!result.ok && result.error.kind).toBe("invalid-title");
		expect(await repository.list()).toEqual([]);
	});

	test("refuses a second note with the same title", async () => {
		await useCases.createNote.execute({ title: "Groceries", body: "milk" });

		const result = await useCases.createNote.execute({ title: " Groceries ", body: "bread" });

		expect(!result.ok && result.error.kind).toBe("duplicate-title");
		expect(await repository.list()).toHaveLength(1);
	});
});

describe("ListNotes", () => {
	test("returns plain data, oldest first", async () => {
		await useCases.createNote.execute({ title: "First", body: "" });
		await useCases.createNote.execute({ title: "Second", body: "" });

		const notes = await useCases.listNotes.execute();

		expect(notes.map((note) => note.title)).toEqual(["First", "Second"]);
		// EN: The output is a DTO: the title is a string, not the `Title` object of the domain.
		// PT: A saída é um DTO: o título é uma string, não o objeto `Title` do domínio.
		expect(typeof notes[0]?.title).toBe("string");
	});
});

describe("UpdateNote", () => {
	test("changes only what was sent and moves updatedAt", async () => {
		await useCases.createNote.execute({ title: "Groceries", body: "milk" });
		clock.advanceMinutes(5);

		const result = await useCases.updateNote.execute({ id: "note-1", body: "milk and bread" });

		expect(result).toEqual({
			ok: true,
			value: {
				id: "note-1",
				title: "Groceries",
				body: "milk and bread",
				createdAt: "2026-01-01T10:00:00.000Z",
				updatedAt: "2026-01-01T10:05:00.000Z",
			},
		});
	});

	test("reports a note that does not exist", async () => {
		const result = await useCases.updateNote.execute({ id: "missing", title: "x" });

		expect(!result.ok && result.error.kind).toBe("note-not-found");
	});

	test("refuses the title of another note, and accepts keeping its own", async () => {
		await useCases.createNote.execute({ title: "Groceries", body: "" });
		await useCases.createNote.execute({ title: "Gym", body: "" });

		const taken = await useCases.updateNote.execute({ id: "note-2", title: "Groceries" });
		const own = await useCases.updateNote.execute({ id: "note-2", title: "Gym", body: "monday" });

		expect(!taken.ok && taken.error.kind).toBe("duplicate-title");
		expect(own.ok && own.value.body).toBe("monday");
	});

	test("an invalid new title leaves the stored note as it was", async () => {
		await useCases.createNote.execute({ title: "Groceries", body: "milk" });

		const result = await useCases.updateNote.execute({ id: "note-1", title: "" });

		expect(!result.ok && result.error.kind).toBe("invalid-title");
		expect((await repository.findById("note-1"))?.title.value).toBe("Groceries");
	});
});

describe("RemoveNote", () => {
	test("removes an existing note", async () => {
		await useCases.createNote.execute({ title: "Groceries", body: "" });

		const result = await useCases.removeNote.execute({ id: "note-1" });

		expect(result).toEqual({ ok: true, value: { id: "note-1" } });
		expect(await useCases.listNotes.execute()).toEqual([]);
	});

	test("reports a note that does not exist", async () => {
		const result = await useCases.removeNote.execute({ id: "missing" });

		expect(!result.ok && result.error.kind).toBe("note-not-found");
	});
});
