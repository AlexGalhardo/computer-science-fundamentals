"""EN: `python demo.py` trains the same network three ways (Keras `fit`, a gradient tape run
eagerly, the same tape as a graph) and writes the tables and the loss chart to results/.

PT: `python demo.py` treina a mesma rede de três formas (o `fit` do Keras, uma fita de gradiente
executada na hora, a mesma fita como grafo) e grava as tabelas e o gráfico de perda em results/.
"""

import os
import platform
from dataclasses import dataclass
from pathlib import Path

import keras
import numpy as np
import tensorflow as tf

from data import MOONS_NOISE, TEST_SIZE, TRAIN_SIZE, moons_test, moons_train
from keras_api import FitRun, train_with_fit
from model import EPOCHS, LEARNING_RATE, SEED, accuracy, as_arrays
from render import loss_curves_svg
from side_by_side import PYTORCH_SOURCE, side_by_side_table
from tape import TapeRun, constant_gradient, square_gradient, train_with_tape, worked_example

SAME_LOSS_BOUND = 1e-4


@dataclass
class Runs:
    """EN: The three trainings of the demo. PT: Os três treinamentos da demo."""

    fit: FitRun
    eager: TapeRun
    graph: TapeRun


def run_all() -> Runs:
    return Runs(train_with_fit(), train_with_tape(graph=False), train_with_tape(graph=True))


def largest_gap(left: list[float], right: list[float]) -> float:
    return max(abs(a - b) for a, b in zip(left, right, strict=True))


def accuracies(model: keras.Model) -> tuple[float, float]:
    return (
        accuracy(model, *as_arrays(*moons_train())),
        accuracy(model, *as_arrays(*moons_test())),
    )


def tape_row(label: str, run: TapeRun) -> str:
    train, test = accuracies(run.model)
    return (
        f"| {label} | {run.losses[0]:.4f} | {run.losses[-1]:.4f} | {train:.1%} | {test:.1%} | "
        f"{run.python_runs} |"
    )


def render_markdown(runs: Runs) -> str:
    f, dx, dy, dz = worked_example()
    parameters = runs.fit.model.count_params()
    same_as_fit = largest_gap(runs.fit.losses, runs.eager.losses) < SAME_LOSS_BOUND
    same_as_eager = largest_gap(runs.eager.losses, runs.graph.losses) < SAME_LOSS_BOUND
    lines = [
        "# Results: tensorflow-keras-basics",
        "",
        "Generated with `docker compose run --rm python-demo` (TensorFlow on CPU, fixed seeds). "
        f"Python {platform.python_version()}, TensorFlow {tf.__version__}, Keras "
        f"{keras.__version__}, NumPy {np.__version__}.",
        "",
        "## Gradients with a tape",
        "",
        "```text",
        f"y = x * x at x = 3                         ->   dy/dx = {square_gradient():g}",
        f"f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = {f:g}",
        f"df/dx = {dx:g}   df/dy = {dy:g}   df/dz = {dz:g}",
        "",
        f"x = tf.constant(3.0), y = x * x: gradient without tape.watch = "
        f"{constant_gradient(watch=False)}, with tape.watch = {constant_gradient(watch=True):g}",
        "```",
        "",
        "## Keras: compile, fit, evaluate",
        "",
        f"`keras.Sequential` 2-8-8-1 with tanh ({parameters} parameters), output as a logit, "
        f"`BinaryCrossentropy(from_logits=True)`, `SGD` with learning rate {LEARNING_RATE}, "
        f"{EPOCHS} epochs, full batch (`batch_size={TRAIN_SIZE}`), "
        f"`keras.utils.set_random_seed({SEED})`. {TRAIN_SIZE} training points and {TEST_SIZE} "
        f"test points, generated with noise {MOONS_NOISE}: the dataset of MP-AI-2.",
        "",
        "What `model.evaluate` returned:",
        "",
        "| Set | Points | Loss | Accuracy |",
        "| --- | ---: | ---: | ---: |",
        f"| Training | {TRAIN_SIZE} | {runs.fit.train_loss:.4f} | {runs.fit.train_accuracy:.1%} |",
        f"| Test (never used in training) | {TEST_SIZE} | {runs.fit.test_loss:.4f} | "
        f"{runs.fit.test_accuracy:.1%} |",
        "",
        "The loss per epoch that `fit` returned in its history:",
        "",
        "| Epoch | Loss |",
        "| ---: | ---: |",
    ]
    marks = sorted({0, 1, 4, 9, 24, 49, 99, EPOCHS - 1} & set(range(EPOCHS)))
    lines += [f"| {epoch + 1} | {runs.fit.losses[epoch]:.4f} |" for epoch in marks]
    fit_train, fit_test = accuracies(runs.fit.model)
    lines += [
        "",
        "Per epoch: [`loss.csv`](loss.csv). Curves: [`loss-curve.svg`](loss-curve.svg).",
        "",
        "![Loss per epoch](loss-curve.svg)",
        "",
        "## The same training step with a gradient tape",
        "",
        f"Same model, same seed, same optimiser, {EPOCHS} steps on the whole training set. The "
        "accuracies of this table are counted by hand (the answer is class 1 when the logit is "
        "positive), with no Keras metric. The last column counts how many times Python really "
        "ran the body of the step.",
        "",
        "| How it was trained | First loss | Last loss | Training accuracy | Test accuracy | "
        "Python ran the step |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
        f"| `model.fit` | {runs.fit.losses[0]:.4f} | {runs.fit.losses[-1]:.4f} | {fit_train:.1%} "
        f"| {fit_test:.1%} | hidden |",
        tape_row("Gradient tape, eager", runs.eager),
        tape_row("Gradient tape inside `tf.function`", runs.graph),
        "",
        f"| The loss of every epoch differs by less than {SAME_LOSS_BOUND:g} | |",
        "| --- | --- |",
        f"| `fit` against the eager tape loop | {'yes' if same_as_fit else 'NO'} |",
        f"| the eager tape loop against the `tf.function` one | "
        f"{'yes' if same_as_eager else 'NO'} |",
        "",
        "## PyTorch and TensorFlow side by side",
        "",
        *side_by_side_table(
            (runs.fit.train_accuracy, runs.fit.test_accuracy), accuracies(runs.eager.model)[1]
        ),
        "",
        f"The PyTorch accuracies were measured by the mini-project pytorch-basics (MP-AI-6) and "
        f"are quoted from its committed `{PYTORCH_SOURCE}` (same dataset, same network, same "
        "starting rule, seed 7, 120 epochs). This project contains no PyTorch. The two frameworks "
        "draw different random starting weights from the same seed number, so the accuracies are "
        "close and not equal.",
        "",
    ]
    return "\n".join(lines)


def loss_csv(runs: Runs) -> str:
    lines = ["epoch,keras_fit,tape_eager,tape_graph"]
    columns = zip(runs.fit.losses, runs.eager.losses, runs.graph.losses, strict=True)
    for epoch, losses in enumerate(columns):
        lines.append(f"{epoch + 1}," + ",".join(f"{loss:.4f}" for loss in losses))
    return "\n".join(lines) + "\n"


def main() -> None:
    default_dir = Path(__file__).resolve().parent.parent / "results"
    results = Path(os.environ.get("RESULTS_DIR", default_dir))
    results.mkdir(parents=True, exist_ok=True)
    runs = run_all()
    markdown = render_markdown(runs)
    curves = {"model.fit": runs.fit.losses, "gradient tape": runs.eager.losses}
    files = {
        "results.md": markdown,
        "loss.csv": loss_csv(runs),
        "loss-curve.svg": loss_curves_svg(curves, "Two moons with Keras: training loss"),
    }
    for name, content in files.items():
        (results / name).write_text(content, encoding="utf-8", newline="\n")
    print(markdown)


if __name__ == "__main__":
    main()
