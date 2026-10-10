// EN: `bun run demo` prints the three lessons of the mini-project, one after the other.
//     This file is part of the imperative shell: it prints, and everything it prints was
//     computed by pure functions.
// PT: `bun run demo` imprime as três lições do mini-projeto, uma depois da outra. Este
//     arquivo faz parte da casca imperativa: ele imprime, e tudo o que imprime foi calculado
//     por funções puras.
// ES: `bun run demo` imprime las tres lecciones del mini-proyecto, una tras otra. Este
//     archivo es parte del cascarón imperativo: imprime, y todo lo que imprime fue calculado
//     por funciones puras.
import cases from "../../cases.json";
import { checkoutNow, type Order, priceOrder, priceOrderImpure } from "./checkout";
import { decode, decodeBuggy, encode } from "./codec";
import { salesReport } from "./pipeline";
import { check, runString } from "./prop";

const order: Order = { items: [{ unitCents: 1500, quantity: 2 }], coupon: { percent: 10, expiresAt: 1000 } };

console.log("1. Impure and pure versions of the same rule");
console.log("   impure, same order twice:", JSON.stringify(priceOrderImpure(order)));
console.log("                            ", JSON.stringify(priceOrderImpure(order)));
console.log("   pure, now = 1000 twice:  ", JSON.stringify(priceOrder(order, 1000)));
console.log("                            ", JSON.stringify(priceOrder(order, 1000)));
console.log("   pure, now = 1001:        ", JSON.stringify(priceOrder(order, 1001)));
console.log("   shell (reads the clock): ", checkoutNow(order));

console.log("\n2. A property finds the seeded bug that the examples miss");
const examplesPass = cases.codec.examples.every(([plain, encoded]) => decodeBuggy(encoded ?? "") === plain);
console.log(
	`   ${cases.codec.examples.length} example tests against the buggy decoder: ${examplesPass ? "all pass" : "FAIL"}`,
);
const texts = runString("abc", 6, 12);
const buggy = check(texts, (text) => decodeBuggy(encode(text)) === text, { runs: 500 });
if (!buggy.ok) {
	console.log(`   round trip, buggy decoder: FAILED on run ${buggy.run} (seed ${buggy.seed})`);
	console.log(`     original counterexample: ${JSON.stringify(buggy.original)}`);
	console.log(`     shrunk in ${buggy.shrinkSteps} steps to:   ${JSON.stringify(buggy.shrunk)}`);
	console.log(
		`     encode -> ${JSON.stringify(encode(buggy.shrunk))}, buggy decode -> ${JSON.stringify(decodeBuggy(encode(buggy.shrunk)))}`,
	);
}
const fixed = check(texts, (text) => decode(encode(text)) === text, { runs: 500 });
console.log(`   round trip, fixed decoder: ${fixed.ok ? `passed ${fixed.runs} runs` : "FAILED"}`);

console.log("\n3. The same pipeline as in Elixir: paid orders -> line totals -> by category -> ranked -> top 3");
for (const row of salesReport(cases.pipeline.top)(cases.pipeline.orders)) {
	console.log(`   ${row.category.padEnd(8)} ${String(row.totalCents).padStart(6)}`);
}
