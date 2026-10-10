// EN: A well formatted file: clang-format has nothing to change here.
// PT: Um arquivo bem formatado: o clang-format não tem nada a mudar aqui.
// ES: Un archivo bien formateado: clang-format no tiene nada que cambiar aquí.
#include <numeric>
#include <vector>

int total(const std::vector<int>& prices) {
	return std::accumulate(prices.begin(), prices.end(), 0);
}
