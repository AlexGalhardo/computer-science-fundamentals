// EN: Two kinds of test. Correctness: the three variants give the same matrix, within a
//     floating-point tolerance, for sizes and block sizes that do and do not divide evenly.
//     Locality: the naive order must be clearly slower than the interchanged one on a matrix
//     that does not fit in the first cache levels. That is checked with a ratio of times, not
//     with absolute times, and with a limit far below what is normally measured: a ratio depends
//     on the access pattern far more than on the machine.
// PT: Dois tipos de teste. Correção: as três variantes dão a mesma matriz, dentro de uma
//     tolerância de ponto flutuante, para tamanhos e blocos que dividem e que não dividem
//     exatamente. Localidade: a ordem ingênua precisa ser claramente mais lenta que a trocada
//     em uma matriz que não cabe nos primeiros níveis de cache. Isso é conferido com uma razão
//     entre tempos, não com tempos absolutos, e com um limite muito abaixo do que normalmente
//     se mede: uma razão depende muito mais do padrão de acesso que da máquina.
#include <array>
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <string>

#include "matrix.hpp"

namespace {

using cache_matrix::Matrix;

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

template <typename Multiply>
double best_ms(Multiply multiply) {
	double best = 1e300;
	for (int repetition = 0; repetition < 3; ++repetition) {
		const auto start = std::chrono::steady_clock::now();
		const Matrix product = multiply();
		const std::chrono::duration<double, std::milli> elapsed =
		    std::chrono::steady_clock::now() - start;
		// EN: The result is used, so the compiler cannot remove the multiplication as dead code.
		// PT: O resultado é usado, então o compilador não pode remover a multiplicação como código
		// morto.
		if (product.empty()) {
			return 0;
		}
		best = std::min(best, elapsed.count());
	}
	return best;
}

void test_known_product() {
	// [1 2] [5 6]   [1*5+2*7 1*6+2*8]   [19 22]
	// [3 4] [7 8] = [3*5+4*7 3*6+4*8] = [43 50]
	const Matrix a{1, 2, 3, 4};
	const Matrix b{5, 6, 7, 8};
	const Matrix expected{19, 22, 43, 50};
	check(cache_matrix::multiply_naive(a, b, 2) == expected, "naive 2x2");
	check(cache_matrix::multiply_interchanged(a, b, 2) == expected, "interchanged 2x2");
	check(cache_matrix::multiply_blocked(a, b, 2, 1) == expected, "blocked 2x2, block 1");
	check(cache_matrix::multiply_blocked(a, b, 2, 64) == expected, "blocked 2x2, block 64");
}

void test_identity() {
	const std::size_t n = 37;
	const Matrix a = cache_matrix::make_matrix(n, 7);
	Matrix identity(n * n, 0.0);
	for (std::size_t i = 0; i < n; ++i) {
		identity[i * n + i] = 1.0;
	}
	check(cache_matrix::multiply_naive(a, identity, n) == a, "A x I = A, naive");
	check(cache_matrix::multiply_interchanged(identity, a, n) == a, "I x A = A, interchanged");
	check(cache_matrix::multiply_blocked(a, identity, n, 8) == a, "A x I = A, blocked");
}

void test_variants_agree() {
	const std::array<std::size_t, 8> sizes{1, 2, 3, 7, 16, 33, 64, 100};
	const std::array<std::size_t, 6> blocks{1, 2, 5, 16, 64, 1000};
	for (const std::size_t n : sizes) {
		const Matrix a = cache_matrix::make_matrix(n, 1);
		const Matrix b = cache_matrix::make_matrix(n, 2);
		const Matrix naive = cache_matrix::multiply_naive(a, b, n);
		// EN: Every element is a sum of n products of numbers below 1, so 1e-9 * n is a
		//     tolerance far tighter than any real mistake and looser than rounding.
		// PT: Cada elemento é uma soma de n produtos de números abaixo de 1, então 1e-9 * n é
		//     uma tolerância muito mais apertada que qualquer erro real e mais folgada que o
		//     arredondamento.
		const double tolerance = 1e-9 * static_cast<double>(n);
		const std::string label = "n=" + std::to_string(n);
		const Matrix interchanged = cache_matrix::multiply_interchanged(a, b, n);
		check(cache_matrix::max_abs_diff(naive, interchanged) <= tolerance,
		      "interchanged = naive, " + label);
		check(cache_matrix::checksum(naive) == cache_matrix::checksum(interchanged),
		      "checksum interchanged, " + label);
		for (const std::size_t block : blocks) {
			const Matrix blocked = cache_matrix::multiply_blocked(a, b, n, block);
			check(cache_matrix::max_abs_diff(naive, blocked) <= tolerance,
			      "blocked = naive, " + label + " block=" + std::to_string(block));
			check(cache_matrix::checksum(naive) == cache_matrix::checksum(blocked),
			      "checksum blocked, " + label + " block=" + std::to_string(block));
		}
	}
}

void test_input_and_helpers() {
	const Matrix first = cache_matrix::make_matrix(4, 1);
	check(first == cache_matrix::make_matrix(4, 1), "same seed, same matrix");
	check(first != cache_matrix::make_matrix(4, 2), "different seed, different matrix");
	check(std::ranges::all_of(first, [](double value) { return value >= 0.0 && value < 1.0; }),
	      "values are in [0, 1)");
	// Shared with the Rust tests: both languages must generate the same input.
	check(cache_matrix::checksum(cache_matrix::make_matrix(8, 1)) == "31.864",
	      "checksum of the 8x8 input with seed 1");
	check(cache_matrix::checksum(Matrix{1.5, 2.25}) == "3.750", "checksum format");
	check(cache_matrix::max_abs_diff(Matrix{1, 2}, Matrix{1, 2.5}) == 0.5, "max_abs_diff");
	// 3 matrices x 64 x 64 doubles x 8 bytes = 98304 bytes = 96 KiB.
	check(cache_matrix::block_working_set_bytes(64) == 98304, "working set of a 64 block");
	check(cache_matrix::kCacheLineBytes / sizeof(double) == 8, "8 doubles per cache line");

	bool rejected = false;
	try {
		cache_matrix::multiply_blocked(first, first, 4, 0);
	} catch (const std::invalid_argument&) {
		rejected = true;
	}
	check(rejected, "block size 0 is rejected");
}

void test_locality() {
	// EN: 512 x 512 doubles is 2 MiB per matrix: a column walk of B leaves the L1 cache, and on
	//     most machines the L2 cache too. The naive order is usually 3 to 10 times slower.
	// PT: 512 x 512 doubles são 2 MiB por matriz: percorrer uma coluna de B sai da cache L1, e na
	//     maioria das máquinas também da L2. A ordem ingênua costuma ser de 3 a 10 vezes mais
	//     lenta.
	const std::size_t n = 512;
	const Matrix a = cache_matrix::make_matrix(n, 1);
	const Matrix b = cache_matrix::make_matrix(n, 2);
	const double naive = best_ms([&] { return cache_matrix::multiply_naive(a, b, n); });
	const double interchanged =
	    best_ms([&] { return cache_matrix::multiply_interchanged(a, b, n); });
	const double blocked = best_ms([&] { return cache_matrix::multiply_blocked(a, b, n, 64); });
	std::cout << "n=512: naive " << naive << " ms, interchanged " << interchanged
	          << " ms, blocked-64 " << blocked << " ms\n";
	check(naive > 1.5 * interchanged, "naive is clearly slower than interchanged at n=512");
	check(naive > 1.5 * blocked, "naive is clearly slower than blocked at n=512");
}

}  // namespace

int main() {
	test_known_product();
	test_identity();
	test_variants_agree();
	test_input_and_helpers();
	test_locality();
	std::cout << passed << " checks passed, " << failures << " failed\n";
	return failures == 0 ? EXIT_SUCCESS : EXIT_FAILURE;
}
