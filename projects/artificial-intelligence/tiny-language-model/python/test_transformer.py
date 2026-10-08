import math

import numpy as np

from experiment import TRAIN_STEPS, Experiment, attention_example, probe_rows
from transformer import (
    Adam,
    Config,
    Params,
    count_parameters,
    cross_entropy,
    evaluate,
    forward,
    get_batch,
    init_params,
    layer_norm,
    loss_and_grads,
    softmax,
)

TINY = Config(vocab_size=7, block_size=5, d_model=8, n_heads=2, n_layers=2, mlp_ratio=2)


def tiny_model(seed: int = 3) -> tuple[Params, np.ndarray, np.ndarray]:
    # EN: float64 and large random weights, gains and biases, so that no gradient is close to
    #     zero by accident and the comparison below is meaningful for every parameter.
    # PT: float64 e pesos, ganhos e vieses aleatórios grandes, para que nenhum gradiente fique
    #     perto de zero por acaso e a comparação abaixo valha para todos os parâmetros.
    params = init_params(TINY, seed, dtype=np.float64, std=0.5)
    rng = np.random.default_rng(seed + 100)
    for name in params:
        if "gain" in name or "bias" in name or ".b_" in name or name == "b_out":
            params[name] = params[name] + rng.standard_normal(params[name].shape) * 0.2
    tokens = rng.integers(0, TINY.vocab_size, size=(3, TINY.block_size))
    targets = rng.integers(0, TINY.vocab_size, size=(3, TINY.block_size))
    return params, tokens, targets


def loss_of(params: Params, tokens: np.ndarray, targets: np.ndarray) -> float:
    logits, _ = forward(params, TINY, tokens)
    return cross_entropy(logits, targets)[0]


# MP-AI-4.2: "written from scratch" is only worth something if the hand-made backward pass is
# right. The numerical gradient needs no calculus: nudge one weight up and down by a tiny
# epsilon and see how much the loss moves. Both gradients must agree, for every weight.
def test_backpropagation_matches_the_numerical_gradient() -> None:
    params, tokens, targets = tiny_model()
    _, grads = loss_and_grads(params, TINY, tokens, targets)
    assert set(grads) == set(params)
    epsilon = 1e-5
    for name, value in params.items():
        numerical = np.zeros_like(value)
        for index in np.ndindex(value.shape):
            original = value[index]
            value[index] = original + epsilon
            loss_up = loss_of(params, tokens, targets)
            value[index] = original - epsilon
            loss_down = loss_of(params, tokens, targets)
            value[index] = original
            numerical[index] = (loss_up - loss_down) / (2 * epsilon)
        analytic = grads[name]
        assert analytic.shape == value.shape
        assert np.linalg.norm(numerical) > 1e-6, f"{name}: the check would be vacuous"
        error = np.linalg.norm(numerical - analytic) / (
            np.linalg.norm(numerical) + np.linalg.norm(analytic)
        )
        assert error < 1e-6, f"{name}: relative error {error:.2e}"


def test_the_gradient_check_notices_a_wrong_gradient() -> None:
    # The same comparison must fail when the loss is not the one that was differentiated.
    params, tokens, targets = tiny_model()
    _, grads = loss_and_grads(params, TINY, tokens, targets)
    other_targets = (targets + 1) % TINY.vocab_size
    value, epsilon, index = params["w_out"], 1e-5, (0, 0)
    original = value[index]
    value[index] = original + epsilon
    loss_up = loss_of(params, tokens, other_targets)
    value[index] = original - epsilon
    loss_down = loss_of(params, tokens, other_targets)
    value[index] = original
    assert abs((loss_up - loss_down) / (2 * epsilon) - grads["w_out"][index]) > 1e-4


def test_attention_never_looks_at_the_future() -> None:
    params, tokens, _ = tiny_model()
    logits, cache = forward(params, TINY, tokens)
    for block in cache["blocks"]:
        weights = block["weights"]
        assert weights.shape == (3, TINY.n_heads, TINY.block_size, TINY.block_size)
        # The causal mask: the upper triangle is exactly zero, and each row still sums to 1.
        assert (np.triu(weights, k=1) == 0).all()
        assert np.allclose(weights.sum(axis=-1), 1.0)
        visible = np.tril(np.ones((TINY.block_size, TINY.block_size), dtype=bool))
        assert (weights[..., visible] > 0).all()
    # Changing the last token must not change any earlier prediction.
    changed = tokens.copy()
    changed[:, -1] = (changed[:, -1] + 1) % TINY.vocab_size
    changed_logits, _ = forward(params, TINY, changed)
    assert np.array_equal(logits[:, :-1], changed_logits[:, :-1])
    assert not np.allclose(logits[:, -1], changed_logits[:, -1])


def test_positions_matter() -> None:
    # One block: the last position reads the earlier tokens through attention only. With the
    # position vectors, "1 2 3" and "2 1 3" give different predictions. With the position
    # vectors zeroed, attention sees a bag of tokens and the two predictions are the same.
    config = Config(vocab_size=7, block_size=5, d_model=8, n_heads=2, n_layers=1, mlp_ratio=2)
    params = init_params(config, seed=3, dtype=np.float64, std=0.5)
    first, _ = forward(params, config, np.array([[1, 2, 3]]))
    second, _ = forward(params, config, np.array([[2, 1, 3]]))
    assert not np.allclose(first[0, -1], second[0, -1])
    params["pos_emb"][:] = 0
    first, _ = forward(params, config, np.array([[1, 2, 3]]))
    second, _ = forward(params, config, np.array([[2, 1, 3]]))
    assert np.allclose(first[0, -1], second[0, -1])


def test_softmax_and_layer_norm() -> None:
    weights = softmax(np.array([1.0, 0.0, 1.0]))
    # The worked example of the area page: softmax(1, 0, 1) = (0.422, 0.155, 0.422).
    assert np.allclose(weights, [0.422, 0.155, 0.422], atol=1e-3)
    assert softmax(np.array([1000.0, 1000.0])).tolist() == [0.5, 0.5]
    x = np.random.default_rng(0).standard_normal((4, 8)) * 5 + 3
    normalised, _ = layer_norm(x, np.ones(8), np.zeros(8))
    assert np.allclose(normalised.mean(axis=-1), 0.0, atol=1e-9)
    assert np.allclose(normalised.var(axis=-1), 1.0, atol=1e-3)


def test_an_untrained_model_is_as_good_as_a_uniform_guess() -> None:
    config = Config(vocab_size=45)
    params = init_params(config, seed=0)
    assert all(value.dtype == np.float32 for value in params.values())
    assert count_parameters(params) == 62253
    rng = np.random.default_rng(0)
    ids = rng.integers(0, 45, size=500)
    tokens, targets = get_batch(ids, config.block_size, 8, rng)
    assert tokens.shape == targets.shape == (8, 32)
    assert np.array_equal(tokens[:, 1:], targets[:, :-1])
    loss, grads = loss_and_grads(params, config, tokens, targets)
    assert abs(loss - math.log(45)) < 0.1
    assert all(grad.dtype == np.float32 for grad in grads.values())


def test_evaluate_scores_every_character_once() -> None:
    params, _, _ = tiny_model()
    ids = np.random.default_rng(5).integers(0, TINY.vocab_size, size=2 * TINY.block_size + 4)
    total = 0.0
    # Two full windows of 5 targets and a last one with the 3 targets that are left.
    for start, stop in ((0, 5), (5, 10), (10, 13)):
        logits, _ = forward(params, TINY, ids[None, start:stop])
        total += cross_entropy(logits, ids[None, start + 1 : stop + 1])[0] * (stop - start)
    assert math.isclose(evaluate(params, TINY, ids), total / 13, rel_tol=1e-12)


def test_adam_walks_to_the_minimum() -> None:
    # Minimise (w - 3)^2. The gradient is 2 (w - 3).
    params = {"w": np.array([0.0])}
    optimiser = Adam(params)
    optimiser.step(params, {"w": 2 * (params["w"] - 3)}, 0.1)
    # The first Adam step has the size of the learning rate, whatever the size of the gradient.
    assert math.isclose(params["w"][0], 0.1, rel_tol=1e-6)
    for _ in range(500):
        optimiser.step(params, {"w": 2 * (params["w"] - 3)}, 0.1)
    assert abs(params["w"][0] - 3) < 1e-2


# MP-AI-4.2
def test_the_transformer_beats_the_bigram_on_heldout_text(experiment: Experiment) -> None:
    transformer, bigram = experiment.transformer_heldout_loss, experiment.bigram_heldout_loss
    # Measured: transformer 0.66, bigram 1.74, uniform 3.81. The margin asked for is half a nat,
    # about half of the measured gap, so the test is not at the mercy of the last decimal.
    assert transformer < bigram - 0.5
    assert bigram < experiment.uniform_loss
    # It learned rules, not the training lines: the two losses stay close.
    assert experiment.transformer_heldout_loss - experiment.transformer_train_loss < 0.15


def test_the_loss_curve_goes_down(experiment: Experiment) -> None:
    history = experiment.history
    assert history[0].step == 0 and history[-1].step == TRAIN_STEPS
    assert abs(history[0].heldout_loss - experiment.uniform_loss) < 0.2
    assert history[-1].heldout_loss < history[1].heldout_loss < history[0].heldout_loss
    assert math.isclose(history[-1].heldout_loss, experiment.transformer_heldout_loss)


def test_the_transformer_uses_context_the_bigram_cannot_see(experiment: Experiment) -> None:
    rows = {row.context: row for row in probe_rows(experiment)}
    for context in ("ana has a cat. ", "leo has a cat. ", "the old dogs see", "the old dog see"):
        row = rows[context]
        # Pronoun and agreement: measured 0.98 or more for the transformer.
        assert row.transformer_right > 0.8
        assert row.transformer_wrong < 0.1
        assert row.bigram_right < 0.5
    # The bigram gives the same answer to both members of a pair: it sees one character.
    assert rows["ana has a cat. "].bigram_right == rows["leo has a cat. "].bigram_wrong
    for context in ("{[x]", "[{x}"):
        # A bracket may be closed or more may be opened, but never closed by the wrong kind.
        assert rows[context].transformer_right > 5 * rows[context].transformer_wrong
        assert rows[context].transformer_wrong < 0.05


def test_the_attention_example_shows_the_mask_and_the_clue(experiment: Experiment) -> None:
    example = attention_example(experiment)
    size = len(example.text)
    assert example.weights.shape == (size, size)
    assert (np.triu(example.weights, k=1) == 0).all()
    assert np.allclose(example.weights.sum(axis=1), 1.0, atol=1e-5)
    assert example.text[example.clue_position] == "s"
    assert example.clue_position < example.query_position
    # Measured 0.98: from the end of the verb, the head looks at the "s" of the subject.
    assert example.weights[example.query_position, example.clue_position] > 0.5
