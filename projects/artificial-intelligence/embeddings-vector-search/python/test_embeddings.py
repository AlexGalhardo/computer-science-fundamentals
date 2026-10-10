import json
import math

import numpy as np
import pytest

from cli import describe
from demo import render_markdown
from embeddings import (
    WordVectors,
    build_vocabulary,
    build_word_vectors,
    cooccurrence,
    cosine,
    nearest_neighbours,
    overall_precision,
    ppmi,
    read_data,
    read_lines,
    split_sentences,
    tokenize,
)
from experiments import (
    MISSED_QUESTION,
    NEIGHBOURS,
    RELATED_PASSAGES,
    RELATED_QUESTION,
    TOP_PASSAGES,
    Experiment,
    index_data,
    run_experiment,
    summarize,
    top_ids,
)
from retrieval import STOP_WORDS, content_key, distinct_by_content, embed, retrieve
from rng import bell_random, mulberry32
from search import (
    CHOSEN,
    FAST,
    MAX_BITS,
    MAX_TABLES,
    PLANES_SEED,
    LshIndex,
    LshSettings,
    TradeOffRow,
    brute_force,
    bucket_keys,
    make_planes,
    sides,
)

TINY = [
    tokenize(text) for text in ["the dog eats", "the cat eats", "the car stops", "the bus stops"]
]


# EN: The experiments are run once for the whole file: every test below reads the same result.
# PT: Os experimentos rodam uma vez para o arquivo inteiro: todo teste abaixo lê o mesmo resultado.
# ES: Los experimentos se ejecutan una vez para todo el archivo: toda prueba de abajo lee el mismo
#     resultado.
@pytest.fixture(scope="module")
def experiment() -> Experiment:
    return run_experiment()


@pytest.fixture(scope="module")
def summary(experiment: Experiment) -> dict[str, object]:
    return summarize(experiment)


@pytest.fixture(scope="module")
def expected() -> dict[str, object]:
    return json.loads(read_data("expected.json"))


def row_of(rows: list[TradeOffRow], settings: LshSettings) -> TradeOffRow:
    return next(row for row in rows if LshSettings(row.tables, row.bits, row.probes) == settings)


def tiny_index() -> dict[str, int]:
    return {word: position for position, word in enumerate(build_vocabulary(TINY))}


def similarity(words: WordVectors, a: str, b: str) -> float:
    return cosine(words.matrix[words.index[a]], words.matrix[words.index[b]])


def test_mulberry32_gives_the_same_sequence_as_the_typescript_version() -> None:
    rng = mulberry32(42)
    assert [rng(), rng(), rng()] == [0.6011037519201636, 0.44829055899754167, 0.8524657934904099]
    assert bell_random(mulberry32(7)) == -0.250400650780648


def test_no_query_has_the_content_words_of_a_corpus_sentence() -> None:
    corpus = {content_key(sentence) for sentence in read_lines("corpus.txt")}
    assert not any(content_key(query) in corpus for query in read_lines("queries.txt"))
    assert content_key("The cat and the dog") == content_key("the dog and the cat")


def test_tokenize_keeps_lower_case_words_only() -> None:
    assert tokenize("The DOG, the cat: 2 dogs!") == ["the", "dog", "the", "cat", "dogs"]
    assert split_sentences("One. Two! Three?") == ["One", "Two", "Three"]


def test_the_cooccurrence_table_is_symmetric() -> None:
    index = tiny_index()
    assert list(index) == ["bus", "car", "cat", "dog", "eats", "stops", "the"]
    counts = cooccurrence(TINY, index, 2)
    assert counts[index["the"], index["eats"]] == 2
    assert counts[index["dog"], index["the"]] == 1
    assert counts[index["dog"], index["car"]] == 0
    assert np.array_equal(counts, counts.T)


def test_a_window_of_1_sees_only_the_direct_neighbours() -> None:
    index = tiny_index()
    assert cooccurrence(TINY, index, 1)[index["the"], index["eats"]] == 0


def test_the_worked_example_of_the_docs_ppmi_values() -> None:
    index = tiny_index()
    weighted = ppmi(cooccurrence(TINY, index, 2))
    assert weighted[index["dog"], index["the"]] == pytest.approx(math.log2(1.5))
    assert weighted[index["dog"], index["eats"]] == pytest.approx(math.log2(3))
    assert weighted[index["dog"], index["car"]] == 0


def test_the_worked_example_of_the_docs_raw_counts_against_ppmi() -> None:
    raw = build_word_vectors(TINY, "raw", 2)
    weighted = build_word_vectors(TINY, "ppmi", 2)
    assert similarity(raw, "dog", "car") == pytest.approx(0.5)
    assert similarity(weighted, "dog", "car") == pytest.approx(0.12, abs=0.005)
    assert similarity(weighted, "dog", "cat") == pytest.approx(1.0)


def test_cosine_measures_the_angle_and_ignores_the_length() -> None:
    a = np.array([1.0, 0.0])
    assert cosine(a, np.array([1.0, 1.0])) == pytest.approx(math.sqrt(0.5))
    assert cosine(a, np.array([0.0, 5.0])) == 0
    assert cosine(a, np.array([7.0, 0.0])) == pytest.approx(1.0)
    assert cosine(a, np.array([0.0, 0.0])) == 0


# MP-AI-3.1: for a list of test words, the nearest neighbours by cosine similarity fall in the
# expected group.
def test_mp_ai_3_1_there_are_80_test_words_in_8_groups(experiment: Experiment) -> None:
    words = [word for group in experiment.groups.values() for word in group]
    assert len(experiment.groups) == 8
    assert len(words) == 80
    assert all(word in experiment.model.words.index for word in words)


def test_mp_ai_3_1_neighbours_belong_to_the_group_of_the_word(experiment: Experiment) -> None:
    assert overall_precision(experiment.precision) >= 0.9
    assert all(row.precision >= 0.8 for row in experiment.precision)


def test_mp_ai_3_1_the_neighbours_of_dog_are_animals(experiment: Experiment) -> None:
    neighbours = nearest_neighbours(experiment.model.words, "dog", NEIGHBOURS)
    assert all(word in experiment.groups["animals"] for word, _ in neighbours)
    assert neighbours[0][1] > neighbours[-1][1]


def test_mp_ai_3_1_the_neighbours_table_is_the_committed_one(
    summary: dict[str, object], expected: dict[str, object]
) -> None:
    assert summary["neighbours"] == expected["neighbours"]
    assert summary["precision"] == pytest.approx(expected["precision"], abs=0.001)


def test_mp_ai_3_1_ppmi_separates_the_groups_more_than_raw_counts(experiment: Experiment) -> None:
    within, between = experiment.contrast
    raw_within, raw_between = experiment.raw_contrast
    assert raw_between > 0.6
    assert between < 0.15
    assert within - between > raw_within - raw_between + 0.2


# MP-AI-3.2: the index returns the same top result as brute force in at least 95% of queries,
# with the number of comparisons tabled.
def test_mp_ai_3_2_brute_force_compares_with_every_vector() -> None:
    vectors = np.array([[1.0, 0.0], [0.0, 1.0], [0.6, 0.8]])
    result = brute_force(vectors, np.array([0.5, 0.8660254037844386]))
    assert result.best == 2
    assert result.comparisons == 3


def test_mp_ai_3_2_the_bucket_key_is_a_binary_number() -> None:
    small = make_planes(1, 2, 3, 4)
    one = np.array([[True, False, True, False, True, True]])
    assert bucket_keys(small, one, 0, 3)[0] == 0b101
    assert bucket_keys(small, one, 1, 3)[0] == 0b110
    assert bucket_keys(small, one, 1, 2)[0] == 0b10


def test_mp_ai_3_2_the_planes_are_the_ones_of_the_typescript_version() -> None:
    planes = make_planes(7, 1, 1, 1)
    assert planes.normals[0, 0] == -0.250400650780648
    assert make_planes(PLANES_SEED, 2, 3, 5).normals.shape == (6, 5)


def test_mp_ai_3_2_a_stored_vector_always_finds_itself(experiment: Experiment) -> None:
    model = experiment.model
    vectors, _ = index_data(model, read_lines("corpus.txt"), read_lines("queries.txt"))
    planes = make_planes(PLANES_SEED, MAX_TABLES, MAX_BITS, len(model.words.vocabulary))
    vector_sides = sides(planes, vectors)
    index = LshIndex(planes, vectors, vector_sides, FAST)
    for position in [0, 17, 512, len(vectors) - 1]:
        result = index.search(vectors[position], vector_sides[position])
        assert result.best == position
        assert result.comparisons < len(vectors)


def test_mp_ai_3_2_about_2000_vectors_are_indexed(experiment: Experiment) -> None:
    assert experiment.indexed == len(distinct_by_content(read_lines("corpus.txt")))
    assert experiment.indexed > 1800
    assert experiment.queries == 400


def test_mp_ai_3_2_the_chosen_index_agrees_with_brute_force_in_95_percent(
    experiment: Experiment,
) -> None:
    chosen = row_of(experiment.trade_off, CHOSEN)
    assert chosen.agreement >= 0.95
    assert chosen.comparisons + chosen.hashing < experiment.indexed / 4


def test_mp_ai_3_2_the_fastest_setting_is_cheaper_and_below_95_percent(
    experiment: Experiment,
) -> None:
    fast = row_of(experiment.trade_off, FAST)
    assert fast.agreement < 0.95
    assert fast.comparisons < row_of(experiment.trade_off, CHOSEN).comparisons


def test_mp_ai_3_2_more_tables_cost_more_and_never_agree_less(experiment: Experiment) -> None:
    rows = [row_of(experiment.trade_off, LshSettings(tables, 12, 0)) for tables in (1, 4, 8)]
    assert rows[0].agreement <= rows[1].agreement <= rows[2].agreement
    assert rows[0].comparisons < rows[1].comparisons < rows[2].comparisons


def test_mp_ai_3_2_the_comparisons_table_is_the_committed_one(
    summary: dict[str, object], expected: dict[str, object]
) -> None:
    assert summary["indexed"] == expected["indexed"]
    assert summary["queries"] == expected["queries"]
    rows, committed_rows = summary["tradeOff"], expected["tradeOff"]
    assert isinstance(rows, list)
    assert isinstance(committed_rows, list)
    assert len(rows) == len(committed_rows)
    for row, committed in zip(rows, committed_rows, strict=True):
        for key in ("tables", "bits", "probes", "hashing"):
            assert row[key] == committed[key]
        assert row["agreement"] == pytest.approx(committed["agreement"], abs=0.02)
        tolerance = 0.05 * committed["comparisons"] + 1
        assert row["comparisons"] == pytest.approx(committed["comparisons"], abs=tolerance)


# MP-AI-3.3: one command prints the passages retrieved for a question.
def test_mp_ai_3_3_every_demo_question_retrieves_the_expected_passage(
    experiment: Experiment,
) -> None:
    assert len(experiment.questions) == 10
    for item in experiment.questions:
        hits = retrieve(experiment.model, item.question, TOP_PASSAGES)
        assert hits[0][0].id == item.expected
        assert hits[0][1] - hits[1][1] > 0.05


def test_mp_ai_3_3_a_question_with_no_shared_word_finds_the_weather_passages(
    experiment: Experiment,
) -> None:
    used = embed(experiment.model, RELATED_QUESTION).known
    hits = retrieve(experiment.model, RELATED_QUESTION, TOP_PASSAGES)
    assert sorted(passage.id for passage, _ in hits) == RELATED_PASSAGES
    for passage, _ in hits:
        assert not set(used) & set(tokenize(f"{passage.title} {passage.text}"))


def test_mp_ai_3_3_stop_words_are_skipped_and_unknown_words_reported(
    experiment: Experiment,
) -> None:
    embedding = embed(experiment.model, "Which animal guards the farm at night?")
    assert embedding.known == ["guards", "farm", "night"]
    assert embedding.unknown == ["animal"]
    assert "which" in STOP_WORDS


def test_mp_ai_3_3_the_command_prints_three_passages_with_scores(experiment: Experiment) -> None:
    output = describe(experiment.model, "Which animal guards the farm at night?")
    assert "p01  The farm dog" in output
    assert "A farm dog sleeps lightly beside the barn." in output
    assert sum(line[1:9] == ". score " for line in output.split("\n")) == 3


def test_mp_ai_3_3_a_question_of_unknown_words_retrieves_nothing(experiment: Experiment) -> None:
    output = describe(experiment.model, "xylophone zeppelin")
    assert "No word of the question is in the vocabulary" in output
    assert "1. score" not in output


def test_mp_ai_3_3_the_retrieved_passages_are_the_committed_ones(
    summary: dict[str, object], expected: dict[str, object]
) -> None:
    assert summary["retrieval"] == expected["retrieval"]


def test_mp_ai_3_3_the_known_miss_has_the_right_passage_second(experiment: Experiment) -> None:
    ids = top_ids(experiment.model, MISSED_QUESTION.question)
    assert ids[0] != MISSED_QUESTION.expected
    assert MISSED_QUESTION.expected in ids


def test_the_demo_output_has_the_four_tables(experiment: Experiment) -> None:
    markdown = render_markdown("Python", "docker compose run --rm python-demo", experiment)
    assert "## The nearest neighbours of one word of each group" in markdown
    assert "## Raw counts against PPMI" in markdown
    assert "| brute force | - | - | - | 100.0% |" in markdown
    assert "**index (chosen)**" in markdown
    assert "## Retrieval: the passages each question picks" in markdown
