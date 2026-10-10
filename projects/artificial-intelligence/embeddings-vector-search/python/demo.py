"""EN: `python demo.py` runs the three experiments, prints their tables and writes
results/results-python.md and results/table-python.json.

PT: `python demo.py` roda os três experimentos, imprime as tabelas e grava
results/results-python.md e results/table-python.json.

ES: `python demo.py` ejecuta los tres experimentos, imprime las tablas y escribe
results/results-python.md y results/table-python.json.
"""

import json
import math
import os
from pathlib import Path

from cli import describe
from embeddings import nearest_neighbours, overall_precision
from experiments import (
    MISSED_QUESTION,
    NEIGHBOURS,
    RELATED_QUESTION,
    TOP_PASSAGES,
    Experiment,
    run_experiment,
    summarize,
)
from retrieval import DemoQuestion, retrieve
from search import CHOSEN, LshSettings


def one_decimal(value: float) -> str:
    """EN: One decimal, with halves always rounded up. JavaScript and Python round an exact half
    such as 94.25 in different directions, and the two results files should show the same numbers.

    PT: Uma casa decimal, com metades sempre arredondadas para cima. JavaScript e Python
    arredondam uma metade exata como 94.25 em direções diferentes, e os dois arquivos de
    resultados devem mostrar os mesmos números.

    ES: Un decimal, con las mitades siempre redondeadas hacia arriba. JavaScript y Python redondean
    una mitad exacta como 94.25 en direcciones distintas, y los dos archivos de resultados deben
    mostrar los mismos números.
    """
    return f"{math.floor(value * 10 + 0.5) / 10:.1f}"


def percent(share: float) -> str:
    return f"{one_decimal(share * 100)}%"


def render_neighbours(experiment: Experiment) -> list[str]:
    lines = [
        f"| Word | Group | {NEIGHBOURS} nearest neighbours (cosine similarity) |",
        "| --- | --- | --- |",
    ]
    for group, words in experiment.groups.items():
        neighbours = ", ".join(
            f"{word} {similarity:.3f}"
            for word, similarity in nearest_neighbours(experiment.model.words, words[0], NEIGHBOURS)
        )
        lines.append(f"| {words[0]} | {group} | {neighbours} |")
    return lines


def render_precision(experiment: Experiment) -> list[str]:
    lines = [
        f"| Group | Test words | Neighbours in the group (PPMI) | Words with all {NEIGHBOURS} in "
        "the group | Neighbours in the group (raw counts) |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for row, raw in zip(experiment.precision, experiment.raw_precision, strict=True):
        lines.append(
            f"| {row.group} | {row.words} | {percent(row.precision)} | {row.perfect_words} "
            f"| {percent(raw.precision)} |"
        )
    words = sum(row.words for row in experiment.precision)
    perfect = sum(row.perfect_words for row in experiment.precision)
    lines.append(
        f"| **all** | {words} | {percent(overall_precision(experiment.precision))} | {perfect} "
        f"| {percent(overall_precision(experiment.raw_precision))} |"
    )
    return lines


def render_contrast(experiment: Experiment) -> list[str]:
    def row(name: str, contrast: tuple[float, float]) -> str:
        within, between = contrast
        return f"| {name} | {within:.3f} | {between:.3f} | {within - between:.3f} |"

    return [
        "| Weighting | Mean cosine, same group | Mean cosine, different groups | Gap |",
        "| --- | ---: | ---: | ---: |",
        row("raw counts", experiment.raw_contrast),
        row("PPMI", experiment.contrast),
    ]


def render_trade_off(experiment: Experiment) -> list[str]:
    n = experiment.indexed
    lines = [
        "| Search | Tables | Bits | Probing | Same top result as brute force "
        "| Vectors compared (average) | Plane dot products | Total | Share of brute force |",
        "| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |",
        f"| brute force | - | - | - | 100.0% | {n} | 0 | {n} | 100.0% |",
    ]
    for row in experiment.trade_off:
        total = row.comparisons + row.hashing
        chosen = LshSettings(row.tables, row.bits, row.probes) == CHOSEN
        lines.append(
            f"| {'**index (chosen)**' if chosen else 'index'} | {row.tables} | {row.bits} "
            f"| {'1 bit' if row.probes == 1 else 'no'} | {percent(row.agreement)} "
            f"| {one_decimal(row.comparisons)} | {row.hashing} | {one_decimal(total)} "
            f"| {percent(total / n)} |"
        )
    return lines


def render_retrieval(experiment: Experiment) -> list[str]:
    lines = ["| Question | Expected | 1st | 2nd | 3rd |", "| --- | --- | --- | --- | --- |"]
    related = DemoQuestion(RELATED_QUESTION, "p13, p14 or p15")
    for item in [*experiment.questions, related, MISSED_QUESTION]:
        hits = " | ".join(
            f"{passage.id} {passage.title} ({score:.3f})"
            for passage, score in retrieve(experiment.model, item.question, TOP_PASSAGES)
        )
        lines.append(f"| {item.question} | {item.expected} | {hits} |")
    return lines


def render_markdown(language: str, command: str, experiment: Experiment) -> str:
    model = experiment.model
    size = len(model.words.vocabulary)
    return "\n".join(
        [
            f"# Results: embeddings-vector-search ({language})",
            "",
            f"Generated with `{command}`. Every random choice has a fixed seed, so the tables are "
            "reproducible.",
            "",
            f"Corpus: `data/corpus.txt` ({experiment.corpus_sentences} generated sentences) plus "
            f"the sentences of the {len(model.passages)} passages of `data/passages.json`: "
            f"{experiment.training_sentences} sentences, {size} distinct words. Each word vector "
            f"has {size} numbers (one per word of the vocabulary).",
            "",
            "## The nearest neighbours of one word of each group",
            "",
            *render_neighbours(experiment),
            "",
            f"## Do the neighbours fall in the expected group? ({NEIGHBOURS} neighbours of each "
            "test word)",
            "",
            *render_precision(experiment),
            "",
            "## Raw counts against PPMI",
            "",
            *render_contrast(experiment),
            "",
            "## Brute force against the index",
            "",
            f"Indexed: the {experiment.indexed} sentences of the corpus with distinct content "
            f"words, one vector each. Queries: the {experiment.queries} sentences of "
            "`data/queries.txt`, none of them in the corpus. One comparison = one dot product "
            f"between two vectors of {size} numbers.",
            "",
            *render_trade_off(experiment),
            "",
            "## Retrieval: the passages each question picks",
            "",
            *render_retrieval(experiment),
            "",
            "## The output of the search command",
            "",
            "```text",
            describe(model, experiment.questions[0].question),
            "```",
            "",
            "A question with no content word in common with the passages it finds:",
            "",
            "```text",
            describe(model, RELATED_QUESTION),
            "```",
            "",
            "A question it gets wrong:",
            "",
            "```text",
            describe(model, MISSED_QUESTION.question),
            "```",
            "",
        ]
    )


def main() -> None:
    default_dir = Path(__file__).resolve().parent.parent / "results"
    results = Path(os.environ.get("RESULTS_DIR", default_dir))
    results.mkdir(parents=True, exist_ok=True)
    experiment = run_experiment()
    markdown = render_markdown("Python", "docker compose run --rm python-demo", experiment)
    (results / "results-python.md").write_text(markdown, encoding="utf-8", newline="\n")
    (results / "table-python.json").write_text(
        json.dumps(summarize(experiment), indent="\t") + "\n", encoding="utf-8", newline="\n"
    )
    print(markdown)


if __name__ == "__main__":
    main()
