#pragma once

#include <cstddef>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "allocator.hpp"

// EN: A linear congruential generator. It is tiny and reproducible, and the Rust version uses
//     the same formula and seed, so both programs run exactly the same sequence of requests
//     and must print exactly the same table.
// PT: Um gerador congruente linear. Ele é minúsculo e reproduzível, e a versão em Rust usa a
//     mesma fórmula e a mesma semente, então os dois programas executam exatamente a mesma
//     sequência de pedidos e precisam imprimir exatamente a mesma tabela.
class Lcg {
public:
	explicit Lcg(std::uint32_t seed) : state_(seed) {}

	std::uint32_t next() {
		state_ = state_ * 1664525u + 1013904223u;
		return state_ >> 16;
	}

	std::size_t between(std::size_t low, std::size_t high) {
		return low + next() % (high - low + 1);
	}

private:
	std::uint32_t state_;
};

struct Workload {
	std::string name;
	std::size_t arena;
	std::size_t steps;
	std::uint32_t seed;
};

struct WorkloadResult {
	std::string strategy;
	std::size_t attempts = 0;
	std::size_t failures = 0;
	std::size_t peak_used = 0;
	/// Average over all steps, as a percentage.
	double external_fragmentation = 0.0;
	/// Average over all steps of wasted bytes inside blocks, as a percentage of the used bytes.
	double internal_fragmentation = 0.0;
};

inline const std::size_t kMinBuddyBlock = 16;

inline std::vector<Workload> workloads() {
	return {{"mixed", std::size_t{1} << 20, 20000, 2026},
	        {"small", std::size_t{1} << 16, 20000, 2026}};
}

// EN: "mixed" imitates a general-purpose heap: many small blocks, some medium ones and a few
//     large ones. "small" has only small blocks of similar size.
// PT: "mixed" imita um heap de uso geral: muitos blocos pequenos, alguns médios e poucos
//     grandes. "small" tem só blocos pequenos, de tamanho parecido.
inline std::size_t pick_size(const std::string& workload, Lcg& random) {
	if (workload == "small") {
		return random.between(8, 256);
	}
	const std::size_t dice = random.between(1, 100);
	if (dice <= 70) {
		return random.between(16, 512);
	}
	if (dice <= 95) {
		return random.between(513, 8192);
	}
	return random.between(8193, 65536);
}

inline std::vector<std::unique_ptr<Allocator>> make_allocators(std::size_t arena) {
	std::vector<std::unique_ptr<Allocator>> allocators;
	allocators.push_back(std::make_unique<ListAllocator>(arena, Fit::First));
	allocators.push_back(std::make_unique<ListAllocator>(arena, Fit::Best));
	allocators.push_back(std::make_unique<ListAllocator>(arena, Fit::Worst));
	allocators.push_back(std::make_unique<BuddyAllocator>(arena, kMinBuddyBlock));
	return allocators;
}

// EN: The benchmark. At every step the program either allocates a block of random size (55% of
//     the time) or frees a random live block. Allocations win, so the arena fills up, and from
//     then on a request fails whenever no hole is large enough. Counting those failures and
//     sampling the fragmentation at every step shows how well each strategy keeps the free
//     space usable.
// PT: O benchmark. A cada passo o programa aloca um bloco de tamanho aleatório (55% das vezes)
//     ou libera um bloco vivo aleatório. As alocações ganham, então a arena enche, e daí em
//     diante um pedido falha sempre que nenhuma lacuna é grande o bastante. Contar essas falhas
//     e medir a fragmentação a cada passo mostra quão bem cada estratégia mantém o espaço
//     livre aproveitável.
inline WorkloadResult run_workload(Allocator& allocator, const Workload& workload) {
	Lcg random(workload.seed);
	std::vector<std::size_t> live;
	WorkloadResult result;
	result.strategy = allocator.name();
	double external = 0.0;
	double internal = 0.0;
	for (std::size_t step = 0; step < workload.steps; ++step) {
		if (live.empty() || random.between(1, 100) <= 55) {
			const std::size_t size = pick_size(workload.name, random);
			result.attempts += 1;
			if (const auto offset = allocator.allocate(size)) {
				live.push_back(*offset);
			} else {
				result.failures += 1;
			}
		} else {
			const std::size_t index = random.next() % live.size();
			const std::size_t offset = live[index];
			live[index] = live.back();
			live.pop_back();
			allocator.release(offset);
		}
		const Stats stats = allocator.stats();
		result.peak_used = std::max(result.peak_used, stats.used);
		external += stats.external_fragmentation();
		if (stats.used > 0) {
			internal += static_cast<double>(stats.internal_fragmentation()) /
			            static_cast<double>(stats.used);
		}
	}
	const double steps = static_cast<double>(workload.steps);
	result.external_fragmentation = 100.0 * external / steps;
	result.internal_fragmentation = 100.0 * internal / steps;
	return result;
}
