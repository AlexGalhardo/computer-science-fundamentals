"""EN: `python demo.py` prints the table "vocabulary size against number of tokens" and writes
results/results-python.md and results/table-python.json.

PT: `python demo.py` imprime a tabela "tamanho do vocabulário contra número de tokens" e grava
results/results-python.md e results/table-python.json.

ES: `python demo.py` imprime la tabla "tamaño del vocabulario frente a número de tokens" y escribe
results/results-python.md y results/table-python.json.
"""

import json
import os
from pathlib import Path

from bpe import DEFAULT_MERGES, Tokenizer, read_data, token_count_table, token_label, train
from cli import describe

DEMO_SENTENCE = "The tokenizer reads ação, função and 🙂."


def render_table(rows: list[dict[str, int]], sample_bytes: int) -> list[str]:
    lines = [
        "| Merges | Vocabulary size | Tokens of the sample | Bytes per token "
        "| Tokens of the corpus |",
        "| ---: | ---: | ---: | ---: | ---: |",
    ]
    lines += [
        f"| {row['merges']} | {row['vocabulary']} | {row['sampleTokens']} "
        f"| {sample_bytes / row['sampleTokens']:.2f} | {row['corpusTokens']} |"
        for row in rows
    ]
    return lines


def render_merges(tokenizer: Tokenizer, count: int) -> list[str]:
    def cell(token_id: int) -> str:
        return f"`{json.dumps(token_label(tokenizer, token_id), ensure_ascii=False)}`"

    lines = [
        "| # | New id | Left | Right | New token | Times seen |",
        "| ---: | ---: | --- | --- | --- | ---: |",
    ]
    lines += [
        f"| {index} | {merge.id} | {cell(merge.left)} | {cell(merge.right)} | {cell(merge.id)} "
        f"| {merge.count} |"
        for index, merge in enumerate(tokenizer.merges[:count], start=1)
    ]
    return lines


def render_markdown(language: str, command: str) -> str:
    corpus = read_data("corpus.txt")
    sample = read_data("sample.txt")
    tokenizer = train(corpus, DEFAULT_MERGES)
    rows = token_count_table(tokenizer, corpus, sample)
    corpus_bytes = len(corpus.encode("utf-8"))
    sample_bytes = len(sample.encode("utf-8"))
    return "\n".join(
        [
            f"# Results: bpe-tokenizer ({language})",
            "",
            f"Generated with `{command}`. Every number is a count, so the file is the same on "
            "any machine.",
            f"Corpus: `data/corpus.txt` ({corpus_bytes} bytes). Sample: `data/sample.txt` "
            f"({sample_bytes} bytes, not part of the corpus).",
            "",
            "## Vocabulary size against number of tokens",
            "",
            *render_table(rows, sample_bytes),
            "",
            "## The first 15 merges",
            "",
            *render_merges(tokenizer, 15),
            "",
            "## The tokens of one sentence",
            "",
            "```text",
            describe(tokenizer, DEMO_SENTENCE),
            "```",
            "",
        ]
    )


def main() -> None:
    default_dir = Path(__file__).resolve().parent.parent / "results"
    results = Path(os.environ.get("RESULTS_DIR", default_dir))
    results.mkdir(parents=True, exist_ok=True)
    markdown = render_markdown("Python", "docker compose run --rm python-demo")
    corpus = read_data("corpus.txt")
    rows = token_count_table(train(corpus, DEFAULT_MERGES), corpus, read_data("sample.txt"))
    (results / "results-python.md").write_text(markdown, encoding="utf-8", newline="\n")
    (results / "table-python.json").write_text(
        json.dumps(rows, indent="\t") + "\n", encoding="utf-8", newline="\n"
    )
    print(markdown)


if __name__ == "__main__":
    main()
