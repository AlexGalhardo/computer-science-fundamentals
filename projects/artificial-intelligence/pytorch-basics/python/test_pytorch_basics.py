import math
import re

import pytest
import torch
from torch import nn

from demo import render_results, render_timing, train_from_scratch_weights
from gradients import (
    GradientCheck,
    check_gradients,
    copy_scratch_weights,
    largest_gap,
)
from model import MoonsNet, count_parameters, start_like_scratch
from render import loss_curves_svg
from scratch.data import TEST_SIZE, TRAIN_SIZE, moons_test, moons_train
from scratch.nn import MLP
from tensors import (
    accumulation,
    elementwise_and_matrix_product,
    linear_layer_by_hand,
    worked_example,
)
from train import (
    EPOCHS,
    LEARNING_RATE,
    Run,
    accuracy,
    as_tensors,
    fit,
    moons_accuracies,
    prepare,
    train_moons,
)
from versus import (
    SCRATCH_FILES,
    TORCH_FILES,
    count_code_lines,
    count_files,
    machine,
    measure,
    train_scratch,
)


@pytest.fixture(scope="module")
def check() -> GradientCheck:
    return check_gradients()


@pytest.fixture(scope="module")
def run() -> Run:
    return train_moons()


@pytest.fixture(scope="module")
def copied() -> Run:
    return train_from_scratch_weights()


# The dataset is the one of MP-AI-2: the generator was copied unchanged, and these points pin it.
def test_the_dataset_is_the_one_of_the_scratch_project() -> None:
    train_points, train_labels = moons_train()
    test_points, test_labels = moons_test()
    assert (len(train_points), len(test_points)) == (TRAIN_SIZE, TEST_SIZE) == (80, 200)
    assert train_points[0] == pytest.approx((0.7753986391732376, 0.6152188568324735), abs=1e-12)
    assert train_points[1] == pytest.approx((1.2912471997692028, -0.590198940248687), abs=1e-12)
    assert train_points[2] == pytest.approx((0.9912684050771835, 0.26590610358115974), abs=1e-12)
    assert test_points[0] == pytest.approx((0.3128351500915329, 0.9140373100358059), abs=1e-12)
    assert test_points[1] == pytest.approx((0.5246971696050158, -0.17157642801364997), abs=1e-12)
    assert train_labels[:4] == [0, 1, 0, 1]
    assert sum(train_labels) == 40 and sum(test_labels) == 100
    assert not set(train_points) & set(test_points)


# MP-AI-6.1: tensors.
def test_a_tensor_has_a_shape_and_a_dtype() -> None:
    inputs, targets = as_tensors(*moons_train())
    assert inputs.shape == (80, 2)
    assert targets.shape == (80, 1)
    assert inputs.dtype == torch.float32
    assert as_tensors(*moons_train(), dtype=torch.float64)[0].dtype == torch.float64


def test_star_multiplies_elementwise_and_at_is_the_matrix_product() -> None:
    elementwise, product = elementwise_and_matrix_product()
    assert elementwise.tolist() == [[5.0, 12.0], [21.0, 32.0]]
    assert product.tolist() == [[19.0, 22.0], [43.0, 50.0]]


def test_broadcasting_repeats_the_smaller_tensor() -> None:
    matrix = torch.zeros(3, 2)
    row = torch.tensor([10.0, 20.0])
    assert (matrix + row).tolist() == [[10.0, 20.0]] * 3
    column = torch.tensor([[1.0], [2.0], [3.0]])
    assert (column + row).shape == (3, 2)
    with pytest.raises(RuntimeError):
        torch.zeros(3, 2) + torch.zeros(3)


def test_a_linear_layer_is_a_matrix_product_plus_a_bias() -> None:
    torch.manual_seed(0)
    layer = nn.Linear(2, 8)
    inputs = torch.randn(5, 2)
    by_hand = linear_layer_by_hand(inputs, layer.weight, layer.bias)
    assert layer.weight.shape == (8, 2) and layer.bias.shape == (8,)
    assert by_hand.shape == (5, 8)
    assert torch.allclose(by_hand, layer(inputs), atol=1e-6)


def test_the_network_has_105_parameters_and_outputs_one_logit_per_point() -> None:
    model = MoonsNet()
    assert count_parameters(model) == 105 == len(MLP(2, [8, 8, 1], seed=1).parameters())
    assert model(torch.zeros(7, 2)).shape == (7, 1)
    assert [tuple(p.shape) for p in model.parameters()] == [
        (8, 2),
        (8,),
        (8, 8),
        (8,),
        (1, 8),
        (1,),
    ]


# MP-AI-6.1: automatic differentiation.
def test_backward_fills_grad_on_the_worked_example() -> None:
    assert worked_example() == (12.0, 4.0, 4.0, 3.0)


def test_only_tensors_that_require_grad_get_a_gradient() -> None:
    x = torch.tensor(2.0, requires_grad=True)
    constant = torch.tensor(5.0)
    y = x * constant
    assert y.requires_grad and not constant.requires_grad
    y.backward()
    assert x.grad.item() == 5.0
    assert constant.grad is None


def test_gradients_accumulate_until_they_are_cleared() -> None:
    assert accumulation() == (6.0, 12.0, 0.0)


def test_zero_grad_of_the_optimiser_clears_every_parameter() -> None:
    model = MoonsNet()
    inputs, targets = as_tensors(*moons_train())
    optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
    nn.BCEWithLogitsLoss()(model(inputs), targets).backward()
    first = model.output.weight.grad.clone()
    nn.BCEWithLogitsLoss()(model(inputs), targets).backward()
    assert torch.allclose(model.output.weight.grad, 2 * first)
    optimizer.zero_grad()
    # Since PyTorch 2.0 zero_grad sets the gradients to None instead of filling them with zeros.
    assert all(p.grad is None or not p.grad.any() for p in model.parameters())


def test_no_grad_stops_recording_and_eval_does_not() -> None:
    model = MoonsNet()
    inputs = torch.zeros(3, 2)
    model.eval()
    assert model(inputs).requires_grad
    with torch.no_grad():
        assert not model(inputs).requires_grad
    assert not model.training
    model.train()
    assert model.training


# MP-AI-6.1: the same small network in both versions.
def test_the_copied_network_computes_the_same_logits() -> None:
    scratch = MLP(2, [8, 8, 1], seed=11)
    model = copy_scratch_weights(scratch)
    points, _ = moons_test()
    with torch.no_grad():
        logits = model(torch.tensor(points[:20], dtype=torch.float64)).flatten().tolist()
    expected = [scratch(list(point)).data for point in points[:20]]
    assert logits == pytest.approx(expected, abs=1e-12)


def test_both_versions_compute_the_same_loss(check: GradientCheck) -> None:
    assert check.torch_loss == pytest.approx(check.scratch_loss, abs=1e-12)


def test_pytorch_gradients_match_the_hand_written_backpropagation(check: GradientCheck) -> None:
    assert len(check.torch) == len(check.scratch) == 105
    assert largest_gap(check.torch, check.scratch) < 1e-10
    # The check would be empty if every gradient were zero.
    assert max(abs(gradient) for gradient in check.torch) > 1e-2


def test_pytorch_gradients_match_numerical_gradients(check: GradientCheck) -> None:
    assert len(check.numerical) == 105
    assert largest_gap(check.torch, check.numerical) < 1e-6
    assert largest_gap(check.scratch, check.numerical) < 1e-6


def test_the_three_gradients_agree_for_another_seed() -> None:
    other = check_gradients(seed=3)
    assert largest_gap(other.torch, other.scratch) < 1e-10
    assert largest_gap(other.torch, other.numerical) < 1e-6


def test_a_wrong_gradient_would_be_caught(check: GradientCheck) -> None:
    # A sign error on a single weight is far outside the tolerance.
    broken = [-check.torch[0], *check.torch[1:]]
    assert largest_gap(broken, check.numerical) > 1e-3


# MP-AI-6.2: the training loop written by hand.
def test_reaches_95_percent_on_the_two_moons_of_the_scratch_project(run: Run) -> None:
    train_accuracy, test_accuracy = moons_accuracies(run.model)
    assert train_accuracy >= 0.95
    assert test_accuracy >= 0.95


def test_the_loss_falls_during_training(run: Run) -> None:
    assert len(run.losses) == EPOCHS
    assert run.losses[-1] < 0.5 * run.losses[0]
    assert all(math.isfinite(loss) for loss in run.losses)


def test_the_same_seed_gives_the_same_training(run: Run) -> None:
    again = train_moons()
    assert again.losses == pytest.approx(run.losses, abs=1e-6)
    assert train_moons(seed=8).losses[0] != pytest.approx(run.losses[0], abs=1e-6)


def test_the_loss_is_the_one_written_by_hand_in_the_scratch_project() -> None:
    logits = torch.tensor([[2.0], [-1.0], [0.5], [-3.0]], dtype=torch.float64)
    targets = torch.tensor([[1.0], [1.0], [0.0], [0.0]], dtype=torch.float64)
    signs = [1.0, 1.0, -1.0, -1.0]
    by_hand = sum(
        math.log(1.0 + math.exp(-sign * logit))
        for sign, logit in zip(signs, logits.flatten().tolist(), strict=True)
    ) / len(signs)
    assert nn.BCEWithLogitsLoss()(logits, targets).item() == pytest.approx(by_hand, abs=1e-12)


def test_the_optimiser_step_is_weight_minus_learning_rate_times_gradient() -> None:
    prepare(1)
    model = MoonsNet().double()
    inputs, targets = as_tensors(*moons_train(), dtype=torch.float64)
    before = [parameter.detach().clone() for parameter in model.parameters()]
    fit(model, inputs, targets, epochs=1, learning_rate=0.5)
    # After the step `.grad` still holds the gradient that was used.
    for parameter, old in zip(model.parameters(), before, strict=True):
        assert torch.allclose(parameter, old - 0.5 * parameter.grad, atol=1e-12)


def test_from_the_same_weights_pytorch_follows_the_scratch_training(copied: Run) -> None:
    epochs = 8
    assert copied.losses[:epochs] == pytest.approx(train_scratch(epochs), abs=1e-9)


def test_from_the_same_weights_pytorch_repeats_the_published_scratch_result(copied: Run) -> None:
    # results/results.md of MP-AI-2: loss 0.4576 to 0.0604, 98.8% training, 99.5% test.
    assert copied.losses[0] == pytest.approx(0.4576, abs=1e-4)
    assert copied.losses[-1] == pytest.approx(0.0604, abs=1e-4)
    assert moons_accuracies(copied.model) == (79 / 80, 199 / 200)


def test_accuracy_counts_the_right_answers() -> None:
    model = MoonsNet()
    with torch.no_grad():
        for parameter in model.parameters():
            parameter.zero_()
        model.output.bias.fill_(1.0)
    # Every logit is 1, so every answer is class 1.
    inputs = torch.zeros(4, 2)
    assert accuracy(model, inputs, torch.tensor([[1.0], [1.0], [1.0], [0.0]])) == 0.75


def test_the_default_start_also_learns_with_more_epochs() -> None:
    assert moons_accuracies(train_moons(epochs=300, default_start=True).model)[1] >= 0.95


def test_the_scratch_start_draws_weights_in_minus_one_to_one() -> None:
    torch.manual_seed(0)
    model = MoonsNet()
    start_like_scratch(model)
    assert model.hidden2.weight.abs().max().item() <= 1.0
    assert model.hidden2.weight.abs().max().item() > 1 / math.sqrt(8)
    assert not model.hidden2.bias.any()


# MP-AI-6.3: from scratch against the framework.
def test_code_lines_ignore_blanks_comments_and_docstrings() -> None:
    source = "\n".join(
        [
            '"""Module docstring.',
            "",
            'Second paragraph."""',
            "",
            "import math  # a comment after code still counts as code",
            "",
            "# a comment line",
            "def area(radius: float) -> float:",
            '    """Docstring."""',
            "    return (",
            "        math.pi * radius**2",
            "    )",
            "",
        ]
    )
    assert count_code_lines(source) == 5


def test_the_framework_version_needs_fewer_lines() -> None:
    scratch = {part: count_files(names) for part, names in SCRATCH_FILES.items()}
    framework = {part: count_files(names) for part, names in TORCH_FILES.items()}
    assert scratch.keys() == framework.keys()
    assert framework["Automatic differentiation"] == 0 < scratch["Automatic differentiation"]
    assert 0 < framework["Network"] < scratch["Network"]
    assert 0 < sum(framework.values()) < sum(scratch.values())


def test_the_timing_table_has_both_versions_the_lines_and_the_machine(copied: Run) -> None:
    measurement = measure(runs=2, epochs=2)
    assert len(measurement.scratch.seconds) == len(measurement.framework.seconds) == 2
    assert all(seconds > 0 for seconds in measurement.scratch.seconds)
    assert all(seconds > 0 for seconds in measurement.framework.seconds)
    assert measurement.scratch.fastest <= measurement.scratch.median <= measurement.scratch.slowest
    report = render_timing(measurement, copied)
    version_row = re.compile(r"\| (From scratch|PyTorch) \(")
    rows = [line for line in report.splitlines() if version_row.match(line)]
    assert len(rows) == 2
    for row in rows:
        cells = [cell.strip() for cell in row.strip("|").split("|")]
        assert int(cells[1]) > 0
        assert all(float(cell.split()[0]) >= 0 for cell in cells[2:])
        assert float(cells[2].split()[0]) > 0 or float(cells[5].split()[0]) > 0
    assert "differ by less than 1e-09: yes" in report
    for field in ("CPU", "Python", "PyTorch", "Image"):
        assert f"| {field} |" in report
    assert machine()["PyTorch"] == torch.__version__
    assert int(machine()["Logical cores seen by the container"]) >= 1


def test_the_report_has_every_section_and_no_failed_check(check: GradientCheck, run: Run) -> None:
    quick = train_moons(epochs=EPOCHS, default_start=True)
    report = render_results(check, run, train_from_scratch_weights(), quick, quick)
    for text in (
        "df/dx = 4   df/dy = 4   df/dz = 3",
        "## The same gradients, three ways",
        "## Training on the two moons",
        "## Lines of code",
        f"learning rate {LEARNING_RATE}",
    ):
        assert text in report
    assert report.count("| yes |") == 2
    assert "NO" not in report


def test_the_loss_chart_has_one_line_per_curve(run: Run) -> None:
    svg = loss_curves_svg({"a": run.losses, "b": run.losses[:50]}, "title")
    assert svg.startswith("<svg") and svg.count("<polyline") == 2
