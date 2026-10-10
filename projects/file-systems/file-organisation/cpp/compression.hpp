#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <queue>
#include <stdexcept>
#include <utility>
#include <vector>

#include "record_file.hpp"

namespace forg {

using Bytes = std::vector<std::uint8_t>;

inline constexpr std::uint8_t kRunMarker = 0xFF;
inline constexpr std::size_t kMinRun = 4;

// EN: Run-length encoding. A run of 4 or more equal bytes becomes 3 bytes: the marker 0xFF,
//     the value and the count (up to 255). Shorter runs are copied as they are, because the
//     code would be longer than the run. A data byte equal to the marker is always written as
//     a run, even of length 1, so the decoder can never mistake it for a marker. Fixed-length
//     records are full of padding, which is exactly the kind of data this method shrinks.
// PT: Codificação run-length. Uma sequência de 4 ou mais bytes iguais vira 3 bytes: o marcador
//     0xFF, o valor e a contagem (até 255). Sequências menores são copiadas como estão, porque
//     o código seria maior que a sequência. Um byte de dado igual ao marcador é sempre gravado
//     como sequência, mesmo de tamanho 1, para o decodificador nunca confundi-lo com um
//     marcador. Registros de tamanho fixo são cheios de preenchimento, que é exatamente o tipo
//     de dado que este método encolhe.
// ES: Codificación run-length. Una secuencia de 4 o más bytes iguales se convierte en 3 bytes:
//     el marcador 0xFF, el valor y la cuenta (hasta 255). Las secuencias menores se copian tal
//     cual, porque el código sería mayor que la secuencia. Un byte de dato igual al marcador se
//     escribe siempre como secuencia, incluso de longitud 1, para que el decodificador nunca lo
//     confunda con un marcador. Los registros de tamaño fijo están llenos de relleno, que es
//     exactamente el tipo de dato que este método encoge.
inline Bytes rle_encode(const Bytes& input) {
	Bytes output;
	std::size_t at = 0;
	while (at < input.size()) {
		const std::uint8_t value = input[at];
		std::size_t run = 1;
		while (at + run < input.size() && input[at + run] == value && run < 255) {
			++run;
		}
		if (run >= kMinRun || value == kRunMarker) {
			output.push_back(kRunMarker);
			output.push_back(value);
			output.push_back(static_cast<std::uint8_t>(run));
		} else {
			output.insert(output.end(), run, value);
		}
		at += run;
	}
	return output;
}

inline Bytes rle_decode(const Bytes& input) {
	Bytes output;
	std::size_t at = 0;
	while (at < input.size()) {
		if (input[at] != kRunMarker) {
			output.push_back(input[at]);
			++at;
			continue;
		}
		if (at + 2 >= input.size()) {
			throw std::runtime_error("truncated run-length data");
		}
		output.insert(output.end(), input[at + 2], input[at + 1]);
		at += 3;
	}
	return output;
}

// EN: The Huffman tree. Leaves 0 to 255 are the byte values, and internal nodes get the
//     numbers 256, 257 and so on, in the order they are created. The two nodes of lowest
//     frequency are joined again and again until one tree is left, so frequent bytes end up
//     near the root with short codes. Ties are broken by node number, which makes the C++ and
//     the Rust programs build the same tree and write the same bytes.
// PT: A árvore de Huffman. As folhas 0 a 255 são os valores de byte, e os nós internos recebem
//     os números 256, 257 e assim por diante, na ordem em que são criados. Os dois nós de
//     menor frequência são unidos repetidamente até sobrar uma árvore, então os bytes
//     frequentes ficam perto da raiz, com códigos curtos. Os empates são decididos pelo número
//     do nó, o que faz os programas em C++ e em Rust montarem a mesma árvore e gravarem os
//     mesmos bytes.
// ES: El árbol de Huffman. Las hojas 0 a 255 son los valores de byte, y los nodos internos
//     reciben los números 256, 257 y así sucesivamente, en el orden en que se crean. Los dos
//     nodos de menor frecuencia se unen repetidamente hasta que queda un árbol, así que los
//     bytes frecuentes quedan cerca de la raíz, con códigos cortos. Los empates los decide el
//     número del nodo, lo que hace que los programas en C++ y en Rust armen el mismo árbol y
//     escriban los mismos bytes.
struct HuffmanTree {
	// -1 when the input is empty.
	int root = -1;
	std::vector<std::pair<int, int>> children;

	bool is_leaf(int node) const { return node < 256; }
	int left(int node) const { return children[static_cast<std::size_t>(node - 256)].first; }
	int right(int node) const { return children[static_cast<std::size_t>(node - 256)].second; }
};

inline HuffmanTree build_tree(const std::array<std::uint32_t, 256>& frequency) {
	using Item = std::pair<std::uint64_t, int>;
	std::priority_queue<Item, std::vector<Item>, std::greater<Item>> queue;
	for (int symbol = 0; symbol < 256; ++symbol) {
		if (frequency[static_cast<std::size_t>(symbol)] > 0) {
			queue.emplace(frequency[static_cast<std::size_t>(symbol)], symbol);
		}
	}
	HuffmanTree tree;
	while (queue.size() > 1) {
		const Item first = queue.top();
		queue.pop();
		const Item second = queue.top();
		queue.pop();
		const int node = 256 + static_cast<int>(tree.children.size());
		tree.children.emplace_back(first.second, second.second);
		queue.emplace(first.first + second.first, node);
	}
	if (!queue.empty()) {
		tree.root = queue.top().second;
	}
	return tree;
}

// EN: The code of a byte is the path from the root to its leaf: 0 for left, 1 for right. No
//     code is the beginning of another one, because symbols are only at the leaves. A file
//     with a single distinct byte has a tree with one node, and that byte gets the code "0".
// PT: O código de um byte é o caminho da raiz até a sua folha: 0 para a esquerda, 1 para a
//     direita. Nenhum código é o começo de outro, porque os símbolos só ficam nas folhas. Um
//     arquivo com um único byte distinto tem uma árvore de um nó, e esse byte recebe o código "0".
// ES: El código de un byte es el camino desde la raíz hasta su hoja: 0 a la izquierda, 1 a la
//     derecha. Ningún código es el comienzo de otro, porque los símbolos solo están en las
//     hojas. Un archivo con un único byte distinto tiene un árbol de un nodo, y ese byte recibe
//     el código "0".
inline std::array<std::vector<std::uint8_t>, 256> code_table(const HuffmanTree& tree) {
	std::array<std::vector<std::uint8_t>, 256> codes;
	if (tree.root < 0) {
		return codes;
	}
	if (tree.is_leaf(tree.root)) {
		codes[static_cast<std::size_t>(tree.root)] = {0};
		return codes;
	}
	std::vector<std::pair<int, std::vector<std::uint8_t>>> stack;
	stack.emplace_back(tree.root, std::vector<std::uint8_t>{});
	while (!stack.empty()) {
		auto [node, path] = std::move(stack.back());
		stack.pop_back();
		if (tree.is_leaf(node)) {
			codes[static_cast<std::size_t>(node)] = std::move(path);
			continue;
		}
		std::vector<std::uint8_t> right_path = path;
		right_path.push_back(1);
		path.push_back(0);
		stack.emplace_back(tree.left(node), std::move(path));
		stack.emplace_back(tree.right(node), std::move(right_path));
	}
	return codes;
}

inline constexpr std::size_t kHuffmanHeader = 8 + 256 * 4;

// EN: Compressed format: the original length (8 bytes), the 256 frequencies (4 bytes each) and
//     then the codes, packed from the most significant bit of each byte. The decoder rebuilds
//     the same tree from the frequencies, so the code table itself is not stored. The 1,032
//     bytes of header are why Huffman coding does not pay for very small files.
// PT: Formato comprimido: o tamanho original (8 bytes), as 256 frequências (4 bytes cada) e
//     depois os códigos, empacotados a partir do bit mais significativo de cada byte. O
//     decodificador refaz a mesma árvore a partir das frequências, então a tabela de códigos
//     não é gravada. Os 1.032 bytes de cabeçalho são o motivo de Huffman não compensar em
//     arquivos muito pequenos.
// ES: Formato comprimido: el tamaño original (8 bytes), las 256 frecuencias (4 bytes cada una) y
//     después los códigos, empaquetados desde el bit más significativo de cada byte. El
//     decodificador rehace el mismo árbol a partir de las frecuencias, así que la tabla de
//     códigos no se escribe. Los 1.032 bytes de cabecera son la razón de que Huffman no
//     compense en archivos muy pequeños.
inline Bytes huffman_encode(const Bytes& input) {
	if (input.size() > 0xFFFFFFFFu) {
		throw std::invalid_argument("input too large for 32-bit frequencies");
	}
	std::array<std::uint32_t, 256> frequency{};
	for (const std::uint8_t byte : input) {
		++frequency[byte];
	}
	const auto codes = code_table(build_tree(frequency));
	Bytes output(kHuffmanHeader, 0);
	put_u32(&output[0], static_cast<std::uint32_t>(input.size()));
	for (std::size_t symbol = 0; symbol < 256; ++symbol) {
		put_u32(&output[8 + symbol * 4], frequency[symbol]);
	}
	std::uint8_t pending = 0;
	int used = 0;
	for (const std::uint8_t byte : input) {
		for (const std::uint8_t bit : codes[byte]) {
			pending = static_cast<std::uint8_t>((pending << 1) | bit);
			if (++used == 8) {
				output.push_back(pending);
				pending = 0;
				used = 0;
			}
		}
	}
	if (used > 0) {
		output.push_back(static_cast<std::uint8_t>(pending << (8 - used)));
	}
	return output;
}

inline Bytes huffman_decode(const Bytes& input) {
	if (input.size() < kHuffmanHeader) {
		throw std::runtime_error("truncated Huffman data");
	}
	const std::uint64_t length = get_u32(&input[0]) | (std::uint64_t{get_u32(&input[4])} << 32);
	std::array<std::uint32_t, 256> frequency{};
	for (std::size_t symbol = 0; symbol < 256; ++symbol) {
		frequency[symbol] = get_u32(&input[8 + symbol * 4]);
	}
	const HuffmanTree tree = build_tree(frequency);
	if (tree.root < 0 && length > 0) {
		throw std::runtime_error("truncated Huffman data");
	}
	Bytes output;
	output.reserve(length);
	std::size_t at = kHuffmanHeader;
	int bit = 7;
	// EN: Decoding walks down the tree one bit at a time and emits a byte at each leaf. The
	//     stored length says when to stop, since the last byte may carry padding bits.
	// PT: A decodificação desce a árvore um bit por vez e emite um byte a cada folha. O tamanho
	//     gravado diz quando parar, pois o último byte pode ter bits de preenchimento.
	// ES: La decodificación desciende el árbol un bit a la vez y emite un byte en cada hoja. El
	//     tamaño escrito dice cuándo parar, pues el último byte puede tener bits de relleno.
	while (output.size() < length) {
		int node = tree.root;
		do {
			if (at >= input.size()) {
				throw std::runtime_error("truncated Huffman data");
			}
			const int value = (input[at] >> bit) & 1;
			if (--bit < 0) {
				bit = 7;
				++at;
			}
			if (!tree.is_leaf(node)) {
				node = value == 0 ? tree.left(node) : tree.right(node);
			}
		} while (!tree.is_leaf(node));
		output.push_back(static_cast<std::uint8_t>(node));
	}
	return output;
}

}  // namespace forg
