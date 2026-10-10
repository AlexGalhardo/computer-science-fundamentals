#include <sys/resource.h>

#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string>

#include "hash_map.hpp"

// EN: Benchmark of lookups at a chosen load factor. The table is created with a fixed capacity
//     of n / load and never resizes, so when the n keys are in, the load factor is exactly the
//     one requested. Only the lookups are timed: n keys that exist and n keys that do not.
//     Missing keys are the expensive case, because the search walks the whole list or run.
// PT: Benchmark de buscas em um fator de carga escolhido. A tabela nasce com capacidade fixa de
//     n / carga e nunca redimensiona, então, com as n chaves dentro, o fator de carga é
//     exatamente o pedido. Só as buscas são cronometradas: n chaves que existem e n que não
//     existem. Chave ausente é o caso caro, pois a busca percorre a lista ou o bloco inteiro.
// ES: Benchmark de búsquedas con un factor de carga elegido. La tabla nace con capacidad fija de
//     n / carga y nunca se redimensiona, así que, con las n claves dentro, el factor de carga es
//     exactamente el pedido. Solo se cronometran las búsquedas: n claves que existen y n que no
//     existen. La clave ausente es el caso caro, pues la búsqueda recorre la lista o el bloque
//     entero.
namespace {

std::uint64_t next(std::uint64_t& state) {
	state ^= state << 13;
	state ^= state >> 7;
	state ^= state << 17;
	return state;
}

template <typename Map>
std::uint64_t lookups(const Map& map, std::size_t n) {
	std::uint64_t hits = 0;
	std::uint64_t present = 42;
	std::uint64_t absent = 4242;
	for (std::size_t i = 0; i < n; ++i) {
		// EN: Stored keys are even and absent keys are odd, so a miss is guaranteed.
		// PT: As chaves guardadas são pares e as ausentes são ímpares, então a falha é garantida.
		// ES: Las claves guardadas son pares y las ausentes son impares, así que el fallo está
		//     garantizado.
		hits += map.get(next(present) << 1).has_value() ? 1 : 0;
		hits += map.get((next(absent) << 1) | 1).has_value() ? 1 : 0;
	}
	return hits;
}

template <typename Map>
std::uint64_t run(Map map, std::size_t n, double& elapsed_ms) {
	std::uint64_t state = 42;
	for (std::size_t i = 0; i < n; ++i) {
		map.put(next(state) << 1, static_cast<hashmap::Value>(i));
	}
	const auto start = std::chrono::steady_clock::now();
	const std::uint64_t hits = lookups(map, n);
	const auto end = std::chrono::steady_clock::now();
	elapsed_ms = std::chrono::duration<double, std::milli>(end - start).count();
	return hits;
}

}  // namespace

int main(int argc, char** argv) {
	const std::string implementation = argc > 1 ? argv[1] : "chaining";
	const std::size_t n = argc > 2 ? std::strtoull(argv[2], nullptr, 10) : 100000;
	const double load = argc > 3 ? std::strtod(argv[3], nullptr) : 0.75;
	const auto capacity = static_cast<std::size_t>(std::ceil(static_cast<double>(n) / load));

	double elapsed_ms = 0;
	std::uint64_t hits = 0;
	if (implementation == "probing") {
		hits = run(hashmap::ProbingMap(capacity, 0.99), n, elapsed_ms);
	} else {
		// EN: A huge limit turns resizing off, so the lists really reach the requested load.
		// PT: Um limite enorme desliga o redimensionamento, então as listas chegam mesmo à
		//     carga pedida.
		// ES: Un límite enorme desactiva el redimensionamiento, así que las listas llegan de
		//     verdad a la carga pedida.
		hits = run(hashmap::ChainingMap(capacity, 1e18), n, elapsed_ms);
	}

	struct rusage usage{};
	getrusage(RUSAGE_SELF, &usage);
	std::cout << "{\"n\":" << n << ",\"elapsedMs\":" << elapsed_ms
	          << ",\"memoryKb\":" << usage.ru_maxrss
	          << ",\"language\":\"cpp\",\"implementation\":\"" << implementation
	          << "\",\"checksum\":\"" << hits << "\"}\n";
	return 0;
}
