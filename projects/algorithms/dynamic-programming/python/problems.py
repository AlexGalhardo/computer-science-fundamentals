"""Instances and the table of solvers shared by the benchmark, the demo and the tests.

EN: Each problem builds its instance from one size `n` and a seed, exactly as `ts/src/problems.ts`
    does, so the two languages solve the same instances and must print the same answers.
PT: Cada problema monta sua instância a partir de um tamanho `n` e de uma semente, exatamente
    como `ts/src/problems.ts`, então as duas linguagens resolvem as mesmas instâncias e precisam
    imprimir as mesmas respostas.
ES: Cada problema construye su instancia a partir de un tamaño `n` y una semilla, exactamente
    como `ts/src/problems.ts`, así que los dos lenguajes resuelven las mismas instancias y deben
    imprimir las mismas respuestas.
"""

from collections.abc import Callable

import dp

COINS = (1, 3, 4)
ALPHABET = "ACGT"
VERSIONS = ("naive", "memo", "tab")

Solver = Callable[[int, dp.Counter, int], int]


def knapsack_instance(n: int, seed: int = 1) -> tuple[list[dp.Item], int]:
    step = dp.lehmer(seed * 1000 + n)
    items = []
    for _ in range(n):
        weight = 1 + step() % 20
        value = 1 + step() % 100
        items.append(dp.Item(value=value, weight=weight))
    return items, 5 * n


def lcs_instance(n: int, seed: int = 1) -> tuple[str, str]:
    step = dp.lehmer(seed * 1000 + n)
    a = "".join(ALPHABET[step() % 4] for _ in range(n))
    b = "".join(ALPHABET[step() % 4] for _ in range(n))
    return a, b


def _knapsack(version: str) -> Solver:
    def solve(n: int, counter: dp.Counter, seed: int = 1) -> int:
        items, capacity = knapsack_instance(n, seed)
        if version == "naive":
            return dp.knapsack_naive(items, capacity, counter)
        if version == "memo":
            return dp.knapsack_memo(items, capacity, counter)
        return dp.knapsack_tab(items, capacity)

    return solve


def _lcs(version: str) -> Solver:
    def solve(n: int, counter: dp.Counter, seed: int = 1) -> int:
        a, b = lcs_instance(n, seed)
        if version == "naive":
            return dp.lcs_naive(a, b, counter)
        if version == "memo":
            return dp.lcs_memo(a, b, counter)
        return dp.lcs_tab(a, b)

    return solve


def _coins(version: str) -> Solver:
    def solve(n: int, counter: dp.Counter, seed: int = 1) -> int:
        if version == "naive":
            return dp.coin_change_naive(COINS, n, counter)
        if version == "memo":
            return dp.coin_change_memo(COINS, n, counter)
        return dp.coin_change_tab(COINS, n)

    return solve


PROBLEMS: dict[str, dict[str, Solver]] = {
    "knapsack": {version: _knapsack(version) for version in VERSIONS},
    "lcs": {version: _lcs(version) for version in VERSIONS},
    "coins": {version: _coins(version) for version in VERSIONS},
}

# EN: The input size at which the README and the tests compare call counts.
# PT: O tamanho de entrada em que o README e os testes comparam o número de chamadas.
# ES: El tamaño de entrada en el que el README y las pruebas comparan el número de llamadas.
DOCUMENTED_SIZE = {"knapsack": 20, "lcs": 12, "coins": 30}
