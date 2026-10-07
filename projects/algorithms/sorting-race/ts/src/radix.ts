// EN: LSD radix sort for integers from 0 to 2^31 - 1. It never compares two values, so the
//     Ω(n log n) bound of comparison sorts does not apply. Each byte of the key is a digit in
//     base 256, and one stable counting sort runs per digit, from the least significant one:
//     4 passes of O(n + 256), that is, O(n) for fixed-width keys. Stability is what makes it
//     correct: a pass must keep the order left by the passes before it.
// PT: Radix sort LSD para inteiros de 0 a 2^31 - 1. Ele nunca compara dois valores, então o
//     limite Ω(n log n) das ordenações por comparação não se aplica. Cada byte da chave é um
//     dígito na base 256, e um counting sort estável roda por dígito, a partir do menos
//     significativo: 4 passadas de O(n + 256), ou seja, O(n) para chaves de largura fixa. A
//     estabilidade é o que o torna correto: uma passada precisa manter a ordem deixada pelas anteriores.
const BITS_PER_DIGIT = 8;
const BASE = 1 << BITS_PER_DIGIT;
const KEY_BITS = 32;

export function radixSort(input: readonly number[]): number[] {
	let source = [...input];
	let target = new Array<number>(source.length);
	const count = new Array<number>(BASE);
	for (let shift = 0; shift < KEY_BITS; shift += BITS_PER_DIGIT) {
		count.fill(0);
		for (const value of source) {
			const digit = (value >>> shift) & (BASE - 1);
			count[digit] = (count[digit] as number) + 1;
		}
		// EN: Running sum: count[d] becomes the position right after the last value with digit d.
		// PT: Soma acumulada: count[d] vira a posição logo após o último valor com dígito d.
		for (let d = 1; d < BASE; d++) {
			count[d] = (count[d] as number) + (count[d - 1] as number);
		}
		// EN: Backwards scan: the last value with a digit takes the last slot of its group, so
		//     equal digits keep their relative order.
		// PT: Varredura de trás para frente: o último valor com um dígito ocupa a última vaga do
		//     grupo, então dígitos iguais mantêm a ordem relativa.
		for (let i = source.length - 1; i >= 0; i--) {
			const value = source[i] as number;
			const digit = (value >>> shift) & (BASE - 1);
			const position = (count[digit] as number) - 1;
			count[digit] = position;
			target[position] = value;
		}
		[source, target] = [target, source];
	}
	return source;
}
