#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <iostream>
#include <map>
#include <optional>
#include <string>

#include "btree.hpp"
#include "disk_bst.hpp"
#include "workload.hpp"

using namespace btree;

namespace {

int checks = 0;
int failures = 0;
const std::string directory = "/tmp";

void check(bool condition, const std::string& what) {
	++checks;
	if (!condition) {
		++failures;
		std::cerr << "FAIL: " << what << '\n';
	}
}

void basics() {
	const std::string path = directory + "/basics.btree";
	{
		BTree tree(path, 2);
		check(tree.height() == 1 && tree.size() == 0, "basics: an empty tree is one empty leaf");
		for (Key key = 1; key <= 20; ++key) {
			tree.insert(key * 7 % 23, key);
		}
		check(tree.size() == 20 && tree.height() >= 3, "basics: 20 keys with t = 2 split the root");
		check(tree.check().empty(), "basics: invariants after the inserts: " + tree.check());
		check(tree.search(7) == std::optional<Value>(1), "basics: search finds a stored key");
		check(!tree.search(0).has_value(), "basics: search does not find a missing key");
		check(!tree.insert(7, 99) && tree.search(7) == std::optional<Value>(99),
		      "basics: inserting an existing key replaces its value");
		check(tree.remove(7) && !tree.remove(7), "basics: a key is removed only once");
		check(tree.check().empty(), "basics: invariants after a removal: " + tree.check());
	}
	// EN: The first tree object is gone and its file is closed. Everything a new object knows
	//     comes from the pages on disk.
	// PT: O primeiro objeto da árvore não existe mais e o arquivo foi fechado. Tudo o que um
	//     objeto novo sabe vem das páginas em disco.
	// ES: El primer objeto del árbol ya no existe y el archivo se cerró. Todo lo que un objeto
	//     nuevo sabe viene de las páginas en disco.
	BTree reopened(path, BTree::OpenExisting{});
	check(reopened.size() == 19 && reopened.search(14) == std::optional<Value>(2),
	      "basics: the tree survives closing and reopening the file");
	check(reopened.check().empty(), "basics: invariants after reopening: " + reopened.check());
	std::remove(path.c_str());
}

// EN: 100,000 random operations run on the B-tree and on std::map at the same time. Every
//     answer has to match, and the invariants are checked along the way and at the end. Small
//     degrees with a small key range make splits, borrows and merges happen constantly.
// PT: 100.000 operações aleatórias rodam na árvore B e em um std::map ao mesmo tempo. Toda
//     resposta precisa bater, e as invariantes são conferidas pelo caminho e no fim. Graus
//     pequenos com uma faixa pequena de chaves fazem divisões, empréstimos e fusões acontecerem
//     o tempo todo.
// ES: 100,000 operaciones aleatorias corren en el árbol B y en un std::map a la vez. Cada
//     respuesta debe coincidir, y las invariantes se verifican por el camino y al final. Grados
//     pequeños con un rango pequeño de claves hacen que divisiones, préstamos y fusiones ocurran
//     todo el tiempo.
void random_operations(std::size_t degree, std::uint64_t key_range) {
	const std::string name = "random, t = " + std::to_string(degree);
	const std::string path = directory + "/random.btree";
	BTree tree(path, degree);
	std::map<Key, Value> reference;
	std::uint64_t state = 0x9e3779b97f4a7c15ULL + degree;
	const auto next = [&state]() {
		state ^= state << 13;
		state ^= state >> 7;
		state ^= state << 17;
		return state;
	};
	bool same = true;
	std::string broken;
	std::uint64_t tallest = 0;
	for (int step = 1; step <= 100000 && same && broken.empty(); ++step) {
		const Key key = next() % key_range;
		const Value value = next();
		const std::uint64_t choice = next() % 10;
		if (choice < 5) {
			const bool is_new = reference.find(key) == reference.end();
			reference[key] = value;
			same = tree.insert(key, value) == is_new;
		} else if (choice < 8) {
			same = tree.remove(key) == (reference.erase(key) == 1);
		} else {
			const auto found = reference.find(key);
			same = tree.search(key) ==
			       (found == reference.end() ? std::nullopt : std::optional<Value>(found->second));
		}
		same = same && tree.size() == reference.size();
		tallest = tree.height() > tallest ? tree.height() : tallest;
		if (step % 5000 == 0) {
			broken = tree.check();
		}
	}
	check(same, name + ": every operation matches std::map");
	check(broken.empty(), name + ": invariants hold during the run: " + broken);
	check(tallest >= 3, name + ": the tree reached at least 3 levels");
	bool content = true;
	for (const auto& [key, value] : reference) {
		content = content && tree.search(key) == std::optional<Value>(value);
	}
	check(content, name + ": final content matches std::map");

	// EN: Removing everything has to bring the tree back to one empty leaf, and the pages
	//     released on the way must be reused: emptying the tree and inserting the same keys in
	//     the same order a second time cannot make the file grow.
	// PT: Remover tudo precisa trazer a árvore de volta a uma folha vazia, e as páginas
	//     liberadas no caminho precisam ser reaproveitadas: esvaziar a árvore e inserir as
	//     mesmas chaves na mesma ordem pela segunda vez não pode fazer o arquivo crescer.
	// ES: Quitar todo debe traer el árbol de vuelta a una hoja vacía, y las páginas liberadas
	//     en el camino deben reutilizarse: vaciar el árbol e insertar las mismas claves en el
	//     mismo orden por segunda vez no puede hacer crecer el archivo.
	for (const auto& [key, value] : reference) {
		same = same && tree.remove(key);
	}
	check(same && tree.size() == 0 && tree.height() == 1 && tree.check().empty(),
	      name + ": removing every key leaves one empty leaf");
	for (const auto& [key, value] : reference) {
		tree.insert(key, value);
	}
	const std::uint64_t pages = tree.page_count();
	for (const auto& [key, value] : reference) {
		tree.remove(key);
	}
	for (const auto& [key, value] : reference) {
		tree.insert(key, value);
	}
	check(tree.page_count() == pages, name + ": freed pages are reused");
	check(tree.check().empty(), name + ": invariants after refilling: " + tree.check());
	std::remove(path.c_str());
}

// EN: The point of the whole mini-project in one assertion: with a million keys, no search
//     reads more pages than the height of the tree, and that height is 3.
// PT: O sentido do mini-projeto inteiro em uma verificação: com um milhão de chaves, nenhuma
//     busca lê mais páginas que a altura da árvore, e essa altura é 3.
// ES: El sentido del mini-proyecto entero en una verificación: con un millón de claves, ninguna
//     búsqueda lee más páginas que la altura del árbol, y esa altura es 3.
void page_reads() {
	const Comparison result = compare(1000000, directory);
	std::cout << "1,000,000 keys: B-tree height " << result.btree_height
	          << ", max pages per search " << result.btree_max << " (hit) and "
	          << result.btree_max_missing << " (miss); BST height " << result.bst_height
	          << ", average pages per search " << result.bst_average << ", max " << result.bst_max
	          << '\n';
	check(result.all_found, "page reads: every search gave the right answer");
	check(result.btree_height == 3, "page reads: a million keys fit in 3 levels");
	check(
	    result.btree_max <= result.btree_height && result.btree_max_missing <= result.btree_height,
	    "page reads: a search reads at most the height of the tree in pages");
	check(result.bst_average > 3.0 * static_cast<double>(result.btree_height),
	      "page reads: the binary tree reads several times more pages per search");
}

}  // namespace

int main() {
	basics();
	random_operations(2, 4096);
	random_operations(3, 4096);
	random_operations(BTree::kMaxDegree, 60000);
	page_reads();
	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << checks << " checks passed\n";
	return EXIT_SUCCESS;
}
