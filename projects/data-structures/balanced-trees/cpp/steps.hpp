#pragma once

#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "avl.hpp"
#include "bst.hpp"
#include "red_black.hpp"
#include "search_tree.hpp"

namespace trees {

// EN: The fixed sequence replayed by the visualiser. It starts with sorted keys, which is what
//     breaks the unbalanced tree, and then mixes keys that trigger single rotations, double
//     rotations and recolouring.
// PT: A sequência fixa repetida pelo visualizador. Ela começa com chaves ordenadas, que é o que
//     quebra a árvore sem balanceamento, e depois mistura chaves que disparam rotações simples,
//     rotações duplas e trocas de cor.
// ES: La secuencia fija que repite el visualizador. Empieza con claves ordenadas, que es lo que
//     rompe el árbol sin balanceo, y luego mezcla claves que disparan rotaciones simples,
//     rotaciones dobles y cambios de color.
inline const std::vector<Key> kSequence = {10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45};

// EN: One frame is one picture of the tree: what just happened, how many rotations so far, and
//     the whole tree as JSON.
// PT: Um quadro é uma foto da árvore: o que acabou de acontecer, quantas rotações até ali, e a
//     árvore inteira em JSON.
// ES: Un cuadro es una foto del árbol: lo que acaba de pasar, cuántas rotaciones hasta ahí, y el
//     árbol entero en JSON.
struct Frame {
	std::string label;
	std::uint64_t rotations;
	std::string tree;
};

inline std::vector<std::unique_ptr<SearchTree>> all_trees() {
	std::vector<std::unique_ptr<SearchTree>> trees;
	trees.push_back(std::make_unique<Bst>());
	trees.push_back(std::make_unique<AvlTree>());
	trees.push_back(std::make_unique<RedBlackTree>());
	return trees;
}

// EN: Inserts the sequence and takes a frame every time the tree reports a change.
// PT: Insere a sequência e tira um quadro toda vez que a árvore avisa de uma mudança.
// ES: Inserta la secuencia y toma un cuadro cada vez que el árbol avisa de un cambio.
inline std::vector<Frame> record(SearchTree& tree, const std::vector<Key>& sequence) {
	std::vector<Frame> frames;
	frames.push_back(Frame{"empty tree", 0, tree.to_json()});
	tree.observe([&](const std::string& what) {
		frames.push_back(Frame{what, tree.rotations(), tree.to_json()});
	});
	for (const Key key : sequence) {
		tree.insert(key);
	}
	tree.observe(nullptr);
	return frames;
}

// EN: The data file of the visualiser. It is a script that sets one global variable, because a
//     page opened straight from disk cannot fetch a JSON file.
// PT: O arquivo de dados do visualizador. É um script que define uma variável global, porque
//     uma página aberta direto do disco não consegue buscar um arquivo JSON.
// ES: El archivo de datos del visualizador. Es un script que define una variable global, porque
//     una página abierta directo desde el disco no puede pedir un archivo JSON.
inline std::string steps_script() {
	std::string out = "window.TREE_STEPS = {\"sequence\":[";
	for (std::size_t i = 0; i < kSequence.size(); ++i) {
		out += (i == 0 ? "" : ",") + std::to_string(kSequence[i]);
	}
	out += "],\"trees\":{";
	bool first_tree = true;
	for (const auto& tree : all_trees()) {
		out += std::string(first_tree ? "" : ",") + "\n\"" + tree->name() + "\":[";
		first_tree = false;
		bool first_frame = true;
		for (const Frame& frame : record(*tree, kSequence)) {
			out += std::string(first_frame ? "" : ",") + "\n{\"label\":\"" + frame.label +
			       "\",\"rotations\":" + std::to_string(frame.rotations) +
			       ",\"tree\":" + frame.tree + "}";
			first_frame = false;
		}
		out += "]";
	}
	out += "}};\n";
	return out;
}

}  // namespace trees
