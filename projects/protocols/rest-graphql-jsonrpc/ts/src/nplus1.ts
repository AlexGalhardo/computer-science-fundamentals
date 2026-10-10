// EN: The request used to show the N+1 problem: 100 books, each with its author and reviews.
//     Naive: 1 statement for the list + 100 for the authors + 100 for the reviews = 201.
//     Batched: 1 for the list + 1 for all the authors + 1 for all the reviews = 3.
// PT: A requisição usada para mostrar o problema N+1: 100 livros, cada um com autor e resenhas.
//     Ingênuo: 1 comando para a lista + 100 para os autores + 100 para as resenhas = 201.
//     Em lote: 1 para a lista + 1 para todos os autores + 1 para todas as resenhas = 3.
// ES: La petición usada para mostrar el problema N+1: 100 libros, cada uno con autor y reseñas.
//     Ingenuo: 1 comando para la lista + 100 para los autores + 100 para las reseñas = 201.
//     En lote: 1 para la lista + 1 para todos los autores + 1 para todas las reseñas = 3.

import { z } from "zod";
import { GraphqlClient } from "./clients";

export const N_PLUS_ONE_BOOKS = 100;

export const N_PLUS_ONE_QUERY =
	"query Shelf($limit: Int!) { books(limit: $limit) { id title author { name } reviews { rating } } }";

const shelfSchema = z.object({
	books: z.array(
		z.object({
			id: z.number(),
			title: z.string(),
			author: z.object({ name: z.string() }),
			reviews: z.array(z.object({ rating: z.number() })),
		}),
	),
});
export type Shelf = z.infer<typeof shelfSchema>;

export interface ShelfRun {
	data: Shelf;
	dbQueries: number;
	elapsedMs: number;
}

export async function readShelf(baseUrl: string, path: "/graphql" | "/graphql-naive"): Promise<ShelfRun> {
	const client = new GraphqlClient(baseUrl, path);
	const start = performance.now();
	const data = await client.run(shelfSchema, N_PLUS_ONE_QUERY, { limit: N_PLUS_ONE_BOOKS });
	return { data, dbQueries: client.meter.dbQueries, elapsedMs: performance.now() - start };
}
