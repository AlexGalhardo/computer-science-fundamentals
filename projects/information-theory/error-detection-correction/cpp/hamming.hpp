#pragma once

#include <bit>
#include <cstdint>
#include <string>

// EN: Codes that repair errors instead of only noticing them. The price is more redundancy:
//     the valid words must be far enough apart for a damaged word to stay closer to the
//     original than to any other valid word.
// PT: Códigos que consertam erros em vez de apenas percebê-los. O preço é mais redundância:
//     as palavras válidas precisam estar longe o bastante umas das outras para que uma
//     palavra danificada continue mais perto da original do que de qualquer outra válida.
namespace edc {

enum class Outcome {
	kClean,      // EN: no error seen. PT: nenhum erro visto.
	kCorrected,  // EN: one bit was repaired. PT: um bit foi consertado.
	kDetected,   // EN: error seen, cannot repair. PT: erro visto, sem conserto.
};

struct Decoded {
	std::uint8_t data;
	Outcome outcome;
};

// EN: Hamming(7,4). Positions are numbered 1 to 7. Positions 1, 2 and 4 (the powers of two)
//     hold parity bits, the others hold the 4 data bits:
//
//         position   1   2   3   4   5   6   7
//         content    p1  p2  d1  p4  d2  d3  d4
//
//     Parity bit p_k covers every position whose number has bit k set: p1 covers 1,3,5,7;
//     p2 covers 2,3,6,7; p4 covers 4,5,6,7. Each group has even parity.
//     In this file position n is stored in bit n-1 of a byte, and d1 is the high bit of the
//     data nibble, so the nibble 1011 means d1 d2 d3 d4 = 1 0 1 1.
// PT: Hamming(7,4). As posições são numeradas de 1 a 7. As posições 1, 2 e 4 (as potências
//     de dois) guardam bits de paridade, e as outras guardam os 4 bits de dados (veja o
//     quadro acima). O bit de paridade p_k cobre toda posição cujo número tem o bit k ligado:
//     p1 cobre 1,3,5,7; p2 cobre 2,3,6,7; p4 cobre 4,5,6,7. Cada grupo tem paridade par.
//     Neste arquivo a posição n fica no bit n-1 de um byte, e d1 é o bit alto do nibble de
//     dados, então o nibble 1011 significa d1 d2 d3 d4 = 1 0 1 1.

// EN: The syndrome is the XOR of the numbers of all positions that hold a 1. With the layout
//     above it is 0 for every valid word. Flipping the bit at position n changes it by
//     exactly n, so after a single error the syndrome is the position of the wrong bit.
// PT: A síndrome é o XOR dos números de todas as posições que guardam um 1. Com a disposição
//     acima ela vale 0 para toda palavra válida. Inverter o bit da posição n a altera em
//     exatamente n, então depois de um único erro a síndrome é a posição do bit errado.
constexpr unsigned hamming_syndrome(std::uint8_t word) {
	unsigned syndrome = 0;
	for (unsigned position = 1; position <= 7; ++position) {
		if ((word >> (position - 1) & 1U) != 0) {
			syndrome ^= position;
		}
	}
	return syndrome;
}

constexpr std::uint8_t hamming74_encode(std::uint8_t nibble) {
	const unsigned d1 = nibble >> 3 & 1U;
	const unsigned d2 = nibble >> 2 & 1U;
	const unsigned d3 = nibble >> 1 & 1U;
	const unsigned d4 = nibble & 1U;
	const unsigned p1 = d1 ^ d2 ^ d4;
	const unsigned p2 = d1 ^ d3 ^ d4;
	const unsigned p4 = d2 ^ d3 ^ d4;
	return static_cast<std::uint8_t>(p1 | p2 << 1 | d1 << 2 | p4 << 3 | d2 << 4 | d3 << 5 |
	                                 d4 << 6);
}

constexpr std::uint8_t hamming74_data(std::uint8_t word) {
	const unsigned d1 = word >> 2 & 1U;
	const unsigned d2 = word >> 4 & 1U;
	const unsigned d3 = word >> 5 & 1U;
	const unsigned d4 = word >> 6 & 1U;
	return static_cast<std::uint8_t>(d1 << 3 | d2 << 2 | d3 << 1 | d4);
}

// EN: The decoder trusts the syndrome and flips the position it names. With one error this
//     always repairs the word. With two errors the syndrome is the XOR of two positions,
//     which names a third, innocent bit: the decoder flips it and delivers wrong data
//     without knowing. Minimum distance 3 corrects one error or detects two, never both.
// PT: O decodificador confia na síndrome e inverte a posição que ela indica. Com um erro
//     isso sempre conserta a palavra. Com dois erros a síndrome é o XOR de duas posições,
//     que indica um terceiro bit, inocente: o decodificador o inverte e entrega dados
//     errados sem saber. Distância mínima 3 corrige um erro ou detecta dois, nunca os dois.
constexpr Decoded hamming74_decode(std::uint8_t word) {
	const unsigned syndrome = hamming_syndrome(word);
	if (syndrome == 0) {
		return {hamming74_data(word), Outcome::kClean};
	}
	word ^= static_cast<std::uint8_t>(1U << (syndrome - 1));
	return {hamming74_data(word), Outcome::kCorrected};
}

// EN: Extended Hamming(8,4), also called SECDED: single error correction, double error
//     detection. One more bit holds the parity of the other seven, which raises the minimum
//     distance from 3 to 4. The decoder now has two clues: the syndrome says where, and the
//     overall parity says whether the number of flipped bits is odd or even.
//
//         syndrome   overall parity   conclusion
//         0          even             no error
//         not 0      odd              one error: correct it
//         not 0      even             two errors: detect only
//         0          odd              the overall parity bit itself was hit
// PT: Hamming estendido (8,4), também chamado SECDED: corrige erro simples, detecta erro
//     duplo. Um bit a mais guarda a paridade dos outros sete, o que eleva a distância mínima
//     de 3 para 4. O decodificador passa a ter duas pistas: a síndrome diz onde, e a paridade
//     global diz se o número de bits invertidos é ímpar ou par (veja o quadro acima).
constexpr std::uint8_t hamming84_encode(std::uint8_t nibble) {
	const std::uint8_t word = hamming74_encode(nibble);
	const unsigned overall = static_cast<unsigned>(std::popcount(word)) & 1U;
	return static_cast<std::uint8_t>(word | overall << 7);
}

constexpr Decoded hamming84_decode(std::uint8_t word) {
	const auto low = static_cast<std::uint8_t>(word & 0x7FU);
	const unsigned syndrome = hamming_syndrome(low);
	const bool odd = (std::popcount(word) & 1) != 0;
	if (syndrome == 0) {
		return {hamming74_data(low), odd ? Outcome::kCorrected : Outcome::kClean};
	}
	if (!odd) {
		return {hamming74_data(low), Outcome::kDetected};
	}
	return {hamming74_decode(low).data, Outcome::kCorrected};
}

// EN: Repetition code (3,1): send every bit three times and let the majority decide. It also
//     corrects one error per block, but it sends 3 bits per data bit, while Hamming(7,4)
//     sends 1.75. Two errors in a block make the majority wrong.
// PT: Código de repetição (3,1): envie cada bit três vezes e deixe a maioria decidir. Ele
//     também corrige um erro por bloco, mas envia 3 bits por bit de dados, enquanto o
//     Hamming(7,4) envia 1,75. Dois erros em um bloco fazem a maioria errar.
constexpr std::uint8_t repetition3_encode(std::uint8_t bit) {
	return (bit & 1U) != 0 ? 0b111 : 0b000;
}

constexpr Decoded repetition3_decode(std::uint8_t block) {
	const int ones = std::popcount(static_cast<std::uint8_t>(block & 0b111U));
	const auto data = static_cast<std::uint8_t>(ones >= 2 ? 1 : 0);
	return {data, ones == 0 || ones == 3 ? Outcome::kClean : Outcome::kCorrected};
}

/// EN: Bits of a word as text, position 1 first. PT: Bits da palavra como texto, posição 1
/// primeiro.
inline std::string positions_text(std::uint8_t word, int bits) {
	std::string text;
	for (int position = 0; position < bits; ++position) {
		text += (word >> position & 1U) != 0 ? '1' : '0';
	}
	return text;
}

}  // namespace edc
