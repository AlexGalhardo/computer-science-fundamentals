#include <algorithm>
#include <array>
#include <bit>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <span>
#include <string>
#include <string_view>
#include <vector>

#include "detection.hpp"
#include "hamming.hpp"
#include "simulator.hpp"

namespace {

int failures = 0;
int checks = 0;

void check(bool condition, std::string_view what) {
	++checks;
	if (!condition) {
		++failures;
		std::cerr << "FAILED: " << what << "\n";
	}
}

std::vector<std::uint8_t> bytes_of(std::string_view text) { return {text.begin(), text.end()}; }

void test_parity() {
	// 1011001 has four 1 bits, so the even parity bit is 0.
	const std::array<std::uint8_t, 1> data = {0b1011001};
	check(edc::even_parity(data) == 0, "parity of 1011001 is 0");
	const std::array<std::uint8_t, 1> odd = {0b1011000};
	check(edc::even_parity(odd) == 1, "parity of 1011000 is 1");

	// EN: One flipped bit always changes the parity; two flipped bits never do.
	// PT: Um bit invertido sempre muda a paridade; dois bits invertidos nunca mudam.
	bool singles_caught = true;
	bool doubles_missed = true;
	for (int a = 0; a < 8; ++a) {
		std::array<std::uint8_t, 1> one = {static_cast<std::uint8_t>(data[0] ^ (1U << a))};
		singles_caught = singles_caught && edc::even_parity(one) != edc::even_parity(data);
		for (int b = a + 1; b < 8; ++b) {
			std::array<std::uint8_t, 1> two = {static_cast<std::uint8_t>(one[0] ^ (1U << b))};
			doubles_missed = doubles_missed && edc::even_parity(two) == edc::even_parity(data);
		}
	}
	check(singles_caught, "parity detects every single-bit error");
	check(doubles_missed, "parity misses every double-bit error");
}

void test_checksum() {
	// The worked example of RFC 1071: words 0001 f203 f4f5 f6f7 sum to ddf2, checksum 220d.
	std::vector<std::uint8_t> data = {0x00, 0x01, 0xF2, 0x03, 0xF4, 0xF5, 0xF6, 0xF7};
	check(edc::internet_checksum(data) == 0x220D, "RFC 1071 example gives 0x220D");

	// EN: Data followed by its checksum adds up to 0xFFFF, so the checksum of the whole is 0.
	// PT: Os dados seguidos do checksum somam 0xFFFF, então o checksum do conjunto é 0.
	std::vector<std::uint8_t> frame = data;
	frame.push_back(0x22);
	frame.push_back(0x0D);
	check(edc::internet_checksum(frame) == 0, "data plus checksum verifies to 0");

	bool singles_caught = true;
	for (std::size_t bit = 0; bit < data.size() * 8; ++bit) {
		std::vector<std::uint8_t> damaged = data;
		damaged[bit / 8] ^= static_cast<std::uint8_t>(1U << (bit % 8));
		singles_caught = singles_caught && edc::internet_checksum(damaged) != 0x220D;
	}
	check(singles_caught, "checksum detects every single-bit error");

	// EN: The weakness of a sum: swapping two words changes the data but not the total.
	// PT: A fraqueza de uma soma: trocar duas palavras muda os dados, mas não o total.
	std::vector<std::uint8_t> swapped = {0xF2, 0x03, 0x00, 0x01, 0xF4, 0xF5, 0xF6, 0xF7};
	check(edc::internet_checksum(swapped) == 0x220D, "checksum misses swapped words");
	check(edc::crc32(swapped) != edc::crc32(data), "CRC-32 detects swapped words");

	const std::array<std::uint8_t, 3> odd = {0x12, 0x34, 0x56};
	check(edc::internet_checksum(odd) == static_cast<std::uint16_t>(~(0x1234 + 0x5600)),
	      "odd length is padded with a zero byte");
}

void test_crc32() {
	// EN: The standard check value: every correct CRC-32 (IEEE 802.3) gives 0xCBF43926 for
	//     the nine ASCII characters "123456789".
	// PT: O valor de conferência padrão: todo CRC-32 (IEEE 802.3) correto dá 0xCBF43926 para
	//     os nove caracteres ASCII "123456789".
	const auto digits = bytes_of("123456789");
	check(edc::crc32(digits) == 0xCBF43926U, "CRC-32 of 123456789 (table)");
	check(edc::crc32_bitwise(digits) == 0xCBF43926U, "CRC-32 of 123456789 (bitwise)");
	check(edc::crc32({}) == 0, "CRC-32 of the empty message is 0");
	check(edc::crc32(bytes_of("a")) == 0xE8B7BE43U, "CRC-32 of a");

	edc::Rng rng(7);
	bool same = true;
	for (int round = 0; round < 200; ++round) {
		std::vector<std::uint8_t> data(rng.next() % 300);
		for (std::uint8_t& byte : data) {
			byte = static_cast<std::uint8_t>(rng.next() >> 56);
		}
		same = same && edc::crc32(data) == edc::crc32_bitwise(data);
	}
	check(same, "table and bitwise CRC-32 agree on random data");

	// EN: Guarantee of a degree 32 generator: every burst of up to 32 bits is detected. All
	//     bursts of up to 12 bits are tried at every position of a 16-byte frame, and then
	//     random bursts of up to 32 bits.
	// PT: Garantia de um gerador de grau 32: toda rajada de até 32 bits é detectada. Todas as
	//     rajadas de até 12 bits são testadas em cada posição de um quadro de 16 bytes, e
	//     depois rajadas aleatórias de até 32 bits.
	std::vector<std::uint8_t> frame(16);
	for (std::uint8_t& byte : frame) {
		byte = static_cast<std::uint8_t>(rng.next() >> 56);
	}
	const std::uint32_t original = edc::crc32(frame);
	const auto with_burst = [&frame](std::uint64_t pattern, std::size_t start) {
		std::vector<std::uint8_t> damaged = frame;
		for (std::size_t offset = 0; offset < 64 && start + offset < damaged.size() * 8; ++offset) {
			if ((pattern >> offset & 1U) != 0) {
				damaged[(start + offset) / 8] ^=
				    static_cast<std::uint8_t>(1U << ((start + offset) % 8));
			}
		}
		return damaged;
	};
	bool bursts_caught = true;
	for (std::size_t start = 0; start < frame.size() * 8; ++start) {
		// A burst starts with a flipped bit, so only odd patterns are bursts at `start`.
		for (std::uint64_t pattern = 1; pattern < (1U << 12); pattern += 2) {
			bursts_caught = bursts_caught && edc::crc32(with_burst(pattern, start)) != original;
		}
	}
	check(bursts_caught, "CRC-32 detects every burst of up to 12 bits");
	bool long_bursts_caught = true;
	for (int round = 0; round < 100'000; ++round) {
		const std::uint64_t pattern = (rng.next() & 0xFFFFFFFFULL) | 1U;
		const std::size_t start = rng.next() % (frame.size() * 8 - 32);
		long_bursts_caught =
		    long_bursts_caught && edc::crc32(with_burst(pattern, start)) != original;
	}
	check(long_bursts_caught, "CRC-32 detects random bursts of up to 32 bits");
}

void test_hamming74() {
	// The example of the quiz: data 1011 becomes 0110011 (positions 1 to 7).
	check(edc::positions_text(edc::hamming74_encode(0b1011), 7) == "0110011",
	      "Hamming(7,4) of 1011 is 0110011");
	// 0110001 is that word with position 6 flipped: the syndrome must say 6.
	check(edc::hamming_syndrome(0b1000110) == 6, "syndrome of 0110001 is 6");

	bool valid = true;
	int minimum_distance = 7;
	for (unsigned a = 0; a < 16; ++a) {
		const std::uint8_t word = edc::hamming74_encode(static_cast<std::uint8_t>(a));
		const edc::Decoded decoded = edc::hamming74_decode(word);
		valid = valid && edc::hamming_syndrome(word) == 0 && decoded.data == a &&
		        decoded.outcome == edc::Outcome::kClean;
		for (unsigned b = a + 1; b < 16; ++b) {
			const std::uint8_t other = edc::hamming74_encode(static_cast<std::uint8_t>(b));
			minimum_distance =
			    std::min(minimum_distance, std::popcount(static_cast<std::uint8_t>(word ^ other)));
		}
	}
	check(valid, "all 16 codewords have syndrome 0 and decode to their data");
	check(minimum_distance == 3, "Hamming(7,4) has minimum distance 3");

	// EN: Exhaustive: 16 codewords times 7 positions. Every single-bit error is corrected.
	// PT: Exaustivo: 16 palavras vezes 7 posições. Todo erro de um bit é corrigido.
	int corrected = 0;
	// EN: Exhaustive: 16 codewords times 21 pairs of positions. Every double error is
	//     "corrected" into the wrong data, which is the limit of distance 3.
	// PT: Exaustivo: 16 palavras vezes 21 pares de posições. Todo erro duplo é "corrigido"
	//     para os dados errados, que é o limite da distância 3.
	int miscorrected = 0;
	for (unsigned data = 0; data < 16; ++data) {
		const std::uint8_t word = edc::hamming74_encode(static_cast<std::uint8_t>(data));
		for (int a = 0; a < 7; ++a) {
			const auto one = static_cast<std::uint8_t>(word ^ (1U << a));
			const edc::Decoded decoded = edc::hamming74_decode(one);
			if (decoded.data == data && decoded.outcome == edc::Outcome::kCorrected &&
			    edc::hamming_syndrome(one) == static_cast<unsigned>(a + 1)) {
				++corrected;
			}
			for (int b = a + 1; b < 7; ++b) {
				const auto two = static_cast<std::uint8_t>(one ^ (1U << b));
				if (edc::hamming74_decode(two).data != data) {
					++miscorrected;
				}
			}
		}
	}
	check(corrected == 16 * 7, "every single-bit error in every codeword is corrected");
	check(miscorrected == 16 * 21, "every double-bit error is miscorrected by Hamming(7,4)");
}

void test_hamming84() {
	int minimum_distance = 8;
	int singles_corrected = 0;
	int doubles_detected = 0;
	for (unsigned data = 0; data < 16; ++data) {
		const std::uint8_t word = edc::hamming84_encode(static_cast<std::uint8_t>(data));
		const edc::Decoded clean = edc::hamming84_decode(word);
		check(clean.data == data && clean.outcome == edc::Outcome::kClean, "(8,4) clean word");
		for (unsigned other = data + 1; other < 16; ++other) {
			const std::uint8_t second = edc::hamming84_encode(static_cast<std::uint8_t>(other));
			minimum_distance =
			    std::min(minimum_distance, std::popcount(static_cast<std::uint8_t>(word ^ second)));
		}
		for (int a = 0; a < 8; ++a) {
			const auto one = static_cast<std::uint8_t>(word ^ (1U << a));
			const edc::Decoded decoded = edc::hamming84_decode(one);
			if (decoded.data == data && decoded.outcome == edc::Outcome::kCorrected) {
				++singles_corrected;
			}
			for (int b = a + 1; b < 8; ++b) {
				const auto two = static_cast<std::uint8_t>(one ^ (1U << b));
				if (edc::hamming84_decode(two).outcome == edc::Outcome::kDetected) {
					++doubles_detected;
				}
			}
		}
	}
	check(minimum_distance == 4, "Hamming(8,4) has minimum distance 4");
	check(singles_corrected == 16 * 8, "(8,4) corrects every single-bit error");
	check(doubles_detected == 16 * 28, "(8,4) detects every double-bit error");
}

void test_repetition() {
	check(edc::repetition3_encode(1) == 0b111 && edc::repetition3_encode(0) == 0,
	      "repetition encodes");
	// The quiz example: blocks 011, 110, 010 decode to 1, 1, 0.
	check(edc::repetition3_decode(0b110).data == 1, "majority of 011");
	check(edc::repetition3_decode(0b011).data == 1, "majority of 110");
	check(edc::repetition3_decode(0b010).data == 0, "majority of 010");
	check(edc::repetition3_decode(0b111).outcome == edc::Outcome::kClean, "111 is clean");
}

void test_simulator() {
	constexpr std::uint64_t kBlocks = 20'000;
	// EN: With no noise nothing is damaged, whatever the scheme.
	// PT: Sem ruído nada é danificado, qualquer que seja o esquema.
	check(edc::simulate_parity(0.0, kBlocks, 1).clean == kBlocks, "BER 0: parity");
	check(edc::simulate_frames(true, 0.0, kBlocks, 1).clean == kBlocks, "BER 0: CRC-32");
	check(edc::simulate_corrector(edc::Corrector::kHamming74, 0.0, kBlocks, 1).clean == kBlocks,
	      "BER 0: Hamming(7,4)");

	const std::vector<edc::Tally> first = edc::simulate_all(kBlocks, 2026);
	const std::vector<edc::Tally> second = edc::simulate_all(kBlocks, 2026);
	check(edc::to_markdown(first) == edc::to_markdown(second), "same seed, same table");
	check(first.size() == 30, "6 schemes times 5 bit error rates");

	bool totals = true;
	for (const edc::Tally& tally : first) {
		totals = totals && tally.clean + tally.with_errors() == tally.blocks;
		const bool detector = tally.scheme == "Parity bit" || tally.scheme == "CRC-32" ||
		                      tally.scheme == "Internet checksum";
		// A detector never corrects; plain Hamming and repetition never say "detected".
		totals =
		    totals && (detector ? tally.corrected == 0
		                        : tally.scheme == "Hamming (8,4) SECDED" || tally.detected == 0);
		if (tally.scheme == "CRC-32") {
			totals = totals && tally.missed == 0;
		}
	}
	check(totals, "tallies are consistent");

	// EN: The measured share of damaged blocks must match the formula 1 - (1 - p)^n.
	// PT: A fração medida de blocos danificados precisa bater com a fórmula 1 - (1 - p)^n.
	const edc::Tally hamming =
	    edc::simulate_corrector(edc::Corrector::kHamming74, 0.05, 200'000, 3);
	const double measured = static_cast<double>(hamming.with_errors()) / 200'000.0;
	const double expected = 1.0 - 0.95 * 0.95 * 0.95 * 0.95 * 0.95 * 0.95 * 0.95;
	check(measured > expected - 0.005 && measured < expected + 0.005,
	      "share of damaged Hamming blocks matches 1 - (1 - p)^7");
	// With one flipped bit every block is repaired, so missed blocks are those with 2 or more.
	check(hamming.corrected > hamming.missed * 4, "at BER 0.05 most damaged blocks are corrected");
}

}  // namespace

int main() {
	test_parity();
	test_checksum();
	test_crc32();
	test_hamming74();
	test_hamming84();
	test_repetition();
	test_simulator();
	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << checks << " checks passed\n";
	return EXIT_SUCCESS;
}
