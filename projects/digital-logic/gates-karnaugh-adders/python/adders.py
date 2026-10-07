"""Half adder, full adder and ripple-carry adder on bit-parallel columns.

EN: The same gate network as `ts/src/adders.ts`, but each wire carries a whole column (see
    `logic.py`). Running the 8-bit adder ONCE on the 16 input columns therefore adds all
    65,536 input pairs at the same time: 8 stages of 5 gates, 40 gate operations in total.

PT: A mesma rede de portas de `ts/src/adders.ts`, mas cada fio carrega uma coluna inteira (veja
    `logic.py`). Rodar o somador de 8 bits UMA vez sobre as 16 colunas de entrada soma,
    portanto, os 65.536 pares de entrada ao mesmo tempo: 8 estágios de 5 portas, 40 operações
    de porta no total.
"""

from logic import variable_column


def half_adder(a: int, b: int) -> tuple[int, int]:
    """Returns (sum, carry): XOR is the sum bit, AND is the carry."""
    return a ^ b, a & b


def full_adder(a: int, b: int, carry_in: int) -> tuple[int, int]:
    """Two half adders and an OR that merges their carries. Returns (sum, carry-out)."""
    partial, first_carry = half_adder(a, b)
    total, second_carry = half_adder(partial, carry_in)
    return total, first_carry | second_carry


def ripple_carry_adder(a: list[int], b: list[int], carry_in: int = 0) -> tuple[list[int], int]:
    """Chains one full adder per bit. Lists are least significant bit first.

    EN: The carry-out of each stage is the carry-in of the next, more significant one.
    PT: O vai-um de saída de cada estágio é o vai-um de entrada do seguinte, mais significativo.
    """
    if len(a) != len(b):
        raise ValueError("both operands must have the same number of bits")
    total = []
    carry = carry_in
    for bit_a, bit_b in zip(a, b, strict=True):
        bit_sum, carry = full_adder(bit_a, bit_b, carry)
        total.append(bit_sum)
    return total, carry


def add(a: int, b: int, width: int = 8) -> tuple[int, int]:
    """Adds two unsigned numbers with the gate network, one pair at a time. Returns (sum, carry)."""
    if not (0 <= a < 1 << width and 0 <= b < 1 << width):
        raise ValueError(f"operands must fit in {width} unsigned bits")
    bits_a = [(a >> index) & 1 for index in range(width)]
    bits_b = [(b >> index) & 1 for index in range(width)]
    total, carry = ripple_carry_adder(bits_a, bits_b)
    return sum(bit << index for index, bit in enumerate(total)), carry


def add_all_pairs(width: int = 8) -> list[int]:
    """Adds every pair of `width`-bit numbers in one pass. Entry (a << width) | b holds a + b.

    EN: The 2 x width inputs are the variables of one big truth table with 2^(2 x width) rows,
        ordered A(msb)..A(lsb), B(msb)..B(lsb), so row number r is the pair a = r >> width,
        b = r & (2^width - 1). The outputs are width + 1 columns: the sum bits and the carry.
    PT: As 2 x width entradas são as variáveis de uma grande tabela-verdade com 2^(2 x width)
        linhas, na ordem A(msb)..A(lsb), B(msb)..B(lsb), então a linha r é o par a = r >> width,
        b = r & (2^width - 1). As saídas são width + 1 colunas: os bits de soma e o vai-um.
    """
    count = 2 * width
    # Index 0 of each list must be the least significant bit, which is the LAST variable.
    column_a = [variable_column(width - 1 - bit, count) for bit in range(width)]
    column_b = [variable_column(count - 1 - bit, count) for bit in range(width)]
    sum_columns, carry_column = ripple_carry_adder(column_a, column_b)
    rows = 1 << count
    # Each column is turned into text once, so that reading row r costs one index, not one shift
    # of a 65,536-bit integer. The text is reversed because bin() prints the highest bit first.
    outputs = [bin(column)[2:].zfill(rows)[::-1] for column in [*sum_columns, carry_column]]
    return [
        sum(int(column[row]) << weight for weight, column in enumerate(outputs))
        for row in range(rows)
    ]
