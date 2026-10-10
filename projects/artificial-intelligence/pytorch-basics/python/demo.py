"""EN: `python demo.py` checks the gradients, trains the network, compares the two versions and
writes everything to results/.

`results.md`, `loss.csv` and `loss-curve.svg` are deterministic (fixed seeds). `timing.md` holds
wall-clock times, which change from machine to machine and from run to run.

PT: `python demo.py` confere os gradientes, treina a rede, compara as duas versões e grava tudo em
results/.

`results.md`, `loss.csv` e `loss-curve.svg` são determinísticos (sementes fixas). `timing.md`
guarda tempos de relógio, que mudam de máquina para máquina e de execução para execução.

ES: `python demo.py` comprueba los gradientes, entrena la red, compara las dos versiones y escribe
todo en results/.

`results.md`, `loss.csv` y `loss-curve.svg` son deterministas (semillas fijas). `timing.md` guarda
tiempos de reloj, que cambian de una máquina a otra y de una ejecución a otra.
"""

import os
from pathlib import Path

import torch

from gradients import GradientCheck, check_gradients, copy_scratch_weights, largest_gap
from model import count_parameters
from render import loss_curves_svg
from scratch.data import MOONS_NOISE, TEST_SIZE, TRAIN_SIZE, moons_train
from scratch.nn import MLP
from scratch.train import MOONS_SEED
from tensors import accumulation, worked_example
from train import EPOCHS, LEARNING_RATE, SEED, Run, as_tensors, fit, moons_accuracies, train_moons
from versus import (
    SCRATCH_FILES,
    TIMING_EPOCHS,
    TIMING_RUNS,
    TORCH_FILES,
    Measurement,
    Timing,
    count_files,
    machine,
    measure,
)

DEFAULT_START_EPOCHS = 300
HAND_BOUND = 1e-12
NUMERICAL_BOUND = 1e-8
CURVE_BOUND = 1e-9


def train_from_scratch_weights() -> Run:
    """EN: PyTorch starting from the very weights MP-AI-2 starts with (its seed 7), in 64 bits.

    PT: O PyTorch partindo exatamente dos pesos com que o MP-AI-2 começa (a semente 7 dele), em
    64 bits.

    ES: PyTorch partiendo exactamente de los pesos con que empieza MP-AI-2 (su semilla 7), en
    64 bits.
    """
    model = copy_scratch_weights(MLP(2, [8, 8, 1], seed=MOONS_SEED))
    inputs, targets = as_tensors(*moons_train(), dtype=torch.float64)
    return Run(model, fit(model, inputs, targets, EPOCHS, LEARNING_RATE))


def lines_of_code_table() -> list[str]:
    rows = ["| Part | From scratch (MP-AI-2) | PyTorch |", "| --- | ---: | ---: |"]
    totals = [0, 0]
    for part in SCRATCH_FILES:
        counts = [count_files(SCRATCH_FILES[part]), count_files(TORCH_FILES[part])]
        totals = [totals[0] + counts[0], totals[1] + counts[1]]
        names = [
            ", ".join(f"`{name}`" for name in files[part]) or "none: the framework brings it"
            for files in (SCRATCH_FILES, TORCH_FILES)
        ]
        rows.append(f"| {part} | {counts[0]} ({names[0]}) | {counts[1]} ({names[1]}) |")
    rows.append(f"| **Total** | **{totals[0]}** | **{totals[1]}** |")
    return rows


def total_lines() -> tuple[int, int]:
    scratch = sum(count_files(names) for names in SCRATCH_FILES.values())
    framework = sum(count_files(names) for names in TORCH_FILES.values())
    return scratch, framework


def accuracy_row(label: str, epochs: int, run: Run) -> str:
    train, test = moons_accuracies(run.model)
    return (
        f"| {label} | {epochs} | {run.losses[0]:.4f} | {run.losses[-1]:.4f} | {train:.1%} | "
        f"{test:.1%} |"
    )


def render_results(
    check: GradientCheck, main: Run, copied: Run, default: Run, default_long: Run
) -> str:
    f, dx, dy, dz = worked_example()
    once, twice, cleared = accumulation()
    hand_gap = largest_gap(check.torch, check.scratch)
    numerical_gap = largest_gap(check.torch, check.numerical)
    lines = [
        "# Results: pytorch-basics",
        "",
        "Generated with `docker compose run --rm python-demo` (PyTorch on CPU, fixed seeds). The "
        "wall-clock times are in [`timing.md`](timing.md), the only file here that changes from "
        "run to run.",
        "",
        "## Automatic differentiation on one expression",
        "",
        "```text",
        f"f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = {f:g}",
        f"df/dx = {dx:g}   df/dy = {dy:g}   df/dz = {dz:g}",
        "",
        f"x * x at x = 3: x.grad after one backward() = {once:g}, after a second one = {twice:g}, "
        f"after zero_() = {cleared:g}",
        "```",
        "",
        "## The same gradients, three ways",
        "",
        f"The 2-8-8-1 network of MP-AI-2 (seed {MOONS_SEED}, {len(check.torch)} parameters) was "
        f"copied weight by weight into PyTorch, in 64-bit floats. Both compute the loss on the "
        f"{check.points} training points and run backpropagation.",
        "",
        "| | From scratch (MP-AI-2) | PyTorch |",
        "| --- | ---: | ---: |",
        f"| Loss | {check.scratch_loss:.10f} | {check.torch_loss:.10f} |",
        "",
        "The first six of the gradients (the first two neurons of the first layer):",
        "",
        "| Parameter | Hand-written backpropagation | PyTorch `backward()` | Numerical |",
        "| --- | ---: | ---: | ---: |",
    ]
    names = ["w[0][0]", "w[0][1]", "b[0]", "w[1][0]", "w[1][1]", "b[1]"]
    for index, name in enumerate(names):
        lines.append(
            f"| `hidden1` {name} | {check.scratch[index]:.6f} | {check.torch[index]:.6f} | "
            f"{check.numerical[index]:.6f} |"
        )
    lines += [
        "",
        f"| Largest difference over the {len(check.torch)} gradients | Limit | Within the limit |",
        "| --- | ---: | --- |",
        f"| PyTorch against the hand-written backpropagation | {HAND_BOUND:g} | "
        f"{'yes' if hand_gap < HAND_BOUND else 'NO'} |",
        f"| PyTorch against the numerical gradient | {NUMERICAL_BOUND:g} | "
        f"{'yes' if numerical_gap < NUMERICAL_BOUND else 'NO'} |",
        "",
        "## Training on the two moons",
        "",
        f"Network 2-8-8-1 with tanh ({count_parameters(main.model)} parameters), "
        f"`BCEWithLogitsLoss`, `torch.optim.SGD` with learning rate {LEARNING_RATE}, full batch. "
        f"{TRAIN_SIZE} training points and {TEST_SIZE} test points, generated with noise "
        f"{MOONS_NOISE}: the dataset of MP-AI-2.",
        "",
        "| Starting weights | Epochs | First loss | Last loss | Training accuracy | "
        "Test accuracy |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
        accuracy_row(
            f"The rule of MP-AI-2, drawn by PyTorch (`torch.manual_seed({SEED})`)", EPOCHS, main
        ),
        accuracy_row(f"Copied from MP-AI-2 (its seed {MOONS_SEED}), 64-bit floats", EPOCHS, copied),
        accuracy_row("The default of `nn.Linear`", EPOCHS, default),
        accuracy_row("The default of `nn.Linear`", DEFAULT_START_EPOCHS, default_long),
        "",
        "The first row is the run of the acceptance criterion. The second one repeats MP-AI-2 "
        "number by number: its published result is a loss from 0.4576 to 0.0604, 98.8% on the "
        "training points and 99.5% on the test points.",
        "",
        "Loss of the first row:",
        "",
        "| Epoch | Loss |",
        "| ---: | ---: |",
    ]
    marks = sorted({0, 1, 4, 9, 24, 49, 99, EPOCHS - 1} & set(range(EPOCHS)))
    lines += [f"| {epoch + 1} | {main.losses[epoch]:.4f} |" for epoch in marks]
    lines += [
        "",
        "Per epoch: [`loss.csv`](loss.csv). Curves: [`loss-curve.svg`](loss-curve.svg).",
        "",
        "![Loss per epoch](loss-curve.svg)",
        "",
        "## Lines of code",
        "",
        "Lines that hold code: blank lines, comment lines and docstrings are not counted "
        "(`count_code_lines` in `python/versus.py`).",
        "",
        *lines_of_code_table(),
        "",
        "Training time and the machine: [`timing.md`](timing.md).",
        "",
    ]
    return "\n".join(lines)


def timing_row(label: str, lines: int, timing: Timing, epochs: int) -> str:
    per_epoch = 1000 * timing.median / epochs
    return (
        f"| {label} | {lines} | {timing.median:.3f} s | {timing.fastest:.3f} s | "
        f"{timing.slowest:.3f} s | {per_epoch:.2f} ms |"
    )


def render_timing(measurement: Measurement, copied: Run) -> str:
    scratch_lines, torch_lines = total_lines()
    epochs = measurement.epochs
    runs = len(measurement.scratch.seconds)
    ratio = measurement.scratch.median / measurement.framework.median
    # EN: The from-scratch losses of the timed run and the PyTorch losses from the same starting
    #     weights must be the same curve.
    # PT: As perdas feitas à mão da execução medida e as perdas do PyTorch a partir dos mesmos
    #     pesos iniciais precisam ser a mesma curva.
    # ES: Las pérdidas hechas a mano de la ejecución medida y las pérdidas de PyTorch a partir de
    #     los mismos pesos iniciales tienen que ser la misma curva.
    curve_gap = largest_gap(measurement.scratch_losses, copied.losses[:epochs])
    lines = [
        "# Timing: from scratch against PyTorch",
        "",
        "Generated with `docker compose run --rm python-demo`. **These are wall-clock times: they "
        "change from machine to machine and from run to run.** Everything else in `results/` is "
        "deterministic.",
        "",
        f"The job, the same in both versions and inside the same container: build the 2-8-8-1 "
        f"network and train it for {epochs} epochs of full-batch gradient descent on the "
        f"{TRAIN_SIZE} training points. {runs} runs of each version, after one discarded PyTorch "
        "run (warm-up). Lines of code are counted without blank lines, comments and docstrings.",
        "",
        f"| Version | Lines of code | Median of {runs} runs | Fastest | Slowest | Per epoch |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
        timing_row("From scratch (MP-AI-2)", scratch_lines, measurement.scratch, epochs),
        timing_row("PyTorch (this version)", torch_lines, measurement.framework, epochs),
        "",
        f"On this run PyTorch was about {ratio:.0f} times faster.",
        "",
        f"Same work, checked: over these {epochs} epochs the loss of the from-scratch run and the "
        f"loss of PyTorch started from the same weights differ by less than {CURVE_BOUND:g}: "
        f"{'yes' if curve_gap < CURVE_BOUND else 'NO'}.",
        "",
        "## Lines of code by part",
        "",
        *lines_of_code_table(),
        "",
        "## Machine",
        "",
        "| Item | Value |",
        "| --- | --- |",
        *[f"| {name} | {value} |" for name, value in machine().items()],
        "",
        "Command: `docker compose run --rm python-demo`.",
        "",
    ]
    return "\n".join(lines)


def loss_csv(main: Run, copied: Run, default: Run) -> str:
    lines = ["epoch,scratch_rule_torch_seed,copied_scratch_weights,default_start"]
    for epoch, losses in enumerate(zip(main.losses, copied.losses, default.losses, strict=True)):
        lines.append(f"{epoch + 1}," + ",".join(f"{loss:.4f}" for loss in losses))
    return "\n".join(lines) + "\n"


def main() -> None:
    default_dir = Path(__file__).resolve().parent.parent / "results"
    results = Path(os.environ.get("RESULTS_DIR", default_dir))
    results.mkdir(parents=True, exist_ok=True)
    check = check_gradients()
    run = train_moons()
    copied = train_from_scratch_weights()
    default = train_moons(default_start=True)
    default_long = train_moons(epochs=DEFAULT_START_EPOCHS, default_start=True)
    measurement = measure(TIMING_RUNS, TIMING_EPOCHS)
    markdown = render_results(check, run, copied, default, default_long)
    timing = render_timing(measurement, copied)
    curves = {
        "MP-AI-2 rule, PyTorch seed": run.losses,
        "weights copied from MP-AI-2": copied.losses,
        "default start of nn.Linear": default.losses,
    }
    files = {
        "results.md": markdown,
        "timing.md": timing,
        "loss.csv": loss_csv(run, copied, default),
        "loss-curve.svg": loss_curves_svg(curves, "Two moons with PyTorch: training loss"),
    }
    for name, content in files.items():
        (results / name).write_text(content, encoding="utf-8", newline="\n")
    print(markdown)
    print(timing)


if __name__ == "__main__":
    main()
