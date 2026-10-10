#pragma once

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <optional>
#include <string>

#include "search_tree.hpp"

namespace trees {

// EN: AVL tree: a binary search tree where, at every node, the heights of the two subtrees
//     differ by at most 1. Each node stores its height. After an insertion or removal the
//     nodes on the path back to the root are checked, and a node that got out of balance is
//     fixed with one or two rotations. This keeps the height below about 1.44 log2(n).
// PT: Árvore AVL: uma árvore binária de busca em que, em todo nó, as alturas das duas
//     subárvores diferem em no máximo 1. Cada nó guarda a sua altura. Depois de uma inserção ou
//     remoção, os nós do caminho de volta até a raiz são conferidos, e um nó que ficou
//     desbalanceado é corrigido com uma ou duas rotações. Isso mantém a altura abaixo de cerca
//     de 1,44 log2(n).
// ES: Árbol AVL: un árbol binario de búsqueda en que, en todo nodo, las alturas de los dos
//     subárboles difieren en como máximo 1. Cada nodo guarda su altura. Después de una inserción
//     o eliminación, se revisan los nodos del camino de vuelta hasta la raíz, y un nodo que
//     quedó desbalanceado se corrige con una o dos rotaciones. Eso mantiene la altura por debajo
//     de cerca de 1.44 log2(n).
class AvlTree final : public SearchTree {
public:
	AvlTree() = default;
	AvlTree(const AvlTree&) = delete;
	AvlTree& operator=(const AvlTree&) = delete;
	~AvlTree() override { destroy(root_); }

	std::string name() const override { return "avl"; }

	bool insert(Key key) override { return insert(root_, key); }
	bool remove(Key key) override { return remove(root_, key); }

	bool contains(Key key) const override {
		const Node* node = root_;
		while (node != nullptr && node->key != key) {
			node = key < node->key ? node->left : node->right;
		}
		return node != nullptr;
	}

	std::size_t size() const override { return size_; }
	std::size_t height() const override { return static_cast<std::size_t>(height_of(root_)); }
	std::uint64_t rotations() const override { return rotations_; }

	std::string check() const override {
		std::size_t nodes = 0;
		std::string problem;
		check(root_, std::nullopt, std::nullopt, nodes, problem);
		if (problem.empty() && nodes != size_) {
			problem = "the size does not match the number of nodes";
		}
		return problem;
	}

	std::string to_json() const override { return json(root_); }

private:
	struct Node {
		Key key;
		int height = 1;
		Node* left = nullptr;
		Node* right = nullptr;
	};

	static int height_of(const Node* node) { return node == nullptr ? 0 : node->height; }

	static void update(Node* node) {
		node->height = 1 + std::max(height_of(node->left), height_of(node->right));
	}

	// EN: Rotation. `link` is the pointer that leads to the subtree (the root, or a child field
	//     of the parent). In a left rotation the right child y rises to the place of x, x
	//     becomes the left child of y, and the subtree that was between them changes parent.
	//     The in-order sequence is the same before and after, so the tree is still a search
	//     tree. Only three pointers change, so it is O(1).
	// PT: Rotação. `link` é o ponteiro que leva à subárvore (a raiz, ou um campo de filho do
	//     pai). Na rotação à esquerda o filho direito y sobe para o lugar de x, x vira filho
	//     esquerdo de y, e a subárvore que ficava entre eles troca de pai. A sequência em-ordem
	//     é a mesma antes e depois, então a árvore continua sendo de busca. Só três ponteiros
	//     mudam, então é O(1).
	// ES: Rotación. `link` es el puntero que lleva al subárbol (la raíz, o un campo de hijo del
	//     padre). En la rotación a la izquierda el hijo derecho y sube al lugar de x, x pasa a ser
	//     hijo izquierdo de y, y el subárbol que estaba entre ellos cambia de padre. La secuencia
	//     en orden es la misma antes y después, así que el árbol sigue siendo de búsqueda. Solo
	//     cambian tres punteros, así que es O(1).
	void rotate_left(Node*& link) {
		Node* x = link;
		Node* y = x->right;
		x->right = y->left;
		y->left = x;
		link = y;
		update(x);
		update(y);
		++rotations_;
		notify("rotate left at " + std::to_string(x->key));
	}

	void rotate_right(Node*& link) {
		Node* x = link;
		Node* y = x->left;
		x->left = y->right;
		y->right = x;
		link = y;
		update(x);
		update(y);
		++rotations_;
		notify("rotate right at " + std::to_string(x->key));
	}

	// EN: Balance factor = height of the right subtree minus height of the left one. At +2 the
	//     right side is too tall. If the right child leans the same way (outer case), one left
	//     rotation fixes it. If the right child leans left (inner case, a zigzag), a single
	//     rotation would only mirror the problem, so the child is rotated right first to
	//     straighten the path. -2 is the mirror image.
	// PT: Fator de balanceamento = altura da subárvore direita menos a da esquerda. Em +2 o lado
	//     direito está alto demais. Se o filho direito pende para o mesmo lado (caso de fora),
	//     uma rotação à esquerda resolve. Se o filho direito pende para a esquerda (caso de
	//     dentro, um zigue-zague), uma rotação simples só espelharia o problema, então o filho é
	//     girado à direita antes, para alinhar o caminho. O -2 é a imagem no espelho.
	// ES: Factor de balance = altura del subárbol derecho menos la del izquierdo. En +2 el lado
	//     derecho está demasiado alto. Si el hijo derecho se inclina al mismo lado (caso de
	//     afuera), una rotación a la izquierda lo resuelve. Si el hijo derecho se inclina a la
	//     izquierda (caso de adentro, un zigzag), una rotación simple solo reflejaría el
	//     problema, así que antes se gira el hijo a la derecha, para alinear el camino. El -2 es
	//     la imagen en el espejo.
	void rebalance(Node*& link) {
		update(link);
		const int balance = height_of(link->right) - height_of(link->left);
		if (balance > 1) {
			if (height_of(link->right->left) > height_of(link->right->right)) {
				rotate_right(link->right);
			}
			rotate_left(link);
		} else if (balance < -1) {
			if (height_of(link->left->right) > height_of(link->left->left)) {
				rotate_left(link->left);
			}
			rotate_right(link);
		}
	}

	// EN: Recursion is safe here: the height is logarithmic, so the call stack is shallow. The
	//     rebalancing happens on the way back from the recursion, from the new leaf up.
	// PT: A recursão é segura aqui: a altura é logarítmica, então a pilha de chamadas é rasa. O
	//     rebalanceamento acontece na volta da recursão, da folha nova para cima.
	// ES: La recursión es segura aquí: la altura es logarítmica, así que la pila de llamadas es
	//     poco profunda. El rebalanceo ocurre al volver de la recursión, de la hoja nueva hacia
	//     arriba.
	bool insert(Node*& link, Key key) {
		if (link == nullptr) {
			link = new Node{key};
			++size_;
			notify("insert " + std::to_string(key));
			return true;
		}
		if (key == link->key) {
			return false;
		}
		const bool inserted = insert(key < link->key ? link->left : link->right, key);
		if (inserted) {
			rebalance(link);
		}
		return inserted;
	}

	bool remove(Node*& link, Key key) {
		if (link == nullptr) {
			return false;
		}
		bool removed = false;
		if (key < link->key) {
			removed = remove(link->left, key);
		} else if (key > link->key) {
			removed = remove(link->right, key);
		} else if (link->left == nullptr || link->right == nullptr) {
			Node* old = link;
			link = link->left != nullptr ? link->left : link->right;
			delete old;
			--size_;
			return true;
		} else {
			const Node* successor = link->right;
			while (successor->left != nullptr) {
				successor = successor->left;
			}
			link->key = successor->key;
			removed = remove(link->right, successor->key);
		}
		if (removed) {
			rebalance(link);
		}
		return removed;
	}

	// Returns the real height of the subtree, and writes the first problem found.
	int check(const Node* node, std::optional<Key> low, std::optional<Key> high, std::size_t& nodes,
	          std::string& problem) const {
		if (node == nullptr) {
			return 0;
		}
		++nodes;
		const int left = check(node->left, low, node->key, nodes, problem);
		const int right = check(node->right, node->key, high, nodes, problem);
		if (!problem.empty()) {
			return 0;
		}
		if ((low && node->key <= *low) || (high && node->key >= *high)) {
			problem = "keys out of order at " + std::to_string(node->key);
		} else if (right - left > 1 || left - right > 1) {
			problem = "node " + std::to_string(node->key) + " is out of balance";
		} else if (node->height != 1 + std::max(left, right)) {
			problem = "node " + std::to_string(node->key) + " stores a wrong height";
		}
		return 1 + std::max(left, right);
	}

	static void destroy(Node* node) {
		if (node != nullptr) {
			destroy(node->left);
			destroy(node->right);
			delete node;
		}
	}

	static std::string json(const Node* node) {
		if (node == nullptr) {
			return "null";
		}
		return "{\"k\":" + std::to_string(node->key) + ",\"c\":\"\",\"l\":" + json(node->left) +
		       ",\"r\":" + json(node->right) + "}";
	}

	Node* root_ = nullptr;
	std::size_t size_ = 0;
	std::uint64_t rotations_ = 0;
};

}  // namespace trees
