#pragma once

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <optional>
#include <string>

#include "search_tree.hpp"

namespace trees {

// EN: Red-black tree: a binary search tree where each node is red or black and four rules
//     hold. The root is black. The NIL leaves are black. A red node has no red child. Every
//     path from a node down to the NIL leaves crosses the same number of black nodes. Together
//     they imply that the longest path is at most twice the shortest, so the height stays
//     below 2 log2(n + 1). The balance is looser than in an AVL tree, and in exchange updates
//     need fewer rotations.
// PT: Árvore rubro-negra: uma árvore binária de busca em que cada nó é vermelho ou preto e
//     quatro regras valem. A raiz é preta. As folhas NIL são pretas. Um nó vermelho não tem
//     filho vermelho. Todo caminho de um nó até as folhas NIL passa pelo mesmo número de nós
//     pretos. Juntas, elas implicam que o caminho mais longo tem no máximo o dobro do mais
//     curto, então a altura fica abaixo de 2 log2(n + 1). O balanceamento é mais frouxo que o
//     da AVL, e em troca as atualizações precisam de menos rotações.
class RedBlackTree final : public SearchTree {
public:
	// EN: One shared sentinel node plays the part of every NIL leaf. It is black, and having a
	//     real node there lets the code read `node->left->red` without testing for null.
	// PT: Um único nó sentinela compartilhado faz o papel de todas as folhas NIL. Ele é preto, e
	//     ter um nó de verdade ali deixa o código ler `node->left->red` sem testar ponteiro nulo.
	RedBlackTree() : nil_(new Node{0, false, nullptr, nullptr, nullptr}), root_(nil_) {
		nil_->left = nil_->right = nil_->parent = nil_;
	}
	RedBlackTree(const RedBlackTree&) = delete;
	RedBlackTree& operator=(const RedBlackTree&) = delete;
	~RedBlackTree() override {
		destroy(root_);
		delete nil_;
	}

	std::string name() const override { return "red-black"; }

	// EN: The new node goes in as a red leaf. Red does not change the number of black nodes on
	//     any path, so the only rule that can break is "no red node has a red child", and that
	//     one can be repaired locally.
	// PT: O nó novo entra como folha vermelha. O vermelho não altera o número de nós pretos de
	//     nenhum caminho, então a única regra que pode quebrar é "nó vermelho não tem filho
	//     vermelho", e essa tem conserto local.
	bool insert(Key key) override {
		Node* parent = nil_;
		Node* node = root_;
		while (node != nil_) {
			if (key == node->key) {
				return false;
			}
			parent = node;
			node = key < node->key ? node->left : node->right;
		}
		Node* fresh = new Node{key, true, nil_, nil_, parent};
		if (parent == nil_) {
			root_ = fresh;
		} else if (key < parent->key) {
			parent->left = fresh;
		} else {
			parent->right = fresh;
		}
		++size_;
		notify("insert " + std::to_string(key));
		fix_insert(fresh);
		return true;
	}

	bool remove(Key key) override {
		Node* target = root_;
		while (target != nil_ && target->key != key) {
			target = key < target->key ? target->left : target->right;
		}
		if (target == nil_) {
			return false;
		}
		// EN: `moved` is the node that leaves its position (the target itself, or its successor
		//     when the target has two children) and `hole` is the node that takes that position.
		//     If the node that left was black, the paths through `hole` lost one black node and
		//     the tree has to be repaired from there.
		// PT: `moved` é o nó que sai da sua posição (o próprio alvo, ou o sucessor quando o alvo
		//     tem dois filhos) e `hole` é o nó que assume essa posição. Se o nó que saiu era
		//     preto, os caminhos que passam por `hole` perderam um nó preto e a árvore precisa
		//     ser consertada a partir dali.
		Node* moved = target;
		bool moved_was_red = moved->red;
		Node* hole = nil_;
		if (target->left == nil_) {
			hole = target->right;
			transplant(target, target->right);
		} else if (target->right == nil_) {
			hole = target->left;
			transplant(target, target->left);
		} else {
			moved = target->right;
			while (moved->left != nil_) {
				moved = moved->left;
			}
			moved_was_red = moved->red;
			hole = moved->right;
			if (moved->parent == target) {
				hole->parent = moved;
			} else {
				transplant(moved, moved->right);
				moved->right = target->right;
				moved->right->parent = moved;
			}
			transplant(target, moved);
			moved->left = target->left;
			moved->left->parent = moved;
			moved->red = target->red;
		}
		delete target;
		--size_;
		if (!moved_was_red) {
			fix_remove(hole);
		}
		return true;
	}

	bool contains(Key key) const override {
		const Node* node = root_;
		while (node != nil_ && node->key != key) {
			node = key < node->key ? node->left : node->right;
		}
		return node != nil_;
	}

	std::size_t size() const override { return size_; }
	std::size_t height() const override { return height_of(root_); }
	std::uint64_t rotations() const override { return rotations_; }

	std::string check() const override {
		if (root_->red) {
			return "the root is red";
		}
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
		bool red;
		Node* left;
		Node* right;
		Node* parent;
	};

	void rotate_left(Node* x) {
		Node* y = x->right;
		x->right = y->left;
		if (y->left != nil_) {
			y->left->parent = x;
		}
		replace_child(x, y);
		y->left = x;
		x->parent = y;
		++rotations_;
		notify("rotate left at " + std::to_string(x->key));
	}

	void rotate_right(Node* x) {
		Node* y = x->left;
		x->left = y->right;
		if (y->right != nil_) {
			y->right->parent = x;
		}
		replace_child(x, y);
		y->right = x;
		x->parent = y;
		++rotations_;
		notify("rotate right at " + std::to_string(x->key));
	}

	// Makes the parent of `old` point to `replacement` instead.
	void replace_child(Node* old, Node* replacement) {
		replacement->parent = old->parent;
		if (old->parent == nil_) {
			root_ = replacement;
		} else if (old == old->parent->left) {
			old->parent->left = replacement;
		} else {
			old->parent->right = replacement;
		}
	}

	// EN: Here the sentinel also receives a parent, on purpose: fix_remove may start at the
	//     sentinel and needs to climb from it.
	// PT: Aqui o sentinela também recebe um pai, de propósito: o fix_remove pode começar no
	//     sentinela e precisa subir a partir dele.
	void transplant(Node* old, Node* replacement) { replace_child(old, replacement); }

	// EN: While the new node and its parent are both red, look at the uncle. A red uncle means
	//     only colours change: parent and uncle become black, the grandparent becomes red, and
	//     the conflict moves two levels up. A black uncle means the subtree is lopsided, and
	//     one or two rotations with a colour swap end the repair at once.
	// PT: Enquanto o nó novo e o pai forem ambos vermelhos, olha-se o tio. Tio vermelho
	//     significa que só as cores mudam: pai e tio ficam pretos, o avô fica vermelho, e o
	//     conflito sobe dois níveis. Tio preto significa que a subárvore está torta, e uma ou
	//     duas rotações com troca de cores encerram o conserto de vez.
	void fix_insert(Node* node) {
		while (node->parent->red) {
			Node* parent = node->parent;
			Node* grandparent = parent->parent;
			const bool parent_is_left = parent == grandparent->left;
			Node* uncle = parent_is_left ? grandparent->right : grandparent->left;
			if (uncle->red) {
				parent->red = false;
				uncle->red = false;
				grandparent->red = true;
				notify("recolour: " + std::to_string(parent->key) + " and " +
				       std::to_string(uncle->key) + " black, " + std::to_string(grandparent->key) +
				       " red");
				node = grandparent;
				continue;
			}
			if (parent_is_left) {
				if (node == parent->right) {
					rotate_left(parent);
					std::swap(node, parent);
				}
				parent->red = false;
				grandparent->red = true;
				rotate_right(grandparent);
			} else {
				if (node == parent->left) {
					rotate_right(parent);
					std::swap(node, parent);
				}
				parent->red = false;
				grandparent->red = true;
				rotate_left(grandparent);
			}
		}
		if (root_->red) {
			root_->red = false;
			notify("recolour: root " + std::to_string(root_->key) + " black");
		}
	}

	// EN: `node` carries an "extra black" that its paths are missing. The sibling decides what
	//     to do. A red sibling is first rotated out of the way. A black sibling with two black
	//     children gives up its own black (it turns red) and the problem moves up to the parent.
	//     A black sibling with a red child lends that red through one or two rotations, which
	//     restores the missing black and ends the repair.
	// PT: `node` carrega um "preto extra" que está faltando nos caminhos dele. O irmão decide o
	//     que fazer. Um irmão vermelho é primeiro tirado do caminho com uma rotação. Um irmão
	//     preto com dois filhos pretos abre mão do próprio preto (fica vermelho) e o problema
	//     sobe para o pai. Um irmão preto com um filho vermelho empresta esse vermelho por uma
	//     ou duas rotações, o que devolve o preto que faltava e encerra o conserto.
	void fix_remove(Node* node) {
		while (node != root_ && !node->red) {
			Node* parent = node->parent;
			if (node == parent->left) {
				Node* sibling = parent->right;
				if (sibling->red) {
					sibling->red = false;
					parent->red = true;
					rotate_left(parent);
					sibling = parent->right;
				}
				if (!sibling->left->red && !sibling->right->red) {
					sibling->red = true;
					node = parent;
					continue;
				}
				if (!sibling->right->red) {
					sibling->left->red = false;
					sibling->red = true;
					rotate_right(sibling);
					sibling = parent->right;
				}
				sibling->red = parent->red;
				parent->red = false;
				sibling->right->red = false;
				rotate_left(parent);
			} else {
				Node* sibling = parent->left;
				if (sibling->red) {
					sibling->red = false;
					parent->red = true;
					rotate_right(parent);
					sibling = parent->left;
				}
				if (!sibling->left->red && !sibling->right->red) {
					sibling->red = true;
					node = parent;
					continue;
				}
				if (!sibling->left->red) {
					sibling->right->red = false;
					sibling->red = true;
					rotate_left(sibling);
					sibling = parent->left;
				}
				sibling->red = parent->red;
				parent->red = false;
				sibling->left->red = false;
				rotate_right(parent);
			}
			node = root_;
		}
		node->red = false;
	}

	std::size_t height_of(const Node* node) const {
		return node == nil_ ? 0 : 1 + std::max(height_of(node->left), height_of(node->right));
	}

	// Returns the black height of the subtree, and writes the first problem found.
	int check(const Node* node, std::optional<Key> low, std::optional<Key> high, std::size_t& nodes,
	          std::string& problem) const {
		if (node == nil_) {
			return 1;
		}
		++nodes;
		const int left = check(node->left, low, node->key, nodes, problem);
		const int right = check(node->right, node->key, high, nodes, problem);
		if (!problem.empty()) {
			return 0;
		}
		if ((low && node->key <= *low) || (high && node->key >= *high)) {
			problem = "keys out of order at " + std::to_string(node->key);
		} else if (node->red && (node->left->red || node->right->red)) {
			problem = "red node " + std::to_string(node->key) + " has a red child";
		} else if (left != right) {
			problem = "different black heights below " + std::to_string(node->key);
		}
		return left + (node->red ? 0 : 1);
	}

	void destroy(Node* node) {
		if (node != nil_) {
			destroy(node->left);
			destroy(node->right);
			delete node;
		}
	}

	std::string json(const Node* node) const {
		if (node == nil_) {
			return "null";
		}
		return "{\"k\":" + std::to_string(node->key) + ",\"c\":\"" + (node->red ? "R" : "B") +
		       "\",\"l\":" + json(node->left) + ",\"r\":" + json(node->right) + "}";
	}

	Node* nil_;
	Node* root_;
	std::size_t size_ = 0;
	std::uint64_t rotations_ = 0;
};

}  // namespace trees
