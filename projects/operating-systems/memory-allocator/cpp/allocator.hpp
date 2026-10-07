#pragma once

#include <algorithm>
#include <bit>
#include <cstddef>
#include <map>
#include <optional>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

// EN: Memory allocators over a fixed arena. The arena is simulated: an allocation is just an
//     offset and a size, and no real byte is touched. What matters here is the bookkeeping,
//     that is, which parts are in use, which are free, and how the free space gets broken
//     into pieces (fragmentation) as blocks come and go.
// PT: Alocadores de memória sobre uma arena fixa. A arena é simulada: uma alocação é apenas um
//     deslocamento e um tamanho, e nenhum byte real é tocado. O que importa aqui é a
//     contabilidade, isto é, quais partes estão em uso, quais estão livres, e como o espaço
//     livre se quebra em pedaços (fragmentação) conforme os blocos entram e saem.

struct Stats {
	std::size_t arena = 0;
	/// Bytes reserved by live blocks (what the allocator handed out).
	std::size_t used = 0;
	/// Bytes the callers actually asked for.
	std::size_t requested = 0;
	std::size_t largest_free = 0;
	std::size_t free_blocks = 0;
	std::size_t live_blocks = 0;

	std::size_t free_bytes() const { return arena - used; }

	// EN: External fragmentation: free memory exists, but it is split into holes. The measure
	//     is the share of the free memory that is NOT in the largest hole. 0 means all free
	//     memory is one block, and a value near 1 means it is scattered in small holes, so a
	//     large request fails although the total free space would be enough.
	// PT: Fragmentação externa: existe memória livre, mas ela está dividida em lacunas. A medida
	//     é a parte da memória livre que NÃO está na maior lacuna. 0 significa que toda a memória
	//     livre é um bloco só, e um valor perto de 1 significa que ela está espalhada em lacunas
	//     pequenas, então um pedido grande falha embora o total livre fosse suficiente.
	double external_fragmentation() const {
		const std::size_t free = free_bytes();
		return free == 0 ? 0.0
		                 : 1.0 - static_cast<double>(largest_free) / static_cast<double>(free);
	}

	// EN: Internal fragmentation: space inside a block that the caller did not ask for. The
	//     list allocators give exactly what is asked, so they have none. The buddy system
	//     rounds every request up to a power of two and pays for it here.
	// PT: Fragmentação interna: espaço dentro de um bloco que quem pediu não solicitou. Os
	//     alocadores de lista entregam exatamente o que é pedido, então não têm nenhuma. O
	//     sistema buddy arredonda todo pedido para uma potência de dois e paga por isso aqui.
	std::size_t internal_fragmentation() const { return used - requested; }
};

struct LiveBlock {
	std::size_t offset;
	std::size_t size;
};

class Allocator {
public:
	virtual ~Allocator() = default;
	virtual std::string name() const = 0;
	/// Returns the offset of the new block, or nothing when no free block is large enough.
	virtual std::optional<std::size_t> allocate(std::size_t size) = 0;
	/// Returns false when `offset` is not the start of a live block.
	virtual bool release(std::size_t offset) = 0;
	virtual Stats stats() const = 0;
	virtual std::vector<LiveBlock> live_blocks() const = 0;
};

enum class Fit { First, Best, Worst };

// EN: The classic free-list allocator. The arena is a sequence of blocks in address order,
//     each one free or in use. Allocation picks a free block (the "hole") according to the
//     strategy and splits it. The three strategies differ only in which hole they pick:
//     first fit takes the first hole that is large enough, which is fast. Best fit takes the
//     smallest hole that is large enough, which tends to leave tiny useless leftovers. Worst
//     fit takes the largest hole, so that the leftover stays useful, but it destroys the
//     large holes that big requests need.
// PT: O alocador clássico de lista livre. A arena é uma sequência de blocos em ordem de
//     endereço, cada um livre ou em uso. A alocação escolhe um bloco livre (a "lacuna")
//     segundo a estratégia e o divide. As três estratégias só diferem em qual lacuna escolhem:
//     o first fit pega a primeira lacuna grande o bastante, o que é rápido. O best fit pega a
//     menor lacuna suficiente, o que tende a deixar sobras minúsculas e inúteis. O worst fit
//     pega a maior lacuna, para que a sobra continue útil, mas destrói as lacunas grandes de
//     que os pedidos grandes precisam.
class ListAllocator final : public Allocator {
public:
	ListAllocator(std::size_t arena, Fit fit) : arena_(arena), fit_(fit) {
		if (arena == 0) {
			throw std::invalid_argument("the arena must not be empty");
		}
		blocks_.push_back({0, arena, 0, true});
	}

	std::string name() const override {
		switch (fit_) {
			case Fit::First:
				return "first-fit";
			case Fit::Best:
				return "best-fit";
			case Fit::Worst:
				return "worst-fit";
		}
		return "unknown";
	}

	std::optional<std::size_t> allocate(std::size_t size) override {
		if (size == 0) {
			return std::nullopt;
		}
		std::optional<std::size_t> chosen;
		for (std::size_t i = 0; i < blocks_.size(); ++i) {
			const Block& block = blocks_[i];
			if (!block.free || block.size < size) {
				continue;
			}
			if (!chosen) {
				chosen = i;
				if (fit_ == Fit::First) {
					break;
				}
			} else if ((fit_ == Fit::Best && block.size < blocks_[*chosen].size) ||
			           (fit_ == Fit::Worst && block.size > blocks_[*chosen].size)) {
				chosen = i;
			}
		}
		if (!chosen) {
			return std::nullopt;
		}
		// EN: Split the hole: the first part becomes the new block and the rest, if any, stays
		//     in the list as a smaller hole right after it.
		// PT: Divide a lacuna: a primeira parte vira o bloco novo, e o resto, se houver, fica na
		//     lista como uma lacuna menor logo depois dele.
		const std::size_t index = *chosen;
		const std::size_t offset = blocks_[index].offset;
		const std::size_t leftover = blocks_[index].size - size;
		blocks_[index] = {offset, size, size, false};
		if (leftover > 0) {
			blocks_.insert(blocks_.begin() + static_cast<std::ptrdiff_t>(index) + 1,
			               Block{offset + size, leftover, 0, true});
		}
		return offset;
	}

	bool release(std::size_t offset) override {
		auto it = std::lower_bound(
		    blocks_.begin(), blocks_.end(), offset,
		    [](const Block& block, std::size_t value) { return block.offset < value; });
		if (it == blocks_.end() || it->offset != offset || it->free) {
			return false;
		}
		it->free = true;
		it->requested = 0;
		// EN: Coalescing: a freed block is merged with a free neighbour on either side. Without
		//     this step the arena would end up as many small adjacent holes that can never
		//     satisfy a large request, even after everything is freed.
		// PT: Coalescência: o bloco liberado é fundido com um vizinho livre de cada lado. Sem
		//     este passo, a arena acabaria como muitas lacunas pequenas e vizinhas que nunca
		//     atenderiam a um pedido grande, mesmo depois de tudo ser liberado.
		auto next = it + 1;
		if (next != blocks_.end() && next->free) {
			it->size += next->size;
			it = blocks_.erase(next) - 1;
		}
		if (it != blocks_.begin() && (it - 1)->free) {
			(it - 1)->size += it->size;
			blocks_.erase(it);
		}
		return true;
	}

	Stats stats() const override {
		Stats stats;
		stats.arena = arena_;
		for (const Block& block : blocks_) {
			if (block.free) {
				stats.free_blocks += 1;
				stats.largest_free = std::max(stats.largest_free, block.size);
			} else {
				stats.live_blocks += 1;
				stats.used += block.size;
				stats.requested += block.requested;
			}
		}
		return stats;
	}

	std::vector<LiveBlock> live_blocks() const override {
		std::vector<LiveBlock> live;
		for (const Block& block : blocks_) {
			if (!block.free) {
				live.push_back({block.offset, block.size});
			}
		}
		return live;
	}

private:
	struct Block {
		std::size_t offset;
		std::size_t size;
		std::size_t requested;
		bool free;
	};

	std::size_t arena_;
	Fit fit_;
	std::vector<Block> blocks_;
};

// EN: The buddy system. Every block size is a power of two. A request is rounded up to the
//     next power of two, and a larger free block is split in halves (two "buddies") until the
//     right size appears. When a block is freed and its buddy is free too, the two merge back
//     into the block they came from, and so on upwards.
//     The buddy of a block is found with one XOR: for a block of size s at offset o, the buddy
//     is at o XOR s. That makes splitting and merging very fast. The price is internal
//     fragmentation: a request of 70 bytes takes a block of 128.
// PT: O sistema buddy. Todo tamanho de bloco é uma potência de dois. O pedido é arredondado para
//     a próxima potência de dois, e um bloco livre maior é dividido em metades (dois "buddies",
//     ou companheiros) até aparecer o tamanho certo. Quando um bloco é liberado e seu companheiro
//     também está livre, os dois se fundem de volta no bloco de onde vieram, e assim por diante.
//     O companheiro de um bloco é achado com um XOR: para um bloco de tamanho s no deslocamento
//     o, o companheiro está em o XOR s. Isso torna a divisão e a fusão muito rápidas. O preço é
//     a fragmentação interna: um pedido de 70 bytes ocupa um bloco de 128.
class BuddyAllocator final : public Allocator {
public:
	BuddyAllocator(std::size_t arena, std::size_t min_block) : arena_(arena) {
		if (!std::has_single_bit(arena) || !std::has_single_bit(min_block) || min_block > arena) {
			throw std::invalid_argument("arena and min_block must be powers of two");
		}
		min_order_ = order_of(min_block);
		max_order_ = order_of(arena);
		free_.resize(max_order_ + 1);
		free_[max_order_].insert(0);
	}

	std::string name() const override { return "buddy"; }

	std::optional<std::size_t> allocate(std::size_t size) override {
		if (size == 0 || size > arena_) {
			return std::nullopt;
		}
		const std::size_t wanted = std::max(min_order_, order_of(std::bit_ceil(size)));
		std::size_t order = wanted;
		while (order <= max_order_ && free_[order].empty()) {
			order += 1;
		}
		if (order > max_order_) {
			return std::nullopt;
		}
		const std::size_t offset = *free_[order].begin();
		free_[order].erase(free_[order].begin());
		// EN: Split down to the wanted size. Each split keeps the lower half and puts the upper
		//     half, its buddy, on the free list of the smaller order.
		// PT: Divide até o tamanho desejado. Cada divisão fica com a metade de baixo e coloca a
		//     metade de cima, sua companheira, na lista livre da ordem menor.
		while (order > wanted) {
			order -= 1;
			free_[order].insert(offset + (std::size_t{1} << order));
		}
		live_[offset] = {wanted, size};
		return offset;
	}

	bool release(std::size_t offset) override {
		const auto found = live_.find(offset);
		if (found == live_.end()) {
			return false;
		}
		std::size_t order = found->second.order;
		live_.erase(found);
		// EN: Coalescing: while the buddy is free, remove it from its list and merge, which
		//     gives a block of the next order starting at the lower of the two offsets.
		// PT: Coalescência: enquanto o companheiro está livre, ele é removido da sua lista e
		//     fundido, o que dá um bloco da ordem seguinte começando no menor dos dois
		//     deslocamentos.
		while (order < max_order_) {
			const std::size_t buddy = offset ^ (std::size_t{1} << order);
			const auto it = free_[order].find(buddy);
			if (it == free_[order].end()) {
				break;
			}
			free_[order].erase(it);
			offset = std::min(offset, buddy);
			order += 1;
		}
		free_[order].insert(offset);
		return true;
	}

	Stats stats() const override {
		Stats stats;
		stats.arena = arena_;
		stats.live_blocks = live_.size();
		for (const auto& [offset, block] : live_) {
			stats.used += std::size_t{1} << block.order;
			stats.requested += block.requested;
		}
		for (std::size_t order = min_order_; order <= max_order_; ++order) {
			stats.free_blocks += free_[order].size();
			if (!free_[order].empty()) {
				stats.largest_free = std::size_t{1} << order;
			}
		}
		return stats;
	}

	std::vector<LiveBlock> live_blocks() const override {
		std::vector<LiveBlock> live;
		for (const auto& [offset, block] : live_) {
			live.push_back({offset, std::size_t{1} << block.order});
		}
		return live;
	}

private:
	struct Live {
		std::size_t order;
		std::size_t requested;
	};

	static std::size_t order_of(std::size_t power_of_two) {
		return static_cast<std::size_t>(std::countr_zero(power_of_two));
	}

	std::size_t arena_;
	std::size_t min_order_ = 0;
	std::size_t max_order_ = 0;
	/// `free_[k]` holds the offsets of the free blocks of size 2^k, in address order.
	std::vector<std::set<std::size_t>> free_;
	std::map<std::size_t, Live> live_;
};
