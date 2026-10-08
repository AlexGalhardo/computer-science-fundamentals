"""EN: Tests of the diffusion toy. The network is trained once (module-scoped fixture), with the
same function and seeds as the demo, and every test that needs a model shares it.

PT: Testes do brinquedo de difusão. A rede é treinada uma vez (fixture de módulo), com a mesma
função e as mesmas sementes da demo, e todo teste que precisa de um modelo a compartilha.
"""

import math
from pathlib import Path

import numpy as np
import pytest

from demo import DISTANCE_THRESHOLD, KEPT_STEPS, write_results
from diffusion import (
    RING_RADIUS,
    SAMPLE_COUNT,
    SECTORS,
    Array,
    Trained,
    forward_chain,
    gaussian_report,
    ks_statistic,
    make_network,
    make_ring,
    make_schedule,
    noise_loss,
    noisy_at,
    ring_distance,
    sample,
    sector_counts,
    train,
)

COUNT = 20000


@pytest.fixture(scope="module")
def trained() -> Trained:
    return train()


@pytest.fixture(scope="module")
def generated(trained: Trained) -> dict[int, Array]:
    return sample(trained, keep=KEPT_STEPS)


def test_ring_points_are_on_the_ring() -> None:
    ring = make_ring(2000, seed=1)
    assert ring.shape == (2000, 2)
    assert ring_distance(ring) < 0.04
    assert min(sector_counts(ring)) > 100


def test_schedule_ends_with_almost_no_signal() -> None:
    schedule = make_schedule()
    assert schedule.alpha_bars[0] == 1.0
    assert np.all(np.diff(schedule.alpha_bars) < 0)
    # EN: sqrt(alpha_bar_T) multiplies the original point at the last step: under 1% is left.
    # PT: sqrt(alpha_bar_T) multiplica o ponto original no último passo: sobra menos de 1%.
    assert math.sqrt(schedule.alpha_bars[-1]) < 0.01


def test_step_by_step_agrees_with_the_shortcut() -> None:
    # EN: Two different routes to step t, with different random numbers: 20000 points walked
    #     step by step, and 20000 points sent there in one jump. Their statistics must match.
    # PT: Dois caminhos diferentes até o passo t, com números aleatórios diferentes: 20000 pontos
    #     andando passo a passo, e 20000 pontos enviados em um salto. As estatísticas têm de
    #     coincidir.
    schedule = make_schedule()
    start = make_ring(COUNT, seed=5)
    walked = forward_chain(start, schedule, seed=6, keep=(10, 25, 50, 100))
    rng = np.random.default_rng(7)
    for t, points in walked.items():
        jumped = noisy_at(start, t, schedule, rng.standard_normal(start.shape))
        assert np.allclose(points.mean(axis=0), jumped.mean(axis=0), atol=0.04)
        assert np.allclose(points.var(axis=0), jumped.var(axis=0), atol=0.05)
        radius_walked = np.linalg.norm(points, axis=1)
        radius_jumped = np.linalg.norm(jumped, axis=1)
        assert abs(radius_walked.mean() - radius_jumped.mean()) < 0.03
        assert abs(radius_walked.std() - radius_jumped.std()) < 0.03
        # EN: The shortcut also predicts the variance exactly: alpha_bar x 0.5 (the variance of
        #     one coordinate of the ring) + (1 - alpha_bar) x 1 (the noise).
        # PT: O atalho também prevê a variância exata: alpha_bar x 0,5 (a variância de uma
        #     coordenada do anel) + (1 - alpha_bar) x 1 (o ruído).
        expected = schedule.alpha_bars[t] * start.var(axis=0) + 1.0 - schedule.alpha_bars[t]
        assert np.allclose(points.var(axis=0), expected, atol=0.05)


def test_ks_statistic_tells_normal_from_uniform() -> None:
    rng = np.random.default_rng(3)
    assert ks_statistic(rng.standard_normal(COUNT)) < 1.95 / math.sqrt(COUNT)
    assert ks_statistic(rng.uniform(-1.7, 1.7, COUNT)) > 0.03


# MP-AI-5.1
def test_last_forward_step_is_indistinguishable_from_gaussian_noise() -> None:
    schedule = make_schedule()
    start = make_ring(COUNT, seed=11)
    walked = forward_chain(start, schedule, seed=12, keep=(0, 25, schedule.steps))
    report = gaussian_report(walked[schedule.steps], start)
    assert report.failures(COUNT) == []
    # EN: The same explicit numbers, so that a reader sees what "indistinguishable" means here.
    # PT: Os mesmos números de forma explícita, para o leitor ver o que "indistinguível" quer
    #     dizer aqui.
    assert max(abs(value) for value in report.mean) < 0.03
    assert max(abs(value - 1.0) for value in report.variance) < 0.04
    assert abs(report.xy_correlation) < 0.03
    assert max(abs(value) for value in report.start_correlation) < 0.03
    assert max(report.ks) < 0.014

    # EN: The checks are not blind: the clean ring and the half-noised ring both fail them, and a
    #     true Gaussian sample of the same size passes.
    # PT: As verificações não são cegas: o anel limpo e o anel com ruído pela metade falham
    #     nelas, e uma amostra gaussiana de verdade, do mesmo tamanho, passa.
    assert "ks" in gaussian_report(walked[0], start).failures(COUNT)
    assert "variance" in gaussian_report(walked[25], start).failures(COUNT)
    assert "start_correlation" in gaussian_report(walked[25], start).failures(COUNT)
    true_noise = np.random.default_rng(13).standard_normal((COUNT, 2))
    assert gaussian_report(true_noise, start).failures(COUNT) == []


def test_backpropagation_matches_numerical_gradient() -> None:
    # EN: Gradient check. Nudge one weight by +h and by -h, measure the loss both times, and
    #     (loss_plus - loss_minus) / 2h is the slope with no calculus at all. The hand-written
    #     backward pass must give the same number for every single weight.
    # PT: Verificação do gradiente. Mexa um peso em +h e em -h, meça a perda nas duas vezes, e
    #     (perda_mais - perda_menos) / 2h é a inclinação sem cálculo nenhum. A volta escrita à
    #     mão tem de dar o mesmo número para cada um dos pesos.
    schedule = make_schedule()
    network = make_network((18, 7, 6, 2), seed=4)
    rng = np.random.default_rng(5)
    for bias in network.biases:
        bias += 0.1 * rng.standard_normal(bias.shape)
    clean = make_ring(9, seed=6)
    t = rng.integers(1, schedule.steps + 1, 9)
    noise = rng.standard_normal(clean.shape)
    noisy = noisy_at(clean, t, schedule, noise)

    _, gradients = noise_loss(network, noisy, t, noise, schedule.steps)
    step = 1e-6
    checked = 0
    for parameter, gradient in zip(network.parameters(), gradients, strict=True):
        assert parameter.dtype == np.float64
        numerical = np.zeros_like(parameter)
        for index in np.ndindex(parameter.shape):
            original = parameter[index]
            parameter[index] = original + step
            loss_plus, _ = noise_loss(network, noisy, t, noise, schedule.steps)
            parameter[index] = original - step
            loss_minus, _ = noise_loss(network, noisy, t, noise, schedule.steps)
            parameter[index] = original
            numerical[index] = (loss_plus - loss_minus) / (2.0 * step)
            checked += 1
        assert np.allclose(gradient, numerical, rtol=1e-5, atol=1e-8)
        assert np.abs(gradient).max() > 1e-4
    assert checked == network.parameter_count()


def test_training_lowers_the_loss(trained: Trained) -> None:
    # EN: Answering "no noise at all" (zeros) costs a loss of 1, the variance of the noise.
    # PT: Responder "ruído nenhum" (zeros) custa uma perda de 1, a variância do ruído.
    assert trained.losses[0] < 0.6
    assert trained.losses[-1] < trained.losses[0]
    assert trained.losses[-1] < 0.25


# MP-AI-5.2
def test_generated_points_land_on_the_ring(trained: Trained, generated: dict[int, Array]) -> None:
    points = generated[0]
    assert points.shape == (SAMPLE_COUNT, 2)
    distance = ring_distance(points)
    noise_distance = ring_distance(generated[trained.schedule.steps])
    assert distance < DISTANCE_THRESHOLD
    assert noise_distance > 0.4
    assert distance < noise_distance / 4.0
    assert abs(float(np.linalg.norm(points, axis=1).mean()) - RING_RADIUS) < 0.05


# MP-AI-5.2
def test_generated_points_cover_the_whole_ring(generated: dict[int, Array]) -> None:
    # EN: A collapse to one spot of the ring would pass the distance test and fail here.
    # PT: Um colapso em um só ponto do anel passaria no teste de distância e falharia aqui.
    counts = sector_counts(generated[0])
    assert len(counts) == SECTORS
    assert min(counts) > 0.5 * SAMPLE_COUNT / SECTORS
    assert max(counts) < 1.5 * SAMPLE_COUNT / SECTORS
    collapsed = np.tile([[RING_RADIUS, 0.0]], (SAMPLE_COUNT, 1))
    assert ring_distance(collapsed) < DISTANCE_THRESHOLD
    assert min(sector_counts(collapsed)) == 0


def test_generation_is_new_and_repeatable(trained: Trained) -> None:
    first = sample(trained, count=200, seed=21)[0]
    again = sample(trained, count=200, seed=21)[0]
    other = sample(trained, count=200, seed=22)[0]
    assert np.array_equal(first, again)
    assert not np.allclose(first, other)
    # EN: The points are generated, not copied: none of them is a training point.
    # PT: Os pontos são gerados, não copiados: nenhum deles é um ponto do treino.
    gaps = np.linalg.norm(first[:, None, :] - trained.data[None, :, :], axis=2).min(axis=1)
    assert gaps.min() > 0.0


# MP-AI-5.3
def test_reverse_process_gets_closer_step_by_step(generated: dict[int, Array]) -> None:
    assert sorted(generated) == sorted(KEPT_STEPS)
    distances = [ring_distance(generated[t]) for t in sorted(KEPT_STEPS, reverse=True)]
    assert distances[0] > distances[-1]
    assert all(
        later < earlier + 0.02 for earlier, later in zip(distances[2:], distances[3:], strict=False)
    )


# MP-AI-5.3
def test_demo_writes_the_points_of_several_reverse_steps(trained: Trained, tmp_path: Path) -> None:
    written = write_results(trained, tmp_path)
    assert sorted(path.name for path in written) == [
        "forward.svg",
        "loss.svg",
        "results.md",
        "reverse.svg",
    ]
    reverse = (tmp_path / "reverse.svg").read_text(encoding="utf-8")
    for t in KEPT_STEPS:
        assert f"reverse, t = {t}<" in reverse
    assert len(KEPT_STEPS) >= 5
    # EN: 300 points and one outline of the ring in each panel.
    # PT: 300 pontos e um contorno do anel em cada painel.
    assert reverse.count("<circle") == len(KEPT_STEPS) * 301
    assert "nan" not in reverse
    assert (tmp_path / "forward.svg").read_text(encoding="utf-8").count("<circle") == 6 * 301
    assert "<polyline" in (tmp_path / "loss.svg").read_text(encoding="utf-8")
    markdown = (tmp_path / "results.md").read_text(encoding="utf-8")
    assert "Checks that failed: none." in markdown
    assert "Slices of the ring with points: 12 of 12." in markdown
    for name in ("forward.svg", "reverse.svg", "loss.svg", "results.md"):
        assert b"\r" not in (tmp_path / name).read_bytes()
