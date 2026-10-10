// EN: `bun run demo` prints the receipt of every shared scenario, computed by the version with
//     objects, and says whether the version with functions produced exactly the same receipt.
// PT: `bun run demo` imprime o recibo de cada cenário compartilhado, calculado pela versão com
//     objetos, e diz se a versão com funções produziu exatamente o mesmo recibo.
// ES: `bun run demo` imprime el recibo de cada escenario compartido, calculado por la versión con
//     objetos, e indica si la versión con funciones produjo exactamente el mismo recibo.

import { formatOutcome, runWithFunctions, runWithObjects } from "./run";
import { loadScenarios } from "./scenarios";

let different = 0;
for (const scenario of loadScenarios()) {
	const objects = runWithObjects(scenario);
	const functions = runWithFunctions(scenario);
	const same = JSON.stringify(objects) === JSON.stringify(functions);
	different += same ? 0 : 1;
	console.log(`== ${scenario.name}`);
	console.log(formatOutcome(objects));
	console.log(`  objects and functions agree: ${same ? "yes" : "NO"}`);
}
process.exit(different === 0 ? 0 : 1);
