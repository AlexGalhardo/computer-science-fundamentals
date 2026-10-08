"""EN: Tests of the networks, the comparison and the augmentation (MP-AI-8.2 and MP-AI-8.3).

The three models are trained once, by the same function and seeds as the demo, and every test
reads that one experiment. The thresholds have a margin below the measured numbers, so a small
floating-point difference on another machine does not break them.

PT: Testes das redes, da comparação e do aumento de dados (MP-AI-8.2 e MP-AI-8.3).

Os três modelos são treinados uma vez, pela mesma função e sementes da demo, e cada teste lê esse
único experimento. Os limites têm folga abaixo dos números medidos, então uma pequena diferença
de ponto flutuante em outra máquina não os quebra.
"""

import struct
from pathlib import Path

import pytest
import torch

from cnn import (
    SEED,
    TRAIN_IMAGES,
    TRAIN_SEED,
    Experiment,
    SmallCNN,
    SmallMLP,
    count_parameters,
    run_experiment,
    train,
)
from demo import write_results
from figures import PNG_SIGNATURE
from shapes import SIZE, make_dataset, random_augment


@pytest.fixture(scope="module")
def experiment() -> Experiment:
    return run_experiment()


@pytest.fixture(scope="module")
def results(experiment: Experiment, tmp_path_factory: pytest.TempPathFactory) -> Path:
    directory = tmp_path_factory.mktemp("results")
    write_results(directory, experiment)
    return directory


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    assert data.startswith(PNG_SIGNATURE)
    width, height = struct.unpack(">II", data[16:24])
    return width, height


# MP-AI-8.2
def test_parameter_counts_are_similar() -> None:
    cnn_parameters = count_parameters(SmallCNN())
    mlp_parameters = count_parameters(SmallMLP())
    assert cnn_parameters == 80 + 1752 + 100
    assert mlp_parameters == 2005 + 24
    assert abs(cnn_parameters - mlp_parameters) / cnn_parameters < 0.10
    # EN: The fully connected network is the one with slightly MORE parameters, so its worse
    #     result on shifted images cannot be blamed on its size.
    # PT: A rede totalmente conectada é a que tem um pouco MAIS de parâmetros, então o seu
    #     resultado pior nas imagens deslocadas não pode ser culpa do tamanho.
    assert mlp_parameters >= cnn_parameters


# MP-AI-8.2
def test_cnn_reaches_95_percent_on_held_out_images(experiment: Experiment) -> None:
    assert experiment.accuracies["cnn"]["clean"] >= 0.95


# MP-AI-8.2
def test_fully_connected_network_does_worse_on_shifted_images(experiment: Experiment) -> None:
    cnn_scores = experiment.accuracies["cnn"]
    mlp_scores = experiment.accuracies["mlp"]
    # EN: Both networks learned the centred shapes, so the gap below is about the shift only.
    # PT: As duas redes aprenderam as formas centradas, então a diferença abaixo é só do
    #     deslocamento.
    assert mlp_scores["clean"] >= 0.95
    assert cnn_scores["shifted"] >= 0.80
    assert mlp_scores["shifted"] <= 0.50
    assert cnn_scores["shifted"] - mlp_scores["shifted"] >= 0.30


# MP-AI-8.2
def test_held_out_images_are_not_the_training_images(experiment: Experiment) -> None:
    train_images, _ = make_dataset(64, seed=1)
    clean_images, _ = experiment.test_sets["clean"]
    assert not torch.equal(train_images, clean_images[:64])


# MP-AI-8.2
def test_training_reduces_the_loss(experiment: Experiment) -> None:
    for losses in experiment.losses.values():
        assert len(losses) == 20
        assert losses[-1] < 0.5 * losses[0]


# MP-AI-8.3
def test_augmentation_helps_on_rotated_images_and_keeps_the_rest(experiment: Experiment) -> None:
    plain = experiment.accuracies["cnn"]
    augmented = experiment.accuracies["cnn_augmented"]
    assert augmented["rotated"] - plain["rotated"] >= 0.10
    assert augmented["shifted"] >= plain["shifted"] - 0.03
    assert augmented["clean"] >= 0.93


# MP-AI-8.3
def test_augmentation_changes_the_batch_but_not_its_shape() -> None:
    images, _ = make_dataset(8, seed=5)
    generator = torch.Generator().manual_seed(0)
    augmented = random_augment(images, generator)
    assert augmented.shape == images.shape
    assert not torch.allclose(augmented, images)
    again = random_augment(images, torch.Generator().manual_seed(0))
    assert torch.equal(augmented, again)


# MP-AI-8.3
def test_results_table_has_accuracy_with_and_without_augmentation(
    experiment: Experiment, results: Path
) -> None:
    markdown = (results / "results.md").read_text(encoding="utf-8")
    assert "| Training of the CNN | Centred | Shifted | Rotated |" in markdown
    for name, label in (("cnn", "without augmentation"), ("cnn_augmented", "with augmentation")):
        scores = experiment.accuracies[name]
        row = (
            f"| {label} | {100 * scores['clean']:.1f}% | {100 * scores['shifted']:.1f}% "
            f"| {100 * scores['rotated']:.1f}% |"
        )
        assert row in markdown
    assert "| Fully connected (MLP) | 2029 |" in markdown
    assert "| NO |" not in markdown


# MP-AI-8.3
def test_filters_and_activation_map_are_written_as_images(results: Path) -> None:
    # EN: 8 filters of 3 x 3, each enlarged 32 times, in a row with 4-pixel gaps.
    # PT: 8 filtros de 3 x 3, cada um ampliado 32 vezes, em uma linha com espaços de 4 pixels.
    assert png_size(results / "filters.png") == (4 + 8 * (96 + 4), 96 + 8)
    assert png_size(results / "activation-map.png") == (SIZE * 12, SIZE * 12)
    assert png_size(results / "activation-maps.png") == (4 + 8 * (100 + 4), 100 + 8)
    assert png_size(results / "input.png") == (SIZE * 12, SIZE * 12)
    for name in ("edge-input.png", "edge-sobel-x.png", "edge-sobel-y.png"):
        assert png_size(results / name) == (SIZE * 12, SIZE * 12)
    svg = (results / "loss-curve.svg").read_text(encoding="utf-8")
    assert svg.startswith("<svg") and svg.count("<polyline") == 3


# MP-AI-8.3
def test_first_layer_maps_have_one_map_per_filter(experiment: Experiment) -> None:
    model = experiment.models["cnn"]
    assert isinstance(model, SmallCNN)
    images, _ = experiment.test_sets["clean"]
    with torch.no_grad():
        maps = model.first_layer_maps(images[:3])
    assert maps.shape == (3, 8, SIZE, SIZE)
    assert float(maps.min()) >= 0.0
    assert float(maps.max()) > 0.0


def test_the_experiment_is_reproducible(experiment: Experiment) -> None:
    # EN: Training the first model again with the same seeds must give the same weights.
    # PT: Treinar o primeiro modelo de novo com as mesmas sementes tem que dar os mesmos pesos.
    torch.manual_seed(SEED)
    model = SmallCNN()
    images, labels = make_dataset(TRAIN_IMAGES, TRAIN_SEED)
    losses = train(model, images, labels, epochs=2)
    assert losses == pytest.approx(experiment.losses["cnn"][:2], abs=1e-6)
