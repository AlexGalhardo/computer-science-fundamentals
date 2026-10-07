// EN: Two kinds of test. Correctness: every pivot strategy with every threshold sorts every
//     shape. Growth: with the first element as the pivot, sorted input must behave
//     quadratically, and median of three must not. Growth is checked with ratios of times, not
//     with absolute times: a ratio depends on the algorithm far more than on the machine, and
//     the limits leave a wide margin for noise.
// PT: Dois tipos de teste. Correção: toda estratégia de pivô com todo limiar ordena todo
//     formato. Crescimento: com o primeiro elemento como pivô, a entrada ordenada precisa se
//     comportar de forma quadrática, e a mediana de três não. O crescimento é conferido com
//     razões entre tempos, não com tempos absolutos: uma razão depende muito mais do algoritmo
//     que da máquina, e os limites deixam margem larga para ruído.
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <string>

#include "quicksort.hpp"

namespace {

using hybrid_quicksort::Pivot;
using hybrid_quicksort::Values;

int failures = 0;
int passed = 0;

void check(bool condition, const std::string& label) {
	if (condition) {
		++passed;
	} else {
		++failures;
		std::cerr << "FAILED " << label << '\n';
	}
}

double time_ms(const Values& input, Pivot pivot) {
	double best = 1e300;
	for (int repetition = 0; repetition < 3; ++repetition) {
		Values copy = input;
		const auto start = std::chrono::steady_clock::now();
		hybrid_quicksort::hybrid_quicksort(copy, pivot, 0);
		const std::chrono::duration<double, std::milli> elapsed =
		    std::chrono::steady_clock::now() - start;
		best = std::min(best, elapsed.count());
	}
	return best;
}

}  // namespace

int main() {
	const std::array<std::pair<std::string, Pivot>, 3> pivots{
	    {{"first", Pivot::kFirst}, {"random", Pivot::kRandom}, {"median3", Pivot::kMedianOfThree}}};
	const std::array<std::size_t, 5> thresholds{0, 5, 10, 20, 50};
	const std::array<std::string, 3> shapes{"random", "sorted", "reversed"};

	for (const auto& [name, pivot] : pivots) {
		for (const std::size_t threshold : thresholds) {
			for (const std::string& shape : shapes) {
				for (const std::size_t n : {0U, 1U, 2U, 3U, 17U, 1000U}) {
					Values values = hybrid_quicksort::make_input(shape, n);
					Values expected = values;
					std::ranges::sort(expected);
					hybrid_quicksort::hybrid_quicksort(values, pivot, threshold);
					check(values == expected, name + " k=" + std::to_string(threshold) + " " +
					                              shape + " n=" + std::to_string(n));
				}
			}
			Values duplicated{5, 3, 5, 1, 3, 3, 0, INT32_MAX, 5, 0, INT32_MAX, 3, 3, 3, 3};
			Values expected = duplicated;
			std::ranges::sort(expected);
			hybrid_quicksort::hybrid_quicksort(duplicated, pivot, threshold);
			check(duplicated == expected, name + " k=" + std::to_string(threshold) + " duplicated");
		}
	}

	// EN: Quadratic growth: when n grows 4 times, an O(n²) algorithm takes about 16 times longer
	//     and an O(n log n) one about 4.5 times. The limits 8 and 8 sit between the two, with a
	//     wide margin for noise.
	// PT: Crescimento quadrático: quando n cresce 4 vezes, um algoritmo O(n²) leva cerca de 16
	//     vezes mais tempo e um O(n log n) cerca de 4,5 vezes. Os limites 8 e 8 ficam entre os
	//     dois, com margem larga para ruído.
	const Values small = hybrid_quicksort::make_input("sorted", 10'000);
	const Values large = hybrid_quicksort::make_input("sorted", 40'000);
	const double first_ratio = time_ms(large, Pivot::kFirst) / time_ms(small, Pivot::kFirst);
	// EN: Median of three is so fast that 40,000 values take microseconds, too short to time
	//     reliably. Its growth is measured on inputs 50 times larger.
	// PT: A mediana de três é tão rápida que 40.000 valores levam microssegundos, pouco demais
	//     para cronometrar com confiança. O crescimento dela é medido em entradas 50 vezes maiores.
	const double median_ratio =
	    time_ms(hybrid_quicksort::make_input("sorted", 2'000'000), Pivot::kMedianOfThree) /
	    time_ms(hybrid_quicksort::make_input("sorted", 500'000), Pivot::kMedianOfThree);
	std::cout << "sorted input, n x4: first pivot x" << first_ratio << ", median of three x"
	          << median_ratio << '\n';
	check(first_ratio > 8.0, "first pivot is quadratic on sorted input");
	check(median_ratio < 8.0, "median of three is not quadratic on sorted input");
	check(time_ms(large, Pivot::kFirst) > 20.0 * time_ms(large, Pivot::kMedianOfThree),
	      "first pivot is far slower than median of three on sorted input");

	check(hybrid_quicksort::checksum({1, 2, 3}) == "1026", "checksum");
	std::cout << passed << " tests passed, " << failures << " failed\n";
	return failures == 0 ? EXIT_SUCCESS : EXIT_FAILURE;
}
