#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <set>
#include <string>
#include <vector>

#include "avl.hpp"
#include "bst.hpp"
#include "red_black.hpp"
#include "search_tree.hpp"
#include "steps.hpp"

using namespace trees;

namespace {

int checks = 0;
int failures = 0;

void check(bool condition, const std::string& what) {
	++checks;
	if (!condition) {
		++failures;
		std::cerr << "FAIL: " << what << '\n';
	}
}

void basics(SearchTree& tree) {
	const std::string name = tree.name();
	check(tree.size() == 0 && tree.height() == 0 && tree.check().empty(), name + ": empty tree");
	for (const Key key : {50, 30, 70, 20, 40, 60, 80}) {
		check(tree.insert(key), name + ": a new key is inserted");
	}
	check(!tree.insert(40) && tree.size() == 7, name + ": a repeated key is refused");
	check(tree.height() == 3, name + ": seven keys in this order make a full tree of 3 levels");
	check(tree.contains(60) && !tree.contains(65), name + ": contains");
	check(tree.remove(50) && !tree.remove(50), name + ": a key with two children is removed once");
	check(!tree.contains(50) && tree.size() == 6, name + ": the removed key is gone");
	check(tree.check().empty(), name + ": invariant after the removal: " + tree.check());
}

// EN: Property test. Random inserts, removals and searches run on the tree and on std::set, and
//     after every single operation the answer is compared and the invariant of the tree is
//     checked: order for all three, balance for the AVL tree, colours and black heights for
//     the red-black tree.
// PT: Teste de propriedade. Inserções, remoções e buscas aleatórias rodam na árvore e em um
//     std::set, e depois de cada operação a resposta é comparada e a invariante da árvore é
//     conferida: ordem nas três, balanceamento na AVL, cores e alturas negras na rubro-negra.
// ES: Prueba de propiedad. Inserciones, eliminaciones y búsquedas aleatorias corren en el árbol y
//     en un std::set, y después de cada operación se compara la respuesta y se revisa la
//     invariante del árbol: orden en los tres, balanceo en el AVL, colores y alturas negras en
//     el rojo-negro.
void property(SearchTree& tree, std::uint64_t seed) {
	const std::string name = tree.name() + ", seed " + std::to_string(seed);
	std::set<Key> reference;
	std::uint64_t state = seed;
	const auto next = [&state]() {
		state ^= state << 13;
		state ^= state >> 7;
		state ^= state << 17;
		return state;
	};
	bool same = true;
	std::string broken;
	for (int step = 0; step < 6000 && same && broken.empty(); ++step) {
		const Key key = static_cast<Key>(next() % 400);
		const std::uint64_t choice = next() % 10;
		if (choice < 5) {
			same = tree.insert(key) == reference.insert(key).second;
		} else if (choice < 8) {
			same = tree.remove(key) == (reference.erase(key) == 1);
		} else {
			same = tree.contains(key) == (reference.count(key) == 1);
		}
		same = same && tree.size() == reference.size();
		broken = tree.check();
	}
	check(same, name + ": every operation matches std::set");
	check(broken.empty(), name + ": the invariant holds after every operation: " + broken);
}

// EN: The lesson of the mini-project as numbers. 100,000 keys inserted in ascending order turn
//     the unbalanced tree into a list 100,000 nodes tall. The same keys in the same order
//     leave both balanced trees under 40 levels, because they rotate.
// PT: A lição do mini-projeto em números. 100.000 chaves inseridas em ordem crescente
//     transformam a árvore sem balanceamento em uma lista de 100.000 nós de altura. As mesmas
//     chaves na mesma ordem deixam as duas árvores balanceadas abaixo de 40 níveis, porque elas
//     fazem rotações.
// ES: La lección del mini-proyecto en números. 100,000 claves insertadas en orden creciente
//     convierten el árbol sin balanceo en una lista de 100,000 nodos de altura. Las mismas
//     claves en el mismo orden dejan los dos árboles balanceados por debajo de 40 niveles,
//     porque hacen rotaciones.
void sorted_insertion() {
	const Key n = 100000;
	for (const auto& tree : all_trees()) {
		for (Key key = 1; key <= n; ++key) {
			tree->insert(key);
		}
		std::cout << tree->name() << ": height " << tree->height() << ", rotations "
		          << tree->rotations() << " after " << n << " sorted insertions\n";
		check(tree->size() == static_cast<std::size_t>(n), tree->name() + ": all keys are stored");
		check(tree->check().empty(), tree->name() + ": invariant after sorted insertion");
		if (tree->name() == "bst") {
			check(tree->height() == static_cast<std::size_t>(n),
			      "bst: sorted insertion gives height 100,000");
			check(tree->rotations() == 0, "bst: no rotation ever happens");
		} else {
			check(tree->height() < 40,
			      tree->name() + ": sorted insertion keeps the height under 40");
			check(tree->rotations() > 0, tree->name() + ": rotations were counted");
			for (Key key = 1; key <= n; key += 2) {
				tree->remove(key);
			}
			check(tree->size() == static_cast<std::size_t>(n / 2) && tree->check().empty(),
			      tree->name() + ": invariant after removing half of the keys");
		}
	}
}

// EN: The visualiser shows one frame per change. If the number of frames labelled "rotate"
//     equals the rotation counter, no rotation is missing from the replay.
// PT: O visualizador mostra um quadro por mudança. Se o número de quadros rotulados "rotate" é
//     igual ao contador de rotações, nenhuma rotação ficou fora da reprodução.
// ES: El visualizador muestra un cuadro por cambio. Si el número de cuadros rotulados "rotate" es
//     igual al contador de rotaciones, ninguna rotación quedó fuera de la reproducción.
void visualiser_steps() {
	for (const auto& tree : all_trees()) {
		const std::vector<Frame> frames = record(*tree, kSequence);
		std::uint64_t rotation_frames = 0;
		std::uint64_t insert_frames = 0;
		for (const Frame& frame : frames) {
			rotation_frames += frame.label.starts_with("rotate") ? 1 : 0;
			insert_frames += frame.label.starts_with("insert") ? 1 : 0;
		}
		check(insert_frames == kSequence.size(), tree->name() + ": one frame per inserted key");
		check(rotation_frames == tree->rotations(), tree->name() + ": one frame per rotation");
		check(frames.back().tree == tree->to_json(), tree->name() + ": the last frame is the tree");
		if (tree->name() != "bst") {
			check(rotation_frames > 0, tree->name() + ": the fixed sequence shows rotations");
		}
	}
}

}  // namespace

int main() {
	for (const auto& tree : all_trees()) {
		basics(*tree);
	}
	for (std::uint64_t seed = 1; seed <= 3; ++seed) {
		for (const auto& tree : all_trees()) {
			property(*tree, seed);
		}
	}
	visualiser_steps();
	sorted_insertion();
	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << checks << " checks passed\n";
	return EXIT_SUCCESS;
}
