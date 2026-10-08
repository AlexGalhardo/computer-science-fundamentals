import math
import xml.etree.ElementTree as ET

import numpy as np
import pytest

from demo import main, render_markdown
from experiment import (
    SAMPLE_COUNT,
    SETTINGS,
    Experiment,
    SamplingRow,
    attention_example,
    probe_rows,
)
from sampling import (
    Setting,
    apply_temperature,
    entropy_bits,
    generate_lines,
    next_token_distribution,
    sample_rows,
    top_k_filter,
    top_p_filter,
)

LOGITS = np.array([[2.0, 1.0, 0.0]])
PROBABILITIES = np.array([[0.05, 0.5, 0.15, 0.3]])


def test_temperature_reproduces_the_table_of_the_area_page() -> None:
    assert np.allclose(apply_temperature(LOGITS, 0.5), [[0.867, 0.117, 0.016]], atol=1e-3)
    assert np.allclose(apply_temperature(LOGITS, 1.0), [[0.665, 0.245, 0.090]], atol=1e-3)
    assert np.allclose(apply_temperature(LOGITS, 2.0), [[0.506, 0.307, 0.186]], atol=1e-3)


# MP-AI-4.3, on one distribution: the entropy grows with the temperature.
def test_entropy_grows_with_temperature_on_a_fixed_distribution() -> None:
    entropies = [
        float(entropy_bits(apply_temperature(LOGITS, t))[0]) for t in (0.1, 0.2, 0.5, 1.0, 1.5, 5)
    ]
    assert entropies == sorted(entropies)
    assert len(set(entropies)) == len(entropies)
    assert entropies[0] < 0.01
    assert entropies[-1] < math.log2(3)


def test_entropy_of_known_distributions() -> None:
    known = np.array([[0.25, 0.25, 0.25, 0.25], [1.0, 0.0, 0.0, 0.0], [0.5, 0.5, 0.0, 0.0]])
    assert np.allclose(entropy_bits(known), [2.0, 0.0, 1.0])


def test_top_k_keeps_the_k_most_probable_tokens() -> None:
    kept = top_k_filter(PROBABILITIES, 2)
    assert np.allclose(kept, [[0.0, 0.625, 0.0, 0.375]])
    assert np.allclose(top_k_filter(PROBABILITIES, 4), PROBABILITIES)
    # A tie is broken by the smaller token id, so exactly k tokens survive.
    tie = top_k_filter(np.array([[0.25, 0.25, 0.25, 0.25]]), 2)
    assert tie.tolist() == [[0.5, 0.5, 0.0, 0.0]]


def test_top_p_keeps_the_smallest_set_that_reaches_p() -> None:
    # Sorted: 0.5, 0.3, 0.15, 0.05. Running total: 0.5, 0.8, 0.95, 1.0.
    # p = 0.7: 0.5 is not enough, 0.8 crosses the threshold, and that token stays in.
    assert np.allclose(top_p_filter(PROBABILITIES, 0.7), [[0.0, 0.625, 0.0, 0.375]])
    # p = 0.4: the first token alone is enough.
    assert np.allclose(top_p_filter(PROBABILITIES, 0.4), [[0.0, 1.0, 0.0, 0.0]])
    # p = 0.9: three tokens.
    assert np.allclose(
        top_p_filter(PROBABILITIES, 0.9), [[0.0, 0.5 / 0.95, 0.15 / 0.95, 0.3 / 0.95]]
    )
    assert np.allclose(top_p_filter(PROBABILITIES, 1.0), PROBABILITIES)


def test_filters_lower_the_entropy_and_greedy_removes_it() -> None:
    plain = float(entropy_bits(PROBABILITIES)[0])
    assert float(entropy_bits(top_k_filter(PROBABILITIES, 3))[0]) < plain
    assert float(entropy_bits(top_p_filter(PROBABILITIES, 0.9))[0]) < plain
    greedy = next_token_distribution(LOGITS, Setting("greedy", greedy=True))
    assert greedy.tolist() == [[1.0, 0.0, 0.0]]
    assert entropy_bits(greedy)[0] == 0
    combined = next_token_distribution(LOGITS, Setting("all", temperature=0.5, top_k=2, top_p=0.5))
    assert combined.tolist() == [[1.0, 0.0, 0.0]]


def test_drawing_a_token_is_seeded_and_respects_zero_probabilities() -> None:
    rows = np.tile(np.array([[0.0, 0.7, 0.0, 0.3]]), (2000, 1))
    drawn = sample_rows(rows, np.random.default_rng(1))
    assert np.array_equal(drawn, sample_rows(rows, np.random.default_rng(1)))
    assert set(drawn.tolist()) == {1, 3}
    assert abs((drawn == 1).mean() - 0.7) < 0.05


def test_generation_is_reproducible_with_a_fixed_seed(experiment: Experiment) -> None:
    newline_id = experiment.corpus.vocabulary.index("\n")

    def run(seed: int) -> list[list[int]]:
        return generate_lines(
            experiment.params,
            experiment.config,
            Setting("plain"),
            newline_id=newline_id,
            count=8,
            max_length=40,
            seed=seed,
        ).lines

    first = run(5)
    assert first == run(5)
    assert first != run(6)
    assert all(newline_id not in line and len(line) <= 40 for line in first)


# MP-AI-4.3: the table of the demo. A lower temperature gives a lower entropy of the
# distributions the characters are drawn from, and less varied lines.
def test_lower_temperature_gives_less_varied_output(sampling: dict[str, SamplingRow]) -> None:
    labels = ["greedy", "temperature 0.2", "temperature 0.5", "temperature 1.0", "temperature 1.5"]
    entropies = [sampling[label].mean_entropy_bits for label in labels]
    # Measured: 0.000, 0.304, 0.520, 0.856, 1.464 bits. Each step must be a clear one.
    assert entropies[0] == 0
    for lower, higher in zip(entropies, entropies[1:], strict=False):
        assert higher > lower + 0.1
    distinct = [sampling[label].distinct_lines for label in labels]
    # Measured: 1, 66, 97, 99, 100 different lines out of 100.
    assert distinct[0] == 1
    assert distinct[0] < distinct[1] < distinct[4]
    assert distinct[1] < distinct[3]


# MP-AI-4.3
def test_top_k_and_top_p_lower_the_entropy_of_plain_sampling(
    sampling: dict[str, SamplingRow],
) -> None:
    for temperature in ("1.0", "1.5"):
        plain = sampling[f"temperature {temperature}"].mean_entropy_bits
        assert sampling[f"temperature {temperature}, top-k 3"].mean_entropy_bits < plain - 0.05
        assert sampling[f"temperature {temperature}, top-p 0.9"].mean_entropy_bits < plain - 0.05


def test_cautious_sampling_writes_more_grammatical_lines(sampling: dict[str, SamplingRow]) -> None:
    assert len(sampling) == len(SETTINGS)
    assert all(len(row.lines) == SAMPLE_COUNT for row in sampling.values())
    # Measured: 100 grammatical lines at temperature 0.2, 73 at 1.0, 38 at 1.5.
    assert sampling["temperature 0.2"].grammatical_lines >= 90
    assert (
        sampling["temperature 0.2"].grammatical_lines
        > sampling["temperature 1.0"].grammatical_lines
        > sampling["temperature 1.5"].grammatical_lines
    )
    assert sampling["greedy"].grammatical_lines == SAMPLE_COUNT


def test_the_report_has_every_table(
    experiment: Experiment, sampling: dict[str, SamplingRow]
) -> None:
    markdown = render_markdown(
        experiment, probe_rows(experiment), list(sampling.values()), attention_example(experiment)
    )
    for heading in ("## Loss on held-out text", "## Sampling controls", "## Attention"):
        assert heading in markdown
    assert "| Bigram (counting) | 1 character |" in markdown
    assert "| temperature 0.2 |" in markdown
    assert "\r" not in markdown


# MP-AI-4.4: the demo writes the table and both figures.
def test_the_demo_writes_the_results(
    tmp_path_factory: pytest.TempPathFactory,
    monkeypatch: pytest.MonkeyPatch,
    experiment: Experiment,
) -> None:
    results = tmp_path_factory.mktemp("results")
    monkeypatch.setenv("RESULTS_DIR", str(results))
    # The model of the fixture is reused, so the demo does not train a second time here.
    monkeypatch.setattr("demo.run_experiment", lambda: experiment)
    main()
    assert (results / "results.md").read_text(encoding="utf-8").startswith("# Results")
    for name in ("loss-curve.svg", "attention.svg"):
        root = ET.parse(results / name).getroot()
        assert root.tag == "{http://www.w3.org/2000/svg}svg"
    heat_map = (results / "attention.svg").read_text(encoding="utf-8")
    size = len(attention_example(experiment).text)
    # One grey square per masked pair: the upper triangle.
    assert heat_map.count('fill="#e5e7eb"') == size * (size - 1) // 2
