// Usage: bun .claude/scripts/check-es.ts <path> [<path> ...]
// Reports every place under the given paths that has Portuguese but no Spanish:
//   - a README.pt-BR.md with no README.es.md next to it
//   - a docs/pt/<page> with no docs/es/<page>
//   - a `PT:` comment block that is not followed by an `ES:` block
//   - a Markdown language line that links the Portuguese version but not the Spanish one
// Exit code 1 when anything is missing.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

const SKIPPED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".lock", ".lockb", ".csv", ".pdf", ".woff2", ".wasm", ".log"]);
const SKIPPED_PREFIXES = ["quiz/content/", ".claude/", ".playwright-mcp/", "docs/"];
const MARKER = /(?<![A-Za-z0-9_])(EN|PT|ES):(?=\s)/g;

const paths = process.argv.slice(2);
if (paths.length === 0) {
	console.error("usage: bun .claude/scripts/check-es.ts <path> [<path> ...]");
	process.exit(2);
}
const listed = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "--", ...paths], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const files = listed.stdout.split("\n").filter((file) => file !== "" && existsSync(file));
const problems: string[] = [];

for (const file of files) {
	const name = basename(file);
	if (name === "README.pt-BR.md" && !existsSync(join(dirname(file), "README.es.md"))) problems.push(`${file}: no README.es.md next to it`);
	if (file.startsWith("docs/pt/") && !existsSync(file.replace("docs/pt/", "docs/es/"))) problems.push(`${file}: no ${file.replace("docs/pt/", "docs/es/")}`);
	if (SKIPPED_EXTENSIONS.has(extname(file).toLowerCase()) || statSync(file).size > 1_000_000) continue;
	const text = readFileSync(file, "utf8");
	if (extname(file) === ".md") {
		const head = text.split("\n").slice(0, 12).join("\n");
		if (/Versão em português|English version/.test(head) && !/español|Español/.test(head) && !/(^|[.-])es.md$/.test(name) && !file.startsWith("docs/es/")) {
			problems.push(`${file}: language line does not link the Spanish version`);
		}
		if ((name === "README.es.md" || file.startsWith("docs/es/")) && !/English version/.test(head)) problems.push(`${file}: no language line`);
		continue;
	}
	if (SKIPPED_PREFIXES.some((prefix) => file.startsWith(prefix)) || extname(file) === ".json") continue;
	const lines = text.split("\n");
	let pendingLine = 0;
	lines.forEach((line, index) => {
		for (const match of line.matchAll(MARKER)) {
			if (match[1] === "ES") pendingLine = 0;
			else {
				if (pendingLine > 0) problems.push(`${file}:${pendingLine}: PT block with no ES block after it`);
				pendingLine = match[1] === "PT" ? index + 1 : 0;
			}
		}
	});
	if (pendingLine > 0) problems.push(`${file}:${pendingLine}: PT block with no ES block after it`);
}

if (problems.length > 0) {
	console.log(problems.join("\n"));
	console.log(`\n${problems.length} problem(s) in ${files.length} file(s)`);
	process.exit(1);
}
console.log(`ok: ${files.length} file(s), Spanish is present everywhere Portuguese is`);
