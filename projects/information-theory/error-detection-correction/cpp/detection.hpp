#pragma once

#include <array>
#include <bit>
#include <cstddef>
#include <cstdint>
#include <span>

// EN: Three ways to detect that bits changed on the way, from the weakest to the strongest.
//     All of them add redundant bits computed from the data. The receiver recomputes them
//     and compares. None of them can tell which bit is wrong: they only detect.
// PT: Três formas de detectar que bits mudaram no caminho, da mais fraca à mais forte. Todas
//     acrescentam bits redundantes calculados a partir dos dados. O receptor recalcula e
//     compara. Nenhuma delas sabe dizer qual bit está errado: elas só detectam.
namespace edc {

// EN: Even parity: one extra bit chosen so that the total number of 1 bits is even. It is the
//     XOR of all data bits. Any odd number of flipped bits changes the parity and is caught.
//     Any even number leaves it unchanged and goes unnoticed.
// PT: Paridade par: um bit extra escolhido para que o total de bits 1 seja par. É o XOR de
//     todos os bits de dados. Qualquer número ímpar de bits invertidos muda a paridade e é
//     percebido. Qualquer número par a mantém e passa despercebido.
inline std::uint8_t even_parity(std::span<const std::uint8_t> data) {
	int ones = 0;
	for (std::uint8_t byte : data) {
		ones += std::popcount(byte);
	}
	return static_cast<std::uint8_t>(ones & 1);
}

// EN: Internet checksum (RFC 1071), used by IP, TCP and UDP. The data is read as 16-bit
//     words, the words are added, and every carry out of bit 15 is added back in (one's
//     complement addition). The checksum is the complement of that sum, so that data plus
//     checksum add up to 0xFFFF. It is cheap, but a sum does not see order: two swapped
//     words give the same result.
// PT: Checksum da Internet (RFC 1071), usado por IP, TCP e UDP. Os dados são lidos como
//     palavras de 16 bits, as palavras são somadas, e todo vai-um para fora do bit 15 é
//     somado de volta (soma em complemento de um). O checksum é o complemento dessa soma,
//     de modo que dados mais checksum somem 0xFFFF. É barato, mas uma soma não enxerga a
//     ordem: duas palavras trocadas dão o mesmo resultado.
inline std::uint16_t internet_checksum(std::span<const std::uint8_t> data) {
	std::uint64_t sum = 0;
	for (std::size_t i = 0; i + 1 < data.size(); i += 2) {
		sum += static_cast<std::uint64_t>(data[i]) << 8 | data[i + 1];
	}
	if (data.size() % 2 == 1) {
		// An odd last byte is padded with a zero byte on the right.
		sum += static_cast<std::uint64_t>(data.back()) << 8;
	}
	while (sum >> 16 != 0) {
		sum = (sum & 0xFFFF) + (sum >> 16);
	}
	return static_cast<std::uint16_t>(~sum);
}

// EN: CRC-32 as used by Ethernet, zip and PNG. The message is treated as a long polynomial
//     with coefficients 0 and 1 and divided by a fixed generator polynomial of degree 32;
//     the remainder is the CRC. Subtraction of such polynomials is XOR, so the division is
//     a loop of shifts and XORs. This variant processes the low bit first ("reflected"),
//     which is why the generator 0x04C11DB7 appears bit-reversed as 0xEDB88320. It starts
//     from all ones and inverts the result, so that leading and trailing zero bytes also
//     change the CRC.
// PT: CRC-32 como usado por Ethernet, zip e PNG. A mensagem é tratada como um polinômio longo
//     com coeficientes 0 e 1 e dividida por um polinômio gerador fixo de grau 32; o resto é
//     o CRC. A subtração desses polinômios é XOR, então a divisão é um laço de deslocamentos
//     e XORs. Esta variante processa primeiro o bit baixo ("refletida"), e por isso o gerador
//     0x04C11DB7 aparece com os bits invertidos de ordem, 0xEDB88320. Ela começa com todos os
//     bits em 1 e inverte o resultado, para que bytes zero no início e no fim também mudem
//     o CRC.
inline constexpr std::uint32_t kCrc32Polynomial = 0xEDB88320U;

constexpr std::uint32_t crc32_step(std::uint32_t crc) {
	for (int bit = 0; bit < 8; ++bit) {
		crc = (crc & 1U) != 0 ? (crc >> 1) ^ kCrc32Polynomial : crc >> 1;
	}
	return crc;
}

inline std::uint32_t crc32_bitwise(std::span<const std::uint8_t> data) {
	std::uint32_t crc = 0xFFFFFFFFU;
	for (std::uint8_t byte : data) {
		crc = crc32_step(crc ^ byte);
	}
	return ~crc;
}

// EN: The 8 steps of the inner loop depend only on the low byte of the register. Computing
//     them once for each of the 256 byte values gives a table, and the CRC then costs one
//     lookup per byte instead of eight shifts. The table is built at compile time.
// PT: Os 8 passos do laço interno dependem apenas do byte baixo do registrador. Calculá-los
//     uma vez para cada um dos 256 valores de byte dá uma tabela, e o CRC passa a custar uma
//     consulta por byte em vez de oito deslocamentos. A tabela é montada em tempo de
//     compilação.
constexpr std::array<std::uint32_t, 256> make_crc32_table() {
	std::array<std::uint32_t, 256> table{};
	for (std::uint32_t value = 0; value < 256; ++value) {
		table[value] = crc32_step(value);
	}
	return table;
}

inline constexpr std::array<std::uint32_t, 256> kCrc32Table = make_crc32_table();

inline std::uint32_t crc32(std::span<const std::uint8_t> data) {
	std::uint32_t crc = 0xFFFFFFFFU;
	for (std::uint8_t byte : data) {
		crc = kCrc32Table[(crc ^ byte) & 0xFFU] ^ (crc >> 8);
	}
	return ~crc;
}

}  // namespace edc
