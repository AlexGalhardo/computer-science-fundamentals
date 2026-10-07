#pragma once

#include <fcntl.h>
#include <unistd.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string>

namespace btree {

constexpr std::size_t kPageSize = 4096;
using PageId = std::uint64_t;
using Page = std::array<std::uint8_t, kPageSize>;

// EN: Integers are stored in little-endian order at fixed offsets, so the file has the same
//     layout whatever language or machine wrote it.
// PT: Os inteiros são guardados em ordem little-endian em posições fixas, então o arquivo tem o
//     mesmo layout seja qual for a linguagem ou a máquina que o gravou.
inline std::uint64_t get_u64(const Page& page, std::size_t offset) {
	std::uint64_t value = 0;
	for (std::size_t i = 0; i < 8; ++i) {
		value |= static_cast<std::uint64_t>(page[offset + i]) << (8 * i);
	}
	return value;
}

inline void put_u64(Page& page, std::size_t offset, std::uint64_t value) {
	for (std::size_t i = 0; i < 8; ++i) {
		page[offset + i] = static_cast<std::uint8_t>(value >> (8 * i));
	}
}

// EN: The pager is the only code that touches the file. It sees the file as an array of pages
//     of 4096 bytes, the unit a disk and an operating system really read and write, and it
//     counts every page read and written. On a disk, the number of pages read is what a search
//     costs, far more than the comparisons made in memory. There is no cache on purpose: one
//     node visited is one page read, so the counter shows the real shape of the structure.
// PT: O pager é o único código que mexe no arquivo. Ele enxerga o arquivo como um vetor de
//     páginas de 4096 bytes, a unidade que um disco e um sistema operacional realmente leem e
//     gravam, e conta cada página lida e gravada. Em disco, o número de páginas lidas é o custo
//     de uma busca, muito mais que as comparações feitas em memória. Não há cache de propósito:
//     um nó visitado é uma página lida, então o contador mostra a forma real da estrutura.
class Pager {
public:
	Pager(const std::string& path, bool create) {
		fd_ = ::open(path.c_str(), create ? (O_RDWR | O_CREAT | O_TRUNC) : O_RDWR, 0644);
		if (fd_ < 0) {
			throw std::runtime_error("pager: cannot open " + path);
		}
		const off_t size = ::lseek(fd_, 0, SEEK_END);
		page_count_ = static_cast<PageId>(size) / kPageSize;
	}

	Pager(const Pager&) = delete;
	Pager& operator=(const Pager&) = delete;

	~Pager() {
		if (fd_ >= 0) {
			::close(fd_);
		}
	}

	Page read(PageId id) {
		Page page{};
		const ssize_t done = ::pread(fd_, page.data(), kPageSize, offset_of(id));
		if (done != static_cast<ssize_t>(kPageSize)) {
			throw std::runtime_error("pager: short read of page " + std::to_string(id));
		}
		++reads_;
		return page;
	}

	void write(PageId id, const Page& page) {
		const ssize_t done = ::pwrite(fd_, page.data(), kPageSize, offset_of(id));
		if (done != static_cast<ssize_t>(kPageSize)) {
			throw std::runtime_error("pager: short write of page " + std::to_string(id));
		}
		++writes_;
		if (id >= page_count_) {
			page_count_ = id + 1;
		}
	}

	// EN: A new page is simply the next position after the end of the file.
	// PT: Uma página nova é simplesmente a próxima posição depois do fim do arquivo.
	PageId append() { return page_count_++; }

	PageId page_count() const { return page_count_; }
	std::uint64_t reads() const { return reads_; }
	std::uint64_t writes() const { return writes_; }

private:
	static off_t offset_of(PageId id) { return static_cast<off_t>(id * kPageSize); }

	int fd_ = -1;
	PageId page_count_ = 0;
	std::uint64_t reads_ = 0;
	std::uint64_t writes_ = 0;
};

}  // namespace btree
