"""EN: In-memory tables with selection and projection, the two simplest relational operators.

PT: Tabelas em memória com seleção e projeção, os dois operadores relacionais mais simples.

ES: Tablas en memoria con selección y proyección, los dos operadores relacionales más simples.
"""

import operator
from collections.abc import Callable
from dataclasses import dataclass, field

Value = int | str
Row = tuple[Value, ...]

# EN: The comparison operators a selection accepts, written as in SQL.
# PT: Os operadores de comparação que uma seleção aceita, escritos como no SQL.
# ES: Los operadores de comparación que acepta una selección, escritos como en SQL.
OPERATORS: dict[str, Callable[[Value, Value], bool]] = {
    "=": operator.eq,
    "<>": operator.ne,
    "<": operator.lt,
    "<=": operator.le,
    ">": operator.gt,
    ">=": operator.ge,
}


@dataclass(frozen=True)
class Predicate:
    """EN: A selection condition of the form `column op constant`, such as `salary > 4000`.

    PT: Uma condição de seleção da forma `coluna op constante`, como `salary > 4000`.

    ES: Una condición de selección de la forma `columna op constante`, como `salary > 4000`.
    """

    column: str
    op: str
    value: Value


@dataclass
class Table:
    """EN: A heading (column names) and a body (rows). Rows live in a list, so unlike a
    mathematical relation this table has an order and may hold duplicate rows. That is the SQL
    view of a table, and it is why `project` has a `distinct` flag.

    PT: Um cabeçalho (nomes das colunas) e um corpo (linhas). As linhas ficam em uma lista,
    então, diferente de uma relação matemática, esta tabela tem ordem e pode ter linhas
    repetidas. Essa é a visão de tabela do SQL, e é por isso que `project` tem a opção
    `distinct`.

    ES: Un encabezado (nombres de las columnas) y un cuerpo (filas). Las filas se guardan en una
    lista, así que, a diferencia de una relación matemática, esta tabla tiene orden y puede
    tener filas repetidas. Esa es la visión de tabla de SQL, y por eso `project` tiene la
    opción `distinct`.
    """

    columns: list[str]
    rows: list[Row] = field(default_factory=list)

    def insert(self, row: Row) -> None:
        if len(row) != len(self.columns):
            raise ValueError(f"row has {len(row)} values, table has {len(self.columns)} columns")
        self.rows.append(row)

    def column_index(self, name: str) -> int:
        if name not in self.columns:
            raise KeyError(f"unknown column: {name}")
        return self.columns.index(name)

    def select(self, predicate: Predicate) -> "Table":
        # EN: Selection (restriction, the sigma of relational algebra): keeps the rows for which
        #     the condition is true and keeps every column. It is the WHERE clause of SQL. With
        #     no index, the only way to answer it is to look at every row once: O(n).
        # PT: Seleção (restrição, o sigma da álgebra relacional): mantém as linhas em que a
        #     condição é verdadeira e mantém todas as colunas. É a cláusula WHERE do SQL. Sem
        #     índice, o único jeito de responder é olhar cada linha uma vez: O(n).
        # ES: Selección (restricción, el sigma del álgebra relacional): conserva las filas en que
        #     la condición es verdadera y conserva todas las columnas. Es la cláusula WHERE de
        #     SQL. Sin índice, la única forma de responder es mirar cada fila una vez: O(n).
        if predicate.op not in OPERATORS:
            raise ValueError(f"unknown operator: {predicate.op}")
        index = self.column_index(predicate.column)
        test = OPERATORS[predicate.op]
        rows = [row for row in self.rows if test(row[index], predicate.value)]
        return Table(list(self.columns), rows)

    def project(self, columns: list[str], distinct: bool = False) -> "Table":
        # EN: Projection (the pi of relational algebra): keeps the requested columns of every
        #     row. Dropping columns can make different rows equal. Relational algebra removes
        #     those duplicates because a relation is a set, while SQL keeps them unless DISTINCT
        #     is written. `distinct` chooses between the two; a set remembers the rows already
        #     produced, so removing duplicates stays O(n) on average.
        # PT: Projeção (o pi da álgebra relacional): mantém as colunas pedidas de cada linha.
        #     Descartar colunas pode tornar iguais linhas que eram diferentes. A álgebra
        #     relacional remove essas duplicatas porque uma relação é um conjunto, enquanto o
        #     SQL as mantém a menos que se escreva DISTINCT. `distinct` escolhe entre os dois; um
        #     conjunto lembra as linhas já produzidas, então remover duplicatas continua O(n) em
        #     média.
        # ES: Proyección (el pi del álgebra relacional): conserva las columnas pedidas de cada
        #     fila. Descartar columnas puede volver iguales filas que eran distintas. El álgebra
        #     relacional elimina esos duplicados porque una relación es un conjunto, mientras que
        #     SQL los conserva a menos que se escriba DISTINCT. `distinct` elige entre los dos; un
        #     conjunto recuerda las filas ya producidas, así que eliminar duplicados sigue siendo
        #     O(n) en promedio.
        indexes = [self.column_index(name) for name in columns]
        seen: set[Row] = set()
        rows: list[Row] = []
        for row in self.rows:
            projected = tuple(row[index] for index in indexes)
            if distinct:
                if projected in seen:
                    continue
                seen.add(projected)
            rows.append(projected)
        return Table(list(columns), rows)

    def sorted_text_rows(self) -> list[list[str]]:
        # EN: Rows as sorted text, so two results can be compared without depending on row
        #     order. A query result has no guaranteed order unless ORDER BY is used.
        # PT: Linhas como texto ordenado, para comparar dois resultados sem depender da ordem
        #     das linhas. O resultado de uma consulta não tem ordem garantida sem ORDER BY.
        # ES: Filas como texto ordenado, para comparar dos resultados sin depender del orden de
        #     las filas. El resultado de una consulta no tiene orden garantizado sin ORDER BY.
        return sorted([str(value) for value in row] for row in self.rows)
