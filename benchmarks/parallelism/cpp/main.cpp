// EN: Parallelism workload: count the primes below n by trial division, with the range cut
//     into 256 chunks shared by `workers` threads. The answer never depends on the number of
//     workers, so the parallel result can be compared with the sequential one.
//     C++ model: one operating-system thread per worker (std::thread). The kernel schedules
//     them on the cores, and the only shared state is an atomic counter saying which chunk is
//     next, so idle threads always find work (dynamic scheduling).
// PT: Carga de paralelismo: conta os primos abaixo de n por divisão por tentativa, com o
//     intervalo cortado em 256 pedaços divididos entre `workers` threads. A resposta nunca
//     depende do número de workers, então o resultado paralelo pode ser comparado ao sequencial.
//     Modelo do C++: uma thread do sistema operacional por worker (std::thread). O kernel as
//     escalona nos núcleos, e o único estado compartilhado é um contador atômico que diz qual
//     é o próximo pedaço, então threads ociosas sempre acham trabalho (escalonamento dinâmico).
// ES: Carga de paralelismo: cuenta los primos por debajo de n por división de prueba, con el
//     rango cortado en 256 pedazos repartidos entre `workers` threads. La respuesta nunca
//     depende del número de workers, así que el resultado paralelo se puede comparar con el
//     secuencial. Modelo de C++: un thread del sistema operativo por worker (std::thread). El
//     kernel los planifica en los núcleos, y el único estado compartido es un contador atómico que
//     dice cuál es el siguiente pedazo, así que los threads ociosos siempre encuentran trabajo
//     (planificación dinámica).

#include <sys/resource.h>

#include <atomic>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <thread>
#include <vector>

namespace {

const long CHUNKS = 256;

bool is_prime(long k) {
	if (k < 2) return false;
	if (k < 4) return true;
	if (k % 2 == 0) return false;
	for (long d = 3; d * d <= k; d += 2) {
		if (k % d == 0) return false;
	}
	return true;
}

// EN: Chunk c covers [c*n/256, (c+1)*n/256). Larger numbers cost more to test, so chunks are
//     not equal in work, which is why they are handed out one by one instead of in fixed blocks.
// PT: O pedaço c cobre [c*n/256, (c+1)*n/256). Números maiores custam mais para testar, então
//     os pedaços não têm o mesmo trabalho, e por isso são entregues um a um, não em blocos fixos.
// ES: El pedazo c cubre [c*n/256, (c+1)*n/256). Los números mayores cuestan más de probar, así que
//     los pedazos no tienen el mismo trabajo, y por eso se entregan uno a uno, no en bloques fijos.
long count_chunk(long chunk, long n) {
	long count = 0;
	for (long k = chunk * n / CHUNKS; k < (chunk + 1) * n / CHUNKS; k++) {
		if (is_prime(k)) count++;
	}
	return count;
}

long count_primes(long n, int workers) {
	std::atomic<long> next{0};
	std::vector<long> partial(static_cast<std::size_t>(workers), 0);
	std::vector<std::thread> threads;
	for (int w = 0; w < workers; w++) {
		threads.emplace_back([&, w] {
			long local = 0;
			// EN: fetch_add hands out each chunk exactly once, with no lock.
			// PT: O fetch_add entrega cada pedaço exatamente uma vez, sem trava.
			// ES: fetch_add entrega cada pedazo exactamente una vez, sin candado.
			for (long chunk = next.fetch_add(1); chunk < CHUNKS; chunk = next.fetch_add(1)) {
				local += count_chunk(chunk, n);
			}
			partial[static_cast<std::size_t>(w)] = local;
		});
	}
	long total = 0;
	for (std::size_t w = 0; w < threads.size(); w++) {
		threads[w].join();
		total += partial[w];
	}
	return total;
}

}  // namespace

int main(int argc, char** argv) {
	const std::string implementation = argc > 1 ? argv[1] : "primes";
	const long n = argc > 2 ? std::atol(argv[2]) : 100000;
	const int workers = argc > 3 ? std::atoi(argv[3]) : 1;

	// EN: The timed section includes creating and joining the threads: that cost is part of
	//     what a parallel program pays.
	// PT: O trecho cronometrado inclui criar e aguardar as threads: esse custo faz parte do que
	//     um programa paralelo paga.
	// ES: El tramo cronometrado incluye crear y esperar los threads: ese costo es parte de lo que
	//     paga un programa paralelo.
	const auto start = std::chrono::steady_clock::now();
	const long total = count_primes(n, workers);
	const std::chrono::duration<double, std::milli> elapsed =
	    std::chrono::steady_clock::now() - start;

	rusage usage{};
	getrusage(RUSAGE_SELF, &usage);
	std::printf(
	    "{\"n\":%ld,\"elapsedMs\":%.3f,\"memoryKb\":%ld,\"language\":\"cpp\",\"implementation\":\"%"
	    "s\",\"checksum\":\"%ld\"}\n",
	    n, elapsed.count(), usage.ru_maxrss, implementation.c_str(), total);
	return 0;
}
