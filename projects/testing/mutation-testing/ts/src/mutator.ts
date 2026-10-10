// EN: A mutant is a copy of the program with ONE small change, the kind of slip a programmer
//     makes: `<` for `<=`, `+` for `-`, 30 for 31. If the tests still pass on the mutant, they
//     would also pass on that real bug. This file produces the mutants. It needs no parser: a
//     list of tokens is enough to find operators and numbers and to leave comments and strings
//     alone.
// PT: Um mutante é uma cópia do programa com UMA mudança pequena, do tipo de deslize que um
//     programador comete: `<` por `<=`, `+` por `-`, 30 por 31. Se os testes continuam passando
//     no mutante, também passariam nesse bug de verdade. Este arquivo produz os mutantes. Ele
//     não precisa de parser: uma lista de tokens basta para achar operadores e números e para
//     deixar comentários e strings em paz.
// ES: Un mutante es una copia del programa con UN cambio pequeño, del tipo de descuido que comete un
//     programador: `<` por `<=`, `+` por `-`, 30 por 31. Si las pruebas siguen pasando en el
//     mutante, también pasarían con ese bug de verdad. Este archivo produce los mutantes. No
//     necesita parser: una lista de tokens basta para encontrar operadores y números y para
//     dejar en paz los comentarios y las strings.
export interface Mutant {
	id: number;
	line: number;
	original: string;
	replacement: string;
	kind: "operator" | "constant";
	source: string;
}

interface Token {
	text: string;
	index: number;
}

// EN: The order of the alternatives matters: longer tokens come first, so `>=` is read as one
//     token and not as `>` followed by `=`. Comments, strings, identifiers and compound
//     operators such as `=>`, `++` and `+=` are recognised only to be skipped.
//     Known limits of this tiny tokenizer: it does not tell a generic `<T>` from a comparison,
//     a regular expression from a division, or a unary minus from a subtraction. The module
//     under test avoids those forms. A real tool works on the syntax tree instead.
// PT: A ordem das alternativas importa: os tokens mais longos vêm antes, então `>=` é lido como
//     um token e não como `>` seguido de `=`. Comentários, strings, identificadores e operadores
//     compostos como `=>`, `++` e `+=` são reconhecidos só para serem pulados.
//     Limites conhecidos deste tokenizador minúsculo: ele não distingue um genérico `<T>` de uma
//     comparação, uma expressão regular de uma divisão, nem um menos unário de uma subtração.
//     O módulo sob teste evita essas formas. Uma ferramenta de verdade trabalha na árvore sintática.
// ES: El orden de las alternativas importa: los tokens más largos van primero, así `>=` se lee como
//     un token y no como `>` seguido de `=`. Los comentarios, strings, identificadores y operadores
//     compuestos como `=>`, `++` y `+=` se reconocen solo para saltárselos.
//     Límites conocidos de este tokenizador minúsculo: no distingue un genérico `<T>` de una
//     comparación, una expresión regular de una división, ni un menos unario de una resta.
//     El módulo bajo prueba evita esas formas. Una herramienta de verdad trabaja sobre el árbol sintáctico.
const TOKEN =
	/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`|=>|\+\+|--|[+\-*/]=|===|!==|==|!=|<=|>=|&&|\|\||[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[<>+\-*/!]|\s+|./g;

// EN: Each operator is replaced by its nearest neighbour. Relational operators move the
//     boundary by one (`<` becomes `<=`), which is exactly the off-by-one mistake.
// PT: Cada operador é trocado pelo vizinho mais próximo. Os operadores relacionais deslocam o
//     limite em um (`<` vira `<=`), que é exatamente o erro de "um a mais ou um a menos".
// ES: Cada operador se cambia por su vecino más cercano. Los operadores relacionales desplazan el
//     límite en uno (`<` se vuelve `<=`), que es exactamente el error de "uno de más o uno de menos".
const OPERATOR_SWAPS: Readonly<Record<string, string>> = {
	"+": "-",
	"-": "+",
	"*": "/",
	"/": "*",
	"<": "<=",
	"<=": "<",
	">": ">=",
	">=": ">",
	"===": "!==",
	"!==": "===",
	"&&": "||",
	"||": "&&",
	"!": "",
	true: "false",
	false: "true",
};

const NUMBER = /^\d+(?:\.\d+)?$/;

export function tokenize(source: string): Token[] {
	return [...source.matchAll(TOKEN)].map((match) => ({ text: match[0], index: match.index }));
}

function replacementFor(token: string): { replacement: string; kind: Mutant["kind"] } | undefined {
	const swapped = OPERATOR_SWAPS[token];
	if (swapped !== undefined) {
		return { replacement: swapped, kind: "operator" };
	}
	// EN: A constant becomes its successor: enough to move a threshold or change a price.
	// PT: Uma constante vira a sua sucessora: o bastante para deslocar um limite ou mudar um preço.
	// ES: Una constante se vuelve su sucesora: lo bastante para desplazar un límite o cambiar un precio.
	if (NUMBER.test(token)) {
		return { replacement: String(Number(token) + 1), kind: "constant" };
	}
	return undefined;
}

export function generateMutants(source: string): Mutant[] {
	const mutants: Mutant[] = [];
	for (const token of tokenize(source)) {
		const change = replacementFor(token.text);
		if (change === undefined) {
			continue;
		}
		mutants.push({
			id: mutants.length + 1,
			line: source.slice(0, token.index).split("\n").length,
			original: token.text,
			replacement: change.replacement,
			kind: change.kind,
			source: source.slice(0, token.index) + change.replacement + source.slice(token.index + token.text.length),
		});
	}
	return mutants;
}
