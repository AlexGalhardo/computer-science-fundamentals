// ============================================================================================
// EN: VULNERABLE ON PURPOSE. This file exists only to make flaws observable inside this lab
//     (path traversal on download and upload, and an upload that trusts the client's file name,
//     type and size). Never copy it, never import it from another project, never deploy it.
// PT: VULNERÁVEL DE PROPÓSITO. Este arquivo existe só para tornar falhas observáveis dentro deste
//     laboratório (path traversal no download e no upload, e um upload que confia no nome, no
//     tipo e no tamanho enviados pelo cliente). Nunca copie, nunca importe de outro projeto,
//     nunca publique.
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
export function createVulnerableApp(options: VulnerableAppOptions) {
	const { uploadRoot } = options;

	// EN: The type each file was uploaded with, exactly as the client declared it.
	// PT: O tipo com que cada arquivo foi enviado, exatamente como o cliente declarou.
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
