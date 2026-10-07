import random

import pytest

from logic import truth_table
from quine_mccluskey import find_prime_implicants, minimise, to_expression

NAMES = ("A", "B", "C", "D", "E", "F")


def round_trip(
    variable_count: int, minterms: list[int], dont_cares: tuple[int, ...] = ()
) -> list[int]:
    """Minimises, writes the cover as an expression, parses it and returns its minterms."""
    variables = NAMES[:variable_count]
    result = minimise(variable_count, minterms, dont_cares)
    return truth_table(to_expression(result.cover, variables), variables).minterms


# EN: Acceptance criterion MP-DL-1.2: the minimised expression is equivalent to the original
#     for every input. All 2^n rows are compared.
# PT: Critério de aceite MP-DL-1.2: a expressão minimizada é equivalente à original para toda
#     entrada. As 2^n linhas são comparadas.
def test_all_256_functions_of_three_variables() -> None:
    for code in range(256):
        minterms = [row for row in range(8) if (code >> row) & 1]
        assert round_trip(3, minterms) == minterms


def test_random_functions_of_four_to_six_variables() -> None:
    source = random.Random(2026)
    for round_number in range(300):
        variable_count = 4 + round_number % 3
        density = source.uniform(0.15, 0.85)
        minterms = [row for row in range(1 << variable_count) if source.random() < density]
        assert round_trip(variable_count, minterms) == minterms


def test_dont_cares_are_free_and_required_rows_are_exact() -> None:
    source = random.Random(7)
    for round_number in range(300):
        variable_count = 3 + round_number % 3
        minterms: list[int] = []
        dont_cares: list[int] = []
        for row in range(1 << variable_count):
            draw = source.random()
            if draw < 0.35:
                minterms.append(row)
            elif draw < 0.55:
                dont_cares.append(row)
        produced = round_trip(variable_count, minterms, tuple(dont_cares))
        assert [row for row in produced if row not in dont_cares] == minterms


@pytest.mark.parametrize(
    ("variable_count", "minterms", "dont_cares", "expected"),
    [
        (3, [0, 2, 4, 5, 6], (), "A & ~B | ~C"),
        (3, [1, 3, 5, 6, 7], (), "A & B | C"),
        (3, [1, 3, 7], (), "~A & C | B & C"),
        (3, [1, 3, 7], (5,), "C"),
        (4, [0, 2, 5, 7, 8, 10, 13, 15], (), "~B & ~D | B & D"),
        (4, [0, 1, 2, 5, 8, 9, 10], (), "~A & ~C & D | ~B & ~C | ~B & ~D"),
        (3, [], (), "0"),
        (3, list(range(8)), (), "1"),
    ],
)
def test_minimal_results_known_from_the_karnaugh_map(
    variable_count: int, minterms: list[int], dont_cares: tuple[int, ...], expected: str
) -> None:
    result = minimise(variable_count, minterms, dont_cares)
    assert to_expression(result.cover, NAMES[:variable_count]) == expected


def test_cyclic_map_without_essential_prime_implicants() -> None:
    result = minimise(3, [0, 1, 2, 5, 6, 7])
    assert len(result.prime_implicants) == 6
    assert result.essential == ()
    assert len(result.cover) == 3
    assert sum(term.literal_count(3) for term in result.cover) == 6


def test_prime_implicants_cover_only_terms_of_the_function() -> None:
    minterms = [0, 1, 2, 5, 8, 9, 10]
    for prime in find_prime_implicants(minterms):
        assert all(row in minterms for row in range(16) if prime.covers(row))


def test_terms_out_of_range_are_rejected() -> None:
    with pytest.raises(ValueError, match="does not fit"):
        minimise(3, [8])
