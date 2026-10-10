// EN: `bun run quiz:validate [area] [--strict] [--content <dir>]`
//     Prints, per area and per topic, the target against the actual number of questions, and
//     exits with a non-zero code when any rule is broken. `--strict` also fails when an area or
//     a topic is below its target, which is the gate used before an area is declared done.
// PT: `bun run quiz:validate [area] [--strict] [--content <dir>]`
//     Mostra, por área e por tópico, a meta contra o número real de questões, e termina com
//     código diferente de zero quando alguma regra é quebrada. `--strict` também falha quando uma
//     área ou tópico está abaixo da meta, que é o portão usado antes de dar uma área como pronta.
// ES: `bun run quiz:validate [area] [--strict] [--content <dir>]`
//     Muestra, por área y por tema, la meta frente al número real de preguntas, y termina con
//     código distinto de cero cuando se rompe alguna regla. `--strict` también falla cuando un
//     área o tema está por debajo de la meta, que es la puerta usada antes de dar un área por lista.

import { join, resolve } from "node:path";
import { checkContent } from "../src/content/check";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const contentFlag = args.indexOf("--content");
const repoRoot = resolve(import.meta.dir, "..", "..");
const contentDir = contentFlag >= 0 ? resolve(args[contentFlag + 1] ?? "") : join(repoRoot, "quiz", "content");
const only = args.find((arg, index) => !arg.startsWith("--") && (contentFlag < 0 || index !== contentFlag + 1));

const result = checkContent({ contentDir, repoRoot, only, requireTargets: strict });

for (const area of result.areas) {
	const { basic, intermediate, advanced } = area.difficulty;
	console.log(
		`\n${area.area}: ${area.actual}/${area.target}  (basic ${basic}, intermediate ${intermediate}, advanced ${advanced})`,
	);
	for (const topic of area.topics) {
		const mark = topic.actual >= topic.target ? "ok " : "-- ";
		console.log(`  ${mark}${topic.slug}: ${topic.actual}/${topic.target}`);
	}
}

for (const warning of result.warnings) {
	console.warn(`warning: ${warning}`);
}
for (const error of result.errors) {
	console.error(`error: ${error}`);
}

const total = result.areas.reduce((sum, area) => sum + area.actual, 0);
console.log(`\n${total} questions, ${result.errors.length} errors, ${result.warnings.length} warnings`);
process.exit(result.errors.length > 0 ? 1 : 0);
