// EN: `./demo` prints the fragmentation benchmark as text. `./demo --markdown` prints the same
//     numbers as the Markdown file that is committed in results/results.md.
// PT: `./demo` imprime o benchmark de fragmentação em texto. `./demo --markdown` imprime os mesmos
//     números como o arquivo Markdown que é versionado em results/results.md.
// ES: `./demo` imprime el benchmark de fragmentación como texto. `./demo --markdown` imprime los
//     mismos números como el archivo Markdown que está versionado en results/results.md.

#include <cstdio>
#include <string>
#include <vector>

#include "allocator.hpp"
#include "workload.hpp"

namespace {

std::vector<WorkloadResult> run_all(const Workload& workload) {
	std::vector<WorkloadResult> results;
	for (const auto& allocator : make_allocators(workload.arena)) {
		results.push_back(run_workload(*allocator, workload));
	}
	return results;
}

double percent(std::size_t part, std::size_t whole) {
	return whole == 0 ? 0.0 : 100.0 * static_cast<double>(part) / static_cast<double>(whole);
}

void print_text() {
	for (const Workload& workload : workloads()) {
		std::printf("Workload: %s (arena %zu bytes, %zu steps, seed %u)\n", workload.name.c_str(),
		            workload.arena, workload.steps, workload.seed);
		std::printf("%-10s%10s%8s%10s%12s%12s%11s\n", "strategy", "attempts", "failed", "failed %",
		            "ext frag %", "int frag %", "peak used");
		for (const WorkloadResult& row : run_all(workload)) {
			std::printf("%-10s%10zu%8zu%10.2f%12.2f%12.2f%11zu\n", row.strategy.c_str(),
			            row.attempts, row.failures, percent(row.failures, row.attempts),
			            row.external_fragmentation, row.internal_fragmentation, row.peak_used);
		}
		std::printf("\n");
	}
}

void print_markdown() {
	std::printf("# memory-allocator: results\n\n");
	std::printf("Command: `docker compose run --rm demo`\n\n");
	std::printf(
	    "The benchmark is a deterministic simulation (seeded generator, no timing), so the numbers "
	    "do not depend on the machine. The Rust implementation prints the same table.\n\n");
	std::printf(
	    "- **Failed**: allocations refused because no free block was large enough.\n"
	    "- **External fragmentation**: share of the free memory that is not in the largest free "
	    "block, averaged over all steps.\n"
	    "- **Internal fragmentation**: bytes reserved but not requested, as a share of the used "
	    "memory, averaged over all steps.\n\n");
	for (const Workload& workload : workloads()) {
		std::printf("## Workload: %s (arena %zu bytes, %zu steps, seed %u)\n\n",
		            workload.name.c_str(), workload.arena, workload.steps, workload.seed);
		std::printf(
		    "| Strategy | Attempts | Failed | Failed %% | External fragmentation %% | Internal "
		    "fragmentation %% | Peak used (bytes) |\n");
		std::printf("| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n");
		for (const WorkloadResult& row : run_all(workload)) {
			std::printf("| %s | %zu | %zu | %.2f | %.2f | %.2f | %zu |\n", row.strategy.c_str(),
			            row.attempts, row.failures, percent(row.failures, row.attempts),
			            row.external_fragmentation, row.internal_fragmentation, row.peak_used);
		}
		std::printf("\n");
	}
}

}  // namespace

int main(int argc, char** argv) {
	if (argc > 1 && std::string(argv[1]) == "--markdown") {
		print_markdown();
	} else {
		print_text();
	}
	return 0;
}
