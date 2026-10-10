// EN: `bun run quiz:compare <area> <answers.json> [--content <dir>] [--out <file>]`
//     Reads the reviewer's answers (`{ "<id>": 2 }` or `{ "<id>": { "answer": 2, "note": "..." } }`)
//     and writes `review.md` with every question where reviewer and answer key disagree.
// PT: `bun run quiz:compare <area> <answers.json> [--content <dir>] [--out <file>]`
//     Lê as respostas do revisor (`{ "<id>": 2 }` ou `{ "<id>": { "answer": 2, "note": "..." } }`)
//     e escreve `review.md` com toda questão em que revisor e gabarito discordam.
// ES: `bun run quiz:compare <area> <answers.json> [--content <dir>] [--out <file>]`
//     Lee las respuestas del revisor (`{ "<id>": 2 }` o `{ "<id>": { "answer": 2, "note": "..." } }`)
//     y escribe `review.md` con toda pregunta en la que revisor y clave de respuestas discrepan.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { checkContent } from "../src/content/check";
import { compareAnswers, keepHandWritten, type ReviewerAnswers, renderReview } from "../src/content/review";

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
	const index = args.indexOf(name);
	return index >= 0 ? args[index + 1] : undefined;
}
const flagValues = new Set([flag("--content"), flag("--out")]);
const [area, answersPath] = args.filter((arg) => !arg.startsWith("--") && !flagValues.has(arg));

if (area === undefined || answersPath === undefined) {
	console.error("usage: bun run quiz:compare <area> <answers.json> [--content <dir>] [--out <file>]");
	process.exit(2);
}

const repoRoot = resolve(import.meta.dir, "..", "..");
const contentDir = resolve(flag("--content") ?? join(repoRoot, "quiz", "content"));
const result = checkContent({ contentDir, repoRoot, only: area });
const questions = result.areas[0]?.questions ?? [];
const answers = JSON.parse(readFileSync(resolve(answersPath), "utf8")) as ReviewerAnswers;

const disagreements = compareAnswers(questions, answers, "en");
const outFile = resolve(flag("--out") ?? join(contentDir, area, "review.md"));
const date = new Date().toISOString().slice(0, 10);
const previous = existsSync(outFile) ? readFileSync(outFile, "utf8") : undefined;
writeFileSync(outFile, keepHandWritten(renderReview(area, questions.length, disagreements, date), previous));

console.log(`${questions.length} questions, ${disagreements.length} disagreements, written to ${outFile}`);
for (const item of disagreements) {
	console.log(`  ${item.id}: key ${item.key}, reviewer ${item.reviewer ?? "none"}`);
}
