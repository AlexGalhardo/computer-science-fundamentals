#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <format>
#include <span>
#include <string>
#include <vector>

#include "detection.hpp"
#include "hamming.hpp"

namespace edc {

// EN: A tiny pseudo-random generator (xorshift64*), written by hand so that the simulation
//     gives the same numbers on every machine and compiler. Never use it for security.
// PT: Um gerador pseudoaleatório minúsculo (xorshift64*), escrito à mão para que a simulação
//     dê os mesmos números em qualquer máquina e compilador. Nunca o use para segurança.
class Rng {
public:
	explicit Rng(std::uint64_t seed) : state_(seed == 0 ? 1 : seed) {}

	std::uint64_t next() {
		state_ ^= state_ >> 12;
		state_ ^= state_ << 25;
		state_ ^= state_ >> 27;
		return state_ * 0x2545F4914F6CDD1DULL;
	}

private:
	std::uint64_t state_;
};

// EN: The binary symmetric channel: every bit is flipped with the same probability, the bit
//     error rate (BER), independently of the others. It is the simplest model of noise and
//     the one under which Hamming codes are analysed. Real channels often produce bursts,
//     which this model does not.
// PT: O canal binário simétrico: cada bit é invertido com a mesma probabilidade, a taxa de
//     erro de bit (BER), independentemente dos outros. É o modelo mais simples de ruído e
//     aquele em que os códigos de Hamming são analisados. Canais reais costumam produzir
//     rajadas, o que este modelo não faz.
class BinarySymmetricChannel {
public:
	BinarySymmetricChannel(double bit_error_rate, std::uint64_t seed)
	    : rng_(seed), threshold_(to_threshold(bit_error_rate)), always_(bit_error_rate >= 1.0) {}

	bool flips() { return always_ || rng_.next() < threshold_; }

	/// Flips bits of a small word in place and returns how many were flipped.
	int transmit(std::uint32_t& word, int bits) {
		int flipped = 0;
		for (int bit = 0; bit < bits; ++bit) {
			if (flips()) {
				word ^= 1U << bit;
				++flipped;
			}
		}
		return flipped;
	}

	/// Flips bits of a frame in place and returns how many were flipped.
	int transmit(std::span<std::uint8_t> frame) {
		int flipped = 0;
		for (std::uint8_t& byte : frame) {
			for (int bit = 0; bit < 8; ++bit) {
				if (flips()) {
					byte ^= static_cast<std::uint8_t>(1U << bit);
					++flipped;
				}
			}
		}
		return flipped;
	}

private:
	// EN: A uniform 64-bit number is below p * 2^64 with probability p.
	// PT: Um número uniforme de 64 bits fica abaixo de p * 2^64 com probabilidade p.
	static std::uint64_t to_threshold(double bit_error_rate) {
		if (bit_error_rate <= 0.0 || bit_error_rate >= 1.0) {
			return 0;
		}
		return static_cast<std::uint64_t>(bit_error_rate * 18446744073709551616.0);
	}

	Rng rng_;
	std::uint64_t threshold_;
	bool always_;
};

// EN: What happened to the blocks of one scheme at one bit error rate.
//     detected:  the receiver noticed the error and would ask for a retransmission.
//     corrected: the receiver repaired the block and delivered the right data.
//     missed:    the receiver delivered wrong data believing it was right. The worst case.
// PT: O que aconteceu com os blocos de um esquema em uma taxa de erro de bit.
//     detected:  o receptor percebeu o erro e pediria retransmissão.
//     corrected: o receptor consertou o bloco e entregou os dados certos.
//     missed:    o receptor entregou dados errados achando que estavam certos. O pior caso.
struct Tally {
	std::string scheme;
	int block_bits = 0;
	int data_bits = 0;
	double bit_error_rate = 0.0;
	std::uint64_t blocks = 0;
	std::uint64_t clean = 0;
	std::uint64_t detected = 0;
	std::uint64_t corrected = 0;
	std::uint64_t missed = 0;

	std::uint64_t with_errors() const { return detected + corrected + missed; }
};

inline constexpr std::size_t kFramePayload = 32;

// EN: Detection only. A block is one data byte plus its parity bit, 9 bits on the wire.
// PT: Só detecção. Um bloco é um byte de dados mais seu bit de paridade, 9 bits no canal.
inline Tally simulate_parity(double ber, std::uint64_t blocks, std::uint64_t seed) {
	Tally tally{"Parity bit", 9, 8, ber, blocks};
	Rng payload(seed + 1);
	BinarySymmetricChannel channel(ber, seed);
	for (std::uint64_t i = 0; i < blocks; ++i) {
		const auto data = static_cast<std::uint8_t>(payload.next() >> 56);
		std::uint32_t word = data | static_cast<std::uint32_t>(even_parity({&data, 1})) << 8;
		if (channel.transmit(word, 9) == 0) {
			++tally.clean;
			continue;
		}
		const auto received = static_cast<std::uint8_t>(word & 0xFFU);
		const bool passes = even_parity({&received, 1}) == (word >> 8 & 1U);
		++(passes ? tally.missed : tally.detected);
	}
	return tally;
}

// EN: Detection only, on frames of 32 random bytes followed by the check field. `check_bytes`
//     is 2 for the Internet checksum and 4 for CRC-32. The receiver recomputes the check over
//     the received data and compares it with the received check field.
// PT: Só detecção, em quadros de 32 bytes aleatórios seguidos do campo de verificação.
//     `check_bytes` é 2 para o checksum da Internet e 4 para o CRC-32. O receptor recalcula a
//     verificação sobre os dados recebidos e compara com o campo de verificação recebido.
inline Tally simulate_frames(bool use_crc, double ber, std::uint64_t blocks, std::uint64_t seed) {
	const std::size_t check_bytes = use_crc ? 4 : 2;
	const int bits = static_cast<int>((kFramePayload + check_bytes) * 8);
	Tally tally{use_crc ? "CRC-32" : "Internet checksum", bits, kFramePayload * 8, ber, blocks};
	Rng payload(seed + 1);
	BinarySymmetricChannel channel(ber, seed);
	std::array<std::uint8_t, kFramePayload + 4> frame{};
	const auto check = [use_crc](std::span<const std::uint8_t> data) -> std::uint32_t {
		return use_crc ? crc32(data) : internet_checksum(data);
	};
	for (std::uint64_t i = 0; i < blocks; ++i) {
		for (std::size_t j = 0; j < kFramePayload; ++j) {
			frame[j] = static_cast<std::uint8_t>(payload.next() >> 56);
		}
		const std::span<std::uint8_t> data(frame.data(), kFramePayload);
		const std::uint32_t sent = check(data);
		for (std::size_t j = 0; j < check_bytes; ++j) {
			frame[kFramePayload + j] = static_cast<std::uint8_t>(sent >> (8 * j));
		}
		if (channel.transmit(std::span<std::uint8_t>(frame.data(), kFramePayload + check_bytes)) ==
		    0) {
			++tally.clean;
			continue;
		}
		std::uint32_t received = 0;
		for (std::size_t j = 0; j < check_bytes; ++j) {
			received |= static_cast<std::uint32_t>(frame[kFramePayload + j]) << (8 * j);
		}
		++(check(data) == received ? tally.missed : tally.detected);
	}
	return tally;
}

// EN: Correction. A block carries one bit (repetition) or one nibble (Hamming). The result is
//     judged by comparing what the decoder delivers with what was sent, which only a
//     simulation can do: the real receiver never knows that it missed an error.
// PT: Correção. Um bloco carrega um bit (repetição) ou um nibble (Hamming). O resultado é
//     julgado comparando o que o decodificador entrega com o que foi enviado, o que só uma
//     simulação consegue fazer: o receptor real nunca sabe que deixou passar um erro.
enum class Corrector { kRepetition3, kHamming74, kHamming84 };

inline Tally simulate_corrector(Corrector code, double ber, std::uint64_t blocks,
                                std::uint64_t seed) {
	Tally tally;
	switch (code) {
		case Corrector::kRepetition3:
			tally = {"Repetition (3,1)", 3, 1, ber, blocks};
			break;
		case Corrector::kHamming74:
			tally = {"Hamming (7,4)", 7, 4, ber, blocks};
			break;
		case Corrector::kHamming84:
			tally = {"Hamming (8,4) SECDED", 8, 4, ber, blocks};
			break;
	}
	Rng payload(seed + 1);
	BinarySymmetricChannel channel(ber, seed);
	for (std::uint64_t i = 0; i < blocks; ++i) {
		const auto raw = static_cast<std::uint8_t>(payload.next() >> 56);
		const auto data = static_cast<std::uint8_t>(raw & ((1U << tally.data_bits) - 1));
		std::uint32_t word = code == Corrector::kRepetition3 ? repetition3_encode(data)
		                     : code == Corrector::kHamming74 ? hamming74_encode(data)
		                                                     : hamming84_encode(data);
		if (channel.transmit(word, tally.block_bits) == 0) {
			++tally.clean;
			continue;
		}
		const auto received = static_cast<std::uint8_t>(word);
		const Decoded decoded = code == Corrector::kRepetition3 ? repetition3_decode(received)
		                        : code == Corrector::kHamming74 ? hamming74_decode(received)
		                                                        : hamming84_decode(received);
		if (decoded.outcome == Outcome::kDetected) {
			++tally.detected;
		} else if (decoded.data == data) {
			++tally.corrected;
		} else {
			++tally.missed;
		}
	}
	return tally;
}

inline constexpr std::array<double, 5> kBitErrorRates = {0.0001, 0.001, 0.01, 0.05, 0.1};

inline std::vector<Tally> simulate_all(std::uint64_t blocks, std::uint64_t seed) {
	std::vector<Tally> tallies;
	for (double ber : kBitErrorRates) {
		tallies.push_back(simulate_parity(ber, blocks, seed));
	}
	for (bool use_crc : {false, true}) {
		for (double ber : kBitErrorRates) {
			tallies.push_back(simulate_frames(use_crc, ber, blocks, seed));
		}
	}
	for (Corrector code : {Corrector::kRepetition3, Corrector::kHamming74, Corrector::kHamming84}) {
		for (double ber : kBitErrorRates) {
			tallies.push_back(simulate_corrector(code, ber, blocks, seed));
		}
	}
	return tallies;
}

inline std::string to_markdown(const std::vector<Tally>& tallies) {
	std::string out =
	    "| Scheme | Block (bits) | BER | Blocks | With errors | Detected | Corrected | Missed "
	    "| Missed / with errors |\n"
	    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n";
	for (const Tally& tally : tallies) {
		const std::uint64_t errors = tally.with_errors();
		const std::string share =
		    errors == 0 ? "-"
		                : std::format("{:.3f}%", 100.0 * static_cast<double>(tally.missed) /
		                                             static_cast<double>(errors));
		out += std::format("| {} | {} | {:g} | {} | {} | {} | {} | {} | {} |\n", tally.scheme,
		                   tally.block_bits, tally.bit_error_rate, tally.blocks, errors,
		                   tally.detected, tally.corrected, tally.missed, share);
	}
	return out;
}

}  // namespace edc
