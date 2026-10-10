"""EN: `python demo.py` prints the Python tables and writes them to results/results-python.md.

PT: `python demo.py` imprime as tabelas do Python e as grava em results/results-python.md.

ES: `python demo.py` imprime las tablas de Python y las escribe en results/results-python.md.
"""

import math
import os
import platform
from datetime import UTC, datetime
from pathlib import Path

from lower_bound import (
    Row,
    best_case,
    exhaustive,
    log2_factorial,
    minimum_comparisons,
    random_experiment,
)

RANDOM_N = 1000
RANDOM_INPUTS = 1000
SEED = 20261007


def _table(rows: list[Row], total: int) -> list[str]:
    lines = [
        "| Algorithm | min comparisons | mean | max | inputs sorted |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    lines += [
        f"| {row.algorithm} | {row.minimum:,} | {row.mean:,.2f} | {row.maximum:,} "
        f"| {row.sorted_inputs:,} of {total:,} |"
        for row in rows
    ]
    return lines


def render_markdown(generated_at: str) -> str:
    """EN: Builds the whole report as Markdown.

    PT: Monta o relatório inteiro em Markdown.

    ES: Arma el informe completo en Markdown.
    """
    lines = [
        "# Results: sorting-lower-bound (Python)",
        "",
        f"Generated at {generated_at} with `docker compose run --rm python-demo` "
        f"(Python {platform.python_version()}, image python:3.14.8-slim-trixie).",
        "Comparisons are counted by a key class that overloads the comparison operators, so the "
        "built-in `sorted` is measured too. Every number is a count, not a time.",
        "",
        "## Every permutation of small inputs",
        "",
        "min is the best case, mean the average case and max the worst case over all n! orders.",
    ]
    for n in (3, 4, 5, 6, 7):
        lines += [
            "",
            f"### n = {n}: log2(n!) = {log2_factorial(n):.2f}, "
            f"ceil(log2 n!) = {minimum_comparisons(n)}",
            "",
            *_table(exhaustive(n), math.factorial(n)),
        ]
    lines += [
        "",
        f"## {RANDOM_INPUTS:,} random inputs of n = {RANDOM_N:,}",
        "",
        f"Random permutations of 0..n-1 from seed {SEED}. "
        f"log2(n!) = {log2_factorial(RANDOM_N):,.2f}, "
        f"ceil(log2 n!) = {minimum_comparisons(RANDOM_N):,}.",
        "",
        *_table(random_experiment(RANDOM_N, RANDOM_INPUTS, SEED), RANDOM_INPUTS),
        "",
        "## The bound is about the worst case",
        "",
        f"`sorted` on {RANDOM_N:,} keys that are already in order makes {best_case(RANDOM_N):,} "
        f"comparisons, far below log2(n!) = {log2_factorial(RANDOM_N):,.2f}. That is a best case. "
        "The theorem says that some input needs at least ceil(log2 n!) comparisons, "
        "not that every input does.",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    """EN: Prints the report and saves it.

    PT: Imprime o relatório e o salva.

    ES: Imprime el informe y lo guarda.
    """
    markdown = render_markdown(datetime.now(UTC).isoformat(timespec="seconds"))
    print(markdown)
    directory = Path(os.environ.get("RESULTS_DIR", Path(__file__).parent.parent / "results"))
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "results-python.md").write_text(markdown, encoding="utf-8")
    print(f"results written to {directory}")


if __name__ == "__main__":
    main()
