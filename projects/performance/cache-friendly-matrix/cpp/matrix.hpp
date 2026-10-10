// EN: Three ways to multiply two n x n matrices. All three do exactly the same n^3
//     multiplications and additions, so their Big O is the same. What changes is the ORDER in
//     which memory is visited, and that alone makes one of them several times slower.
//
//     A matrix is stored row-major, as C, C++ and Rust do: element (i, j) lives at index
//     i * n + j, so a row is contiguous and a column is not. The processor does not fetch one
//     number from memory, it fetches a whole cache line (64 bytes on current x86-64 and ARM
//     processors, which is 8 doubles). Walking along a row therefore costs one cache miss every
//     8 elements, and the hardware prefetcher sees the pattern and fetches ahead. Walking down a
//     column jumps n * 8 bytes each step: every element is on a different line.
// PT: Três formas de multiplicar duas matrizes n x n. As três fazem exatamente as mesmas n^3
//     multiplicações e somas, então o Big O é o mesmo. O que muda é a ORDEM em que a memória é
//     visitada, e só isso torna uma delas várias vezes mais lenta.
// ES: Tres formas de multiplicar dos matrices n x n. Las tres hacen exactamente las mismas n^3
//     multiplicaciones y sumas, así que el Big O es el mismo. Lo que cambia es el ORDEN en que se
//     visita la memoria, y solo eso hace que una de ellas sea varias veces más lenta.
//
//     A matriz é guardada por linhas (row-major), como fazem C, C++ e Rust: o elemento (i, j)
//     fica no índice i * n + j, então uma linha é contígua e uma coluna não. O processador não
//     busca um número na memória, busca uma linha de cache inteira (64 bytes nos processadores
//     x86-64 e ARM atuais, ou 8 doubles). Andar ao longo de uma linha custa então uma falta de
//     cache a cada 8 elementos, e o prefetcher do hardware percebe o padrão e busca adiante.
//     Descer uma coluna salta n * 8 bytes a cada passo: cada elemento está em uma linha diferente.
#pragma once

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <stdexcept>
#include <string>
#include <vector>

namespace cache_matrix {

using Matrix = std::vector<double>;

inline constexpr std::size_t kCacheLineBytes = 64;
inline constexpr std::size_t kDefaultBlock = 64;

// EN: Deterministic input from a fixed seed (a linear congruential generator), so C++ and Rust
//     multiply exactly the same matrices and their checksums can be compared.
// PT: Entrada determinística a partir de uma semente fixa (um gerador congruente linear), para
//     que C++ e Rust multipliquem exatamente as mesmas matrizes e os checksums sejam comparáveis.
// ES: Entrada determinista a partir de una semilla fija (un generador congruencial lineal), para
//     que C++ y Rust multipliquen exactamente las mismas matrices y los checksums sean comparables.
inline Matrix make_matrix(std::size_t n, std::uint64_t seed) {
	Matrix values(n * n);
	std::uint64_t state = seed;
	for (double& value : values) {
		state = state * 6364136223846793005ULL + 1442695040888963407ULL;
		value = static_cast<double>(state >> 40) / 16777216.0;
	}
	return values;
}

// EN: The textbook order, i-j-k: each element of the result is the dot product of a row of A
//     and a column of B. A is walked along a row (good), but B is walked down a column: the
//     inner loop touches B[0][j], B[1][j], B[2][j]..., n * 8 bytes apart, a new cache line on
//     every step. Once a column of B no longer fits in the cache, almost every access misses.
// PT: A ordem do livro-texto, i-j-k: cada elemento do resultado é o produto escalar de uma linha
//     de A por uma coluna de B. A é percorrida ao longo de uma linha (bom), mas B é percorrida
//     descendo uma coluna: o laço interno toca B[0][j], B[1][j], B[2][j]..., a n * 8 bytes um
//     do outro, uma linha de cache nova a cada passo. Quando uma coluna de B não cabe mais na
//     cache, quase todo acesso é uma falta.
// ES: El orden del libro de texto, i-j-k: cada elemento del resultado es el producto escalar de una
//     fila de A por una columna de B. A se recorre a lo largo de una fila (bien), pero B se recorre
//     bajando una columna: el bucle interno toca B[0][j], B[1][j], B[2][j]..., a n * 8 bytes uno
//     del otro, una línea de caché nueva en cada paso. Cuando una columna de B ya no cabe en el
//     caché, casi todo acceso es un fallo.
inline Matrix multiply_naive(const Matrix& a, const Matrix& b, std::size_t n) {
	Matrix c(n * n, 0.0);
	for (std::size_t i = 0; i < n; ++i) {
		for (std::size_t j = 0; j < n; ++j) {
			double sum = 0.0;
			for (std::size_t k = 0; k < n; ++k) {
				sum += a[i * n + k] * b[k * n + j];
			}
			c[i * n + j] = sum;
		}
	}
	return c;
}

// EN: Loop interchange, i-k-j: the two inner loops are swapped and nothing else. Now the inner
//     loop walks along row k of B and row i of C, both contiguous: 8 doubles per cache line,
//     easy to prefetch, and simple enough for the compiler to use vector instructions.
//     This is spatial locality: use what sits next to what was just used.
// PT: Troca de laços, i-k-j: os dois laços internos são trocados e nada mais. Agora o laço
//     interno anda ao longo da linha k de B e da linha i de C, ambas contíguas: 8 doubles por
//     linha de cache, fácil de pré-buscar, e simples o bastante para o compilador usar
//     instruções vetoriais. Isso é localidade espacial: usar o que está ao lado do que acabou
//     de ser usado.
// ES: Intercambio de bucles, i-k-j: se intercambian los dos bucles internos y nada más. Ahora el
//     bucle interno recorre la fila k de B y la fila i de C, ambas contiguas: 8 doubles por línea
//     de caché, fácil de prebuscar, y lo bastante simple para que el compilador use instrucciones
//     vectoriales. Eso es localidad espacial: usar lo que está al lado de lo que acaba de usarse.
inline Matrix multiply_interchanged(const Matrix& a, const Matrix& b, std::size_t n) {
	Matrix c(n * n, 0.0);
	for (std::size_t i = 0; i < n; ++i) {
		for (std::size_t k = 0; k < n; ++k) {
			const double aik = a[i * n + k];
			for (std::size_t j = 0; j < n; ++j) {
				c[i * n + j] += aik * b[k * n + j];
			}
		}
	}
	return c;
}

// EN: Blocking (also called tiling): the same i-k-j work, cut into blocks of `block` x `block`
//     elements. Inside one block the code touches a square piece of A, of B and of C, about
//     3 * block^2 * 8 bytes in total, over and over. When that fits in a cache level, the data
//     is reused while it is still there instead of being fetched from main memory again.
//     This is temporal locality: use again soon what was just used. With i-k-j alone, the whole
//     of B (n^2 doubles) is swept once for every row i, and a large B is evicted long before
//     the next row comes back to it.
// PT: Blocagem (também chamada de tiling): o mesmo trabalho i-k-j, cortado em blocos de
//     `block` x `block` elementos. Dentro de um bloco o código toca um pedaço quadrado de A, de
//     B e de C, cerca de 3 * block^2 * 8 bytes no total, repetidas vezes. Quando isso cabe em um
//     nível de cache, o dado é reutilizado enquanto ainda está lá, em vez de ser buscado de novo
//     na memória principal. Isso é localidade temporal: usar de novo, logo, o que acabou de ser
//     usado. Só com i-k-j, B inteira (n^2 doubles) é varrida uma vez para cada linha i, e uma B
//     grande é despejada da cache muito antes de a próxima linha voltar a ela.
// ES: Blocking (también llamado tiling): el mismo trabajo i-k-j, cortado en bloques de
//     `block` x `block` elementos. Dentro de un bloque el código toca un trozo cuadrado de A, de
//     B y de C, unos 3 * block^2 * 8 bytes en total, una y otra vez. Cuando eso cabe en un nivel
//     de caché, el dato se reutiliza mientras todavía está allí, en lugar de buscarse de nuevo en
//     la memoria principal. Eso es localidad temporal: volver a usar, pronto, lo que acaba de
//     usarse. Solo con i-k-j, B entera (n^2 doubles) se recorre una vez por cada fila i, y una B
//     grande es expulsada del caché mucho antes de que la siguiente fila vuelva a ella.
inline Matrix multiply_blocked(const Matrix& a, const Matrix& b, std::size_t n, std::size_t block) {
	if (block == 0) {
		throw std::invalid_argument("block size must be at least 1");
	}
	Matrix c(n * n, 0.0);
	for (std::size_t ii = 0; ii < n; ii += block) {
		const std::size_t i_end = std::min(ii + block, n);
		for (std::size_t kk = 0; kk < n; kk += block) {
			const std::size_t k_end = std::min(kk + block, n);
			for (std::size_t jj = 0; jj < n; jj += block) {
				const std::size_t j_end = std::min(jj + block, n);
				for (std::size_t i = ii; i < i_end; ++i) {
					for (std::size_t k = kk; k < k_end; ++k) {
						const double aik = a[i * n + k];
						for (std::size_t j = jj; j < j_end; ++j) {
							c[i * n + j] += aik * b[k * n + j];
						}
					}
				}
			}
		}
	}
	return c;
}

/** Bytes touched while one block is being multiplied: a square piece of each of the 3 matrices. */
inline std::size_t block_working_set_bytes(std::size_t block) {
	return 3 * block * block * sizeof(double);
}

/** Largest absolute difference between two matrices of the same size. */
inline double max_abs_diff(const Matrix& x, const Matrix& y) {
	if (x.size() != y.size()) {
		throw std::invalid_argument("matrices have different sizes");
	}
	double worst = 0.0;
	for (std::size_t index = 0; index < x.size(); ++index) {
		worst = std::max(worst, std::abs(x[index] - y[index]));
	}
	return worst;
}

// EN: A short digest of the result: the sum of all elements with three decimals. The three
//     variants, and the two languages, must print the same text.
// PT: Um resumo curto do resultado: a soma de todos os elementos com três casas decimais. As
//     três variantes, e as duas linguagens, precisam imprimir o mesmo texto.
// ES: Un resumen corto del resultado: la suma de todos los elementos con tres decimales. Las
//     tres variantes, y los dos lenguajes, deben imprimir el mismo texto.
inline std::string checksum(const Matrix& values) {
	double sum = 0.0;
	for (const double value : values) {
		sum += value;
	}
	char buffer[64];
	std::snprintf(buffer, sizeof(buffer), "%.3f", sum);
	return buffer;
}

}  // namespace cache_matrix
