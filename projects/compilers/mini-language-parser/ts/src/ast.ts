// EN: The abstract syntax tree (AST). Unlike a parse tree, it keeps only what matters for
//     meaning: parentheses, semicolons and braces are gone, because the shape of the tree already
//     says what they said. Every node keeps the line and column of the token that best identifies
//     it (the operator of a binary expression, the name of a variable, the `(` of a call), so
//     later phases can report errors in the right place.
// PT: A árvore sintática abstrata (AST). Diferente de uma árvore de derivação, ela guarda apenas
//     o que importa para o significado: parênteses, ponto e vírgula e chaves desaparecem, porque
//     a forma da árvore já diz o que eles diziam. Todo nó guarda a linha e a coluna do token que
//     melhor o identifica (o operador de uma expressão binária, o nome de uma variável, o `(` de
//     uma chamada), para que as fases seguintes reportem erros no lugar certo.
// ES: El árbol de sintaxis abstracta (AST). A diferencia de un árbol de derivación, guarda solo
//     lo que importa para el significado: paréntesis, punto y coma y llaves desaparecen, porque la
//     forma del árbol ya dice lo que ellos decían. Cada nodo guarda la línea y la columna del
//     token que mejor lo identifica (el operador de una expresión binaria, el nombre de una
//     variable, el `(` de una llamada), para que las fases siguientes reporten los errores en el
//     lugar correcto.

interface Positioned {
	line: number;
	column: number;
}

export type Expr =
	| (Positioned & { kind: "Number"; value: number })
	| (Positioned & { kind: "String"; value: string })
	| (Positioned & { kind: "Bool"; value: boolean })
	| (Positioned & { kind: "Nil" })
	| (Positioned & { kind: "Variable"; name: string })
	| (Positioned & { kind: "Assign"; name: string; value: Expr })
	| (Positioned & { kind: "Unary"; operator: string; operand: Expr })
	| (Positioned & { kind: "Binary"; operator: string; left: Expr; right: Expr })
	| (Positioned & { kind: "Logical"; operator: "and" | "or"; left: Expr; right: Expr })
	| (Positioned & { kind: "Call"; callee: Expr; args: Expr[] });

export type Stmt =
	| (Positioned & { kind: "Let"; name: string; initializer: Expr })
	| (Positioned & { kind: "Fn"; name: string; params: string[]; body: Stmt[] })
	| (Positioned & { kind: "If"; condition: Expr; thenBranch: Stmt[]; elseBranch?: Stmt[] })
	| (Positioned & { kind: "While"; condition: Expr; body: Stmt[] })
	| (Positioned & { kind: "Return"; value?: Expr })
	| (Positioned & { kind: "Print"; value: Expr })
	| (Positioned & { kind: "Block"; body: Stmt[] })
	| (Positioned & { kind: "Expression"; expression: Expr });

type Node = Expr | Stmt;

// EN: The label of a node and its children, in one place, so both printers below agree.
// PT: O rótulo de um nó e seus filhos, em um único lugar, para que os dois impressores abaixo
//     concordem.
// ES: La etiqueta de un nodo y sus hijos, en un solo lugar, para que los dos impresores de abajo
//     coincidan.
function describe(node: Node): { label: string; children: Node[] } {
	switch (node.kind) {
		case "Number":
			return { label: String(node.value), children: [] };
		case "String":
			return { label: JSON.stringify(node.value), children: [] };
		case "Bool":
			return { label: String(node.value), children: [] };
		case "Nil":
			return { label: "nil", children: [] };
		case "Variable":
			return { label: node.name, children: [] };
		case "Assign":
			return { label: `= ${node.name}`, children: [node.value] };
		case "Unary":
			return { label: node.operator, children: [node.operand] };
		case "Binary":
		case "Logical":
			return { label: node.operator, children: [node.left, node.right] };
		case "Call":
			return { label: "call", children: [node.callee, ...node.args] };
		case "Let":
			return { label: `let ${node.name}`, children: [node.initializer] };
		case "Fn":
			return { label: `fn ${node.name}(${node.params.join(", ")})`, children: node.body };
		case "If": {
			const thenBlock: Stmt = { kind: "Block", body: node.thenBranch, line: node.line, column: node.column };
			const children: Node[] = [node.condition, thenBlock];
			if (node.elseBranch !== undefined) {
				children.push({ kind: "Block", body: node.elseBranch, line: node.line, column: node.column });
			}
			return { label: "if", children };
		}
		case "While":
			return {
				label: "while",
				children: [node.condition, { kind: "Block", body: node.body, line: node.line, column: node.column }],
			};
		case "Return":
			return { label: "return", children: node.value === undefined ? [] : [node.value] };
		case "Print":
			return { label: "print", children: [node.value] };
		case "Block":
			return { label: "block", children: node.body };
		case "Expression":
			return { label: "expr", children: [node.expression] };
	}
}

// EN: One-line form in prefix notation, `(+ 1 (* 2 3))`. Precedence is visible as nesting, which
//     makes it the handiest form for tests: two programs have the same tree exactly when they
//     print the same text.
// PT: Forma de uma linha em notação prefixa, `(+ 1 (* 2 3))`. A precedência aparece como
//     aninhamento, o que faz dela a forma mais prática para testes: dois programas têm a mesma
//     árvore exatamente quando imprimem o mesmo texto.
// ES: Forma de una línea en notación prefija, `(+ 1 (* 2 3))`. La precedencia aparece como
//     anidamiento, lo que la hace la forma más práctica para las pruebas: dos programas tienen el
//     mismo árbol exactamente cuando imprimen el mismo texto.
export function toSExpression(node: Node): string {
	const { label, children } = describe(node);
	if (children.length === 0 && node.kind !== "Block" && node.kind !== "Return" && node.kind !== "Fn") {
		return label;
	}
	return `(${[label, ...children.map(toSExpression)].join(" ")})`;
}

// EN: The same tree drawn with branches, one node per line, for people.
// PT: A mesma árvore desenhada com ramos, um nó por linha, para pessoas.
// ES: El mismo árbol dibujado con ramas, un nodo por línea, para las personas.
export function printTree(nodes: Node[]): string {
	const lines: string[] = [];
	const walk = (node: Node, prefix: string, isLast: boolean): void => {
		const { label, children } = describe(node);
		lines.push(`${prefix}${isLast ? "└─ " : "├─ "}${label}`);
		children.forEach((child, index) => {
			walk(child, `${prefix}${isLast ? "   " : "│  "}`, index === children.length - 1);
		});
	};
	nodes.forEach((node, index) => {
		walk(node, "", index === nodes.length - 1);
	});
	return lines.join("\n");
}
