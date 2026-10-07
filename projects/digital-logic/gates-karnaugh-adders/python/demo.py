"""Demo of the Python version: `python demo.py`.

EN: Prints a truth table as bit-parallel columns, the Quine-McCluskey results and the single
    pass that adds all 65,536 pairs. With RESULTS_DIR set, writes results/results-python.md.
PT: Imprime uma tabela-verdade como colunas bit-paralelas, os resultados do Quine-McCluskey e
    a passada única que soma os 65.536 pares. Com RESULTS_DIR definida, grava
    results/results-python.md.
"""

import os
from pathlib import Path

from adders import add_all_pairs
from logic import all_ones, truth_table, variable_column
from quine_mccluskey import minimise, to_expression

CASES: list[tuple[tuple[str, ...], list[int], tuple[int, ...]]] = [
    (("A", "B", "C"), [0, 2, 4, 5, 6], ()),
    (("A", "B", "C"), [1, 3, 7], (5,)),
    (("A", "B", "C"), [1, 2, 4, 7], ()),
    (("A", "B", "C", "D"), [0, 2, 5, 7, 8, 10, 13, 15], ()),
    (("A", "B", "C", "D"), [0, 1, 2, 5, 8, 9, 10], ()),
    (("A", "B", "C", "D"), [1, 3, 5, 7, 9], (10, 11, 12, 13, 14, 15)),
]


def column_text(column: int, rows: int) -> str:
    return "".join(str((column >> row) & 1) for row in range(rows))


def build_report() -> str:
    lines = ["# gates-karnaugh-adders: demo output (Python)", ""]

    lines += ["## 1. A truth table is a handful of integers", ""]
    expression = "A & B | ~C"
    table = truth_table(expression)
    lines += [
        "Each signal is one integer whose bit r is the value in row r (row 0 on the left):",
        "",
        "```text",
    ]
    for index, name in enumerate(table.variables):
        column = variable_column(index, 3)
        lines.append(f"{name:<12}{column_text(column, 8)}   = {column}")
    lines.append(f"{'1':<12}{column_text(all_ones(3), 8)}   = {all_ones(3)}")
    lines.append(f"{expression:<12}{table.outputs}   = {table.column}")
    lines += ["```", "", f"`{expression}` is 1 for minterms {table.minterms}.", ""]

    lines += [
        "## 2. Minimisation by Quine-McCluskey",
        "",
        "| Function | Prime implicants | Essential | Minimal sum of products | Literals |",
        "| --- | ---: | ---: | --- | ---: |",
    ]
    for variables, minterms, dont_cares in CASES:
        result = minimise(len(variables), minterms, dont_cares)
        name = f"Σm({', '.join(map(str, minterms))})"
        if dont_cares:
            name += f" + d({', '.join(map(str, dont_cares))})"
        literals = sum(term.literal_count(len(variables)) for term in result.cover)
        # The OR operator is escaped because "|" also separates the cells of a Markdown table.
        expression_cell = to_expression(result.cover, variables).replace("|", "\\|")
        lines.append(
            f"| {name} | {len(result.prime_implicants)} | {len(result.essential)} | "
            f"`{expression_cell}` | {literals} |"
        )
    lines.append("")

    lines += ["## 3. All 65,536 additions in one pass", ""]
    results = add_all_pairs(8)
    agreements = sum(results[(a << 8) | b] == a + b for a in range(256) for b in range(256))
    lines += [
        "The 8-bit ripple-carry adder ran once, on 16 input columns of 65,536 bits each:",
        "8 full adders of 5 gates, 40 gate operations for every input pair together.",
        "",
        f"It agrees with native addition for {agreements} of 65536 input pairs.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    report = build_report()
    print(report, end="")
    results_dir = os.environ.get("RESULTS_DIR")
    if results_dir:
        target = Path(results_dir)
        target.mkdir(parents=True, exist_ok=True)
        (target / "results-python.md").write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
