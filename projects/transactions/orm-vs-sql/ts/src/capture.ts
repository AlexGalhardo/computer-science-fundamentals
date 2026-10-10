// EN: Runs a query through one approach and returns the SQL statements it really sent. The
//     result is written to a `.captured.sql` file next to the query, so the generated SQL is
//     reviewed in pull requests like any other code.
// PT: Roda uma consulta por uma abordagem e devolve os comandos SQL que ela realmente enviou. O
//     resultado é gravado em um arquivo `.captured.sql` ao lado da consulta, então o SQL gerado é
//     revisado em pull requests como qualquer outro código.
// ES: Ejecuta una consulta por un enfoque y devuelve las sentencias SQL que realmente envió. El
//     resultado se escribe en un archivo `.captured.sql` junto a la consulta, así que el SQL generado se
//     revisa en pull requests como cualquier otro código.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { APPROACHES, type Approach, type Context } from "./context";
import type { Runnable } from "./queries";

export interface Captured {
	result: unknown;
	statements: string[];
}

// EN: Prisma reports its queries through an event that is delivered asynchronously, so the
//     recorder waits one turn of the event loop before reading the list.
// PT: O Prisma informa suas consultas por um evento entregue de forma assíncrona, então o
//     gravador espera uma volta do laço de eventos antes de ler a lista.
// ES: Prisma informa sus consultas mediante un evento entregado de forma asíncrona, así que el
//     registrador espera una vuelta del bucle de eventos antes de leer la lista.
export async function capture(context: Context, query: Runnable, approach: Approach): Promise<Captured> {
	context.clearStatements();
	const result = await query.run(context, approach);
	await Bun.sleep(5);
	return { result, statements: [...context.statements[approach]] };
}

export async function captureAll(context: Context, query: Runnable): Promise<Record<Approach, Captured>> {
	const captured = {} as Record<Approach, Captured>;
	for (const approach of APPROACHES) {
		captured[approach] = await capture(context, query, approach);
	}
	return captured;
}

function tidy(statement: string): string {
	return statement
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.join("\n");
}

export function renderCaptured(query: Runnable, captured: Record<Approach, Captured>): string {
	const sections = APPROACHES.map((approach) => {
		const statements = captured[approach].statements;
		const count = `${statements.length} ${statements.length === 1 ? "statement" : "statements"}`;
		return `-- ${approach} (${count})\n${statements.map((statement) => `${tidy(statement)};`).join("\n\n")}`;
	});
	return `-- ${query.name}: ${query.description}.\n-- SQL captured from each approach by the tests. Generated file, do not edit.\n\n${sections.join("\n\n")}\n`;
}

export function capturedPath(projectDir: string, query: Runnable): string {
	return join(projectDir, "ts", "src", "queries", `${query.name}.captured.sql`);
}

export function writeCaptured(projectDir: string, query: Runnable, captured: Record<Approach, Captured>): void {
	writeFileSync(capturedPath(projectDir, query), renderCaptured(query, captured));
}
