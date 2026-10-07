import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffold } from "../src/cli";
import { LANGUAGES } from "../src/templates";

function generate(langs: string[]): string {
	const outRoot = mkdtempSync(join(tmpdir(), "scaffold-"));
	return scaffold({ area: "sample-area", name: "sample-project", langs, outRoot, dashboard: false });
}

test("creates the READMEs, the setup scripts, the compose file and one folder per language", () => {
	const dir = generate(["ts", "go"]);
	for (const file of [
		"README.md",
		"README.pt-BR.md",
		"docker-compose.yml",
		"setup-unix-sample-project.sh",
		"setup-windows-sample-project.ps1",
		"ts/Dockerfile",
		"ts/tests/add.test.ts",
		"go/Dockerfile",
		"go/add_test.go",
	]) {
		expect(existsSync(join(dir, file))).toBe(true);
	}
	expect(existsSync(join(dir, "rust"))).toBe(false);
	const compose = readFileSync(join(dir, "docker-compose.yml"), "utf8");
	expect(compose).toContain("ts-test:");
	expect(compose).toContain("go-test:");
});

test("every language template uses a pinned image, never latest", () => {
	const dir = generate([...LANGUAGES]);
	for (const lang of LANGUAGES) {
		const dockerfile = readFileSync(join(dir, lang, "Dockerfile"), "utf8");
		const from = dockerfile.split("\n")[0] ?? "";
		expect(from).toMatch(/^FROM \S+:\d+\.\d+/);
		expect(from).not.toContain("latest");
	}
});

test("the PowerShell script uses CRLF and the shell script uses LF", () => {
	const dir = generate(["ts"]);
	expect(readFileSync(join(dir, "setup-windows-sample-project.ps1"), "utf8")).toContain("\r\n");
	expect(readFileSync(join(dir, "setup-unix-sample-project.sh"), "utf8")).not.toContain("\r");
});

test("rejects an unknown language, a bad name and an existing folder", () => {
	const outRoot = mkdtempSync(join(tmpdir(), "scaffold-"));
	const base = { area: "a", name: "b", outRoot, dashboard: false };
	expect(() => scaffold({ ...base, langs: ["cobol"] })).toThrow();
	expect(() => scaffold({ ...base, name: "Bad Name", langs: ["ts"] })).toThrow();
	scaffold({ ...base, langs: ["ts"] });
	expect(() => scaffold({ ...base, langs: ["ts"] })).toThrow("already exists");
});
