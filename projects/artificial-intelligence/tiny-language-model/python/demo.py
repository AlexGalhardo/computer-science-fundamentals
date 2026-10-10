"""EN: `python demo.py` trains both models, prints the tables and writes results/results.md,
results/loss-curve.svg and results/attention.svg.

PT: `python demo.py` treina os dois modelos, imprime as tabelas e grava results/results.md,
results/loss-curve.svg e results/attention.svg.

ES: `python demo.py` entrena los dos modelos, imprime las tablas y escribe results/results.md,
results/loss-curve.svg y results/attention.svg.
"""

import os
from pathlib import Path

import numpy as np

from bigram import bigram_sample, perplexity
from corpus import LINES_PER_KIND, decode, line_kind
from experiment import (
    BATCH_SIZE,
    LEARNING_RATE,
    MODEL_SEED,
    SAMPLE_COUNT,
    SAMPLE_SEED,
    TRAIN_STEPS,
    AttentionExample,
    Experiment,
    ProbeRow,
    SamplingRow,
    attention_example,
    probe_rows,
    run_experiment,
    sampling_rows,
)
from svg import attention_svg, attention_text_grid, display_char, loss_curve_svg
from transformer import count_parameters

COMMAND = "docker compose run --rm python-demo"
SAMPLES_SHOWN = 6


def bigram_lines(experiment: Experiment, count: int) -> list[str]:
    """EN: Lines written by the bigram table, to compare with the lines of the transformer.

    PT: Linhas escritas pela tabela de bigramas, para comparar com as linhas do transformer.

    ES: Líneas escritas por la tabla de bigramas, para comparar con las líneas del transformer.
    """
    vocabulary = experiment.corpus.vocabulary
    newline_id = vocabulary.index("\n")
    rng = np.random.default_rng(SAMPLE_SEED)
    lines = []
    for _ in range(count):
        ids = bigram_sample(experiment.bigram, newline_id, 40, rng)[1:]
        if newline_id in ids:
            ids = ids[: ids.index(newline_id)]
        lines.append(decode(ids, vocabulary))
    return lines


def loss_table(experiment: Experiment) -> list[str]:
    def row(name: str, context: str, train: float | None, heldout: float) -> str:
        train_cell = "" if train is None else f"{train:.3f}"
        return f"| {name} | {context} | {train_cell} | {heldout:.3f} | {perplexity(heldout):.2f} |"

    config = experiment.config
    return [
        "| Model | Context it sees | Train loss | Held-out loss | Held-out perplexity |",
        "| --- | --- | ---: | ---: | ---: |",
        row(f"Uniform guess, ln({config.vocab_size})", "nothing", None, experiment.uniform_loss),
        row(
            "Bigram (counting)",
            "1 character",
            experiment.bigram_train_loss,
            experiment.bigram_heldout_loss,
        ),
        row(
            "Transformer",
            f"up to {config.block_size} characters",
            experiment.transformer_train_loss,
            experiment.transformer_heldout_loss,
        ),
    ]


def probe_table(rows: list[ProbeRow]) -> list[str]:
    def shown(text: str) -> str:
        return "`" + "".join(display_char(char) for char in text) + "`"

    lines = [
        "| Context | Right next | Wrong next | Bigram: P(right) | Bigram: P(wrong) "
        "| Transformer: P(right) | Transformer: P(wrong) |",
        "| --- | :---: | :---: | ---: | ---: | ---: | ---: |",
    ]
    lines += [
        f"| {shown(row.context)} | {shown(row.right)} | {shown(row.wrong)} "
        f"| {row.bigram_right:.3f} | {row.bigram_wrong:.3f} "
        f"| {row.transformer_right:.3f} | {row.transformer_wrong:.3f} |"
        for row in rows
    ]
    return lines


def sampling_table(rows: list[SamplingRow]) -> list[str]:
    lines = [
        f"| Setting | Mean entropy (bits) | Distinct lines of {SAMPLE_COUNT} "
        f"| Grammatical lines of {SAMPLE_COUNT} | First line written |",
        "| --- | ---: | ---: | ---: | --- |",
    ]
    lines += [
        f"| {row.setting.label} | {row.mean_entropy_bits:.3f} | {row.distinct_lines} "
        f"| {row.grammatical_lines} | `{row.lines[0]}` |"
        for row in rows
    ]
    return lines


def render_markdown(
    experiment: Experiment,
    probes: list[ProbeRow],
    sampling: list[SamplingRow],
    attention: AttentionExample,
) -> str:
    corpus, config = experiment.corpus, experiment.config
    kinds = ", ".join(f"{count} {kind}" for kind, count in LINES_PER_KIND.items())
    vocabulary = " ".join(display_char(char) for char in corpus.vocabulary)
    bigram = bigram_lines(experiment, SAMPLE_COUNT)
    bigram_grammatical = sum(line_kind(line) is not None for line in bigram)
    query, clue = attention.query_position, attention.clue_position
    sample_blocks: list[str] = []
    for row in sampling:
        sample_blocks += [f"{row.setting.label}:", "", "```text", *row.lines[:SAMPLES_SHOWN], "```"]
        sample_blocks.append("")
    return "\n".join(
        [
            "# Results: tiny-language-model",
            "",
            f"Generated with `{COMMAND}`. Every seed is fixed, so a rerun on the same machine "
            "gives the same file. The losses come from floating-point training, so on another "
            "processor the last decimals may differ.",
            "",
            "## Corpus",
            "",
            f"Generated by `python/corpus.py`: {sum(LINES_PER_KIND.values())} "
            f"different lines ({kinds}), shuffled, {len(corpus.train_lines)} for training and "
            f"{len(corpus.heldout_lines)} held out. No held-out line is a training line.",
            "",
            f"- Training text: {len(experiment.train_ids)} characters. "
            f"Held-out text: {len(experiment.heldout_ids)} characters.",
            f"- Vocabulary: {config.vocab_size} characters: `{vocabulary}`",
            "",
            "The first held-out lines:",
            "",
            "```text",
            *corpus.heldout_lines[:8],
            "```",
            "",
            "## Loss on held-out text",
            "",
            "Cross-entropy in nats (natural logarithm), lower is better. Perplexity = exp(loss).",
            "",
            *loss_table(experiment),
            "",
            f"Transformer: {config.n_layers} blocks, {config.n_heads} heads, d_model "
            f"{config.d_model}, context of {config.block_size} characters, "
            f"{count_parameters(experiment.params)} parameters. Adam, {TRAIN_STEPS} steps, batches "
            f"of {BATCH_SIZE} windows, learning rate {LEARNING_RATE} falling to 10%, seed "
            f"{MODEL_SEED}.",
            "",
            "![Loss curve](loss-curve.svg)",
            "",
            "## What the context buys",
            "",
            "The probability each model gives to the next character the grammar demands, and to "
            "a wrong one. `\\n` starts every context and `_` stands for a space.",
            "",
            *probe_table(probes),
            "",
            "## Sampling controls",
            "",
            f"{SAMPLE_COUNT} lines written by the transformer with each setting, all from the "
            f"same seed ({SAMPLE_SEED}). Mean entropy: the entropy, in bits, of the distribution "
            "each character was really drawn from, averaged over every character written. A "
            "line is grammatical when it obeys one of the four rules of the corpus (right "
            "pronoun, right agreement, right sum, matched brackets).",
            "",
            *sampling_table(sampling),
            "",
            "## Samples",
            "",
            f"The bigram table, plain sampling ({bigram_grammatical} of {SAMPLE_COUNT} lines "
            "are grammatical):",
            "",
            "```text",
            *bigram[:SAMPLES_SHOWN],
            "```",
            "",
            "The transformer:",
            "",
            *sample_blocks,
            "## Attention",
            "",
            f"Block {attention.layer + 1}, head {attention.head + 1}, on the held-out line "
            f"`{attention.text[1:]}`. Each row is the position that asks, each column the "
            "position it looks at. A cell is the weight in tenths (7 means 0.7 to 0.8, 9 goes "
            "up to 1.0) and `.` is the future, removed by the causal mask. Each row adds up to 1.",
            "",
            "```text",
            *attention_text_grid(attention.text, attention.weights),
            "```",
            "",
            f"Row {query + 1} (the last letter of the verb) is where the model has to choose "
            'between an "s" and a space. The only clue is the "s" that ends the subject, in '
            f"column {clue + 1}. This head puts {attention.weights[query, clue]:.2f} of the "
            "weight of that row on it.",
            "",
            "![Attention map](attention.svg)",
            "",
        ]
    )


def main() -> None:
    experiment = run_experiment()
    probes = probe_rows(experiment)
    sampling = sampling_rows(experiment)
    attention = attention_example(experiment)
    markdown = render_markdown(experiment, probes, sampling, attention)
    history = experiment.history
    curve = loss_curve_svg(
        [point.step for point in history],
        [
            ("transformer, training batches", "#2563eb", [p.train_loss for p in history]),
            ("transformer, held-out", "#ea580c", [p.heldout_loss for p in history]),
        ],
        [
            ("uniform ln(V)", "#6b7280", experiment.uniform_loss),
            ("bigram, held-out", "#16a34a", experiment.bigram_heldout_loss),
        ],
    )
    heat_map = attention_svg(
        attention.text,
        attention.weights,
        attention.query_position,
        f"attention weights: block {attention.layer + 1}, head {attention.head + 1}",
    )
    print(markdown)
    results_dir = Path(
        os.environ.get("RESULTS_DIR", Path(__file__).resolve().parent.parent / "results")
    )
    results_dir.mkdir(parents=True, exist_ok=True)
    for name, content in (
        ("results.md", markdown),
        ("loss-curve.svg", curve),
        ("attention.svg", heat_map),
    ):
        # EN: newline="\n" keeps Unix line endings whatever the system.
        # PT: newline="\n" mantém as quebras de linha do Unix em qualquer sistema.
        # ES: newline="\n" mantiene los saltos de línea de Unix en cualquier sistema.
        with (results_dir / name).open("w", encoding="utf-8", newline="\n") as file:
            file.write(content)
    print(f"written: {results_dir}/results.md, loss-curve.svg, attention.svg")


if __name__ == "__main__":
    main()
