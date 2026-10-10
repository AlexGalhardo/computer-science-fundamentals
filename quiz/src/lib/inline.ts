// EN: The texts of a theory summary are plain strings, but a didactic text needs a little
//     emphasis. This module reads four marks and nothing else, so an author cannot inject HTML:
//       **bold**            a word that matters
//       `code`              an identifier or a command
//       [text](https://…)   a link to a source
//       [[term|meaning]]    a tooltip: the term stays in the text, the meaning shows on hover
// PT: Os textos de um resumo teórico são strings simples, mas um texto didático precisa de um
//     pouco de ênfase. Este módulo lê quatro marcas e nada mais, então o autor não consegue
//     injetar HTML:
//       **negrito**         uma palavra que importa
//       `código`            um identificador ou um comando
//       [texto](https://…)  um link para uma fonte
//       [[termo|sentido]]   um tooltip: o termo fica no texto, o sentido aparece ao passar o mouse
// ES: Los textos de un resumen teórico son strings simples, pero un texto didáctico necesita un
//     poco de énfasis. Este módulo lee cuatro marcas y nada más, así que el autor no puede
//     inyectar HTML:
//       **negrita**         una palabra que importa
//       `código`            un identificador o un comando
//       [texto](https://…)  un enlace a una fuente
//       [[término|sentido]] un tooltip: el término queda en el texto, el sentido aparece al pasar el mouse

export type InlineToken =
	| { kind: "text"; text: string }
	| { kind: "bold"; text: string }
	| { kind: "code"; text: string }
	| { kind: "link"; text: string; url: string }
	| { kind: "tooltip"; text: string; meaning: string };

// EN: One regular expression with one alternative per mark. Whatever sits between two matches
//     is plain text. A mark that is not closed simply does not match and stays as written.
// PT: Uma expressão regular com uma alternativa por marca. O que fica entre dois casamentos é
//     texto simples. Uma marca que não fecha simplesmente não casa e fica como foi escrita.
// ES: Una expresión regular con una alternativa por marca. Lo que queda entre dos coincidencias
//     es texto simple. Una marca que no cierra simplemente no coincide y queda como se escribió.
const MARK = /\*\*([^*]+)\*\*|`([^`]+)`|\[\[([^|\]]+)\|([^\]]+)\]\]|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;

export function parseInline(source: string): InlineToken[] {
	const tokens: InlineToken[] = [];
	let cursor = 0;
	for (const match of source.matchAll(MARK)) {
		if (match.index > cursor) {
			tokens.push({ kind: "text", text: source.slice(cursor, match.index) });
		}
		const [whole, bold, code, term, meaning, linkText, url] = match;
		if (bold !== undefined) {
			tokens.push({ kind: "bold", text: bold });
		} else if (code !== undefined) {
			tokens.push({ kind: "code", text: code });
		} else if (term !== undefined && meaning !== undefined) {
			tokens.push({ kind: "tooltip", text: term, meaning });
		} else if (linkText !== undefined && url !== undefined) {
			tokens.push({ kind: "link", text: linkText, url });
		}
		cursor = match.index + whole.length;
	}
	if (cursor < source.length) {
		tokens.push({ kind: "text", text: source.slice(cursor) });
	}
	return tokens;
}
