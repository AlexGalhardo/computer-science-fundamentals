// EN: A token is the smallest unit the parser works with: a category (`type`), the exact piece of
//     source text it came from (`text`, also called the lexeme) and where it was found. The
//     position is not decoration: every error message of the later phases points back at it.
// PT: Um token é a menor unidade com que o parser trabalha: uma categoria (`type`), o trecho exato
//     do código-fonte de onde veio (`text`, também chamado de lexema) e onde foi encontrado. A
//     posição não é enfeite: toda mensagem de erro das fases seguintes aponta de volta para ela.
// ES: Un token es la unidad más pequeña con la que trabaja el parser: una categoría (`type`), el
//     fragmento exacto del código fuente de donde vino (`text`, también llamado lexema) y dónde
//     se encontró. La posición no es adorno: todo mensaje de error de las fases siguientes apunta
//     de vuelta a ella.

export const TOKEN_TYPES = [
	// punctuation
	"LEFT_PAREN",
	"RIGHT_PAREN",
	"LEFT_BRACE",
	"RIGHT_BRACE",
	"COMMA",
	"SEMICOLON",
	// operators
	"PLUS",
	"MINUS",
	"STAR",
	"SLASH",
	"PERCENT",
	"BANG",
	"BANG_EQUAL",
	"EQUAL",
	"EQUAL_EQUAL",
	"LESS",
	"LESS_EQUAL",
	"GREATER",
	"GREATER_EQUAL",
	// literals and names
	"NUMBER",
	"STRING",
	"IDENTIFIER",
	// keywords
	"LET",
	"FN",
	"IF",
	"ELSE",
	"WHILE",
	"RETURN",
	"PRINT",
	"TRUE",
	"FALSE",
	"NIL",
	"AND",
	"OR",
	// end of input
	"EOF",
] as const;

export type TokenType = (typeof TOKEN_TYPES)[number];

export interface Token {
	type: TokenType;
	/** The lexeme: the characters of the source that form this token. */
	text: string;
	/** 1-based line of the first character. */
	line: number;
	/** 1-based column of the first character. */
	column: number;
}

// EN: Keywords look exactly like identifiers, so the lexer first reads a whole word and only then
//     asks this table whether the word is reserved. That is why `iffy` is one identifier and not
//     the keyword `if` followed by `fy`.
// PT: Palavras-chave têm a mesma forma de identificadores, então o lexer primeiro lê a palavra
//     inteira e só depois pergunta a esta tabela se ela é reservada. É por isso que `iffy` é um
//     identificador, e não a palavra-chave `if` seguida de `fy`.
// ES: Las palabras clave tienen la misma forma que los identificadores, así que el lexer primero
//     lee la palabra completa y solo después pregunta a esta tabla si es reservada. Por eso
//     `iffy` es un identificador, y no la palabra clave `if` seguida de `fy`.
export const KEYWORDS: ReadonlyMap<string, TokenType> = new Map([
	["let", "LET"],
	["fn", "FN"],
	["if", "IF"],
	["else", "ELSE"],
	["while", "WHILE"],
	["return", "RETURN"],
	["print", "PRINT"],
	["true", "TRUE"],
	["false", "FALSE"],
	["nil", "NIL"],
	["and", "AND"],
	["or", "OR"],
]);

/** An error found in the source text, by the lexer or by the parser. */
export interface SyntaxProblem {
	message: string;
	line: number;
	column: number;
}

export function formatProblem(problem: SyntaxProblem): string {
	return `[line ${problem.line}, column ${problem.column}] syntax error: ${problem.message}`;
}
