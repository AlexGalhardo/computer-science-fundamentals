// EN: `bun run compare` measures the four implementations and prints the Markdown table that is
//     committed in `results/comparison.md`. Only the production code of the cart is measured:
//     tests, the scenario reader and the demos are left out, and so are comments and blank lines.
//     A test fails when the committed table no longer matches the code.
// PT: `bun run compare` mede as quatro implementações e imprime a tabela Markdown versionada em
//     `results/comparison.md`. Só o código de produção do carrinho é medido: testes, o leitor de
//     cenários e as demos ficam de fora, assim como comentários e linhas em branco. Um teste
//     falha quando a tabela versionada deixa de bater com o código.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

interface Implementation {
	name: string;
	/** Folder or file, relative to the mini-project folder. */
	path: string;
	extension: string;
	/** Matches a line that declares a named type. */
	typeDeclaration: RegExp;
	/** Matches a line that is only a comment. */
	comment: RegExp;
}

const slashComment = /^(\/\/|\/\*|\*)/;

const IMPLEMENTATIONS: Implementation[] = [
	{
		name: "Java, objects",
		path: "java/src/cart",
		extension: ".java",
		typeDeclaration: /^(public |final |abstract )*(class|interface|record|enum) \w+/,
		comment: slashComment,
	},
	{
		name: "TypeScript, objects",
		path: "ts/src/oop",
		extension: ".ts",
		typeDeclaration: /^(export )?(abstract )?(class|interface|type) \w+/,
		comment: slashComment,
	},
	{
		name: "TypeScript, functions",
		path: "ts/src/functional",
		extension: ".ts",
		typeDeclaration: /^(export )?(abstract )?(class|interface|type) \w+/,
		comment: slashComment,
	},
	{
		name: "Elixir, functions",
		path: "elixir/lib/cart.ex",
		extension: ".ex",
		typeDeclaration: /^(defmodule|defstruct|@type|@typep) /,
		comment: /^#/,
	},
];

function filesUnder(path: string, extension: string): string[] {
	if (statSync(path).isFile()) {
		return [path];
	}
	return readdirSync(path)
		.sort()
		.flatMap((name) => {
			const child = join(path, name);
			if (statSync(child).isDirectory()) {
				return filesUnder(child, extension);
			}
			return name.endsWith(extension) ? [child] : [];
		});
}

export interface Measure {
	name: string;
	files: number;
	codeLines: number;
	types: number;
}

export function measure(): Measure[] {
	return IMPLEMENTATIONS.map((implementation) => {
		const files = filesUnder(join(projectRoot, implementation.path), implementation.extension);
		// EN: Types are counted on trimmed lines too, because Elixir declares `@type` indented
		//     inside its module.
		// PT: Os tipos também são contados em linhas sem a indentação, porque o Elixir declara
		//     `@type` indentado dentro do módulo.
		const lines = files
			.flatMap((file) => readFileSync(file, "utf8").split(/\r?\n/))
			.map((line) => line.trim())
			.filter((line) => line !== "" && !implementation.comment.test(line));
		return {
			name: implementation.name,
			files: files.length,
			codeLines: lines.length,
			types: lines.filter((line) => implementation.typeDeclaration.test(line)).length,
		};
	});
}

export function comparisonTable(): string {
	const rows = measure().map((row) => `| ${row.name} | ${row.files} | ${row.codeLines} | ${row.types} |`);
	return ["| Implementation | Files | Lines of code | Named types |", "| --- | --- | --- | --- |", ...rows, ""].join(
		"\n",
	);
}

if (import.meta.main) {
	process.stdout.write(comparisonTable());
}
