#pragma once

#include <cstddef>
#include <cstdint>
#include <optional>
#include <string>
#include <vector>

#include "btree.hpp"
#include "pager.hpp"

namespace btree {

// EN: A binary search tree stored in the same kind of file, for comparison. Each node is a
//     32-byte record (key, value, left, right) and 128 records fit in a page, written in the
//     order the keys arrived. Children are record numbers. The tree is built in memory and
//     written once, and the searches then run against the file through the same pager, which
//     counts the pages. A search keeps the last page it read: when the next node is in that
//     same page no new read is counted, which is the fairest way of charging a paged BST.
// PT: Uma árvore binária de busca guardada no mesmo tipo de arquivo, para comparação. Cada nó é
//     um registro de 32 bytes (chave, valor, esquerda, direita) e cabem 128 registros em uma
//     página, gravados na ordem em que as chaves chegaram. Os filhos são números de registro. A
//     árvore é montada em memória e gravada de uma vez, e as buscas depois rodam contra o
//     arquivo pelo mesmo pager, que conta as páginas. A busca guarda a última página que leu:
//     quando o próximo nó está nessa mesma página nenhuma leitura nova é contada, que é a forma
//     mais justa de cobrar uma ABB paginada.
class DiskBst {
public:
	static constexpr std::size_t kRecordSize = 32;
	static constexpr std::size_t kRecordsPerPage = kPageSize / kRecordSize;

	DiskBst(const std::string& path, const std::vector<Key>& keys) : pager_(path, true) {
		struct Record {
			Key key;
			Value value;
			std::uint64_t left;
			std::uint64_t right;
		};
		// EN: Record numbers start at 1, so 0 can mean "no child".
		// PT: Os números de registro começam em 1, então 0 pode significar "sem filho".
		std::vector<Record> records;
		records.reserve(keys.size());
		for (const Key key : keys) {
			std::uint64_t depth = 1;
			std::uint64_t current = records.empty() ? 0 : 1;
			std::uint64_t* link = nullptr;
			bool duplicate = false;
			while (current != 0) {
				Record& record = records[current - 1];
				if (key == record.key) {
					duplicate = true;
					break;
				}
				link = key < record.key ? &record.left : &record.right;
				current = *link;
				++depth;
			}
			if (duplicate) {
				continue;
			}
			if (link != nullptr) {
				*link = records.size() + 1;
			}
			records.push_back(Record{key, key * 2, 0, 0});
			height_ = depth > height_ ? depth : height_;
		}
		count_ = records.size();

		Page page{};
		put_u64(page, 0, count_);
		pager_.write(pager_.append(), page);
		for (std::size_t first = 0; first < records.size(); first += kRecordsPerPage) {
			page.fill(0);
			for (std::size_t i = 0; i < kRecordsPerPage && first + i < records.size(); ++i) {
				const Record& record = records[first + i];
				put_u64(page, i * kRecordSize, record.key);
				put_u64(page, i * kRecordSize + 8, record.value);
				put_u64(page, i * kRecordSize + 16, record.left);
				put_u64(page, i * kRecordSize + 24, record.right);
			}
			pager_.write(pager_.append(), page);
		}
	}

	std::optional<Value> search(Key key) {
		Page page{};
		PageId loaded = 0;
		std::uint64_t current = count_ == 0 ? 0 : 1;
		while (current != 0) {
			const PageId id = 1 + (current - 1) / kRecordsPerPage;
			if (id != loaded) {
				page = pager_.read(id);
				loaded = id;
			}
			const std::size_t offset = ((current - 1) % kRecordsPerPage) * kRecordSize;
			const Key stored = get_u64(page, offset);
			if (key == stored) {
				return get_u64(page, offset + 8);
			}
			current = get_u64(page, offset + (key < stored ? 16 : 24));
		}
		return std::nullopt;
	}

	std::uint64_t size() const { return count_; }
	// Number of nodes on the longest path from the root to a leaf.
	std::uint64_t height() const { return height_; }
	std::uint64_t page_reads() const { return pager_.reads(); }
	std::uint64_t page_count() const { return pager_.page_count(); }

private:
	Pager pager_;
	std::uint64_t count_ = 0;
	std::uint64_t height_ = 0;
};

}  // namespace btree
