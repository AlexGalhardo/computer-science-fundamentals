import { KEYWORDS, type SyntaxProblem, type Token, type TokenType } from "./token";

export interface LexResult {
	tokens: Token[];
	errors: SyntaxProblem[];
}

const isDigit = (char: string): boolean => char >= "0" && char <= "9";
const isLetter = (char: string): boolean =>
	(char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_";

// EN: Operators made of one character that may be followed by `=` to form a second operator.
//     The lexer always prefers the longer one ("maximal munch"): `<=` is one token, never `<`
//     followed by `=`.
// PT: Operadores de um caractere que podem ser seguidos de `=` e formar um segundo operador.
//     O lexer sempre prefere o mais longo ("maximal munch"): `<=` é um token só, nunca `<`
//     seguido de `=`.
const ONE_OR_TWO: Readonly<Record<string, [TokenType, TokenType]>> = {
	"!": ["BANG", "BANG_EQUAL"],
	"=": ["EQUAL", "EQUAL_EQUAL"],
	"<": ["LESS", "LESS_EQUAL"],
	">": ["GREATER", "GREATER_EQUAL"],
};

const SINGLE: Readonly<Record<string, TokenType>> = {
	"(": "LEFT_PAREN",
	")": "RIGHT_PAREN",
	"{": "LEFT_BRACE",
	"}": "RIGHT_BRACE",
	",": "COMMA",
	";": "SEMICOLON",
	"+": "PLUS",
	"-": "MINUS",
	"*": "STAR",
	"%": "PERCENT",
};

// EN: The lexer (or scanner) reads the source one character at a time and groups characters into
//     tokens. It is a hand-written finite automaton: the `if` chain below chooses a state from
//     the first character, and each small loop stays in that state while the characters still
//     belong to the same token.
// PT: O lexer (ou scanner) lê o código-fonte um caractere por vez e agrupa os caracteres em
//     tokens. Ele é um autômato finito escrito à mão: a cadeia de `if` abaixo escolhe um estado
//     pelo primeiro caractere, e cada pequeno laço permanece nesse estado enquanto os caracteres
//     ainda pertencem ao mesmo token.
export function tokenize(source: string): LexResult {
	const tokens: Token[] = [];
	const errors: SyntaxProblem[] = [];
	let index = 0;
	let line = 1;
	// EN: Index of the first character of the current line. The column is the distance to it.
	// PT: Índice do primeiro caractere da linha atual. A coluna é a distância até ele.
	let lineStart = 0;

	const at = (offset: number): string => source[index + offset] ?? "";

	while (index < source.length) {
		const char = at(0);
		const start = index;
		const column = index - lineStart + 1;
		const push = (type: TokenType): void => {
			tokens.push({ type, text: source.slice(start, index), line, column });
		};

		if (char === "\n") {
			index += 1;
			line += 1;
			lineStart = index;
			continue;
		}
		if (char === " " || char === "\t" || char === "\r") {
			index += 1;
			continue;
		}

		// EN: A comment produces no token at all: the parser never learns it existed.
		// PT: Um comentário não produz token algum: o parser nunca fica sabendo que ele existiu.
		if (char === "/" && at(1) === "/") {
			while (index < source.length && at(0) !== "\n") {
				index += 1;
			}
			continue;
		}
		if (char === "/") {
			index += 1;
			push("SLASH");
			continue;
		}

		const pair = ONE_OR_TWO[char];
		if (pair !== undefined) {
			const double = at(1) === "=";
			index += double ? 2 : 1;
			push(double ? pair[1] : pair[0]);
			continue;
		}

		const single = SINGLE[char];
		if (single !== undefined) {
			index += 1;
			push(single);
			continue;
		}

		// EN: A number is digits, optionally followed by a dot and more digits. The dot is only
		//     consumed when a digit follows, so `1.` is the number `1` and then a stray dot.
		// PT: Um número são dígitos, opcionalmente seguidos de ponto e mais dígitos. O ponto só é
		//     consumido quando vem um dígito depois, então `1.` é o número `1` e um ponto solto.
		if (isDigit(char)) {
			while (isDigit(at(0))) {
				index += 1;
			}
			if (at(0) === "." && isDigit(at(1))) {
				index += 1;
				while (isDigit(at(0))) {
					index += 1;
				}
			}
			push("NUMBER");
			continue;
		}

		if (isLetter(char)) {
			while (isLetter(at(0)) || isDigit(at(0))) {
				index += 1;
			}
			push(KEYWORDS.get(source.slice(start, index)) ?? "IDENTIFIER");
			continue;
		}

		// EN: A string runs to the closing quote on the same line. There are no escape sequences.
		//     When the line ends first, the error is reported at the opening quote, which is where
		//     the programmer has to look, and lexing goes on from the next line.
		// PT: Uma string vai até as aspas de fechamento na mesma linha. Não há sequências de
		//     escape. Quando a linha termina antes, o erro é reportado nas aspas de abertura, que
		//     é onde o programador precisa olhar, e a análise continua na linha seguinte.
		if (char === '"') {
			index += 1;
			while (index < source.length && at(0) !== '"' && at(0) !== "\n") {
				index += 1;
			}
			if (at(0) === '"') {
				index += 1;
				push("STRING");
			} else {
				errors.push({ message: "unterminated string", line, column });
			}
			continue;
		}

		// EN: An unknown character is reported and skipped. The lexer does not stop, so one run
		//     shows every lexical error of the file.
		// PT: Um caractere desconhecido é reportado e pulado. O lexer não para, então uma única
		//     execução mostra todos os erros léxicos do arquivo.
		errors.push({ message: `unexpected character '${char}'`, line, column });
		index += 1;
	}

	tokens.push({ type: "EOF", text: "", line, column: index - lineStart + 1 });
	return { tokens, errors };
}
