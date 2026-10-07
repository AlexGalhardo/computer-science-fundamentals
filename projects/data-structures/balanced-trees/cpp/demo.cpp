#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

#include "steps.hpp"

// EN: Demo.
//       tree_demo heights   prints a Markdown table: height and rotations of the three trees
//                           after sorted and after random insertion of 1,000 to 100,000 keys
//       tree_demo steps     prints dashboard/steps.js, the data of the rotation visualiser
// PT: Demo.
//       tree_demo heights   imprime uma tabela Markdown: altura e rotações das três árvores
//                           depois da inserção ordenada e da aleatória de 1.000 a 100.000 chaves
//       tree_demo steps     imprime o dashboard/steps.js, os dados do visualizador de rotações
namespace {

void heights() {
	std::cout << "| Keys | Order | BST height | AVL height | AVL rotations | Red-black height "
	             "| Red-black rotations |\n| ---: | --- | ---: | ---: | ---: | ---: | ---: |\n";
	for (const trees::Key n : {1000, 10000, 100000}) {
		for (const bool sorted : {true, false}) {
			std::cout << "| " << n << " | " << (sorted ? "sorted" : "random");
			for (const auto& tree : trees::all_trees()) {
				// EN: The random order is a fixed pseudo-random permutation, the same for the
				//     three trees and for the Java program.
				// PT: A ordem aleatória é uma permutação pseudoaleatória fixa, a mesma para as
				//     três árvores e para o programa em Java.
				std::uint64_t state = 88172645463325252ULL;
				std::vector<trees::Key> keys(static_cast<std::size_t>(n));
				for (std::size_t i = 0; i < keys.size(); ++i) {
					keys[i] = static_cast<trees::Key>(i) + 1;
				}
				if (!sorted) {
					for (std::size_t i = keys.size() - 1; i > 0; --i) {
						state ^= state << 13;
						state ^= state >> 7;
						state ^= state << 17;
						std::swap(keys[i], keys[state % (i + 1)]);
					}
				}
				for (const trees::Key key : keys) {
					tree->insert(key);
				}
				std::cout << " | " << tree->height();
				if (tree->name() != "bst") {
					std::cout << " | " << tree->rotations();
				}
			}
			std::cout << " |\n";
		}
	}
}

}  // namespace

int main(int argc, char** argv) {
	const std::string command = argc > 1 ? argv[1] : "heights";
	if (command == "steps") {
		std::cout << trees::steps_script();
		return 0;
	}
	if (command == "heights") {
		heights();
		return 0;
	}
	std::cerr << "usage: tree_demo heights|steps\n";
	return 2;
}
