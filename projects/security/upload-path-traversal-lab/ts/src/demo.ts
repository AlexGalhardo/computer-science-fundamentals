// EN: The walk-through: `docker compose run --rm demo`. It runs the same attempts against the
//     vulnerable API and then against the fixed one, and prints what each server answered.
//     Everything happens inside this container, in temporary folders that are removed at the end.
// PT: O passo a passo: `docker compose run --rm demo`. Executa as mesmas tentativas contra a API
//     vulnerável e depois contra a corrigida, e imprime o que cada servidor respondeu. Tudo
//     acontece dentro deste contêiner, em pastas temporárias que são removidas no fim.

import {
	ENCODED_TRAVERSAL_NAME,
	normalUse,
	overwriteOtherUsersFile,
	readOutsideUploadFolder,
	readThroughSymlink,
	TRAVERSAL_NAME,
	uploadHtmlDeclaredAs,
	uploadOverTheLimit,
	type Version,
	withLab,
	writeOutsideUploadFolder,
} from "./scenario";

function line(text = ""): void {
	console.log(text);
}

function verdict(status: number): string {
	return status < 300 ? "ACCEPTED / ACEITO" : "BLOCKED / BLOQUEADO";
}

async function walkThrough(version: Version): Promise<void> {
	line();
	line(`=== ${version.toUpperCase()} API ===`);
	line("Disk of the lab / Disco do laboratório:");
	line("  <tmp>/uploads/                  upload folder / pasta de uploads");
	line("  <tmp>/private/FAKE-SECRET.txt   outside it / fora dela");
	line();

	const read = await withLab(version, (lab) => readOutsideUploadFolder(lab, TRAVERSAL_NAME));
	line(`1. bob-fake: GET /download?file=${TRAVERSAL_NAME}`);
	line(`   -> ${read.status} ${verdict(read.status)}, body / corpo: ${JSON.stringify(read.text)}`);

	const encoded = await withLab(version, (lab) => readOutsideUploadFolder(lab, ENCODED_TRAVERSAL_NAME));
	line(`2. bob-fake: GET /download?file=${ENCODED_TRAVERSAL_NAME}`);
	line(`   -> ${encoded.status} ${verdict(encoded.status)}, body / corpo: ${JSON.stringify(encoded.text)}`);

	const write = await withLab(version, writeOutsideUploadFolder);
	line("3. bob-fake: POST /upload?name=../private/planted-by-bob-fake.txt");
	line(`   -> ${write.attempt.status}, written outside the folder / gravado fora da pasta: ${write.writtenOutside}`);
	line(`   files in uploads/ / arquivos em uploads/: ${JSON.stringify(write.filesInUploadRoot)}`);

	const overwrite = await withLab(version, overwriteOtherUsersFile);
	line("4. alice-fake uploads report.txt, then bob-fake uploads another report.txt");
	line("   alice-fake envia report.txt, depois bob-fake envia outro report.txt");
	line(`   alice-fake downloads hers / baixa o dela: ${JSON.stringify(overwrite.aliceReadsBack.text)}`);

	const mismatch = await withLab(version, (lab) => uploadHtmlDeclaredAs(lab, "image/png"));
	line("5. bob-fake uploads HTML bytes declared as image/png / envia bytes HTML declarados como image/png");
	line(`   -> ${mismatch.attempt.status} ${verdict(mismatch.attempt.status)}`);

	const page = await withLab(version, (lab) => uploadHtmlDeclaredAs(lab, "text/html"));
	line("6. bob-fake uploads the same bytes declared as text/html / envia os mesmos bytes como text/html");
	line(`   -> ${page.attempt.status} ${verdict(page.attempt.status)}`);
	if (page.servedBack !== undefined) {
		line(`   served back with / devolvido com: Content-Type: ${page.servedBack.headers.get("content-type")}`);
		line(
			`   X-Content-Type-Options: ${page.servedBack.headers.get("x-content-type-options") ?? "(absent / ausente)"}`,
		);
	}

	const big = await withLab(version, uploadOverTheLimit);
	line(`7. bob-fake uploads 1 MiB + 1 byte / envia 1 MiB + 1 byte -> ${big.status} ${verdict(big.status)}`);

	const link = await withLab(version, readThroughSymlink);
	line("8. A symbolic link in uploads/ points to the secret / Um link simbólico em uploads/ aponta para o segredo");
	line(`   -> ${link.status} ${verdict(link.status)}, body / corpo: ${JSON.stringify(link.text)}`);

	const trips = await withLab(version, normalUse);
	line("9. Normal use / Uso normal: alice-fake uploads and downloads a text, a PNG and a PDF");
	for (const trip of trips) {
		line(
			`   ${trip.label}: upload ${trip.upload.status}, download ${trip.download.status}, ` +
				`Content-Type: ${trip.download.headers.get("content-type")}, ` +
				`Content-Disposition: ${trip.download.headers.get("content-disposition") ?? "(absent / ausente)"}`,
		);
	}
}

line("upload-path-traversal-lab: file names and types sent by the client cannot be trusted");
line("upload-path-traversal-lab: nomes e tipos de arquivo enviados pelo cliente não são confiáveis");

await walkThrough("vulnerable");
line();
line("EN: The vulnerable API joins the client's name to the upload folder and uses the result.");
line("    The client chose where the server reads and writes, which type it serves and how much it stores.");
line("PT: A API vulnerável junta o nome do cliente à pasta de uploads e usa o resultado.");
line("    O cliente escolheu onde o servidor lê e escreve, que tipo ele serve e quanto ele guarda.");

await walkThrough("fixed");
line();
line("EN: Same requests. The server now generates the name on disk, finds files by id in an index,");
line("    checks the canonical path, detects the type from the bytes, counts the size while reading,");
line("    and serves every file as an attachment with nosniff.");
line("PT: Mesmas requisições. O servidor agora gera o nome no disco, encontra arquivos por id em um");
line("    índice, confere o caminho canônico, detecta o tipo pelos bytes, conta o tamanho durante a");
line("    leitura, e serve todo arquivo como anexo com nosniff.");
