"""Truth tables computed for every row at once.

EN: The TypeScript version simulates the circuit one row at a time. Python integers have no
    size limit, so here a whole column of the truth table is ONE integer: bit r of the integer
    is the value of the signal in row r. A gate then processes all rows with a single `&`, `|`
    or `^`. This is called bit-parallel simulation, and it is how fast logic simulators work.

PT: A versão em TypeScript simula o circuito uma linha por vez. Os inteiros do Python não têm
    limite de tamanho, então aqui uma coluna inteira da tabela-verdade é UM inteiro: o bit r do
    inteiro é o valor do sinal na linha r. Uma porta processa então todas as linhas com um único
    `&`, `|` ou `^`. Isso se chama simulação bit-paralela, e é como funcionam os simuladores
    lógicos rápidos.

ES: La versión en TypeScript simula el circuito una fila a la vez. Los enteros de Python no
    tienen límite de tamaño, así que aquí una columna entera de la tabla de verdad es UN entero:
    el bit r del entero es el valor de la señal en la fila r. Una compuerta procesa entonces
    todas las filas con un solo `&`, `|` o `^`. Esto se llama simulación bit-paralela, y es como
    funcionan los simuladores lógicos rápidos.
"""

import ast
from dataclasses import dataclass


def all_ones(variable_count: int) -> int:
    """Column of the constant 1: one bit set for each of the 2^n rows."""
    return (1 << (1 << variable_count)) - 1


def variable_column(index: int, variable_count: int) -> int:
    """Column of the input variable at `index` (0 is the most significant bit of the row).

    EN: In row r, variable `index` holds bit (n - 1 - index) of r. For 3 variables the columns
        are the familiar 00001111, 00110011 and 01010101 patterns, read from row 0 to row 7.
    PT: Na linha r, a variável `index` vale o bit (n - 1 - index) de r. Com 3 variáveis as
        colunas são os padrões conhecidos 00001111, 00110011 e 01010101, lidos da linha 0 à 7.
    ES: En la fila r, la variable `index` vale el bit (n - 1 - index) de r. Con 3 variables las
        columnas son los patrones conocidos 00001111, 00110011 y 01010101, leídos de la fila 0
        a la 7.
    """
    shift = variable_count - 1 - index
    column = 0
    for row in range(1 << variable_count):
        if (row >> shift) & 1:
            column |= 1 << row
    return column


@dataclass(frozen=True)
class TruthTable:
    variables: tuple[str, ...]
    column: int

    @property
    def outputs(self) -> str:
        """Output of each row as text, from row 0 (all inputs 0) to the last row."""
        rows = 1 << len(self.variables)
        return "".join("1" if (self.column >> row) & 1 else "0" for row in range(rows))

    @property
    def minterms(self) -> list[int]:
        """Row numbers where the output is 1."""
        return [row for row, bit in enumerate(self.outputs) if bit == "1"]

    def format(self, output_name: str = "F") -> str:
        count = len(self.variables)
        header = f"{' '.join(self.variables)} | {output_name}"
        lines = [header, "-" * len(header)]
        for row, bit in enumerate(self.outputs):
            cells = [
                str((row >> (count - 1 - index)) & 1).ljust(len(name))
                for index, name in enumerate(self.variables)
            ]
            lines.append(f"{' '.join(cells)} | {bit}")
        return "\n".join(lines)


def parse(text: str) -> ast.expr:
    """Parses a Boolean expression written with Python's own operators: ~ & ^ |.

    EN: Python already has a parser with the right priorities (~ first, then &, then ^, then |),
        so no parser is written here: `ast.parse` returns the tree. Only the node kinds of a
        Boolean expression are accepted, and nothing is ever executed with `eval`.
    PT: O Python já tem um parser com as prioridades certas (~ primeiro, depois &, depois ^,
        depois |), então nenhum parser é escrito aqui: `ast.parse` devolve a árvore. Só os tipos
        de nó de uma expressão booleana são aceitos, e nada é executado com `eval`.
    ES: Python ya tiene un parser con las prioridades correctas (~ primero, luego &, luego ^,
        luego |), así que aquí no se escribe ningún parser: `ast.parse` devuelve el árbol. Solo
        se aceptan los tipos de nodo de una expresión booleana, y nunca se ejecuta nada con
        `eval`.
    """
    try:
        tree = ast.parse(text.strip(), mode="eval").body
    except SyntaxError as error:
        raise ValueError(f"not a valid expression: {text!r}") from error
    _check(tree)
    return tree


def _check(node: ast.expr) -> None:
    if isinstance(node, ast.Name):
        return
    if isinstance(node, ast.Constant) and node.value in (0, 1) and type(node.value) is int:
        return
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Invert):
        _check(node.operand)
        return
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.BitAnd | ast.BitOr | ast.BitXor):
        _check(node.left)
        _check(node.right)
        return
    raise ValueError(f"unsupported syntax: {ast.unparse(node)}")


def variables_of(tree: ast.expr) -> tuple[str, ...]:
    """Variable names of the expression, in alphabetical order."""
    return tuple(sorted({node.id for node in ast.walk(tree) if isinstance(node, ast.Name)}))


def evaluate(tree: ast.expr, columns: dict[str, int], ones: int) -> int:
    """Computes the output column of the expression from the input columns.

    EN: Every operation acts on all rows at once. NOT cannot be Python's `~`, which would give
        a negative number: inverting is XOR with the all-ones column, so the result keeps
        exactly one bit per row.
    PT: Toda operação age em todas as linhas de uma vez. O NOT não pode ser o `~` do Python, que
        daria um número negativo: inverter é fazer XOR com a coluna de uns, e assim o resultado
        mantém exatamente um bit por linha.
    ES: Toda operación actúa sobre todas las filas a la vez. El NOT no puede ser el `~` de
        Python, que daría un número negativo: invertir es hacer XOR con la columna de unos, y
        así el resultado mantiene exactamente un bit por fila.
    """
    if isinstance(tree, ast.Name):
        if tree.id not in columns:
            raise ValueError(f"no column for variable {tree.id!r}")
        return columns[tree.id]
    if isinstance(tree, ast.Constant):
        return ones if tree.value == 1 else 0
    if isinstance(tree, ast.UnaryOp):
        return evaluate(tree.operand, columns, ones) ^ ones
    if isinstance(tree, ast.BinOp):
        left = evaluate(tree.left, columns, ones)
        right = evaluate(tree.right, columns, ones)
        if isinstance(tree.op, ast.BitAnd):
            return left & right
        if isinstance(tree.op, ast.BitOr):
            return left | right
        return left ^ right
    raise ValueError(f"unsupported syntax: {ast.unparse(tree)}")


def truth_table(text: str, variables: tuple[str, ...] | None = None) -> TruthTable:
    """Truth table of an expression. The first variable is the most significant bit of the row."""
    tree = parse(text)
    names = variables if variables is not None else variables_of(tree)
    columns = {name: variable_column(index, len(names)) for index, name in enumerate(names)}
    return TruthTable(names, evaluate(tree, columns, all_ones(len(names))))
