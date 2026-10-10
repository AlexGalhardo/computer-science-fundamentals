// EN: The diagram is derived from the table, never drawn by hand. A hand-drawn diagram is a
//     second copy of the rules, and copies drift apart. Mermaid is plain text, so no library
//     is needed: the "drawing" is a few lines that GitHub renders as a state diagram.
// PT: O diagrama é derivado da tabela, nunca desenhado à mão. Um diagrama desenhado à mão é uma
//     segunda cópia das regras, e cópias divergem. Mermaid é texto puro, então nenhuma
//     biblioteca é necessária: o "desenho" são algumas linhas que o GitHub renderiza como
//     diagrama de estados.
// ES: El diagrama se deriva de la tabla, nunca se dibuja a mano. Un diagrama dibujado a mano es
//     una segunda copia de las reglas, y las copias divergen. Mermaid es texto plano, así que
//     no hace falta ninguna biblioteca: el "dibujo" son unas pocas líneas que GitHub renderiza
//     como un diagrama de estados.

import { join } from "node:path";
import type { MachineTable } from "./table";

export const DIAGRAM_PATH = join(import.meta.dir, "..", "..", "diagram.md");

export function renderDiagram(table: MachineTable): string {
	const withExit = new Set(table.transitions.map((transition) => transition.from));
	const target = new Map(table.transitions.map(({ from, event, to }) => [`${from}:${event}`, to]));

	const lines = [
		"<!-- Generated from machine.json. Do not edit by hand: run the diagram command of the README. -->",
		"",
		"# Order state machine",
		"",
		"```mermaid",
		"stateDiagram-v2",
		`    [*] --> ${table.initial}`,
		...table.transitions.map(({ from, event, to }) => `    ${from} --> ${to}: ${event}`),
		// EN: Terminal states get an arrow to the end marker, so they stand out in the picture.
		// PT: Estados terminais ganham uma seta para o marcador de fim, para se destacarem na figura.
		// ES: Los estados terminales reciben una flecha al marcador de fin, para destacarse en la figura.
		...table.states.filter((state) => !withExit.has(state)).map((state) => `    ${state} --> [*]`),
		"```",
		"",
		// EN: The same table again, as rows and columns: "-" marks a pair that is rejected.
		// PT: A mesma tabela de novo, em linhas e colunas: "-" marca um par que é rejeitado.
		// ES: La misma tabla otra vez, en filas y columnas: "-" marca un par que se rechaza.
		`| state | ${table.events.join(" | ")} |`,
		`| --- | ${table.events.map(() => "---").join(" | ")} |`,
		...table.states.map(
			(state) =>
				`| ${state} | ${table.events.map((event) => target.get(`${state}:${event}`) ?? "-").join(" | ")} |`,
		),
	];
	return `${lines.join("\n")}\n`;
}
