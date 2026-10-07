// EN: `bench <algorithm> <variant> <n>` reads `data/<variant>-<n>.txt`, sorts it and prints one
//     JSON line in the benchmark contract. Only the sort is timed.
// PT: `bench <algoritmo> <variante> <n>` lê `data/<variante>-<n>.txt`, ordena e imprime uma
//     linha JSON no contrato de benchmark. Só a ordenação é cronometrada.
#include <sys/resource.h>

#include <algorithm>
#include <array>
#include <chrono>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>

#include "sorts.hpp"

namespace {

const std::array<std::string, 3> kVariants{"random", "sorted", "reversed"};

// EN: The file is external input: a value that is not an integer from 0 to 2^31 - 1 is an error.
// PT: O arquivo é entrada externa: um valor que não é um inteiro de 0 a 2^31 - 1 é um erro.
sorting_race::Values read_values(const std::string& path, std::size_t expected) {
	std::ifstream file(path);
	if (!file) {
		throw std::runtime_error(path + ": cannot open");
	}
	sorting_race::Values values;
	values.reserve(expected);
	std::int64_t value = 0;
	while (file >> value) {
		if (value < 0 || value > INT32_MAX) {
			throw std::runtime_error(path + ": values must be between 0 and 2^31 - 1");
		}
		values.push_back(static_cast<std::int32_t>(value));
	}
	if (!file.eof() || values.size() != expected) {
		throw std::runtime_error(path + ": expected " + std::to_string(expected) +
		                         " integers, found " + std::to_string(values.size()));
	}
	return values;
}

int run(int argc, char** argv) {
	const std::string usage = "usage: bench <algorithm> <random|sorted|reversed> <n>";
	if (argc != 4) {
		throw std::invalid_argument(usage);
	}
	const std::string implementation = argv[1];
	const std::string variant = argv[2];
	const auto sort = std::ranges::find(sorting_race::kSorts, implementation,
	                                    [](const auto& entry) { return entry.first; });
	if (sort == sorting_race::kSorts.end() ||
	    std::ranges::find(kVariants, variant) == kVariants.end()) {
		throw std::invalid_argument(usage);
	}
	const std::size_t n = std::stoul(argv[3]);
	const auto values = read_values("data/" + variant + "-" + std::to_string(n) + ".txt", n);

	// EN: Up to 5 runs while the total stays under 300 ms, and the fastest one is reported: the
	//     minimum is the measurement least disturbed by other programs on the machine.
	// PT: Até 5 execuções enquanto o total fica abaixo de 300 ms, e a mais rápida é informada: o
	//     mínimo é a medida menos perturbada por outros programas na máquina.
	sorting_race::Values sorted;
	double elapsed_ms = 0;
	double spent_ms = 0;
	for (int repetition = 0; repetition < 5 && (repetition == 0 || spent_ms < 300); ++repetition) {
		const auto start = std::chrono::steady_clock::now();
		sorted = sort->second(values);
		const std::chrono::duration<double, std::milli> took =
		    std::chrono::steady_clock::now() - start;
		elapsed_ms = repetition == 0 ? took.count() : std::min(elapsed_ms, took.count());
		spent_ms += took.count();
	}

	// EN: On Linux, ru_maxrss is the peak resident memory of the process in kibibytes.
	// PT: No Linux, ru_maxrss é o pico de memória residente do processo em kibibytes.
	rusage usage_info{};
	getrusage(RUSAGE_SELF, &usage_info);

	std::cout << "{\"n\":" << n << ",\"elapsedMs\":" << std::fixed << elapsed_ms
	          << ",\"memoryKb\":" << usage_info.ru_maxrss
	          << R"(,"language":"cpp","implementation":")" << implementation << R"(","checksum":")"
	          << sorting_race::checksum(sorted) << "\"}\n";
	return EXIT_SUCCESS;
}

}  // namespace

int main(int argc, char** argv) {
	try {
		return run(argc, argv);
	} catch (const std::exception& error) {
		std::cerr << error.what() << '\n';
		return EXIT_FAILURE;
	}
}
