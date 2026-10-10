// EN: Memory workload. `binary-trees` builds and throws away a huge number of small tree nodes:
//     one tree of depth n+1, one long-lived tree of depth n kept until the end, and many
//     short-lived trees of every even depth from 4 to n. The checksum is the total number of
//     nodes visited. `idle` does nothing: its time is the start-up cost of the runtime and its
//     memory is the baseline every program in this language pays.
//     C++ model: manual memory management with ownership. Each node owns its children through
//     std::unique_ptr, so a tree is freed, node by node, at the exact moment its root goes out
//     of scope. There is no collector and no pause, but every node is a call to the allocator.
// PT: Carga de memória. O `binary-trees` constrói e descarta um número enorme de pequenos nós
//     de árvore: uma árvore de profundidade n+1, uma árvore de vida longa de profundidade n
//     mantida até o fim, e muitas árvores de vida curta de cada profundidade par de 4 a n. O
//     checksum é o total de nós visitados. O `idle` não faz nada: seu tempo é o custo de
//     inicialização do runtime e sua memória é a base que todo programa nessa linguagem paga.
//     Modelo do C++: gerência manual de memória com posse. Cada nó é dono dos filhos por
//     std::unique_ptr, então uma árvore é liberada, nó a nó, no momento exato em que a raiz sai
//     de escopo. Não há coletor nem pausa, mas cada nó é uma chamada ao alocador.
// ES: Carga de memoria. `binary-trees` construye y descarta un número enorme de pequeños nodos
//     de árbol: un árbol de profundidad n+1, un árbol de vida larga de profundidad n
//     mantenido hasta el final, y muchos árboles de vida corta de cada profundidad par de 4 a n. El
//     checksum es el total de nodos visitados. `idle` no hace nada: su tiempo es el costo de
//     inicialización del runtime y su memoria es la base que paga todo programa en ese lenguaje.
//     Modelo de C++: gestión manual de memoria con propiedad. Cada nodo es dueño de sus hijos
//     mediante std::unique_ptr, así que un árbol se libera, nodo a nodo, en el momento exacto en
//     que la raíz sale de alcance. No hay recolector ni pausa, pero cada nodo es una llamada al
//     asignador.

#include <sys/resource.h>

#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <memory>
#include <string>

namespace {

struct Node {
	std::unique_ptr<Node> left;
	std::unique_ptr<Node> right;
};

std::unique_ptr<Node> make(int depth) {
	auto node = std::make_unique<Node>();
	if (depth > 0) {
		node->left = make(depth - 1);
		node->right = make(depth - 1);
	}
	return node;
}

// EN: Walks the whole tree and counts its nodes, which forces every node to be read.
// PT: Percorre a árvore inteira e conta os nós, o que obriga a ler cada nó.
// ES: Recorre el árbol completo y cuenta los nodos, lo que obliga a leer cada nodo.
long check(const Node& node) { return node.left ? 1 + check(*node.left) + check(*node.right) : 1; }

long binary_trees(int n) {
	const int min_depth = 4;
	const int max_depth = std::max(min_depth + 2, n);
	long total = check(*make(max_depth + 1));
	const std::unique_ptr<Node> long_lived = make(max_depth);
	for (int depth = min_depth; depth <= max_depth; depth += 2) {
		const long iterations = 1L << (max_depth - depth + min_depth);
		for (long i = 0; i < iterations; i++) {
			total += check(*make(depth));
		}
	}
	return total + check(*long_lived);
}

}  // namespace

int main(int argc, char** argv) {
	const std::string implementation = argc > 1 ? argv[1] : "binary-trees";
	const int n = argc > 2 ? std::atoi(argv[2]) : 10;

	const auto start = std::chrono::steady_clock::now();
	const std::string checksum =
	    implementation == "idle" ? "idle" : std::to_string(binary_trees(n));
	const std::chrono::duration<double, std::milli> elapsed =
	    std::chrono::steady_clock::now() - start;

	rusage usage{};
	getrusage(RUSAGE_SELF, &usage);
	std::printf(
	    "{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%ld,\"language\":\"cpp\",\"implementation\":\"%"
	    "s\",\"checksum\":\"%s\"}\n",
	    n, elapsed.count(), usage.ru_maxrss, implementation.c_str(), checksum.c_str());
	return 0;
}
