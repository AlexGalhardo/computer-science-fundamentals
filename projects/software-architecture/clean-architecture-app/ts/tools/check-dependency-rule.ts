// EN: `bun run check:layers [src folder]`. Prints one line per layer and exits with code 1
//     when any import points outward, which is what makes the build fail.
// PT: `bun run check:layers [pasta src]`. Mostra uma linha por camada e termina com código 1
//     quando algum import aponta para fora, que é o que faz o build falhar.
// ES: `bun run check:layers [carpeta src]`. Muestra una línea por capa y termina con código 1
//     cuando algún import apunta hacia afuera, que es lo que hace fallar el build.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Glob } from "bun";
import { checkFiles, LAYERS, type SourceFile } from "./dependency-rule";

const srcDir = resolve(process.argv[2] ?? join(import.meta.dir, "..", "src"));
const files: SourceFile[] = [];
for (const path of new Glob("**/*.ts").scanSync({ cwd: srcDir })) {
	files.push({ path: path.replaceAll("\\", "/"), source: readFileSync(join(srcDir, path), "utf8") });
}

if (files.length === 0) {
	console.error(`no TypeScript file found in ${srcDir}`);
	process.exit(2);
}

const violations = checkFiles(files);
for (const layer of LAYERS) {
	const count = files.filter((file) => file.path.startsWith(`${layer}/`)).length;
	const broken = violations.filter((violation) => violation.file.startsWith(`${layer}/`)).length;
	console.log(`${broken === 0 ? "ok  " : "FAIL"} ${layer.padEnd(10)} ${count} files, ${broken} violations`);
}
for (const violation of violations) {
	const what = violation.specifier === "" ? "" : ` imports "${violation.specifier}":`;
	console.error(`${violation.file}:${violation.line}${what} ${violation.reason}`);
}

if (violations.length > 0) {
	console.error(`\ndependency rule broken: ${violations.length} violation(s)`);
	process.exit(1);
}
console.log("\ndependency rule holds: every import points inward");
