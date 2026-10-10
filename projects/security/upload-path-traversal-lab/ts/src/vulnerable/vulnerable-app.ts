// ============================================================================================
// EN: VULNERABLE ON PURPOSE. This file exists only to make flaws observable inside this lab
//     (path traversal on download and upload, and an upload that trusts the client's file name,
//     type and size). Never copy it, never import it from another project, never deploy it.
// PT: VULNERÁVEL DE PROPÓSITO. Este arquivo existe só para tornar falhas observáveis dentro deste
//     laboratório (path traversal no download e no upload, e um upload que confia no nome, no
//     tipo e no tamanho enviados pelo cliente). Nunca copie, nunca importe de outro projeto,
//     nunca publique.
// ES: VULNERABLE A PROPÓSITO. Este archivo existe solo para hacer observables fallas dentro de este
//     laboratorio (path traversal en la descarga y en la carga, y una carga que confía en el nombre, en el
//     tipo y en el tamaño enviados por el cliente). Nunca lo copies, nunca lo importes desde otro proyecto,
//     nunca lo publiques.
// ============================================================================================

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Elysia } from "elysia";
import { authenticate } from "../data";
import { HttpError, toErrorResponse } from "../http";

export interface VulnerableAppOptions {
	uploadRoot: string;
}

function requireUser(request: Request): string {
	const user = authenticate(request.headers.get("authorization"));
	if (user === null) throw new HttpError(401, "unauthenticated");
	return user;
}

function queryValue(request: Request, key: string): string {
	const value = new URL(request.url).searchParams.get(key);
	if (value === null || value === "") throw new HttpError(400, "missing_parameter");
	return value;
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createVulnerableApp(options: VulnerableAppOptions) {
	const { uploadRoot } = options;

	// EN: The type each file was uploaded with, exactly as the client declared it.
	// PT: O tipo com que cada arquivo foi enviado, exatamente como o cliente declarou.
	// ES: El tipo con que se envió cada archivo, exactamente como lo declaró el cliente.
	const declaredTypes = new Map<string, string>();

	return (
		new Elysia()
			.onError(({ error }) => toErrorResponse(error))
			// EN: FLAWS of the upload, four of them in a few lines:
			//     1. The file is stored under the name the client sent. `join` does not keep the
			//        result inside `uploadRoot`: a name containing `../` walks out of the folder,
			//        so the client chooses WHERE on the disk the server writes.
			//     2. Names are shared by everybody, so a second upload with the same name replaces
			//        the file of another user.
			//     3. The `Content-Type` header is stored as the truth. The client wrote it.
			//     4. `arrayBuffer()` reads the whole body into memory, whatever its size.
			// PT: FALHAS do upload, quatro em poucas linhas:
			//     1. O arquivo é guardado com o nome que o cliente enviou. `join` não mantém o
			//        resultado dentro de `uploadRoot`: um nome contendo `../` sai da pasta, então
			//        o cliente escolhe ONDE no disco o servidor escreve.
			//     2. Os nomes são compartilhados por todos, então um segundo upload com o mesmo
			//        nome substitui o arquivo de outro usuário.
			//     3. O cabeçalho `Content-Type` é guardado como verdade. Quem o escreveu foi o cliente.
			//     4. `arrayBuffer()` lê o corpo inteiro para a memória, seja qual for o tamanho.
			// ES: FALLAS de la carga, cuatro en pocas líneas:
			//     1. El archivo se guarda con el nombre que envió el cliente. `join` no mantiene el
			//        resultado dentro de `uploadRoot`: un nombre que contiene `../` sale de la carpeta, así que
			//        el cliente elige DÓNDE en el disco escribe el servidor.
			//     2. Los nombres los comparten todos, así que una segunda carga con el mismo
			//        nombre reemplaza el archivo de otro usuario.
			//     3. La cabecera `Content-Type` se guarda como verdad. Quien la escribió fue el cliente.
			//     4. `arrayBuffer()` lee todo el cuerpo en memoria, sea cual sea el tamaño.
			.post(
				"/upload",
				async ({ request }) => {
					requireUser(request);
					const name = queryValue(request, "name");
					const type = request.headers.get("content-type") ?? "application/octet-stream";
					const bytes = new Uint8Array(await request.arrayBuffer());
					await writeFile(join(uploadRoot, name), bytes);
					declaredTypes.set(name, type);
					return Response.json({ file: name, type, size: bytes.byteLength }, { status: 201 });
				},
				{ parse: "none" },
			)
			// EN: FLAWS of the download:
			//     1. Path traversal. The name comes from the request and is joined to the folder
			//        without any check, so `../` reaches files the server never meant to serve.
			//        The query string is percent-decoded before this code sees it, so an encoded
			//        form of the same name arrives here as the same name.
			//     2. `readFile` follows symbolic links, wherever they point.
			//     3. The file goes back with the type the uploader declared, with no `nosniff` and
			//        no `Content-Disposition`, so the browser may render it as a page of this site.
			// PT: FALHAS do download:
			//     1. Path traversal. O nome vem da requisição e é juntado à pasta sem nenhuma
			//        verificação, então `../` alcança arquivos que o servidor nunca quis servir.
			//        A query string é decodificada (percent-decoding) antes de este código vê-la,
			//        então uma forma codificada do mesmo nome chega aqui como o mesmo nome.
			//     2. `readFile` segue links simbólicos, para onde quer que apontem.
			//     3. O arquivo volta com o tipo que quem enviou declarou, sem `nosniff` e sem
			//        `Content-Disposition`, então o navegador pode renderizá-lo como página deste site.
			// ES: FALLAS de la descarga:
			//     1. Path traversal. El nombre viene de la solicitud y se une a la carpeta sin ninguna
			//        verificación, así que `../` alcanza archivos que el servidor nunca quiso servir.
			//        La query string se decodifica (percent-decoding) antes de que este código la vea,
			//        así que una forma codificada del mismo nombre llega aquí como el mismo nombre.
			//     2. `readFile` sigue los enlaces simbólicos, adondequiera que apunten.
			//     3. El archivo vuelve con el tipo que declaró quien lo envió, sin `nosniff` y sin
			//        `Content-Disposition`, así que el navegador puede renderizarlo como página de este sitio.
			.get("/download", async ({ request }) => {
				requireUser(request);
				const name = queryValue(request, "file");
				let bytes: Uint8Array;
				try {
					bytes = await readFile(join(uploadRoot, name));
				} catch {
					throw new HttpError(404, "not_found");
				}
				return new Response(bytes, {
					headers: { "content-type": declaredTypes.get(name) ?? "application/octet-stream" },
				});
			})
	);
}
