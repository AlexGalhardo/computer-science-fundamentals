#pragma once

#include <cstddef>
#include <cstdint>
#include <functional>
#include <string>
#include <utility>

namespace trees {

using Key = std::int64_t;

// EN: The observer is called every time the tree changes in a way worth showing: a key was
//     linked, a rotation happened, colours changed. The visualiser uses it to take one picture
//     of the tree per step. Trees work the same with no observer.
// PT: O observador é chamado toda vez que a árvore muda de um jeito que vale mostrar: uma chave
//     foi ligada, houve uma rotação, as cores mudaram. O visualizador o usa para tirar uma foto
//     da árvore por passo. As árvores funcionam igual sem observador.
// ES: El observador se llama cada vez que el árbol cambia de una forma que vale la pena mostrar:
//     se enlazó una clave, hubo una rotación, cambiaron los colores. El visualizador lo usa para
//     tomar una foto del árbol por paso. Los árboles funcionan igual sin observador.
using Observer = std::function<void(const std::string&)>;

// EN: One interface for the three trees. The unbalanced tree, the AVL tree and the red-black
//     tree answer the same questions with the same operations, so the same tests and the same
//     measurements run on all of them. What differs is the shape each one allows.
// PT: Uma interface para as três árvores. A árvore sem balanceamento, a AVL e a rubro-negra
//     respondem às mesmas perguntas com as mesmas operações, então os mesmos testes e as mesmas
//     medições rodam em todas. O que muda é a forma que cada uma permite.
// ES: Una interfaz para los tres árboles. El árbol sin balanceo, el AVL y el rojo-negro
//     responden a las mismas preguntas con las mismas operaciones, así que las mismas pruebas y
//     las mismas mediciones corren en todos. Lo que cambia es la forma que cada uno permite.
class SearchTree {
public:
	virtual ~SearchTree() = default;
	virtual std::string name() const = 0;
	// Returns true when the key is new.
	virtual bool insert(Key key) = 0;
	// Returns true when the key was present.
	virtual bool remove(Key key) = 0;
	virtual bool contains(Key key) const = 0;
	virtual std::size_t size() const = 0;
	// Number of nodes on the longest path from the root to a leaf, 0 for an empty tree.
	virtual std::size_t height() const = 0;
	virtual std::uint64_t rotations() const = 0;
	// Empty text when the invariant of the tree holds, or a description of the problem.
	virtual std::string check() const = 0;
	// The tree as JSON, for the visualiser: {"k": key, "c": colour, "l": left, "r": right}.
	virtual std::string to_json() const = 0;

	void observe(Observer observer) { observer_ = std::move(observer); }

protected:
	void notify(const std::string& what) const {
		if (observer_) {
			observer_(what);
		}
	}

private:
	Observer observer_;
};

}  // namespace trees
