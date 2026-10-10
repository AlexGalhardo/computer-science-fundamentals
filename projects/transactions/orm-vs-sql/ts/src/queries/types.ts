// EN: The shape every query of the lab follows: one name, one set of sample arguments, and the
//     same question answered three times. Because the three implementations share one return
//     type, the tests can demand that they return exactly the same rows.
// PT: O formato que toda consulta do laboratório segue: um nome, um conjunto de argumentos de
//     exemplo, e a mesma pergunta respondida três vezes. Como as três implementações têm o mesmo
//     tipo de retorno, os testes podem exigir que devolvam exatamente as mesmas linhas.
// ES: La forma que sigue toda consulta del laboratorio: un nombre, un conjunto de argumentos de
//     ejemplo, y la misma pregunta respondida tres veces. Como las tres implementaciones tienen el mismo
//     tipo de retorno, las pruebas pueden exigir que devuelvan exactamente las mismas filas.

import type { Approach, Context } from "../context";

export type Implementation<Args extends unknown[], Result> = (context: Context, ...args: Args) => Promise<Result>;

export interface QueryDefinition<Args extends unknown[], Result>
	extends Record<Approach, Implementation<Args, Result>> {
	/** File name of the query, also used for the captured `.sql` file next to it. */
	name: string;
	description: string;
	/** Arguments used by the tests, the SQL capture and the benchmark. */
	sample: Args;
	/** False for queries that write, which the latency benchmark skips. */
	readOnly: boolean;
}
