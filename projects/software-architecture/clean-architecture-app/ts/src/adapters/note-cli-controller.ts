// EN: A second delivery mechanism over the SAME use cases. Compare with the HTTP controller:
//     the input is a list of words in place of a JSON body, and the output is lines of text
//     and an exit code in place of a status and a JSON document. Nothing in `use-cases/` or
//     `entities/` changed to make room for the terminal.
// PT: Um segundo mecanismo de entrega sobre os MESMOS casos de uso. Compare com o controller
//     HTTP: a entrada é uma lista de palavras no lugar de um corpo JSON, e a saída são linhas de
//     texto e um código de saída no lugar de um status e um documento JSON. Nada em
//     `use-cases/` ou `entities/` mudou para abrir espaço para o terminal.

import { z } from "zod";
import type { NoteUseCases } from "../use-cases";
import type { ApplicationError, NoteData } from "../use-cases/note-data";

// EN: The controller returns what should be printed, it does not print. Writing to the real
//     terminal is done by the driver, so this class is tested by comparing arrays of text.
// PT: O controller devolve o que deve ser impresso, não imprime. Escrever no terminal de
//     verdade é trabalho do driver, então esta classe é testada comparando arrays de texto.
export interface CliResult {
	exitCode: number;
	stdout: string[];
	stderr: string[];
}

export const CLI_USAGE = ["usage:", "  add <title> [body]", "  list", "  edit <id> <title> [body]", "  remove <id>"];

const text = z.string().max(100_000);
const addSchema = z.union([z.tuple([text]), z.tuple([text, text])]);
const editSchema = z.union([z.tuple([text.min(1), text]), z.tuple([text.min(1), text, text])]);
const removeSchema = z.tuple([text.min(1)]);

// EN: The presenter: it formats the output data of a use case for one kind of screen. It holds
//     no decision about notes, only about how a note looks in a terminal.
// PT: O presenter: formata os dados de saída de um caso de uso para um tipo de tela. Não guarda
//     nenhuma decisão sobre notas, só sobre como uma nota aparece em um terminal.
export function presentNote(note: NoteData): string {
	const body = note.body.length > 0 ? `  ${note.body}` : "";
	return `${note.id}  ${note.updatedAt}  ${note.title}${body}`;
}

function success(...stdout: string[]): CliResult {
	return { exitCode: 0, stdout, stderr: [] };
}

function failure(error: ApplicationError): CliResult {
	return { exitCode: 1, stdout: [], stderr: [`error (${error.kind}): ${error.message}`] };
}

function usage(): CliResult {
	return { exitCode: 2, stdout: [], stderr: CLI_USAGE };
}

export class NoteCliController {
	constructor(private readonly useCases: NoteUseCases) {}

	async run(argv: readonly string[]): Promise<CliResult> {
		const [command, ...args] = argv;
		switch (command) {
			case "add": {
				const input = addSchema.safeParse(args);
				if (!input.success) {
					return usage();
				}
				const [title, body = ""] = input.data;
				const result = await this.useCases.createNote.execute({ title, body });
				return result.ok ? success(`created ${presentNote(result.value)}`) : failure(result.error);
			}
			case "list": {
				const notes = await this.useCases.listNotes.execute();
				return notes.length > 0 ? success(...notes.map(presentNote)) : success("no notes yet");
			}
			case "edit": {
				const input = editSchema.safeParse(args);
				if (!input.success) {
					return usage();
				}
				const [id, title, body] = input.data;
				const result = await this.useCases.updateNote.execute({ id, title, body });
				return result.ok ? success(`updated ${presentNote(result.value)}`) : failure(result.error);
			}
			case "remove": {
				const input = removeSchema.safeParse(args);
				if (!input.success) {
					return usage();
				}
				const result = await this.useCases.removeNote.execute({ id: input.data[0] });
				return result.ok ? success(`removed ${result.value.id}`) : failure(result.error);
			}
			default:
				return usage();
		}
	}
}
