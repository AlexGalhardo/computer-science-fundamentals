// EN: `bun run demo` climbs the whole ladder: gates made of NAND, the ALU, and the CPU running
//     programs/multiply.asm. With RESULTS_DIR set it writes results/trace.txt, the file that the
//     tests of both languages compare against.
// PT: `bun run demo` sobe a escada inteira: portas feitas de NAND, a ALU e a CPU executando
//     programs/multiply.asm. Com RESULTS_DIR definida, grava results/trace.txt, o arquivo com
//     que os testes das duas linguagens se comparam.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ALU_OPERATIONS, type AluOperation, alu, fullAdder } from "./alu";
import { assemble } from "./assembler";
import { Cpu, formatTrace } from "./cpu";
import { readSharedFile } from "./files";
import { DFlipFlop } from "./memory";
import { and, type Bit, fromWord, mux, nand, nandCount, nor, not, or, resetNandCount, toWord, xnor, xor } from "./nand";

function countNands(run: () => void): number {
	resetNandCount();
	run();
	return nandCount();
}

console.log("1. Every gate from NAND (output column for inputs 00, 01, 10, 11)\n");
const gates: [string, (a: Bit, b: Bit) => Bit][] = [
	["NAND", nand],
	["NOT a", (a) => not(a)],
	["AND", and],
	["OR", or],
	["NOR", nor],
	["XOR", xor],
	["XNOR", xnor],
];
const pairs: [Bit, Bit][] = [
	[0, 0],
	[0, 1],
	[1, 0],
	[1, 1],
];
for (const [name, gate] of gates) {
	const column = pairs.map(([a, b]) => gate(a, b)).join("");
	const cost = countNands(() => gate(1, 1));
	console.log(`   ${name.padEnd(6)} ${column}   ${cost} NAND`);
}
console.log(`   ${"MUX".padEnd(6)} 2-to-1 ${countNands(() => mux(0, 0, 1))} NAND`);
console.log(`   ${"ADDER".padEnd(6)} full  ${countNands(() => fullAdder(1, 1, 1))} NAND`);
console.log(`   ${"DFF".padEnd(6)} pulse ${countNands(() => new DFlipFlop().pulse(1))} NAND evaluations\n`);

console.log("2. The ALU (4 bits)\n");
const samples: [number, AluOperation, number][] = [
	[2, "ADD", 3],
	[7, "ADD", 1],
	[15, "ADD", 1],
	[5, "SUB", 3],
	[3, "SUB", 5],
	[12, "AND", 10],
	[12, "OR", 10],
];
console.log("   x     op   y     result  Z N C V");
for (const [x, operation, y] of samples) {
	const code = ALU_OPERATIONS[operation];
	const output = alu(toWord(x, 4), toWord(y, 4), code >> 1 === 1 ? 1 : 0, (code & 1) === 1 ? 1 : 0);
	const binary = (value: number): string => value.toString(2).padStart(4, "0");
	const { zero, negative, carry, overflow } = output.flags;
	console.log(
		`   ${binary(x)}  ${operation.padEnd(3)}  ${binary(y)}  ${binary(fromWord(output.result))}    ${zero} ${negative} ${carry} ${overflow}`,
	);
}

console.log("\n3. The CPU running programs/multiply.asm\n");
const cpu = new Cpu(assemble(readSharedFile("programs/multiply.asm")));
resetNandCount();
const trace = cpu.run();
const total = nandCount();
const text = formatTrace(trace);
process.stdout.write(text);
const last = trace.at(-1);
console.log(`\n   output register: ${last?.out}`);
console.log(
	`   ${trace.length} instructions, ${total} NAND evaluations (${Math.round(total / trace.length)} per clock cycle)`,
);

const resultsDir = process.env.RESULTS_DIR;
if (resultsDir !== undefined && resultsDir !== "") {
	mkdirSync(resultsDir, { recursive: true });
	writeFileSync(join(resultsDir, "trace.txt"), text);
}
