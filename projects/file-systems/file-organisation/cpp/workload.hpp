#pragma once

#include <algorithm>
#include <array>
#include <cstdint>
#include <cstdio>
#include <filesystem>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

#include "compression.hpp"
#include "database.hpp"

namespace forg {

inline constexpr std::uint64_t kSeed = 20261007;

// EN: SplitMix64, a small pseudo-random generator. The same seed gives the same sequence in
//     C++ and in Rust, so both programs build the same file and print the same tables.
// PT: SplitMix64, um gerador pseudoaleatório pequeno. A mesma semente dá a mesma sequência em
//     C++ e em Rust, então os dois programas montam o mesmo arquivo e imprimem as mesmas tabelas.
struct SplitMix64 {
	std::uint64_t state;

	std::uint64_t next() {
		state += 0x9E3779B97F4A7C15ULL;
		std::uint64_t z = state;
		z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ULL;
		z = (z ^ (z >> 27)) * 0x94D049BB133111EBULL;
		return z ^ (z >> 31);
	}

	std::uint64_t below(std::uint64_t limit) { return next() % limit; }
};

inline constexpr std::array<const char*, 12> kCities = {
    "BELEM", "BELO HORIZONTE", "BRASILIA", "CURITIBA",       "FORTALEZA", "MANAUS",
    "NATAL", "PORTO ALEGRE",   "RECIFE",   "RIO DE JANEIRO", "SALVADOR",  "SAO PAULO",
};

inline Record make_record(std::uint32_t id, SplitMix64& rng) {
	Record record;
	record.id = id;
	record.year = static_cast<std::uint16_t>(2000 + rng.below(25));
	record.city = kCities[rng.below(kCities.size())];
	record.name = "N" + std::to_string(id) + "-";
	const std::uint64_t letters = 4 + rng.below(20);
	for (std::uint64_t i = 0; i < letters; ++i) {
		record.name.push_back(static_cast<char>('a' + rng.below(26)));
	}
	return record;
}

inline void shuffle(std::vector<std::uint32_t>& values, SplitMix64& rng) {
	for (std::size_t i = values.size(); i > 1; --i) {
		std::swap(values[i - 1], values[rng.below(i)]);
	}
}

inline std::vector<std::uint32_t> ids_of(std::vector<Record> records) {
	std::vector<std::uint32_t> ids;
	for (const Record& record : records) {
		ids.push_back(record.id);
	}
	std::sort(ids.begin(), ids.end());
	return ids;
}

inline std::string fixed(double value, int digits) {
	char text[64];
	std::snprintf(text, sizeof text, "%.*f", digits, value);
	return text;
}

// EN: The demo. Every number it prints is a count (bytes, slots, probes), never a time, so
//     the output is the same on any machine and in both languages, and a test compares it
//     with the committed table.
// PT: A demonstração. Todo número que ela imprime é uma contagem (bytes, slots, sondagens), e
//     nunca um tempo, então a saída é a mesma em qualquer máquina e nas duas linguagens, e um
//     teste a compara com a tabela versionada.
inline std::string run_demo(const std::string& directory, std::uint32_t n) {
	std::filesystem::remove_all(directory);
	std::ostringstream out;
	SplitMix64 rng{kSeed};
	auto db = std::make_unique<Database>(directory);
	const auto row = [&](const std::string& step) {
		out << "| " << step << " | " << db->file().slot_count() << " | " << db->file().live_count()
		    << " | " << db->file().free_list().size() << " | " << db->file().file_size() << " |\n";
	};

	out << "# File organisation demo\n\n";
	out << "Records: " << n << " of " << kRecordSize << " bytes, after a header of " << kHeaderSize
	    << " bytes. Seed " << kSeed << ".\n\n";
	out << "## 1. Free list inside the file\n\n";
	out << "| Step | Slots in the file | Live records | Free slots | File size (bytes) |\n";
	out << "| --- | ---: | ---: | ---: | ---: |\n";

	std::vector<std::uint32_t> ids;
	for (std::uint32_t i = 0; i < n; ++i) {
		ids.push_back(100000 + i);
	}
	shuffle(ids, rng);
	for (const std::uint32_t id : ids) {
		db->insert(make_record(id, rng));
	}
	row("insert " + std::to_string(n) + " records");

	const std::uint32_t removed = n * 3 / 10;
	shuffle(ids, rng);
	std::vector<std::uint32_t> removed_rrns;
	for (std::uint32_t i = 0; i < removed; ++i) {
		removed_rrns.push_back(*db->primary().find(ids[i]));
		db->remove(ids[i]);
	}
	row("delete " + std::to_string(removed) + " records");

	std::vector<std::uint32_t> reused_rrns;
	for (std::uint32_t i = 0; i < removed; ++i) {
		db->insert(make_record(200000 + i, rng));
		reused_rrns.push_back(*db->primary().find(200000 + i));
	}
	row("insert " + std::to_string(removed) + " records");

	const std::uint32_t extra = n / 20;
	for (std::uint32_t i = 0; i < extra; ++i) {
		db->insert(make_record(300000 + i, rng));
	}
	row("insert " + std::to_string(extra) + " records");

	out << "\nLast three slots deleted (RRN): " << removed_rrns[removed - 3] << ", "
	    << removed_rrns[removed - 2] << ", " << removed_rrns[removed - 1]
	    << ". First three slots reused (RRN): " << reused_rrns[0] << ", " << reused_rrns[1] << ", "
	    << reused_rrns[2] << ".\n\n";

	out << "## 2. Index search against a full scan\n\n";
	out << "| Query | Records found | Slots read by the scan | Slots read through the index | "
	       "Same records |\n";
	out << "| --- | ---: | ---: | ---: | --- |\n";
	const auto compare = [&](const std::string& label, std::vector<Record> by_index,
	                         std::uint64_t index_reads, std::vector<Record> by_scan,
	                         std::uint64_t scan_reads) {
		out << "| " << label << " | " << by_index.size() << " | " << scan_reads << " | "
		    << index_reads << " | " << (ids_of(by_index) == ids_of(by_scan) ? "yes" : "NO")
		    << " |\n";
	};
	for (const char* city : kCities) {
		std::uint64_t before = db->file().slot_reads();
		auto by_index = db->find_by_city(city);
		const std::uint64_t index_reads = db->file().slot_reads() - before;
		before = db->file().slot_reads();
		auto by_scan = db->scan([&](const Record& record) { return record.city == city; });
		compare(std::string("city = ") + city, by_index, index_reads, by_scan,
		        db->file().slot_reads() - before);
	}
	{
		std::uint64_t before = db->file().slot_reads();
		auto by_index = db->find_by_city_and_year("RECIFE", 2010);
		const std::uint64_t index_reads = db->file().slot_reads() - before;
		before = db->file().slot_reads();
		auto by_scan = db->scan(
		    [](const Record& record) { return record.city == "RECIFE" && record.year == 2010; });
		compare("city = RECIFE and year = 2010", by_index, index_reads, by_scan,
		        db->file().slot_reads() - before);
	}

	std::uint64_t probes = 0;
	std::uint32_t most = 0;
	for (int i = 0; i < 1000; ++i) {
		db->primary().find(static_cast<std::uint32_t>(200000 + rng.below(removed)));
		probes += db->primary().last_probes();
		most = std::max(most, db->primary().last_probes());
	}
	out << "\nPrimary index: " << db->primary().size() << " entries, 1000 searches by id, "
	    << fixed(static_cast<double>(probes) / 1000.0, 2) << " probes on average and at most "
	    << most << ", then 1 slot read each.\n\n";

	out << "## 3. Index files and the out-of-date flag\n\n";
	out << "| Session | How it ended | What the next open did |\n";
	out << "| --- | --- | --- |\n";
	db->close();
	db = std::make_unique<Database>(directory);
	out << "| 1 | close() | " << (db->rebuilt_on_open() ? "rebuilt" : "loaded the index files")
	    << " |\n";
	db->insert(make_record(999999, rng));
	// EN: The object is destroyed without close(): the index files on disk are now out of date.
	// PT: O objeto é destruído sem close(): os arquivos de índice em disco ficaram desatualizados.
	db = nullptr;
	db = std::make_unique<Database>(directory);
	out << "| 2 | 1 insert, then no close() | "
	    << (db->rebuilt_on_open() ? "rebuilt the indexes from the data file"
	                              : "loaded the index files")
	    << " |\n";
	out << "\nRecord inserted in session 2 found after the rebuild: "
	    << (db->find(999999).has_value() ? "yes" : "NO") << ".\n\n";
	db->close();
	const std::string data_path = db->path("records.dat");
	db = nullptr;

	out << "## 4. Compression of the data file\n\n";
	out << "| Method | Bytes | Ratio (compressed / original) | Round trip |\n";
	out << "| --- | ---: | ---: | --- |\n";
	const Bytes original = read_whole_file(data_path);
	const Bytes rle = rle_encode(original);
	const Bytes huffman = huffman_encode(original);
	const Bytes both = huffman_encode(rle);
	const auto line = [&](const std::string& method, const Bytes& bytes, bool lossless) {
		out << "| " << method << " | " << bytes.size() << " | "
		    << fixed(static_cast<double>(bytes.size()) / static_cast<double>(original.size()), 3)
		    << " | " << (lossless ? "lossless" : "DIFFERENT") << " |\n";
	};
	line("none", original, true);
	line("run-length", rle, rle_decode(rle) == original);
	line("Huffman", huffman, huffman_decode(huffman) == original);
	line("run-length, then Huffman", both, rle_decode(huffman_decode(both)) == original);
	return out.str();
}

}  // namespace forg
