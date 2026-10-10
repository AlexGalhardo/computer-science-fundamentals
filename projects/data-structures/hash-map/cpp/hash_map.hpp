#pragma once

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <optional>
#include <utility>
#include <vector>

namespace hashmap {

using Key = std::uint64_t;
using Value = std::int64_t;
using HashFn = std::uint64_t (*)(Key);

// EN: The hash function scrambles the bits of the key so that keys that look alike (1, 2, 3...)
//     land in unrelated positions. This is the finaliser of SplitMix64. The maps receive the
//     function as a parameter, so a test can pass a deliberately bad one and force collisions.
// PT: A função de espalhamento embaralha os bits da chave para que chaves parecidas (1, 2, 3...)
//     caiam em posições sem relação entre si. Este é o finalizador do SplitMix64. Os mapas
//     recebem a função como parâmetro, então um teste pode passar uma função ruim de propósito
//     e forçar colisões.
// ES: La función de dispersión mezcla los bits de la clave para que claves parecidas (1, 2, 3...)
//     caigan en posiciones sin relación entre sí. Este es el finalizador de SplitMix64. Los mapas
//     reciben la función como parámetro, así que una prueba puede pasar una mala a propósito
//     y forzar colisiones.
inline std::uint64_t mix64(Key x) {
	x ^= x >> 30;
	x *= 0xbf58476d1ce4e5b9ULL;
	x ^= x >> 27;
	x *= 0x94d049bb133111ebULL;
	x ^= x >> 31;
	return x;
}

// EN: Separate chaining. The table is an array of buckets and each bucket is a linked list with
//     every entry whose hash points there. A collision only makes one list longer, so the table
//     keeps working at any load factor, it just gets slower as the lists grow.
// PT: Encadeamento separado. A tabela é um vetor de baldes e cada balde é uma lista encadeada
//     com todas as entradas cujo hash aponta para ele. Uma colisão só deixa uma lista mais
//     longa, então a tabela continua funcionando com qualquer fator de carga, apenas fica mais
//     lenta conforme as listas crescem.
// ES: Encadenamiento separado. La tabla es un vector de cubetas y cada cubeta es una lista enlazada
//     con todas las entradas cuyo hash apunta a ella. Una colisión solo deja una lista más
//     larga, así que la tabla sigue funcionando con cualquier factor de carga, solo se vuelve más
//     lenta a medida que las listas crecen.
class ChainingMap {
public:
	explicit ChainingMap(std::size_t buckets = 8, double max_load = 0.75, HashFn hash = mix64)
	    : buckets_(std::max<std::size_t>(buckets, 1)), max_load_(max_load), hash_(hash) {}

	// EN: Returns true when the key is new and false when an existing value was replaced.
	// PT: Devolve true quando a chave é nova e false quando um valor existente foi trocado.
	// ES: Devuelve true cuando la clave es nueva y false cuando se reemplazó un valor existente.
	bool put(Key key, Value value) {
		for (Node* node = buckets_[index_of(key)].get(); node != nullptr; node = node->next.get()) {
			if (node->key == key) {
				node->value = value;
				return false;
			}
		}
		// EN: The load factor is elements divided by buckets, which is also the average length
		//     of a list. Growing before it passes the limit keeps the lists short.
		// PT: O fator de carga é elementos dividido por baldes, que também é o tamanho médio de
		//     uma lista. Crescer antes de passar do limite mantém as listas curtas.
		// ES: El factor de carga es elementos dividido por cubetas, que también es el tamaño medio
		//     de una lista. Crecer antes de pasar el límite mantiene las listas cortas.
		if (static_cast<double>(size_ + 1) > max_load_ * static_cast<double>(buckets_.size())) {
			resize(buckets_.size() * 2);
		}
		// EN: The new node goes to the head of the list: O(1), no walk to the end.
		// PT: O nó novo entra no início da lista: O(1), sem caminhar até o fim.
		// ES: El nodo nuevo entra al inicio de la lista: O(1), sin caminar hasta el final.
		auto& head = buckets_[index_of(key)];
		head = std::make_unique<Node>(Node{key, value, std::move(head)});
		++size_;
		return true;
	}

	std::optional<Value> get(Key key) const {
		for (const Node* node = buckets_[index_of(key)].get(); node != nullptr;
		     node = node->next.get()) {
			if (node->key == key) {
				return node->value;
			}
		}
		return std::nullopt;
	}

	// EN: `link` points to the pointer that leads to the current node: first the bucket head,
	//     then the `next` field of each node. Unlinking is the same assignment in both cases,
	//     so removing the first node of a list needs no special case.
	// PT: `link` aponta para o ponteiro que leva ao nó atual: primeiro a cabeça do balde,
	//     depois o campo `next` de cada nó. Desligar é a mesma atribuição nos dois casos, então
	//     remover o primeiro nó de uma lista não precisa de caso especial.
	// ES: `link` apunta al puntero que lleva al nodo actual: primero la cabeza de la cubeta,
	//     luego el campo `next` de cada nodo. Desenlazar es la misma asignación en los dos casos,
	//     así que quitar el primer nodo de una lista no necesita un caso especial.
	bool remove(Key key) {
		std::unique_ptr<Node>* link = &buckets_[index_of(key)];
		while (*link != nullptr) {
			if ((*link)->key == key) {
				*link = std::move((*link)->next);
				--size_;
				return true;
			}
			link = &(*link)->next;
		}
		return false;
	}

	std::size_t size() const { return size_; }
	std::size_t capacity() const { return buckets_.size(); }
	double load_factor() const {
		return static_cast<double>(size_) / static_cast<double>(buckets_.size());
	}

private:
	struct Node {
		Key key;
		Value value;
		std::unique_ptr<Node> next;
	};

	std::size_t index_of(Key key) const { return hash_(key) % buckets_.size(); }

	// EN: Rehashing. The bucket of a key is `hash % capacity`, so a new capacity changes the
	//     bucket of almost every key and all nodes have to be moved. It costs O(n), but doubling
	//     makes it rare enough for insertion to stay O(1) amortised.
	// PT: Rehashing. O balde de uma chave é `hash % capacidade`, então uma capacidade nova muda
	//     o balde de quase todas as chaves e todos os nós precisam ser movidos. Custa O(n), mas
	//     dobrar torna isso raro o bastante para a inserção continuar O(1) amortizado.
	// ES: Rehashing. La cubeta de una clave es `hash % capacidad`, así que una capacidad nueva
	//     cambia la cubeta de casi todas las claves y todos los nodos deben moverse. Cuesta O(n),
	//     pero duplicar lo vuelve lo bastante raro para que la inserción siga siendo O(1)
	//     amortizado.
	void resize(std::size_t new_buckets) {
		std::vector<std::unique_ptr<Node>> old = std::move(buckets_);
		buckets_ = std::vector<std::unique_ptr<Node>>(new_buckets);
		for (auto& head : old) {
			while (head != nullptr) {
				std::unique_ptr<Node> node = std::move(head);
				head = std::move(node->next);
				auto& target = buckets_[index_of(node->key)];
				node->next = std::move(target);
				target = std::move(node);
			}
		}
	}

	std::vector<std::unique_ptr<Node>> buckets_;
	std::size_t size_ = 0;
	double max_load_;
	HashFn hash_;
};

// EN: Open addressing with linear probing. Every entry lives in the array itself. When the slot
//     given by the hash is taken, the next one is tried, then the next, wrapping at the end.
//     A search follows the same sequence and stops at the key or at a slot that was never used.
// PT: Endereçamento aberto com sondagem linear. Toda entrada mora no próprio vetor. Quando a
//     posição dada pelo hash está ocupada, tenta-se a seguinte, depois a seguinte, dando a volta
//     no fim. A busca segue a mesma sequência e para na chave ou em uma posição nunca usada.
// ES: Direccionamiento abierto con sondeo lineal. Toda entrada vive en el propio vector. Cuando la
//     posición que da el hash está ocupada, se prueba la siguiente, luego la siguiente, dando la
//     vuelta al final. La búsqueda sigue la misma secuencia y se detiene en la clave o en una
//     posición nunca usada.
class ProbingMap {
public:
	explicit ProbingMap(std::size_t capacity = 8, double max_load = 0.5, HashFn hash = mix64)
	    : slots_(std::max<std::size_t>(capacity, 2)),
	      // EN: At least one slot must stay empty, or a search for a missing key never ends.
	      // PT: Ao menos uma posição precisa ficar vazia, senão a busca por uma chave ausente
	      //     nunca termina.
	      // ES: Al menos una posición debe quedar vacía, o la búsqueda de una clave ausente
	      //     nunca termina.
	      max_load_(std::min(max_load, 0.99)),
	      hash_(hash) {}

	bool put(Key key, Value value) {
		if (static_cast<double>(used_ + 1) > max_load_ * static_cast<double>(slots_.size())) {
			grow();
		}
		std::size_t index = index_of(key);
		std::size_t first_tombstone = kNone;
		while (slots_[index].state != State::Empty) {
			if (slots_[index].state == State::Full && slots_[index].key == key) {
				slots_[index].value = value;
				return false;
			}
			// EN: A tombstone can be reused, but only after the whole probe sequence was
			//     checked: the key may still be stored further ahead.
			// PT: Uma lápide pode ser reaproveitada, mas só depois de conferir a sequência de
			//     sondagem inteira: a chave ainda pode estar guardada mais adiante.
			// ES: Una lápida puede reutilizarse, pero solo después de revisar la secuencia de
			//     sondeo completa: la clave aún puede estar guardada más adelante.
			if (slots_[index].state == State::Tombstone && first_tombstone == kNone) {
				first_tombstone = index;
			}
			index = (index + 1) % slots_.size();
		}
		if (first_tombstone != kNone) {
			index = first_tombstone;
		} else {
			++used_;
		}
		slots_[index] = Slot{key, value, State::Full};
		++size_;
		return true;
	}

	std::optional<Value> get(Key key) const {
		const std::size_t index = find(key);
		if (index == kNone) {
			return std::nullopt;
		}
		return slots_[index].value;
	}

	// EN: Deletion leaves a tombstone instead of an empty slot. An empty slot means "no key ever
	//     probed past here", so emptying it would hide every colliding key stored after it.
	// PT: A remoção deixa uma lápide em vez de uma posição vazia. Posição vazia significa
	//     "nenhuma chave passou por aqui", então esvaziá-la esconderia toda chave que colidiu e
	//     foi guardada depois dela.
	// ES: La eliminación deja una lápida en lugar de una posición vacía. Posición vacía significa
	//     "ninguna clave pasó por aquí", así que vaciarla escondería toda clave que colisionó y
	//     fue guardada después de ella.
	bool remove(Key key) {
		const std::size_t index = find(key);
		if (index == kNone) {
			return false;
		}
		slots_[index].state = State::Tombstone;
		--size_;
		return true;
	}

	std::size_t size() const { return size_; }
	std::size_t capacity() const { return slots_.size(); }
	std::size_t tombstones() const { return used_ - size_; }
	double load_factor() const {
		return static_cast<double>(size_) / static_cast<double>(slots_.size());
	}

private:
	enum class State : std::uint8_t { Empty, Full, Tombstone };
	struct Slot {
		Key key = 0;
		Value value = 0;
		State state = State::Empty;
	};
	static constexpr std::size_t kNone = static_cast<std::size_t>(-1);

	std::size_t index_of(Key key) const { return hash_(key) % slots_.size(); }

	std::size_t find(Key key) const {
		std::size_t index = index_of(key);
		while (slots_[index].state != State::Empty) {
			if (slots_[index].state == State::Full && slots_[index].key == key) {
				return index;
			}
			index = (index + 1) % slots_.size();
		}
		return kNone;
	}

	// EN: Tombstones still lengthen every probe, so they count towards the limit (`used_`).
	//     Rebuilding the table throws them away. The capacity doubles only when live entries
	//     alone justify it, otherwise the rebuild is just a clean-up at the same size.
	// PT: Lápides continuam alongando toda sondagem, então contam para o limite (`used_`).
	//     Reconstruir a tabela joga todas fora. A capacidade só dobra quando as entradas vivas
	//     sozinhas justificam, senão a reconstrução é só uma limpeza no mesmo tamanho.
	// ES: Las lápidas siguen alargando todo sondeo, así que cuentan para el límite (`used_`).
	//     Reconstruir la tabla las descarta todas. La capacidad solo se duplica cuando las entradas
	//     vivas por sí solas lo justifican, si no la reconstrucción es solo una limpieza del mismo
	//     tamaño.
	void grow() {
		const bool crowded =
		    static_cast<double>(size_ + 1) > max_load_ * static_cast<double>(slots_.size()) / 2.0;
		std::vector<Slot> old = std::move(slots_);
		slots_ = std::vector<Slot>(crowded ? old.size() * 2 : old.size());
		size_ = 0;
		used_ = 0;
		for (const Slot& slot : old) {
			if (slot.state == State::Full) {
				put(slot.key, slot.value);
			}
		}
	}

	std::vector<Slot> slots_;
	std::size_t size_ = 0;
	std::size_t used_ = 0;
	double max_load_;
	HashFn hash_;
};

}  // namespace hashmap
