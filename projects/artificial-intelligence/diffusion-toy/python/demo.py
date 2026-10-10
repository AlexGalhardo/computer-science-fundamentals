"""EN: `python demo.py` trains the noise predictor, runs the forward and the reverse process and
writes to results/: forward.svg and reverse.svg (the points at several steps), loss.svg (the
training loss) and results.md (the numbers).

PT: `python demo.py` treina o previsor de ruído, roda o processo direto e o reverso e grava em
results/: forward.svg e reverse.svg (os pontos em vários passos), loss.svg (a perda do treino) e
results.md (os números).

ES: `python demo.py` entrena el predictor de ruido, ejecuta el proceso directo y el inverso y
escribe en results/: forward.svg y reverse.svg (los puntos en varios pasos), loss.svg (la pérdida
del entrenamiento) y results.md (los números).
"""

import math
import os
from pathlib import Path

import numpy as np

from diffusion import (
    RING_JITTER,
    RING_RADIUS,
    SAMPLE_COUNT,
    SAMPLE_SEED,
    SECTORS,
    Array,
    TrainConfig,
    Trained,
    forward_chain,
    gaussian_report,
    make_ring,
    ring_distance,
    sample,
    sector_counts,
    train,
)
from svg import line_chart, scatter_panels

# EN: The mean distance the generated points must stay under. It is documented in the README and
#     checked by the test of MP-AI-5.2. Real data measures about 0.024 and pure noise about 0.54.
# PT: A distância média abaixo da qual os pontos gerados precisam ficar. Está documentada no
#     README e é conferida pelo teste do MP-AI-5.2. O dado real mede cerca de 0,024 e o ruído puro
#     cerca de 0,54.
# ES: La distancia media por debajo de la cual deben quedar los puntos generados. Está documentada
#     en el README y la comprueba la prueba de MP-AI-5.2. El dato real mide cerca de 0,024 y el
#     ruido puro cerca de 0,54.
DISTANCE_THRESHOLD = 0.10

KEPT_STEPS = (0, 10, 25, 50, 75, 100)
FORWARD_COUNT = 20000
FORWARD_SEED = 11
PLOTTED = 300
COMMAND = "docker compose run --rm python-demo"


def cloud_row(t: int, points: Array) -> str:
    radius = np.linalg.norm(points, axis=1)
    variance = points.var(axis=0)
    return (
        f"| {t} | {ring_distance(points):.3f} | {radius.mean():.3f} | {radius.std():.3f} "
        f"| {variance[0]:.3f} | {variance[1]:.3f} |"
    )


CLOUD_HEADER = [
    "| Step t | Mean distance to the ring | Mean radius | Spread of the radius "
    "| Variance of x | Variance of y |",
    "| ---: | ---: | ---: | ---: | ---: | ---: |",
]


def render_markdown(trained: Trained, forward: dict[int, Array], reverse: dict[int, Array]) -> str:
    schedule = trained.schedule
    config = TrainConfig()
    steps = schedule.steps
    report = gaussian_report(forward[steps], forward[0])
    failures = report.failures(FORWARD_COUNT)
    generated = reverse[0]
    counts = sector_counts(generated)
    noise = reverse[steps]
    unit = 1.0 / math.sqrt(FORWARD_COUNT)
    layers = " -> ".join(str(weight.shape[0]) for weight in trained.network.weights) + " -> 2"
    lines = [
        "# Results: diffusion-toy",
        "",
        f"Generated with `{COMMAND}`. Every seed is fixed, so a new run on the same image writes "
        "the same numbers.",
        "",
        f"- Data: {config.data_count} points on a ring of radius {RING_RADIUS:g}, with a radial "
        f"jitter of {RING_JITTER:g}.",
        f"- Schedule: {steps} steps, beta from {schedule.betas[1]:g} to {schedule.betas[steps]:g} "
        "in a straight line.",
        f"- Network: {layers} (tanh), {trained.network.parameter_count()} parameters.",
        f"- Training: {config.iterations} iterations of {config.batch_size} points, Adam, "
        f"learning rate {config.rate:g} falling to 0.",
        "",
        "## The noise schedule",
        "",
        "`signal` is what multiplies the original point and `noise` is what multiplies the "
        "Gaussian noise in the shortcut formula.",
        "",
        "| Step t | beta_t | alpha_bar_t | signal = sqrt(alpha_bar_t) "
        "| noise = sqrt(1 - alpha_bar_t) |",
        "| ---: | ---: | ---: | ---: | ---: |",
    ]
    lines += [
        f"| {t} | {schedule.betas[t]:.4f} | {schedule.alpha_bars[t]:.6f} "
        f"| {math.sqrt(schedule.alpha_bars[t]):.4f} "
        f"| {math.sqrt(1.0 - schedule.alpha_bars[t]):.4f} |"
        for t in KEPT_STEPS
    ]
    lines += [
        "",
        "## Forward process (MP-AI-5.1)",
        "",
        f"{FORWARD_COUNT} points of the ring, noised step by step. Figure: "
        f"[forward.svg](forward.svg) (the first {PLOTTED} points).",
        "",
        "![forward process](forward.svg)",
        "",
        *CLOUD_HEADER,
        *[cloud_row(t, forward[t]) for t in KEPT_STEPS],
        "",
        f"### Is step {steps} Gaussian noise?",
        "",
        f"Tolerances are about 4 standard errors for {FORWARD_COUNT} points.",
        "",
        "| Check | Expected for standard Gaussian noise | Measured (x, y) | Tolerance |",
        "| --- | ---: | ---: | ---: |",
        f"| Mean | 0 | {report.mean[0]:.4f}, {report.mean[1]:.4f} | {4 * unit:.4f} |",
        f"| Variance | 1 | {report.variance[0]:.4f}, {report.variance[1]:.4f} "
        f"| {4 * math.sqrt(2) * unit:.4f} |",
        f"| Correlation between x and y | 0 | {report.xy_correlation:.4f} | {4 * unit:.4f} |",
        f"| Correlation with the starting point | 0 | {report.start_correlation[0]:.4f}, "
        f"{report.start_correlation[1]:.4f} | {4 * unit:.4f} |",
        f"| Share within 1 standard deviation | 0.6827 | {report.within_one[0]:.4f}, "
        f"{report.within_one[1]:.4f} | {4 * 0.4654 * unit:.4f} |",
        f"| Share within 2 standard deviations | 0.9545 | {report.within_two[0]:.4f}, "
        f"{report.within_two[1]:.4f} | {4 * 0.2084 * unit:.4f} |",
        f"| Kolmogorov-Smirnov statistic | 0 | {report.ks[0]:.4f}, {report.ks[1]:.4f} "
        f"| {1.95 * unit:.4f} |",
        "",
        f"Checks that failed: {', '.join(failures) if failures else 'none'}. Signal left at step "
        f"{steps}: sqrt(alpha_bar) = {math.sqrt(schedule.alpha_bars[steps]):.4f}.",
        "",
        "## Training loss",
        "",
        f"Mean squared error between the true noise and the predicted noise, averaged over each "
        f"block of {config.log_every} iterations. Figure: [loss.svg](loss.svg).",
        "",
        "![training loss](loss.svg)",
        "",
        "| Iterations | Loss |",
        "| ---: | ---: |",
    ]
    lines += [
        f"| {index * config.log_every + 1} to {(index + 1) * config.log_every} | {loss:.4f} |"
        for index, loss in enumerate(trained.losses)
        if index < 3 or (index + 1) % 5 == 0
    ]
    lines += [
        "",
        "## Reverse process (MP-AI-5.2 and MP-AI-5.3)",
        "",
        f"{SAMPLE_COUNT} points generated from pure noise (seed {SAMPLE_SEED}). Figure: "
        f"[reverse.svg](reverse.svg) (the first {PLOTTED} points).",
        "",
        "![reverse process](reverse.svg)",
        "",
        *CLOUD_HEADER,
        *[cloud_row(t, reverse[t]) for t in reversed(KEPT_STEPS)],
        "",
        "### Mean distance to the ring",
        "",
        "| Points | Mean distance to the ring |",
        "| --- | ---: |",
        f"| Real data (the training set) | {ring_distance(trained.data):.3f} |",
        f"| Generated (step 0 of the reverse process) | {ring_distance(generated):.3f} |",
        f"| Pure noise (step {steps}, where generation starts) | {ring_distance(noise):.3f} |",
        f"| Threshold of the test | {DISTANCE_THRESHOLD:.2f} |",
        "",
        f"Slices of the ring with points: {sum(count > 0 for count in counts)} of {SECTORS}. "
        f"Points per slice: smallest {min(counts)}, largest {max(counts)}, "
        f"{SAMPLE_COUNT / SECTORS:.0f} if perfectly even.",
        "",
    ]
    return "\n".join(lines)


def write_results(trained: Trained, directory: Path) -> list[Path]:
    """EN: Runs both processes with the fixed seeds and writes the four result files.

    PT: Roda os dois processos com as sementes fixas e grava os quatro arquivos de resultado.

    ES: Ejecuta los dos procesos con las semillas fijas y escribe los cuatro archivos de resultados.
    """
    forward = forward_chain(
        make_ring(FORWARD_COUNT, FORWARD_SEED), trained.schedule, FORWARD_SEED + 1, KEPT_STEPS
    )
    reverse = sample(trained, keep=KEPT_STEPS)
    config = TrainConfig()
    files = {
        "forward.svg": scatter_panels(
            [(f"forward, t = {t}", forward[t][:PLOTTED]) for t in KEPT_STEPS], RING_RADIUS
        ),
        "reverse.svg": scatter_panels(
            [(f"reverse, t = {t}", reverse[t][:PLOTTED]) for t in reversed(KEPT_STEPS)],
            RING_RADIUS,
        ),
        "loss.svg": line_chart(
            [(index + 1) * config.log_every for index in range(len(trained.losses))],
            trained.losses,
            "Training loss (MSE of the predicted noise)",
            "iteration",
        ),
        "results.md": render_markdown(trained, forward, reverse),
    }
    directory.mkdir(parents=True, exist_ok=True)
    written = []
    for name, text in files.items():
        # EN: The old file is removed first. On Docker Desktop for Windows a file written by one
        #     user id (the Unix script) cannot be overwritten by another (the PowerShell script),
        #     but it can be deleted, because the folder itself is writable by everyone.
        # PT: O arquivo antigo é removido antes. No Docker Desktop para Windows um arquivo gravado
        #     por um id de usuário (o script Unix) não pode ser sobrescrito por outro (o script
        #     PowerShell), mas pode ser apagado, porque a pasta em si é gravável por todos.
        # ES: El archivo antiguo se elimina antes. En Docker Desktop para Windows un archivo
        #     escrito por un id de usuario (el script Unix) no puede ser sobrescrito por otro (el
        #     script PowerShell), pero sí puede borrarse, porque la carpeta en sí es escribible por
        #     todos.
        (directory / name).unlink(missing_ok=True)
        (directory / name).write_text(text, encoding="utf-8", newline="\n")
        written.append(directory / name)
    return written


def main() -> None:
    default_dir = Path(__file__).resolve().parent.parent / "results"
    directory = Path(os.environ.get("RESULTS_DIR", default_dir))
    written = write_results(train(), directory)
    print((directory / "results.md").read_text(encoding="utf-8"))
    print("written: " + ", ".join(path.name for path in written))


if __name__ == "__main__":
    main()
