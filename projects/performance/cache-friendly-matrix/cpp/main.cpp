// EN: Three modes.
//     `bench <naive|interchanged|blocked-B> <n>` multiplies two n x n matrices once and prints
//     one JSON line in the benchmark contract, for example `bench blocked-64 1024`.
//     `bench speedup <n>` times the three variants on the same input, prints a Markdown table
//     and fails unless the blocked variant is at least 2 times faster than the naive one.
//     `bench sweep <n>` times the blocked variant with several block sizes and prints a table.
// PT: Três modos.
//     `bench <naive|interchanged|blocked-B> <n>` multiplica duas matrizes n x n uma vez e
//     imprime uma linha JSON no contrato de benchmark, por exemplo `bench blocked-64 1024`.
//     `bench speedup <n>` mede as três variantes na mesma entrada, imprime uma tabela Markdown
//     e falha a menos que a variante em blocos seja pelo menos 2 vezes mais rápida que a ingênua.
//     `bench sweep <n>` mede a variante em blocos com vários tamanhos de bloco e imprime uma
//     tabela.
// ES: Tres modos.
//     `bench <naive|interchanged|blocked-B> <n>` multiplica dos matrices n x n una vez e
//     imprime una línea JSON en el contrato de benchmark, por ejemplo `bench blocked-64 1024`.
//     `bench speedup <n>` mide las tres variantes sobre la misma entrada, imprime una tabla
//     Markdown y falla a menos que la variante por bloques sea al menos 2 veces más rápida que la
//     ingenua. `bench sweep <n>` mide la variante por bloques con varios tamaños de bloque e
//     imprime una tabla.
#include <sys/resource.h>

#include <algorithm>
#include <array>
#include <chrono>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

#include "matrix.hpp"

namespace {

using cache_matrix::Matrix;

constexpr std::size_t kMaxN = 4096;
constexpr std::size_t kMaxBlock = 4096;
constexpr double kRequiredSpeedup = 2.0;
const std::array<std::size_t, 7> kSweepBlocks{8, 16, 32, 64, 128, 256, 512};
const std::string kBlockedPrefix = "blocked-";
const std::string kUsage =
    "usage: bench <naive|interchanged|blocked-B> <n>\n"
    "       bench speedup <n>\n"
    "       bench sweep <n>";

std::size_t parse_number(const std::string& text, std::size_t limit) {
	if (text.empty() || text.size() > 6 || !std::ranges::all_of(text, ::isdigit)) {
		throw std::invalid_argument(kUsage);
	}
	const std::size_t value = std::stoul(text);
	if (value == 0 || value > limit) {
		throw std::invalid_argument("number out of range: " + text);
	}
	return value;
}

Matrix multiply(const std::string& implementation, const Matrix& a, const Matrix& b,
                std::size_t n) {
	if (implementation == "naive") {
		return cache_matrix::multiply_naive(a, b, n);
	}
	if (implementation == "interchanged") {
		return cache_matrix::multiply_interchanged(a, b, n);
	}
	if (implementation.starts_with(kBlockedPrefix)) {
		const std::size_t block =
		    parse_number(implementation.substr(kBlockedPrefix.size()), kMaxBlock);
		return cache_matrix::multiply_blocked(a, b, n, block);
	}
	throw std::invalid_argument(kUsage);
}

// EN: A small multiplication takes a few milliseconds, too little to trust a single run, so it
//     is repeated and the median is reported. A large one takes seconds and runs once: the
//     benchmark runner repeats the whole process anyway and reports the spread.
// PT: Uma multiplicação pequena leva poucos milissegundos, pouco para confiar em uma execução só,
//     então ela é repetida e a mediana é informada. Uma grande leva segundos e roda uma vez: o
//     runner de benchmark repete o processo inteiro de qualquer forma e informa a dispersão.
// ES: Una multiplicación pequeña toma pocos milisegundos, poco para confiar en una sola ejecución,
//     así que se repite y se informa la mediana. Una grande toma segundos y corre una vez: el
//     runner de benchmark repite el proceso completo de todos modos e informa la dispersión.
int repetitions_for(std::size_t n) { return n <= 512 ? 5 : 1; }

struct Measurement {
	double median_ms;
	double min_ms;
	double max_ms;
	Matrix product;
};

Measurement measure(const std::string& implementation, const Matrix& a, const Matrix& b,
                    std::size_t n, int repetitions) {
	std::vector<double> times;
	Matrix product;
	for (int repetition = 0; repetition < repetitions; ++repetition) {
		const auto start = std::chrono::steady_clock::now();
		product = multiply(implementation, a, b, n);
		const std::chrono::duration<double, std::milli> elapsed =
		    std::chrono::steady_clock::now() - start;
		times.push_back(elapsed.count());
	}
	std::ranges::sort(times);
	return {times[times.size() / 2], times.front(), times.back(), std::move(product)};
}

int speedup(std::size_t n) {
	const Matrix a = cache_matrix::make_matrix(n, 1);
	const Matrix b = cache_matrix::make_matrix(n, 2);
	const std::string blocked = kBlockedPrefix + std::to_string(cache_matrix::kDefaultBlock);
	const int repetitions = 3;
	const Measurement naive = measure("naive", a, b, n, repetitions);
	const Measurement interchanged = measure("interchanged", a, b, n, repetitions);
	const Measurement tiled = measure(blocked, a, b, n, repetitions);

	std::cout << "| variant | median (ms) | range (ms) | times faster than naive | checksum |\n"
	          << "| --- | ---: | ---: | ---: | --- |\n"
	          << std::fixed << std::setprecision(1);
	const auto row = [&](const std::string& name, const Measurement& result) {
		std::cout << "| " << name << " | " << result.median_ms << " | " << result.min_ms << " to "
		          << result.max_ms << " | " << std::setprecision(2)
		          << naive.median_ms / result.median_ms << std::setprecision(1) << " | "
		          << cache_matrix::checksum(result.product) << " |\n";
	};
	row("naive", naive);
	row("interchanged", interchanged);
	row(blocked, tiled);

	const double ratio = naive.median_ms / tiled.median_ms;
	const bool same = cache_matrix::max_abs_diff(naive.product, tiled.product) <= 1e-9 * n &&
	                  cache_matrix::max_abs_diff(naive.product, interchanged.product) <= 1e-9 * n;
	std::cout << "\nC++, n = " << n << ", median of " << repetitions << " runs: " << blocked
	          << " is " << std::setprecision(2) << ratio
	          << " times faster than naive (required: " << kRequiredSpeedup << ").\n";
	if (!same) {
		std::cerr << "FAILED: the variants do not give the same matrix\n";
		return EXIT_FAILURE;
	}
	if (ratio < kRequiredSpeedup) {
		std::cerr << "FAILED: the blocked variant is not " << kRequiredSpeedup
		          << " times faster than naive at n = " << n << '\n';
		return EXIT_FAILURE;
	}
	return EXIT_SUCCESS;
}

int sweep(std::size_t n) {
	const Matrix a = cache_matrix::make_matrix(n, 1);
	const Matrix b = cache_matrix::make_matrix(n, 2);
	std::cout << "| block B | working set 3 x B^2 x 8 bytes (KiB) | median (ms) | range (ms) |\n"
	          << "| ---: | ---: | ---: | ---: |\n"
	          << std::fixed << std::setprecision(1);
	std::size_t best = 0;
	double best_ms = 0;
	for (const std::size_t block : kSweepBlocks) {
		const Measurement result = measure(kBlockedPrefix + std::to_string(block), a, b, n, 3);
		if (best == 0 || result.median_ms < best_ms) {
			best = block;
			best_ms = result.median_ms;
		}
		std::cout << "| " << block << " | " << cache_matrix::block_working_set_bytes(block) / 1024
		          << " | " << result.median_ms << " | " << result.min_ms << " to " << result.max_ms
		          << " |\n";
	}
	std::cout << "\nBest block: B = " << best << " (C++, n = " << n << ", median of 3 runs)\n";
	return EXIT_SUCCESS;
}

int run(const std::vector<std::string>& args) {
	if (args.size() != 2) {
		throw std::invalid_argument(kUsage);
	}
	const std::size_t n = parse_number(args[1], kMaxN);
	if (args[0] == "speedup") {
		return speedup(n);
	}
	if (args[0] == "sweep") {
		return sweep(n);
	}
	const std::string& implementation = args[0];
	const Matrix a = cache_matrix::make_matrix(n, 1);
	const Matrix b = cache_matrix::make_matrix(n, 2);
	const Measurement result = measure(implementation, a, b, n, repetitions_for(n));

	// EN: On Linux, ru_maxrss is the peak resident memory of the process in kibibytes.
	// PT: No Linux, ru_maxrss é o pico de memória residente do processo em kibibytes.
	// ES: En Linux, ru_maxrss es el pico de memoria residente del proceso en kibibytes.
	rusage usage_info{};
	getrusage(RUSAGE_SELF, &usage_info);
	std::cout << "{\"n\":" << n << ",\"elapsedMs\":" << std::fixed << result.median_ms
	          << ",\"memoryKb\":" << usage_info.ru_maxrss
	          << R"(,"language":"cpp","implementation":")" << implementation << R"(","checksum":")"
	          << cache_matrix::checksum(result.product) << "\"}\n";
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
