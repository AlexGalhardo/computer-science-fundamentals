#include <algorithm>
#include <cstdint>
#include <filesystem>
#include <iostream>
#include <map>
#include <string>
#include <vector>

#include "compression.hpp"
#include "database.hpp"
#include "indexes.hpp"
#include "record_file.hpp"
#include "workload.hpp"

using namespace forg;

namespace {

int checks = 0;
int failures = 0;
const std::string directory = "/tmp/forg-test-cpp";

void check(bool condition, const std::string& what) {
	++checks;
	if (!condition) {
		++failures;
		std::cerr << "FAIL: " << what << '\n';
	}
}

std::vector<Record> sorted(std::vector<Record> records) {
	std::sort(records.begin(), records.end(),
	          [](const Record& a, const Record& b) { return a.id < b.id; });
	return records;
}

void record_layout() {
	check(RecordFile::offset_of(0) == 32 && RecordFile::offset_of(25) == 32 + 25 * 64,
	      "layout: byte offset = header + RRN x record size");
	const Record record{42, 2024, "RECIFE", "Ana"};
	const Slot slot = encode(record);
	check(slot[0] == kLiveTag && slot[1] == 42 && slot[7] == 'R' && slot[13] == ' ' &&
	          slot[63] == ' ',
	      "layout: fields at fixed positions, padded with spaces");
	check(decode(slot) == record, "layout: a record survives encode and decode");
	bool thrown = false;
	try {
		encode(Record{1, 2000, std::string(21, 'x'), ""});
	} catch (const std::invalid_argument&) {
		thrown = true;
	}
	check(thrown, "layout: a field longer than its fixed size is refused");
}

// EN: Acceptance of MP-FS-1.1: the file has the same size after deletions and after the
//     insertions that reuse the deleted slots, and it grows by exactly one record only when
//     the free list is empty.
// PT: Aceite de MP-FS-1.1: o arquivo tem o mesmo tamanho depois das remoções e depois das
//     inserções que reaproveitam os slots removidos, e cresce exatamente um registro só quando
//     a lista de livres está vazia.
void free_list() {
	const std::string path = directory + "/free-list.dat";
	SplitMix64 rng{kSeed};
	{
		RecordFile file = RecordFile::create(path);
		check(file.file_size() == 32, "free list: an empty file is only the header");
		for (std::uint32_t id = 0; id < 1000; ++id) {
			check(file.insert(make_record(id, rng)) == id, "free list: new records are appended");
		}
		const std::uint64_t full = file.file_size();
		check(full == 32 + 1000 * 64, "free list: 1000 records take 32 + 1000 x 64 bytes");

		check(file.remove(3) && file.remove(7) && file.remove(2), "free list: three removals");
		check(file.free_list() == std::vector<std::uint32_t>({2, 7, 3}),
		      "free list: the stack lists the last slot removed first");
		check(!file.remove(7) && !file.read(7).has_value() && !file.remove(5000),
		      "free list: a removed slot cannot be read or removed again");
		check(file.insert(make_record(2000, rng)) == 2,
		      "free list: the top of the stack is reused");
		check(file.remove(5), "free list: another removal");
		check(file.insert(make_record(2001, rng)) == 5 && file.insert(make_record(2002, rng)) == 7,
		      "free list: slots are reused in LIFO order");
		check(file.free_head() == 3 && file.file_size() == full,
		      "free list: slot 3 is still free and the file did not grow");
		check(file.insert(make_record(2003, rng)) == 3 && file.free_head() == kNoSlot,
		      "free list: the last free slot is reused and the list is empty");

		for (std::uint32_t rrn = 0; rrn < 1000; rrn += 3) {
			file.remove(rrn);
		}
		check(
		    file.file_size() == full && file.live_count() == 666 && file.free_list().size() == 334,
		    "free list: 334 removals leave the file size unchanged");
		for (std::uint32_t i = 0; i < 334; ++i) {
			check(file.insert(make_record(3000 + i, rng)) < 1000, "free list: reuse stays inside");
		}
		check(file.file_size() == full && file.live_count() == 1000 && file.slot_count() == 1000,
		      "free list: 334 insertions reuse the slots and the file size is unchanged");
		check(file.insert(make_record(4000, rng)) == 1000 && file.file_size() == full + 64,
		      "free list: with an empty list the file grows by one record");
		file.remove(10);
	}
	RecordFile reopened = RecordFile::open(path);
	check(reopened.slot_count() == 1001 && reopened.live_count() == 1000 &&
	          reopened.free_head() == 10,
	      "free list: the header keeps the counters and the head across reopening");
	check(reopened.read(1000).has_value() && reopened.read(1000)->id == 4000,
	      "free list: records are read back after reopening");
}

void indexes() {
	PrimaryIndex primary;
	for (std::uint32_t id = 0; id < 1000; ++id) {
		check(primary.insert(id * 7919 % 1000, id), "primary: distinct keys are inserted");
	}
	check(!primary.insert(5, 0), "primary: a duplicate key is refused");
	bool ordered = true;
	for (std::size_t i = 1; i < primary.entries().size(); ++i) {
		ordered = ordered && primary.entries()[i - 1].id < primary.entries()[i].id;
	}
	check(ordered, "primary: entries are kept sorted by key");
	for (std::uint32_t id = 0; id < 1000; ++id) {
		check(primary.find(id * 7919 % 1000) == std::optional<std::uint32_t>(id),
		      "primary: every key is found with its RRN");
	}
	check(!primary.find(1000).has_value(), "primary: a missing key is not found");
	// 2^9 = 512 < 1000 <= 2^10, so binary search needs at most 10 probes.
	check(primary.max_probes() == 10, "primary: at most 10 probes for 1000 entries");
	PrimaryIndex copy;
	check(copy.from_bytes(primary.to_bytes(false)) && copy.size() == 1000 &&
	          copy.find(7919 % 1000) == std::optional<std::uint32_t>(1),
	      "primary: the index is read back from its file image");
	check(!copy.from_bytes(primary.to_bytes(true)), "primary: an out-of-date image is refused");
	check(primary.erase(5) && !primary.erase(5) && !primary.find(5).has_value(),
	      "primary: a key is erased once");

	SecondaryIndex cities;
	cities.add("RECIFE", 30);
	cities.add("NATAL", 20);
	cities.add("RECIFE", 10);
	cities.add("RECIFE", 20);
	cities.add("RECIFE", 10);
	check(cities.ids("RECIFE") == std::vector<std::uint32_t>({10, 20, 30}),
	      "secondary: a list is walked in increasing order of primary key, with no repeats");
	check(cities.ids("NATAL") == std::vector<std::uint32_t>({20}) && cities.ids("MANAUS").empty(),
	      "secondary: each key has its own list");
	check(cities.key_count() == 2 && cities.node_count() == 4, "secondary: 2 keys and 4 nodes");
	SecondaryIndex loaded;
	check(loaded.from_bytes(cities.keys_to_bytes(), cities.nodes_to_bytes()) &&
	          loaded.ids("RECIFE") == cities.ids("RECIFE"),
	      "secondary: key table and list file are read back");
	check(match({104, 117, 123, 150, 162}, {101, 117, 150, 151, 162, 170}) ==
	          std::vector<std::uint32_t>({117, 150, 162}),
	      "match: the intersection of two sorted lists in one pass");
}

// EN: Acceptance of MP-FS-1.2: for every city, every year and every pair, the search through
//     the indexes returns exactly the records that a full scan of the file returns.
// PT: Aceite de MP-FS-1.2: para cada cidade, cada ano e cada par, a busca pelos índices devolve
//     exatamente os registros que uma varredura completa do arquivo devolve.
void compare_with_scan(Database& db, const std::string& when) {
	for (const char* city : kCities) {
		const std::string name = city;
		check(sorted(db.find_by_city(name)) ==
		          sorted(db.scan([&](const Record& r) { return r.city == name; })),
		      when + ": city index equals the scan for " + name);
	}
	for (std::uint16_t year = 1999; year <= 2025; ++year) {
		check(sorted(db.find_by_year(year)) ==
		          sorted(db.scan([&](const Record& r) { return r.year == year; })),
		      when + ": year index equals the scan for " + std::to_string(year));
		check(sorted(db.find_by_city_and_year("RECIFE", year)) ==
		          sorted(db.scan(
		              [&](const Record& r) { return r.city == "RECIFE" && r.year == year; })),
		      when + ": matching two lists equals the scan for RECIFE and " + std::to_string(year));
	}
}

void index_against_scan() {
	const std::string path = directory + "/db";
	std::filesystem::remove_all(path);
	SplitMix64 rng{kSeed + 1};
	std::map<std::uint32_t, Record> model;
	{
		Database db(path);
		check(db.rebuilt_on_open(), "database: a new database has no index files to load");
		// EN: Random insertions and removals over a small range of ids, so ids are removed and
		//     inserted again with another city and year. The std::map is the model.
		// PT: Inserções e remoções aleatórias em uma faixa pequena de ids, de modo que ids são
		//     removidos e inseridos de novo com outra cidade e outro ano. O std::map é o modelo.
		for (int step = 0; step < 6000; ++step) {
			const auto id = static_cast<std::uint32_t>(rng.below(3000));
			if (rng.below(3) == 0) {
				check(db.remove(id) == (model.erase(id) == 1),
				      "database: remove agrees with the model");
			} else {
				const Record record = make_record(id, rng);
				const bool inserted = model.emplace(id, record).second;
				check(db.insert(record) == inserted, "database: insert agrees with the model");
			}
		}
		check(db.file().live_count() == model.size() && db.primary().size() == model.size(),
		      "database: live records and index entries equal the model");
		bool same = true;
		for (const auto& [id, record] : model) {
			same = same && db.find(id) == std::optional<Record>(record);
		}
		check(same && !db.find(3000).has_value(), "database: every record is found by its id");
		check(db.find_by_city("  recife ").size() == db.find_by_city("RECIFE").size() &&
		          !db.find_by_city("RECIFE").empty(),
		      "database: the canonical form makes spellings of a city equal");
		compare_with_scan(db, "first session");
		db.close();
	}
	{
		Database db(path);
		check(!db.rebuilt_on_open(), "database: after close() the index files are loaded");
		compare_with_scan(db, "loaded indexes");
		check(db.insert(Record{5000, 2024, "Natal", "after the last save"}),
		      "database: an insert in a session that will not be closed");
	}
	Database db(path);
	check(db.rebuilt_on_open(), "database: without close() the flag forces a rebuild");
	check(db.find(5000).has_value() && db.find(5000)->city == "NATAL",
	      "database: the rebuild finds the record written after the last save");
	compare_with_scan(db, "rebuilt indexes");
}

Bytes text(const std::string& value) { return Bytes(value.begin(), value.end()); }

// EN: Acceptance of MP-FS-1.3: decoding gives back exactly the original bytes, for edge cases
//     and for the data file, and the compressed sizes are the ones worked out by hand.
// PT: Aceite de MP-FS-1.3: decodificar devolve exatamente os bytes originais, nos casos
//     extremos e no arquivo de dados, e os tamanhos comprimidos são os calculados à mão.
void compression() {
	const Bytes runs = {0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x23, 0x24, 0x24,
	                    0x24, 0x24, 0x24, 0x24, 0x24, 0x24, 0x25, 0x26, 0x26};
	check(rle_encode(runs) == Bytes({0xFF, 0x22, 6, 0x23, 0xFF, 0x24, 8, 0x25, 0x26, 0x26}),
	      "run-length: 18 bytes with two long runs become 10 bytes");
	check(rle_encode(Bytes({1, 0xFF, 2})) == Bytes({1, 0xFF, 0xFF, 1, 2}),
	      "run-length: a data byte equal to the marker is written as a run of 1");
	check(rle_encode(text("abcabc")).size() == 6, "run-length: data with no runs does not shrink");

	// A = 45, B = 25, C = 15, D = 10, E = 5: code lengths 1, 2, 3, 4, 4 and 200 bits in total.
	Bytes symbols;
	const std::string letters = "ABCDE";
	const std::array<int, 5> counts = {45, 25, 15, 10, 5};
	for (std::size_t i = 0; i < 5; ++i) {
		symbols.insert(symbols.end(), static_cast<std::size_t>(counts[i]),
		               static_cast<std::uint8_t>(letters[i]));
	}
	check(huffman_encode(symbols).size() == kHuffmanHeader + 25,
	      "Huffman: 100 symbols with frequencies 45, 25, 15, 10, 5 take 200 bits");
	std::array<std::uint32_t, 256> frequency{};
	for (const std::uint8_t byte : symbols) {
		++frequency[byte];
	}
	const auto codes = code_table(build_tree(frequency));
	check(codes['A'].size() == 1 && codes['B'].size() == 2 && codes['C'].size() == 3 &&
	          codes['D'].size() == 4 && codes['E'].size() == 4,
	      "Huffman: frequent symbols get the short codes");

	SplitMix64 rng{kSeed + 2};
	Bytes random(50000);
	for (std::uint8_t& byte : random) {
		byte = static_cast<std::uint8_t>(rng.below(256));
	}
	Bytes skewed(50000);
	for (std::uint8_t& byte : skewed) {
		byte = rng.below(10) < 8 ? 0xFF : static_cast<std::uint8_t>(rng.below(4));
	}
	const std::string path = directory + "/compress.dat";
	{
		RecordFile file = RecordFile::create(path);
		for (std::uint32_t id = 0; id < 2000; ++id) {
			file.insert(make_record(id, rng));
		}
	}
	const Bytes data_file = read_whole_file(path);
	const std::vector<std::pair<std::string, Bytes>> cases = {
	    {"empty", {}},
	    {"one byte", {7}},
	    {"one distinct byte", Bytes(1000, 'x')},
	    {"only markers", Bytes(700, 0xFF)},
	    {"runs", runs},
	    {"symbols", symbols},
	    {"random", random},
	    {"skewed with markers", skewed},
	    {"data file", data_file},
	};
	for (const auto& [name, bytes] : cases) {
		check(rle_decode(rle_encode(bytes)) == bytes, "run-length round trip: " + name);
		check(huffman_decode(huffman_encode(bytes)) == bytes, "Huffman round trip: " + name);
		check(rle_decode(huffman_decode(huffman_encode(rle_encode(bytes)))) == bytes,
		      "run-length then Huffman round trip: " + name);
	}
	check(data_file.size() == 32 + 2000 * 64, "compression: the data file has 128,032 bytes");
	check(rle_encode(data_file).size() < data_file.size() &&
	          huffman_encode(data_file).size() < data_file.size(),
	      "compression: both methods shrink a file of padded records");
	check(huffman_encode(random).size() > random.size(),
	      "compression: random bytes do not shrink, the header makes them larger");
}

}  // namespace

int main(int argc, char** argv) {
	std::filesystem::remove_all(directory);
	std::filesystem::create_directories(directory);
	record_layout();
	free_list();
	indexes();
	index_against_scan();
	compression();
	// EN: The demo output is deterministic, so it is compared with the committed table.
	// PT: A saída da demonstração é determinística, então é comparada com a tabela versionada.
	if (argc > 1) {
		const Bytes expected = read_whole_file(argv[1]);
		check(!expected.empty() && run_demo(directory + "/demo", 10000) ==
		                               std::string(expected.begin(), expected.end()),
		      "demo: the output equals the committed results/demo.md");
	}
	std::cout << checks << " checks, " << failures << " failures\n";
	return failures == 0 ? 0 : 1;
}
