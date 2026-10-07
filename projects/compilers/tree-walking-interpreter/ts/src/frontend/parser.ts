import type { Expr, Stmt } from "./ast";
import { tokenize } from "./lexer";
import type { SyntaxProblem, Token, TokenType } from "./token";

export interface ParseResult {
	tokens: Token[];
	program: Stmt[];
	errors: SyntaxProblem[];
}

// EN: Thrown to leave the statement being parsed as soon as it is known to be wrong. It is caught
//     in `declaration`, which records nothing new (the error was recorded when it was created)
//     and resynchronises. It never leaves this module.
// PT: Lançada para abandonar o comando em análise assim que se sabe que ele está errado. É
//     capturada em `declaration`, que não registra nada novo (o erro foi registrado na criação)
//     e ressincroniza. Ela nunca sai deste módulo.
class ParseAbort extends Error {}

// EN: Binding power of each infix operator: the higher the number, the tighter the operator holds
//     its operands. `*` (7) binds tighter than `+` (6), so `1 + 2 * 3` groups as `1 + (2 * 3)`.
//     This table is the whole precedence definition of the language.
// PT: Força de ligação de cada operador infixo: quanto maior o número, mais forte o operador
//     segura seus operandos. `*` (7) liga mais forte que `+` (6), então `1 + 2 * 3` agrupa como
//     `1 + (2 * 3)`. Esta tabela é toda a definição de precedência da linguagem.
const BINDING_POWER: Partial<Record<TokenType, number>> = {
	EQUAL: 1,
	OR: 2,
	AND: 3,
	EQUAL_EQUAL: 4,
	BANG_EQUAL: 4,
	LESS: 5,
	LESS_EQUAL: 5,
	GREATER: 5,
	GREATER_EQUAL: 5,
	PLUS: 6,
	MINUS: 6,
	STAR: 7,
	SLASH: 7,
	PERCENT: 7,
	LEFT_PAREN: 9,
};
const UNARY_POWER = 8;

// EN: Tokens that can only start a statement. After an error the parser skips input until one of
//     them (or until just after a `;`), because that is a place where it knows where it is again.
// PT: Tokens que só podem começar um comando. Depois de um erro o parser pula a entrada até um
//     deles (ou até logo depois de um `;`), porque ali ele volta a saber onde está.
const STATEMENT_START: ReadonlySet<TokenType> = new Set(["LET", "FN", "IF", "WHILE", "RETURN", "PRINT"]);

class Parser {
	private current = 0;
	readonly errors: SyntaxProblem[] = [];

	constructor(private readonly tokens: Token[]) {}

	// --- token helpers ---

	private peek(): Token {
		// The lexer always ends the list with EOF, and `advance` never moves past it.
		return this.tokens[this.current] as Token;
	}

	private check(type: TokenType): boolean {
		return this.peek().type === type;
	}

	private advance(): Token {
		const token = this.peek();
		if (token.type !== "EOF") {
			this.current += 1;
		}
		return token;
	}

	private match(type: TokenType): boolean {
		if (this.check(type)) {
			this.advance();
			return true;
		}
		return false;
	}

	private fail(token: Token, message: string): ParseAbort {
		const found = token.type === "EOF" ? "end of input" : `'${token.text}'`;
		this.errors.push({ message: `${message}, found ${found}`, line: token.line, column: token.column });
		return new ParseAbort();
	}

	private expect(type: TokenType, what: string): Token {
		if (this.check(type)) {
			return this.advance();
		}
		throw this.fail(this.peek(), `expected ${what}`);
	}

	// EN: Panic-mode recovery. One mistake usually confuses the parser about everything that
	//     follows, which would produce a cascade of false errors. So the tokens up to the next
	//     statement boundary are thrown away and parsing restarts from there: each real mistake
	//     gives one message, and a file with two mistakes reports both in a single run.
	// PT: Recuperação em modo pânico. Um erro costuma confundir o parser sobre tudo o que vem
	//     depois, o que produziria uma cascata de erros falsos. Por isso os tokens até a próxima
	//     fronteira de comando são descartados e a análise recomeça dali: cada erro real gera
	//     uma mensagem, e um arquivo com dois erros reporta os dois em uma única execução.
	private synchronise(): void {
		// The offending token may itself have been the `;` that ends the broken statement.
		if (this.current > 0 && this.tokens[this.current - 1]?.type === "SEMICOLON") {
			return;
		}
		while (!this.check("EOF")) {
			if (STATEMENT_START.has(this.peek().type) || this.check("RIGHT_BRACE")) {
				return;
			}
			if (this.advance().type === "SEMICOLON") {
				return;
			}
		}
	}

	// --- statements: recursive descent, one method per grammar rule ---

	parseProgram(): Stmt[] {
		const program: Stmt[] = [];
		while (!this.check("EOF")) {
			const statement = this.declaration();
			if (statement !== undefined) {
				program.push(statement);
			} else if (this.check("RIGHT_BRACE")) {
				// EN: A `}` that closes nothing would stop `synchronise` forever: step over it.
				// PT: Um `}` que não fecha nada pararia o `synchronise` para sempre: passe por ele.
				this.advance();
			}
		}
		return program;
	}

	private declaration(): Stmt | undefined {
		try {
			if (this.check("LET")) {
				return this.letDeclaration();
			}
			if (this.check("FN")) {
				return this.fnDeclaration();
			}
			return this.statement();
		} catch (error) {
			if (error instanceof ParseAbort) {
				this.synchronise();
				return undefined;
			}
			throw error;
		}
	}

	private letDeclaration(): Stmt {
		this.advance();
		const name = this.expect("IDENTIFIER", "a variable name after 'let'");
		this.expect("EQUAL", "'=' after the variable name");
		const initializer = this.expression();
		this.expect("SEMICOLON", "';' after the value");
		return { kind: "Let", name: name.text, initializer, line: name.line, column: name.column };
	}

	private fnDeclaration(): Stmt {
		this.advance();
		const name = this.expect("IDENTIFIER", "a function name after 'fn'");
		this.expect("LEFT_PAREN", "'(' after the function name");
		const params: string[] = [];
		if (!this.check("RIGHT_PAREN")) {
			do {
				params.push(this.expect("IDENTIFIER", "a parameter name").text);
			} while (this.match("COMMA"));
		}
		this.expect("RIGHT_PAREN", "')' after the parameters");
		const body = this.block();
		return { kind: "Fn", name: name.text, params, body, line: name.line, column: name.column };
	}

	private statement(): Stmt {
		const token = this.peek();
		const at = { line: token.line, column: token.column };
		switch (token.type) {
			case "IF":
				return this.ifStatement();
			case "WHILE": {
				this.advance();
				const condition = this.expression();
				return { kind: "While", condition, body: this.block(), ...at };
			}
			case "RETURN": {
				this.advance();
				const value = this.check("SEMICOLON") ? undefined : this.expression();
				this.expect("SEMICOLON", "';' after the return value");
				return { kind: "Return", value, ...at };
			}
			case "PRINT": {
				this.advance();
				const value = this.expression();
				this.expect("SEMICOLON", "';' after the value");
				return { kind: "Print", value, ...at };
			}
			case "LEFT_BRACE":
				return { kind: "Block", body: this.block(), ...at };
			default: {
				const expression = this.expression();
				this.expect("SEMICOLON", "';' after the expression");
				return { kind: "Expression", expression, ...at };
			}
		}
	}

	// EN: `else` always belongs to the nearest `if`, and both branches must be blocks in braces.
	//     Requiring the braces removes the classic "dangling else" ambiguity from the grammar.
	// PT: O `else` sempre pertence ao `if` mais próximo, e os dois ramos precisam ser blocos entre
	//     chaves. Exigir as chaves elimina da gramática a ambiguidade clássica do "else pendente".
	private ifStatement(): Stmt {
		const keyword = this.advance();
		const condition = this.expression();
		const thenBranch = this.block();
		let elseBranch: Stmt[] | undefined;
		if (this.match("ELSE")) {
			elseBranch = this.check("IF") ? [this.ifStatement()] : this.block();
		}
		return { kind: "If", condition, thenBranch, elseBranch, line: keyword.line, column: keyword.column };
	}

	private block(): Stmt[] {
		this.expect("LEFT_BRACE", "'{'");
		const body: Stmt[] = [];
		while (!this.check("RIGHT_BRACE") && !this.check("EOF")) {
			const statement = this.declaration();
			if (statement !== undefined) {
				body.push(statement);
			}
		}
		this.expect("RIGHT_BRACE", "'}' to close the block");
		return body;
	}

	// --- expressions: Pratt parsing ---

	// EN: Pratt parsing (precedence climbing). Read one operand, then keep absorbing infix
	//     operators while they bind tighter than `minPower`, the power of the operator waiting
	//     on the left. To read the right operand the function calls itself with the power of the
	//     operator just read:
	//       left-associative  (`-`): pass the same power, so an equal operator does NOT continue
	//                                on the right and `8 - 3 - 2` becomes `(8 - 3) - 2`;
	//       right-associative (`=`): pass power - 1, so an equal operator DOES continue on the
	//                                right and `a = b = 1` becomes `a = (b = 1)`.
	//     One loop and one table replace one grammar rule and one function per precedence level.
	// PT: Análise de Pratt (escalada de precedência). Leia um operando e continue absorvendo
	//     operadores infixos enquanto eles ligarem mais forte que `minPower`, a força do operador
	//     que espera à esquerda. Para ler o operando direito a função chama a si mesma com a força
	//     do operador recém-lido:
	//       associativo à esquerda (`-`): passa a mesma força, então um operador igual NÃO
	//                                     continua à direita e `8 - 3 - 2` vira `(8 - 3) - 2`;
	//       associativo à direita (`=`):  passa força - 1, então um operador igual continua à
	//                                     direita e `a = b = 1` vira `a = (b = 1)`.
	//     Um laço e uma tabela substituem uma regra de gramática e uma função por nível de
	//     precedência.
	private expression(minPower = 0): Expr {
		let left = this.prefix();
		for (;;) {
			const operator = this.peek();
			const power = BINDING_POWER[operator.type];
			if (power === undefined || power <= minPower) {
				return left;
			}
			this.advance();
			const at = { line: operator.line, column: operator.column };
			if (operator.type === "LEFT_PAREN") {
				left = { kind: "Call", callee: left, args: this.callArguments(), ...at };
			} else if (operator.type === "EQUAL") {
				// EN: Only a name can be assigned to. `1 = 2` and `a + b = 3` are rejected here.
				// PT: Só um nome pode receber atribuição. `1 = 2` e `a + b = 3` são rejeitados aqui.
				if (left.kind !== "Variable") {
					throw this.fail(operator, "the left side of '=' must be a variable name");
				}
				left = { kind: "Assign", name: left.name, value: this.expression(power - 1), ...at };
			} else if (operator.type === "AND" || operator.type === "OR") {
				const name = operator.type === "AND" ? "and" : "or";
				left = { kind: "Logical", operator: name, left, right: this.expression(power), ...at };
			} else {
				left = { kind: "Binary", operator: operator.text, left, right: this.expression(power), ...at };
			}
		}
	}

	private callArguments(): Expr[] {
		const args: Expr[] = [];
		if (!this.check("RIGHT_PAREN")) {
			do {
				args.push(this.expression());
			} while (this.match("COMMA"));
		}
		this.expect("RIGHT_PAREN", "')' after the arguments");
		return args;
	}

	// EN: What may start an expression: a literal, a name, a parenthesised expression or a prefix
	//     operator. Parentheses leave no node behind: they only restart the precedence at zero.
	// PT: O que pode começar uma expressão: um literal, um nome, uma expressão entre parênteses
	//     ou um operador prefixo. Os parênteses não deixam nó algum: apenas reiniciam a
	//     precedência em zero.
	private prefix(): Expr {
		const token = this.advance();
		const at = { line: token.line, column: token.column };
		switch (token.type) {
			case "NUMBER":
				return { kind: "Number", value: Number(token.text), ...at };
			case "STRING":
				return { kind: "String", value: token.text.slice(1, -1), ...at };
			case "TRUE":
			case "FALSE":
				return { kind: "Bool", value: token.type === "TRUE", ...at };
			case "NIL":
				return { kind: "Nil", ...at };
			case "IDENTIFIER":
				return { kind: "Variable", name: token.text, ...at };
			case "LEFT_PAREN": {
				const inner = this.expression();
				this.expect("RIGHT_PAREN", "')' to close the parenthesis");
				return inner;
			}
			case "MINUS":
			case "BANG":
				return { kind: "Unary", operator: token.text, operand: this.expression(UNARY_POWER), ...at };
			default:
				throw this.fail(token, "expected an expression");
		}
	}
}

// EN: The whole front end in one call: text to tokens, tokens to tree. Lexical and syntax errors
//     come back together, ordered by position, and `program` holds every statement that was
//     parsed correctly.
// PT: Todo o front end em uma chamada: texto para tokens, tokens para árvore. Erros léxicos e
//     sintáticos voltam juntos, ordenados por posição, e `program` contém todo comando que foi
//     analisado corretamente.
export function parse(source: string): ParseResult {
	const lexed = tokenize(source);
	const parser = new Parser(lexed.tokens);
	const program = parser.parseProgram();
	const errors = [...lexed.errors, ...parser.errors].sort((a, b) => a.line - b.line || a.column - b.column);
	return { tokens: lexed.tokens, program, errors };
}
