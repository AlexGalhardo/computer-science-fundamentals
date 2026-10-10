// EN: THE FIX, part 3: the routes. Same two routes as the vulnerable version, built on one idea:
//     nothing the client sends decides anything about the disk or about how a browser will treat
//     the file. The server generates the name, measures the size, detects the type and sets the
//     response headers. Every external input (token aside) is validated with Zod.
// PT: A CORREÇÃO, parte 3: as rotas. As mesmas duas rotas da versão vulnerável, construídas sobre
//     uma ideia: nada do que o cliente envia decide algo sobre o disco ou sobre como um navegador
//     vai tratar o arquivo. O servidor gera o nome, mede o tamanho, detecta o tipo e define os
//     cabeçalhos da resposta. Toda entrada externa (fora o token) é validada com Zod.
// ES: LA CORRECCIÓN, parte 3: las rutas. Las mismas dos rutas de la versión vulnerable, construidas sobre
//     una idea: nada de lo que envía el cliente decide algo sobre el disco ni sobre cómo un navegador
//     tratará el archivo. El servidor genera el nombre, mide el tamaño, detecta el tipo y define las
//     cabeceras de la respuesta. Toda entrada externa (salvo el token) se valida con Zod.

import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { Elysia } from "elysia";
import { z } from "zod";
import { authenticate } from "../data";
import { HttpError, toErrorResponse } from "../http";
import { ALLOWED_TYPES, type AllowedType, detectType, hasControlCharacter } from "./fixed-file-type";
import { realPathInsideRoot, resolveInsideRoot } from "./fixed-paths";

export const DEFAULT_MAX_BYTES = 1024 * 1024;

export interface FixedAppOptions {
	// EN: The upload folder. It must be outside any folder served as static files, so the only
	//     way to a stored file is the download route below, with its checks and headers.
	// PT: A pasta de uploads. Ela precisa ficar fora de qualquer pasta servida como arquivos
	//     estáticos, para que o único caminho até um arquivo guardado seja a rota de download
	//     abaixo, com suas verificações e cabeçalhos.
	// ES: La carpeta de cargas. Debe quedar fuera de cualquier carpeta servida como archivos
	//     estáticos, para que el único camino hasta un archivo guardado sea la ruta de descarga
	//     de abajo, con sus verificaciones y cabeceras.
	uploadRoot: string;
	maxBytes?: number;
}

// EN: One row of the index. The index is the source of truth about a file: who owns it, what it
//     was called, and which type the SERVER detected. It lives in memory here; a real application
//     keeps it in a database.
// PT: Uma linha do índice. O índice é a fonte da verdade sobre um arquivo: de quem é, como se
//     chamava, e qual tipo o SERVIDOR detectou. Aqui ele fica em memória; uma aplicação real o
//     guarda em um banco de dados.
// ES: Una fila del índice. El índice es la fuente de verdad sobre un archivo: de quién es, cómo se
//     llamaba, y qué tipo detectó el SERVIDOR. Aquí queda en memoria; una aplicación real lo
//     guarda en una base de datos.
interface StoredFile {
	id: string;
	owner: string;
	originalName: string;
	type: AllowedType;
	size: number;
}

// EN: A download is requested by id, and an id has exactly one shape: the UUID the server
//     generated. A name with `../`, an encoded variant or anything else is not a UUID and stops
//     here, before any path is built.
// PT: Um download é pedido por id, e um id tem exatamente um formato: o UUID que o servidor gerou.
//     Um nome com `../`, uma variante codificada ou qualquer outra coisa não é um UUID e para
//     aqui, antes de qualquer caminho ser montado.
// ES: Una descarga se pide por id, y un id tiene exactamente un formato: el UUID que generó el servidor.
//     Un nombre con `../`, una variante codificada o cualquier otra cosa no es un UUID y se detiene
//     aquí, antes de que se arme cualquier ruta.
const fileIdSchema = z.uuid();

function lastSegment(name: string): string {
	return name.split(/[\\/]/).at(-1) ?? "";
}

// EN: The original name is kept only as a label to show to people. It never becomes part of a
//     path. It is still validated: a sane length, no control characters (a line break inside a
//     header value would let the client write extra headers), and only the last segment is kept,
//     because a label has no folders.
// PT: O nome original é guardado só como um rótulo para mostrar às pessoas. Ele nunca vira parte
//     de um caminho. Mesmo assim é validado: tamanho razoável, sem caracteres de controle (uma
//     quebra de linha dentro do valor de um cabeçalho deixaria o cliente escrever cabeçalhos
//     extras), e só o último segmento é mantido, porque um rótulo não tem pastas.
// ES: El nombre original se guarda solo como una etiqueta para mostrar a las personas. Nunca pasa a ser parte
//     de una ruta. Aun así se valida: tamaño razonable, sin caracteres de control (un
//     salto de línea dentro del valor de una cabecera dejaría que el cliente escribiera cabeceras
//     extra), y solo se mantiene el último segmento, porque una etiqueta no tiene carpetas.
const originalNameSchema = z
	.string()
	.min(1)
	.max(255)
	.refine((name) => !hasControlCharacter(name, false))
	.transform(lastSegment)
	.pipe(z.string().min(1));

// EN: The declared type is only a claim. It must be one of the allowed types AND agree with what
//     the bytes say; it is never stored and never sent back.
// PT: O tipo declarado é só uma alegação. Ele precisa ser um dos tipos permitidos E concordar com
//     o que os bytes dizem; nunca é guardado e nunca é devolvido.
// ES: El tipo declarado es solo una afirmación. Debe ser uno de los tipos permitidos Y concordar con
//     lo que dicen los bytes; nunca se guarda y nunca se devuelve.
const declaredTypeSchema = z.enum(ALLOWED_TYPES);

const contentLengthSchema = z
	.string()
	.regex(/^[0-9]{1,15}$/)
	.transform(Number);

// EN: `text/plain; charset=utf-8` -> `text/plain`.
// PT: `text/plain; charset=utf-8` -> `text/plain`.
// ES: `text/plain; charset=utf-8` -> `text/plain`.
function mediaType(header: string | null): string {
	return (header ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

// EN: The size limit is enforced WHILE reading. The body arrives in chunks; the server counts
//     them and stops at the first byte over the limit, so a huge upload never sits in memory or
//     on disk. `Content-Length` is checked first only as a shortcut: it is a header written by
//     the client, so it can refuse early but can never be the proof that the body is small.
// PT: O limite de tamanho é aplicado DURANTE a leitura. O corpo chega em pedaços; o servidor os
//     conta e para no primeiro byte acima do limite, então um upload enorme nunca fica na memória
//     nem no disco. O `Content-Length` é conferido antes só como atalho: é um cabeçalho escrito
//     pelo cliente, então pode recusar cedo, mas nunca é a prova de que o corpo é pequeno.
// ES: El límite de tamaño se aplica DURANTE la lectura. El cuerpo llega en trozos; el servidor los
//     cuenta y se detiene en el primer byte por encima del límite, así una carga enorme nunca queda en memoria
//     ni en disco. `Content-Length` se comprueba antes solo como atajo: es una cabecera escrita
//     por el cliente, así que puede rechazar pronto, pero nunca es la prueba de que el cuerpo es pequeño.
async function readLimited(request: Request, maxBytes: number): Promise<Uint8Array> {
	const rawLength = request.headers.get("content-length");
	if (rawLength !== null) {
		const length = contentLengthSchema.safeParse(rawLength);
		if (!length.success) throw new HttpError(400, "invalid_content_length");
		if (length.data > maxBytes) throw new HttpError(413, "file_too_large");
	}
	if (request.body === null) return new Uint8Array();

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new HttpError(413, "file_too_large");
		}
		chunks.push(value);
	}

	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

// EN: `Content-Disposition: attachment` tells the browser to save the file instead of showing it
//     inside the site. The original name goes in twice, both safely encoded: an ASCII fallback
//     with every unusual character replaced, and the full name percent-encoded (RFC 6266 and
//     RFC 5987). A raw quote or line break never reaches the header.
// PT: `Content-Disposition: attachment` manda o navegador salvar o arquivo em vez de exibi-lo
//     dentro do site. O nome original entra duas vezes, as duas codificadas com segurança: uma
//     alternativa ASCII com todo caractere incomum substituído, e o nome completo em
//     percent-encoding (RFC 6266 e RFC 5987). Aspas ou quebra de linha cruas nunca chegam ao cabeçalho.
// ES: `Content-Disposition: attachment` manda al navegador guardar el archivo en lugar de mostrarlo
//     dentro del sitio. El nombre original entra dos veces, las dos codificadas con seguridad: una
//     alternativa ASCII con todo carácter inusual reemplazado, y el nombre completo en
//     percent-encoding (RFC 6266 y RFC 5987). Comillas o saltos de línea crudos nunca llegan a la cabecera.
export function contentDisposition(originalName: string): string {
	const fallback = originalName.replace(/[^A-Za-z0-9._-]/g, "_");
	const encoded = encodeURIComponent(originalName).replace(
		/['()*]/g,
		(character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
	);
	return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function contentTypeHeader(type: AllowedType): string {
	return type === "text/plain" ? "text/plain; charset=utf-8" : type;
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createFixedApp(options: FixedAppOptions) {
	const { uploadRoot } = options;
	const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
	const index = new Map<string, StoredFile>();

	function requireUser(request: Request): string {
		const user = authenticate(request.headers.get("authorization"));
		if (user === null) throw new HttpError(401, "unauthenticated");
		return user;
	}

	return (
		new Elysia()
			.onError(({ error }) => toErrorResponse(error))
			// EN: The upload, in order: who is calling (401), is the label sane (400), is the
			//     declared type on the allow-list (415), read at most `maxBytes` (413), detect
			//     the type from the bytes and compare (415), and only then write.
			//     `parse: "none"` keeps the framework from reading the body by itself, so the
			//     limit above is the only reader.
			// PT: O upload, em ordem: quem chama (401), o rótulo é razoável (400), o tipo declarado
			//     está na lista de permissão (415), ler no máximo `maxBytes` (413), detectar o
			//     tipo pelos bytes e comparar (415), e só então gravar. `parse: "none"` impede o
			//     framework de ler o corpo sozinho, então o limite acima é o único leitor.
			// ES: La carga, en orden: quien llama (401), la etiqueta es razonable (400), el tipo declarado
			//     está en la lista de permitidos (415), leer como máximo `maxBytes` (413), detectar el
			//     tipo por los bytes y comparar (415), y solo entonces escribir. `parse: "none"` impide que el
			//     framework lea el cuerpo por su cuenta, así que el límite de arriba es el único lector.
			.post(
				"/upload",
				async ({ request }) => {
					const owner = requireUser(request);
					const name = originalNameSchema.safeParse(new URL(request.url).searchParams.get("name"));
					if (!name.success) throw new HttpError(400, "invalid_name");
					const declared = declaredTypeSchema.safeParse(mediaType(request.headers.get("content-type")));
					if (!declared.success) throw new HttpError(415, "unsupported_type");

					const bytes = await readLimited(request, maxBytes);
					if (bytes.byteLength === 0) throw new HttpError(400, "empty_file");
					const detected = detectType(bytes);
					if (detected === null) throw new HttpError(415, "unsupported_type");
					if (detected !== declared.data) throw new HttpError(415, "type_mismatch");

					// EN: The name on disk is a random id generated here. The client has no say
					//     in it, so there is nothing to traverse with, and two uploads can never
					//     collide. The path check is still applied (defence in depth), and the
					//     `wx` flag makes the write fail instead of replacing an existing file.
					// PT: O nome no disco é um id aleatório gerado aqui. O cliente não opina, então
					//     não há com o que fazer traversal, e dois uploads nunca colidem. A
					//     verificação de caminho é aplicada mesmo assim (defesa em profundidade),
					//     e a flag `wx` faz a escrita falhar em vez de substituir um arquivo existente.
					// ES: El nombre en el disco es un id aleatorio generado aquí. El cliente no opina, así que
					//     no hay con qué hacer traversal, y dos cargas nunca colisionan. La
					//     verificación de ruta se aplica de todos modos (defensa en profundidad),
					//     y la flag `wx` hace que la escritura falle en lugar de reemplazar un archivo existente.
					const id = randomUUID();
					const path = resolveInsideRoot(uploadRoot, id);
					if (path === null) throw new HttpError(400, "invalid_name");
					await writeFile(path, bytes, { flag: "wx" });

					const stored: StoredFile = {
						id,
						owner,
						originalName: name.data,
						type: detected,
						size: bytes.byteLength,
					};
					index.set(id, stored);
					return Response.json({ file: id, type: detected, size: stored.size }, { status: 201 });
				},
				{ parse: "none" },
			)
			// EN: The download never receives a path. It receives an id, validates its shape,
			//     looks it up in the index, and builds the path from the id the SERVER stored.
			//     A file of another user answers the same 404 as a missing one (ownership checks
			//     are the subject of access-control-lab). Then the canonical check follows
			//     symbolic links, and the bytes are read from the path it returned.
			// PT: O download nunca recebe um caminho. Ele recebe um id, valida o formato, procura
			//     no índice, e monta o caminho a partir do id que o SERVIDOR guardou. Um arquivo
			//     de outro usuário responde o mesmo 404 de um inexistente (verificação de dono é
			//     o assunto do access-control-lab). Depois a verificação canônica segue links
			//     simbólicos, e os bytes são lidos do caminho que ela devolveu.
			// ES: La descarga nunca recibe una ruta. Recibe un id, valida el formato, busca
			//     en el índice, y arma la ruta a partir del id que el SERVIDOR guardó. Un archivo
			//     de otro usuario responde el mismo 404 que uno inexistente (la verificación del dueño es
			//     el tema de access-control-lab). Después la verificación canónica sigue los enlaces
			//     simbólicos, y los bytes se leen de la ruta que ella devolvió.
			.get("/download", async ({ request }) => {
				const user = requireUser(request);
				const id = fileIdSchema.safeParse(new URL(request.url).searchParams.get("file"));
				if (!id.success) throw new HttpError(400, "invalid_id");
				const stored = index.get(id.data);
				if (stored === undefined || stored.owner !== user) throw new HttpError(404, "not_found");
				const path = await realPathInsideRoot(uploadRoot, stored.id);
				if (path === null) throw new HttpError(404, "not_found");

				// EN: The headers that decide how a browser treats the file:
				//     - `Content-Type` is the type the server detected, never the client's claim.
				//     - `X-Content-Type-Options: nosniff` forbids the browser from guessing
				//       another type by looking at the content.
				//     - `Content-Disposition: attachment` downloads instead of rendering.
				//     - The CSP is a last layer: if the file is rendered anyway, it may load and
				//       run nothing.
				// PT: Os cabeçalhos que decidem como um navegador trata o arquivo:
				//     - `Content-Type` é o tipo que o servidor detectou, nunca a alegação do cliente.
				//     - `X-Content-Type-Options: nosniff` proíbe o navegador de adivinhar outro
				//       tipo olhando o conteúdo.
				//     - `Content-Disposition: attachment` baixa em vez de renderizar.
				//     - A CSP é uma última camada: se o arquivo for renderizado mesmo assim, ele
				//       não pode carregar nem executar nada.
				// ES: Las cabeceras que deciden cómo un navegador trata el archivo:
				//     - `Content-Type` es el tipo que detectó el servidor, nunca la afirmación del cliente.
				//     - `X-Content-Type-Options: nosniff` prohíbe al navegador adivinar otro
				//       tipo mirando el contenido.
				//     - `Content-Disposition: attachment` descarga en lugar de renderizar.
				//     - La CSP es una última capa: si el archivo se renderiza de todos modos, no
				//       puede cargar ni ejecutar nada.
				return new Response(await readFile(path), {
					headers: {
						"content-type": contentTypeHeader(stored.type),
						"x-content-type-options": "nosniff",
						"content-disposition": contentDisposition(stored.originalName),
						"content-security-policy": "default-src 'none'; sandbox",
					},
				});
			})
	);
}
