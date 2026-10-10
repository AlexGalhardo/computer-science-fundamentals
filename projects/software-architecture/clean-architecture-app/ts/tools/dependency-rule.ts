// EN: THE DEPENDENCY RULE AS A PROGRAM. A rule that lives only in a diagram is broken by the
//     first hurried import. This module reads the imports of every file in `src/` and reports
//     each one that points from an inner layer to an outer one. It runs with the tests, so
//     such an import fails the build.
// PT: A REGRA DE DEPENDÊNCIA COMO UM PROGRAMA. Uma regra que vive só em um diagrama é quebrada
//     pelo primeiro import apressado. Este módulo lê os imports de cada arquivo de `src/` e
//     relata cada um que aponta de uma camada interna para uma externa. Ele roda junto com os
//     testes, então um import desses quebra o build.
// ES: LA REGLA DE DEPENDENCIA COMO UN PROGRAMA. Una regla que vive solo en un diagrama la rompe
//     el primer import apresurado. Este módulo lee los imports de cada archivo de `src/` y
//     reporta cada uno que apunta de una capa interna a una externa. Corre junto con las
//     pruebas, así que un import así rompe el build.

import { posix } from "node:path";

// EN: The layers from the centre outward. The position in this list is the whole rule: a file
//     may import from its own layer and from the layers BEFORE it, never from the ones after.
// PT: As camadas do centro para fora. A posição nesta lista é a regra inteira: um arquivo pode
//     importar da própria camada e das camadas ANTERIORES, nunca das posteriores.
// ES: Las capas del centro hacia afuera. La posición en esta lista es la regla completa: un
//     archivo puede importar de su propia capa y de las capas ANTERIORES, nunca de las
//     posteriores.
export const LAYERS = ["entities", "use-cases", "adapters", "drivers", "main"] as const;
export type Layer = (typeof LAYERS)[number];

// EN: A library is an outer detail too. The two inner layers may import no package at all, not
//     even a built-in one such as `node:fs`. The adapters may use Zod to check the shape of
//     external input. Only the two outer layers may import frameworks and drivers.
// PT: Uma biblioteca também é um detalhe externo. As duas camadas internas não podem importar
//     pacote nenhum, nem mesmo um embutido como `node:fs`. Os adaptadores podem usar o Zod para
//     conferir o formato da entrada externa. Só as duas camadas externas podem importar
//     frameworks e drivers.
// ES: Una biblioteca también es un detalle externo. Las dos capas internas no pueden importar
//     ningún paquete, ni siquiera uno integrado como `node:fs`. Los adaptadores pueden usar Zod
//     para verificar el formato de la entrada externa. Solo las dos capas externas pueden
//     importar frameworks y drivers.
const ALLOWED_PACKAGES: Record<Layer, readonly string[] | "any"> = {
	entities: [],
	"use-cases": [],
	adapters: ["zod"],
	drivers: "any",
	main: "any",
};

export interface SourceFile {
	/** Path relative to `src/`, for example `use-cases/create-note.ts`. */
	path: string;
	source: string;
}

export interface Violation {
	file: string;
	line: number;
	specifier: string;
	reason: string;
}

interface FoundImport {
	specifier: string;
	line: number;
}

// EN: Comments are blanked out first, keeping every line break, so an import mentioned inside
//     a comment is not counted and the line numbers stay right. This is a didactic scanner
//     based on regular expressions, not a TypeScript parser: a string that contains `//` or
//     the text of an import can fool it. A production project would use a lint rule or a tool
//     built on the compiler.
// PT: Os comentários são apagados antes, mantendo cada quebra de linha, então um import citado
//     dentro de um comentário não é contado e os números de linha continuam certos. Este é um
//     leitor didático baseado em expressões regulares, não um parser de TypeScript: uma string
//     que contenha `//` ou o texto de um import consegue enganá-lo. Um projeto de produção
//     usaria uma regra de lint ou uma ferramenta construída sobre o compilador.
// ES: Los comentarios se borran antes, conservando cada salto de línea, así que un import citado
//     dentro de un comentario no se cuenta y los números de línea siguen correctos. Este es un
//     lector didáctico basado en expresiones regulares, no un parser de TypeScript: un string
//     que contenga `//` o el texto de un import puede engañarlo. Un proyecto de producción
//     usaría una regla de lint o una herramienta construida sobre el compilador.
function blankComments(source: string): string {
	const blank = (match: string): string => match.replace(/[^\n]/g, " ");
	return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(?<!:)\/\/[^\n]*/g, blank);
}

// EN: `import type` is matched on purpose. A type-only import disappears at run time, but the
//     file still cannot be read or compiled without the outer one: it is a source-code
//     dependency, which is exactly what the rule is about.
// PT: `import type` é capturado de propósito. Um import só de tipo desaparece em tempo de
//     execução, mas o arquivo continua sem poder ser lido ou compilado sem o externo: é uma
//     dependência de código-fonte, que é exatamente do que a regra trata.
// ES: `import type` se captura a propósito. Un import solo de tipo desaparece en tiempo de
//     ejecución, pero el archivo sigue sin poder leerse ni compilarse sin el externo: es una
//     dependencia de código fuente, que es exactamente de lo que trata la regla.
const IMPORT_PATTERNS = [
	/\b(?:import|export)\b[^"';]*?\bfrom\s*["']([^"']+)["']/g,
	/\bimport\s*["']([^"']+)["']/g,
	/\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g,
];

export function findImports(source: string): FoundImport[] {
	const code = blankComments(source);
	const found = new Map<string, FoundImport>();
	for (const pattern of IMPORT_PATTERNS) {
		for (const match of code.matchAll(pattern)) {
			const specifier = match[1];
			if (specifier === undefined) {
				continue;
			}
			const end = (match.index ?? 0) + match[0].length;
			const line = code.slice(0, end).split("\n").length;
			found.set(`${line}:${specifier}`, { specifier, line });
		}
	}
	return [...found.values()].sort((a, b) => a.line - b.line);
}

function layerOf(path: string): Layer | undefined {
	const first = path.split("/")[0];
	return LAYERS.find((layer) => layer === first);
}

function packageName(specifier: string): string {
	const parts = specifier.split("/");
	return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier);
}

export function checkFile(file: SourceFile): Violation[] {
	const path = file.path.replaceAll("\\", "/");
	const layer = layerOf(path);
	if (layer === undefined) {
		return [
			{ file: path, line: 1, specifier: "", reason: `the file is outside the layers (${LAYERS.join(", ")})` },
		];
	}

	const violations: Violation[] = [];
	for (const { specifier, line } of findImports(file.source)) {
		const report = (reason: string): void => {
			violations.push({ file: path, line, specifier, reason });
		};

		if (!specifier.startsWith(".")) {
			const allowed = ALLOWED_PACKAGES[layer];
			if (allowed !== "any" && !allowed.includes(packageName(specifier))) {
				report(`the "${layer}" layer cannot import the package "${packageName(specifier)}"`);
			}
			continue;
		}

		const target = posix.normalize(posix.join(posix.dirname(path), specifier));
		const targetLayer = layerOf(target);
		if (target.startsWith("..") || targetLayer === undefined) {
			report("the import leaves the layers of src/");
			continue;
		}
		// EN: The comparison that enforces the rule: the imported layer must not come after
		//     the importing one in the list.
		// PT: A comparação que aplica a regra: a camada importada não pode vir depois da que
		//     importa na lista.
		// ES: La comparación que aplica la regla: la capa importada no puede venir después de la
		//     que importa en la lista.
		if (LAYERS.indexOf(targetLayer) > LAYERS.indexOf(layer)) {
			report(`"${layer}" is an inner layer and cannot import from "${targetLayer}"`);
		}
	}
	return violations;
}

export function checkFiles(files: readonly SourceFile[]): Violation[] {
	return files.flatMap(checkFile);
}
