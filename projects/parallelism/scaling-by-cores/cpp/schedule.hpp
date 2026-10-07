#pragma once

#include <algorithm>
#include <cstdint>
#include <vector>

// EN: Two ways of sharing a loop among workers. Static cuts the items into one contiguous
//     block per worker before anything runs: zero coordination, but a worker whose block is
//     cheap finishes early and sits idle. Dynamic lets every worker fetch the next small chunk
//     when it is free: a little coordination per chunk, and the load balances itself.
// PT: Duas formas de repartir um laço entre trabalhadores. Static corta os itens em um bloco
//     contíguo por trabalhador antes de qualquer execução: coordenação zero, mas o trabalhador
//     com um bloco barato termina cedo e fica ocioso. Dynamic deixa cada trabalhador buscar o
//     próximo pedaço pequeno quando fica livre: um pouco de coordenação por pedaço, e a carga
//     se equilibra sozinha.
enum class Schedule { Static, Dynamic };

// The half-open range [start, end) of items given to one worker.
struct Span {
	std::uint64_t start;
	std::uint64_t end;
};

// EN: Splits `total` items into `workers` contiguous spans whose sizes differ by at most one.
//     The first `total % workers` spans take the leftover items, so nothing is lost when the
//     division is not exact. Every item belongs to exactly one span: that is what lets the
//     workers run without locks.
// PT: Divide `total` itens em `workers` blocos contíguos cujos tamanhos diferem em no máximo
//     um. Os primeiros `total % workers` blocos ficam com os itens que sobram, então nada se
//     perde quando a divisão não é exata. Cada item pertence a exatamente um bloco: é isso que
//     deixa os trabalhadores rodarem sem travas.
inline std::vector<Span> split_static(std::uint64_t total, unsigned workers) {
	const std::uint64_t count = std::max(workers, 1U);
	const std::uint64_t base = total / count;
	const std::uint64_t extra = total % count;
	std::vector<Span> spans;
	spans.reserve(count);
	std::uint64_t start = 0;
	for (std::uint64_t index = 0; index < count; ++index) {
		const std::uint64_t end = start + base + (index < extra ? 1 : 0);
		spans.push_back({start, end});
		start = end;
	}
	return spans;
}
