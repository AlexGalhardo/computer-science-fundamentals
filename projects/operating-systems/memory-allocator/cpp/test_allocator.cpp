// EN: Tests without a framework: each CHECK records a failure and the program exits with a
//     non-zero code if any failed. That is all a test runner needs to be.
// PT: Testes sem framework: cada CHECK registra uma falha, e o programa termina com código
//     diferente de zero se alguma falhou. Um executor de testes não precisa ser mais que isso.

#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

#include "allocator.hpp"
#include "workload.hpp"

namespace {

int failures = 0;
int checks = 0;

void check(bool condition, const char* expression, int line) {
	checks += 1;
	if (!condition) {
		failures += 1;
		std::cerr << "FAILED line " << line << ": " << expression << "\n";
	}
}

#define CHECK(condition) check((condition), #condition, __LINE__)

// EN: The invariant behind "no two live blocks overlap": sorted by offset, each block must end
//     at or before the start of the next one, and the last one must end inside the arena.
// PT: O invariante por trás de "dois blocos vivos nunca se sobrepõem": ordenados por
//     deslocamento, cada bloco precisa terminar antes do início do seguinte ou exatamente
//     nele, e o último precisa terminar dentro da arena.
bool no_overlap(const Allocator& allocator, std::size_t arena) {
	std::vector<LiveBlock> live = allocator.live_blocks();
	std::sort(live.begin(), live.end(),
	          [](const LiveBlock& a, const LiveBlock& b) { return a.offset < b.offset; });
	std::size_t cursor = 0;
	for (const LiveBlock& block : live) {
		if (block.offset < cursor) {
			return false;
		}
		cursor = block.offset + block.size;
	}
	return cursor <= arena;
}

// EN: Builds the textbook list of holes 12, 5, 30, 8 and 20 (in address order), separated by
//     one-unit blocks that stay in use so the holes cannot merge.
// PT: Monta a lista de lacunas de livro 12, 5, 30, 8 e 20 (em ordem de endereço), separadas por
//     blocos de uma unidade que continuam em uso para que as lacunas não se fundam.
std::vector<std::size_t> make_holes(ListAllocator& allocator) {
	std::vector<std::size_t> holes;
	for (const std::size_t size : {12, 5, 30, 8, 20}) {
		holes.push_back(*allocator.allocate(size));
		allocator.allocate(1);
	}
	for (const std::size_t offset : holes) {
		allocator.release(offset);
	}
	return holes;
}

void test_fit_strategies_choose_the_documented_hole() {
	// Holes start at 0 (12), 13 (5), 19 (30), 50 (8) and 59 (20).
	ListAllocator first(80, Fit::First);
	make_holes(first);
	CHECK(first.allocate(7) == 0u);

	ListAllocator best(80, Fit::Best);
	make_holes(best);
	CHECK(best.allocate(7) == 50u);

	ListAllocator worst(80, Fit::Worst);
	make_holes(worst);
	CHECK(worst.allocate(7) == 19u);
}

void test_list_allocator_splits_and_refuses() {
	ListAllocator allocator(100, Fit::First);
	CHECK(allocator.allocate(40) == 0u);
	CHECK(allocator.allocate(60) == 40u);
	CHECK(!allocator.allocate(1));
	CHECK(!allocator.allocate(0));
	CHECK(allocator.release(0));
	CHECK(!allocator.release(0));
	CHECK(!allocator.release(7));
	CHECK(allocator.stats().used == 60);
	CHECK(allocator.stats().internal_fragmentation() == 0);
}

void test_external_fragmentation_blocks_a_request_that_would_fit_in_total() {
	ListAllocator allocator(100, Fit::First);
	std::vector<std::size_t> offsets;
	for (int i = 0; i < 10; ++i) {
		offsets.push_back(*allocator.allocate(10));
	}
	for (std::size_t i = 0; i < offsets.size(); i += 2) {
		allocator.release(offsets[i]);
	}
	const Stats stats = allocator.stats();
	CHECK(stats.free_bytes() == 50);
	CHECK(stats.largest_free == 10);
	CHECK(stats.free_blocks == 5);
	CHECK(stats.external_fragmentation() > 0.79 && stats.external_fragmentation() < 0.81);
	CHECK(!allocator.allocate(20));
}

void test_coalescing_merges_neighbours_on_both_sides() {
	ListAllocator allocator(30, Fit::First);
	const std::size_t a = *allocator.allocate(10);
	const std::size_t b = *allocator.allocate(10);
	const std::size_t c = *allocator.allocate(10);
	allocator.release(a);
	allocator.release(c);
	CHECK(allocator.stats().free_blocks == 2);
	allocator.release(b);
	CHECK(allocator.stats().free_blocks == 1);
	CHECK(allocator.stats().largest_free == 30);
}

void test_buddy_rounds_up_splits_and_merges() {
	BuddyAllocator allocator(1024, 16);
	const auto a = allocator.allocate(70);
	CHECK(a == 0u);
	Stats stats = allocator.stats();
	CHECK(stats.used == 128);
	CHECK(stats.internal_fragmentation() == 58);
	// EN: 1024 was split into 512 + 256 + 128 + the block of 128 that was handed out.
	// PT: 1024 foi dividido em 512 + 256 + 128 + o bloco de 128 que foi entregue.
	CHECK(stats.free_blocks == 3);
	CHECK(stats.largest_free == 512);
	// EN: The next block of 128 is the buddy of the first: offset 0 XOR 128.
	// PT: O próximo bloco de 128 é o companheiro do primeiro: deslocamento 0 XOR 128.
	const auto b = allocator.allocate(100);
	CHECK(b == 128u);
	CHECK(allocator.allocate(1) == 256u);
	CHECK(allocator.stats().used == 128 + 128 + 16);
	CHECK(allocator.release(0));
	CHECK(allocator.release(128));
	CHECK(allocator.release(256));
	stats = allocator.stats();
	CHECK(stats.free_blocks == 1);
	CHECK(stats.largest_free == 1024);
	CHECK(!allocator.allocate(2000));
	CHECK(!allocator.release(64));
}

void test_invalid_arguments_are_rejected() {
	bool thrown = false;
	try {
		BuddyAllocator allocator(1000, 16);
	} catch (const std::invalid_argument&) {
		thrown = true;
	}
	CHECK(thrown);
}

// EN: The randomised test of the acceptance criteria. For every strategy: thousands of random
//     allocations and frees, the no-overlap invariant checked after each one, and at the end
//     everything is freed in random order and the arena must be one free block again.
// PT: O teste aleatório dos critérios de aceite. Para cada estratégia: milhares de alocações e
//     liberações aleatórias, o invariante de não sobreposição conferido depois de cada uma, e
//     no fim tudo é liberado em ordem aleatória, e a arena precisa voltar a ser um bloco livre só.
void test_random_operations_never_overlap_and_everything_coalesces() {
	const std::size_t arena = 1 << 14;
	for (std::uint32_t seed = 1; seed <= 5; ++seed) {
		for (const auto& allocator : make_allocators(arena)) {
			Lcg random(seed);
			std::vector<std::size_t> live;
			bool overlap = false;
			std::size_t refused = 0;
			for (int step = 0; step < 3000; ++step) {
				if (live.empty() || random.between(1, 100) <= 60) {
					if (const auto offset = allocator->allocate(random.between(1, 700))) {
						live.push_back(*offset);
					} else {
						refused += 1;
					}
				} else {
					const std::size_t index = random.next() % live.size();
					CHECK(allocator->release(live[index]));
					live[index] = live.back();
					live.pop_back();
				}
				overlap = overlap || !no_overlap(*allocator, arena);
			}
			CHECK(!overlap);
			CHECK(refused > 0);
			CHECK(allocator->stats().live_blocks == live.size());
			while (!live.empty()) {
				const std::size_t index = random.next() % live.size();
				CHECK(allocator->release(live[index]));
				live[index] = live.back();
				live.pop_back();
			}
			const Stats stats = allocator->stats();
			CHECK(stats.used == 0);
			CHECK(stats.free_blocks == 1);
			CHECK(stats.largest_free == arena);
		}
	}
}

void test_benchmark_is_reproducible() {
	Lcg random(1);
	CHECK(random.next() == 15496u);
	CHECK(random.next() == 24200u);
	const Workload workload = workloads().front();
	ListAllocator first(workload.arena, Fit::First);
	ListAllocator again(workload.arena, Fit::First);
	const WorkloadResult a = run_workload(first, workload);
	const WorkloadResult b = run_workload(again, workload);
	CHECK(a.attempts == b.attempts && a.failures == b.failures);
	CHECK(a.external_fragmentation == b.external_fragmentation);
	CHECK(a.failures > 0);
	CHECK(a.internal_fragmentation == 0.0);
	BuddyAllocator buddy(workload.arena, kMinBuddyBlock);
	CHECK(run_workload(buddy, workload).internal_fragmentation > 0.0);
}

}  // namespace

int main() {
	test_fit_strategies_choose_the_documented_hole();
	test_list_allocator_splits_and_refuses();
	test_external_fragmentation_blocks_a_request_that_would_fit_in_total();
	test_coalescing_merges_neighbours_on_both_sides();
	test_buddy_rounds_up_splits_and_merges();
	test_invalid_arguments_are_rejected();
	test_random_operations_never_overlap_and_everything_coalesces();
	test_benchmark_is_reproducible();
	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << "8 tests passed (" << checks << " checks)\n";
	return EXIT_SUCCESS;
}
