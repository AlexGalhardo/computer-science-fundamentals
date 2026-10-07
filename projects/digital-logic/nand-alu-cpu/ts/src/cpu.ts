import { alu, increment } from "./alu";
import { disassemble, OPCODES, PROGRAM_SIZE } from "./assembler";
import { Register } from "./memory";
import { and, type Bit, decoder, fromWord, muxTree, muxWord, not, or, orAll, toWord, type Word } from "./nand";

const DATA_WIDTH = 4;
const RAM_CELLS = 16;

export interface CpuState {
	pc: number;
	a: number;
	zero: Bit;
	carry: Bit;
	out: number;
	ram: number[];
}

export interface TraceEntry extends CpuState {
	step: number;
	/** Address of the instruction that was executed in this step. */
	address: number;
	instruction: number;
}

// EN: A 4-bit accumulator machine. Its whole state lives in registers made of NAND flip-flops:
//     the program counter PC, the accumulator A, the flags Z and C, the output register OUT and
//     16 memory cells. Everything between the registers is combinational logic made of NANDs.
//     The only things taken for granted are the clock and the contents of the ROM.
// PT: Uma máquina de acumulador de 4 bits. Todo o seu estado vive em registradores feitos de
//     flip-flops de NAND: o contador de programa PC, o acumulador A, as flags Z e C, o
//     registrador de saída OUT e 16 células de memória. Tudo entre os registradores é lógica
//     combinacional feita de NANDs. As únicas coisas dadas de graça são o clock e o conteúdo
//     da ROM.
export class Cpu {
	private readonly rom: Word[];
	private readonly pc = new Register(DATA_WIDTH);
	private readonly a = new Register(DATA_WIDTH);
	private readonly zero = new Register(1);
	private readonly carry = new Register(1);
	private readonly out = new Register(DATA_WIDTH);
	private readonly ram = Array.from({ length: RAM_CELLS }, () => new Register(DATA_WIDTH));

	constructor(program: readonly number[]) {
		if (program.length > PROGRAM_SIZE) {
			throw new RangeError(`the ROM holds ${PROGRAM_SIZE} instructions`);
		}
		// EN: Unused ROM positions hold HLT, so a program that runs past its end stops.
		// PT: As posições não usadas da ROM guardam HLT, então um programa que passa do fim para.
		this.rom = Array.from({ length: PROGRAM_SIZE }, (_, address) =>
			toWord(program[address] ?? OPCODES.HLT << 4, 8),
		);
	}

	state(): CpuState {
		return {
			pc: fromWord(this.pc.read()),
			a: fromWord(this.a.read()),
			zero: this.zero.read()[0] ?? 0,
			carry: this.carry.read()[0] ?? 0,
			out: fromWord(this.out.read()),
			ram: this.ram.map((cell) => fromWord(cell.read())),
		};
	}

	// EN: One clock cycle. First the combinational part settles: fetch (the PC selects one ROM
	//     word), decode (the opcode turns on one of 16 lines, and ORs of those lines are the
	//     control signals), execute (the ALU computes) and the choice of the next PC. Only then
	//     comes the clock pulse, and every register captures its input at the same edge.
	// PT: Um ciclo de clock. Primeiro a parte combinacional se acomoda: busca (o PC seleciona
	//     uma palavra da ROM), decodificação (o opcode liga uma de 16 linhas, e ORs dessas linhas
	//     são os sinais de controle), execução (a ALU calcula) e a escolha do próximo PC. Só
	//     então vem o pulso de clock, e todos os registradores capturam a entrada na mesma borda.
	step(): { address: number; instruction: number; halted: boolean } {
		const pc = this.pc.read();
		const instruction = muxTree(pc, this.rom);
		const operand = instruction.slice(0, 4);
		const line = decoder(instruction.slice(4, 8));
		const is = (code: number): Bit => line[code] ?? 0;

		// EN: Control signals. Each one answers a yes/no question about the instruction.
		// PT: Sinais de controle. Cada um responde a uma pergunta de sim ou não sobre a instrução.
		const loadA = orAll(
			is(OPCODES.LDI),
			is(OPCODES.LDA),
			is(OPCODES.ADD),
			is(OPCODES.SUB),
			is(OPCODES.AND),
			is(OPCODES.OR),
			is(OPCODES.ADDI),
			is(OPCODES.SUBI),
		);
		const useA = orAll(
			is(OPCODES.ADD),
			is(OPCODES.SUB),
			is(OPCODES.AND),
			is(OPCODES.OR),
			is(OPCODES.ADDI),
			is(OPCODES.SUBI),
		);
		const useImmediate = orAll(is(OPCODES.LDI), is(OPCODES.ADDI), is(OPCODES.SUBI));
		const op0 = orAll(is(OPCODES.SUB), is(OPCODES.OR), is(OPCODES.SUBI));
		const op1 = or(is(OPCODES.AND), is(OPCODES.OR));
		const writeRam = is(OPCODES.STA);
		const loadOut = is(OPCODES.OUT);
		const halt = is(OPCODES.HLT);
		const jump = orAll(
			is(OPCODES.JMP),
			and(is(OPCODES.JZ), this.zero.read()[0] ?? 0),
			and(is(OPCODES.JC), this.carry.read()[0] ?? 0),
		);

		// EN: Data path. A load is "0 + operand": the AND gates zero the first ALU input when
		//     `useA` is 0, so every write to A goes through the ALU and updates the flags.
		// PT: Caminho de dados. Uma carga é "0 + operando": as portas AND zeram a primeira entrada
		//     da ALU quando `useA` vale 0, então toda escrita em A passa pela ALU e atualiza as flags.
		const accumulator = this.a.read();
		const fromRam = muxTree(
			operand,
			this.ram.map((cell) => cell.read()),
		);
		const x = accumulator.map((bit) => and(bit, useA));
		const y = muxWord(useImmediate, fromRam, operand);
		const computed = alu(x, y, op1, op0);
		const nextPc = muxWord(jump, increment(pc), operand);
		const writeLine = decoder(operand, writeRam);

		// EN: The clock edge. All inputs were computed above from the OLD register values, so the
		//     order of these calls does not matter: it is one simultaneous update.
		// PT: A borda do clock. Todas as entradas foram calculadas acima a partir dos valores
		//     ANTIGOS dos registradores, então a ordem destas chamadas não importa: é uma
		//     atualização simultânea.
		this.ram.forEach((cell, address) => {
			cell.pulse(accumulator, writeLine[address] ?? 0);
		});
		this.a.pulse(computed.result, loadA);
		this.zero.pulse([computed.flags.zero], loadA);
		this.carry.pulse([computed.flags.carry], loadA);
		this.out.pulse(accumulator, loadOut);
		this.pc.pulse(nextPc, not(halt));

		return { address: fromWord(pc), instruction: fromWord(instruction), halted: halt === 1 };
	}

	/** Runs until HLT and returns the state after every instruction. */
	run(maxSteps = 1000): TraceEntry[] {
		const trace: TraceEntry[] = [];
		for (let step = 1; step <= maxSteps; step++) {
			const { address, instruction, halted } = this.step();
			trace.push({ step, address, instruction, ...this.state() });
			if (halted) {
				return trace;
			}
		}
		throw new Error(`the program did not halt in ${maxSteps} steps`);
	}
}

// EN: The trace is plain text with fixed columns, so the Go and the TypeScript implementations
//     can be compared byte for byte: both must print exactly results/trace.txt.
// PT: O trace é texto puro com colunas fixas, para que as implementações em Go e em TypeScript
//     possam ser comparadas byte a byte: as duas precisam imprimir exatamente results/trace.txt.
export function formatTrace(trace: readonly TraceEntry[]): string {
	const pad = (value: number | string, width: number): string => String(value).padStart(width);
	const lines = ["step  pc  instr    A     dec  Z C  m0  m1  m2  out"];
	for (const entry of trace) {
		lines.push(
			[
				pad(entry.step, 4),
				"  ",
				pad(entry.address, 2),
				"  ",
				disassemble(entry.instruction).padEnd(7),
				"  ",
				entry.a.toString(2).padStart(4, "0"),
				"  ",
				pad(entry.a, 3),
				"  ",
				entry.zero,
				" ",
				entry.carry,
				"  ",
				pad(entry.ram[0] ?? 0, 2),
				"  ",
				pad(entry.ram[1] ?? 0, 2),
				"  ",
				pad(entry.ram[2] ?? 0, 2),
				"  ",
				pad(entry.out, 3),
			].join(""),
		);
	}
	return `${lines.join("\n")}\n`;
}
