// EN: Same six cases as the TypeScript reference, for every algorithm. The oracle is std::sort:
//     being equal to it means ordered and a permutation of the input.
// PT: Mesmos seis casos da referência em TypeScript, para todo algoritmo. O oráculo é o
//     std::sort: ser igual a ele significa estar em ordem e ser uma permutação da entrada.
// ES: Los mismos seis casos de la referencia en TypeScript, para todo algoritmo. El oráculo es
//     std::sort: ser igual a él significa estar en orden y ser una permutación de la entrada.
#include <algorithm>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

#include "sorts.hpp"

namespace {

// EN: Linear congruential generator with a fixed seed, so the test is reproducible.
// PT: Gerador congruente linear com semente fixa, para o teste ser reproduzível.
// ES: Generador congruencial lineal con semilla fija, para que la prueba sea reproducible.
sorting_race::Values random_values(std::size_t n, std::int64_t seed) {
	sorting_race::Values values(n);
	std::int64_t state = seed;
	for (auto& value : values) {
		state = (state * 1103515245 + 12345) % (std::int64_t{1} << 31);
		value = static_cast<std::int32_t>(state);
	}
	return values;
}

}  // namespace

int main() {
	const std::vector<std::pair<std::string, sorting_race::Values>> cases{
	    {"empty", {}},
	    {"single element", {42}},
	    {"sorted", {1, 2, 3, 4, 5, 6, 7, 8}},
	    {"reversed", {8, 7, 6, 5, 4, 3, 2, 1}},
	    {"duplicated", {5, 3, 5, 1, 3, 3, 0, INT32_MAX, 5, 0, INT32_MAX}},
	    {"random", random_values(1000, 7)},
	};
	int failures = 0;
	int passed = 0;
	for (const auto& [name, sort] : sorting_race::kSorts) {
		for (const auto& [label, input] : cases) {
			auto expected = input;
			std::ranges::sort(expected);
			if (sort(input) == expected) {
				++passed;
			} else {
				++failures;
				std::cerr << "FAILED " << name << ": " << label << '\n';
			}
		}
	}
	if (sorting_race::checksum({1, 2, 3}) == "1026") {
		++passed;
	} else {
		++failures;
		std::cerr << "FAILED checksum\n";
	}
	std::cout << passed << " tests passed, " << failures << " failed\n";
	return failures == 0 ? EXIT_SUCCESS : EXIT_FAILURE;
}
