// EN: What the upload trusts: the declared type, the size, and the headers used to serve a file
//     back. Same scenario functions against both versions, plus the legitimate use that must
//     keep working after the fix.
// PT: No que o upload confia: o tipo declarado, o tamanho, e os cabeçalhos usados para devolver
//     um arquivo. As mesmas funções de cenário contra as duas versões, mais o uso legítimo que
//     precisa continuar funcionando depois da correção.
// ES: En qué confía la carga: el tipo declarado, el tamaño, y las cabeceras usadas para devolver
//     un archivo. Las mismas funciones de escenario contra las dos versiones, más el uso legítimo que
//     debe seguir funcionando después de la corrección.

import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { SAMPLE_HTML, SAMPLE_PNG, SAMPLE_TEXT, TOKENS, textBytes } from "../src/data";
import { contentDisposition } from "../src/fixed/fixed-app";
import {
	call,
	download,
	normalUse,
	referenceOf,
	upload,
	uploadHtmlDeclaredAs,
	uploadOverTheLimit,
	type Version,
	withLab,
} from "../src/scenario";

describe("vulnerable API: the flaw is observable", () => {
	test("HTML bytes declared as image/png are accepted and served back with the declared type", async () => {
		const { attempt, servedBack } = await withLab("vulnerable", (lab) => uploadHtmlDeclaredAs(lab, "image/png"));
		expect(attempt.status).toBe(201);
		expect(servedBack?.headers.get("content-type")).toBe("image/png");
		expect(servedBack?.bytes).toEqual(SAMPLE_HTML);
	});

	test("an HTML page is served back as a page of the site: text/html, no nosniff, no attachment", async () => {
		const { attempt, servedBack } = await withLab("vulnerable", (lab) => uploadHtmlDeclaredAs(lab, "text/html"));
		expect(attempt.status).toBe(201);
		expect(servedBack?.headers.get("content-type")).toBe("text/html");
		expect(servedBack?.headers.get("x-content-type-options")).toBeNull();
		expect(servedBack?.headers.get("content-disposition")).toBeNull();
	});

	test("a file over the limit of the fixed version is accepted: there is no limit", async () => {
		const attempt = await withLab("vulnerable", uploadOverTheLimit);
		expect(attempt.status).toBe(201);
	});
});

describe("fixed API: the same attempts are blocked", () => {
	test("HTML bytes declared as image/png are refused: the bytes do not match the declared type", async () => {
		await withLab("fixed", async (lab) => {
			const { attempt } = await uploadHtmlDeclaredAs(lab, "image/png");
			expect(attempt.status).toBe(415);
			expect(attempt.json).toEqual({ error: "type_mismatch" });
			expect(await readdir(lab.uploadRoot)).toEqual([]);
		});
	});

	test("text/html is refused: it is not on the allow-list", async () => {
		const { attempt } = await withLab("fixed", (lab) => uploadHtmlDeclaredAs(lab, "text/html"));
		expect(attempt.status).toBe(415);
		expect(attempt.json).toEqual({ error: "unsupported_type" });
	});

	test("a file over the limit is refused with 413 and nothing is stored", async () => {
		await withLab("fixed", async (lab) => {
			const attempt = await uploadOverTheLimit(lab);
			expect(attempt.status).toBe(413);
			expect(attempt.json).toEqual({ error: "file_too_large" });
			expect(await readdir(lab.uploadRoot)).toEqual([]);
		});
	});
});

// EN: Normal use must work on both versions: the fix removes the holes, not the feature.
// PT: O uso normal precisa funcionar nas duas versões: a correção tira os buracos, não a função.
// ES: El uso normal debe funcionar en las dos versiones: la corrección tapa los agujeros, no la función.
describe.each<Version>(["vulnerable", "fixed"])("%s API: normal use works", (version) => {
	test("a text file, a PNG and a PDF are uploaded and downloaded again, byte for byte", async () => {
		const trips = await withLab(version, normalUse);
		expect(trips.map((trip) => trip.label)).toEqual(["text", "png", "pdf"]);
		for (const trip of trips) {
			expect(trip.upload.status).toBe(201);
			expect(trip.download.status).toBe(200);
			expect(trip.download.bytes).toEqual(trip.sent);
		}
	});
});

describe("fixed API: type decided by the bytes", () => {
	test("PNG bytes declared as text/plain are refused: the rule works in both directions", async () => {
		const attempt = await withLab("fixed", (lab) => upload(lab, TOKENS.bob, "notes.txt", "text/plain", SAMPLE_PNG));
		expect(attempt.status).toBe(415);
		expect(attempt.json).toEqual({ error: "type_mismatch" });
	});

	test("a .png name and an image/png header do not make unknown bytes a PNG", async () => {
		const unknownBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
		const attempt = await withLab("fixed", (lab) =>
			upload(lab, TOKENS.bob, "chart.png", "image/png", unknownBytes),
		);
		expect(attempt.status).toBe(415);
		expect(attempt.json).toEqual({ error: "unsupported_type" });
	});

	test("HTML declared as text/plain is accepted as what it is, text, and served so that it cannot run", async () => {
		await withLab("fixed", async (lab) => {
			const uploaded = await upload(lab, TOKENS.bob, "page.html", "text/plain", SAMPLE_HTML);
			expect(uploaded.status).toBe(201);
			const back = await download(lab, TOKENS.bob, referenceOf(uploaded));
			expect(back.headers.get("content-type")).toBe("text/plain; charset=utf-8");
			expect(back.headers.get("x-content-type-options")).toBe("nosniff");
			expect(back.headers.get("content-disposition")).toStartWith("attachment;");
		});
	});

	test("an empty file is refused with 400", async () => {
		const attempt = await withLab("fixed", (lab) =>
			upload(lab, TOKENS.bob, "empty.txt", "text/plain", textBytes("")),
		);
		expect(attempt.status).toBe(400);
	});
});

describe("fixed API: size limit enforced while reading", () => {
	test("a file of exactly the limit is accepted", async () => {
		await withLab("fixed", async (lab) => {
			const body = new Uint8Array(lab.maxBytes).fill(0x61);
			const attempt = await upload(lab, TOKENS.bob, "big.txt", "text/plain", body);
			expect(attempt.status).toBe(201);
		});
	});

	// EN: The body is a stream that would deliver 64 MiB, in 64 KiB chunks, and sends no
	//     Content-Length. The server must stop pulling right after the limit, not at the end.
	// PT: O corpo é um stream que entregaria 64 MiB, em pedaços de 64 KiB, e não manda
	//     Content-Length. O servidor precisa parar de puxar logo depois do limite, não no fim.
	// ES: El cuerpo es un stream que entregaría 64 MiB, en trozos de 64 KiB, y no manda
	//     Content-Length. El servidor debe dejar de leer justo después del límite, no al final.
	test("a streamed body is cut off right after the limit, long before its end", async () => {
		await withLab("fixed", async (lab) => {
			const chunk = new Uint8Array(64 * 1024).fill(0x61);
			const totalChunks = 1024;
			let pulled = 0;
			let cancelled = false;
			const body = new ReadableStream<Uint8Array>({
				pull(controller): void {
					if (pulled === totalChunks) {
						controller.close();
						return;
					}
					pulled += 1;
					controller.enqueue(chunk);
				},
				cancel(): void {
					cancelled = true;
				},
			});
			const response = await lab.app.handle(
				new Request("http://lab.invalid/upload?name=stream.txt", {
					method: "POST",
					headers: { authorization: `Bearer ${TOKENS.bob}`, "content-type": "text/plain" },
					body,
				}),
			);
			expect(response.status).toBe(413);
			expect(cancelled).toBe(true);
			expect(pulled).toBeLessThan(totalChunks / 10);
			expect(await readdir(lab.uploadRoot)).toEqual([]);
		});
	});

	test("a Content-Length over the limit is refused before the body is read", async () => {
		await withLab("fixed", async (lab) => {
			const response = await lab.app.handle(
				new Request("http://lab.invalid/upload?name=big.txt", {
					method: "POST",
					headers: {
						authorization: `Bearer ${TOKENS.bob}`,
						"content-type": "text/plain",
						"content-length": String(lab.maxBytes + 1),
					},
					body: "small body, large claim",
				}),
			);
			expect(response.status).toBe(413);
		});
	});
});

describe("fixed API: how a stored file is served", () => {
	test("every download carries the detected type, nosniff, attachment and a locked-down CSP", async () => {
		const trips = await withLab("fixed", normalUse);
		const types = trips.map((trip) => trip.download.headers.get("content-type"));
		expect(types).toEqual(["text/plain; charset=utf-8", "image/png", "application/pdf"]);
		for (const trip of trips) {
			expect(trip.download.headers.get("x-content-type-options")).toBe("nosniff");
			expect(trip.download.headers.get("content-disposition")).toStartWith("attachment;");
			expect(trip.download.headers.get("content-security-policy")).toBe("default-src 'none'; sandbox");
		}
	});

	test("the original name comes back as metadata, safely encoded", async () => {
		await withLab("fixed", async (lab) => {
			const name = 'relatório "final" (v2).txt';
			const uploaded = await upload(lab, TOKENS.alice, name, "text/plain", SAMPLE_TEXT);
			const back = await download(lab, TOKENS.alice, referenceOf(uploaded));
			expect(back.headers.get("content-disposition")).toBe(
				`attachment; filename="relat_rio__final___v2_.txt"; filename*=UTF-8''relat%C3%B3rio%20%22final%22%20%28v2%29.txt`,
			);
		});
	});

	test("contentDisposition never lets a quote, a semicolon or a line break through", () => {
		const header = contentDisposition('a"; filename="b\r\nX-Injected: 1');
		expect(header).toBe(
			`attachment; filename="a___filename__b__X-Injected__1"; filename*=UTF-8''a%22%3B%20filename%3D%22b%0D%0AX-Injected%3A%201`,
		);
	});
});

describe("fixed API: input validation with Zod", () => {
	test("a name with a control character (a line break) is refused with 400", async () => {
		const attempt = await withLab("fixed", (lab) =>
			upload(lab, TOKENS.bob, "notes\r\n.txt", "text/plain", SAMPLE_TEXT),
		);
		expect(attempt.status).toBe(400);
		expect(attempt.json).toEqual({ error: "invalid_name" });
	});

	test("a missing name and a name longer than 255 characters are refused with 400", async () => {
		await withLab("fixed", async (lab) => {
			const options = {
				token: TOKENS.bob,
				method: "POST",
				contentType: "text/plain",
				body: SAMPLE_TEXT,
			} as const;
			const missing = await call(lab.app, "/upload", options);
			const tooLong = await upload(lab, TOKENS.bob, `${"a".repeat(256)}.txt`, "text/plain", SAMPLE_TEXT);
			expect(missing.status).toBe(400);
			expect(tooLong.status).toBe(400);
		});
	});

	test("a Content-Length that is not a number is refused with 400", async () => {
		await withLab("fixed", async (lab) => {
			const response = await lab.app.handle(
				new Request("http://lab.invalid/upload?name=notes.txt", {
					method: "POST",
					headers: {
						authorization: `Bearer ${TOKENS.bob}`,
						"content-type": "text/plain",
						"content-length": "-1",
					},
					body: "x",
				}),
			);
			expect(response.status).toBe(400);
		});
	});
});
