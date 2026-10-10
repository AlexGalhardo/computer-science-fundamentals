#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <optional>
#include <stdexcept>
#include <string>
#include <vector>

namespace forg {

// EN: Integers are stored in little-endian order at fixed offsets. A file written by copying
//     integers straight from memory would depend on the machine. With a fixed byte order, the
//     C++ and the Rust programs of this mini-project read and write exactly the same file.
// PT: Os inteiros são guardados em ordem little-endian em posições fixas. Um arquivo gravado
//     copiando inteiros direto da memória dependeria da máquina. Com a ordem dos bytes fixa, os
//     programas em C++ e em Rust deste mini-projeto leem e gravam exatamente o mesmo arquivo.
// ES: Los enteros se guardan en orden little-endian en posiciones fijas. Un archivo escrito
//     copiando enteros directo desde la memoria dependería de la máquina. Con el orden de los
//     bytes fijo, los programas en C++ y en Rust de este mini-proyecto leen y escriben
//     exactamente el mismo archivo.
inline void put_u32(std::uint8_t* at, std::uint32_t value) {
	for (int i = 0; i < 4; ++i) {
		at[i] = static_cast<std::uint8_t>(value >> (8 * i));
	}
}

inline std::uint32_t get_u32(const std::uint8_t* at) {
	std::uint32_t value = 0;
	for (int i = 0; i < 4; ++i) {
		value |= static_cast<std::uint32_t>(at[i]) << (8 * i);
	}
	return value;
}

inline constexpr std::uint32_t kHeaderSize = 32;
inline constexpr std::uint32_t kRecordSize = 64;
inline constexpr std::int32_t kNoSlot = -1;
inline constexpr std::uint8_t kLiveTag = 0x01;
inline constexpr std::uint8_t kDeletedTag = '*';
inline constexpr std::size_t kCitySize = 20;
inline constexpr std::size_t kNameSize = 37;

struct Record {
	std::uint32_t id = 0;
	std::uint16_t year = 0;
	std::string city;
	std::string name;

	bool operator==(const Record&) const = default;
};

using Slot = std::array<std::uint8_t, kRecordSize>;

// EN: A fixed-length record: every field has its own fixed position inside the 64 bytes, and
//     text shorter than its field is padded with spaces. The padding is wasted space (internal
//     fragmentation), and it is the price of being able to compute where any record starts.
//     Layout: tag (1 byte), id (4), year (2), city (20), name (37).
// PT: Um registro de tamanho fixo: cada campo tem a sua posição fixa dentro dos 64 bytes, e o
//     texto menor que o campo é completado com espaços. O preenchimento é espaço desperdiçado
//     (fragmentação interna), e é o preço de poder calcular onde qualquer registro começa.
//     Layout: marca (1 byte), id (4), ano (2), cidade (20), nome (37).
// ES: Un registro de tamaño fijo: cada campo tiene su posición fija dentro de los 64 bytes, y el
//     texto menor que el campo se completa con espacios. El relleno es espacio desperdiciado
//     (fragmentación interna), y es el precio de poder calcular dónde empieza cualquier
//     registro. Layout: marca (1 byte), id (4), año (2), ciudad (20), nombre (37).
inline Slot encode(const Record& record) {
	if (record.city.size() > kCitySize || record.name.size() > kNameSize) {
		throw std::invalid_argument("a field is longer than its fixed size");
	}
	Slot slot;
	slot.fill(' ');
	slot[0] = kLiveTag;
	put_u32(&slot[1], record.id);
	slot[5] = static_cast<std::uint8_t>(record.year & 0xFF);
	slot[6] = static_cast<std::uint8_t>(record.year >> 8);
	for (std::size_t i = 0; i < record.city.size(); ++i) {
		slot[7 + i] = static_cast<std::uint8_t>(record.city[i]);
	}
	for (std::size_t i = 0; i < record.name.size(); ++i) {
		slot[27 + i] = static_cast<std::uint8_t>(record.name[i]);
	}
	return slot;
}

inline std::string trimmed(const std::uint8_t* at, std::size_t size) {
	while (size > 0 && at[size - 1] == ' ') {
		--size;
	}
	return std::string(reinterpret_cast<const char*>(at), size);
}

inline Record decode(const Slot& slot) {
	Record record;
	record.id = get_u32(&slot[1]);
	record.year = static_cast<std::uint16_t>(slot[5] | (slot[6] << 8));
	record.city = trimmed(&slot[7], kCitySize);
	record.name = trimmed(&slot[27], kNameSize);
	return record;
}

// EN: The data file: a header record of 32 bytes followed by slots of 64 bytes. The header
//     makes the file describe itself: it holds the record size, how many slots the file has,
//     how many of them are live, and the head of the free list. Because every slot has the
//     same size, the slot with relative record number (RRN) n starts at byte 32 + n x 64, so
//     one seek reaches any record. RRNs start at zero.
// PT: O arquivo de dados: um registro de cabeçalho de 32 bytes seguido de espaços (slots) de
//     64 bytes. O cabeçalho faz o arquivo se descrever: guarda o tamanho do registro, quantos
//     slots o arquivo tem, quantos estão em uso e a cabeça da lista de livres. Como todo slot
//     tem o mesmo tamanho, o slot de número relativo (RRN) n começa no byte 32 + n x 64, então
//     um único seek alcança qualquer registro. Os RRNs começam em zero.
// ES: El archivo de datos: un registro de cabecera de 32 bytes seguido de espacios (slots) de 64
//     bytes. La cabecera hace que el archivo se describa a sí mismo: guarda el tamaño del
//     registro, cuántos slots tiene el archivo, cuántos están en uso y la cabeza de la lista de
//     libres. Como todo slot tiene el mismo tamaño, el slot de número relativo (RRN) n empieza
//     en el byte 32 + n x 64, así que un único seek alcanza cualquier registro. Los RRN
//     empiezan en cero.
class RecordFile {
public:
	static RecordFile create(const std::string& path) {
		{
			std::ofstream fresh(path, std::ios::binary | std::ios::trunc);
			if (!fresh) {
				throw std::runtime_error("cannot create " + path);
			}
		}
		RecordFile file(path);
		file.write_header();
		return file;
	}

	static RecordFile open(const std::string& path) {
		RecordFile file(path);
		std::array<std::uint8_t, kHeaderSize> header{};
		file.stream_.seekg(0);
		file.stream_.read(reinterpret_cast<char*>(header.data()), kHeaderSize);
		if (!file.stream_ || header[0] != 'F' || header[1] != 'O' || header[2] != 'R' ||
		    header[3] != 'G' || get_u32(&header[8]) != kRecordSize) {
			throw std::runtime_error(path + " is not a record file of this format");
		}
		file.slot_count_ = get_u32(&header[12]);
		file.live_count_ = get_u32(&header[16]);
		file.free_head_ = static_cast<std::int32_t>(get_u32(&header[20]));
		return file;
	}

	static std::uint64_t offset_of(std::uint32_t rrn) {
		return kHeaderSize + static_cast<std::uint64_t>(rrn) * kRecordSize;
	}

	// EN: Insertion reuses a deleted slot when there is one. The free list is a stack kept
	//     inside the file: the header points to the last slot deleted, and each deleted slot
	//     stores the RRN of the one deleted before it. Popping the top costs one read and two
	//     writes, and the file only grows when the stack is empty.
	// PT: A inserção reaproveita um slot removido quando existe um. A lista de livres é uma
	//     pilha guardada dentro do arquivo: o cabeçalho aponta para o último slot removido, e
	//     cada slot removido guarda o RRN do que foi removido antes dele. Desempilhar o topo
	//     custa uma leitura e duas gravações, e o arquivo só cresce quando a pilha está vazia.
	// ES: La inserción reutiliza un slot eliminado cuando existe uno. La lista de libres es una
	//     pila guardada dentro del archivo: la cabecera apunta al último slot eliminado, y cada
	//     slot eliminado guarda el RRN del que se eliminó antes que él. Desapilar la cima cuesta
	//     una lectura y dos escrituras, y el archivo solo crece cuando la pila está vacía.
	std::uint32_t insert(const Record& record) {
		std::uint32_t rrn = slot_count_;
		if (free_head_ != kNoSlot) {
			rrn = static_cast<std::uint32_t>(free_head_);
			const Slot top = read_slot(rrn);
			free_head_ = static_cast<std::int32_t>(get_u32(&top[1]));
		} else {
			++slot_count_;
		}
		write_slot(rrn, encode(record));
		++live_count_;
		write_header();
		return rrn;
	}

	std::optional<Record> read(std::uint32_t rrn) {
		if (rrn >= slot_count_) {
			return std::nullopt;
		}
		const Slot slot = read_slot(rrn);
		if (slot[0] != kLiveTag) {
			return std::nullopt;
		}
		return decode(slot);
	}

	// EN: Deletion does not move anything. It marks the slot with '*', writes the old head of
	//     the free list in it and makes the header point to this slot (a push). The file keeps
	//     its size, and the space comes back on the next insertion.
	// PT: A remoção não move nada. Ela marca o slot com '*', grava nele a cabeça antiga da lista
	//     de livres e faz o cabeçalho apontar para esse slot (um push). O arquivo mantém o
	//     tamanho, e o espaço volta na próxima inserção.
	// ES: La eliminación no mueve nada. Marca el slot con '*', escribe en él la cabeza antigua de
	//     la lista de libres y hace que la cabecera apunte a ese slot (un push). El archivo
	//     mantiene su tamaño, y el espacio vuelve en la próxima inserción.
	bool remove(std::uint32_t rrn) {
		if (rrn >= slot_count_) {
			return false;
		}
		Slot slot = read_slot(rrn);
		if (slot[0] != kLiveTag) {
			return false;
		}
		slot[0] = kDeletedTag;
		put_u32(&slot[1], static_cast<std::uint32_t>(free_head_));
		write_slot(rrn, slot);
		free_head_ = static_cast<std::int32_t>(rrn);
		--live_count_;
		write_header();
		return true;
	}

	// EN: Walks the free list from the head, to show the order in which slots will be reused.
	// PT: Percorre a lista de livres a partir da cabeça, para mostrar a ordem de reuso dos slots.
	// ES: Recorre la lista de libres desde la cabeza, para mostrar el orden de reutilización de
	//     los slots.
	std::vector<std::uint32_t> free_list() {
		std::vector<std::uint32_t> list;
		for (std::int32_t at = free_head_; at != kNoSlot;) {
			list.push_back(static_cast<std::uint32_t>(at));
			const Slot slot = read_slot(static_cast<std::uint32_t>(at));
			at = static_cast<std::int32_t>(get_u32(&slot[1]));
		}
		return list;
	}

	std::uint64_t file_size() {
		stream_.flush();
		return std::filesystem::file_size(path_);
	}

	std::uint32_t slot_count() const { return slot_count_; }
	std::uint32_t live_count() const { return live_count_; }
	std::int32_t free_head() const { return free_head_; }
	// EN: Slots read from the file: on a disk this count is what a search costs.
	// PT: Slots lidos do arquivo: em um disco, é essa contagem que uma busca custa.
	// ES: Slots leídos del archivo: en un disco, es esa cuenta lo que cuesta una búsqueda.
	std::uint64_t slot_reads() const { return slot_reads_; }

private:
	explicit RecordFile(const std::string& path)
	    : path_(path), stream_(path, std::ios::binary | std::ios::in | std::ios::out) {
		if (!stream_) {
			throw std::runtime_error("cannot open " + path);
		}
	}

	Slot read_slot(std::uint32_t rrn) {
		Slot slot;
		stream_.seekg(static_cast<std::streamoff>(offset_of(rrn)));
		stream_.read(reinterpret_cast<char*>(slot.data()), kRecordSize);
		if (!stream_) {
			throw std::runtime_error("short read in " + path_);
		}
		++slot_reads_;
		return slot;
	}

	void write_slot(std::uint32_t rrn, const Slot& slot) {
		stream_.seekp(static_cast<std::streamoff>(offset_of(rrn)));
		stream_.write(reinterpret_cast<const char*>(slot.data()), kRecordSize);
	}

	void write_header() {
		std::array<std::uint8_t, kHeaderSize> header{};
		header[0] = 'F';
		header[1] = 'O';
		header[2] = 'R';
		header[3] = 'G';
		put_u32(&header[4], 1);
		put_u32(&header[8], kRecordSize);
		put_u32(&header[12], slot_count_);
		put_u32(&header[16], live_count_);
		put_u32(&header[20], static_cast<std::uint32_t>(free_head_));
		stream_.seekp(0);
		stream_.write(reinterpret_cast<const char*>(header.data()), kHeaderSize);
		if (!stream_) {
			throw std::runtime_error("cannot write " + path_);
		}
	}

	std::string path_;
	std::fstream stream_;
	std::uint32_t slot_count_ = 0;
	std::uint32_t live_count_ = 0;
	std::int32_t free_head_ = kNoSlot;
	std::uint64_t slot_reads_ = 0;
};

}  // namespace forg
