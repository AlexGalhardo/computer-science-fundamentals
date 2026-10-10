// EN: Tests of the automated check itself. A check that never fails proves nothing, so most of
//     this file feeds it code that breaks the rule and expects it to complain.
// PT: Testes da própria verificação automática. Uma verificação que nunca falha não prova nada,
//     então a maior parte deste arquivo entrega a ela código que quebra a regra e espera que reclame.
// ES: Pruebas de la propia verificación automática. Una verificación que nunca falla no prueba
//     nada, así que la mayor parte de este archivo le entrega código que rompe la regla y espera
//     que se queje.

import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Glob } from "bun";
import { checkFile, checkFiles, findImports, type SourceFile } from "../../tools/dependency-rule";

const SRC = join(import.meta.dir, "..", "..", "src");
const CHECKER = join(import.meta.dir, "..", "..", "tools", "check-dependency-rule.ts");

function readSources(): SourceFile[] {
	return [...new Glob("**/*.ts").scanSync({ cwd: SRC })].map((path) => ({
		path: path.replaceAll("\\", "/"),
		source: readFileSync(join(SRC, path), "utf8"),
	}));
}

function runChecker(srcDir: string): { exitCode: number; output: string } {
	const result = Bun.spawnSync(["bun", "run", CHECKER, srcDir]);
	return { exitCode: result.exitCode, output: `${result.stdout.toString()}${result.stderr.toString()}` };
}

describe("the real source tree", () => {
	test("has files in all five layers and no import pointing outward", () => {
		const files = readSources();

		for (const layer of ["entities", "use-cases", "adapters", "drivers", "main"]) {
			expect(files.some((file) => file.path.startsWith(`${layer}/`))).toBe(true);
		}
		expect(checkFiles(files)).toEqual([]);
	});

	test("the command exits with 0", () => {
		const result = runChecker(SRC);

		expect(result.output).toContain("dependency rule holds");
		expect(result.exitCode).toBe(0);
	});
});

describe("findImports", () => {
	test("finds static, type-only, re-export, side-effect, dynamic and require imports", () => {
		const source = [
			'import { a } from "./a";',
			'import type { B } from "../b";',
			'export { c } from "./c";',
			'import "./d";',
			'const e = await import("./e");',
			'const f = require("./f");',
			"import {",
			"\tg,",
			'} from "./g";',
		].join("\n");

		expect(findImports(source).map((found) => found.specifier)).toEqual([
			"./a",
			"../b",
			"./c",
			"./d",
			"./e",
			"./f",
			"./g",
		]);
	});

	test("ignores imports that are only mentioned in comments", () => {
		const source = [
			'// import { x } from "../drivers/x";',
			"/*",
			' import "elysia";',
			"*/",
			"export const a = 1;",
		].join("\n");

		expect(findImports(source)).toEqual([]);
	});
});

describe("violations", () => {
	const cases: { name: string; file: SourceFile; reason: string }[] = [
		{
			name: "an entity importing a use case",
			file: { path: "entities/note.ts", source: 'import { CreateNote } from "../use-cases/create-note";' },
			reason: '"entities" is an inner layer and cannot import from "use-cases"',
		},
		{
			name: "a use case importing the PostgreSQL repository",
			file: {
				path: "use-cases/create-note.ts",
				source: 'import { PostgresNoteRepository } from "../drivers/postgres-note-repository";',
			},
			reason: '"use-cases" is an inner layer and cannot import from "drivers"',
		},
		{
			name: "a use case importing only a TYPE from an adapter",
			file: {
				path: "use-cases/create-note.ts",
				source: 'import type { HttpResponse } from "../adapters/note-http-controller";',
			},
			reason: '"use-cases" is an inner layer and cannot import from "adapters"',
		},
		{
			name: "a use case importing the web framework",
			file: { path: "use-cases/create-note.ts", source: 'import { Elysia } from "elysia";' },
			reason: 'the "use-cases" layer cannot import the package "elysia"',
		},
		{
			name: "an entity importing a built-in module",
			file: { path: "entities/note.ts", source: 'import { randomUUID } from "node:crypto";' },
			reason: 'the "entities" layer cannot import the package "node:crypto"',
		},
		{
			name: "an adapter importing the database driver",
			file: { path: "adapters/in-memory-note-repository.ts", source: 'import { Pool } from "pg";' },
			reason: 'the "adapters" layer cannot import the package "pg"',
		},
		{
			name: "an adapter importing a driver",
			file: {
				path: "adapters/note-http-controller.ts",
				source: 'import { createHttpServer } from "../drivers/elysia-server";',
			},
			reason: '"adapters" is an inner layer and cannot import from "drivers"',
		},
		{
			name: "a driver importing the composition root",
			file: { path: "drivers/elysia-server.ts", source: 'const { x } = await import("../main/composition");' },
			reason: '"drivers" is an inner layer and cannot import from "main"',
		},
		{
			name: "a file outside every layer",
			file: { path: "helpers.ts", source: "export const a = 1;" },
			reason: "the file is outside the layers (entities, use-cases, adapters, drivers, main)",
		},
	];

	for (const { name, file, reason } of cases) {
		test(name, () => {
			expect(checkFile(file).map((violation) => violation.reason)).toEqual([reason]);
		});
	}

	test("imports that point inward or sideways are accepted", () => {
		const files: SourceFile[] = [
			{ path: "entities/note.ts", source: 'import { Title } from "./title";' },
			{ path: "use-cases/create-note.ts", source: 'import { Note } from "../entities/note";' },
			{
				path: "adapters/controller.ts",
				source: 'import { z } from "zod";\nimport type { X } from "../use-cases";',
			},
			{ path: "drivers/server.ts", source: 'import { Elysia } from "elysia";\nimport "../adapters/controller";' },
			{ path: "main/composition.ts", source: 'import "../drivers/server";\nimport "../entities/note";' },
		];

		expect(checkFiles(files)).toEqual([]);
	});
});

// EN: The acceptance criterion, end to end: copy the real `src/`, add ONE forbidden import to a
//     use case, and the command must exit with a non-zero code naming the file and the line.
// PT: O critério de aceite, de ponta a ponta: copiar o `src/` real, acrescentar UM import
//     proibido a um caso de uso, e o comando precisa terminar com código diferente de zero
//     citando o arquivo e a linha.
// ES: El criterio de aceptación, de punta a punta: copiar el `src/` real, agregar UN import
//     prohibido a un caso de uso, y el comando debe terminar con un código distinto de cero
//     citando el archivo y la línea.
describe("the command against a tree with one outward import", () => {
	test("exits with 1 and names the offending line", () => {
		const copy = mkdtempSync(join(tmpdir(), "dependency-rule-"));
		try {
			for (const file of readSources()) {
				const target = join(copy, file.path);
				mkdirSync(dirname(target), { recursive: true });
				const source =
					file.path === "use-cases/create-note.ts"
						? `import type { HttpResponse } from "../adapters/note-http-controller";\n${file.source}`
						: file.source;
				writeFileSync(target, source);
			}

			const result = runChecker(copy);

			expect(result.exitCode).toBe(1);
			expect(result.output).toContain('use-cases/create-note.ts:1 imports "../adapters/note-http-controller"');
			expect(result.output).toContain("dependency rule broken: 1 violation(s)");
		} finally {
			rmSync(copy, { recursive: true, force: true });
		}
	});
});
