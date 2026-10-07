#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string_view>

#include "simulator.hpp"

// EN: Noise simulator. Sends blocks through a binary symmetric channel at several bit error
//     rates and counts, for each scheme, how many damaged blocks were detected, corrected or
//     missed. `--markdown` prints only the table, which is how results/results.md is written.
// PT: Simulador de ruído. Envia blocos por um canal binário simétrico em várias taxas de erro
//     de bit e conta, para cada esquema, quantos blocos danificados foram detectados,
//     corrigidos ou perdidos. `--markdown` imprime só a tabela, e é assim que
//     results/results.md é gravado.
int main(int argc, char** argv) {
	constexpr std::uint64_t kBlocks = 200'000;
	constexpr std::uint64_t kSeed = 2026;
	const bool markdown_only = argc > 1 && std::string_view(argv[1]) == "--markdown";

	if (!markdown_only) {
		std::cout << "Binary symmetric channel, " << kBlocks << " blocks per row, seed " << kSeed
		          << "\n\n";
	}
	std::cout << edc::to_markdown(edc::simulate_all(kBlocks, kSeed));
	return EXIT_SUCCESS;
}
