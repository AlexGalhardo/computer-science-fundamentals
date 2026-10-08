"""EN: `python demo.py` runs the whole experiment, prints the tables and writes results/:
results.md, the loss curve (SVG) and the pictures (PNG).

PT: `python demo.py` roda o experimento inteiro, imprime as tabelas e grava results/: results.md,
a curva de perda (SVG) e as figuras (PNG).
"""

import os
from pathlib import Path

import torch

from cnn import (
    BATCH_SIZE,
    EPOCHS,
    LEARNING_RATE,
    SEED,
    TEST_ANGLE,
    TEST_IMAGES,
    TEST_SHIFT,
    TRAIN_IMAGES,
    Experiment,
    SmallCNN,
    run_experiment,
)
from conv import SOBEL_X, SOBEL_Y, conv2d_by_framework, conv2d_by_hand, output_size
from figures import loss_curve_svg, tile, to_grey, upscale, write_png
from shapes import CLASSES, SIZE, draw_shape

MODEL_NAMES = {
    "cnn": "CNN",
    "mlp": "Fully connected (MLP)",
    "cnn_augmented": "CNN + augmentation",
}
# EN: The image shown to the first layer: the first triangle of the clean test set.
# PT: A imagem mostrada à primeira camada: o primeiro triângulo do conjunto de teste limpo.
EXAMPLE_INDEX = CLASSES.index("triangle")
CONV_VARIANTS = ((1, 0), (1, 1), (2, 0), (2, 1), (3, 2))


def edge_image() -> torch.Tensor:
    # EN: A clean square: its vertical sides are found by SOBEL_X and its horizontal sides by
    #     SOBEL_Y, which makes the two edge maps easy to read.
    # PT: Um quadrado limpo: os lados verticais são achados por SOBEL_X e os horizontais por
    #     SOBEL_Y, o que deixa os dois mapas de borda fáceis de ler.
    return draw_shape("square", radius=6.0, thickness=2.0)


def convolution_lines() -> list[str]:
    """EN: MP-AI-8.1 as a table: for each stride and padding, the output size given by the
    formula, the size the framework returns, and the largest difference between the two results.

    PT: MP-AI-8.1 em tabela: para cada stride e padding, o tamanho de saída dado pela fórmula, o
    tamanho que o framework devolve, e a maior diferença entre os dois resultados.
    """
    image = edge_image()
    lines = [
        "| Stride | Padding | (W - F + 2P) / S + 1 | Framework output | Same numbers |",
        "| ---: | ---: | ---: | ---: | :---: |",
    ]
    for stride, padding in CONV_VARIANTS:
        by_hand = conv2d_by_hand(image, SOBEL_X, stride, padding)
        by_framework = conv2d_by_framework(image, SOBEL_X, stride, padding)
        same = by_hand.shape == by_framework.shape and torch.allclose(
            by_hand, by_framework, atol=1e-5
        )
        side = output_size(SIZE, 3, stride, padding)
        lines.append(
            f"| {stride} | {padding} | {side} x {side} "
            f"| {by_framework.shape[0]} x {by_framework.shape[1]} | {'yes' if same else 'NO'} |"
        )
    return lines


def percent(value: float) -> str:
    return f"{100 * value:.1f}%"


def comparison_lines(experiment: Experiment) -> list[str]:
    lines = [
        "| Model | Parameters | Held-out, centred | Held-out, shifted |",
        "| --- | ---: | ---: | ---: |",
    ]
    for name in ("cnn", "mlp"):
        scores = experiment.accuracies[name]
        lines.append(
            f"| {MODEL_NAMES[name]} | {experiment.parameters[name]} | {percent(scores['clean'])} "
            f"| {percent(scores['shifted'])} |"
        )
    return lines


def augmentation_lines(experiment: Experiment) -> list[str]:
    lines = [
        "| Training of the CNN | Centred | Shifted | Rotated |",
        "| --- | ---: | ---: | ---: |",
    ]
    for name, label in (("cnn", "without augmentation"), ("cnn_augmented", "with augmentation")):
        scores = experiment.accuracies[name]
        lines.append(
            f"| {label} | {percent(scores['clean'])} | {percent(scores['shifted'])} "
            f"| {percent(scores['rotated'])} |"
        )
    return lines


def loss_lines(experiment: Experiment) -> list[str]:
    epochs = [1, *range(5, EPOCHS + 1, 5)]
    lines = [
        "| Model | " + " | ".join(f"Epoch {epoch}" for epoch in epochs) + " |",
        "| --- |" + " ---: |" * len(epochs),
    ]
    for name, losses in experiment.losses.items():
        cells = " | ".join(f"{losses[epoch - 1]:.3f}" for epoch in epochs)
        lines.append(f"| {MODEL_NAMES[name]} | {cells} |")
    return lines


def write_pictures(directory: Path, experiment: Experiment) -> int:
    """EN: Writes the PNG files and returns the index of the strongest first-layer filter.

    PT: Grava os arquivos PNG e devolve o índice do filtro mais forte da primeira camada.
    """
    image = edge_image()
    write_png(directory / "edge-input.png", upscale(to_grey(image), 12))
    for name, kernel in (("x", SOBEL_X), ("y", SOBEL_Y)):
        edges = conv2d_by_hand(image, kernel, padding=1)
        write_png(directory / f"edge-sobel-{name}.png", upscale(to_grey(edges, signed=True), 12))

    model = experiment.models["cnn"]
    assert isinstance(model, SmallCNN)
    # EN: Each filter is normalised on its own (its largest weight becomes white or black), so a
    #     filter with small weights is as visible as one with large weights.
    # PT: Cada filtro é normalizado sozinho (o seu maior peso vira branco ou preto), então um
    #     filtro de pesos pequenos fica tão visível quanto um de pesos grandes.
    filters = model.conv1.weight.detach()[:, 0]
    write_png(
        directory / "filters.png",
        tile([upscale(to_grey(kernel, signed=True), 32) for kernel in filters]),
    )

    example = experiment.test_sets["clean"][0][EXAMPLE_INDEX]
    write_png(directory / "input.png", upscale(to_grey(example[0]), 12))
    with torch.no_grad():
        maps = model.first_layer_maps(example[None])[0]
    # EN: All the maps share one scale here, so a filter that barely reacts looks dark.
    # PT: Todos os mapas usam a mesma escala aqui, então um filtro que quase não reage fica escuro.
    shared = to_grey(maps.flatten(0, 1)).reshape(maps.shape)
    write_png(
        directory / "activation-maps.png",
        tile([upscale(one, 5) for one in shared]),
    )
    strongest = int(maps.sum(dim=(1, 2)).argmax())
    write_png(directory / "activation-map.png", upscale(to_grey(maps[strongest]), 12))
    return strongest


def render_markdown(experiment: Experiment, strongest: int) -> str:
    cnn_parameters = experiment.parameters["cnn"]
    mlp_parameters = experiment.parameters["mlp"]
    difference = 100 * abs(cnn_parameters - mlp_parameters) / cnn_parameters
    lines = [
        "# computer-vision-cnn: results",
        "",
        "Written by `docker compose run --rm python-demo`. Seeds are fixed, so the numbers are "
        "the same at every run on the same image.",
        "",
        f"- Images: {SIZE} x {SIZE} greyscale, classes: {', '.join(CLASSES)}.",
        f"- Training set: {TRAIN_IMAGES} centred images. Each held-out set: {TEST_IMAGES} images "
        "from another seed.",
        f"- Shifted set: {TEST_SHIFT[0]:.0f} to {TEST_SHIFT[1]:.0f} pixels away from the centre "
        f"on each axis. Rotated set: {TEST_ANGLE[0]:.0f} to {TEST_ANGLE[1]:.0f} degrees.",
        f"- Training: {EPOCHS} epochs, batches of {BATCH_SIZE}, Adam, learning rate "
        f"{LEARNING_RATE}, seed {SEED}.",
        "",
        "## Convolution by hand against the framework (MP-AI-8.1)",
        "",
        f"A {SIZE} x {SIZE} image and the 3 x 3 Sobel filter (W = {SIZE}, F = 3).",
        "",
        *convolution_lines(),
        "",
        "| Input | Sobel x (vertical edges) | Sobel y (horizontal edges) |",
        "| :---: | :---: | :---: |",
        "| ![input](edge-input.png) | ![sobel x](edge-sobel-x.png) "
        "| ![sobel y](edge-sobel-y.png) |",
        "",
        "Grey is 0 (no edge), white is dark to bright, black is bright to dark.",
        "",
        "## CNN against a fully connected network (MP-AI-8.2)",
        "",
        *comparison_lines(experiment),
        "",
        f"The two parameter counts differ by {difference:.1f}%.",
        "",
        "## Augmentation (MP-AI-8.3)",
        "",
        *augmentation_lines(experiment),
        "",
        "## Training loss",
        "",
        *loss_lines(experiment),
        "",
        "![loss curve](loss-curve.svg)",
        "",
        "## What the first layer learned (MP-AI-8.3)",
        "",
        "The 8 filters (3 x 3) of the first layer of the CNN trained without augmentation. Grey "
        "is a weight of 0, white a positive weight, black a negative one:",
        "",
        "![filters](filters.png)",
        "",
        "One test image and the 8 activation maps it produces, in the same order as the filters:",
        "",
        "![input](input.png)",
        "",
        "![activation maps](activation-maps.png)",
        "",
        f"The map with the strongest response (filter {strongest + 1}):",
        "",
        "![activation map](activation-map.png)",
        "",
    ]
    return "\n".join(lines)


def write_results(directory: Path, experiment: Experiment) -> str:
    directory.mkdir(parents=True, exist_ok=True)
    strongest = write_pictures(directory, experiment)
    curves = {MODEL_NAMES[name]: losses for name, losses in experiment.losses.items()}
    (directory / "loss-curve.svg").write_text(
        loss_curve_svg(curves), encoding="utf-8", newline="\n"
    )
    markdown = render_markdown(experiment, strongest)
    (directory / "results.md").write_text(markdown, encoding="utf-8", newline="\n")
    return markdown


def main() -> None:
    default = Path(__file__).resolve().parent.parent / "results"
    directory = Path(os.environ.get("RESULTS_DIR", default))
    print(write_results(directory, run_experiment()))
    print(f"written to {directory}")


if __name__ == "__main__":
    main()
