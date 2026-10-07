import type { Expr, Stmt } from "./frontend/ast";

// EN: A run-time value of the mini language. Numbers, strings, booleans and `nil` map straight to
//     JavaScript values; a function is an object that also remembers where it was created.
// PT: Um valor em tempo de execução da mini linguagem. Números, strings, booleanos e `nil` mapeiam
//     direto para valores do JavaScript; uma função é um objeto que também lembra onde foi criada.
export type Value = number | string | boolean | null | MiniFunction;

// EN: A closure: the code of the function (its declaration in the tree) together with the
//     environment that was current when the `fn` statement ran. Carrying that environment is the
//     whole trick: when the function is called later, even after the block that created it has
//     ended, its free variables are still found there.
// PT: Uma closure: o código da função (sua declaração na árvore) junto com o ambiente que estava
//     ativo quando o comando `fn` foi executado. Carregar esse ambiente é o truque todo: quando a
//     função é chamada depois, mesmo após o bloco que a criou ter terminado, suas variáveis
//     livres ainda são encontradas ali.
export class MiniFunction {
	constructor(
		readonly declaration: Extract<Stmt, { kind: "Fn" }>,
		readonly closure: Environment,
	) {}
}

export class RuntimeError extends Error {
	constructor(
		message: string,
		readonly line: number,
		readonly column: number,
	) {
		super(message);
	}

	format(): string {
		return `[line ${this.line}, column ${this.column}] runtime error: ${this.message}`;
	}
}

// EN: An environment maps names to values for ONE scope and points to the scope around it. A
//     lookup walks that chain outwards and stops at the first match, which is exactly the rule
//     "the innermost declaration wins" (shadowing). The chain follows where the code was
//     WRITTEN, not who called it: that is static (lexical) scope.
// PT: Um ambiente mapeia nomes para valores de UM escopo e aponta para o escopo ao redor. Uma
//     busca percorre essa cadeia para fora e para no primeiro nome encontrado, que é exatamente
//     a regra "a declaração mais interna vence" (sombreamento). A cadeia segue onde o código foi
//     ESCRITO, não quem o chamou: isso é escopo estático (léxico).
export class Environment {
	private readonly values = new Map<string, Value>();

	constructor(readonly enclosing?: Environment) {}

	define(name: string, value: Value): void {
		this.values.set(name, value);
	}

	/** The scope that holds `name`, searching from this one outwards. */
	private find(name: string): Map<string, Value> | undefined {
		for (let scope: Environment | undefined = this; scope !== undefined; scope = scope.enclosing) {
			if (scope.values.has(name)) {
				return scope.values;
			}
		}
		return undefined;
	}

	get(name: string): Value | undefined {
		return this.find(name)?.get(name);
	}

	/** Changes an existing variable. Returns false when no scope declares it. */
	assign(name: string, value: Value): boolean {
		const scope = this.find(name);
		scope?.set(name, value);
		return scope !== undefined;
	}
}

// EN: Each call of a mini function uses several JavaScript stack frames, so unbounded recursion
//     would crash the host. The interpreter counts the depth and reports its own error instead.
// PT: Cada chamada de função da mini linguagem usa vários quadros de pilha do JavaScript, então
//     uma recursão sem limite derrubaria o hospedeiro. O interpretador conta a profundidade e
//     reporta o seu próprio erro.
export const MAX_CALL_DEPTH = 200;

export function formatValue(value: Value): string {
	if (value === null) {
		return "nil";
	}
	if (value instanceof MiniFunction) {
		return `<fn ${value.declaration.name}>`;
	}
	return String(value);
}

// EN: Only `false` and `nil` are false. Everything else, including 0 and "", is true.
// PT: Apenas `false` e `nil` são falsos. Todo o resto, inclusive 0 e "", é verdadeiro.
const isTruthy = (value: Value): boolean => value !== false && value !== null;

// EN: How a statement finished: normally (`undefined`), or with a `return` that must unwind every
//     enclosing block and loop up to the function call. Passing this small object back through
//     the recursion is the tree-walking way of doing a jump.
// PT: Como um comando terminou: normalmente (`undefined`), ou com um `return` que precisa
//     desfazer todos os blocos e laços ao redor até a chamada da função. Devolver este pequeno
//     objeto pela recursão é o jeito de um interpretador de árvore fazer um salto.
type Completion = { returned: Value } | undefined;

// EN: A tree-walking interpreter has no separate "program" to run: the tree IS the program. To
//     execute a node it executes the children it needs and combines their results, so the
//     structure of the interpreter mirrors the structure of the grammar, one case per node kind.
// PT: Um interpretador de árvore não tem um "programa" separado para rodar: a árvore É o
//     programa. Para executar um nó ele executa os filhos necessários e combina os resultados,
//     então a estrutura do interpretador espelha a da gramática, um caso por tipo de nó.
export class Interpreter {
	readonly globals = new Environment();
	private depth = 0;

	constructor(private readonly print: (line: string) => void) {}

	/** Runs statements in the global scope. State stays for the next call (the REPL uses this). */
	run(program: Stmt[]): void {
		this.depth = 0;
		this.executeAll(program, this.globals);
	}

	/** Evaluates one expression in the global scope. */
	evaluateGlobal(expression: Expr): Value {
		this.depth = 0;
		return this.evaluate(expression, this.globals);
	}

	private executeAll(statements: Stmt[], env: Environment): Completion {
		for (const statement of statements) {
			const completion = this.execute(statement, env);
			if (completion !== undefined) {
				return completion;
			}
		}
		return undefined;
	}

	private execute(statement: Stmt, env: Environment): Completion {
		switch (statement.kind) {
			case "Let":
				env.define(statement.name, this.evaluate(statement.initializer, env));
				return undefined;
			case "Fn":
				// `env` is captured here, at definition time. This line is what makes closures.
				env.define(statement.name, new MiniFunction(statement, env));
				return undefined;
			case "Print":
				this.print(formatValue(this.evaluate(statement.value, env)));
				return undefined;
			case "Expression":
				this.evaluate(statement.expression, env);
				return undefined;
			case "Block":
				// EN: A block gets a fresh scope whose parent is the current one. When the block
				//     ends the new scope is simply dropped, and its variables with it.
				// PT: Um bloco ganha um escopo novo cujo pai é o atual. Quando o bloco termina o
				//     escopo novo é simplesmente descartado, e suas variáveis junto.
				return this.executeAll(statement.body, new Environment(env));
			case "If":
				if (isTruthy(this.evaluate(statement.condition, env))) {
					return this.executeAll(statement.thenBranch, new Environment(env));
				}
				if (statement.elseBranch !== undefined) {
					return this.executeAll(statement.elseBranch, new Environment(env));
				}
				return undefined;
			case "While":
				while (isTruthy(this.evaluate(statement.condition, env))) {
					const completion = this.executeAll(statement.body, new Environment(env));
					if (completion !== undefined) {
						return completion;
					}
				}
				return undefined;
			case "Return":
				return { returned: statement.value === undefined ? null : this.evaluate(statement.value, env) };
		}
	}

	private evaluate(expression: Expr, env: Environment): Value {
		switch (expression.kind) {
			case "Number":
			case "String":
			case "Bool":
				return expression.value;
			case "Nil":
				return null;
			case "Variable": {
				const value = env.get(expression.name);
				if (value === undefined) {
					throw new RuntimeError(
						`undefined variable '${expression.name}'`,
						expression.line,
						expression.column,
					);
				}
				return value;
			}
			case "Assign": {
				const value = this.evaluate(expression.value, env);
				if (!env.assign(expression.name, value)) {
					throw new RuntimeError(
						`undefined variable '${expression.name}'`,
						expression.line,
						expression.column,
					);
				}
				return value;
			}
			case "Logical": {
				// EN: Short circuit: the right side runs only when the left side did not decide.
				//     The result is the deciding operand itself, not a boolean made from it.
				// PT: Curto-circuito: o lado direito só roda quando o esquerdo não decidiu. O
				//     resultado é o próprio operando que decidiu, não um booleano feito dele.
				const left = this.evaluate(expression.left, env);
				const decided = expression.operator === "or" ? isTruthy(left) : !isTruthy(left);
				return decided ? left : this.evaluate(expression.right, env);
			}
			case "Unary": {
				const operand = this.evaluate(expression.operand, env);
				if (expression.operator === "!") {
					return !isTruthy(operand);
				}
				if (typeof operand !== "number") {
					throw new RuntimeError("operand of '-' must be a number", expression.line, expression.column);
				}
				return -operand;
			}
			case "Binary":
				return this.binary(expression, env);
			case "Call":
				return this.call(expression, env);
		}
	}

	private binary(expression: Extract<Expr, { kind: "Binary" }>, env: Environment): Value {
		// Post-order: both operands first (left, then right), the operator last.
		const left = this.evaluate(expression.left, env);
		const right = this.evaluate(expression.right, env);
		const { operator, line, column } = expression;

		if (operator === "==") {
			return left === right;
		}
		if (operator === "!=") {
			return left !== right;
		}
		if (operator === "+" && typeof left === "string" && typeof right === "string") {
			return left + right;
		}
		if (typeof left !== "number" || typeof right !== "number") {
			const expected = operator === "+" ? "two numbers or two strings" : "numbers";
			throw new RuntimeError(`operands of '${operator}' must be ${expected}`, line, column);
		}
		switch (operator) {
			case "+":
				return left + right;
			case "-":
				return left - right;
			case "*":
				return left * right;
			case "/":
			case "%":
				// EN: JavaScript would answer Infinity or NaN. The language treats it as an error.
				// PT: O JavaScript responderia Infinity ou NaN. A linguagem trata como erro.
				if (right === 0) {
					throw new RuntimeError("division by zero", line, column);
				}
				return operator === "/" ? left / right : left % right;
			case "<":
				return left < right;
			case "<=":
				return left <= right;
			case ">":
				return left > right;
			case ">=":
				return left >= right;
			default:
				throw new RuntimeError(`unknown operator '${operator}'`, line, column);
		}
	}

	// EN: A call creates the activation of the function: a new environment holding the parameters
	//     bound to the arguments. Its parent is the environment the function CAPTURED, not the
	//     environment of the caller. With the caller's environment as parent the language would
	//     have dynamic scope, and closures would not work.
	// PT: Uma chamada cria a ativação da função: um ambiente novo com os parâmetros ligados aos
	//     argumentos. Seu pai é o ambiente que a função CAPTUROU, não o ambiente de quem chamou.
	//     Com o ambiente do chamador como pai a linguagem teria escopo dinâmico, e closures não
	//     funcionariam.
	private call(expression: Extract<Expr, { kind: "Call" }>, env: Environment): Value {
		const { line, column } = expression;
		const callee = this.evaluate(expression.callee, env);
		const args = expression.args.map((argument) => this.evaluate(argument, env));
		if (!(callee instanceof MiniFunction)) {
			throw new RuntimeError("can only call functions", line, column);
		}
		const { params, body } = callee.declaration;
		if (args.length !== params.length) {
			throw new RuntimeError(`expected ${params.length} arguments but got ${args.length}`, line, column);
		}
		if (this.depth >= MAX_CALL_DEPTH) {
			throw new RuntimeError("stack overflow", line, column);
		}
		const activation = new Environment(callee.closure);
		params.forEach((name, index) => {
			activation.define(name, args[index] as Value);
		});
		this.depth += 1;
		try {
			return this.executeAll(body, activation)?.returned ?? null;
		} finally {
			this.depth -= 1;
		}
	}
}
