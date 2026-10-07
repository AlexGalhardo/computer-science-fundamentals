// EN: A very small syntax highlighter. It does not understand any language: it only splits
//     code into comments, strings, numbers, keywords and the rest, which is enough to make a
//     ten-line example readable. A full highlighter would add a large dependency for little gain.
// PT: Um destacador de sintaxe bem pequeno. Ele não entende nenhuma linguagem: só divide o
//     código em comentários, strings, números, palavras-chave e o resto, o que basta para deixar
//     legível um exemplo de dez linhas. Um destacador completo traria uma dependência grande
//     para pouco ganho.

export type TokenKind = "comment" | "string" | "number" | "keyword" | "plain";

export interface Token {
	kind: TokenKind;
	text: string;
}

const KEYWORDS = new Set(
	[
		"abstract async await break case catch class const continue def default defer defmodule do else elif end enum",
		"export extends false final finally fn for from func function go if impl implements import in interface is let",
		"match mod mut new nil none not null of or package private protected pub public return select self static",
		"struct super switch then this throw throws trait true try type typeof use var void when where while with yield",
		"and as begin commit create delete from group having index insert into join key limit order primary rollback",
		"set table transaction update values",
		"bool boolean char double float int long string",
	]
		.join(" ")
		.split(" "),
);

// EN: One regular expression with alternatives, tried in order at each position: comments
//     first (so a quote inside a comment is not a string), then strings, numbers and words.
// PT: Uma expressão regular com alternativas, testadas em ordem a cada posição: comentários
//     primeiro (para que uma aspa dentro de comentário não vire string), depois strings,
//     números e palavras.
const PATTERN =
	/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|--[^\n]*|#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

export function highlight(code: string): Token[] {
	const tokens: Token[] = [];
	let position = 0;
	const push = (kind: TokenKind, text: string): void => {
		const last = tokens.at(-1);
		if (last !== undefined && last.kind === kind) {
			last.text += text;
		} else if (text.length > 0) {
			tokens.push({ kind, text });
		}
	};
	for (const match of code.matchAll(PATTERN)) {
		push("plain", code.slice(position, match.index));
		const [text, comment, string, number, word] = match;
		if (comment !== undefined) {
			push("comment", text);
		} else if (string !== undefined) {
			push("string", text);
		} else if (number !== undefined) {
			push("number", text);
		} else {
			push(word !== undefined && KEYWORDS.has(word.toLowerCase()) ? "keyword" : "plain", text);
		}
		position = match.index + text.length;
	}
	push("plain", code.slice(position));
	return tokens;
}
