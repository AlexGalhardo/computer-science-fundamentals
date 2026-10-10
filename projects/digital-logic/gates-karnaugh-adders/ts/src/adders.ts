import { and, type Bit, or, xor } from "./gates";

export interface AdderOutput {
	sum: Bit;
	carry: Bit;
}

// EN: Half adder: adds two bits. The sum bit is 1 when the inputs differ (XOR) and the carry
//     is 1 only for 1 + 1 (AND). It is "half" because it has no input for a carry coming from
//     the column on its right.
// PT: Meio somador: soma dois bits. O bit de soma vale 1 quando as entradas são diferentes
//     (XOR) e o vai-um vale 1 apenas em 1 + 1 (AND). É "meio" porque não tem entrada para um
//     vai-um vindo da coluna à direita.
// ES: Semisumador: suma dos bits. El bit de suma vale 1 cuando las entradas son distintas
//     (XOR) y el acarreo vale 1 solo en 1 + 1 (AND). Es "semi" porque no tiene entrada para un
//     acarreo que venga de la columna de la derecha.
export function halfAdder(a: Bit, b: Bit): AdderOutput {
	return { sum: xor(a, b), carry: and(a, b) };
}

// EN: Full adder: adds three bits, the two operands and the carry-in. It is two half adders in
//     a row plus an OR. The two carries are never 1 at the same time, so the OR just merges them.
//     Sum = A xor B xor Cin, carry-out = majority(A, B, Cin).
// PT: Somador completo: soma três bits, os dois operandos e o vai-um de entrada. São dois meio
//     somadores em sequência mais uma OR. Os dois vai-uns nunca valem 1 ao mesmo tempo, então a
//     OR apenas os junta. Soma = A xor B xor Cin, vai-um de saída = maioria(A, B, Cin).
// ES: Sumador completo: suma tres bits, los dos operandos y el acarreo de entrada. Son dos
//     semisumadores en secuencia más una OR. Los dos acarreos nunca valen 1 al mismo tiempo,
//     así que la OR solo los une. Suma = A xor B xor Cin, acarreo de salida = mayoría(A, B,
//     Cin).
export function fullAdder(a: Bit, b: Bit, carryIn: Bit): AdderOutput {
	const first = halfAdder(a, b);
	const second = halfAdder(first.sum, carryIn);
	return { sum: second.sum, carry: or(first.carry, second.carry) };
}

export interface RippleCarryOutput {
	/** Sum bits, least significant bit first. */
	sum: Bit[];
	/** Carry out of the most significant stage. */
	carry: Bit;
	/** Carry out of every stage, least significant first: how the carry travelled. */
	carries: Bit[];
}

// EN: Ripple-carry adder: one full adder per bit, and the carry-out of each stage is the
//     carry-in of the next, more significant one. The carry "ripples" from right to left like
//     in addition by hand, which is why the delay of this adder grows with the number of bits.
//     Bit arrays are least significant bit first, so index i has weight 2^i.
// PT: Somador com propagação de vai-um: um somador completo por bit, e o vai-um de saída de
//     cada estágio é o vai-um de entrada do seguinte, mais significativo. O vai-um "se propaga"
//     da direita para a esquerda como na soma feita à mão, e por isso o atraso desse somador
//     cresce com o número de bits. Os vetores de bits começam pelo bit menos significativo,
//     então o índice i tem peso 2^i.
// ES: Sumador con propagación de acarreo: un sumador completo por bit, y el acarreo de salida
//     de cada etapa es el acarreo de entrada de la siguiente, más significativa. El acarreo "se
//     propaga" de derecha a izquierda como en la suma hecha a mano, y por eso el retardo de este
//     sumador crece con el número de bits. Los vectores de bits empiezan por el bit menos
//     significativo, así que el índice i tiene peso 2^i.
export function rippleCarryAdder(a: readonly Bit[], b: readonly Bit[], carryIn: Bit = 0): RippleCarryOutput {
	if (a.length !== b.length) {
		throw new RangeError("both operands must have the same number of bits");
	}
	const sum: Bit[] = [];
	const carries: Bit[] = [];
	let carry = carryIn;
	for (let index = 0; index < a.length; index++) {
		const stage = fullAdder(a[index] ?? 0, b[index] ?? 0, carry);
		sum.push(stage.sum);
		carry = stage.carry;
		carries.push(carry);
	}
	return { sum, carry, carries };
}

/** Bits of an unsigned integer, least significant bit first. */
export function toBits(value: number, width: number): Bit[] {
	if (!Number.isInteger(value) || value < 0 || value >= 2 ** width) {
		throw new RangeError(`${value} does not fit in ${width} unsigned bits`);
	}
	return Array.from({ length: width }, (_, index): Bit => (((value >> index) & 1) === 1 ? 1 : 0));
}

/** Unsigned integer represented by bits given least significant bit first. */
export function fromBits(bits: readonly Bit[]): number {
	return bits.reduce<number>((total, bit, index) => total + bit * 2 ** index, 0);
}

/** Adds two unsigned bytes with the gate-level ripple-carry adder. */
export function addBytes(a: number, b: number): { sum: number; carry: Bit } {
	const result = rippleCarryAdder(toBits(a, 8), toBits(b, 8));
	return { sum: fromBits(result.sum), carry: result.carry };
}
