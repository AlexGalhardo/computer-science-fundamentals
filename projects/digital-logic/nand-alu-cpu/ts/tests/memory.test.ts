import { describe, expect, test } from "bun:test";
import { DFlipFlop, DLatch, Register, SrLatch } from "../src/memory";
import { type Bit, fromWord, toWord } from "../src/nand";

describe("SR latch made of two NANDs (active-low inputs)", () => {
	test("set, hold, reset, hold", () => {
		const latch = new SrLatch();
		latch.update(0, 1);
		expect([latch.q, latch.qBar]).toEqual([1, 0]);
		latch.update(1, 1);
		expect([latch.q, latch.qBar]).toEqual([1, 0]);
		latch.update(1, 0);
		expect([latch.q, latch.qBar]).toEqual([0, 1]);
		latch.update(1, 1);
		expect([latch.q, latch.qBar]).toEqual([0, 1]);
	});

	test("both inputs at 0 force both outputs to 1: the forbidden state", () => {
		const latch = new SrLatch();
		latch.update(0, 0);
		expect([latch.q, latch.qBar]).toEqual([1, 1]);
	});
});

describe("D latch", () => {
	test("is transparent while enabled and holds while disabled", () => {
		const latch = new DLatch();
		// The same waveform as quiz question latches-flip-flops-10.
		const clock: Bit[] = [0, 0, 1, 1, 1, 0, 0, 1, 1, 0];
		const data: Bit[] = [1, 0, 0, 1, 1, 0, 1, 1, 0, 0];
		const output = clock.map((level, instant) => {
			latch.update(data[instant] ?? 0, level);
			return latch.q;
		});
		expect(output.join(" ")).toBe("0 0 0 1 1 1 1 1 0 0");
	});
});

describe("D flip-flop (master-slave)", () => {
	test("samples D only at the rising edge", () => {
		const flipFlop = new DFlipFlop();
		const clock: Bit[] = [0, 0, 1, 1, 1, 0, 0, 1, 1, 0];
		const data: Bit[] = [1, 0, 0, 1, 1, 0, 1, 1, 0, 0];
		const output = clock.map((level, instant) => {
			flipFlop.setClock(level, data[instant] ?? 0);
			return flipFlop.q;
		});
		expect(output.join(" ")).toBe("0 0 0 0 0 0 0 1 1 1");
	});

	test("a pulse copies D to Q", () => {
		const flipFlop = new DFlipFlop();
		flipFlop.pulse(1);
		expect(flipFlop.q).toBe(1);
		flipFlop.pulse(0);
		expect(flipFlop.q).toBe(0);
	});
});

describe("register", () => {
	test("starts cleared, loads when told to and holds otherwise", () => {
		const register = new Register(4);
		expect(fromWord(register.read())).toBe(0);
		register.pulse(toWord(11, 4), 1);
		expect(fromWord(register.read())).toBe(11);
		register.pulse(toWord(6, 4), 0);
		expect(fromWord(register.read())).toBe(11);
		register.pulse(toWord(6, 4), 1);
		expect(fromWord(register.read())).toBe(6);
	});

	test("stores every 4-bit value", () => {
		const register = new Register(4);
		for (let value = 0; value < 16; value++) {
			register.pulse(toWord(value, 4), 1);
			expect(fromWord(register.read())).toBe(value);
		}
	});
});
