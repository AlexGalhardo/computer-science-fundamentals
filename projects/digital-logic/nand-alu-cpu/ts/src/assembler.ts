// EN: An instruction is one byte: the high nibble is the operation code (opcode) and the low
//     nibble is the operand, which is a constant, a memory address or a jump target.
//     The assembler only translates names into those numbers; the CPU never sees text.
// PT: Uma instrução é um byte: o nibble alto é o código da operação (opcode) e o nibble baixo é
//     o operando, que é uma constante, um endereço de memória ou um destino de salto.
//     O montador só traduz nomes para esses números; a CPU nunca vê texto.
// ES: Una instrucción es un byte: el nibble alto es el código de operación (opcode) y el nibble
//     bajo es el operando, que es una constante, una dirección de memoria o un destino de salto.
//     El ensamblador solo traduce nombres a esos números; la CPU nunca ve texto.
export const OPCODES = {
	NOP: 0x0, // do nothing
	LDI: 0x1, // A <- n
	LDA: 0x2, // A <- RAM[n]
	STA: 0x3, // RAM[n] <- A
	ADD: 0x4, // A <- A + RAM[n]
	SUB: 0x5, // A <- A - RAM[n]
	AND: 0x6, // A <- A and RAM[n]
	OR: 0x7, // A <- A or RAM[n]
	ADDI: 0x8, // A <- A + n
	SUBI: 0x9, // A <- A - n
	JMP: 0xa, // PC <- n
	JZ: 0xb, // PC <- n when the Z flag is 1
	JC: 0xc, // PC <- n when the C flag is 1
	OUT: 0xd, // OUT <- A
	HLT: 0xf, // stop
} as const;

export type Mnemonic = keyof typeof OPCODES;

const WITHOUT_OPERAND = new Set<string>(["NOP", "OUT", "HLT"]);
export const PROGRAM_SIZE = 16;

function isMnemonic(text: string): text is Mnemonic {
	return Object.hasOwn(OPCODES, text);
}

// EN: Two passes, like every assembler. The first pass only counts instructions to learn the
//     address of each label; the second one emits the bytes, replacing each label by its address.
//     That is what lets a jump refer to a label that is defined further down.
// PT: Duas passadas, como em todo montador. A primeira só conta as instruções para descobrir o
//     endereço de cada rótulo; a segunda emite os bytes, trocando cada rótulo pelo seu endereço.
//     É isso que permite a um salto citar um rótulo definido mais abaixo.
// ES: Dos pasadas, como en todo ensamblador. La primera solo cuenta las instrucciones para
//     descubrir la dirección de cada etiqueta; la segunda emite los bytes, cambiando cada
//     etiqueta por su dirección. Eso es lo que permite que un salto cite una etiqueta definida
//     más abajo.
export function assemble(source: string): number[] {
	const labels = new Map<string, number>();
	const statements: { line: number; mnemonic: string; operand: string | undefined }[] = [];

	source.split(/\r?\n/).forEach((raw, index) => {
		let text = (raw.split(";")[0] ?? "").trim();
		const label = /^([A-Za-z_][A-Za-z0-9_]*):/.exec(text);
		if (label?.[1] !== undefined) {
			if (labels.has(label[1])) {
				throw new SyntaxError(`line ${index + 1}: label "${label[1]}" is defined twice`);
			}
			labels.set(label[1], statements.length);
			text = text.slice(label[0].length).trim();
		}
		if (text === "") {
			return;
		}
		const [mnemonic, operand, ...rest] = text.split(/\s+/);
		if (mnemonic === undefined || rest.length > 0) {
			throw new SyntaxError(`line ${index + 1}: expected "MNEMONIC [operand]"`);
		}
		statements.push({ line: index + 1, mnemonic: mnemonic.toUpperCase(), operand });
	});

	if (statements.length > PROGRAM_SIZE) {
		throw new RangeError(`the program has ${statements.length} instructions, the ROM holds ${PROGRAM_SIZE}`);
	}

	return statements.map(({ line, mnemonic, operand }) => {
		if (!isMnemonic(mnemonic)) {
			throw new SyntaxError(`line ${line}: unknown instruction "${mnemonic}"`);
		}
		if (WITHOUT_OPERAND.has(mnemonic)) {
			if (operand !== undefined) {
				throw new SyntaxError(`line ${line}: ${mnemonic} takes no operand`);
			}
			return OPCODES[mnemonic] << 4;
		}
		if (operand === undefined) {
			throw new SyntaxError(`line ${line}: ${mnemonic} needs an operand`);
		}
		const value = /^[0-9]+$/.test(operand) ? Number(operand) : labels.get(operand);
		if (value === undefined) {
			throw new SyntaxError(`line ${line}: unknown label "${operand}"`);
		}
		if (value > 15) {
			throw new RangeError(`line ${line}: operand ${value} does not fit in 4 bits`);
		}
		return (OPCODES[mnemonic] << 4) | value;
	});
}

/** Text of one instruction byte, for the trace: 0x13 becomes "LDI 3". */
export function disassemble(instruction: number): string {
	const opcode = instruction >> 4;
	const operand = instruction & 0xf;
	const mnemonic = Object.entries(OPCODES).find(([, code]) => code === opcode)?.[0] ?? "NOP";
	return WITHOUT_OPERAND.has(mnemonic) ? mnemonic : `${mnemonic} ${operand}`;
}
