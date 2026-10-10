// EN: What the vulnerable and the fixed apps share: the shape of a link preview and how it is
//     cut out of a page. Everything that differs between them (how the URL is fetched) lives in
//     `vulnerable/` and `fixed/`.
// PT: O que os apps vulnerável e corrigido compartilham: o formato de uma prévia de link e como
//     ela é recortada de uma página. Tudo o que muda entre eles (como a URL é buscada) fica em
//     `vulnerable/` e `fixed/`.
// ES: Lo que comparten las apps vulnerable y corregida: el formato de una vista previa de enlace y cómo
//     se recorta de una página. Todo lo que cambia entre ellas (cómo se busca la URL) queda en
//     `vulnerable/` y `fixed/`.

/** The minimum both apps expose, so one scenario can drive either of them in-process. */
export interface LabApp {
	handle(request: Request): Promise<Response>;
}

export interface LinkPreview {
	/** URL the content finally came from, after redirects. */
	url: string;
	/** HTTP status the remote server answered. */
	status: number;
	/** Text of the `<title>` tag, or null when the page has none. */
	title: string | null;
	/** The first characters of the body. This is the field through which a secret can leak. */
	snippet: string;
}

export const SNIPPET_LENGTH = 200;

// EN: A link preview shows a piece of the page to the person who pasted the link. That is the
//     whole feature, and also the whole risk: whatever the server can read, the user gets to see.
// PT: Uma prévia de link mostra um pedaço da página para quem colou o link. Essa é a função
//     inteira, e também o risco inteiro: o que o servidor consegue ler, o usuário consegue ver.
// ES: Una vista previa de enlace muestra un trozo de la página a quien pegó el enlace. Esa es la función
//     completa, y también todo el riesgo: lo que el servidor puede leer, el usuario puede verlo.
export function buildPreview(url: string, status: number, body: string): LinkPreview {
	const title = /<title>([^<]*)<\/title>/i.exec(body)?.[1]?.trim() ?? null;
	return { url, status, title, snippet: body.slice(0, SNIPPET_LENGTH) };
}
