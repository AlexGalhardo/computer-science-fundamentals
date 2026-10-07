import pytest

from adders import add, add_all_pairs, full_adder, half_adder, ripple_carry_adder


def test_half_adder_truth_table() -> None:
    rows = [(a, b, *half_adder(a, b)) for a in (0, 1) for b in (0, 1)]
    assert rows == [(0, 0, 0, 0), (0, 1, 1, 0), (1, 0, 1, 0), (1, 1, 0, 1)]


def test_full_adder_outputs_spell_the_number_of_ones() -> None:
    for a in (0, 1):
        for b in (0, 1):
            for carry_in in (0, 1):
                total, carry = full_adder(a, b, carry_in)
                assert 2 * carry + total == a + b + carry_in


def test_bit_parallel_adder_agrees_with_native_addition_for_all_65536_pairs() -> None:
    # EN: Acceptance criterion MP-DL-1.3, checked a second way: one pass of the gate network
    #     over 16 columns of 65,536 bits each produces every sum at once.
    # PT: Critério de aceite MP-DL-1.3, conferido de um segundo modo: uma passada da rede de
    #     portas sobre 16 colunas de 65.536 bits cada produz todas as somas de uma vez.
    results = add_all_pairs(8)
    assert len(results) == 65536
    assert all(results[(a << 8) | b] == a + b for a in range(256) for b in range(256))


def test_one_pair_at_a_time_agrees_with_the_bit_parallel_pass() -> None:
    results = add_all_pairs(4)
    for a in range(16):
        for b in range(16):
            total, carry = add(a, b, width=4)
            assert total + 16 * carry == results[(a << 4) | b] == a + b


def test_carry_in_adds_one() -> None:
    # 5 + 12 + 1 = 18 = 1 0010, bits least significant first.
    assert ripple_carry_adder([1, 0, 1, 0], [0, 0, 1, 1], 1) == ([0, 1, 0, 0], 1)


def test_invalid_operands_are_rejected() -> None:
    with pytest.raises(ValueError, match="same number of bits"):
        ripple_carry_adder([0, 1], [1])
    with pytest.raises(ValueError, match="unsigned bits"):
        add(256, 0)
