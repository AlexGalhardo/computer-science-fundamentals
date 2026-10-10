#pragma once

#include <cstddef>
#include <cstdint>
#include <fstream>
#include <iterator>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "record_file.hpp"

namespace forg {

inline std::vector<std::uint8_t> read_whole_file(const std::string& path) {
	std::ifstream in(path, std::ios::binary);
	return std::vector<std::uint8_t>((std::istreambuf_iterator<char>(in)),
	                                 std::istreambuf_iterator<char>());
}

inline void write_whole_file(const std::string& path, const std::vector<std::uint8_t>& bytes) {
	std::ofstream out(path, std::ios::binary | std::ios::trunc);
	out.write(reinterpret_cast<const char*>(bytes.data()),
	          static_cast<std::streamsize>(bytes.size()));
	if (!out) {
		throw std::runtime_error("cannot write " + path);
	}
}

// EN: The primary index: fixed-length entries (key, RRN) kept sorted by key, while the data
//     file stays in arrival order. Sorted entries of the same size are what binary search
//     needs, so finding a key among n records costs about log2(n) comparisons in memory and
//     then a single seek in the data file.
// PT: O índice primário: entradas de tamanho fixo (chave, RRN) mantidas em ordem de chave,
//     enquanto o arquivo de dados fica em ordem de chegada. Entradas ordenadas e de mesmo
//     tamanho são o que a busca binária precisa, então achar uma chave entre n registros custa
//     cerca de log2(n) comparações na memória e depois um único seek no arquivo de dados.
// ES: El índice primario: entradas de tamaño fijo (clave, RRN) mantenidas en orden de clave,
//     mientras el archivo de datos queda en orden de llegada. Entradas ordenadas y del mismo
//     tamaño son lo que necesita la búsqueda binaria, así que encontrar una clave entre n
//     registros cuesta unas log2(n) comparaciones en memoria y después un único seek en el
//     archivo de datos.
class PrimaryIndex {
public:
	struct Entry {
		std::uint32_t id;
		std::uint32_t rrn;
	};

	std::optional<std::uint32_t> find(std::uint32_t id) {
		const std::size_t at = lower_bound(id);
		if (at < entries_.size() && entries_[at].id == id) {
			return entries_[at].rrn;
		}
		return std::nullopt;
	}

	bool insert(std::uint32_t id, std::uint32_t rrn) {
		const std::size_t at = lower_bound(id);
		if (at < entries_.size() && entries_[at].id == id) {
			return false;
		}
		entries_.insert(entries_.begin() + static_cast<std::ptrdiff_t>(at), Entry{id, rrn});
		return true;
	}

	bool erase(std::uint32_t id) {
		const std::size_t at = lower_bound(id);
		if (at >= entries_.size() || entries_[at].id != id) {
			return false;
		}
		entries_.erase(entries_.begin() + static_cast<std::ptrdiff_t>(at));
		return true;
	}

	void clear() { entries_.clear(); }
	std::size_t size() const { return entries_.size(); }
	const std::vector<Entry>& entries() const { return entries_; }
	// EN: Entries examined by the last search, and the largest value seen so far.
	// PT: Entradas examinadas pela última busca, e o maior valor visto até agora.
	// ES: Entradas examinadas por la última búsqueda, y el mayor valor visto hasta ahora.
	std::uint32_t last_probes() const { return last_probes_; }
	std::uint32_t max_probes() const { return max_probes_; }

	// EN: Index file: "PIDX", the out-of-date flag, the number of entries, then the entries.
	// PT: Arquivo de índice: "PIDX", o indicador de desatualizado, o número de entradas e as
	// entradas.
	// ES: Archivo de índice: "PIDX", el indicador de desactualizado, el número de entradas y las
	// entradas.
	std::vector<std::uint8_t> to_bytes(bool stale) const {
		std::vector<std::uint8_t> bytes(12 + entries_.size() * 8);
		bytes[0] = 'P';
		bytes[1] = 'I';
		bytes[2] = 'D';
		bytes[3] = 'X';
		put_u32(&bytes[4], stale ? 1 : 0);
		put_u32(&bytes[8], static_cast<std::uint32_t>(entries_.size()));
		for (std::size_t i = 0; i < entries_.size(); ++i) {
			put_u32(&bytes[12 + i * 8], entries_[i].id);
			put_u32(&bytes[16 + i * 8], entries_[i].rrn);
		}
		return bytes;
	}

	// EN: Returns false when the file is missing, damaged or flagged as out of date. In all
	//     three cases the caller rebuilds the index from the data file.
	// PT: Devolve false quando o arquivo não existe, está danificado ou está marcado como
	//     desatualizado. Nos três casos quem chamou reconstrói o índice a partir dos dados.
	// ES: Devuelve false cuando el archivo no existe, está dañado o está marcado como
	//     desactualizado. En los tres casos quien llamó reconstruye el índice a partir de los
	//     datos.
	bool from_bytes(const std::vector<std::uint8_t>& bytes) {
		entries_.clear();
		if (bytes.size() < 12 || bytes[0] != 'P' || bytes[1] != 'I' || bytes[2] != 'D' ||
		    bytes[3] != 'X' || get_u32(&bytes[4]) != 0) {
			return false;
		}
		const std::uint32_t count = get_u32(&bytes[8]);
		if (bytes.size() != 12 + static_cast<std::size_t>(count) * 8) {
			return false;
		}
		for (std::uint32_t i = 0; i < count; ++i) {
			entries_.push_back(Entry{get_u32(&bytes[12 + i * 8]), get_u32(&bytes[16 + i * 8])});
		}
		return true;
	}

private:
	// EN: Binary search written by hand so that the probes can be counted: each step compares
	//     with the middle entry and throws away half of what is left.
	// PT: Busca binária escrita à mão para que as sondagens possam ser contadas: cada passo
	//     compara com a entrada do meio e descarta metade do que resta.
	// ES: Búsqueda binaria escrita a mano para que los sondeos puedan contarse: cada paso
	//     compara con la entrada del medio y descarta la mitad de lo que queda.
	std::size_t lower_bound(std::uint32_t id) {
		std::size_t low = 0;
		std::size_t high = entries_.size();
		last_probes_ = 0;
		while (low < high) {
			const std::size_t middle = low + (high - low) / 2;
			++last_probes_;
			if (entries_[middle].id < id) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}
		if (last_probes_ > max_probes_) {
			max_probes_ = last_probes_;
		}
		return low;
	}

	std::vector<Entry> entries_;
	std::uint32_t last_probes_ = 0;
	std::uint32_t max_probes_ = 0;
};

// EN: A secondary index with inverted lists. The key table has one entry per secondary key
//     (a city, a year), with the position of the first node of a linked list. The nodes live
//     in a second file, each one holding a PRIMARY KEY and the position of the next node. The
//     index stores primary keys, not addresses (late binding): when a record moves or is
//     deleted, only the primary index changes. Each list is kept in increasing order of
//     primary key, so that two lists can be matched in a single pass.
// PT: Um índice secundário com listas invertidas. A tabela de chaves tem uma entrada por chave
//     secundária (uma cidade, um ano), com a posição do primeiro nó de uma lista encadeada. Os
//     nós ficam em um segundo arquivo, cada um com uma CHAVE PRIMÁRIA e a posição do próximo
//     nó. O índice guarda chaves primárias, e não endereços (ligação tardia): quando um
//     registro muda de lugar ou é removido, só o índice primário muda. Cada lista é mantida em
//     ordem crescente de chave primária, para que duas listas sejam combinadas em uma passada.
// ES: Un índice secundario con listas invertidas. La tabla de claves tiene una entrada por
//     clave secundaria (una ciudad, un año), con la posición del primer nodo de una lista
//     enlazada. Los nodos quedan en un segundo archivo, cada uno con una CLAVE PRIMARIA y la
//     posición del siguiente nodo. El índice guarda claves primarias, y no direcciones (enlace
//     tardío): cuando un registro cambia de lugar o se elimina, solo cambia el índice primario.
//     Cada lista se mantiene en orden creciente de clave primaria, para que dos listas puedan
//     combinarse en una pasada.
class SecondaryIndex {
public:
	struct Node {
		std::uint32_t id;
		std::int32_t next;
	};

	void add(const std::string& key, std::uint32_t id) {
		std::size_t at = 0;
		while (at < keys_.size() && keys_[at].first < key) {
			++at;
		}
		if (at == keys_.size() || keys_[at].first != key) {
			keys_.insert(keys_.begin() + static_cast<std::ptrdiff_t>(at), {key, kNoSlot});
		}
		// EN: Walk the list to the insertion point. The new node is appended to the list file
		//     and two links change. Nothing is shifted, whatever the length of the list.
		// PT: Percorre a lista até o ponto de inserção. O nó novo vai para o fim do arquivo de
		//     listas e dois elos mudam. Nada é deslocado, qualquer que seja o tamanho da lista.
		// ES: Recorre la lista hasta el punto de inserción. El nodo nuevo va al final del archivo
		//     de listas y cambian dos enlaces. Nada se desplaza, sea cual sea el tamaño de la
		//     lista.
		std::int32_t previous = kNoSlot;
		std::int32_t current = keys_[at].second;
		while (current != kNoSlot && nodes_[static_cast<std::size_t>(current)].id < id) {
			previous = current;
			current = nodes_[static_cast<std::size_t>(current)].next;
		}
		if (current != kNoSlot && nodes_[static_cast<std::size_t>(current)].id == id) {
			return;
		}
		const auto added = static_cast<std::int32_t>(nodes_.size());
		nodes_.push_back(Node{id, current});
		if (previous == kNoSlot) {
			keys_[at].second = added;
		} else {
			nodes_[static_cast<std::size_t>(previous)].next = added;
		}
	}

	std::vector<std::uint32_t> ids(const std::string& key) const {
		std::vector<std::uint32_t> found;
		for (const auto& [name, head] : keys_) {
			if (name == key) {
				for (std::int32_t at = head; at != kNoSlot;
				     at = nodes_[static_cast<std::size_t>(at)].next) {
					found.push_back(nodes_[static_cast<std::size_t>(at)].id);
				}
			}
		}
		return found;
	}

	void clear() {
		keys_.clear();
		nodes_.clear();
	}
	std::size_t key_count() const { return keys_.size(); }
	std::size_t node_count() const { return nodes_.size(); }

	// EN: Key table file: count, then entries of 24 bytes (key padded to 20 bytes, head).
	// PT: Arquivo da tabela de chaves: quantidade e entradas de 24 bytes (chave em 20 bytes,
	// cabeça).
	// ES: Archivo de la tabla de claves: cantidad y entradas de 24 bytes (clave en 20 bytes,
	// cabeza).
	std::vector<std::uint8_t> keys_to_bytes() const {
		std::vector<std::uint8_t> bytes(4 + keys_.size() * 24, ' ');
		put_u32(&bytes[0], static_cast<std::uint32_t>(keys_.size()));
		for (std::size_t i = 0; i < keys_.size(); ++i) {
			const std::string& key = keys_[i].first;
			for (std::size_t j = 0; j < key.size() && j < kCitySize; ++j) {
				bytes[4 + i * 24 + j] = static_cast<std::uint8_t>(key[j]);
			}
			put_u32(&bytes[4 + i * 24 + 20], static_cast<std::uint32_t>(keys_[i].second));
		}
		return bytes;
	}

	// EN: List file: count, then nodes of 8 bytes (primary key, next).
	// PT: Arquivo de listas: quantidade e nós de 8 bytes (chave primária, próximo).
	// ES: Archivo de listas: cantidad y nodos de 8 bytes (clave primaria, siguiente).
	std::vector<std::uint8_t> nodes_to_bytes() const {
		std::vector<std::uint8_t> bytes(4 + nodes_.size() * 8);
		put_u32(&bytes[0], static_cast<std::uint32_t>(nodes_.size()));
		for (std::size_t i = 0; i < nodes_.size(); ++i) {
			put_u32(&bytes[4 + i * 8], nodes_[i].id);
			put_u32(&bytes[8 + i * 8], static_cast<std::uint32_t>(nodes_[i].next));
		}
		return bytes;
	}

	bool from_bytes(const std::vector<std::uint8_t>& keys, const std::vector<std::uint8_t>& nodes) {
		clear();
		if (keys.size() < 4 || nodes.size() < 4) {
			return false;
		}
		const std::uint32_t key_count = get_u32(&keys[0]);
		const std::uint32_t node_count = get_u32(&nodes[0]);
		if (keys.size() != 4 + static_cast<std::size_t>(key_count) * 24 ||
		    nodes.size() != 4 + static_cast<std::size_t>(node_count) * 8) {
			return false;
		}
		for (std::uint32_t i = 0; i < key_count; ++i) {
			keys_.emplace_back(trimmed(&keys[4 + i * 24], kCitySize),
			                   static_cast<std::int32_t>(get_u32(&keys[4 + i * 24 + 20])));
		}
		for (std::uint32_t i = 0; i < node_count; ++i) {
			nodes_.push_back(Node{get_u32(&nodes[4 + i * 8]),
			                      static_cast<std::int32_t>(get_u32(&nodes[8 + i * 8]))});
		}
		return true;
	}

private:
	std::vector<std::pair<std::string, std::int32_t>> keys_;
	std::vector<Node> nodes_;
};

// EN: Cosequential matching: two lists sorted by the same key are walked together, always
//     advancing the one with the smaller current item. Equal items belong to both lists. One
//     pass over each list is enough, with no searching.
// PT: Matching cossequencial: duas listas ordenadas pela mesma chave são percorridas juntas,
//     avançando sempre a que tem o menor item atual. Itens iguais pertencem às duas listas.
//     Basta uma passada em cada lista, sem nenhuma busca.
// ES: Matching cosecuencial: dos listas ordenadas por la misma clave se recorren juntas,
//     avanzando siempre la que tiene el menor elemento actual. Los elementos iguales pertenecen
//     a las dos listas. Basta una pasada por cada lista, sin ninguna búsqueda.
inline std::vector<std::uint32_t> match(const std::vector<std::uint32_t>& left,
                                        const std::vector<std::uint32_t>& right) {
	std::vector<std::uint32_t> both;
	std::size_t i = 0;
	std::size_t j = 0;
	while (i < left.size() && j < right.size()) {
		if (left[i] < right[j]) {
			++i;
		} else if (right[j] < left[i]) {
			++j;
		} else {
			both.push_back(left[i]);
			++i;
			++j;
		}
	}
	return both;
}

}  // namespace forg
