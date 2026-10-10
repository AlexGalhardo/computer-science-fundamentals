// Tests of the C++ implementation. No framework: each check prints what failed, and the
// process exits with a non-zero code when any check fails.

#include <cstdint>
#include <cstdlib>
#include <initializer_list>
#include <iostream>
#include <string>

#include "mandelbrot.hpp"
#include "primes.hpp"
#include "schedule.hpp"

namespace {

int failures = 0;
int checks = 0;

void check(bool condition, const std::string& what) {
	++checks;
	if (!condition) {
		++failures;
		std::cerr << "FAILED: " << what << '\n';
	}
}

const std::initializer_list<unsigned> kWorkerCounts = {1, 2, 3, 4, 8};
const std::initializer_list<Schedule> kSchedules = {Schedule::Static, Schedule::Dynamic};

void test_split_static() {
	for (const std::uint64_t total : {0ULL, 1ULL, 7ULL, 8ULL, 9ULL, 1000ULL}) {
		for (const unsigned workers : kWorkerCounts) {
			const std::vector<Span> spans = split_static(total, workers);
			check(spans.size() == workers, "split_static returns one span per worker");
			std::uint64_t expected_start = 0;
			for (const Span& block : spans) {
				check(block.start == expected_start, "spans have no gap and no overlap");
				expected_start = block.end;
			}
			check(expected_start == total, "spans cover every item");
		}
	}
}

void test_primes_known_values() {
	check(count_sequential(100) == PrimeStats{25, 1060}, "primes up to 100");
	check(count_sequential(100'000) == PrimeStats{9592, 454'396'537}, "primes up to 100000");
}

// EN: The acceptance test of the mini-project: for every worker count and both schedules, the
//     parallel result is exactly the sequential one. The limits include cases with fewer
//     numbers than workers and a limit that is not a multiple of the chunk.
// PT: O teste de aceitação do mini-projeto: para toda quantidade de trabalhadores e para os
//     dois escalonamentos, o resultado paralelo é exatamente o sequencial. Os limites incluem
//     casos com menos números que trabalhadores e um limite que não é múltiplo do pedaço.
// ES: La prueba de aceptación del mini-proyecto: para toda cantidad de trabajadores y para las
//     dos planificaciones, el resultado paralelo es exactamente el secuencial. Los límites
//     incluyen casos con menos números que trabajadores y un límite que no es múltiplo de la
//     porción.
void test_primes_parallel_equals_sequential() {
	for (const std::uint64_t limit :
	     {0ULL, 1ULL, 2ULL, 3ULL, 10ULL, 9'999ULL, 10'000ULL, 10'001ULL, 123'457ULL}) {
		const PrimeStats expected = count_sequential(limit);
		for (const unsigned workers : kWorkerCounts) {
			for (const Schedule schedule : kSchedules) {
				check(count_parallel(limit, workers, schedule) == expected,
				      "parallel primes equal sequential, limit " + std::to_string(limit) + ", " +
				          std::to_string(workers) + " workers");
			}
		}
	}
}

void test_escape_time() {
	check(escape_time(0.0, 0.0, 1000) == 1000, "the origin is inside the set");
	check(escape_time(-2.0, -1.5, 1000) == 1, "the corner leaves after one step");
	check(escape_time(1.0, 0.0, 1000) == 3, "c = 1 leaves after three steps");
}

// EN: The same golden values are asserted by the Rust and Go tests, which proves that the
//     three languages render the same image bit for bit.
// PT: Os mesmos valores de referência são verificados pelos testes de Rust e Go, o que prova
//     que as três linguagens geram a mesma imagem bit a bit.
// ES: Los mismos valores de referencia se verifican en las pruebas de Rust y Go, lo que prueba
//     que los tres lenguajes generan la misma imagen bit a bit.
void test_mandelbrot_golden_image() {
	const Image image = render_sequential(64, kMaxIter);
	check(image.total_iterations == 717'248, "golden total iterations");
	check(image.checksum() == 0x6728d00fa67ee48dULL, "golden checksum");
}

void test_mandelbrot_parallel_equals_sequential() {
	for (const std::size_t side : {0UZ, 1UZ, 2UZ, 3UZ, 7UZ, 64UZ, 97UZ}) {
		const Image expected = render_sequential(side, 200);
		for (const unsigned workers : kWorkerCounts) {
			for (const Schedule schedule : kSchedules) {
				check(render_parallel(side, 200, workers, schedule) == expected,
				      "parallel image equals sequential, side " + std::to_string(side) + ", " +
				          std::to_string(workers) + " workers");
			}
		}
	}
}

}  // namespace

int main() {
	test_split_static();
	test_primes_known_values();
	test_primes_parallel_equals_sequential();
	test_escape_time();
	test_mandelbrot_golden_image();
	test_mandelbrot_parallel_equals_sequential();
	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << checks << " checks passed\n";
	return EXIT_SUCCESS;
}
