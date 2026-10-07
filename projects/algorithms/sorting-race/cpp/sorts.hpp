// EN: The six sorting algorithms of the race, in C++. Same algorithms and same decisions as the
//     TypeScript reference in `ts/src/`, where each one is explained in detail. What changes
//     here: std::vector<int32_t> is a contiguous block, there is no bounds check and no runtime,
//     so this is the closest the race gets to the cost of the bare algorithm.
// PT: Os seis algoritmos de ordenação da corrida, em C++. Mesmos algoritmos e mesmas decisões da
//     referência em TypeScript em `ts/src/`, onde cada um é explicado em detalhe. O que muda
//     aqui: std::vector<int32_t> é um bloco contíguo, não há verificação de limites nem runtime,
//     então é o mais perto que a corrida chega do custo do algoritmo puro.
#pragma once

#include <algorithm>
#include <array>
#include <cstddef>
#include <cstdint>
#include <string>
#include <utility>
#include <vector>

namespace sorting_race {

using Values = std::vector<std::int32_t>;
using SortFunction = Values (*)(const Values&);

// EN: Swap out-of-order neighbours. Stop when a pass makes no swap.
// PT: Troca vizinhos fora de ordem. Para quando uma passada não faz trocas.
inline Values bubble_sort(const Values& values) {
	Values a = values;
	for (std::size_t end = a.size(); end > 1; --end) {
		bool swapped = false;
		for (std::size_t i = 0; i + 1 < end; ++i) {
			if (a[i] > a[i + 1]) {
				std::swap(a[i], a[i + 1]);
				swapped = true;
			}
		}
		if (!swapped) {
			break;
		}
	}
	return a;
}

// EN: Insert each value into the sorted prefix, shifting the larger values right.
// PT: Insere cada valor no prefixo ordenado, deslocando os maiores para a direita.
inline Values insertion_sort(const Values& values) {
	Values a = values;
	for (std::size_t i = 1; i < a.size(); ++i) {
		const std::int32_t key = a[i];
		std::size_t j = i;
		while (j > 0 && a[j - 1] > key) {
			a[j] = a[j - 1];
			--j;
		}
		a[j] = key;
	}
	return a;
}

// EN: `<=` takes the left value on a tie, which keeps the merge stable.
// PT: `<=` pega o valor da esquerda no empate, o que mantém a intercalação estável.
inline void merge_range(Values& a, Values& buffer, std::size_t lo, std::size_t hi) {
	if (hi - lo < 2) {
		return;
	}
	const std::size_t mid = lo + (hi - lo) / 2;
	merge_range(a, buffer, lo, mid);
	merge_range(a, buffer, mid, hi);
	std::size_t i = lo;
	std::size_t j = mid;
	for (std::size_t k = lo; k < hi; ++k) {
		if (j >= hi || (i < mid && a[i] <= a[j])) {
			buffer[k] = a[i++];
		} else {
			buffer[k] = a[j++];
		}
	}
	for (std::size_t k = lo; k < hi; ++k) {
		a[k] = buffer[k];
	}
}

// EN: Split in half, sort each half, merge. One buffer is reused by every merge.
// PT: Divide ao meio, ordena cada metade, intercala. Um buffer é reusado em toda intercalação.
inline Values merge_sort(const Values& values) {
	Values a = values;
	Values buffer(a.size());
	merge_range(a, buffer, 0, a.size());
	return a;
}

inline std::int32_t median_of_three(std::int32_t x, std::int32_t y, std::int32_t z) {
	return std::max(std::min(x, y), std::min(std::max(x, y), z));
}

// EN: Hoare partition. Recursing on the smaller side and looping on the larger one keeps the
//     stack at O(log n).
// PT: Partição de Hoare. Fazer a recursão no lado menor e o laço no maior mantém a pilha em
//     O(log n).
inline void quick_range(Values& a, std::ptrdiff_t lo, std::ptrdiff_t hi) {
	while (lo < hi) {
		const std::int32_t pivot = median_of_three(a[lo], a[lo + (hi - lo) / 2], a[hi]);
		std::ptrdiff_t i = lo;
		std::ptrdiff_t j = hi;
		while (i <= j) {
			while (a[i] < pivot) {
				++i;
			}
			while (a[j] > pivot) {
				--j;
			}
			if (i <= j) {
				std::swap(a[i], a[j]);
				++i;
				--j;
			}
		}
		if (j - lo < hi - i) {
			quick_range(a, lo, j);
			lo = i;
		} else {
			quick_range(a, i, hi);
			hi = j;
		}
	}
}

// EN: Quicksort with the median of three as the pivot.
// PT: Quicksort com a mediana de três como pivô.
inline Values quick_sort(const Values& values) {
	Values a = values;
	quick_range(a, 0, static_cast<std::ptrdiff_t>(a.size()) - 1);
	return a;
}

inline void sift_down(Values& a, std::size_t start, std::size_t size) {
	const std::int32_t value = a[start];
	std::size_t i = start;
	while (true) {
		std::size_t child = 2 * i + 1;
		if (child >= size) {
			break;
		}
		if (child + 1 < size && a[child + 1] > a[child]) {
			++child;
		}
		if (a[child] <= value) {
			break;
		}
		a[i] = a[child];
		i = child;
	}
	a[i] = value;
}

// EN: Build a max-heap inside the vector, then move the maximum to the end n - 1 times.
// PT: Constrói um max-heap dentro do vetor e move o máximo para o fim n - 1 vezes.
inline Values heap_sort(const Values& values) {
	Values a = values;
	const std::size_t n = a.size();
	for (std::size_t i = n / 2; i-- > 0;) {
		sift_down(a, i, n);
	}
	for (std::size_t end = n; end-- > 1;) {
		std::swap(a[0], a[end]);
		sift_down(a, 0, end);
	}
	return a;
}

// EN: LSD radix sort in base 256: four stable counting passes, one per byte of the key, with
//     no comparison between values. Valid for integers from 0 to 2^31 - 1.
// PT: Radix sort LSD na base 256: quatro passadas estáveis de contagem, uma por byte da chave,
//     sem comparar valores. Válido para inteiros de 0 a 2^31 - 1.
inline Values radix_sort(const Values& values) {
	Values source = values;
	Values target(source.size());
	for (int shift = 0; shift < 32; shift += 8) {
		std::array<std::size_t, 256> count{};
		for (const std::int32_t value : source) {
			++count[(static_cast<std::uint32_t>(value) >> shift) & 255U];
		}
		for (std::size_t digit = 1; digit < count.size(); ++digit) {
			count[digit] += count[digit - 1];
		}
		for (std::size_t i = source.size(); i-- > 0;) {
			const std::size_t digit = (static_cast<std::uint32_t>(source[i]) >> shift) & 255U;
			target[--count[digit]] = source[i];
		}
		std::swap(source, target);
	}
	return source;
}

inline const std::array<std::pair<std::string, SortFunction>, 6> kSorts{{
    {"bubble", bubble_sort},
    {"insertion", insertion_sort},
    {"merge", merge_sort},
    {"quick", quick_sort},
    {"heap", heap_sort},
    {"radix", radix_sort},
}};

// EN: Same order-sensitive digest in every language: h = (h * 31 + v) mod 1,000,000,007.
// PT: Mesmo resumo sensível à ordem em toda linguagem: h = (h * 31 + v) mod 1.000.000.007.
inline std::string checksum(const Values& values) {
	std::int64_t digest = 0;
	for (const std::int32_t value : values) {
		digest = (digest * 31 + value) % 1'000'000'007;
	}
	return std::to_string(digest);
}

}  // namespace sorting_race
