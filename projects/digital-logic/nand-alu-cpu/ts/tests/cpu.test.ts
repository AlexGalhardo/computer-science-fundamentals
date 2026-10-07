import { describe, expect, test } from "bun:test";
import { assemble, disassemble, OPCODES } from "../src/assembler";
import { Cpu, formatTrace } from "../src/cpu";
import { readSharedFile } from "../src/files";

const MULTIPLY = readSharedFile("programs/multiply.asm");

function run(source: string): ReturnType<Cpu["state"]> {
	const cpu = new Cpu(assemble(source));
	cpu.run();
	return cpu.state();
}

describe("assembler", () => {
	test("encodes opcode and operand in one byte and resolves labels", () => {
		expect(assemble("LDI 3\nloop: SUBI 1\nJZ end\nJMP loop\nend: HLT")).toEqual([0x13, 0x91, 0xb4, 0xa1, 0xf0]);
	});

	test("ignores comments, blank lines and letter case", () => {
		expect(assemble("; only a comment\n\n  ldi 7 ; load\n  out\n")).toEqual([0x17, 0xd0]);
	});

	test("the multiply program fits in the 16 positions of the ROM", () => {
		expect(assemble(MULTIPLY)).toHaveLength(15);
	});

	test("disassemble is the inverse of assemble", () => {
		expect(assemble(MULTIPLY).map(disassemble).slice(0, 6)).toEqual([
			"LDI 3",
			"STA 0",
			"LDI 4",
			"STA 1",
			"LDA 1",
			"JZ 12",
		]);
		expect(disassemble(OPCODES.HLT << 4)).toBe("HLT");
	});

	test("rejects malformed programs", () => {
		expect(() => assemble("MUL 3")).toThrow(SyntaxError);
		expect(() => assemble("LDI")).toThrow(SyntaxError);
		expect(() => assemble("HLT 1")).toThrow(SyntaxError);
		expect(() => assemble("JMP nowhere")).toThrow(SyntaxError);
		expect(() => assemble("a: NOP\na: NOP")).toThrow(SyntaxError);
		expect(() => assemble("LDI 16")).toThrow(RangeError);
		expect(() => assemble("NOP\n".repeat(17))).toThrow(RangeError);
	});
});

describe("CPU", () => {
	// EN: Acceptance criterion MP-DL-2.3: the committed program multiplies two numbers. The trace
	//     must be exactly the committed results/trace.txt, the same file the Go tests compare
	//     against, so the two implementations are proven to agree instruction by instruction.
	// PT: Critério de aceite MP-DL-2.3: o programa versionado multiplica dois números. O trace
	//     precisa ser exatamente o results/trace.txt versionado, o mesmo arquivo com que os
	//     testes em Go se comparam, o que prova que as duas implementações concordam instrução
	//     por instrução.
	test("multiply.asm computes 3 x 4 = 12 and reproduces the committed trace", () => {
		const cpu = new Cpu(assemble(MULTIPLY));
		const trace = cpu.run();
		expect(cpu.state().out).toBe(12);
		expect(trace).toHaveLength(41);
		expect(formatTrace(trace)).toBe(readSharedFile("results/trace.txt").replaceAll("\r\n", "\n"));
	});

	test("the same program multiplies every pair of 4-bit numbers, modulo 16", () => {
		for (let x = 0; x < 16; x++) {
			for (let y = 0; y < 16; y++) {
				const source = MULTIPLY.replace("LDI 3", `LDI ${x}`).replace("LDI 4", `LDI ${y}`);
				if (run(source).out !== (x * y) % 16) {
					throw new Error(`${x} x ${y} gave ${run(source).out}`);
				}
			}
		}
	});

	test("arithmetic and logic instructions", () => {
		expect(run("LDI 9\nSTA 5\nLDI 6\nADD 5\nOUT\nHLT").out).toBe(15);
		expect(run("LDI 3\nSTA 5\nLDI 9\nSUB 5\nOUT\nHLT").out).toBe(6);
		expect(run("LDI 10\nSTA 5\nLDI 12\nAND 5\nOUT\nHLT").out).toBe(8);
		expect(run("LDI 10\nSTA 5\nLDI 12\nOR 5\nOUT\nHLT").out).toBe(14);
		expect(run("LDI 14\nADDI 3\nOUT\nHLT")).toMatchObject({ out: 1, carry: 1, zero: 0 });
	});

	test("JC jumps on the carry of an addition and JZ on a zero result", () => {
		const carrySource = "LDI 15\nADDI 1\nJC yes\nLDI 1\nOUT\nHLT\nyes: LDI 7\nOUT\nHLT";
		expect(run(carrySource).out).toBe(7);
		expect(run(carrySource.replace("LDI 15", "LDI 14")).out).toBe(1);
		// After 5 - 5 the Z flag is 1, and C is 1 too: no borrow.
		expect(run("LDI 5\nSUBI 5\nHLT")).toMatchObject({ a: 0, zero: 1, carry: 1 });
		// After 3 - 5 there was a borrow: C is 0.
		expect(run("LDI 3\nSUBI 5\nHLT")).toMatchObject({ a: 14, zero: 0, carry: 0 });
	});

	test("the program counter wraps from 15 to 0 and HLT freezes it", () => {
		const cpu = new Cpu(assemble(`${"NOP\n".repeat(15)}JMP 15`));
		for (let step = 0; step < 16; step++) {
			cpu.step();
		}
		expect(cpu.state().pc).toBe(15);
		const wrapping = new Cpu(assemble("NOP\n".repeat(16)));
		for (let step = 0; step < 16; step++) {
			wrapping.step();
		}
		expect(wrapping.state().pc).toBe(0);
		const halted = new Cpu(assemble("NOP\nHLT"));
		halted.run();
		expect(halted.state().pc).toBe(1);
	});

	test("a program that never halts is stopped by the step limit", () => {
		expect(() => new Cpu(assemble("JMP 0")).run(50)).toThrow("did not halt");
	});
});
