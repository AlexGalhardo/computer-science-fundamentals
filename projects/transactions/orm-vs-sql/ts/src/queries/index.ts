// EN: The catalogue of the lab. `runnable` hides the argument types of each query behind one
//     uniform `run(context, approach)`, so tests, capture and benchmark can loop over them.
// PT: O catálogo do laboratório. `runnable` esconde os tipos de argumento de cada consulta atrás
//     de um `run(context, approach)` uniforme, para testes, captura e benchmark percorrerem todas.
// ES: El catálogo del laboratorio. `runnable` esconde los tipos de argumento de cada consulta detrás
//     de un `run(context, approach)` uniforme, para que pruebas, captura y benchmark las recorran todas.

import type { Approach, Context } from "../context";
import { addPostWithComment } from "./add-post-with-comment";
import { authorById } from "./author-by-id";
import { nPlusOneFixed, nPlusOneNaive } from "./n-plus-one";
import { postCountByAuthor } from "./post-count-by-author";
import { postsWithAuthor } from "./posts-with-author";
import { topPosts } from "./top-posts";
import type { QueryDefinition } from "./types";

export interface Runnable {
	name: string;
	description: string;
	readOnly: boolean;
	run: (context: Context, approach: Approach) => Promise<unknown>;
}

function runnable<Args extends unknown[], Result>(query: QueryDefinition<Args, Result>): Runnable {
	return {
		name: query.name,
		description: query.description,
		readOnly: query.readOnly,
		run: (context, approach) => query[approach](context, ...query.sample),
	};
}

export const FIVE_QUERIES: Runnable[] = [
	runnable(authorById),
	runnable(topPosts),
	runnable(postsWithAuthor),
	runnable(postCountByAuthor),
	runnable(addPostWithComment),
];

export const N_PLUS_ONE = { naive: runnable(nPlusOneNaive), fixed: runnable(nPlusOneFixed) };
