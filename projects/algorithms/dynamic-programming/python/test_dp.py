"""Same checks as the TypeScript tests: known answers, 200 random cases, call counts.

EN: The naive version is the specification. The memoised and the tabulated versions are only
    faster ways to compute the same answer, and the tests hold them to that.
PT: A versão ingênua é a especificação. A memoizada e a tabulada são só formas mais rápidas de
    calcular a mesma resposta, e os testes cobram isso delas.
ES: La versión ingenua es la especificación. La memoizada y la tabulada son solo formas más
    rápidas de calcular la misma respuesta, y las pruebas se lo exigen.
"""

import pytest

import dp
from problems import DOCUMENTED_SIZE, PROBLEMS, knapsack_instance, lcs_instance

CASES = 200


def test_knapsack_known_answer() -> None:
    items = [dp.Item(3, 2), dp.Item(4, 3), dp.Item(5, 4), dp.Item(6, 5)]
    assert dp.knapsack_naive(items, 5, dp.Counter()) == 7
    assert dp.knapsack_memo(items, 5, dp.Counter()) == 7
    assert dp.knapsack_tab(items, 5) == 7
    assert dp.knapsack_table(items, 5)[-1] == [0, 0, 3, 4, 5, 7]
    assert dp.knapsack_tab([], 10) == 0


def test_lcs_known_answer() -> None:
    assert dp.lcs_naive("BANANA", "ATANA", dp.Counter()) == 4
    assert dp.lcs_memo("BANANA", "ATANA", dp.Counter()) == 4
    assert dp.lcs_tab("BANANA", "ATANA") == 4
    assert dp.lcs_tab("", "ABC") == 0


def test_coin_change_known_answer() -> None:
    assert dp.coin_change_naive([1, 3, 4], 6, dp.Counter()) == 2
    assert dp.coin_change_memo([1, 3, 4], 6, dp.Counter()) == 2
    assert dp.coin_change_tab([1, 3, 4], 6) == 2
    assert dp.coin_change_table([1, 3, 4], 6) == [0, 1, 2, 1, 1, 2, 2]
    # EN: 7 cannot be made with coins of 2 and 4: every sum of them is even.
    # PT: 7 não pode ser formado com moedas de 2 e 4: toda soma delas é par.
    # ES: 7 no se puede formar con monedas de 2 y 4: toda suma de ellas es par.
    assert dp.coin_change_naive([2, 4], 7, dp.Counter()) == -1
    assert dp.coin_change_memo([2, 4], 7, dp.Counter()) == -1
    assert dp.coin_change_tab([2, 4], 7) == -1


def test_knapsack_versions_agree_on_random_cases() -> None:
    for seed in range(1, CASES + 1):
        items, capacity = knapsack_instance(1 + seed % 14, seed)
        expected = dp.knapsack_naive(items, capacity, dp.Counter())
        assert dp.knapsack_memo(items, capacity, dp.Counter()) == expected
        assert dp.knapsack_tab(items, capacity) == expected


def test_lcs_versions_agree_on_random_cases() -> None:
    for seed in range(1, CASES + 1):
        a, b = lcs_instance(seed % 10, seed)
        shorter = b[: seed % 7]
        expected = dp.lcs_naive(a, shorter, dp.Counter())
        assert dp.lcs_memo(a, shorter, dp.Counter()) == expected
        assert dp.lcs_tab(a, shorter) == expected


def test_coin_change_versions_agree_on_random_cases() -> None:
    for seed in range(1, CASES + 1):
        step = dp.lehmer(seed)
        coins = sorted({2 + step() % 4, 3 + step() % 5, 5 + step() % 7})
        amount = step() % 26
        expected = dp.coin_change_naive(coins, amount, dp.Counter())
        assert dp.coin_change_memo(coins, amount, dp.Counter()) == expected
        assert dp.coin_change_tab(coins, amount) == expected


# EN: Answers of the TypeScript reference for the documented sizes. Equal numbers here prove
#     that both languages build the same instances and agree on the result.
# PT: Respostas da referência em TypeScript para os tamanhos documentados. Números iguais aqui
#     provam que as duas linguagens montam as mesmas instâncias e concordam no resultado.
# ES: Respuestas de la referencia en TypeScript para los tamaños documentados. Números iguales aquí
#     prueban que los dos lenguajes construyen las mismas instancias y coinciden en el resultado.
TYPESCRIPT_CALLS = {"knapsack": (734544, 2380), "lcs": (117808, 198), "coins": (2550408, 86)}


@pytest.mark.parametrize("name", PROBLEMS)
def test_naive_makes_100_times_more_calls_than_memo(name: str) -> None:
    n = DOCUMENTED_SIZE[name]
    naive, memo = dp.Counter(), dp.Counter()
    answer = PROBLEMS[name]["naive"](n, naive, 1)
    assert PROBLEMS[name]["memo"](n, memo, 1) == answer
    assert PROBLEMS[name]["tab"](n, dp.Counter(), 1) == answer
    assert naive.calls >= 100 * memo.calls
    assert (naive.calls, memo.calls) == TYPESCRIPT_CALLS[name]
