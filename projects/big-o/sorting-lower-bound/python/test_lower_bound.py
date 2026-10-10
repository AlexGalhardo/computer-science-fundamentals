import math

import pytest

from demo import render_markdown
from lower_bound import (
    COMPARISON_SORTS,
    Counter,
    Key,
    best_case,
    counting_sort,
    exhaustive,
    linear_sorts,
    log2_factorial,
    measure,
    minimum_comparisons,
    radix_sort,
    random_experiment,
    random_inputs,
)

N = 1000
SEED = 20261007


def test_the_key_counts_every_comparison_operator() -> None:
    counter = Counter()
    one, two = Key(1, counter), Key(2, counter)
    assert one < two
    assert one <= two
    assert two > one
    assert two >= one
    assert one != two
    assert counter.comparisons == 5


def test_reading_a_key_is_not_a_comparison() -> None:
    counter = Counter()
    assert Key(7, counter).value == 7
    assert counter.comparisons == 0


@pytest.mark.parametrize("name", COMPARISON_SORTS)
def test_comparison_sorts_sort(name: str) -> None:
    result, comparisons = measure(COMPARISON_SORTS[name], [5, 3, 8, 1, 9, 2, 7, 3])
    assert result == [1, 2, 3, 3, 5, 7, 8, 9]
    assert comparisons > 0
    assert measure(COMPARISON_SORTS[name], []) == ([], 0)


def test_minimum_comparisons_is_the_exact_ceiling() -> None:
    assert [minimum_comparisons(n) for n in range(1, 7)] == [0, 1, 3, 5, 7, 10]
    assert minimum_comparisons(N) == math.ceil(log2_factorial(N))
    assert log2_factorial(4) == pytest.approx(math.log2(24))


# EN: The theorem, checked on every permutation: the worst case is at least ceil(lg n!) and the
#     average is at least lg n!. This also holds for the built-in sort, which we did not write.
# PT: O teorema, conferido em todas as permutações: o pior caso é pelo menos ceil(lg n!) e a
#     média é pelo menos lg n!. Isso também vale para a ordenação embutida, que não escrevemos.
# ES: El teorema, comprobado en todas las permutaciones: el peor caso es al menos ceil(lg n!) y el
#     promedio es al menos lg n!. Esto también vale para la ordenación integrada, que no escribimos.
@pytest.mark.parametrize("n", [2, 3, 4, 5, 6, 7])
def test_worst_and_average_case_respect_the_bound(n: int) -> None:
    for row in exhaustive(n):
        assert row.sorted_inputs == math.factorial(n)
        assert row.maximum >= minimum_comparisons(n)
        assert row.mean >= log2_factorial(n) - 1e-9


def test_merge_sort_is_optimal_for_three_and_four_elements() -> None:
    assert exhaustive(3)[0].maximum == minimum_comparisons(3) == 3
    assert exhaustive(4)[0].maximum == minimum_comparisons(4) == 5


# EN: Acceptance of MP-BIGO-3.2 and 3.3 on the Python side, on 200 of the same seeded inputs:
#     comparison sorts never fall below lg(n!), counting and radix sort make zero comparisons.
# PT: Aceite de MP-BIGO-3.2 e 3.3 no lado Python, em 200 das mesmas entradas com semente:
#     ordenações por comparação nunca ficam abaixo de lg(n!), counting e radix sort fazem zero
#     comparações.
# ES: Aceptación de MP-BIGO-3.2 y 3.3 en el lado de Python, en 200 de las mismas entradas con
#     semilla: las ordenaciones por comparación nunca quedan por debajo de lg(n!), counting y
#     radix sort hacen cero comparaciones.
def test_random_inputs() -> None:
    rows = {row.algorithm: row for row in random_experiment(N, 200, SEED)}
    assert set(rows) == {"merge sort", "sorted() (Timsort)", "counting sort", "radix sort"}
    for row in rows.values():
        assert row.sorted_inputs == 200
    for name in COMPARISON_SORTS:
        assert rows[name].minimum >= log2_factorial(N)
    for name in ("counting sort", "radix sort"):
        assert rows[name].maximum == 0


def test_linear_sorts_agree_with_sorted_and_handle_duplicates() -> None:
    values = [170, 45, 75, 90, 802, 24, 2, 66, 45, 0]
    for sort in linear_sorts(1000).values():
        assert measure(sort, values) == (sorted(values), 0)
    assert measure(lambda items: radix_sort(items, 256), values) == (sorted(values), 0)


def test_linear_sorts_are_stable() -> None:
    counter = Counter()
    first, second = Key(3, counter), Key(3, counter)
    result = counting_sort([first, Key(1, counter), second], 4)
    assert result[1] is first
    assert result[2] is second


def test_keys_outside_the_range_are_refused() -> None:
    counter = Counter()
    with pytest.raises(ValueError, match="not in"):
        counting_sort([Key(5, counter)], 5)
    with pytest.raises(ValueError, match="negative"):
        radix_sort([Key(-1, counter)])


def test_the_best_case_is_far_below_the_bound() -> None:
    assert best_case(N) == N - 1
    assert best_case(N) < log2_factorial(N)


def test_inputs_are_reproducible_permutations() -> None:
    first = random_inputs(50, 3, 1)
    assert first == random_inputs(50, 3, 1)
    assert all(sorted(values) == list(range(50)) for values in first)


def test_report_has_every_section() -> None:
    markdown = render_markdown("2026-01-01T00:00:00+00:00")
    assert "### n = 4: log2(n!) = 4.58, ceil(log2 n!) = 5" in markdown
    assert "| counting sort | 0 | 0.00 | 0 | 1,000 of 1,000 |" in markdown
    assert "makes 999 comparisons" in markdown
