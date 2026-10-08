"""EN: `python demo.py` trains the two networks and writes the loss per epoch, the loss curve and
the decision boundary to results/.

PT: `python demo.py` treina as duas redes e grava a perda por época, a curva de perda e a
fronteira de decisão em results/.
"""

import os
from pathlib import Path

from data import MOONS_NOISE, TEST_SIZE, TRAIN_SIZE, XOR_LABELS, XOR_POINTS, moons_test, moons_train
from engine import Value
from render import decision_boundary_svg, decision_boundary_text, loss_curve_svg
from train import (
    MOONS_EPOCHS,
    MOONS_LEARNING_RATE,
    XOR_EPOCHS,
    XOR_LEARNING_RATE,
    Run,
    moons_accuracies,
    probability,
    train_moons,
    train_xor,
)


def worked_example() -> list[str]:
    """EN: The example of the docs, f = (x + y) * z, computed by the engine.

    PT: O exemplo da documentação, f = (x + y) * z, calculado pelo motor.
    """
    x, y, z = Value(2.0), Value(1.0), Value(4.0)
    f = (x + y) * z
    f.backward()
    return [
        "```text",
        f"f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = {f.data:g}",
        f"df/dx = {x.grad:g}   df/dy = {y.grad:g}   df/dz = {z.grad:g}",
        "```",
    ]


def loss_csv(losses: list[float]) -> str:
    lines = ["epoch,loss"]
    lines += [f"{epoch},{loss:.4f}" for epoch, loss in enumerate(losses, start=1)]
    return "\n".join(lines) + "\n"


def render_markdown(xor: Run, moons: Run) -> str:
    train_accuracy, test_accuracy = moons_accuracies(moons.model)
    xor_parameters = len(xor.model.parameters())
    moons_parameters = len(moons.model.parameters())
    lines = [
        "# Results: neural-network-from-scratch",
        "",
        "Generated with `docker compose run --rm python-demo` (Python, no dependencies, fixed "
        "seeds).",
        "",
        "## Backpropagation on one expression",
        "",
        *worked_example(),
        "",
        "## XOR",
        "",
        f"Network 2-4-1 with tanh ({xor_parameters} parameters), {XOR_EPOCHS} epochs of gradient "
        f"descent, learning rate {XOR_LEARNING_RATE}.",
        "",
        "| x1 | x2 | XOR | P(class 1) | Answer |",
        "| ---: | ---: | ---: | ---: | ---: |",
    ]
    for (x1, x2), label in zip(XOR_POINTS, XOR_LABELS, strict=True):
        chance = probability(xor.model, (x1, x2))
        lines.append(f"| {x1:g} | {x2:g} | {label} | {chance:.3f} | {int(chance > 0.5)} |")
    lines += [
        "",
        f"Loss: {xor.losses[0]:.4f} in the first epoch, {xor.losses[-1]:.4f} in the last. "
        "Per epoch: [`loss-xor.csv`](loss-xor.csv).",
        "",
        "## Two moons",
        "",
        f"Network 2-8-8-1 with tanh ({moons_parameters} parameters), {MOONS_EPOCHS} epochs, "
        f"learning rate {MOONS_LEARNING_RATE}. {TRAIN_SIZE} training points and {TEST_SIZE} test "
        f"points, generated with noise {MOONS_NOISE} and different seeds.",
        "",
        "| Set | Points | Accuracy |",
        "| --- | ---: | ---: |",
        f"| Training | {TRAIN_SIZE} | {train_accuracy:.1%} |",
        f"| Test (never used in training) | {TEST_SIZE} | {test_accuracy:.1%} |",
        "",
        "| Epoch | Loss |",
        "| ---: | ---: |",
    ]
    marks = sorted({0, 1, 4, 9, 24, 49, 99, MOONS_EPOCHS - 1} & set(range(MOONS_EPOCHS)))
    lines += [f"| {epoch + 1} | {moons.losses[epoch]:.4f} |" for epoch in marks]
    lines += [
        "",
        "Per epoch: [`loss-moons.csv`](loss-moons.csv). Curve: [`loss-curve.svg`](loss-curve.svg).",
        "",
        "![Loss per epoch](loss-curve.svg)",
        "",
        "## Decision boundary",
        "",
        "The network is asked for its answer on a grid of points. `.` is class 0, `#` is class "
        "1, and the training points are drawn on top (`o` class 0, `x` class 1).",
        "",
        "```text",
        decision_boundary_text(moons.model, *moons_train()).rstrip("\n"),
        "```",
        "",
        "In colour, with the test points: [`decision-boundary.svg`](decision-boundary.svg).",
        "",
        "![Decision boundary](decision-boundary.svg)",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    default_dir = Path(__file__).resolve().parent.parent / "results"
    results = Path(os.environ.get("RESULTS_DIR", default_dir))
    results.mkdir(parents=True, exist_ok=True)
    xor = train_xor()
    moons = train_moons()
    markdown = render_markdown(xor, moons)
    files = {
        "results.md": markdown,
        "loss-xor.csv": loss_csv(xor.losses),
        "loss-moons.csv": loss_csv(moons.losses),
        "loss-curve.svg": loss_curve_svg(moons.losses, "Two moons: training loss"),
        "decision-boundary.txt": decision_boundary_text(moons.model, *moons_train()),
        "decision-boundary.svg": decision_boundary_svg(
            moons.model, *moons_test(), "Two moons: P(class 1) and the test points"
        ),
    }
    for name, content in files.items():
        (results / name).write_text(content, encoding="utf-8", newline="\n")
    print(markdown)


if __name__ == "__main__":
    main()
