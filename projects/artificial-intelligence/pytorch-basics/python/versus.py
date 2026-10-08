"""EN: From scratch against the framework: lines of code, training time and the machine.

PT: Feito à mão contra o framework: linhas de código, tempo de treinamento e a máquina.
"""

import ast
import io
import os
import platform
import statistics
import time
import tokenize
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import torch

from scratch.data import moons_train
from scratch.nn import MLP
from scratch.train import MOONS_LEARNING_RATE, MOONS_SEED
from scratch.train import fit as scratch_fit
from train import THREADS, train_moons

HERE = Path(__file__).resolve().parent

# EN: The files that implement automatic differentiation, the network and the training loop in
#     each version. The dataset generator is shared and counted in neither. PyTorch has no
#     file for automatic differentiation: that is the part the framework brings.
# PT: Os arquivos que implementam a diferenciação automática, a rede e o laço de treinamento em
#     cada versão. O gerador do conjunto de dados é compartilhado e não conta em nenhuma. O
#     PyTorch não tem arquivo de diferenciação automática: é a parte que o framework traz.
SCRATCH_FILES = {
    "Automatic differentiation": ["scratch/engine.py"],
    "Network": ["scratch/nn.py"],
    "Loss, training loop and accuracy": ["scratch/train.py"],
}
TORCH_FILES = {
    "Automatic differentiation": [],
    "Network": ["model.py"],
    "Loss, training loop and accuracy": ["train.py"],
}
IMAGE = "python:3.14.8-slim-trixie"


def count_code_lines(source: str) -> int:
    """EN: Lines that hold code: not blank, not only a comment, not part of a docstring.

    The teaching comments of this repository are long, so counting every line would measure the
    comments. The tokenizer says which lines hold a real token, and the syntax tree says which
    strings are docstrings.

    PT: Linhas que contêm código: não vazias, não só comentário, não parte de uma docstring.

    Os comentários didáticos deste repositório são longos, então contar todas as linhas mediria
    os comentários. O tokenizador diz quais linhas têm um token de verdade, e a árvore sintática
    diz quais strings são docstrings.
    """
    ignored = {
        tokenize.COMMENT,
        tokenize.NL,
        tokenize.NEWLINE,
        tokenize.INDENT,
        tokenize.DEDENT,
        tokenize.ENCODING,
        tokenize.ENDMARKER,
    }
    code: set[int] = set()
    for token in tokenize.generate_tokens(io.StringIO(source).readline):
        if token.type not in ignored:
            code.update(range(token.start[0], token.end[0] + 1))
    owners = (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)
    for node in ast.walk(ast.parse(source)):
        if not isinstance(node, owners) or not node.body:
            continue
        first = node.body[0]
        if (
            isinstance(first, ast.Expr)
            and isinstance(first.value, ast.Constant)
            and isinstance(first.value.value, str)
        ):
            code -= set(range(first.lineno, (first.end_lineno or first.lineno) + 1))
    return len(code)


def count_files(names: list[str]) -> int:
    return sum(count_code_lines((HERE / name).read_text(encoding="utf-8")) for name in names)


@dataclass
class Timing:
    """EN: Wall-clock seconds of several runs. PT: Segundos de relógio de várias execuções."""

    seconds: list[float]

    @property
    def median(self) -> float:
        return statistics.median(self.seconds)

    @property
    def fastest(self) -> float:
        return min(self.seconds)

    @property
    def slowest(self) -> float:
        return max(self.seconds)


def time_runs(function: Callable[[], object], runs: int) -> Timing:
    seconds = []
    for _ in range(runs):
        start = time.perf_counter()
        function()
        seconds.append(time.perf_counter() - start)
    return Timing(seconds)


def train_scratch(epochs: int) -> list[float]:
    """EN: The from-scratch training of MP-AI-2, for a given number of epochs.

    PT: O treinamento feito à mão do MP-AI-2, por um número dado de épocas.
    """
    points, labels = moons_train()
    model = MLP(2, [8, 8, 1], seed=MOONS_SEED)
    return scratch_fit(model, points, labels, epochs, MOONS_LEARNING_RATE)


@dataclass
class Measurement:
    """EN: Both timings, and the losses of the from-scratch run so the demo can reuse them.

    PT: As duas medições, e as perdas da execução feita à mão para a demo reaproveitar.
    """

    epochs: int
    scratch: Timing
    framework: Timing
    scratch_losses: list[float]


def measure(runs: int, epochs: int) -> Measurement:
    """EN: Times the same job in both versions: build the 2-8-8-1 network and train it for
    `epochs` epochs on the 80 training points. One PyTorch run is thrown away first, because
    the first call pays for one-time start-up work that is not training.

    PT: Mede o mesmo trabalho nas duas versões: construir a rede 2-8-8-1 e treiná-la por
    `epochs` épocas nos 80 pontos de treino. Uma execução do PyTorch é descartada antes, porque
    a primeira chamada paga por um trabalho de inicialização que não é treinamento.
    """
    train_moons(epochs=epochs)
    losses: list[float] = []

    def scratch_run() -> None:
        losses[:] = train_scratch(epochs)

    scratch = time_runs(scratch_run, runs)
    framework = time_runs(lambda: train_moons(epochs=epochs), runs)
    return Measurement(epochs, scratch, framework, losses)


# EN: The from-scratch version needs seconds for a few epochs, so the timing uses 20 epochs and
#     not the 120 of the full training. Both versions are timed on the same 20.
# PT: A versão feita à mão precisa de segundos para poucas épocas, então a medição usa 20
#     épocas e não as 120 do treinamento completo. As duas versões são medidas nas mesmas 20.
TIMING_RUNS = 5
TIMING_EPOCHS = 20


def cpu_model() -> str:
    try:
        lines = Path("/proc/cpuinfo").read_text(encoding="utf-8").splitlines()
    except OSError:
        return platform.processor() or "unknown"
    for line in lines:
        if line.lower().startswith("model name"):
            return line.split(":", 1)[1].strip()
    return platform.machine()


def machine() -> dict[str, str]:
    return {
        "CPU": cpu_model(),
        "Logical cores seen by the container": str(os.cpu_count()),
        "Threads PyTorch may use": str(THREADS),
        "System": f"{platform.system()} {platform.release()} ({platform.machine()})",
        "Image": IMAGE,
        "Python": platform.python_version(),
        "PyTorch": torch.__version__,
    }
