// EN: `bun run quiz:blind <area> [--lang en|pt|es]` writes `quiz/.review/<area>.blind.json`:
//     the questions of the area with the answer key and the explanations removed.
// PT: `bun run quiz:blind <area> [--lang en|pt|es]` escreve `quiz/.review/<area>.blind.json`:
//     as questões da área sem o gabarito e sem as explicações.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { checkContent } from "../src/content/check";
import { toBlind } from "../src/content/review";
import { LANGUAGES, type Language } from "../src/content/schema";

const args = process.argv.slice(2);
const langFlag = args.indexOf("--lang");
const language = (langFlag >= 0 ? args[langFlag + 1] : "en") as Language;
// EN: The value that follows `--lang` is not the area. Without the flag, no position is skipped.
// PT: O valor que vem depois de `--lang` não é a área. Sem a flag, nenhuma posição é pulada.
const area = args.find((arg, index) => !arg.startsWith("--") && (langFlag < 0 || index !== langFlag + 1));

if (area === undefined || !LANGUAGES.includes(language)) {
	console.error("usage: bun run quiz:blind <area> [--lang en|pt|es]");
	process.exit(2);
}

const repoRoot = resolve(import.meta.dir, "..", "..");
const result = checkContent({ contentDir: join(repoRoot, "quiz", "content"), repoRoot, only: area });
if (result.errors.length > 0) {
	for (const error of result.errors) {
		console.error(`error: ${error}`);
	}
	console.error("fix the validation errors before exporting a blind file");
	process.exit(1);
}

const questions = result.areas[0]?.questions ?? [];
const outDir = join(repoRoot, "quiz", ".review");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${area}.blind.json`);
writeFileSync(outFile, `${JSON.stringify(toBlind(questions, language), null, "\t")}\n`);
console.log(`${questions.length} questions written to ${outFile}`);
