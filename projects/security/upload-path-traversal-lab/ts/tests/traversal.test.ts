// EN: Path traversal, on the read side and on the write side. The same scenario functions run
//     against both versions. Against the vulnerable API the tests assert that the flaw is
//     observable (MP-SEC-8.1). Against the fixed API they assert that the same attempt is blocked
//     (MP-SEC-8.2). Every test gets its own temporary folder, and the file that is read "from
//     outside" is a fake secret created by the lab itself.
// PT: Path traversal, no lado da leitura e no lado da escrita. As mesmas funções de cenário rodam
//     contra as duas versões. Contra a API vulnerável os testes afirmam que a falha é observável
//     (MP-SEC-8.1). Contra a corrigida, afirmam que a mesma tentativa é bloqueada (MP-SEC-8.2).
//     Cada teste ganha a própria pasta temporária, e o arquivo lido "de fora" é um segredo falso
//     criado pelo próprio laboratório.

import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SECRET_CONTENT, SECRET_FILE_NAME, TOKENS, textBytes } from "../src/data";
import {
	ALICE_CONTENT,
	BOB_CONTENT,
	download,
	ENCODED_TRAVERSAL_NAME,
	overwriteOtherUsersFile,
	PLANTED_CONTENT,
	PLANTED_FILE_NAME,
	readOutsideUploadFolder,
	readThroughSymlink,
	referenceOf,
	TRAVERSAL_NAME,
	upload,
	withLab,
	writeOutsideUploadFolder,
} from "../src/scenario";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// EN: Creating a symbolic link needs a special permission on Windows. The lab runs in a Linux
//     container, where it always works, so these tests are skipped only on a Windows host.
// PT: Criar um link simbólico exige uma permissão especial no Windows. O laboratório roda em um
//     contêiner Linux, onde sempre funciona, então estes testes são pulados só em um host Windows.
const NO_SYMLINKS = process.platform === "win32";

describe("vulnerable API: the flaw is observable", () => {
	test("a download name with ../ reads a file outside the upload folder", async () => {
		const read = await withLab("vulnerable", (lab) => readOutsideUploadFolder(lab, TRAVERSAL_NAME));
		expect(read.status).toBe(200);
		expect(read.text).toBe(SECRET_CONTENT);
	});

	test("the percent-encoded form of the same name reads the same file", async () => {
		const read = await withLab("vulnerable", (lab) => readOutsideUploadFolder(lab, ENCODED_TRAVERSAL_NAME));
		expect(read.status).toBe(200);
		expect(read.text).toBe(SECRET_CONTENT);
	});

	test("an upload name with ../ writes a file outside the upload folder", async () => {
		await withLab("vulnerable", async (lab) => {
			const write = await writeOutsideUploadFolder(lab);
			expect(write.attempt.status).toBe(201);
			expect(write.writtenOutside).toBe(true);
			expect(write.filesInUploadRoot).toEqual([]);
			expect(await readFile(join(lab.privateDir, PLANTED_FILE_NAME), "utf8")).toBe(PLANTED_CONTENT);
		});
	});

	test("a second upload with the same name replaces the file of another user", async () => {
		const overwrite = await withLab("vulnerable", overwriteOtherUsersFile);
		expect(overwrite.bobUpload.status).toBe(201);
		expect(overwrite.aliceReadsBack.status).toBe(200);
		expect(overwrite.aliceReadsBack.text).toBe(BOB_CONTENT);
	});

	test.skipIf(NO_SYMLINKS)("a symbolic link inside the upload folder is followed to the outside", async () => {
		const read = await withLab("vulnerable", readThroughSymlink);
		expect(read.status).toBe(200);
		expect(read.text).toBe(SECRET_CONTENT);
	});
});

describe("fixed API: the same attempts are blocked", () => {
	test("a download name with ../ is refused, and the secret is not in the answer", async () => {
		const read = await withLab("fixed", (lab) => readOutsideUploadFolder(lab, TRAVERSAL_NAME));
		expect(read.status).toBe(400);
		expect(read.json).toEqual({ error: "invalid_id" });
		expect(read.text).not.toContain(SECRET_CONTENT);
	});

	test("the percent-encoded form (%2e%2e%2f) is refused the same way", async () => {
		const read = await withLab("fixed", (lab) => readOutsideUploadFolder(lab, ENCODED_TRAVERSAL_NAME));
		expect(read.status).toBe(400);
		expect(read.json).toEqual({ error: "invalid_id" });
		expect(read.text).not.toContain(SECRET_CONTENT);
	});

	test("an upload name with ../ writes nothing outside: the file lands in the folder under a generated id", async () => {
		await withLab("fixed", async (lab) => {
			const write = await writeOutsideUploadFolder(lab);
			expect(write.attempt.status).toBe(201);
			expect(write.writtenOutside).toBe(false);
			expect(write.filesInUploadRoot).toHaveLength(1);
			expect(write.filesInUploadRoot[0]).toMatch(UUID);
			expect(write.filesInUploadRoot[0]).toBe(referenceOf(write.attempt));

			// EN: The original name survives only as a label, reduced to its last segment.
			// PT: O nome original sobrevive só como rótulo, reduzido ao último segmento.
			const back = await download(lab, TOKENS.bob, referenceOf(write.attempt));
			expect(back.text).toBe(PLANTED_CONTENT);
			expect(back.headers.get("content-disposition")).toBe(
				`attachment; filename="${PLANTED_FILE_NAME}"; filename*=UTF-8''${PLANTED_FILE_NAME}`,
			);
		});
	});

	test("two uploads with the same name get different ids, so nobody's file is replaced", async () => {
		const overwrite = await withLab("fixed", overwriteOtherUsersFile);
		expect(overwrite.aliceUpload.status).toBe(201);
		expect(overwrite.bobUpload.status).toBe(201);
		expect(referenceOf(overwrite.bobUpload)).not.toBe(referenceOf(overwrite.aliceUpload));
		expect(overwrite.aliceReadsBack.status).toBe(200);
		expect(overwrite.aliceReadsBack.text).toBe(ALICE_CONTENT);
	});

	test.skipIf(NO_SYMLINKS)("a symbolic link inside the upload folder pointing outside is not followed", async () => {
		const read = await withLab("fixed", readThroughSymlink);
		expect(read.status).toBe(404);
		expect(read.json).toEqual({ error: "not_found" });
		expect(read.text).not.toContain(SECRET_CONTENT);
	});
});

describe("fixed API: downloads go by id through the index", () => {
	// EN: Hand-picked malformed references. Each one fails the UUID shape before any path exists.
	// PT: Referências malformadas escolhidas à mão. Cada uma falha no formato de UUID antes de
	//     existir qualquer caminho.
	test.each(["report.txt", SECRET_FILE_NAME, ""])("the reference %p is refused with 400", async (reference) => {
		const read = await withLab("fixed", (lab) => download(lab, TOKENS.bob, reference));
		expect(read.status).toBe(400);
	});

	test("a well-formed id that is not in the index is 404, even when a file with that name is on disk", async () => {
		await withLab("fixed", async (lab) => {
			const id = "0b0f8f3e-6d3c-4a51-9d55-7c1f1a2b3c4d";
			await Bun.write(join(lab.uploadRoot, id), "placed on disk by the test, never uploaded");
			const read = await download(lab, TOKENS.bob, id);
			expect(read.status).toBe(404);
		});
	});

	test("the id of another user's file answers the same 404 as a missing one", async () => {
		await withLab("fixed", async (lab) => {
			const uploaded = await upload(lab, TOKENS.alice, "report.txt", "text/plain", textBytes(ALICE_CONTENT));
			const asBob = await download(lab, TOKENS.bob, referenceOf(uploaded));
			const asAlice = await download(lab, TOKENS.alice, referenceOf(uploaded));
			expect(asBob.status).toBe(404);
			expect(asBob.text).not.toContain(ALICE_CONTENT);
			expect(asAlice.status).toBe(200);
		});
	});
});

describe.each(["vulnerable", "fixed"] as const)("%s API: a session is required", (version) => {
	test("upload and download without a token are 401", async () => {
		await withLab(version, async (lab) => {
			const noTokenDownload = await lab.app.handle(new Request("http://lab.invalid/download?file=report.txt"));
			const noTokenUpload = await lab.app.handle(
				new Request("http://lab.invalid/upload?name=report.txt", {
					method: "POST",
					headers: { "content-type": "text/plain" },
					body: "x",
				}),
			);
			expect(noTokenDownload.status).toBe(401);
			expect(noTokenUpload.status).toBe(401);
		});
	});
});
