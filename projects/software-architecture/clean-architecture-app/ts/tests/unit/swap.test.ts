// EN: The swap experiment as a guard. Replacing the repository can only stay a change of the
//     composition root while no other file names a concrete repository. This test reads the
//     source and fails the day a controller or a use case mentions `PostgresNoteRepository`.
// PT: O experimento de troca como uma guarda. Trocar o repositório só continua sendo uma mudança
//     da raiz de composição enquanto nenhum outro arquivo citar um repositório concreto. Este
//     teste lê o código e falha no dia em que um controller ou caso de uso mencionar
//     `PostgresNoteRepository`.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

const SRC = join(import.meta.dir, "..", "..", "src");

const DEFINED_IN: Record<string, string> = {
	InMemoryNoteRepository: "adapters/in-memory-note-repository.ts",
	PostgresNoteRepository: "drivers/postgres-note-repository.ts",
};

test("only the composition root names a concrete repository", () => {
	const mentions: Record<string, string[]> = {};
	for (const found of new Glob("**/*.ts").scanSync({ cwd: SRC })) {
		const path = found.replaceAll("\\", "/");
		const source = readFileSync(join(SRC, path), "utf8");
		for (const [name, definition] of Object.entries(DEFINED_IN)) {
			if (path !== definition && source.includes(name)) {
				mentions[name] = [...(mentions[name] ?? []), path];
			}
		}
	}

	expect(mentions).toEqual({
		InMemoryNoteRepository: ["main/composition.ts"],
		PostgresNoteRepository: ["main/composition.ts"],
	});
});
