import importlib.util
import math

import keras
import numpy as np
import pytest
import tensorflow as tf

from data import TEST_SIZE, TRAIN_SIZE, moons_test, moons_train
from demo import SAME_LOSS_BOUND, Runs, accuracies, largest_gap, loss_csv, render_markdown, run_all
from keras_api import train_with_fit
from model import EPOCHS, LEARNING_RATE, accuracy, as_arrays, build_model, make_loss
from render import loss_curves_svg
from side_by_side import (
    CONCEPTS,
    PYTORCH_TEST_ACCURACY,
    PYTORCH_TRAIN_ACCURACY,
    side_by_side_table,
)
from tape import constant_gradient, make_step, square_gradient, worked_example


# The three trainings (fit, eager tape, graph tape) run once and are shared by every test.
@pytest.fixture(scope="module")
def runs() -> Runs:
    return run_all()


# The dataset is the one of MP-AI-2: the generator was copied unchanged, and these points pin it.
def test_the_dataset_is_the_one_of_the_scratch_project() -> None:
    train_points, train_labels = moons_train()
    test_points, test_labels = moons_test()
    assert (len(train_points), len(test_points)) == (TRAIN_SIZE, TEST_SIZE) == (80, 200)
    assert train_points[0] == pytest.approx((0.7753986391732376, 0.6152188568324735), abs=1e-12)
    assert train_points[1] == pytest.approx((1.2912471997692028, -0.590198940248687), abs=1e-12)
    assert test_points[0] == pytest.approx((0.3128351500915329, 0.9140373100358059), abs=1e-12)
    assert test_points[1] == pytest.approx((0.5246971696050158, -0.17157642801364997), abs=1e-12)
    assert train_labels[:4] == [0, 1, 0, 1]
    assert sum(train_labels) == 40 and sum(test_labels) == 100
    inputs, targets = as_arrays(train_points, train_labels)
    assert inputs.shape == (80, 2) and targets.shape == (80, 1)
    assert inputs.dtype == np.float32


# MP-AI-7.1: layers.
def test_the_model_is_the_2_8_8_1_network_with_105_parameters() -> None:
    model = build_model()
    assert [layer.__class__.__name__ for layer in model.layers] == ["Dense", "Dense", "Dense"]
    assert [layer.units for layer in model.layers] == [8, 8, 1]
    assert model.count_params() == 105
    # Keras stores a kernel as (inputs, outputs), the transpose of PyTorch's (outputs, inputs).
    assert [tuple(weight.shape) for weight in model.trainable_variables] == [
        (2, 8),
        (8,),
        (8, 8),
        (8,),
        (8, 1),
        (1,),
    ]
    assert model(np.zeros((7, 2), dtype="float32")).shape == (7, 1)


def test_a_dense_layer_is_a_matrix_product_plus_a_bias() -> None:
    keras.utils.set_random_seed(0)
    model = build_model()
    layer = model.layers[0]
    inputs = np.array([[0.5, -1.0], [2.0, 0.25], [0.0, 1.0]], dtype="float32")
    by_hand = np.tanh(inputs @ layer.kernel.numpy() + layer.bias.numpy())
    assert layer(inputs).numpy() == pytest.approx(by_hand, abs=1e-6)


def test_the_same_seed_gives_the_same_starting_weights() -> None:
    def start(seed: int) -> np.ndarray:
        keras.utils.set_random_seed(seed)
        return build_model().layers[1].kernel.numpy()

    assert np.array_equal(start(7), start(7))
    assert not np.array_equal(start(7), start(8))
    assert np.abs(start(7)).max() <= 1.0
    assert not build_model().layers[1].bias.numpy().any()


# MP-AI-7.1: compile, fit, evaluate.
def test_fit_reaches_95_percent_on_the_two_moons_of_the_scratch_project(runs: Runs) -> None:
    assert runs.fit.train_accuracy >= 0.95
    assert runs.fit.test_accuracy >= 0.95


def test_fit_returns_the_loss_of_every_epoch_and_it_falls(runs: Runs) -> None:
    assert len(runs.fit.losses) == EPOCHS
    assert runs.fit.losses[-1] < 0.5 * runs.fit.losses[0]
    assert all(math.isfinite(loss) for loss in runs.fit.losses)


def test_evaluate_agrees_with_the_accuracy_counted_by_hand(runs: Runs) -> None:
    train, test = accuracies(runs.fit.model)
    assert runs.fit.train_accuracy == pytest.approx(train, abs=1e-6)
    assert runs.fit.test_accuracy == pytest.approx(test, abs=1e-6)
    assert runs.fit.test_loss > 0


def test_fit_is_reproducible_with_a_fixed_seed() -> None:
    first = train_with_fit(epochs=3)
    second = train_with_fit(epochs=3)
    assert first.losses == pytest.approx(second.losses, abs=1e-6)
    assert len(first.losses) == 3


def test_a_logit_with_from_logits_is_the_same_model_as_a_sigmoid_output() -> None:
    logits = np.array([[2.0], [-1.0], [0.5], [-3.0]], dtype="float32")
    targets = np.array([[1.0], [1.0], [0.0], [0.0]], dtype="float32")
    signs = [1.0, 1.0, -1.0, -1.0]
    by_hand = sum(
        math.log(1.0 + math.exp(-sign * logit))
        for sign, logit in zip(signs, logits.flatten().tolist(), strict=True)
    ) / len(signs)
    from_logits = float(make_loss()(targets, logits))
    probabilities = keras.ops.sigmoid(logits)
    from_probabilities = float(keras.losses.BinaryCrossentropy()(targets, probabilities))
    assert from_logits == pytest.approx(by_hand, abs=1e-5)
    assert from_probabilities == pytest.approx(by_hand, abs=1e-5)


def test_the_accuracy_metric_must_cut_a_logit_at_zero() -> None:
    logit, target = np.array([[0.2]], dtype="float32"), np.array([[1.0]], dtype="float32")
    at_zero = keras.metrics.BinaryAccuracy(threshold=0.0)
    at_half = keras.metrics.BinaryAccuracy()
    at_zero.update_state(target, logit)
    at_half.update_state(target, logit)
    # A logit of 0.2 means class 1 (probability 0.55), and the default cut at 0.5 misses it.
    assert float(at_zero.result()) == 1.0
    assert float(at_half.result()) == 0.0


# MP-AI-7.2: gradients with a tape, against values computed by hand.
def test_the_gradient_of_x_squared_at_3_is_6() -> None:
    assert square_gradient() == pytest.approx(6.0)


def test_the_gradients_of_the_worked_example_match_the_hand_computed_values() -> None:
    # f = (x + y) * z at x = 2, y = 1, z = 4: df/dx = z, df/dy = z, df/dz = x + y.
    assert worked_example() == pytest.approx((12.0, 4.0, 4.0, 3.0))


def test_a_constant_needs_tape_watch() -> None:
    assert constant_gradient(watch=False) is None
    assert constant_gradient(watch=True) == pytest.approx(6.0)


def test_a_tape_serves_one_gradient_call_unless_it_is_persistent() -> None:
    x = tf.Variable(3.0)
    with tf.GradientTape() as tape:
        y = x * x
    tape.gradient(y, x)
    with pytest.raises(RuntimeError):
        tape.gradient(y, x)
    with tf.GradientTape(persistent=True) as persistent:
        y = x * x
        z = y * x
    assert float(persistent.gradient(y, x)) == pytest.approx(6.0)
    assert float(persistent.gradient(z, x)) == pytest.approx(27.0)


def test_a_tensor_cannot_change_and_a_variable_can() -> None:
    constant = tf.constant([1.0, 2.0])
    variable = tf.Variable([1.0, 2.0])
    assert not hasattr(constant, "assign")
    variable.assign_sub([0.5, 0.5])
    assert variable.numpy().tolist() == [0.5, 1.5]
    # The parameters of a Keras 3 model are Keras variables, each one wrapping a `tf.Variable`.
    weights = build_model().trainable_variables
    assert all(isinstance(weight.value, tf.Variable) for weight in weights)


def test_one_step_is_variable_minus_learning_rate_times_gradient() -> None:
    keras.utils.set_random_seed(1)
    model = build_model()
    optimizer = keras.optimizers.SGD(learning_rate=LEARNING_RATE)
    inputs, targets = as_arrays(*moons_train())
    with tf.GradientTape() as tape:
        loss = make_loss()(targets, model(inputs, training=True))
    gradients = tape.gradient(loss, model.trainable_variables)
    before = [variable.numpy() for variable in model.trainable_variables]
    optimizer.apply_gradients(zip(gradients, model.trainable_variables, strict=True))
    for variable, old, gradient in zip(model.trainable_variables, before, gradients, strict=True):
        assert variable.numpy() == pytest.approx(old - LEARNING_RATE * gradient.numpy(), abs=1e-6)


# MP-AI-7.2: the training step written with a gradient tape.
def test_the_loss_falls_over_the_steps_of_the_tape_loop(runs: Runs) -> None:
    losses = runs.eager.losses
    assert len(losses) == EPOCHS
    assert losses[0] > losses[9] > losses[49] > losses[-1]
    assert losses[-1] < 0.5 * losses[0]


def test_the_tape_loop_reaches_95_percent(runs: Runs) -> None:
    train, test = accuracies(runs.eager.model)
    assert train >= 0.95
    assert test >= 0.95


def test_the_tape_loop_is_the_loop_fit_hides(runs: Runs) -> None:
    assert largest_gap(runs.fit.losses, runs.eager.losses) < SAME_LOSS_BOUND
    assert accuracies(runs.eager.model) == accuracies(runs.fit.model)


def test_tf_function_traces_the_step_once(runs: Runs) -> None:
    # Eager: Python runs the body at every step. Graph: only while tracing, once.
    assert runs.eager.python_runs == EPOCHS
    assert runs.graph.python_runs == 1
    assert largest_gap(runs.eager.losses, runs.graph.losses) < SAME_LOSS_BOUND


def test_a_new_input_shape_traces_the_graph_again() -> None:
    model = build_model()
    optimizer = keras.optimizers.SGD(learning_rate=0.1)
    optimizer.build(model.trainable_variables)
    step, python_runs = make_step(model, optimizer, graph=True)
    inputs, targets = as_arrays(*moons_train())
    for _ in range(3):
        step(tf.constant(inputs), tf.constant(targets))
    assert len(python_runs) == 1
    step(tf.constant(inputs[:10]), tf.constant(targets[:10]))
    assert len(python_runs) == 2


def test_accuracy_counts_the_right_answers() -> None:
    model = build_model()
    for variable in model.trainable_variables:
        variable.assign(tf.zeros_like(variable))
    model.layers[-1].bias.assign([1.0])
    # Every logit is 1, so every answer is class 1.
    inputs = np.zeros((4, 2), dtype="float32")
    targets = np.array([[1.0], [1.0], [1.0], [0.0]], dtype="float32")
    assert accuracy(model, inputs, targets) == 0.75


# MP-AI-7.3: PyTorch and TensorFlow side by side.
def test_the_table_maps_each_concept_to_both_frameworks_with_both_accuracies(runs: Runs) -> None:
    table = side_by_side_table((runs.fit.train_accuracy, runs.fit.test_accuracy), 0.5)
    assert table[0] == "| Concept | PyTorch | TensorFlow and Keras |"
    cells = [[cell.strip() for cell in row.strip("|").split("|")] for row in table[2:]]
    assert all(len(row) == 3 and all(row) for row in cells)
    concepts = {row[0] for row in cells}
    assert {"Tensor", "Gradient", "Layer", "Optimiser", "Training loop"} <= concepts
    by_concept = {row[0]: row for row in cells}
    assert "backward" in by_concept["Gradient"][1] and "GradientTape" in by_concept["Gradient"][2]
    assert "nn.Linear" in by_concept["Layer"][1] and "Dense" in by_concept["Layer"][2]
    assert "fit" in by_concept["Training loop"][2]
    test_row = table[-1]
    assert f"{PYTORCH_TEST_ACCURACY:.1%}" in test_row
    assert f"{runs.fit.test_accuracy:.1%}" in test_row and "50.0%" in test_row
    assert f"{PYTORCH_TRAIN_ACCURACY:.1%}" in table[-2]
    assert len(CONCEPTS) + 4 == len(table)


def test_the_quoted_pytorch_accuracy_is_the_one_committed_by_pytorch_basics() -> None:
    # pytorch-basics/results/results.md, first row of "Training on the two moons".
    assert (PYTORCH_TRAIN_ACCURACY, PYTORCH_TEST_ACCURACY) == (0.975, 0.980)
    assert PYTORCH_TEST_ACCURACY >= 0.95


def test_this_project_contains_no_pytorch() -> None:
    assert importlib.util.find_spec("torch") is None


def test_the_report_has_every_section_and_no_failed_check(runs: Runs) -> None:
    report = render_markdown(runs)
    for text in (
        "dy/dx = 6",
        "df/dx = 4   df/dy = 4   df/dz = 3",
        "without tape.watch = None, with tape.watch = 6",
        "## Keras: compile, fit, evaluate",
        "## The same training step with a gradient tape",
        "## PyTorch and TensorFlow side by side",
    ):
        assert text in report
    assert report.count("| yes |") == 2
    assert "NO" not in report
    rows = loss_csv(runs).splitlines()
    assert rows[0] == "epoch,keras_fit,tape_eager,tape_graph" and len(rows) == EPOCHS + 1
    svg = loss_curves_svg({"fit": runs.fit.losses, "tape": runs.eager.losses}, "title")
    assert svg.count("<polyline") == 2
