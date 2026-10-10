import { and, type Bit, not, or, xor } from "./gates";

// EN: An expression is stored as a tree. `A·B + C'` becomes an OR node whose children are an AND
//     node and a NOT node. The tree has the same shape as the circuit: each node is one gate
//     and each leaf is an input wire or a constant.
// PT: Uma expressão é guardada como uma árvore. `A·B + C'` vira um nó OR cujos filhos são um
//     nó AND e um nó NOT. A árvore tem a mesma forma do circuito: cada nó é uma porta e cada
//     folha é um fio de entrada ou uma constante.
// ES: Una expresión se guarda como un árbol. `A·B + C'` se vuelve un nodo OR cuyos hijos son un
//     nodo AND y un nodo NOT. El árbol tiene la misma forma que el circuito: cada nodo es una
//     compuerta y cada hoja es un cable de entrada o una constante.
export type Expression =
	| { kind: "variable"; name: string }
	| { kind: "constant"; value: Bit }
	| { kind: "not"; operand: Expression }
	| { kind: "and" | "or" | "xor"; left: Expression; right: Expression };

type Token = { type: "variable"; name: string } | { type: "constant"; value: Bit } | { type: "symbol"; text: string };

const AND_SYMBOLS = new Set(["·", "*", "&", "."]);
const OR_SYMBOLS = new Set(["+", "|"]);
const PREFIX_NOT_SYMBOLS = new Set(["!", "~"]);
const OTHER_SYMBOLS = new Set(["^", "'", "(", ")"]);

// EN: The lexer cuts the text into tokens. A variable is one letter followed by optional
//     digits (A, b, X1). Because a name has a single letter, `AB` reads as two variables side
//     by side, which is how a product is written on paper.
// PT: O analisador léxico corta o texto em tokens. Uma variável é uma letra seguida de dígitos
//     opcionais (A, b, X1). Como um nome tem uma única letra, `AB` é lido como duas variáveis
//     lado a lado, que é como um produto é escrito no papel.
// ES: El analizador léxico corta el texto en tokens. Una variable es una letra seguida de
//     dígitos opcionales (A, b, X1). Como un nombre tiene una sola letra, `AB` se lee como dos
//     variables una al lado de la otra, que es como se escribe un producto en el papel.
function tokenize(text: string): Token[] {
	const tokens: Token[] = [];
	let position = 0;
	while (position < text.length) {
		const char = text.charAt(position);
		if (/\s/.test(char)) {
			position += 1;
		} else if (/[A-Za-z]/.test(char)) {
			let end = position + 1;
			while (end < text.length && /[0-9]/.test(text.charAt(end))) {
				end += 1;
			}
			tokens.push({ type: "variable", name: text.slice(position, end) });
			position = end;
		} else if (char === "0" || char === "1") {
			tokens.push({ type: "constant", value: char === "1" ? 1 : 0 });
			position += 1;
		} else if (
			AND_SYMBOLS.has(char) ||
			OR_SYMBOLS.has(char) ||
			PREFIX_NOT_SYMBOLS.has(char) ||
			OTHER_SYMBOLS.has(char)
		) {
			tokens.push({ type: "symbol", text: char });
			position += 1;
		} else {
			throw new SyntaxError(`unexpected character "${char}" at position ${position}`);
		}
	}
	return tokens;
}

// EN: Recursive descent parser. Each function handles one precedence level and calls the next
//     tighter one, so the tree comes out with the usual priorities: NOT binds first, then AND,
//     then XOR, then OR. `A + B·C'` is therefore A + (B·(C')).
//       or      := xor  { ("+" | "|") xor }
//       xor     := and  { "^" and }
//       and     := unary { ["·" | "*" | "&" | "."] unary }     (the operator may be omitted)
//       unary   := ("!" | "~") unary | primary { "'" }
//       primary := variable | "0" | "1" | "(" or ")"
// PT: Analisador descendente recursivo. Cada função trata um nível de precedência e chama o
//     próximo, mais forte, de modo que a árvore sai com as prioridades usuais: NOT primeiro,
//     depois AND, depois XOR, depois OR. Assim, `A + B·C'` é A + (B·(C')).
// ES: Analizador descendente recursivo. Cada función trata un nivel de precedencia y llama a la
//     siguiente, más fuerte, de modo que el árbol sale con las prioridades usuales: primero
//     NOT, luego AND, luego XOR, luego OR. Así, `A + B·C'` es A + (B·(C')).
class Parser {
	private position = 0;

	constructor(private readonly tokens: Token[]) {}

	parse(): Expression {
		const expression = this.parseOr();
		if (this.position < this.tokens.length) {
			throw new SyntaxError(`unexpected token ${this.describe(this.tokens[this.position])}`);
		}
		return expression;
	}

	private describe(token: Token | undefined): string {
		if (token === undefined) {
			return "end of expression";
		}
		if (token.type === "variable") {
			return `"${token.name}"`;
		}
		return token.type === "constant" ? `"${token.value}"` : `"${token.text}"`;
	}

	private peekSymbol(symbols: Set<string>): boolean {
		const token = this.tokens[this.position];
		return token !== undefined && token.type === "symbol" && symbols.has(token.text);
	}

	private parseOr(): Expression {
		let left = this.parseXor();
		while (this.peekSymbol(OR_SYMBOLS)) {
			this.position += 1;
			left = { kind: "or", left, right: this.parseXor() };
		}
		return left;
	}

	private parseXor(): Expression {
		let left = this.parseAnd();
		while (this.peekSymbol(new Set(["^"]))) {
			this.position += 1;
			left = { kind: "xor", left, right: this.parseAnd() };
		}
		return left;
	}

	private startsOperand(): boolean {
		const token = this.tokens[this.position];
		if (token === undefined) {
			return false;
		}
		return token.type !== "symbol" || token.text === "(" || PREFIX_NOT_SYMBOLS.has(token.text);
	}

	private parseAnd(): Expression {
		let left = this.parseUnary();
		for (;;) {
			if (this.peekSymbol(AND_SYMBOLS)) {
				this.position += 1;
			} else if (!this.startsOperand()) {
				return left;
			}
			left = { kind: "and", left, right: this.parseUnary() };
		}
	}

	private parseUnary(): Expression {
		if (this.peekSymbol(PREFIX_NOT_SYMBOLS)) {
			this.position += 1;
			return { kind: "not", operand: this.parseUnary() };
		}
		let expression = this.parsePrimary();
		// EN: The apostrophe is a postfix NOT and may repeat: A'' is A again.
		// PT: O apóstrofo é um NOT pós-fixado e pode se repetir: A'' volta a ser A.
		// ES: El apóstrofo es un NOT posfijo y puede repetirse: A'' vuelve a ser A.
		while (this.peekSymbol(new Set(["'"]))) {
			this.position += 1;
			expression = { kind: "not", operand: expression };
		}
		return expression;
	}

	private parsePrimary(): Expression {
		const token = this.tokens[this.position];
		if (token === undefined) {
			throw new SyntaxError("unexpected end of expression");
		}
		this.position += 1;
		if (token.type === "variable") {
			return { kind: "variable", name: token.name };
		}
		if (token.type === "constant") {
			return { kind: "constant", value: token.value };
		}
		if (token.text === "(") {
			const inner = this.parseOr();
			if (!this.peekSymbol(new Set([")"]))) {
				throw new SyntaxError(`expected ")" but found ${this.describe(this.tokens[this.position])}`);
			}
			this.position += 1;
			return inner;
		}
		throw new SyntaxError(`unexpected token ${this.describe(token)}`);
	}
}

export function parse(text: string): Expression {
	return new Parser(tokenize(text)).parse();
}

/** Names of the variables of an expression, in alphabetical order and without repetition. */
export function variablesOf(expression: Expression): string[] {
	const names = new Set<string>();
	const visit = (node: Expression): void => {
		if (node.kind === "variable") {
			names.add(node.name);
		} else if (node.kind === "not") {
			visit(node.operand);
		} else if (node.kind !== "constant") {
			visit(node.left);
			visit(node.right);
		}
	};
	visit(expression);
	return [...names].sort();
}

// EN: Evaluating the tree is simulating the circuit: the value of a node is the output of its
//     gate applied to the values of its children. `inputs` gives the value on each input wire.
// PT: Avaliar a árvore é simular o circuito: o valor de um nó é a saída da sua porta aplicada
//     aos valores dos filhos. `inputs` dá o valor em cada fio de entrada.
// ES: Evaluar el árbol es simular el circuito: el valor de un nodo es la salida de su compuerta
//     aplicada a los valores de los hijos. `inputs` da el valor en cada cable de entrada.
export function evaluate(expression: Expression, inputs: ReadonlyMap<string, Bit>): Bit {
	switch (expression.kind) {
		case "constant":
			return expression.value;
		case "variable": {
			const value = inputs.get(expression.name);
			if (value === undefined) {
				throw new Error(`no value for variable "${expression.name}"`);
			}
			return value;
		}
		case "not":
			return not(evaluate(expression.operand, inputs));
		case "and":
			return and(evaluate(expression.left, inputs), evaluate(expression.right, inputs));
		case "or":
			return or(evaluate(expression.left, inputs), evaluate(expression.right, inputs));
		case "xor":
			return xor(evaluate(expression.left, inputs), evaluate(expression.right, inputs));
	}
}

export interface TruthTable {
	/** Input variables, the first one is the most significant bit of the row number. */
	variables: string[];
	/** Output of each row, from row 0 (all inputs 0) to row 2^n - 1 (all inputs 1). */
	outputs: Bit[];
}

/** Value of each variable in a given row: the row number written in binary, first variable first. */
export function rowInputs(variables: readonly string[], row: number): Bit[] {
	return variables.map((_, index) => (((row >> (variables.length - 1 - index)) & 1) === 1 ? 1 : 0));
}

// EN: The truth table lists the output for every input combination. With n variables there
//     are 2^n rows, written in binary counting order, so row k is also minterm k.
// PT: A tabela-verdade lista a saída para todas as combinações de entrada. Com n variáveis há
//     2^n linhas, escritas em ordem de contagem binária, então a linha k é também o mintermo k.
// ES: La tabla de verdad lista la salida para todas las combinaciones de entrada. Con n
//     variables hay 2^n filas, escritas en orden de conteo binario, así que la fila k es
//     también el minterm k.
export function truthTable(expression: Expression, variables: readonly string[] = variablesOf(expression)): TruthTable {
	const outputs: Bit[] = [];
	for (let row = 0; row < 2 ** variables.length; row++) {
		const values = rowInputs(variables, row);
		const inputs = new Map(variables.map((name, index): [string, Bit] => [name, values[index] ?? 0]));
		outputs.push(evaluate(expression, inputs));
	}
	return { variables: [...variables], outputs };
}

/** Row numbers where the output is 1: the minterms of the canonical sum of products. */
export function mintermsOf(table: TruthTable): number[] {
	return table.outputs.flatMap((output, row) => (output === 1 ? [row] : []));
}

export function formatTruthTable(table: TruthTable, outputName = "F"): string {
	const header = `${table.variables.join(" ")} | ${outputName}`;
	const lines = table.outputs.map((output, row) => {
		const cells = rowInputs(table.variables, row).map((value, index) =>
			String(value).padEnd(table.variables[index]?.length ?? 1),
		);
		return `${cells.join(" ")} | ${output}`;
	});
	return [header, "-".repeat(header.length), ...lines].join("\n");
}
