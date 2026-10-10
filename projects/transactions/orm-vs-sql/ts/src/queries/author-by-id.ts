// EN: Query 1, lookup by primary key. The simplest possible query: any time difference between
//     the approaches here is pure overhead of the tool, because the database work is the same.
// PT: Consulta 1, busca pela chave primária. A consulta mais simples possível: qualquer diferença
//     de tempo entre as abordagens aqui é puro custo da ferramenta, porque o trabalho do banco é
//     o mesmo.
// ES: Consulta 1, búsqueda por clave primaria. La consulta más simple posible: cualquier diferencia
//     de tiempo entre los enfoques aquí es puro costo de la herramienta, porque el trabajo de la base
//     de datos es el mismo.

import { eq } from "drizzle-orm";
import { authors } from "../drizzle-schema";
import type { QueryDefinition } from "./types";

export interface AuthorRow {
	id: number;
	name: string;
	country: string;
}

export const authorById: QueryDefinition<[id: number], AuthorRow | null> = {
	name: "author-by-id",
	description: "One author by primary key",
	sample: [42],
	readOnly: true,

	raw: async (context, id) => {
		const rows = await context.raw.query<{ id: number; name: string; country: string }>(
			"SELECT id, name, country FROM authors WHERE id = $1",
			[id],
		);
		return rows[0] ?? null;
	},

	prisma: (context, id) =>
		context.prisma.author.findUnique({ where: { id }, select: { id: true, name: true, country: true } }),

	drizzle: async (context, id) => {
		const rows = await context.drizzle
			.select({ id: authors.id, name: authors.name, country: authors.country })
			.from(authors)
			.where(eq(authors.id, id));
		return rows[0] ?? null;
	},
};
