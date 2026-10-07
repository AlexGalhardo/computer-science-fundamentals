import { expect, test } from "bun:test";
import { tokenize } from "../src/lexer";
import { TOKEN_TYPES, type TokenType } from "../src/token";

const types = (source: string): TokenType[] => tokenize(source).tokens.map((token) => token.type);

// EN: One sample lexeme for every token type. The first test walks the whole table and the second
//     proves the table is complete, so adding a token type without a test fails the suite.
// PT: Um lexema de exemplo para cada tipo de token. O primeiro teste percorre a tabela inteira e
//     o segundo prova que ela está completa, então criar um tipo de token sem teste quebra a suíte.
const SAMPLES: Record<Exclude<TokenType, "EOF">, string> = {
	LEFT_PAREN: "(",
	RIGHT_PAREN: ")",
	LEFT_BRACE: "{",
	RIGHT_BRACE: "}",
	COMMA: ",",
	SEMICOLON: ";",
	PLUS: "+",
	MINUS: "-",
	STAR: "*",
	SLASH: "/",
	PERCENT: "%",
	BANG: "!",
	BANG_EQUAL: "!=",
	EQUAL: "=",
	EQUAL_EQUAL: "==",
	LESS: "<",
	LESS_EQUAL: "<=",
	GREATER: ">",
	GREATER_EQUAL: ">=",
	NUMBER: "3.25",
	STRING: '"hi there"',
	IDENTIFIER: "total_2",
	LET: "let",
	FN: "fn",
	IF: "if",
	ELSE: "else",
	WHILE: "while",
	RETURN: "return",
	PRINT: "print",
	TRUE: "true",
	FALSE: "false",
	NIL: "nil",
	AND: "and",
	OR: "or",
};

test("every token type is recognised, with its exact text", () => {
	for (const [type, text] of Object.entries(SAMPLES)) {
		const { tokens, errors } = tokenize(text);
		expect(errors).toEqual([]);
		expect(tokens).toEqual([
			{ type: type as TokenType, text, line: 1, column: 1 },
			{ type: "EOF", text: "", line: 1, column: text.length + 1 },
		]);
	}
});

test("the sample table covers every token type", () => {
	expect([...Object.keys(SAMPLES), "EOF"].sort()).toEqual([...TOKEN_TYPES].sort());
});

test("tokens carry line and column", () => {
	const { tokens } = tokenize('let x = 1;\n\tprint "a" ;');
	expect(tokens.map((token) => `${token.type}@${token.line}:${token.column}`)).toEqual([
		"LET@1:1",
		"IDENTIFIER@1:5",
		"EQUAL@1:7",
		"NUMBER@1:9",
		"SEMICOLON@1:10",
		"PRINT@2:2",
		"STRING@2:8",
		"SEMICOLON@2:12",
		"EOF@2:13",
	]);
});

test("the longest match wins", () => {
	expect(types("<= < = == =")).toEqual(["LESS_EQUAL", "LESS", "EQUAL", "EQUAL_EQUAL", "EQUAL", "EOF"]);
	expect(types("a<=b")).toEqual(["IDENTIFIER", "LESS_EQUAL", "IDENTIFIER", "EOF"]);
	expect(types("===")).toEqual(["EQUAL_EQUAL", "EQUAL", "EOF"]);
});

test("a keyword inside a longer word is an identifier", () => {
	expect(types("iffy lets fn1 if")).toEqual(["IDENTIFIER", "IDENTIFIER", "IDENTIFIER", "IF", "EOF"]);
});

test("numbers: a dot needs a digit after it", () => {
	const { tokens, errors } = tokenize("12 3.50 7.");
	expect(tokens.map((token) => token.text)).toEqual(["12", "3.50", "7", ""]);
	expect(errors).toEqual([{ message: "unexpected character '.'", line: 1, column: 10 }]);
});

test("comments produce no token", () => {
	expect(types("// only a comment")).toEqual(["EOF"]);
	expect(types("1 // one\n/ 2 // two")).toEqual(["NUMBER", "SLASH", "NUMBER", "EOF"]);
	const { tokens } = tokenize("// first line\nx");
	expect(tokens[0]).toEqual({ type: "IDENTIFIER", text: "x", line: 2, column: 1 });
});

test("an unterminated string is reported at its opening quote", () => {
	const { tokens, errors } = tokenize('let s = "abc;\nprint 1;');
	expect(errors).toEqual([{ message: "unterminated string", line: 1, column: 9 }]);
	// Lexing goes on from the next line.
	expect(tokens.map((token) => token.type)).toEqual([
		"LET",
		"IDENTIFIER",
		"EQUAL",
		"PRINT",
		"NUMBER",
		"SEMICOLON",
		"EOF",
	]);
});

test("an unknown character is reported and skipped", () => {
	const { tokens, errors } = tokenize("1 @ 2\n#");
	expect(errors).toEqual([
		{ message: "unexpected character '@'", line: 1, column: 3 },
		{ message: "unexpected character '#'", line: 2, column: 1 },
	]);
	expect(tokens.map((token) => token.type)).toEqual(["NUMBER", "NUMBER", "EOF"]);
});
