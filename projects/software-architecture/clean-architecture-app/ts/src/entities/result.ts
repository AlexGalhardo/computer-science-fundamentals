// EN: A `Result` is a value that is either a success or an expected failure. An empty title is
//     not an accident, it is an answer the caller must handle, so it travels as a return value
//     and the compiler forces the caller to look at it. Exceptions stay for what nobody
//     expected, such as a lost database connection.
// PT: Um `Result` é um valor que é ou um sucesso ou uma falha esperada. Um título vazio não é
//     um acidente, é uma resposta que quem chamou precisa tratar, então viaja como valor de
//     retorno e o compilador obriga quem chamou a olhar para ela. Exceções ficam para o que
//     ninguém esperava, como uma conexão perdida com o banco.
// ES: Un `Result` es un valor que es o un éxito o una falla esperada. Un título vacío no es un
//     accidente, es una respuesta que quien llamó debe manejar, así que viaja como valor de
//     retorno y el compilador obliga a quien llamó a mirarla. Las excepciones quedan para lo que
//     nadie esperaba, como una conexión perdida con la base de datos.
export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
	return { ok: false, error };
}
