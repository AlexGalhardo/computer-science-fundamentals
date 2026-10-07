// EN: The two pure building blocks of the fix, tested alone, without HTTP: the canonical path
//     check and the detection of the type from the leading bytes.
// PT: Os dois blocos puros da correção, testados sozinhos, sem HTTP: a verificação de caminho
//     canônico e a detecção do tipo pelos primeiros bytes.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { SAMPLE_HTML, SAMPLE_PDF, SAMPLE_PNG, SAMPLE_TEXT, SECRET_CONTENT, SECRET_FILE_NAME } from "../src/data";
import { detectType } from "../src/fixed/fixed-file-type";
import { realPathInsideRoot, resolveInsideRoot } from "../src/fixed/fixed-paths";

const NO_SYMLINKS = process.platform === "win32";

describe("resolveInsideRoot: the text of the path", () => {
	const root = resolve("lab-root", "uploads");

	test("a plain name stays inside the root", () => {
		expect(resolveInsideRoot(root, "report.txt")).toBe(join(root, "report.txt"));
	});

	test("a name that walks out with ../ is refused", () => {
		expect(resolveInsideRoot(root, `../private/${SECRET_FILE_NAME}`)).toBeNull();
	});

	test("an absolute path is refused: it replaces the root instead of extending it", () => {
		expect(resolveInsideRoot(root, resolve("lab-root", "private", SECRET_FILE_NAME))).toBeNull();
	});

	test("the root itself is refused: a file is asked for, not the folder", () => {
		expect(resolveInsideRoot(root, ".")).toBeNull();
	});

	test("a sibling folder whose name only starts like the root is refused", () => {
		expect(resolveInsideRoot(root, "../uploads-old/report.txt")).toBeNull();
	});

	test("a name that leaves and comes back is judged by where it ends", () => {
		expect(resolveInsideRoot(root, "../uploads/report.txt")).toBe(join(root, "report.txt"));
	});
});

describe("realPathInsideRoot: the path on disk", () => {
	let dir = "";
	let root = "";

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), "upload-path-traversal-lab-paths-"));
		root = join(dir, "uploads");
		await mkdir(root);
		await mkdir(join(dir, "private"));
		await writeFile(join(dir, "private", SECRET_FILE_NAME), SECRET_CONTENT);
		await writeFile(join(root, "report.txt"), "inside");
		if (!NO_SYMLINKS) {
			await symlink(join(dir, "private", SECRET_FILE_NAME), join(root, "link-out.txt"));
			await symlink(join(root, "report.txt"), join(root, "link-in.txt"));
		}
	});

	afterAll(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test("an existing file inside the root is returned in its canonical form", async () => {
		expect(await realPathInsideRoot(root, "report.txt")).toBe(await realpath(join(root, "report.txt")));
	});

	test("a file that does not exist is refused", async () => {
		expect(await realPathInsideRoot(root, "missing.txt")).toBeNull();
	});

	test("a name with ../ is refused before the disk is touched", async () => {
		expect(await realPathInsideRoot(root, `../private/${SECRET_FILE_NAME}`)).toBeNull();
	});

	test.skipIf(NO_SYMLINKS)("a symbolic link that points outside the root is refused", async () => {
		expect(await realPathInsideRoot(root, "link-out.txt")).toBeNull();
	});

	test.skipIf(NO_SYMLINKS)("a symbolic link that points inside the root resolves to its target", async () => {
		expect(await realPathInsideRoot(root, "link-in.txt")).toBe(await realpath(join(root, "report.txt")));
	});
});

describe("detectType: the type comes from the leading bytes", () => {
	test("the three allowed types are recognised", () => {
		expect(detectType(SAMPLE_PNG)).toBe("image/png");
		expect(detectType(SAMPLE_PDF)).toBe("application/pdf");
		expect(detectType(SAMPLE_TEXT)).toBe("text/plain");
	});

	test("HTML is just text to the detector: it is never given an active type", () => {
		expect(detectType(SAMPLE_HTML)).toBe("text/plain");
	});

	test("empty content, unknown binary content and invalid UTF-8 match nothing", () => {
		expect(detectType(new Uint8Array())).toBeNull();
		expect(detectType(new Uint8Array([0x00, 0x01, 0x02, 0x03]))).toBeNull();
		expect(detectType(new Uint8Array([0x61, 0xff, 0xfe, 0x62]))).toBeNull();
	});

	test("a truncated signature is not a PNG", () => {
		expect(detectType(SAMPLE_PNG.slice(0, 4))).toBeNull();
	});
});
