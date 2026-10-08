// Usage: bun merge-es.ts <topic.json> <translations.json>
// <translations.json> is an object { "<question id>": { statement, alternatives, explanations, concept, snippet?, example? } }.
// The Spanish block is inserted as "es" right after "en". Existing "es" blocks are replaced.
import { readFileSync, writeFileSync } from "node:fs";

const [topicPath, esPath] = process.argv.slice(2);
if (!topicPath || !esPath) {
	console.error("usage: bun merge-es.ts <topic.json> <translations.json>");
	process.exit(2);
}
type Block = Record<string, unknown>;
const questions = JSON.parse(readFileSync(topicPath, "utf8")) as Block[];
const translations = JSON.parse(readFileSync(esPath, "utf8")) as Record<string, Block>;
const problems: string[] = [];
const out = questions.map((question) => {
	const id = String(question.id);
	const es = translations[id] ?? (question.es as Block | undefined);
	if (es === undefined) {
		problems.push(`${id}: no Spanish block`);
		return question;
	}
	const en = question.en as Block;
	for (const field of ["alternatives", "explanations"]) {
		if (!Array.isArray(es[field]) || (es[field] as unknown[]).length !== 5) problems.push(`${id}: es.${field} must have 5 items`);
	}
	for (const field of ["statement", "concept"]) {
		if (typeof es[field] !== "string" || (es[field] as string).trim() === "") problems.push(`${id}: es.${field} missing`);
	}
	for (const field of ["snippet", "example"]) {
		if ((en[field] === undefined) !== (es[field] === undefined)) problems.push(`${id}: es.${field} must match en`);
	}
	const ordered: Block = {};
	for (const [key, value] of Object.entries(question)) {
		if (key === "es") continue;
		ordered[key] = value;
		if (key === "en") ordered.es = es;
	}
	return ordered;
});
for (const id of Object.keys(translations)) {
	if (!questions.some((question) => question.id === id)) problems.push(`${id}: unknown id in translations`);
}
if (problems.length > 0) {
	console.error(problems.join("\n"));
	process.exit(1);
}
writeFileSync(topicPath, `${JSON.stringify(out, null, "\t")}\n`);
console.log(`${topicPath}: ${out.length} questions with Spanish`);
