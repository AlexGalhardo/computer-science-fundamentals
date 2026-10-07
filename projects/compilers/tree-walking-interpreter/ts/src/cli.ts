// EN: `bun run mini`          starts the REPL: each line runs in the same session, so state is kept;
//     `bun run mini <file>`   runs a program and exits with 1 on a syntax or run-time error.
// PT: `bun run mini`           inicia o REPL: cada linha roda na mesma sessão, então o estado fica;
//     `bun run mini <arquivo>` executa um programa e termina com 1 em erro de sintaxe ou execução.

import { readFileSync } from "node:fs";
import { type RunResult, Session } from "./session";

// EN: A file sends errors to stderr, as any command-line tool. The REPL writes them to stdout,
//     so they stay in order with the rest of the conversation.
// PT: Um arquivo manda os erros para stderr, como qualquer ferramenta de linha de comando. O REPL
//     os escreve em stdout, para ficarem em ordem com o resto da conversa.
function show(result: RunResult, errorsTo: (line: string) => void): void {
	for (const line of result.output) {
		console.log(line);
	}
	for (const error of result.errors) {
		errorsTo(error);
	}
}

const session = new Session();
const file = process.argv[2];
if (file !== undefined) {
	const result = session.run(readFileSync(file, "utf8"));
	show(result, console.error);
	process.exit(result.errors.length === 0 ? 0 : 1);
}

console.log("mini language: type a statement and press Enter (Ctrl+D or Ctrl+C to leave)");
process.stdout.write("> ");
for await (const line of console) {
	if (line.trim().length > 0) {
		show(session.run(line, { echo: true }), console.log);
	}
	process.stdout.write("> ");
}
console.log();
