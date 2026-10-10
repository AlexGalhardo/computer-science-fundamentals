import random
import sqlite3

import pytest

from make_fixtures import QUERIES, TABLES, build_database, query_sql
from table import OPERATORS, Predicate, Table

NAMES = ["Ana", "Bia", "Caio", "Davi", "Eva", "Fabio"]


def random_table(generator: random.Random, rows: int) -> Table:
    # EN: Small value ranges on purpose, so equal values and duplicate projected rows are common.
    # PT: Faixas pequenas de valores de propósito, para que valores iguais e linhas projetadas
    #     repetidas sejam comuns.
    # ES: Rangos pequeños de valores a propósito, para que los valores iguales y las filas
    #     proyectadas repetidas sean comunes.
    table = Table(["id", "name", "score"])
    for row_id in range(rows):
        table.insert((row_id, generator.choice(NAMES), generator.randrange(0, 8)))
    return table


def load_into_sqlite(table: Table) -> sqlite3.Connection:
    connection = sqlite3.connect(":memory:")
    connection.execute("CREATE TABLE t (id INTEGER, name TEXT, score INTEGER)")
    connection.executemany("INSERT INTO t VALUES (?, ?, ?)", table.rows)
    return connection


def text_rows(rows: list[tuple[int | str, ...]]) -> list[list[str]]:
    return sorted([str(value) for value in row] for row in rows)


def test_selection_and_projection_equal_sqlite_on_random_tables() -> None:
    # EN: The engine and SQLite receive the same rows and the same query, and must return the
    #     same multiset of rows. Rows are compared sorted, because neither side promises an order.
    # PT: O motor e o SQLite recebem as mesmas linhas e a mesma consulta, e precisam devolver o
    #     mesmo multiconjunto de linhas. As linhas são comparadas ordenadas, porque nenhum dos
    #     dois lados promete uma ordem.
    # ES: El motor y SQLite reciben las mismas filas y la misma consulta, y deben devolver el
    #     mismo multiconjunto de filas. Las filas se comparan ordenadas, porque ninguno de los
    #     dos lados promete un orden.
    generator = random.Random(2026)
    projections = [["id", "name", "score"], ["name"], ["score"], ["score", "name"]]
    for _ in range(40):
        table = random_table(generator, generator.randrange(0, 30))
        connection = load_into_sqlite(table)
        for column, constant in (("score", generator.randrange(0, 8)), ("name", "Caio")):
            for op in OPERATORS:
                for columns in projections:
                    for distinct in (False, True):
                        ours = table.select(Predicate(column, op, constant)).project(
                            columns, distinct
                        )
                        keyword = "DISTINCT " if distinct else ""
                        sql = f"SELECT {keyword}{', '.join(columns)} FROM t WHERE {column} {op} ?"
                        theirs = connection.execute(sql, (constant,)).fetchall()
                        assert ours.sorted_text_rows() == text_rows(theirs), sql
        connection.close()


def test_fixture_queries_equal_sqlite() -> None:
    connection = build_database()
    for query in QUERIES:
        _, name, column, op, constant, projection, distinct = query
        columns, rows = TABLES[name]
        table = Table([column_name for column_name, _ in columns], list(rows))
        if column is not None:
            table = table.select(Predicate(column, op, constant))
        if projection is not None:
            table = table.project(projection, distinct)
        sql, parameters = query_sql(query)
        expected = text_rows(connection.execute(sql, parameters).fetchall())
        assert table.sorted_text_rows() == expected, sql
    connection.close()


def test_projection_keeps_duplicates_unless_distinct() -> None:
    table = Table(["sno", "city"], [(1, "Lisboa"), (2, "Porto"), (3, "Lisboa"), (4, "Faro")])
    assert len(table.project(["city"]).rows) == 4
    assert len(table.project(["city"], distinct=True).rows) == 3


def test_errors_are_reported() -> None:
    table = Table(["sno", "city"])
    with pytest.raises(ValueError, match="row has 1 values"):
        table.insert((1,))
    with pytest.raises(KeyError):
        table.project(["missing"])
    with pytest.raises(ValueError, match="unknown operator"):
        table.select(Predicate("sno", "LIKE", 1))
