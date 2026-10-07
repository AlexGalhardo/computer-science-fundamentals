// Command line of the benchmark: scaling <implementation> <n> <workers>

#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <format>
#include <fstream>
#include <iostream>
#include <optional>
#include <sstream>
#include <string>

#include "mandelbrot.hpp"
#include "primes.hpp"
#include "schedule.hpp"

namespace {

constexpr const char* kUsage =
    "usage: scaling <primes|mandelbrot>-<seq|static|dynamic> <n> <workers>";

// EN: Peak resident memory of this process, as the Linux kernel reports it in
//     /proc/self/status (the VmHWM line, in kB). The benchmark always runs in a Linux
//     container, and outside Linux the field is reported as 0 instead of failing.
// PT: Pico de memória residente deste processo, como o kernel do Linux informa em
//     /proc/self/status (a linha VmHWM, em kB). O benchmark sempre roda em um contêiner
//     Linux, e fora do Linux o campo é informado como 0 em vez de falhar.
std::uint64_t peak_memory_kb() {
	std::ifstream status("/proc/self/status");
	std::string line;
	while (std::getline(status, line)) {
		if (line.starts_with("VmHWM:")) {
			std::istringstream fields(line.substr(6));
			std::uint64_t value = 0;
			fields >> value;
			return value;
		}
	}
	return 0;
}

// The largest integer whose square is not above n.
std::size_t integer_sqrt(std::uint64_t n) {
	auto root = static_cast<std::uint64_t>(std::sqrt(static_cast<double>(n)));
	while (root * root > n) {
		--root;
	}
	while ((root + 1) * (root + 1) <= n) {
		++root;
	}
	return root;
}

// Runs one implementation and returns its checksum, or nothing for an unknown name.
std::optional<std::string> run(const std::string& implementation, std::uint64_t n,
                               unsigned workers) {
	const std::size_t dash = implementation.find('-');
	if (dash == std::string::npos) {
		return std::nullopt;
	}
	const std::string workload = implementation.substr(0, dash);
	const std::string mode = implementation.substr(dash + 1);
	if (mode != "seq" && mode != "static" && mode != "dynamic") {
		return std::nullopt;
	}
	const bool sequential = mode == "seq";
	const Schedule schedule = mode == "dynamic" ? Schedule::Dynamic : Schedule::Static;
	// EN: n is the number of items in both workloads, so one size compares them: the integers
	//     1..n tested for primality, or the pixels of a square image whose side is the integer
	//     square root of n.
	// PT: n é o número de itens nas duas cargas, então um único tamanho compara as duas: os
	//     inteiros 1..n testados quanto à primalidade, ou os pixels de uma imagem quadrada cujo
	//     lado é a raiz quadrada inteira de n.
	if (workload == "primes") {
		const PrimeStats stats =
		    sequential ? count_sequential(n) : count_parallel(n, workers, schedule);
		return std::format("{}:{}", stats.count, stats.sum);
	}
	if (workload == "mandelbrot") {
		const std::size_t side = integer_sqrt(n);
		const Image image = sequential ? render_sequential(side, kMaxIter)
		                               : render_parallel(side, kMaxIter, workers, schedule);
		return std::format("{}:{:016x}", image.total_iterations, image.checksum());
	}
	return std::nullopt;
}

int fail() {
	std::cerr << kUsage << '\n';
	return 2;
}

}  // namespace

int main(int argc, char** argv) {
	if (argc != 4) {
		return fail();
	}
	const std::string implementation = argv[1];
	std::uint64_t n = 0;
	unsigned workers = 0;
	try {
		n = std::stoull(argv[2]);
		workers = static_cast<unsigned>(std::stoul(argv[3]));
	} catch (const std::exception&) {
		return fail();
	}

	// EN: Only the work is timed, not the start-up of the process. The checksum is part of the
	//     work: it is the serial tail every run pays.
	// PT: Só o trabalho é cronometrado, não a inicialização do processo. O checksum faz parte
	//     do trabalho: é a cauda serial que toda execução paga.
	const auto start = std::chrono::steady_clock::now();
	const std::optional<std::string> checksum = run(implementation, n, workers);
	if (!checksum) {
		return fail();
	}
	const std::chrono::duration<double, std::milli> elapsed =
	    std::chrono::steady_clock::now() - start;

	// EN: The benchmark contract: one JSON object on the last line of output.
	// PT: O contrato de benchmark: um objeto JSON na última linha da saída.
	std::cout << std::format(
	    "{{\"n\":{},\"elapsedMs\":{:.3f},\"memoryKb\":{},\"language\":\"cpp\","
	    "\"implementation\":\"{}\",\"checksum\":\"{}\"}}\n",
	    n, elapsed.count(), peak_memory_kb(), implementation, *checksum);
	return EXIT_SUCCESS;
}
