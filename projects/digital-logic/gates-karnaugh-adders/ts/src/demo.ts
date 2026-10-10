// EN: `bun run demo` prints the three lessons of the mini-project: an expression turned into a
//     truth table, a truth table minimised by Quine-McCluskey, and an addition carried out by
//     gates. With RESULTS_DIR set, the same text is written to results/results-ts.md.
// PT: `bun run demo` imprime as três lições do mini-projeto: uma expressão transformada em
//     tabela-verdade, uma tabela-verdade minimizada por Quine-McCluskey e uma soma feita por
//     portas. Com RESULTS_DIR definida, o mesmo texto é gravado em results/results-ts.md.
// ES: `bun run demo` imprime las tres lecciones del mini-proyecto: una expresión convertida en
//     tabla de verdad, una tabla de verdad minimizada por Quine-McCluskey y una suma hecha por
//     compuertas. Con RESULTS_DIR definida, el mismo texto se escribe en results/results-ts.md.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addBytes, fromBits, rippleCarryAdder, toBits } from "./adders";
import { formatTruthTable, mintermsOf, parse, truthTable } from "./expression";
import { literalCount, minimise, toExpression } from "./quine-mccluskey";

const lines: string[] = [];
const print = (text = ""): void => {
	lines.push(text);
};
const code = (text: string): void => {
	print("```text");
	print(text);
	print("```");
	print();
};

print("# gates-karnaugh-adders: demo output (TypeScript)");
print();

print("## 1. From an expression to its truth table");
print();
for (const text of ["A·B + C'", "(A + B'·C)'", "A ^ B ^ C"]) {
	const table = truthTable(parse(text));
	print(`\`${text}\` is 1 for minterms ${mintermsOf(table).join(", ")}:`);
	print();
	code(formatTruthTable(table));
}

print("## 2. Minimisation by Quine-McCluskey");
print();
print("| Function | Prime implicants | Essential | Minimal sum of products | Literals |");
print("| --- | ---: | ---: | --- | ---: |");
const cases: { variables: string[]; minterms: number[]; dontCares?: number[] }[] = [
	{ variables: ["A", "B", "C"], minterms: [0, 2, 4, 5, 6] },
	{ variables: ["A", "B", "C"], minterms: [1, 3, 7], dontCares: [5] },
	{ variables: ["A", "B", "C"], minterms: [1, 2, 4, 7] },
	{ variables: ["A", "B", "C", "D"], minterms: [0, 2, 5, 7, 8, 10, 13, 15] },
	{ variables: ["A", "B", "C", "D"], minterms: [0, 1, 2, 5, 8, 9, 10] },
	{ variables: ["A", "B", "C", "D"], minterms: [1, 3, 5, 7, 9], dontCares: [10, 11, 12, 13, 14, 15] },
];
for (const item of cases) {
	const result = minimise(item.variables.length, item.minterms, item.dontCares);
	const dontCareText = item.dontCares ? ` + d(${item.dontCares.join(", ")})` : "";
	const name = `Σm(${item.minterms.join(", ")})${dontCareText}`;
	const literals = result.cover.reduce((sum, term) => sum + literalCount(term, result.variableCount), 0);
	print(
		`| ${name} | ${result.primeImplicants.length} | ${result.essentialPrimeImplicants.length} | ` +
			`\`${toExpression(result.cover, item.variables)}\` | ${literals} |`,
	);
}
print();

print("## 3. Adders built from gates");
print();
const a = 0b01101101;
const b = 0b00111010;
const added = rippleCarryAdder(toBits(a, 8), toBits(b, 8));
const binary = (bits: readonly number[]): string => [...bits].reverse().join("");
const row = (label: string, bits: readonly number[]): string => `${label.padEnd(28)}${binary(bits)}`;
code(
	[
		row("carry out of each stage:", added.carries),
		row(`A = ${a}`, toBits(a, 8)),
		row(`B = ${b}`, toBits(b, 8)),
		row(`sum = ${fromBits(added.sum)}, carry out = ${added.carry}`, added.sum),
	].join("\n"),
);

let agreements = 0;
for (let x = 0; x < 256; x++) {
	for (let y = 0; y < 256; y++) {
		const result = addBytes(x, y);
		if (result.sum + 256 * result.carry === x + y) {
			agreements += 1;
		}
	}
}
print(`The 8-bit ripple-carry adder agrees with native addition for ${agreements} of 65536 input pairs.`);

const output = `${lines.join("\n")}\n`;
process.stdout.write(output);
const resultsDir = process.env.RESULTS_DIR;
if (resultsDir !== undefined && resultsDir !== "") {
	mkdirSync(resultsDir, { recursive: true });
	writeFileSync(join(resultsDir, "results-ts.md"), output);
}
