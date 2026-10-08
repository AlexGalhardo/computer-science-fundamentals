import math
from collections.abc import Callable

import pytest

from data import XOR_LABELS, XOR_POINTS, moons_test, moons_train
from demo import loss_csv, render_markdown
from engine import Value
from nn import MLP
from render import decision_boundary_svg, decision_boundary_text, loss_curve_svg
from train import (
    Run,
    accuracy,
    fit,
    mean_loss,
    moons_accuracies,
    predict,
    probability,
    train_moons,
    train_xor,
)

H = 1e-6
TOLERANCE = 1e-6


def numerical_gradient(
    function: Callable[[list[float]], float], inputs: list[float]
) -> list[float]:
    """Centred differences: (f(x + h) - f(x - h)) / 2h, one input at a time."""
    gradients = []
    for index in range(len(inputs)):
        up = [*inputs]
        down = [*inputs]
        up[index] += H
        down[index] -= H
        gradients.append((function(up) - function(down)) / (2 * H))
    return gradients


def analytic_gradient(
    function: Callable[[list[Value]], Value], inputs: list[float]
) -> tuple[float, list[float]]:
    values = [Value(value) for value in inputs]
    out = function(values)
    out.backward()
    return out.data, [value.grad for value in values]


# MP-AI-2.1: every operation of the engine, alone and combined, against the numerical gradient.
EXPRESSIONS: dict[str, tuple[Callable[[list[Value]], Value], list[float]]] = {
    "add": (lambda v: v[0] + v[1], [2.0, -3.0]),
    "add a constant": (lambda v: v[0] + 5.0, [2.0]),
    "constant on the left": (lambda v: 5.0 + v[0], [2.0]),
    "sub": (lambda v: v[0] - v[1], [2.0, -3.0]),
    "constant minus value": (lambda v: 1.0 - v[0], [0.3]),
    "neg": (lambda v: -v[0], [1.5]),
    "mul": (lambda v: v[0] * v[1], [2.0, -3.0]),
    "mul by a constant": (lambda v: 3.0 * v[0], [2.0]),
    "div": (lambda v: v[0] / v[1], [2.0, -3.0]),
    "constant over value": (lambda v: 2.0 / v[0], [0.7]),
    "pow": (lambda v: v[0] ** 3, [1.7]),
    "square root": (lambda v: v[0] ** 0.5, [2.2]),
    "tanh": (lambda v: v[0].tanh(), [0.4]),
    "relu, positive side": (lambda v: v[0].relu(), [0.8]),
    "relu, negative side": (lambda v: v[0].relu(), [-0.8]),
    "sigmoid": (lambda v: v[0].sigmoid(), [-0.6]),
    "exp": (lambda v: v[0].exp(), [0.9]),
    "log": (lambda v: v[0].log(), [1.3]),
    "a value used twice": (lambda v: v[0] * v[0] + v[0], [3.0]),
    "the example of the docs": (lambda v: (v[0] + v[1]) * v[2], [2.0, 1.0, 4.0]),
    "one neuron": (lambda v: (v[0] * v[2] + v[1] * v[3] + v[4]).tanh(), [1.0, 2.0, 0.5, -1.0, 0.5]),
    "a deep mix": (
        lambda v: ((v[0] * v[1]).tanh() + (v[1] / v[2]).sigmoid() * v[0].exp()).log() - v[2] ** 2,
        [0.5, 1.2, 2.0],
    ),
}


@pytest.mark.parametrize("name", EXPRESSIONS)
def test_analytic_gradient_matches_numerical_gradient(name: str) -> None:
    function, inputs = EXPRESSIONS[name]
    _, analytic = analytic_gradient(function, inputs)
    numerical = numerical_gradient(lambda xs: function([Value(x) for x in xs]).data, inputs)
    for got, expected in zip(analytic, numerical, strict=True):
        assert got == pytest.approx(expected, abs=TOLERANCE, rel=TOLERANCE)


def test_the_example_of_the_docs_has_the_gradients_computed_by_hand() -> None:
    value, gradients = analytic_gradient(lambda v: (v[0] + v[1]) * v[2], [2.0, 1.0, 4.0])
    assert value == 12.0
    assert gradients == [4.0, 4.0, 3.0]


def test_gradients_accumulate_until_they_are_cleared() -> None:
    x = Value(3.0)
    (x * x).backward()
    assert x.grad == 6.0
    (x * x).backward()
    assert x.grad == 12.0


# MP-AI-2.1, on a whole network: the gradient of the loss with respect to EVERY weight.
def test_every_weight_of_an_mlp_matches_the_numerical_gradient() -> None:
    model = MLP(2, [3, 3, 1], seed=1)
    points = [(0.5, -1.0), (-0.3, 0.8), (1.2, 0.4)]
    labels = [1, 0, 1]
    model.zero_grad()
    mean_loss(model, points, labels).backward()
    parameters = model.parameters()
    assert len(parameters) == (2 * 3 + 3) + (3 * 3 + 3) + (3 + 1)
    for parameter in parameters:
        original = parameter.data
        parameter.data = original + H
        up = mean_loss(model, points, labels).data
        parameter.data = original - H
        down = mean_loss(model, points, labels).data
        parameter.data = original
        assert parameter.grad == pytest.approx((up - down) / (2 * H), abs=TOLERANCE, rel=TOLERANCE)


def test_the_same_seed_gives_the_same_network() -> None:
    first = [parameter.data for parameter in MLP(2, [4, 1], seed=3).parameters()]
    second = [parameter.data for parameter in MLP(2, [4, 1], seed=3).parameters()]
    assert first == second
    assert first != [parameter.data for parameter in MLP(2, [4, 1], seed=4).parameters()]


def test_one_step_of_gradient_descent_lowers_the_loss() -> None:
    model = MLP(2, [4, 1], seed=5)
    losses = fit(model, XOR_POINTS, XOR_LABELS, epochs=2, learning_rate=0.1)
    assert losses[1] < losses[0]


@pytest.fixture(scope="module")
def xor() -> Run:
    return train_xor()


@pytest.fixture(scope="module")
def moons() -> Run:
    return train_moons()


# MP-AI-2.2: with a fixed seed it learns XOR exactly.
def test_learns_xor_exactly(xor: Run) -> None:
    assert [predict(xor.model, point) for point in XOR_POINTS] == XOR_LABELS
    for point, label in zip(XOR_POINTS, XOR_LABELS, strict=True):
        assert abs(probability(xor.model, point) - label) < 0.1
    assert xor.losses[-1] < 0.05 < xor.losses[0]


def test_a_single_neuron_cannot_learn_xor() -> None:
    # No hidden layer means one straight line, and no line separates XOR: at most 3 of 4.
    for seed in range(5):
        model = MLP(2, [1], seed=seed)
        fit(model, XOR_POINTS, XOR_LABELS, epochs=200, learning_rate=0.5)
        assert accuracy(model, XOR_POINTS, XOR_LABELS) <= 0.75


# MP-AI-2.2: at least 95% accuracy on a generated two-class dataset, measured on points that
# were not used for training.
def test_reaches_95_percent_on_the_two_moons_test_set(moons: Run) -> None:
    train_accuracy, test_accuracy = moons_accuracies(moons.model)
    assert train_accuracy >= 0.95
    assert test_accuracy >= 0.95


def test_training_and_test_sets_are_different_points() -> None:
    assert not set(moons_train()[0]) & set(moons_test()[0])
    assert sorted(set(moons_train()[1])) == [0, 1]


def test_the_loss_falls_during_training(moons: Run) -> None:
    assert moons.losses[-1] < 0.5 * moons.losses[0]
    assert all(math.isfinite(loss) for loss in moons.losses)


# MP-AI-2.3: the loss per epoch and a rendering of the decision boundary.
def test_the_demo_writes_the_loss_per_epoch(moons: Run) -> None:
    rows = loss_csv(moons.losses).splitlines()
    assert rows[0] == "epoch,loss"
    assert len(rows) == len(moons.losses) + 1
    assert rows[1].startswith("1,")


def test_the_decision_boundary_has_both_regions_and_both_classes(moons: Run) -> None:
    text = decision_boundary_text(moons.model, *moons_train())
    lines = text.splitlines()
    assert len(lines) == 24
    assert {len(line) for line in lines} == {64}
    assert set(text) == {".", "#", "o", "x", "\n"}
    svg = decision_boundary_svg(moons.model, *moons_test(), "title")
    assert svg.startswith("<svg") and svg.count("<circle") == len(moons_test()[0])
    assert loss_curve_svg(moons.losses, "title").count("<polyline") == 1


def test_the_report_has_every_section(xor: Run, moons: Run) -> None:
    report = render_markdown(xor, moons)
    for heading in ("## XOR", "## Two moons", "## Decision boundary", "df/dx = 4"):
        assert heading in report


def test_two_moons_is_reproducible() -> None:
    assert moons_train() == moons_train()
