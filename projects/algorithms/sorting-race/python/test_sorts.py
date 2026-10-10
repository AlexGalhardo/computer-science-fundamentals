"""Same six cases as the TypeScript reference, for every algorithm.

EN: Here the oracle is the library `sorted`: equal to it means ordered and a permutation of
    the input. The algorithms themselves never call a library sort.
PT: Aqui o oráculo é o `sorted` da biblioteca: ser igual a ele significa estar em ordem e ser
    uma permutação da entrada. Os algoritmos em si nunca chamam uma ordenação de biblioteca.
ES: Aquí el oráculo es el `sorted` de la biblioteca: ser igual a él significa estar en orden y ser
    una permutación de la entrada. Los algoritmos en sí nunca llaman a una ordenación de biblioteca.
"""

import pytest

from sorts import SORTS, SortFunction

MAX_VALUE = 2**31 - 1


def random_values(n: int, seed: int) -> list[int]:
    # EN: Linear congruential generator with a fixed seed, so the test is reproducible.
    # PT: Gerador congruente linear com semente fixa, para o teste ser reproduzível.
    # ES: Generador congruencial lineal con semilla fija, para que la prueba sea reproducible.
    values = []
    state = seed
    for _ in range(n):
        state = (state * 1103515245 + 12345) % 2**31
        values.append(state)
    return values


CASES: dict[str, list[int]] = {
    "empty": [],
    "single element": [42],
    "sorted": [1, 2, 3, 4, 5, 6, 7, 8],
    "reversed": [8, 7, 6, 5, 4, 3, 2, 1],
    "duplicated": [5, 3, 5, 1, 3, 3, 0, MAX_VALUE, 5, 0, MAX_VALUE],
    "random": random_values(1000, 7),
}


@pytest.mark.parametrize("sort", SORTS.values(), ids=SORTS.keys())
@pytest.mark.parametrize("values", CASES.values(), ids=CASES.keys())
def test_sorts(sort: SortFunction, values: list[int]) -> None:
    before = list(values)
    assert sort(values) == sorted(values)
    assert values == before
