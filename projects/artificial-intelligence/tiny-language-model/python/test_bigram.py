import math

import numpy as np

from bigram import bigram_counts, bigram_loss, bigram_probabilities, bigram_sample, perplexity
from corpus import decode
from experiment import Experiment


def test_counts_who_follows_whom() -> None:
    # "abab": a->b twice, b->a once.
    counts = bigram_counts(np.array([0, 1, 0, 1]), 2)
    assert counts.tolist() == [[0, 2], [1, 0]]


def test_the_worked_example_of_the_docs() -> None:
    # After "the": cat 3 times, dog once -> P(cat | the) = 3/4 without smoothing.
    the, cat, dog = 0, 1, 2
    ids = np.array([the, cat, the, cat, the, cat, the, dog])
    probabilities = bigram_probabilities(bigram_counts(ids, 3), smoothing=0.0001)
    assert math.isclose(probabilities[the, cat], 0.75, abs_tol=1e-3)
    assert math.isclose(probabilities[the, dog], 0.25, abs_tol=1e-3)
    # Add-one smoothing: (3 + 1) / (4 + 3) and (0 + 1) / (4 + 3).
    smoothed = bigram_probabilities(bigram_counts(ids, 3), smoothing=1.0)
    assert math.isclose(smoothed[the, cat], 4 / 7)
    assert math.isclose(smoothed[the, the], 1 / 7)


# MP-AI-4.1
def test_every_row_is_a_probability_distribution(experiment: Experiment) -> None:
    table = experiment.bigram
    vocab_size = len(experiment.corpus.vocabulary)
    assert table.shape == (vocab_size, vocab_size)
    assert np.allclose(table.sum(axis=1), 1.0, atol=1e-12)
    # Smoothing: no pair has probability 0, so the held-out loss is finite.
    assert (table > 0).all()


# MP-AI-4.1
def test_sampling_is_reproducible_with_a_fixed_seed(experiment: Experiment) -> None:
    newline_id = experiment.corpus.vocabulary.index("\n")

    def sample(seed: int) -> list[int]:
        return bigram_sample(experiment.bigram, newline_id, 200, np.random.default_rng(seed))

    first = sample(123)
    assert first == sample(123)
    assert first != sample(124)
    assert len(first) == 201 and first[0] == newline_id
    assert all(0 <= token < len(experiment.corpus.vocabulary) for token in first)
    assert isinstance(decode(first, experiment.corpus.vocabulary), str)


def test_sampling_follows_the_table() -> None:
    # A table that always moves 0 -> 1 -> 2 -> 0 leaves nothing to chance.
    table = np.array([[0.0, 1.0, 0.0], [0.0, 0.0, 1.0], [1.0, 0.0, 0.0]])
    assert bigram_sample(table, 0, 6, np.random.default_rng(0)) == [0, 1, 2, 0, 1, 2, 0]


def test_loss_of_known_tables() -> None:
    ids = np.array([0, 1, 2, 3, 0, 2])
    uniform = np.full((4, 4), 0.25)
    assert math.isclose(bigram_loss(uniform, ids), math.log(4))
    assert math.isclose(perplexity(bigram_loss(uniform, ids)), 4.0)
    certain = bigram_probabilities(bigram_counts(np.array([0, 1, 0, 1]), 2), smoothing=1e-12)
    assert bigram_loss(certain, np.array([0, 1, 0, 1])) < 1e-6


def test_the_bigram_beats_the_uniform_guess_and_barely_overfits(experiment: Experiment) -> None:
    assert math.isfinite(experiment.bigram_heldout_loss)
    assert experiment.bigram_heldout_loss < experiment.uniform_loss - 1.0
    assert experiment.bigram_train_loss <= experiment.bigram_heldout_loss
    assert experiment.bigram_heldout_loss - experiment.bigram_train_loss < 0.1
