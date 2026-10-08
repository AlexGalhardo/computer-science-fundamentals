import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkSteps, parseLog } from "../scripts/history";

// EN: HISTORY.txt is a snapshot of the real `git log` of this folder, committed with the
//     walkthrough. It lets the rhythm be checked where the git history is not available, for
//     example in a shallow clone made by a CI job. The setup script checks the live history
//     too whenever it can.
// PT: HISTORY.txt é um retrato do `git log` real desta pasta, versionado junto com o passo a
//     passo. Ele permite conferir o ritmo onde o histórico do git não está disponível, por
//     exemplo em um clone raso feito por um job de CI. O script de setup confere também o
//     histórico vivo sempre que consegue.
test("the committed snapshot of the real history follows the rhythm", () => {
	const snapshot = readFileSync(join(import.meta.dir, "..", "HISTORY.txt"), "utf8");
	const steps = parseLog(snapshot);
	expect(steps.length).toBe(27);
	expect(checkSteps(steps)).toEqual([]);
});
