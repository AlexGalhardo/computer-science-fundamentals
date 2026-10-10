import pytest

from logic import all_ones, parse, truth_table, variable_column, variables_of

# EN: Acceptance criterion MP-DL-1.1, in Python syntax. These are the same 20 functions and the
#     same hand-written output columns used by the TypeScript tests: row 00...0 first, first
#     variable as the most significant bit.
# PT: Critério de aceite MP-DL-1.1, na sintaxe do Python. São as mesmas 20 funções e as mesmas
#     colunas de saída escritas à mão usadas nos testes em TypeScript: linha 00...0 primeiro,
#     primeira variável como bit mais significativo.
# ES: Criterio de aceptación MP-DL-1.1, en la sintaxis de Python. Son las mismas 20 funciones y
#     las mismas columnas de salida escritas a mano usadas en las pruebas en TypeScript: primero
#     la fila 00...0, primera variable como bit más significativo.
HAND_WRITTEN: list[tuple[str, tuple[str, ...] | None, str]] = [
    ("~A", None, "10"),
    ("A & B", None, "0001"),
    ("A | B", None, "0111"),
    ("A ^ B", None, "0110"),
    ("~(A & B)", None, "1110"),
    ("~(A | B)", None, "1000"),
    ("~A | ~B", None, "1110"),
    ("~A & B | A & ~B", None, "0110"),
    ("A | ~A & B", None, "0111"),
    ("A & 1 | B & 0", None, "0011"),
    ("A & B | ~C", None, "10101011"),
    ("A & B | B & C | A & C", None, "00010111"),
    ("A ^ B ^ C", None, "01101001"),
    ("~(A | ~B & C)", None, "10110000"),
    ("A & B | ~A & C | B & C", None, "01010011"),
    ("(A | B) & (B | ~C)", None, "00111011"),
    ("~C | A & ~B", None, "10101110"),
    ("~(A & B) | C", None, "11111101"),
    ("~B & ~D | B & D", ("A", "B", "C", "D"), "1010010110100101"),
    ("A & ~B | C & (D | ~A)", None, "0011001111110001"),
]


def test_there_are_20_hand_written_tables() -> None:
    assert len(HAND_WRITTEN) == 20


@pytest.mark.parametrize(("expression", "variables", "outputs"), HAND_WRITTEN)
def test_matches_hand_written_table(
    expression: str, variables: tuple[str, ...] | None, outputs: str
) -> None:
    assert truth_table(expression, variables).outputs == outputs


def test_variable_columns_are_the_counting_patterns() -> None:
    columns = [variable_column(index, 3) for index in range(3)]
    as_text = ["".join(str((column >> row) & 1) for row in range(8)) for column in columns]
    assert as_text == ["00001111", "00110011", "01010101"]
    assert all_ones(3) == 0b11111111


def test_variables_are_sorted_and_unique() -> None:
    assert variables_of(parse("C & A | B & ~A")) == ("A", "B", "C")


def test_minterms_and_format() -> None:
    table = truth_table("A & B")
    assert table.minterms == [3]
    assert table.format() == "\n".join(
        ["A B | F", "-------", "0 0 | 0", "0 1 | 0", "1 0 | 0", "1 1 | 1"]
    )


@pytest.mark.parametrize(
    "text", ["", "A +", "A and B", "A + B", "f(A)", "A & 2", "A & True", "__import__('os')"]
)
def test_anything_that_is_not_a_boolean_expression_is_rejected(text: str) -> None:
    with pytest.raises(ValueError, match="expression|syntax"):
        parse(text)
