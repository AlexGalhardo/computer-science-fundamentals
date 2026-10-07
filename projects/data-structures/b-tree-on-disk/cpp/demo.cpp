#include <cstdint>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <string>

#include "workload.hpp"

// EN: Demo: builds a B-tree and a binary search tree on disk with the same keys, for growing
//     sizes, and prints a Markdown table with the pages read per search in each one.
//       btree_demo [largest n] [directory for the temporary files]
// PT: Demo: monta uma árvore B e uma árvore binária de busca em disco com as mesmas chaves,
//     para tamanhos crescentes, e imprime uma tabela Markdown com as páginas lidas por busca
//     em cada uma.
//       btree_demo [maior n] [diretório dos arquivos temporários]
int main(int argc, char** argv) {
	const std::uint64_t largest = argc > 1 ? std::strtoull(argv[1], nullptr, 10) : 1000000;
	const std::string directory = argc > 2 ? argv[2] : "/tmp";
	std::cout
	    << "| Keys | B-tree levels | B-tree pages per search (avg / max) | BST height (nodes) "
	       "| BST pages per search (avg / max) | B-tree file pages | BST file pages |\n"
	       "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n";
	std::cout << std::fixed << std::setprecision(2);
	for (std::uint64_t n = 1000; n <= largest; n *= 10) {
		const btree::Comparison row = btree::compare(n, directory);
		std::cout << "| " << row.n << " | " << row.btree_height << " | " << row.btree_average
		          << " / " << row.btree_max << " | " << row.bst_height << " | " << row.bst_average
		          << " / " << row.bst_max << " | " << row.btree_pages << " | " << row.bst_pages
		          << " |\n";
	}
	return 0;
}
