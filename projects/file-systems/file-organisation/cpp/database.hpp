#pragma once

#include <cctype>
#include <cstdint>
#include <filesystem>
#include <optional>
#include <string>
#include <vector>

#include "indexes.hpp"
#include "record_file.hpp"

namespace forg {

// EN: The canonical form of a key: one agreed spelling, applied before storing and before
//     searching. Without it "Recife", "RECIFE" and "recife " would be three different keys.
// PT: A forma canônica de uma chave: uma única grafia combinada, aplicada antes de gravar e
//     antes de buscar. Sem ela, "Recife", "RECIFE" e "recife " seriam três chaves diferentes.
// ES: La forma canónica de una clave: una única grafía combinada, aplicada antes de escribir y
//     antes de buscar. Sin ella, "Recife", "RECIFE" y "recife " serían tres claves distintas.
inline std::string canonical(const std::string& text) {
	std::size_t start = 0;
	std::size_t end = text.size();
	while (start < end && text[start] == ' ') {
		++start;
	}
	while (end > start && text[end - 1] == ' ') {
		--end;
	}
	std::string key = text.substr(start, end - start);
	for (char& letter : key) {
		letter = static_cast<char>(std::toupper(static_cast<unsigned char>(letter)));
	}
	return key;
}

// EN: The data file together with its indexes: a primary index by id and two secondary
//     indexes, by city and by year. The indexes live in memory while the files are open and
//     are written to disk by close().
// PT: O arquivo de dados junto com os seus índices: um índice primário por id e dois índices
//     secundários, por cidade e por ano. Os índices ficam na memória enquanto os arquivos estão
//     abertos e são gravados em disco por close().
// ES: El archivo de datos junto con sus índices: un índice primario por id y dos índices
//     secundarios, por ciudad y por año. Los índices quedan en memoria mientras los archivos
//     están abiertos y close() los escribe en disco.
class Database {
public:
	explicit Database(const std::string& directory)
	    : directory_(directory), file_(open_or_create(directory)) {
		// EN: The indexes on disk are trusted only when the out-of-date flag is clear. If the
		//     last session ended without close(), the flag is still set and everything is
		//     rebuilt from the data file, which is the only source of truth.
		// PT: Os índices em disco só são aceitos quando o indicador de desatualizado está
		//     limpo. Se a última sessão terminou sem close(), o indicador continua ligado e
		//     tudo é reconstruído a partir do arquivo de dados, a única fonte da verdade.
		// ES: Los índices en disco solo se aceptan cuando el indicador de desactualizado está
		//     limpio. Si la última sesión terminó sin close(), el indicador sigue activado y
		//     todo se reconstruye a partir del archivo de datos, la única fuente de la verdad.
		const bool loaded = primary_.from_bytes(read_whole_file(path("primary.idx"))) &&
		                    by_city_.from_bytes(read_whole_file(path("city.sec")),
		                                        read_whole_file(path("city.lst"))) &&
		                    by_year_.from_bytes(read_whole_file(path("year.sec")),
		                                        read_whole_file(path("year.lst")));
		if (!loaded) {
			rebuild();
		}
		rebuilt_ = !loaded;
	}

	bool insert(const Record& record) {
		Record stored = record;
		stored.city = canonical(record.city);
		if (primary_.find(stored.id).has_value()) {
			return false;
		}
		mark_stale();
		const std::uint32_t rrn = file_.insert(stored);
		primary_.insert(stored.id, rrn);
		by_city_.add(stored.city, stored.id);
		by_year_.add(std::to_string(stored.year), stored.id);
		return true;
	}

	// EN: Removal touches the data file and the primary index only. The secondary lists keep
	//     the primary key of the removed record, and the searches below drop it when the
	//     primary index no longer knows that key. This is what late binding buys.
	// PT: A remoção mexe só no arquivo de dados e no índice primário. As listas secundárias
	//     continuam com a chave primária do registro removido, e as buscas abaixo a descartam
	//     quando o índice primário não conhece mais essa chave. É o ganho da ligação tardia.
	// ES: La eliminación toca solo el archivo de datos y el índice primario. Las listas
	//     secundarias conservan la clave primaria del registro eliminado, y las búsquedas de
	//     abajo la descartan cuando el índice primario ya no conoce esa clave. Es la ganancia
	//     del enlace tardío (late binding).
	bool remove(std::uint32_t id) {
		const std::optional<std::uint32_t> rrn = primary_.find(id);
		if (!rrn.has_value()) {
			return false;
		}
		mark_stale();
		file_.remove(*rrn);
		primary_.erase(id);
		return true;
	}

	std::optional<Record> find(std::uint32_t id) {
		const std::optional<std::uint32_t> rrn = primary_.find(id);
		return rrn.has_value() ? file_.read(*rrn) : std::nullopt;
	}

	std::vector<Record> find_by_city(const std::string& city) {
		const std::string key = canonical(city);
		return fetch(by_city_.ids(key), [&](const Record& record) { return record.city == key; });
	}

	std::vector<Record> find_by_year(std::uint16_t year) {
		return fetch(by_year_.ids(std::to_string(year)),
		             [&](const Record& record) { return record.year == year; });
	}

	std::vector<Record> find_by_city_and_year(const std::string& city, std::uint16_t year) {
		const std::string key = canonical(city);
		return fetch(
		    match(by_city_.ids(key), by_year_.ids(std::to_string(year))),
		    [&](const Record& record) { return record.city == key && record.year == year; });
	}

	// EN: The search with no index: read every slot of the file and keep the records that
	//     match. It is the reference the index searches are compared with, and its cost is the
	//     number of slots in the file, whatever the number of matches.
	// PT: A busca sem índice: ler todos os slots do arquivo e ficar com os registros que
	//     atendem. É a referência com que as buscas por índice são comparadas, e o seu custo é
	//     o número de slots do arquivo, qualquer que seja o número de resultados.
	// ES: La búsqueda sin índice: leer todos los slots del archivo y quedarse con los registros
	//     que cumplen. Es la referencia con la que se comparan las búsquedas por índice, y su
	//     costo es el número de slots del archivo, sea cual sea el número de resultados.
	template <typename Predicate>
	std::vector<Record> scan(Predicate matches) {
		std::vector<Record> found;
		for (std::uint32_t rrn = 0; rrn < file_.slot_count(); ++rrn) {
			const std::optional<Record> record = file_.read(rrn);
			if (record.has_value() && matches(*record)) {
				found.push_back(*record);
			}
		}
		return found;
	}

	void close() {
		write_whole_file(path("city.sec"), by_city_.keys_to_bytes());
		write_whole_file(path("city.lst"), by_city_.nodes_to_bytes());
		write_whole_file(path("year.sec"), by_year_.keys_to_bytes());
		write_whole_file(path("year.lst"), by_year_.nodes_to_bytes());
		write_whole_file(path("primary.idx"), primary_.to_bytes(false));
		stale_on_disk_ = false;
	}

	RecordFile& file() { return file_; }
	PrimaryIndex& primary() { return primary_; }
	const SecondaryIndex& by_city() const { return by_city_; }
	bool rebuilt_on_open() const { return rebuilt_; }
	std::string path(const std::string& name) const { return directory_ + "/" + name; }

private:
	static RecordFile open_or_create(const std::string& directory) {
		std::filesystem::create_directories(directory);
		const std::string data = directory + "/records.dat";
		return std::filesystem::exists(data) ? RecordFile::open(data) : RecordFile::create(data);
	}

	// EN: Before the first change of a session, the flag in the index file is set on disk. If
	//     the program dies before close(), the next session finds the flag and knows that the
	//     index files do not match the data.
	// PT: Antes da primeira alteração de uma sessão, o indicador do arquivo de índice é ligado
	//     em disco. Se o programa morrer antes de close(), a próxima sessão encontra o
	//     indicador e sabe que os arquivos de índice não correspondem aos dados.
	// ES: Antes de la primera modificación de una sesión, el indicador del archivo de índice se
	//     activa en disco. Si el programa muere antes de close(), la próxima sesión encuentra el
	//     indicador y sabe que los archivos de índice no corresponden a los datos.
	void mark_stale() {
		if (!stale_on_disk_) {
			write_whole_file(path("primary.idx"), PrimaryIndex().to_bytes(true));
			stale_on_disk_ = true;
		}
	}

	void rebuild() {
		primary_.clear();
		by_city_.clear();
		by_year_.clear();
		for (std::uint32_t rrn = 0; rrn < file_.slot_count(); ++rrn) {
			const std::optional<Record> record = file_.read(rrn);
			if (record.has_value()) {
				primary_.insert(record->id, rrn);
				by_city_.add(record->city, record->id);
				by_year_.add(std::to_string(record->year), record->id);
			}
		}
	}

	// EN: From primary keys to records: each key goes through the primary index to find the
	//     RRN, then one slot is read. A key that is gone, or whose record no longer has the
	//     searched value (the id was reused with other data), is skipped.
	// PT: Das chaves primárias aos registros: cada chave passa pelo índice primário para achar
	//     o RRN, e então um slot é lido. Uma chave que não existe mais, ou cujo registro não tem
	//     mais o valor buscado (o id foi reutilizado com outros dados), é ignorada.
	// ES: De las claves primarias a los registros: cada clave pasa por el índice primario para
	//     encontrar el RRN, y luego se lee un slot. Una clave que ya no existe, o cuyo registro
	//     ya no tiene el valor buscado (el id se reutilizó con otros datos), se ignora.
	template <typename Predicate>
	std::vector<Record> fetch(const std::vector<std::uint32_t>& ids, Predicate still_matches) {
		std::vector<Record> found;
		for (const std::uint32_t id : ids) {
			const std::optional<Record> record = find(id);
			if (record.has_value() && still_matches(*record)) {
				found.push_back(*record);
			}
		}
		return found;
	}

	std::string directory_;
	RecordFile file_;
	PrimaryIndex primary_;
	SecondaryIndex by_city_;
	SecondaryIndex by_year_;
	bool rebuilt_ = false;
	bool stale_on_disk_ = false;
};

}  // namespace forg
