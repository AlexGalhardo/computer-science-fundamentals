#pragma once

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <string>
#include <utility>
#include <vector>

#include "search_tree.hpp"

namespace trees {

// EN: Binary search tree with no balancing. Smaller keys go left and larger keys go right, and
//     a new key becomes a leaf wherever its search ends. Nothing controls the shape: it depends
//     only on the order of arrival. Keys that arrive already sorted always go to the same side
//     and the tree degenerates into a linked list, with height n and O(n) operations.
// PT: Árvore binária de busca sem balanceamento. Chaves menores vão para a esquerda e maiores
//     para a direita, e uma chave nova vira folha onde a busca por ela termina. Nada controla a
//     forma: ela depende só da ordem de chegada. Chaves que chegam já ordenadas vão sempre para
//     o mesmo lado e a árvore degenera em uma lista encadeada, com altura n e operações O(n).
class Bst final : public SearchTree {
public:
	Bst() = default;
	Bst(const Bst&) = delete;
	Bst& operator=(const Bst&) = delete;

	// EN: Everything here is a loop, not a recursion, including the destructor. A degenerate
	//     tree with 100,000 nodes is 100,000 levels deep, and one function call per level would
	//     overflow the call stack.
	// PT: Tudo aqui é laço, não recursão, inclusive o destrutor. Uma árvore degenerada com
	//     100.000 nós tem 100.000 níveis de profundidade, e uma chamada de função por nível
	//     estouraria a pilha de chamadas.
	~Bst() override {
		std::vector<Node*> pending;
		if (root_ != nullptr) {
			pending.push_back(root_);
		}
		while (!pending.empty()) {
			Node* node = pending.back();
			pending.pop_back();
			if (node->left != nullptr) {
				pending.push_back(node->left);
			}
			if (node->right != nullptr) {
				pending.push_back(node->right);
			}
			delete node;
		}
	}

	std::string name() const override { return "bst"; }

	// EN: `link` points to the pointer that should receive the new node: first the root, then
	//     the left or right field of each node on the way down.
	// PT: `link` aponta para o ponteiro que deve receber o nó novo: primeiro a raiz, depois o
	//     campo esquerdo ou direito de cada nó no caminho de descida.
	bool insert(Key key) override {
		Node** link = &root_;
		while (*link != nullptr) {
			if (key == (*link)->key) {
				return false;
			}
			link = key < (*link)->key ? &(*link)->left : &(*link)->right;
		}
		*link = new Node{key};
		++size_;
		notify("insert " + std::to_string(key));
		return true;
	}

	// EN: Three cases. A node with no child is simply unlinked. A node with one child is
	//     replaced by that child. A node with two children keeps its place and receives the key
	//     of its in-order successor (the smallest key of the right subtree), and the successor,
	//     which has at most one child, is the node that is really unlinked.
	// PT: Três casos. Um nó sem filhos é simplesmente desligado. Um nó com um filho é
	//     substituído por esse filho. Um nó com dois filhos fica no lugar e recebe a chave do
	//     seu sucessor em-ordem (a menor chave da subárvore direita), e o sucessor, que tem no
	//     máximo um filho, é o nó realmente desligado.
	bool remove(Key key) override {
		Node** link = &root_;
		while (*link != nullptr && (*link)->key != key) {
			link = key < (*link)->key ? &(*link)->left : &(*link)->right;
		}
		if (*link == nullptr) {
			return false;
		}
		Node* node = *link;
		if (node->left != nullptr && node->right != nullptr) {
			Node** successor = &node->right;
			while ((*successor)->left != nullptr) {
				successor = &(*successor)->left;
			}
			node->key = (*successor)->key;
			link = successor;
			node = *successor;
		}
		*link = node->left != nullptr ? node->left : node->right;
		delete node;
		--size_;
		return true;
	}

	bool contains(Key key) const override {
		const Node* node = root_;
		while (node != nullptr && node->key != key) {
			node = key < node->key ? node->left : node->right;
		}
		return node != nullptr;
	}

	std::size_t size() const override { return size_; }

	std::size_t height() const override {
		std::size_t tallest = 0;
		std::vector<std::pair<const Node*, std::size_t>> pending;
		if (root_ != nullptr) {
			pending.emplace_back(root_, 1);
		}
		while (!pending.empty()) {
			const auto [node, depth] = pending.back();
			pending.pop_back();
			tallest = std::max(tallest, depth);
			if (node->left != nullptr) {
				pending.emplace_back(node->left, depth + 1);
			}
			if (node->right != nullptr) {
				pending.emplace_back(node->right, depth + 1);
			}
		}
		return tallest;
	}

	std::uint64_t rotations() const override { return 0; }

	// EN: The only invariant of this tree is the order, and the in-order traversal is the test:
	//     it has to visit the keys in strictly increasing order.
	// PT: A única invariante desta árvore é a ordem, e o percurso em-ordem é o teste: ele
	//     precisa visitar as chaves em ordem estritamente crescente.
	std::string check() const override {
		std::vector<const Node*> stack;
		const Node* node = root_;
		const Node* previous = nullptr;
		std::size_t visited = 0;
		while (node != nullptr || !stack.empty()) {
			while (node != nullptr) {
				stack.push_back(node);
				node = node->left;
			}
			node = stack.back();
			stack.pop_back();
			if (previous != nullptr && previous->key >= node->key) {
				return "keys out of order at " + std::to_string(node->key);
			}
			previous = node;
			++visited;
			node = node->right;
		}
		return visited == size_ ? "" : "the size does not match the number of nodes";
	}

	// Recursive on purpose: the visualiser only draws small trees.
	std::string to_json() const override { return json(root_); }

private:
	struct Node {
		Key key;
		Node* left = nullptr;
		Node* right = nullptr;
	};

	static std::string json(const Node* node) {
		if (node == nullptr) {
			return "null";
		}
		return "{\"k\":" + std::to_string(node->key) + ",\"c\":\"\",\"l\":" + json(node->left) +
		       ",\"r\":" + json(node->right) + "}";
	}

	Node* root_ = nullptr;
	std::size_t size_ = 0;
};

}  // namespace trees
