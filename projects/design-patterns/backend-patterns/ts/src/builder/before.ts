// EN: FAILING DESIGN. A constructor with seven positional parameters. The reader has to count
//     commas to know what `30, true, false` mean, two booleans can be swapped with no compile
//     error, and nothing checks rules that involve two fields, such as "a POST has a body".
// PT: DESENHO COM DEFEITO. Um construtor com sete parâmetros posicionais. O leitor precisa
//     contar vírgulas para saber o que `30, true, false` significam, dois booleanos podem ser
//     trocados sem erro de compilação, e nada verifica regras que envolvem dois campos, como
//     "um POST tem corpo".
// ES: DISEÑO QUE FALLA. Un constructor con siete parámetros posicionales. El lector tiene que
//     contar comas para saber qué significan `30, true, false`, dos booleanos se pueden
//     intercambiar sin error de compilación, y nada verifica reglas que involucran dos campos,
//     como "un POST tiene cuerpo".
export class HttpRequest {
	constructor(
		readonly method: string,
		readonly url: string,
		readonly body: string | undefined = undefined,
		readonly headers: string[] = [],
		readonly timeoutSeconds = 30,
		readonly retry = false,
		readonly followRedirects = true,
	) {}
}
