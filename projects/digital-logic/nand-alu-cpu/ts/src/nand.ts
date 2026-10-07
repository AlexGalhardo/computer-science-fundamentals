// EN: A wire carries 0 or 1. A word is a group of wires, least significant bit first, so index
//     i has weight 2^i.
// PT: Um fio carrega 0 ou 1. Uma palavra é um grupo de fios, do bit menos significativo para o
//     mais significativo, então o índice i tem peso 2^i.
export type Bit = 0 | 1;
export type Word = Bit[];

let nandEvaluations = 0;

// EN: The one and only primitive of this mini-project. NAND is 0 only when both inputs are 1.
//     It is a universal gate: every other function in this folder, from NOT up to the CPU, is a
//     wiring of calls to this function. The counter shows how many gate evaluations a job took.
// PT: A única primitiva deste mini-projeto. A NAND vale 0 só quando as duas entradas valem 1.
//     É uma porta universal: todas as outras funções desta pasta, do NOT até a CPU, são
//     ligações de chamadas a esta função. O contador mostra quantas avaliações de porta um
//     trabalho consumiu.
export function nand(a: Bit, b: Bit): Bit {
	nandEvaluations += 1;
	return a === 1 && b === 1 ? 0 : 1;
}

export function nandCount(): number {
	return nandEvaluations;
}

export function resetNandCount(): void {
	nandEvaluations = 0;
}

// EN: NOT is a NAND with both inputs tied together: (A·A)' = A'. 1 NAND.
// PT: O NOT é uma NAND com as duas entradas unidas: (A·A)' = A'. 1 NAND.
export function not(a: Bit): Bit {
	return nand(a, a);
}

// EN: AND is a NAND followed by an inverter, which cancels the inversion. 2 NANDs.
// PT: A AND é uma NAND seguida de um inversor, que cancela a inversão. 2 NANDs.
export function and(a: Bit, b: Bit): Bit {
	return not(nand(a, b));
}

// EN: OR comes from De Morgan: A + B = (A'·B')', a NAND of the inverted inputs. 3 NANDs.
// PT: A OR vem de De Morgan: A + B = (A'·B')', uma NAND das entradas invertidas. 3 NANDs.
export function or(a: Bit, b: Bit): Bit {
	return nand(not(a), not(b));
}

// EN: NOR is an OR followed by an inverter. 4 NANDs.
// PT: A NOR é uma OR seguida de um inversor. 4 NANDs.
export function nor(a: Bit, b: Bit): Bit {
	return not(or(a, b));
}

// EN: XOR in 4 NANDs, the minimum. The trick is to share M = (A·B)': NAND(A, M) is (A·B')',
//     NAND(B, M) is (A'·B)', and the last NAND joins the two: A·B' + A'·B.
// PT: XOR em 4 NANDs, o mínimo. O truque é compartilhar M = (A·B)': NAND(A, M) é (A·B')',
//     NAND(B, M) é (A'·B)', e a última NAND junta os dois: A·B' + A'·B.
export function xor(a: Bit, b: Bit): Bit {
	const shared = nand(a, b);
	return nand(nand(a, shared), nand(b, shared));
}

// EN: XNOR is XOR followed by an inverter: 1 when the inputs are equal. 5 NANDs.
// PT: A XNOR é a XOR seguida de um inversor: 1 quando as entradas são iguais. 5 NANDs.
export function xnor(a: Bit, b: Bit): Bit {
	return not(xor(a, b));
}

// EN: 2-to-1 multiplexer: the select line chooses which input reaches the output.
//     Y = S'·whenZero + S·whenOne. With NANDs the OR of two ANDs is NAND(NAND, NAND). 4 NANDs.
// PT: Multiplexador 2 para 1: a linha de seleção escolhe qual entrada chega à saída.
//     Y = S'·whenZero + S·whenOne. Com NANDs, a OR de duas ANDs é NAND(NAND, NAND). 4 NANDs.
export function mux(select: Bit, whenZero: Bit, whenOne: Bit): Bit {
	return nand(nand(not(select), whenZero), nand(select, whenOne));
}

/** One 2-to-1 multiplexer per bit: chooses between two whole words. */
export function muxWord(select: Bit, whenZero: Word, whenOne: Word): Word {
	return whenZero.map((bit, index) => mux(select, bit, whenOne[index] ?? 0));
}

// EN: A multiplexer with n select lines is a tree of 2-to-1 multiplexers: the least significant
//     select bit chooses inside each pair, the next bit chooses between pairs, and so on.
//     `inputs` must hold 2^n words. This is how the CPU reads one memory cell out of 16.
// PT: Um multiplexador com n linhas de seleção é uma árvore de multiplexadores 2 para 1: o bit
//     de seleção menos significativo escolhe dentro de cada par, o seguinte escolhe entre os
//     pares, e assim por diante. `inputs` precisa ter 2^n palavras. É assim que a CPU lê uma
//     célula de memória entre 16.
export function muxTree(select: Word, inputs: readonly Word[]): Word {
	if (inputs.length !== 2 ** select.length) {
		throw new RangeError(`${select.length} select lines need ${2 ** select.length} inputs`);
	}
	let level = [...inputs];
	for (const selectBit of select) {
		const next: Word[] = [];
		for (let index = 0; index < level.length; index += 2) {
			next.push(muxWord(selectBit, level[index] ?? [], level[index + 1] ?? []));
		}
		level = next;
	}
	return level[0] ?? [];
}

// EN: A decoder turns an n-bit code into 2^n lines and activates only the line whose number is
//     the code. Each line is the AND of every code bit, plain or inverted: a minterm. The
//     enable input turns all lines off, which makes the same circuit a demultiplexer.
// PT: Um decodificador transforma um código de n bits em 2^n linhas e ativa só a linha cujo
//     número é o código. Cada linha é a AND de todos os bits do código, diretos ou invertidos:
//     um mintermo. A entrada de habilitação desliga todas as linhas, o que faz do mesmo
//     circuito um demultiplexador.
export function decoder(code: Word, enable: Bit = 1): Bit[] {
	const inverted = code.map((bit) => not(bit));
	const lines: Bit[] = [];
	for (let line = 0; line < 2 ** code.length; line++) {
		let active = enable;
		for (let index = 0; index < code.length; index++) {
			const wanted = ((line >> index) & 1) === 1;
			active = and(active, (wanted ? code[index] : inverted[index]) ?? 0);
		}
		lines.push(active);
	}
	return lines;
}

/** OR of any number of signals, chained two at a time. */
export function orAll(...signals: Bit[]): Bit {
	return signals.reduce<Bit>((result, signal) => or(result, signal), 0);
}

/** Bits of an unsigned integer, least significant bit first. */
export function toWord(value: number, width: number): Word {
	if (!Number.isInteger(value) || value < 0 || value >= 2 ** width) {
		throw new RangeError(`${value} does not fit in ${width} unsigned bits`);
	}
	return Array.from({ length: width }, (_, index): Bit => (((value >> index) & 1) === 1 ? 1 : 0));
}

/** Unsigned integer represented by a word. */
export function fromWord(word: readonly Bit[]): number {
	return word.reduce<number>((total, bit, index) => total + bit * 2 ** index, 0);
}
