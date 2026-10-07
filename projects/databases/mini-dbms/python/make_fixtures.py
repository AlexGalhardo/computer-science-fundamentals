"""EN: Writes `fixtures/sqlite_cases.tsv`: small tables, queries, and the rows SQLite returns.

The Rust tests read this file, because Rust has no SQLite in its standard library. SQLite is the
reference: the expected rows are never typed by hand, they are whatever `sqlite3` answered.
Run it with `python make_fixtures.py` after changing the tables or the queries below.

Line kinds, tab-separated:
  T <table> <column:type>...                      a table
  R <table> <value>...                            one row of it
  Q <id> <table> <column|-> <op> <constant> <projection|*> <all|distinct>
  J <id> <left table> <left column> <right table> <right column>
  E <id> <value>...                               one expected row of query or join <id>

PT: Escreve `fixtures/sqlite_cases.tsv`: tabelas pequenas, consultas e as linhas que o SQLite
devolve.

Os testes em Rust leem esse arquivo, porque o Rust não tem SQLite na biblioteca padrão. O SQLite
é a referência: as linhas esperadas nunca são digitadas à mão, são o que o `sqlite3` respondeu.
Rode com `python make_fixtures.py` depois de mudar as tabelas ou as consultas abaixo.
"""

import sqlite3
from pathlib import Path

FIXTURE_PATH = Path(__file__).resolve().parent.parent / "fixtures" / "sqlite_cases.tsv"

Column = tuple[str, str]
Row = tuple[int | str, ...]

# EN: Fake data on purpose: an employee whose department does not exist (dno 50) and a
#     department with no employees (dno 40), so joins have rows that must NOT appear.
# PT: Dados fictícios de propósito: um empregado cujo departamento não existe (dno 50) e um
#     departamento sem empregados (dno 40), para que as junções tenham linhas que NÃO devem
#     aparecer.
TABLES: dict[str, tuple[list[Column], list[Row]]] = {
    "emp": (
        [("eno", "int"), ("name", "text"), ("dno", "int"), ("salary", "int")],
        [
            (1, "Ana", 10, 5200),
            (2, "Bruno", 10, 3900),
            (3, "Carla", 20, 4700),
            (4, "Davi", 20, 4700),
            (5, "Elisa", 30, 6100),
            (6, "Fabio", 30, 3900),
            (7, "Gina", 50, 2800),
            (8, "Hugo", 10, 5200),
        ],
    ),
    "dept": (
        [("dno", "int"), ("dname", "text"), ("city", "text")],
        [
            (10, "Vendas", "Recife"),
            (20, "Pesquisa", "Curitiba"),
            (30, "Suporte", "Recife"),
            (40, "Compras", "Manaus"),
        ],
    ),
}

# (id, table, where column or None, operator, constant, projection or None, distinct)
Query = tuple[str, str, str | None, str, int | str, list[str] | None, bool]
QUERIES: list[Query] = [
    ("all-rows", "emp", None, "=", 0, None, False),
    ("salary-gt", "emp", "salary", ">", 4700, None, False),
    ("salary-ge", "emp", "salary", ">=", 4700, ["name", "salary"], False),
    ("salary-lt", "emp", "salary", "<", 3900, ["name"], False),
    ("salary-le", "emp", "salary", "<=", 3900, ["eno", "name"], False),
    ("dno-eq", "emp", "dno", "=", 10, ["name"], False),
    ("dno-ne", "emp", "dno", "<>", 10, ["name", "dno"], False),
    ("name-text-gt", "emp", "name", ">", "Davi", ["name"], False),
    ("city-eq", "dept", "city", "=", "Recife", ["dname"], False),
    ("no-match", "emp", "salary", ">", 99999, ["name"], False),
    ("project-keeps-duplicates", "emp", None, "=", 0, ["salary"], False),
    ("project-distinct", "emp", None, "=", 0, ["salary"], True),
    ("project-two-distinct", "emp", None, "=", 0, ["dno", "salary"], True),
    ("select-then-distinct", "emp", "dno", "<>", 50, ["dno"], True),
    ("project-reorders-columns", "dept", None, "=", 0, ["city", "dno"], False),
]

# (id, left table, left column, right table, right column)
JOIN_CASES: list[tuple[str, str, str, str, str]] = [
    ("emp-dept", "emp", "dno", "dept", "dno"),
    ("dept-emp", "dept", "dno", "emp", "dno"),
    ("emp-emp-salary", "emp", "salary", "emp", "salary"),
]

SQL_TYPES = {"int": "INTEGER", "text": "TEXT"}


def build_database() -> sqlite3.Connection:
    connection = sqlite3.connect(":memory:")
    for name, (columns, rows) in TABLES.items():
        declared = ", ".join(f"{column} {SQL_TYPES[kind]}" for column, kind in columns)
        connection.execute(f"CREATE TABLE {name} ({declared})")
        marks = ", ".join("?" for _ in columns)
        connection.executemany(f"INSERT INTO {name} VALUES ({marks})", rows)
    return connection


def query_sql(query: Query) -> tuple[str, list[int | str]]:
    # EN: Table and column names come from the constants above, never from user input. The
    #     compared constant still goes through a `?` placeholder, which is the habit that
    #     prevents SQL injection in real code.
    # PT: Nomes de tabela e coluna vêm das constantes acima, nunca de entrada do usuário. A
    #     constante comparada ainda passa por um marcador `?`, que é o hábito que evita injeção
    #     de SQL em código real.
    _, table, column, op, constant, projection, distinct = query
    selected = "*" if projection is None else ", ".join(projection)
    sql = f"SELECT {'DISTINCT ' if distinct else ''}{selected} FROM {table}"
    if column is None:
        return sql, []
    return f"{sql} WHERE {column} {op} ?", [constant]


def join_sql(left: str, left_column: str, right: str, right_column: str) -> str:
    return (
        f"SELECT l.*, r.* FROM {left} AS l JOIN {right} AS r ON l.{left_column} = r.{right_column}"
    )


def render() -> str:
    connection = build_database()
    lines = ["# Generated by python/make_fixtures.py from SQLite. Do not edit by hand."]
    for name, (columns, rows) in TABLES.items():
        lines.append("\t".join(["T", name, *(f"{column}:{kind}" for column, kind in columns)]))
        lines.extend("\t".join(["R", name, *map(str, row)]) for row in rows)
    for query in QUERIES:
        identifier, table, column, op, constant, projection, distinct = query
        lines.append(
            "\t".join(
                [
                    "Q",
                    identifier,
                    table,
                    column or "-",
                    op,
                    str(constant),
                    "*" if projection is None else ",".join(projection),
                    "distinct" if distinct else "all",
                ]
            )
        )
        sql, parameters = query_sql(query)
        for row in sorted(connection.execute(sql, parameters).fetchall(), key=repr):
            lines.append("\t".join(["E", identifier, *map(str, row)]))
    for identifier, left, left_column, right, right_column in JOIN_CASES:
        lines.append("\t".join(["J", identifier, left, left_column, right, right_column]))
        sql = join_sql(left, left_column, right, right_column)
        for row in sorted(connection.execute(sql).fetchall(), key=repr):
            lines.append("\t".join(["E", identifier, *map(str, row)]))
    connection.close()
    return "\n".join(lines) + "\n"


def main() -> None:
    FIXTURE_PATH.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE_PATH.write_text(render(), encoding="utf-8", newline="\n")
    print(f"wrote {FIXTURE_PATH}")


if __name__ == "__main__":
    main()
