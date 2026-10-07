// EN: The scenarios of the lab. Each function is one attempt, written once and run against both
//     versions of the API. The tests assert what happened and the demo prints it. The requests
//     are built in memory and handed straight to the app (`app.handle`): nothing leaves the
//     process. Every lab gets its own temporary folder, created here and removed at the end, and
//     the only files that exist are the ones this lab creates.
// PT: Os cenários do laboratório. Cada função é uma tentativa, escrita uma vez e executada contra
//     as duas versões da API. Os testes afirmam o que aconteceu e a demo imprime. As requisições
//     são montadas em memória e entregues direto ao app (`app.handle`): nada sai do processo.
//     Cada laboratório ganha a própria pasta temporária, criada aqui e removida no fim, e os
//     únicos arquivos que existem são os que este laboratório cria.

import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	SAMPLE_HTML,
	SAMPLE_PDF,
	SAMPLE_PNG,
	SAMPLE_TEXT,
	SECRET_CONTENT,
	SECRET_FILE_NAME,
	TOKENS,
	textBytes,
} from "./data";
import { createFixedApp, DEFAULT_MAX_BYTES } from "./fixed/fixed-app";
import { createVulnerableApp } from "./vulnerable/vulnerable-app";

export type Version = "vulnerable" | "fixed";

export interface LabApp {
	handle(request: Request): Promise<Response>;
}

export interface Lab {
	version: Version;
	app: LabApp;
	// EN: The only folder the server is supposed to read and write.
	// PT: A única pasta que o servidor deveria ler e escrever.
	uploadRoot: string;
	// EN: A sibling folder, outside the upload folder, holding the fake secret.
	// PT: Uma pasta irmã, fora da pasta de uploads, com o segredo falso.
	privateDir: string;
	maxBytes: number;
	cleanup(): Promise<void>;
}

// EN: A fresh lab on disk:
//       <temporary folder>/uploads/                  the upload root (empty)
//       <temporary folder>/private/FAKE-SECRET.txt   the file nobody should be able to download
// PT: Um laboratório novo no disco:
//       <pasta temporária>/uploads/                  a raiz de uploads (vazia)
//       <pasta temporária>/private/FAKE-SECRET.txt   o arquivo que ninguém deveria conseguir baixar
export async function createLab(version: Version): Promise<Lab> {
	const dir = await mkdtemp(join(tmpdir(), "upload-path-traversal-lab-"));
	const uploadRoot = join(dir, "uploads");
	const privateDir = join(dir, "private");
	await mkdir(uploadRoot);
	await mkdir(privateDir);
	await writeFile(join(privateDir, SECRET_FILE_NAME), SECRET_CONTENT);
	const maxBytes = DEFAULT_MAX_BYTES;
	const app =
		version === "vulnerable" ? createVulnerableApp({ uploadRoot }) : createFixedApp({ uploadRoot, maxBytes });
	return { version, app, uploadRoot, privateDir, maxBytes, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

// EN: Runs one scenario on a fresh lab and always removes the temporary folder afterwards.
// PT: Executa um cenário em um laboratório novo e sempre remove a pasta temporária depois.
export async function withLab<T>(version: Version, run: (lab: Lab) => Promise<T>): Promise<T> {
	const lab = await createLab(version);
	try {
		return await run(lab);
	} finally {
		await lab.cleanup();
	}
}

export interface Observation {
	status: number;
	headers: Headers;
	bytes: Uint8Array;
	text: string;
	// EN: The body parsed as JSON, or `undefined` when it is not JSON (a downloaded file).
	// PT: O corpo interpretado como JSON, ou `undefined` quando não é JSON (um arquivo baixado).
	json: unknown;
}

export interface CallOptions {
	token?: string;
	method?: "GET" | "POST";
	contentType?: string;
	body?: Uint8Array;
}

export async function call(app: LabApp, path: string, options: CallOptions = {}): Promise<Observation> {
	const headers = new Headers();
	if (options.token !== undefined) headers.set("authorization", `Bearer ${options.token}`);
	if (options.contentType !== undefined) headers.set("content-type", options.contentType);
	const response = await app.handle(
		new Request(`http://lab.invalid${path}`, { method: options.method ?? "GET", headers, body: options.body }),
	);
	const bytes = new Uint8Array(await response.arrayBuffer());
	const text = new TextDecoder().decode(bytes);
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		// EN: Not JSON (a downloaded file, or the framework's plain-text 404): `json` stays undefined.
		// PT: Não é JSON (um arquivo baixado, ou o 404 em texto puro do framework): `json` fica undefined.
	}
	return { status: response.status, headers: response.headers, bytes, text, json };
}

export function upload(
	lab: Lab,
	token: string,
	name: string,
	contentType: string,
	body: Uint8Array,
): Promise<Observation> {
	return call(lab.app, `/upload?name=${encodeURIComponent(name)}`, { token, method: "POST", contentType, body });
}

// EN: `rawReference` goes into the URL exactly as given, so a scenario controls the encoding.
// PT: `rawReference` entra na URL exatamente como veio, então o cenário controla a codificação.
export function download(lab: Lab, token: string, rawReference: string): Promise<Observation> {
	return call(lab.app, `/download?file=${rawReference}`, { token });
}

// EN: Both versions answer an upload with `{ "file": <reference> }`. On the vulnerable API the
//     reference is the name the client chose; on the fixed API it is the id the server generated.
// PT: As duas versões respondem um upload com `{ "file": <referência> }`. Na API vulnerável a
//     referência é o nome que o cliente escolheu; na corrigida é o id que o servidor gerou.
export function referenceOf(observation: Observation): string {
	const { json } = observation;
	if (typeof json === "object" && json !== null && "file" in json && typeof json.file === "string") return json.file;
	return "";
}

// EN: The two demonstration inputs of the lab, and the only ones. Both name the same fake file
//     created by `createLab`, one level above the upload folder. The second is the first with
//     `.` and `/` written in percent-encoding.
// PT: As duas entradas de demonstração do laboratório, e as únicas. As duas nomeiam o mesmo
//     arquivo falso criado por `createLab`, um nível acima da pasta de uploads. A segunda é a
//     primeira com `.` e `/` escritos em percent-encoding.
export const TRAVERSAL_NAME = `../private/${SECRET_FILE_NAME}`;
export const ENCODED_TRAVERSAL_NAME = `%2e%2e%2fprivate%2f${SECRET_FILE_NAME}`;

// EN: bob-fake asks for a "file name" that walks out of the upload folder.
// PT: bob-fake pede um "nome de arquivo" que sai da pasta de uploads.
export function readOutsideUploadFolder(lab: Lab, rawName: string = TRAVERSAL_NAME): Promise<Observation> {
	return download(lab, TOKENS.bob, rawName);
}

export const PLANTED_FILE_NAME = "planted-by-bob-fake.txt";
export const PLANTED_CONTENT = "written by bob-fake outside the upload folder";

export interface WriteOutsideAttempt {
	attempt: Observation;
	writtenOutside: boolean;
	filesInUploadRoot: string[];
}

// EN: The same trick on the write side: the name of the upload walks out of the folder. The
//     result is read from the disk, not from the answer, so the test sees what really happened.
// PT: O mesmo truque no lado da escrita: o nome do upload sai da pasta. O resultado é lido do
//     disco, não da resposta, então o teste vê o que realmente aconteceu.
export async function writeOutsideUploadFolder(lab: Lab): Promise<WriteOutsideAttempt> {
	const attempt = await upload(
		lab,
		TOKENS.bob,
		`../private/${PLANTED_FILE_NAME}`,
		"text/plain",
		textBytes(PLANTED_CONTENT),
	);
	return {
		attempt,
		writtenOutside: existsSync(join(lab.privateDir, PLANTED_FILE_NAME)),
		filesInUploadRoot: await readdir(lab.uploadRoot),
	};
}

export const SHARED_NAME = "report.txt";
export const ALICE_CONTENT = "alice-fake: fake quarterly report\n";
export const BOB_CONTENT = "replaced by bob-fake\n";

export interface OverwriteAttempt {
	aliceUpload: Observation;
	bobUpload: Observation;
	aliceReadsBack: Observation;
}

// EN: alice-fake uploads `report.txt`. bob-fake uploads a different file with the same name.
//     Then alice-fake downloads hers again, with the reference she received.
// PT: alice-fake envia `report.txt`. bob-fake envia outro arquivo com o mesmo nome. Depois
//     alice-fake baixa o dela de novo, com a referência que recebeu.
export async function overwriteOtherUsersFile(lab: Lab): Promise<OverwriteAttempt> {
	const aliceUpload = await upload(lab, TOKENS.alice, SHARED_NAME, "text/plain", textBytes(ALICE_CONTENT));
	const bobUpload = await upload(lab, TOKENS.bob, SHARED_NAME, "text/plain", textBytes(BOB_CONTENT));
	const aliceReadsBack = await download(lab, TOKENS.alice, encodeURIComponent(referenceOf(aliceUpload)));
	return { aliceUpload, bobUpload, aliceReadsBack };
}

export interface TypeAttempt {
	attempt: Observation;
	// EN: What the server sends when the stored file is downloaded (undefined when the upload was refused).
	// PT: O que o servidor envia quando o arquivo guardado é baixado (undefined quando o upload foi recusado).
	servedBack: Observation | undefined;
}

// EN: The bytes are an HTML page (harmless, no script) and the client declares `declaredType`.
//     With `image/png` the header lies about the content. With `text/html` it tells the truth,
//     and the question is whether the server agrees to serve pages written by its users.
// PT: Os bytes são uma página HTML (inofensiva, sem script) e o cliente declara `declaredType`.
//     Com `image/png` o cabeçalho mente sobre o conteúdo. Com `text/html` ele diz a verdade, e a
//     pergunta é se o servidor aceita servir páginas escritas pelos próprios usuários.
export async function uploadHtmlDeclaredAs(lab: Lab, declaredType: string): Promise<TypeAttempt> {
	const attempt = await upload(lab, TOKENS.bob, "picture.png", declaredType, SAMPLE_HTML);
	const reference = referenceOf(attempt);
	const servedBack =
		attempt.status === 201 ? await download(lab, TOKENS.bob, encodeURIComponent(reference)) : undefined;
	return { attempt, servedBack };
}

// EN: One byte over the limit of the fixed version. Not a flood: a single request of about 1 MiB.
// PT: Um byte acima do limite da versão corrigida. Não é uma enxurrada: uma única requisição de
//     cerca de 1 MiB.
export function uploadOverTheLimit(lab: Lab): Promise<Observation> {
	const body = new Uint8Array(lab.maxBytes + 1).fill(0x61);
	return upload(lab, TOKENS.bob, "big.txt", "text/plain", body);
}

// EN: A symbolic link is a file that only points to another path. Here the stored file of
//     bob-fake is replaced, directly on disk, by a link to the fake secret outside the folder.
//     This stands for any way a link could end up in the folder (an archive extracted there, a
//     mistake of an operator). The request itself is perfectly well formed.
// PT: Um link simbólico é um arquivo que só aponta para outro caminho. Aqui o arquivo guardado do
//     bob-fake é substituído, direto no disco, por um link para o segredo falso fora da pasta.
//     Isso representa qualquer jeito de um link ir parar na pasta (um arquivo compactado extraído
//     ali, um erro de operação). A requisição em si é perfeitamente bem formada.
export async function readThroughSymlink(lab: Lab): Promise<Observation> {
	const uploaded = await upload(lab, TOKENS.bob, "notes.txt", "text/plain", textBytes("bob-fake notes\n"));
	const reference = referenceOf(uploaded);
	const storedPath = join(lab.uploadRoot, reference);
	await rm(storedPath);
	await symlink(join(lab.privateDir, SECRET_FILE_NAME), storedPath);
	return download(lab, TOKENS.bob, encodeURIComponent(reference));
}

export interface RoundTrip {
	label: string;
	sent: Uint8Array;
	upload: Observation;
	download: Observation;
}

// EN: A fix that refuses everything is not a fix. This is the legitimate use that must keep
//     working: alice-fake uploads a text file, a PNG and a PDF and downloads each one again.
// PT: Uma correção que recusa tudo não é correção. Este é o uso legítimo que precisa continuar
//     funcionando: alice-fake envia um texto, um PNG e um PDF e baixa cada um de novo.
export async function normalUse(lab: Lab): Promise<RoundTrip[]> {
	const files = [
		{ label: "text", name: "report.txt", type: "text/plain", bytes: SAMPLE_TEXT },
		{ label: "png", name: "chart.png", type: "image/png", bytes: SAMPLE_PNG },
		{ label: "pdf", name: "contract.pdf", type: "application/pdf", bytes: SAMPLE_PDF },
	];
	const trips: RoundTrip[] = [];
	for (const file of files) {
		const uploaded = await upload(lab, TOKENS.alice, file.name, file.type, file.bytes);
		const downloaded = await download(lab, TOKENS.alice, encodeURIComponent(referenceOf(uploaded)));
		trips.push({ label: file.label, sent: file.bytes, upload: uploaded, download: downloaded });
	}
	return trips;
}
