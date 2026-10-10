// EN: A quicksort with two knobs: how the pivot is chosen, and below which size a range is
//     handed to insertion sort. Quicksort is O(n log n) only when the pivot splits the range
//     reasonably well, so the pivot rule decides whether sorted input is the best case or the
//     O(n²) worst case. The threshold does not change the order of growth: it trims the
//     constant factor, because most recursive calls handle tiny ranges where insertion sort,
//     with no recursion and a short inner loop, is faster.
// PT: Um quicksort com dois botões: como o pivô é escolhido, e abaixo de qual tamanho um trecho
//     é entregue ao insertion sort. O quicksort só é O(n log n) quando o pivô divide o trecho
//     razoavelmente bem, então a regra do pivô decide se a entrada ordenada é o melhor caso ou o
//     pior caso O(n²). O limiar não muda a ordem de crescimento: ele reduz o fator constante,
//     porque a maioria das chamadas recursivas trata trechos minúsculos em que o insertion
//     sort, sem recursão e com laço interno curto, é mais rápido.
// ES: Un quicksort con dos perillas: cómo se elige el pivote, y por debajo de qué tamaño un
//     tramo se entrega al insertion sort. El quicksort solo es O(n log n) cuando el pivote
//     divide el tramo razonablemente bien, así que la regla del pivote decide si la entrada
//     ordenada es el mejor caso o el peor caso O(n²). El umbral no cambia el orden de
//     crecimiento: reduce el factor constante, porque la mayoría de las llamadas recursivas
//     tratan tramos minúsculos en los que el insertion sort, sin recursión y con un bucle
//     interno corto, es más rápido.
#pragma once

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <string>
#include <utility>
#include <vector>

namespace hybrid_quicksort {

using Values = std::vector<std::int32_t>;

enum class Pivot { kFirst, kRandom, kMedianOfThree };

// EN: xorshift32, used for the random pivot and to build the random input. The seed is fixed, so
//     every run and both languages see the same numbers.
// PT: xorshift32, usado no pivô aleatório e para montar a entrada aleatória. A semente é fixa,
//     então toda execução e as duas linguagens veem os mesmos números.
// ES: xorshift32, usado en el pivote aleatorio y para construir la entrada aleatoria. La
//     semilla es fija, así que cada ejecución y los dos lenguajes ven los mismos números.
class Xorshift {
public:
	explicit Xorshift(std::uint32_t seed) : state_(seed == 0 ? 1 : seed) {}

	std::uint32_t next() {
		state_ ^= state_ << 13;
		state_ ^= state_ >> 17;
		state_ ^= state_ << 5;
		return state_;
	}

private:
	std::uint32_t state_;
};

namespace detail {

// EN: Insertion sort on a[lo..hi]. Quadratic in general, but unbeatable on a handful of values.
// PT: Insertion sort em a[lo..hi]. Quadrático no geral, mas imbatível em um punhado de valores.
// ES: Insertion sort en a[lo..hi]. Cuadrático en general, pero imbatible con un puñado de valores.
inline void insertion_sort(Values& a, std::ptrdiff_t lo, std::ptrdiff_t hi) {
	for (std::ptrdiff_t i = lo + 1; i <= hi; ++i) {
		const std::int32_t key = a[i];
		std::ptrdiff_t j = i - 1;
		while (j >= lo && a[j] > key) {
			a[j + 1] = a[j];
			--j;
		}
		a[j + 1] = key;
	}
}

// EN: The three strategies. `first` is the textbook rule and the trap: on sorted input the
//     first value is the minimum, so one side of every split is empty. `random` makes the
//     worst case depend on luck instead of on the input. `median of three` reads the first,
//     middle and last values and takes the one in between, which is the true median when the
//     range is already sorted.
// PT: As três estratégias. `first` é a regra de livro e a armadilha: em entrada ordenada o
//     primeiro valor é o mínimo, então um lado de toda divisão fica vazio. `random` faz o pior
//     caso depender da sorte e não da entrada. `median of three` lê o primeiro, o do meio e o
//     último valor e fica com o intermediário, que é a mediana real quando o trecho já está
//     ordenado.
// ES: Las tres estrategias. `first` es la regla de libro y la trampa: en entrada ordenada el
//     primer valor es el mínimo, así que un lado de cada división queda vacío. `random` hace
//     que el peor caso dependa de la suerte y no de la entrada. `median of three` lee el
//     primer valor, el del medio y el último y se queda con el intermedio, que es la mediana
//     real cuando el tramo ya está ordenado.
inline std::int32_t choose_pivot(const Values& a, std::ptrdiff_t lo, std::ptrdiff_t hi, Pivot pivot,
                                 Xorshift& random) {
	switch (pivot) {
		case Pivot::kFirst:
			return a[lo];
		case Pivot::kRandom:
			return a[lo + static_cast<std::ptrdiff_t>(random.next() %
			                                          static_cast<std::uint32_t>(hi - lo + 1))];
		case Pivot::kMedianOfThree: {
			const std::int32_t x = a[lo];
			const std::int32_t y = a[lo + (hi - lo) / 2];
			const std::int32_t z = a[hi];
			return std::max(std::min(x, y), std::min(std::max(x, y), z));
		}
	}
	return a[lo];
}

inline void sort_range(Values& a, std::ptrdiff_t lo, std::ptrdiff_t hi, Pivot pivot,
                       std::ptrdiff_t threshold, Xorshift& random) {
	while (lo < hi) {
		// EN: The hybrid step: a range of at most `threshold` values goes to insertion sort.
		//     With threshold 0 this never happens and the code is a plain quicksort.
		// PT: O passo híbrido: um trecho de no máximo `threshold` valores vai para o insertion
		//     sort. Com limiar 0 isso nunca acontece e o código é um quicksort puro.
		// ES: El paso híbrido: un tramo de como máximo `threshold` valores va al insertion
		//     sort. Con umbral 0 esto nunca ocurre y el código es un quicksort puro.
		if (hi - lo + 1 <= threshold) {
			insertion_sort(a, lo, hi);
			return;
		}
		const std::int32_t value = choose_pivot(a, lo, hi, pivot, random);
		// EN: Hoare partition: two indexes walk towards each other and swap misplaced pairs.
		// PT: Partição de Hoare: dois índices andam um em direção ao outro e trocam os pares
		//     fora do lugar.
		// ES: Partición de Hoare: dos índices avanzan uno hacia el otro e intercambian los pares
		//     fuera de lugar.
		std::ptrdiff_t i = lo;
		std::ptrdiff_t j = hi;
		while (i <= j) {
			while (a[i] < value) {
				++i;
			}
			while (a[j] > value) {
				--j;
			}
			if (i <= j) {
				std::swap(a[i], a[j]);
				++i;
				--j;
			}
		}
		// EN: Recurse on the smaller side and loop on the larger one. Even when the pivot is
		//     terrible and the time is quadratic, the stack stays O(log n) deep.
		// PT: Recursão no lado menor e laço no maior. Mesmo quando o pivô é péssimo e o tempo é
		//     quadrático, a pilha fica com profundidade O(log n).
		// ES: Recursión sobre el lado menor y bucle sobre el mayor. Incluso cuando el pivote es
		//     pésimo y el tiempo es cuadrático, la pila queda con profundidad O(log n).
		if (j - lo < hi - i) {
			sort_range(a, lo, j, pivot, threshold, random);
			lo = i;
		} else {
			sort_range(a, i, hi, pivot, threshold, random);
			hi = j;
		}
	}
}

}  // namespace detail

inline void hybrid_quicksort(Values& a, Pivot pivot, std::size_t threshold) {
	Xorshift random(0x9E3779B9U);
	detail::sort_range(a, 0, static_cast<std::ptrdiff_t>(a.size()) - 1, pivot,
	                   static_cast<std::ptrdiff_t>(threshold), random);
}

// EN: The three input shapes, built in memory: the same n values in a different order.
// PT: Os três formatos de entrada, montados em memória: os mesmos n valores em outra ordem.
// ES: Las tres formas de entrada, construidas en memoria: los mismos n valores en otro orden.
inline Values make_input(const std::string& shape, std::size_t n) {
	Values values(n);
	Xorshift random(20260101U);
	for (auto& value : values) {
		value = static_cast<std::int32_t>(random.next() >> 1);
	}
	if (shape != "random") {
		std::ranges::sort(values);
	}
	if (shape == "reversed") {
		std::ranges::reverse(values);
	}
	return values;
}

// EN: Same order-sensitive digest as the other mini-projects: h = (h * 31 + v) mod 1,000,000,007.
// PT: Mesmo resumo sensível à ordem dos outros mini-projetos: h = (h * 31 + v) mod 1.000.000.007.
// ES: El mismo resumen sensible al orden de los otros mini-proyectos:
//     h = (h * 31 + v) mod 1.000.000.007.
inline std::string checksum(const Values& values) {
	std::int64_t digest = 0;
	for (const std::int32_t value : values) {
		digest = (digest * 31 + value) % 1'000'000'007;
	}
	return std::to_string(digest);
}

}  // namespace hybrid_quicksort
