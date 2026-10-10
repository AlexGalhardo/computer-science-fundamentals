// EN: Two modes.
//     `bench <pivot>-k<threshold> <shape> <n>` sorts one input and prints one JSON line in the
//     benchmark contract, for example `bench median3-k10 random 1000000`.
//     `bench sweep <n>` sorts the same random input with thresholds 0, 5, 10, 20 and 50 and
//     prints a Markdown table with the best one.
// PT: Dois modos.
//     `bench <pivô>-k<limiar> <formato> <n>` ordena uma entrada e imprime uma linha JSON no
//     contrato de benchmark, por exemplo `bench median3-k10 random 1000000`.
//     `bench sweep <n>` ordena a mesma entrada aleatória com limiares 0, 5, 10, 20 e 50 e
//     imprime uma tabela Markdown com o melhor.
// ES: Dos modos.
//     `bench <pivote>-k<umbral> <forma> <n>` ordena una entrada e imprime una línea JSON en el
//     contrato de benchmark, por ejemplo `bench median3-k10 random 1000000`.
//     `bench sweep <n>` ordena la misma entrada aleatoria con umbrales 0, 5, 10, 20 y 50 e
//     imprime una tabla Markdown con el mejor.
#include <sys/resource.h>

#include <algorithm>
#include <array>
#include <chrono>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <map>
#include <stdexcept>
#include <string>
#include <vector>

#include "quicksort.hpp"

namespace {

using hybrid_quicksort::Pivot;
using hybrid_quicksort::Values;

constexpr std::size_t kMaxN = 5'000'000;
constexpr std::size_t kMaxThreshold = 1000;
constexpr int kRepetitions = 5;
const std::array<std::size_t, 5> kThresholds{0, 5, 10, 20, 50};
const std::map<std::string, Pivot> kPivots{
    {"first", Pivot::kFirst}, {"random", Pivot::kRandom}, {"median3", Pivot::kMedianOfThree}};
const std::string kUsage =
    "usage: bench <first|random|median3>-k<threshold> <random|sorted|reversed> <n>\n"
    "       bench sweep <n>";

std::size_t parse_number(const std::string& text, std::size_t limit) {
	if (text.empty() || text.size() > 9 || !std::ranges::all_of(text, ::isdigit)) {
		throw std::invalid_argument(kUsage);
	}
	const std::size_t value = std::stoul(text);
	if (value > limit) {
		throw std::invalid_argument("number out of range: " + text);
	}
	return value;
}

// EN: The sort is repeated on fresh copies of the input and the median time is reported. One
//     run of a few milliseconds is too noisy to tell threshold 10 from threshold 20.
// PT: A ordenação é repetida em cópias novas da entrada e o tempo mediano é informado. Uma
//     execução de poucos milissegundos é ruidosa demais para separar o limiar 10 do limiar 20.
// ES: La ordenación se repite sobre copias nuevas de la entrada y se informa el tiempo mediano. Una
//     ejecución de pocos milisegundos es demasiado ruidosa para separar el umbral 10 del umbral 20.
struct Measurement {
	double median_ms;
	double min_ms;
	double max_ms;
	Values sorted;
};

Measurement measure(const Values& input, Pivot pivot, std::size_t threshold) {
	std::vector<double> times;
	Values sorted;
	for (int repetition = 0; repetition < kRepetitions; ++repetition) {
		sorted = input;
		const auto start = std::chrono::steady_clock::now();
		hybrid_quicksort::hybrid_quicksort(sorted, pivot, threshold);
		const std::chrono::duration<double, std::milli> elapsed =
		    std::chrono::steady_clock::now() - start;
		times.push_back(elapsed.count());
	}
	std::ranges::sort(times);
	return {times[times.size() / 2], times.front(), times.back(), std::move(sorted)};
}

int sweep(std::size_t n) {
	const Values input = hybrid_quicksort::make_input("random", n);
	std::cout << "| threshold k | median (ms) | range (ms) |\n| ---: | ---: | ---: |\n"
	          << std::fixed;
	std::size_t best = 0;
	double best_ms = 0;
	for (const std::size_t threshold : kThresholds) {
		const Measurement result = measure(input, Pivot::kMedianOfThree, threshold);
		if (threshold == 0 || result.median_ms < best_ms) {
			best = threshold;
			best_ms = result.median_ms;
		}
		std::cout << "| " << threshold << " | " << std::setprecision(2) << result.median_ms << " | "
		          << result.min_ms << " to " << result.max_ms << " |\n";
	}
	std::cout << "\nBest threshold: k = " << best << " (C++, median3, random, n = " << n
	          << ", median of " << kRepetitions << " runs)\n";
	return EXIT_SUCCESS;
}

int run(const std::vector<std::string>& args) {
	if (args.size() == 2 && args[0] == "sweep") {
		return sweep(parse_number(args[1], kMaxN));
	}
	if (args.size() != 3) {
		throw std::invalid_argument(kUsage);
	}
	const std::string& implementation = args[0];
	const std::string& shape = args[1];
	const std::size_t separator = implementation.find("-k");
	if (separator == std::string::npos ||
	    (shape != "random" && shape != "sorted" && shape != "reversed")) {
		throw std::invalid_argument(kUsage);
	}
	const auto pivot = kPivots.find(implementation.substr(0, separator));
	if (pivot == kPivots.end()) {
		throw std::invalid_argument(kUsage);
	}
	const std::size_t threshold = parse_number(implementation.substr(separator + 2), kMaxThreshold);
	const std::size_t n = parse_number(args[2], kMaxN);

	const Measurement result =
	    measure(hybrid_quicksort::make_input(shape, n), pivot->second, threshold);

	// EN: On Linux, ru_maxrss is the peak resident memory of the process in kibibytes.
	// PT: No Linux, ru_maxrss é o pico de memória residente do processo em kibibytes.
	// ES: En Linux, ru_maxrss es el pico de memoria residente del proceso en kibibytes.
	rusage usage_info{};
	getrusage(RUSAGE_SELF, &usage_info);
	std::cout << "{\"n\":" << n << ",\"elapsedMs\":" << std::fixed << result.median_ms
	          << ",\"memoryKb\":" << usage_info.ru_maxrss
	          << R"(,"language":"cpp","implementation":")" << implementation << R"(","checksum":")"
	          << hybrid_quicksort::checksum(result.sorted) << "\"}\n";
	return EXIT_SUCCESS;
}

}  // namespace

int main(int argc, char** argv) {
	try {
		return run(std::vector<std::string>(argv + 1, argv + argc));
	} catch (const std::exception& error) {
		std::cerr << error.what() << '\n';
		return EXIT_FAILURE;
	}
}
