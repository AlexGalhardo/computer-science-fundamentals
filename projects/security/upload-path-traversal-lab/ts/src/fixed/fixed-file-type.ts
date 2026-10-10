// EN: THE FIX, part 2: the type of a file is decided by the server, from the bytes of the file.
//     Many formats start with a fixed sequence of bytes, called a magic number or signature. The
//     `Content-Type` header and the extension are just text typed by the client, so they are
//     never used to decide. This is an allow-list: three types are known, everything else is
//     refused. A real application would use a maintained detection library with more formats.
// PT: A CORREÇÃO, parte 2: o tipo de um arquivo é decidido pelo servidor, a partir dos bytes do
//     arquivo. Muitos formatos começam com uma sequência fixa de bytes, chamada número mágico ou
//     assinatura. O cabeçalho `Content-Type` e a extensão são só texto digitado pelo cliente,
//     então nunca são usados para decidir. Isto é uma lista de permissão: três tipos são
//     conhecidos, todo o resto é recusado. Uma aplicação real usaria uma biblioteca de detecção
//     mantida, com mais formatos.
// ES: LA CORRECCIÓN, parte 2: el tipo de un archivo lo decide el servidor, a partir de los bytes del
//     archivo. Muchos formatos empiezan con una secuencia fija de bytes, llamada número mágico o
//     firma. La cabecera `Content-Type` y la extensión son solo texto escrito por el cliente,
//     así que nunca se usan para decidir. Esto es una lista de permitidos: tres tipos son
//     conocidos, todo lo demás se rechaza. Una aplicación real usaría una biblioteca de detección
//     mantenida, con más formatos.

export const ALLOWED_TYPES = ["image/png", "application/pdf", "text/plain"] as const;
export type AllowedType = (typeof ALLOWED_TYPES)[number];

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
// EN: The ASCII characters `%PDF-`.
// PT: Os caracteres ASCII `%PDF-`.
// ES: Los caracteres ASCII `%PDF-`.
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
	if (bytes.byteLength < signature.length) return false;
	return signature.every((value, index) => bytes[index] === value);
}

const TAB = 0x09;
const LINE_FEED = 0x0a;
const CARRIAGE_RETURN = 0x0d;

// EN: Control characters are the invisible codes below the space (and DEL). Tab and the two line
//     breaks are the only ones a text file needs.
// PT: Caracteres de controle são os códigos invisíveis abaixo do espaço (e o DEL). Tab e as duas
//     quebras de linha são os únicos de que um arquivo de texto precisa.
// ES: Los caracteres de control son los códigos invisibles por debajo del espacio (y el DEL). El tabulador y los dos
//     saltos de línea son los únicos que necesita un archivo de texto.
export function hasControlCharacter(text: string, allowLineBreaksAndTabs: boolean): boolean {
	for (const character of text) {
		const code = character.codePointAt(0) ?? 0;
		const isControl = code < 0x20 || code === 0x7f;
		if (!isControl) continue;
		const isTextWhitespace = code === TAB || code === LINE_FEED || code === CARRIAGE_RETURN;
		if (!(allowLineBreaksAndTabs && isTextWhitespace)) return true;
	}
	return false;
}

// EN: Plain text has no signature, so the rule is the opposite: the whole content must decode as
//     UTF-8 and contain no control character. Binary files fail this almost immediately.
// PT: Texto puro não tem assinatura, então a regra é a inversa: o conteúdo inteiro precisa
//     decodificar como UTF-8 e não conter caractere de controle. Arquivos binários falham nisso
//     quase de imediato.
// ES: El texto plano no tiene firma, así que la regla es la inversa: todo el contenido debe
//     decodificarse como UTF-8 y no contener ningún carácter de control. Los archivos binarios fallan en esto
//     casi de inmediato.
function isPlainText(bytes: Uint8Array): boolean {
	let text: string;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return false;
	}
	return !hasControlCharacter(text, true);
}

// EN: Returns the type the BYTES say, or `null` when they match nothing on the allow-list.
//     A signature only says how a file starts. It does not prove the rest of the file is harmless,
//     which is why the download also sends `nosniff` and `attachment` (see fixed-app.ts).
// PT: Devolve o tipo que os BYTES dizem, ou `null` quando não correspondem a nada da lista de
//     permissão. Uma assinatura só diz como um arquivo começa. Ela não prova que o resto do
//     arquivo é inofensivo, e por isso o download também envia `nosniff` e `attachment` (veja
//     fixed-app.ts).
// ES: Devuelve el tipo que dicen los BYTES, o `null` cuando no corresponden a nada de la lista de
//     permitidos. Una firma solo dice cómo empieza un archivo. No prueba que el resto del
//     archivo sea inofensivo, y por eso la descarga también envía `nosniff` y `attachment` (ve
//     fixed-app.ts).
export function detectType(bytes: Uint8Array): AllowedType | null {
	if (bytes.byteLength === 0) return null;
	if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
	if (startsWith(bytes, PDF_SIGNATURE)) return "application/pdf";
	if (isPlainText(bytes)) return "text/plain";
	return null;
}
