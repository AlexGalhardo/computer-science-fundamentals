#pragma once

#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <string>
#include <vector>

#include "btree.hpp"
#include "disk_bst.hpp"

namespace btree {

// EN: Turns 0, 1, 2... into keys that look random. The function is a bijection (every step can
//     be undone), so different inputs always give different keys and no key is repeated.
// PT: Transforma 0, 1, 2... em chaves com cara de aleatórias. A função é uma bijeção (cada
//     passo pode ser desfeito), então entradas diferentes dão sempre chaves diferentes e nenhuma
//     chave se repete.
inline Key scramble(std::uint64_t x) {
	x ^= x >> 30;
	x *= 0xbf58476d1ce4e5b9ULL;
	x ^= x >> 27;
	x *= 0x94d049bb133111ebULL;
	x ^= x >> 31;
	return x;
}

struct Comparison {
	std::uint64_t n = 0;
	std::uint64_t btree_height = 0;
	double btree_average = 0;
	std::uint64_t btree_max = 0;
	std::uint64_t btree_max_missing = 0;
	std::uint64_t btree_pages = 0;
	std::uint64_t bst_height = 0;
	double bst_average = 0;
	std::uint64_t bst_max = 0;
	std::uint64_t bst_pages = 0;
	bool all_found = true;
};

// EN: Builds both structures with the same n keys in the same order, then runs the same
//     searches on both and records how many pages each search read.
// PT: Monta as duas estruturas com as mesmas n chaves na mesma ordem, depois roda as mesmas
//     buscas nas duas e registra quantas páginas cada busca leu.
inline Comparison compare(std::uint64_t n, const std::string& directory,
                          std::uint64_t searches = 10000) {
	const std::string tree_path = directory + "/compare.btree";
	const std::string bst_path = directory + "/compare.bst";
	Comparison result;
	result.n = n;
	std::vector<Key> keys(n);
	{
		BTree tree(tree_path);
		for (std::uint64_t i = 0; i < n; ++i) {
			keys[i] = scramble(i);
			tree.insert(keys[i], keys[i] * 2);
		}
		DiskBst bst(bst_path, keys);
		result.btree_height = tree.height();
		result.btree_pages = tree.page_count();
		result.bst_height = bst.height();
		result.bst_pages = bst.page_count();
		std::uint64_t tree_total = 0;
		std::uint64_t bst_total = 0;
		for (std::uint64_t s = 0; s < searches; ++s) {
			const Key key = keys[scramble(s + 7) % n];
			std::uint64_t before = tree.page_reads();
			result.all_found = result.all_found && tree.search(key) == key * 2;
			std::uint64_t used = tree.page_reads() - before;
			tree_total += used;
			result.btree_max = std::max(result.btree_max, used);

			before = bst.page_reads();
			result.all_found = result.all_found && bst.search(key) == key * 2;
			used = bst.page_reads() - before;
			bst_total += used;
			result.bst_max = std::max(result.bst_max, used);

			// EN: scramble(n + s) was never inserted, so this search has to fail.
			// PT: scramble(n + s) nunca foi inserida, então esta busca tem de falhar.
			before = tree.page_reads();
			result.all_found = result.all_found && !tree.search(scramble(n + s)).has_value();
			result.btree_max_missing =
			    std::max(result.btree_max_missing, tree.page_reads() - before);
		}
		result.btree_average = static_cast<double>(tree_total) / static_cast<double>(searches);
		result.bst_average = static_cast<double>(bst_total) / static_cast<double>(searches);
	}
	std::remove(tree_path.c_str());
	std::remove(bst_path.c_str());
	return result;
}

}  // namespace btree
