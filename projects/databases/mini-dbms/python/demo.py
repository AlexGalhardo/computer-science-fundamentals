"""EN: A short tour of the engine: selection, projection and the three joins on tiny tables.

PT: Um passeio curto pelo motor: seleção, projeção e as três junções em tabelas minúsculas.

ES: Un recorrido corto por el motor: selección, proyección y los tres joins en tablas diminutas.
"""

from joins import JOINS, materialise
from make_fixtures import TABLES
from table import Predicate, Table


def show(title: str, table: Table) -> None:
    print(f"\n{title}")
    widths = [
        max(len(str(value)) for value in [column, *(row[i] for row in table.rows)])
        for i, column in enumerate(table.columns)
    ]
    print(
        "  "
        + " | ".join(
            column.ljust(width) for column, width in zip(table.columns, widths, strict=True)
        )
    )
    print("  " + "-+-".join("-" * width for width in widths))
    for row in table.rows:
        print(
            "  "
            + " | ".join(str(value).ljust(width) for value, width in zip(row, widths, strict=True))
        )
    print(f"  ({len(table.rows)} rows)")


def load(name: str) -> Table:
    columns, rows = TABLES[name]
    return Table([column for column, _ in columns], list(rows))


def main() -> None:
    emp = load("emp")
    dept = load("dept")
    show("emp", emp)
    show("dept", dept)

    rich = emp.select(Predicate("salary", ">", 4700))
    show("selection: emp WHERE salary > 4700", rich)
    show("projection (SQL, duplicates kept): SELECT salary FROM emp", emp.project(["salary"]))
    show(
        "projection (algebra, a set): SELECT DISTINCT salary FROM emp",
        emp.project(["salary"], distinct=True),
    )

    # EN: Gina (dno 50) and the department Compras (dno 40) have no partner, so an inner join
    #     leaves them out. The three algorithms must agree on that.
    # PT: Gina (dno 50) e o departamento Compras (dno 40) não têm par, então uma junção interna
    #     os deixa de fora. Os três algoritmos precisam concordar nisso.
    # ES: Gina (dno 50) y el departamento Compras (dno 40) no tienen pareja, así que un join
    #     interno los deja fuera. Los tres algoritmos deben coincidir en eso.
    for name, join in JOINS.items():
        pairs = join(emp, "dno", dept, "dno")
        joined = materialise(emp, "emp", dept, "dept", sorted(pairs))
        show(f"{name} join: emp JOIN dept ON emp.dno = dept.dno", joined)


if __name__ == "__main__":
    main()
