#pragma once

#include <algorithm>
#include <atomic>
#include <cstdint>
#include <thread>
#include <vector>

#include "schedule.hpp"

// Numbers handed to a worker at a time by the dynamic schedule.
inline constexpr std::uint64_t kPrimesChunk = 10'000;

// EN: The result is a pair of integers. Integer addition is associative and commutative, so
//     the partial results of the workers can be added in any order and grouping and the total
//     is always the same. That is why the parallel answer equals the sequential one exactly.
// PT: O resultado é um par de inteiros. A soma de inteiros é associativa e comutativa, então
//     os resultados parciais dos trabalhadores podem ser somados em qualquer ordem e
//     agrupamento e o total é sempre o mesmo. Por isso a resposta paralela é exatamente igual
//     à sequencial.
// ES: El resultado es un par de enteros. La suma de enteros es asociativa y conmutativa, así
//     que los resultados parciales de los trabajadores pueden sumarse en cualquier orden y
//     agrupación y el total es siempre el mismo. Por eso la respuesta paralela es exactamente
//     igual a la secuencial.
struct PrimeStats {
	std::uint64_t count = 0;
	std::uint64_t sum = 0;

	bool operator==(const PrimeStats&) const = default;

	PrimeStats merge(const PrimeStats& other) const {
		return {count + other.count, sum + other.sum};
	}
};

// EN: Trial division by odd numbers up to the square root. It is deliberately simple and
//     CPU-bound, and its cost depends on the value: proving that n is prime takes about
//     sqrt(n) / 2 divisions, while most composites leave after a few. Larger numbers are
//     therefore more expensive, which makes equal blocks of numbers unequal amounts of work.
// PT: Divisão por tentativa por ímpares até a raiz quadrada. É propositalmente simples e
//     limitada por CPU, e o custo depende do valor: provar que n é primo leva cerca de
//     sqrt(n) / 2 divisões, enquanto a maioria dos compostos sai depois de poucas. Números
//     maiores são, portanto, mais caros, o que faz blocos iguais de números serem quantidades
//     desiguais de trabalho.
// ES: División de prueba por impares hasta la raíz cuadrada. Es deliberadamente simple y
//     limitada por CPU, y el costo depende del valor: probar que n es primo toma unas
//     sqrt(n) / 2 divisiones, mientras que la mayoría de los compuestos salen después de pocas.
//     Los números mayores son, por tanto, más caros, lo que hace que bloques iguales de números
//     sean cantidades desiguales de trabajo.
inline bool is_prime(std::uint64_t n) {
	if (n < 2) {
		return false;
	}
	if (n < 4) {
		return true;
	}
	if (n % 2 == 0) {
		return false;
	}
	for (std::uint64_t divisor = 3; divisor * divisor <= n; divisor += 2) {
		if (n % divisor == 0) {
			return false;
		}
	}
	return true;
}

// EN: The unit of work shared by every version: scan one range and accumulate in a local
//     variable. Nothing here is shared between threads, so this function is the same in the
//     sequential and in the parallel code.
// PT: A unidade de trabalho comum a todas as versões: percorrer um intervalo e acumular em
//     uma variável local. Nada aqui é compartilhado entre threads, então esta função é a mesma
//     no código sequencial e no paralelo.
// ES: La unidad de trabajo común a todas las versiones: recorrer un intervalo y acumular en
//     una variable local. Nada aquí se comparte entre hilos, así que esta función es la misma
//     en el código secuencial y en el paralelo.
inline PrimeStats count_range(std::uint64_t start, std::uint64_t end) {
	PrimeStats stats;
	for (std::uint64_t n = start; n < end; ++n) {
		if (is_prime(n)) {
			stats.count += 1;
			stats.sum += n;
		}
	}
	return stats;
}

// Counts the primes in [0, limit] on the calling thread.
inline PrimeStats count_sequential(std::uint64_t limit) { return count_range(0, limit + 1); }

// Counts the primes in [0, limit] with `workers` threads.
inline PrimeStats count_parallel(std::uint64_t limit, unsigned workers, Schedule schedule) {
	const std::uint64_t total = limit + 1;
	workers = std::max(workers, 1U);
	// EN: Fork-join. Creating a std::thread forks a worker and join() waits for it, so the
	//     partial results are complete when they are read. Each worker accumulates in a local
	//     variable and writes its slot of `partials` once, at the end: no shared counter is
	//     written in the hot loop, which avoids both a data race and cache-line contention (the
	//     slots are neighbours in memory, so writing them per number would be false sharing).
	// PT: Fork-join. Criar uma std::thread dispara um trabalhador e o join() espera por ele,
	//     então os resultados parciais estão completos quando são lidos. Cada trabalhador
	//     acumula em uma variável local e escreve a sua posição de `partials` uma única vez, no
	//     fim: nenhum contador compartilhado é escrito no laço quente, o que evita tanto a
	//     corrida de dados quanto a disputa de linha de cache (as posições são vizinhas na
	//     memória, então escrevê-las a cada número seria falso compartilhamento).
	// ES: Fork-join. Crear una std::thread lanza un trabajador y join() espera por él,
	//     así que los resultados parciales están completos cuando se leen. Cada trabajador
	//     acumula en una variable local y escribe su posición de `partials` una sola vez, al
	//     final: ningún contador compartido se escribe en el bucle caliente, lo que evita tanto
	//     la condición de carrera como la disputa de línea de caché (las posiciones son vecinas
	//     en la memoria, así que escribirlas en cada número sería falso compartido).
	std::vector<PrimeStats> partials(workers);
	std::vector<std::thread> threads;
	threads.reserve(workers);
	// EN: The only shared state of the dynamic schedule is this counter: "the next number
	//     nobody took yet". fetch_add is atomic, so two workers can never receive the same
	//     chunk. It is touched once per 10 000 numbers, not once per number, so the cost of
	//     sharing it is diluted.
	// PT: O único estado compartilhado do escalonamento dinâmico é este contador: "o próximo
	//     número que ninguém pegou ainda". O fetch_add é atômico, então dois trabalhadores
	//     nunca recebem o mesmo pedaço. Ele é tocado uma vez a cada 10 000 números, e não a
	//     cada número, então o custo de compartilhá-lo fica diluído.
	// ES: El único estado compartido de la planificación dinámica es este contador: "el próximo
	//     número que nadie ha tomado todavía". fetch_add es atómico, así que dos trabajadores
	//     nunca reciben la misma porción. Se toca una vez cada 10 000 números, y no en cada
	//     número, así que el costo de compartirlo queda diluido.
	std::atomic<std::uint64_t> next{0};
	if (schedule == Schedule::Static) {
		const std::vector<Span> spans = split_static(total, workers);
		for (unsigned index = 0; index < workers; ++index) {
			threads.emplace_back([&partials, index, block = spans[index]] {
				partials[index] = count_range(block.start, block.end);
			});
		}
	} else {
		for (unsigned index = 0; index < workers; ++index) {
			threads.emplace_back([&partials, &next, index, total] {
				PrimeStats local;
				while (true) {
					const std::uint64_t start = next.fetch_add(kPrimesChunk);
					if (start >= total) {
						break;
					}
					const std::uint64_t end = std::min(start + kPrimesChunk, total);
					local = local.merge(count_range(start, end));
				}
				partials[index] = local;
			});
		}
	}
	for (std::thread& thread : threads) {
		thread.join();
	}
	// EN: The reduction: combine one partial result per worker into the final answer.
	// PT: A redução: combinar um resultado parcial por trabalhador na resposta final.
	// ES: La reducción: combinar un resultado parcial por trabajador en la respuesta final.
	PrimeStats result;
	for (const PrimeStats& partial : partials) {
		result = result.merge(partial);
	}
	return result;
}
