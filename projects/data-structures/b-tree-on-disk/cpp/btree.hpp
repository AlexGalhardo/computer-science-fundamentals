#pragma once

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <exception>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "pager.hpp"

namespace btree {

using Key = std::uint64_t;
using Value = std::uint64_t;

// EN: A B-tree stored in a file, one node per page. A node of a binary tree holds one key and
//     has two children. A node of a B-tree fills a whole page with keys: here up to 169 keys
//     and 170 children. Each page read therefore discards 169/170 of the remaining keys instead
//     of half, and a million keys fit in a tree only 3 levels tall. That is why databases and
//     file systems use wide trees: the cost of a search is the number of pages read.
// PT: Uma árvore B guardada em um arquivo, um nó por página. Um nó de árvore binária guarda uma
//     chave e tem dois filhos. Um nó de árvore B enche uma página inteira de chaves: aqui até
//     169 chaves e 170 filhos. Cada página lida descarta então 169/170 das chaves restantes em
//     vez de metade, e um milhão de chaves cabe em uma árvore de só 3 níveis. É por isso que
//     bancos de dados e sistemas de arquivos usam árvores largas: o custo de uma busca é o
//     número de páginas lidas.
class BTree {
public:
	// EN: The minimum degree t fixes the size of a node: every node except the root has
	//     between t - 1 and 2t - 1 keys. 2t - 1 = 169 is the most that fits in a 4096-byte
	//     page with this layout. Tests use t = 2 so that splits and merges happen all the time.
	// PT: O grau mínimo t fixa o tamanho de um nó: todo nó, menos a raiz, tem entre t - 1 e
	//     2t - 1 chaves. 2t - 1 = 169 é o máximo que cabe em uma página de 4096 bytes com este
	//     layout. Os testes usam t = 2 para que divisões e fusões aconteçam o tempo todo.
	static constexpr std::size_t kMaxDegree = 85;
	static constexpr std::size_t kMaxKeys = 2 * kMaxDegree - 1;

	struct OpenExisting {};

	// Creates a new, empty tree, replacing any file at `path`.
	explicit BTree(const std::string& path, std::size_t min_degree = kMaxDegree)
	    : pager_(path, true), t_(min_degree) {
		if (min_degree < 2 || min_degree > kMaxDegree) {
			throw std::invalid_argument("btree: the minimum degree must be between 2 and 85");
		}
		pager_.append();  // page 0 is the header
		Node root;
		root.id = pager_.append();
		store(root);
		root_ = root.id;
		height_ = 1;
		write_header();
	}

	// Opens a tree written earlier.
	BTree(const std::string& path, OpenExisting) : pager_(path, false) {
		const Page header = pager_.read(0);
		if (get_u64(header, 0) != kMagic) {
			throw std::runtime_error("btree: not a B-tree file");
		}
		t_ = static_cast<std::size_t>(get_u64(header, 8));
		root_ = get_u64(header, 16);
		count_ = get_u64(header, 24);
		height_ = get_u64(header, 32);
		free_head_ = get_u64(header, 40);
	}

	~BTree() {
		try {
			flush();
		} catch (const std::exception&) {
			// EN: A destructor must not throw. Call flush() directly to see a write error.
			// PT: Um destrutor não pode lançar exceção. Chame flush() para ver um erro de escrita.
		}
	}

	// EN: Search reads one page per level, from the root down, and stops as soon as the key
	//     is found. Inside the page the keys are sorted, so a binary search picks the child.
	// PT: A busca lê uma página por nível, da raiz para baixo, e para assim que acha a chave.
	//     Dentro da página as chaves estão ordenadas, então uma busca binária escolhe o filho.
	std::optional<Value> search(Key key) {
		PageId id = root_;
		for (;;) {
			const Node node = load(id);
			const std::size_t i = index_of(node, key);
			if (i < node.keys.size() && node.keys[i] == key) {
				return node.values[i];
			}
			if (node.leaf) {
				return std::nullopt;
			}
			id = node.children[i];
		}
	}

	// EN: Insertion in one pass, top down. Before going into a child that is full, the child
	//     is split, so there is always room when the leaf is reached and nothing has to climb
	//     back. The tree only grows at the top: when the root is full it is split under a new
	//     root, and every leaf gets one level deeper at the same time. That is how all leaves
	//     stay at the same depth. Returns true for a new key, false when a value was replaced.
	// PT: Inserção em uma passada, de cima para baixo. Antes de entrar em um filho cheio, o
	//     filho é dividido, então sempre há espaço ao chegar na folha e nada precisa subir de
	//     volta. A árvore só cresce por cima: quando a raiz está cheia ela é dividida sob uma
	//     raiz nova, e todas as folhas ficam um nível mais fundas ao mesmo tempo. É assim que
	//     todas as folhas ficam na mesma profundidade. Devolve true para chave nova e false
	//     quando um valor foi trocado.
	bool insert(Key key, Value value) {
		Node node = load(root_);
		if (node.keys.size() == max_keys()) {
			Node new_root;
			new_root.id = allocate();
			new_root.leaf = false;
			new_root.children.push_back(node.id);
			split_child(new_root, 0, node);
			root_ = new_root.id;
			++height_;
			dirty_ = true;
			node = std::move(new_root);
		}
		for (;;) {
			const std::size_t i = index_of(node, key);
			if (i < node.keys.size() && node.keys[i] == key) {
				node.values[i] = value;
				store(node);
				return false;
			}
			if (node.leaf) {
				node.keys.insert(node.keys.begin() + static_cast<std::ptrdiff_t>(i), key);
				node.values.insert(node.values.begin() + static_cast<std::ptrdiff_t>(i), value);
				store(node);
				++count_;
				dirty_ = true;
				return true;
			}
			Node child = load(node.children[i]);
			if (child.keys.size() == max_keys()) {
				Node sibling = split_child(node, i, child);
				if (key == node.keys[i]) {
					node.values[i] = value;
					store(node);
					return false;
				}
				if (key > node.keys[i]) {
					child = std::move(sibling);
				}
			}
			node = std::move(child);
		}
	}

	// EN: Removal in one pass, top down. Before going into a child that has only the minimum
	//     of t - 1 keys, the child is refilled, so removing a key down there can never leave a
	//     node too empty. A key found in an internal node is replaced by its predecessor or
	//     successor, which lives in a leaf, and that one is removed instead.
	// PT: Remoção em uma passada, de cima para baixo. Antes de entrar em um filho que tem só o
	//     mínimo de t - 1 chaves, o filho é reabastecido, então remover uma chave lá embaixo
	//     nunca deixa um nó vazio demais. Uma chave achada em um nó interno é trocada pelo seu
	//     antecessor ou sucessor, que mora em uma folha, e é esse que acaba removido.
	bool remove(Key key) {
		Node node = load(root_);
		for (;;) {
			const std::size_t i = index_of(node, key);
			if (i < node.keys.size() && node.keys[i] == key) {
				if (node.leaf) {
					node.keys.erase(node.keys.begin() + static_cast<std::ptrdiff_t>(i));
					node.values.erase(node.values.begin() + static_cast<std::ptrdiff_t>(i));
					store(node);
					--count_;
					dirty_ = true;
					return true;
				}
				Node left = load(node.children[i]);
				if (left.keys.size() >= t_) {
					const auto [k, v] = edge_entry(left, true);
					node.keys[i] = k;
					node.values[i] = v;
					store(node);
					node = std::move(left);
					key = k;
					continue;
				}
				Node right = load(node.children[i + 1]);
				if (right.keys.size() >= t_) {
					const auto [k, v] = edge_entry(right, false);
					node.keys[i] = k;
					node.values[i] = v;
					store(node);
					node = std::move(right);
					key = k;
					continue;
				}
				merge(node, i, left, right);
				node = std::move(left);
				continue;
			}
			if (node.leaf) {
				return false;
			}
			Node child = load(node.children[i]);
			if (child.keys.size() < t_) {
				child = refill(node, i, std::move(child));
			}
			node = std::move(child);
		}
	}

	// EN: Walks the whole tree and checks the three invariants of a B-tree: every node has a
	//     legal number of keys, the keys are in order (inside each node and against the keys of
	//     its ancestors), and every leaf is at the same depth. Returns an empty text when all
	//     hold, or a description of the first problem.
	// PT: Percorre a árvore inteira e confere as três invariantes de uma árvore B: todo nó tem
	//     um número legal de chaves, as chaves estão em ordem (dentro de cada nó e em relação às
	//     chaves dos ancestrais), e toda folha está na mesma profundidade. Devolve um texto
	//     vazio quando tudo vale, ou a descrição do primeiro problema.
	std::string check() {
		std::uint64_t keys = 0;
		const std::string problem = check_node(root_, 1, std::nullopt, std::nullopt, keys);
		if (!problem.empty()) {
			return problem;
		}
		if (keys != count_) {
			return "the header counts " + std::to_string(count_) + " keys, the tree has " +
			       std::to_string(keys);
		}
		return "";
	}

	void flush() {
		if (dirty_) {
			write_header();
		}
	}

	std::uint64_t size() const { return count_; }
	// Number of levels: 1 for a tree whose root is a leaf.
	std::uint64_t height() const { return height_; }
	std::uint64_t page_reads() const { return pager_.reads(); }
	std::uint64_t page_writes() const { return pager_.writes(); }
	std::uint64_t page_count() const { return pager_.page_count(); }

private:
	static constexpr std::uint64_t kMagic = 0x4545525442464553ULL;  // "SEFBTREE"
	static constexpr std::size_t kKeysOffset = 16;
	static constexpr std::size_t kValuesOffset = kKeysOffset + 8 * kMaxKeys;
	static constexpr std::size_t kChildrenOffset = kValuesOffset + 8 * kMaxKeys;

	struct Node {
		PageId id = 0;
		bool leaf = true;
		std::vector<Key> keys;
		std::vector<Value> values;
		std::vector<PageId> children;
	};

	std::size_t max_keys() const { return 2 * t_ - 1; }

	static std::size_t index_of(const Node& node, Key key) {
		return static_cast<std::size_t>(std::lower_bound(node.keys.begin(), node.keys.end(), key) -
		                                node.keys.begin());
	}

	// EN: Page layout of a node: leaf flag, key count, then three fixed areas for keys, values
	//     and child page numbers. Children are page numbers, not memory addresses: a pointer
	//     means nothing after the program ends, a page number is valid for as long as the file
	//     exists.
	// PT: Layout de página de um nó: marca de folha, quantidade de chaves e três áreas fixas
	//     para chaves, valores e números de página dos filhos. Os filhos são números de página,
	//     não endereços de memória: um ponteiro não significa nada depois que o programa
	//     termina, um número de página vale enquanto o arquivo existir.
	Node load(PageId id) {
		const Page page = pager_.read(id);
		Node node;
		node.id = id;
		node.leaf = get_u64(page, 0) == 1;
		const auto count = static_cast<std::size_t>(get_u64(page, 8));
		node.keys.resize(count);
		node.values.resize(count);
		for (std::size_t i = 0; i < count; ++i) {
			node.keys[i] = get_u64(page, kKeysOffset + 8 * i);
			node.values[i] = get_u64(page, kValuesOffset + 8 * i);
		}
		if (!node.leaf) {
			node.children.resize(count + 1);
			for (std::size_t i = 0; i <= count; ++i) {
				node.children[i] = get_u64(page, kChildrenOffset + 8 * i);
			}
		}
		return node;
	}

	void store(const Node& node) {
		Page page{};
		put_u64(page, 0, node.leaf ? 1 : 0);
		put_u64(page, 8, node.keys.size());
		for (std::size_t i = 0; i < node.keys.size(); ++i) {
			put_u64(page, kKeysOffset + 8 * i, node.keys[i]);
			put_u64(page, kValuesOffset + 8 * i, node.values[i]);
		}
		for (std::size_t i = 0; i < node.children.size(); ++i) {
			put_u64(page, kChildrenOffset + 8 * i, node.children[i]);
		}
		pager_.write(node.id, page);
	}

	void write_header() {
		Page page{};
		put_u64(page, 0, kMagic);
		put_u64(page, 8, t_);
		put_u64(page, 16, root_);
		put_u64(page, 24, count_);
		put_u64(page, 32, height_);
		put_u64(page, 40, free_head_);
		pager_.write(0, page);
		dirty_ = false;
	}

	// EN: Pages released by merges form a linked list inside the file itself: each free page
	//     stores the number of the next one. A new node reuses a free page before the file
	//     grows, so deleting does not leave the file full of dead pages.
	// PT: As páginas liberadas pelas fusões formam uma lista encadeada dentro do próprio
	//     arquivo: cada página livre guarda o número da próxima. Um nó novo reaproveita uma
	//     página livre antes de o arquivo crescer, então remover não deixa o arquivo cheio de
	//     páginas mortas.
	PageId allocate() {
		if (free_head_ == 0) {
			return pager_.append();
		}
		const PageId id = free_head_;
		free_head_ = get_u64(pager_.read(id), 0);
		dirty_ = true;
		return id;
	}

	void release(PageId id) {
		Page page{};
		put_u64(page, 0, free_head_);
		pager_.write(id, page);
		free_head_ = id;
		dirty_ = true;
	}

	// EN: Split. A full child has 2t - 1 keys. The middle key goes up to the parent and the
	//     t - 1 keys after it move to a new sibling page. The child keeps the first t - 1.
	// PT: Divisão (split). Um filho cheio tem 2t - 1 chaves. A chave do meio sobe para o pai e
	//     as t - 1 chaves depois dela vão para uma nova página irmã. O filho fica com as
	//     primeiras t - 1.
	Node split_child(Node& parent, std::size_t i, Node& child) {
		Node sibling;
		sibling.id = allocate();
		sibling.leaf = child.leaf;
		const auto middle = static_cast<std::ptrdiff_t>(t_ - 1);
		const Key up_key = child.keys[t_ - 1];
		const Value up_value = child.values[t_ - 1];
		sibling.keys.assign(child.keys.begin() + middle + 1, child.keys.end());
		sibling.values.assign(child.values.begin() + middle + 1, child.values.end());
		child.keys.resize(t_ - 1);
		child.values.resize(t_ - 1);
		if (!child.leaf) {
			sibling.children.assign(child.children.begin() + middle + 1, child.children.end());
			child.children.resize(t_);
		}
		const auto at = static_cast<std::ptrdiff_t>(i);
		parent.keys.insert(parent.keys.begin() + at, up_key);
		parent.values.insert(parent.values.begin() + at, up_value);
		parent.children.insert(parent.children.begin() + at + 1, sibling.id);
		store(child);
		store(sibling);
		store(parent);
		return sibling;
	}

	// EN: Merge, the opposite of a split. Two neighbouring children with t - 1 keys each and
	//     the parent key between them become one full node of 2t - 1 keys. The page of the
	//     right child is released. If the root is left with no key, the merged node becomes the
	//     new root and the tree gets one level shorter, again for every leaf at the same time.
	// PT: Fusão (merge), o oposto da divisão. Dois filhos vizinhos com t - 1 chaves cada e a
	//     chave do pai que fica entre eles viram um único nó cheio, de 2t - 1 chaves. A página
	//     do filho direito é liberada. Se a raiz ficar sem nenhuma chave, o nó fundido vira a
	//     nova raiz e a árvore fica um nível mais baixa, de novo para todas as folhas de uma vez.
	void merge(Node& parent, std::size_t i, Node& left, Node& right) {
		const auto at = static_cast<std::ptrdiff_t>(i);
		left.keys.push_back(parent.keys[i]);
		left.values.push_back(parent.values[i]);
		left.keys.insert(left.keys.end(), right.keys.begin(), right.keys.end());
		left.values.insert(left.values.end(), right.values.begin(), right.values.end());
		left.children.insert(left.children.end(), right.children.begin(), right.children.end());
		parent.keys.erase(parent.keys.begin() + at);
		parent.values.erase(parent.values.begin() + at);
		parent.children.erase(parent.children.begin() + at + 1);
		release(right.id);
		store(left);
		if (parent.id == root_ && parent.keys.empty()) {
			release(parent.id);
			root_ = left.id;
			--height_;
			dirty_ = true;
		} else {
			store(parent);
		}
	}

	// EN: Redistribution. A child with only t - 1 keys borrows one through the parent: the
	//     parent key between the two siblings goes down to the child, and the nearest key of
	//     the richer sibling goes up to take its place. Keys rotate through the parent so that
	//     the order is preserved. Only when no sibling can lend a key are two nodes merged.
	// PT: Redistribuição. Um filho com só t - 1 chaves pega uma emprestada por meio do pai: a
	//     chave do pai que fica entre os dois irmãos desce para o filho, e a chave mais próxima
	//     do irmão mais cheio sobe para ocupar o lugar dela. As chaves giram pelo pai para que
	//     a ordem seja preservada. Só quando nenhum irmão pode emprestar é que dois nós se fundem.
	Node refill(Node& parent, std::size_t i, Node child) {
		std::optional<Node> left;
		if (i > 0) {
			left = load(parent.children[i - 1]);
			if (left->keys.size() >= t_) {
				child.keys.insert(child.keys.begin(), parent.keys[i - 1]);
				child.values.insert(child.values.begin(), parent.values[i - 1]);
				parent.keys[i - 1] = left->keys.back();
				parent.values[i - 1] = left->values.back();
				left->keys.pop_back();
				left->values.pop_back();
				if (!child.leaf) {
					child.children.insert(child.children.begin(), left->children.back());
					left->children.pop_back();
				}
				store(*left);
				store(child);
				store(parent);
				return child;
			}
		}
		if (i < parent.keys.size()) {
			Node right = load(parent.children[i + 1]);
			if (right.keys.size() >= t_) {
				child.keys.push_back(parent.keys[i]);
				child.values.push_back(parent.values[i]);
				parent.keys[i] = right.keys.front();
				parent.values[i] = right.values.front();
				right.keys.erase(right.keys.begin());
				right.values.erase(right.values.begin());
				if (!child.leaf) {
					child.children.push_back(right.children.front());
					right.children.erase(right.children.begin());
				}
				store(right);
				store(child);
				store(parent);
				return child;
			}
			merge(parent, i, child, right);
			return child;
		}
		merge(parent, i - 1, *left, child);
		return std::move(*left);
	}

	// EN: The predecessor of a key in an internal node is the last key of the rightmost leaf
	//     of its left subtree. The successor is the first key of the leftmost leaf on the right.
	// PT: O antecessor de uma chave em um nó interno é a última chave da folha mais à direita
	//     da subárvore esquerda. O sucessor é a primeira chave da folha mais à esquerda da direita.
	std::pair<Key, Value> edge_entry(Node node, bool last) {
		while (!node.leaf) {
			node = load(last ? node.children.back() : node.children.front());
		}
		return last ? std::pair{node.keys.back(), node.values.back()}
		            : std::pair{node.keys.front(), node.values.front()};
	}

	std::string check_node(PageId id, std::uint64_t depth, std::optional<Key> low,
	                       std::optional<Key> high, std::uint64_t& keys) {
		const Node node = load(id);
		const std::string where = "page " + std::to_string(id) + ": ";
		const bool is_root = id == root_;
		if (node.keys.size() > max_keys() || (!is_root && node.keys.size() < t_ - 1)) {
			return where + "illegal number of keys (" + std::to_string(node.keys.size()) + ")";
		}
		if (is_root && !node.leaf && node.keys.empty()) {
			return where + "internal root without keys";
		}
		for (std::size_t i = 0; i < node.keys.size(); ++i) {
			const bool ordered = (i == 0 || node.keys[i - 1] < node.keys[i]) &&
			                     (!low || *low < node.keys[i]) && (!high || node.keys[i] < *high);
			if (!ordered) {
				return where + "keys out of order";
			}
		}
		keys += node.keys.size();
		if (node.leaf) {
			return depth == height_ ? "" : where + "leaf at depth " + std::to_string(depth);
		}
		if (node.children.size() != node.keys.size() + 1) {
			return where + "wrong number of children";
		}
		for (std::size_t i = 0; i < node.children.size(); ++i) {
			const std::optional<Key> child_low =
			    i == 0 ? low : std::optional<Key>(node.keys[i - 1]);
			const std::optional<Key> child_high =
			    i == node.keys.size() ? high : std::optional<Key>(node.keys[i]);
			const std::string problem =
			    check_node(node.children[i], depth + 1, child_low, child_high, keys);
			if (!problem.empty()) {
				return problem;
			}
		}
		return "";
	}

	Pager pager_;
	std::size_t t_ = kMaxDegree;
	PageId root_ = 0;
	std::uint64_t count_ = 0;
	std::uint64_t height_ = 0;
	PageId free_head_ = 0;
	bool dirty_ = false;
};

}  // namespace btree
