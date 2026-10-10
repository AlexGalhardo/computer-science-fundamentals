import { beforeEach, describe, expect, test } from "bun:test";
import type { NoteRepository } from "../src/use-cases/ports";
import { validNote } from "./support";

// EN: A CONTRACT TEST. The port is a promise, and every adapter must keep it in the same way,
//     otherwise swapping one for another would change the behaviour of the use cases. So the
//     promise is written once, as tests against the interface, and the same suite runs for the
//     in-memory adapter (unit tests) and for PostgreSQL (integration tests).
// PT: UM TESTE DE CONTRATO. A porta é uma promessa, e todo adaptador precisa cumpri-la do mesmo
//     jeito, senão trocar um pelo outro mudaria o comportamento dos casos de uso. Então a
//     promessa é escrita uma vez, como testes contra a interface, e a mesma suíte roda para o
//     adaptador em memória (testes de unidade) e para o PostgreSQL (testes de integração).
// ES: UNA PRUEBA DE CONTRATO. El puerto es una promesa, y todo adaptador debe cumplirla de la
//     misma manera, de lo contrario cambiar uno por otro alteraría el comportamiento de los
//     casos de uso. Entonces la promesa se escribe una vez, como pruebas contra la interfaz, y la
//     misma suite corre para el adaptador en memoria (pruebas unitarias) y para PostgreSQL
//     (pruebas de integración).
export function describeNoteRepositoryContract(name: string, create: () => Promise<NoteRepository>): void {
	describe(`NoteRepository contract: ${name}`, () => {
		let repository: NoteRepository;

		beforeEach(async () => {
			repository = await create();
		});

		test("a saved note is found by id and by title, equal to what was saved", async () => {
			const note = validNote("a", "Groceries");
			await repository.save(note);

			const byId = await repository.findById("a");
			const byTitle = await repository.findByTitle("Groceries");

			for (const found of [byId, byTitle]) {
				expect(found?.id).toBe("a");
				expect(found?.title.value).toBe("Groceries");
				expect(found?.body).toBe("body of Groceries");
				expect(found?.createdAt.toISOString()).toBe(note.createdAt.toISOString());
				expect(found?.updatedAt.toISOString()).toBe(note.updatedAt.toISOString());
			}
		});

		test("an unknown id or title gives undefined", async () => {
			expect(await repository.findById("missing")).toBeUndefined();
			expect(await repository.findByTitle("missing")).toBeUndefined();
		});

		test("saving a note with an existing id replaces it and keeps its place in the list", async () => {
			await repository.save(validNote("a", "First", 0));
			await repository.save(validNote("b", "Second", 1));
			const edited = validNote("a", "First", 0).edit(
				{ title: "First, edited" },
				new Date("2026-01-01T11:00:00.000Z"),
			);
			if (!edited.ok) {
				throw new Error(edited.error.message);
			}

			await repository.save(edited.value);

			const notes = await repository.list();
			expect(notes.map((note) => note.title.value)).toEqual(["First, edited", "Second"]);
			expect(notes[0]?.updatedAt.toISOString()).toBe("2026-01-01T11:00:00.000Z");
		});

		test("list returns the oldest note first", async () => {
			await repository.save(validNote("z", "Created first", 0));
			await repository.save(validNote("a", "Created second", 0));

			const notes = await repository.list();

			expect(notes.map((note) => note.id)).toEqual(["z", "a"]);
		});

		test("remove tells whether a note was removed", async () => {
			await repository.save(validNote("a", "Groceries"));

			expect(await repository.remove("a")).toBe(true);
			expect(await repository.remove("a")).toBe(false);
			expect(await repository.list()).toEqual([]);
		});
	});
}
