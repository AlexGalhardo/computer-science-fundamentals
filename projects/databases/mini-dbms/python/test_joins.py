import random
import sqlite3

import pytest

from joins import JOINS, hash_join, materialise, nested_loop_join, sort_merge_join
from make_fixtures import FIXTURE_PATH, render
from table import Table
from workload import bench_tables, checksum


def random_table(generator: random.Random, rows: int, distinct_keys: int) -> Table:
    # EN: Few distinct keys, so keys repeat on both sides and some are missing on one side.
    # PT: Poucas chaves distintas, para que as chaves se repitam dos dois lados e algumas faltem
    #     em um dos lados.
    # ES: Pocas claves distintas, para que las claves se repitan en los dos lados y algunas
    #     falten en uno de ellos.
    table = Table(["key", "payload"])
    for _ in range(rows):
        table.insert((f"k{generator.randrange(distinct_keys)}", generator.randrange(1_000_000)))
    return table


def sqlite_join(left: Table, right: Table) -> list[list[str]]:
    connection = sqlite3.connect(":memory:")
    for name, table in (("l", left), ("r", right)):
        connection.execute(f"CREATE TABLE {name} (key TEXT, payload INTEGER)")
        connection.executemany(f"INSERT INTO {name} VALUES (?, ?)", table.rows)
    rows = connection.execute("SELECT l.*, r.* FROM l JOIN r ON l.key = r.key").fetchall()
    connection.close()
    return sorted([str(value) for value in row] for row in rows)


def test_three_joins_return_the_same_rows_as_each_other_and_as_sqlite() -> None:
    generator = random.Random(2026)
    for _ in range(200):
        distinct_keys = generator.randrange(1, 13)
        left = random_table(generator, generator.randrange(0, 40), distinct_keys)
        right = random_table(generator, generator.randrange(0, 40), distinct_keys + 3)

        nested = sorted(nested_loop_join(left, "key", right, "key"))
        assert sorted(hash_join(left, "key", right, "key")) == nested
        assert sorted(sort_merge_join(left, "key", right, "key")) == nested

        joined = materialise(left, "l", right, "r", nested)
        assert joined.columns == ["l.key", "l.payload", "r.key", "r.payload"]
        assert joined.sorted_text_rows() == sqlite_join(left, right)


@pytest.mark.parametrize("name", sorted(JOINS))
def test_join_with_an_empty_table_returns_nothing(name: str) -> None:
    full = random_table(random.Random(7), 10, 3)
    empty = Table(["key", "payload"])
    assert JOINS[name](full, "key", empty, "key") == []
    assert JOINS[name](empty, "key", full, "key") == []


def test_unknown_join_column_is_an_error() -> None:
    table = Table(["key", "payload"])
    with pytest.raises(KeyError):
        hash_join(table, "missing", table, "key")


def test_benchmark_workload_has_n_matches_and_one_checksum() -> None:
    # EN: Every row of R matches exactly one row of S, so the join has n rows, and the three
    #     algorithms must print the same checksum. The same value appears in the committed benchmark
    #     table, where both languages show it side by side.
    # PT: Cada linha de R casa com exatamente uma linha de S, então a junção tem n linhas, e os
    #     três algoritmos precisam imprimir o mesmo checksum. O valor também aparece na tabela
    #     de benchmark versionada, onde as duas linguagens o mostram lado a lado.
    # ES: Cada fila de R coincide con exactamente una fila de S, así que el join tiene n filas,
    #     y los tres algoritmos deben imprimir el mismo checksum. El mismo valor aparece en la
    #     tabla de benchmark versionada, donde los dos lenguajes lo muestran lado a lado.
    r, s = bench_tables(1000)
    digests = {name: checksum(r, s, join(r, "k", s, "k")) for name, join in JOINS.items()}
    assert len(set(digests.values())) == 1
    assert digests["hash"].startswith("1000:")


def test_committed_fixture_is_what_sqlite_answers_today() -> None:
    # EN: The Rust tests trust `fixtures/sqlite_cases.tsv`. This test regenerates it in memory
    #     from SQLite and compares, so the file cannot drift away from the real answers.
    # PT: Os testes em Rust confiam em `fixtures/sqlite_cases.tsv`. Este teste o regenera em
    #     memória a partir do SQLite e compara, para que o arquivo não se afaste das respostas
    #     reais.
    # ES: Las pruebas en Rust confían en `fixtures/sqlite_cases.tsv`. Esta prueba lo regenera en
    #     memoria a partir de SQLite y compara, para que el archivo no se aleje de las respuestas
    #     reales.
    committed = FIXTURE_PATH.read_text(encoding="utf-8").splitlines()
    assert committed == render().splitlines()
