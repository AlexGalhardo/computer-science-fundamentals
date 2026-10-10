// EN: `bun run repl`          reads lines from the keyboard and shows the tokens and the tree of each;
//     `bun run repl <file>`   does the same for a whole file and exits with 1 when it has errors.
// PT: `bun run repl`           lê linhas do teclado e mostra os tokens e a árvore de cada uma;
//     `bun run repl <arquivo>` faz o mesmo para um arquivo inteiro e termina com 1 quando há erros.
// ES: `bun run repl`           lee líneas del teclado y muestra los tokens y el árbol de cada una;
//     `bun run repl <archivo>` hace lo mismo para un archivo completo y termina con 1 cuando hay errores.

import { readFileSync } from "node:fs";
import { printTree } from "./ast";
import { parse } from "./parser";
import { formatProblem } from "./token";

// EN: The two intermediate products of the front end, side by side: first the flat list of
//     tokens (what the lexer saw), then the tree (the structure the parser found in that list).
// PT: Os dois produtos intermediários do front end, lado a lado: primeiro a lista plana de tokens
//     (o que o lexer viu), depois a árvore (a estrutura que o parser encontrou nessa lista).
// ES: Los dos productos intermedios del front end, lado a lado: primero la lista plana de tokens
//     (lo que vio el lexer), luego el árbol (la estructura que el parser encontró en esa lista).
export function report(source: string): { text: string; ok: boolean } {
	const { tokens, program, errors } = parse(source);
	const lines = ["tokens:"];
	for (const token of tokens) {
		const position = `${token.line}:${token.column}`.padEnd(6);
		lines.push(`  ${position} ${token.type.padEnd(13)} ${token.text}`.trimEnd());
	}
	lines.push("tree:");
	if (program.length > 0) {
		lines.push(printTree(program));
	}
	for (const error of errors) {
		lines.push(formatProblem(error));
	}
	return { text: lines.join("\n"), ok: errors.length === 0 };
}

if (import.meta.main) {
	const file = process.argv[2];
	if (file !== undefined) {
		const result = report(readFileSync(file, "utf8"));
		console.log(result.text);
		process.exit(result.ok ? 0 : 1);
	}
	console.log("mini language: type a statement and press Enter (Ctrl+D or Ctrl+C to leave)");
	process.stdout.write("> ");
	for await (const line of console) {
		if (line.trim().length > 0) {
			console.log(report(line).text);
		}
		process.stdout.write("> ");
	}
	console.log();
}
