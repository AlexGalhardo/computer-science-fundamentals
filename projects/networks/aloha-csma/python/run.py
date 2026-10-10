"""EN: Sweeps the offered load, simulates the three protocols and writes the results files.

PT: Varre a carga oferecida, simula os três protocolos e escreve os arquivos de resultados.

ES: Recorre la carga ofrecida, simula los tres protocolos y escribe los archivos de resultados.
"""

import argparse
import json
import platform
import random
from pathlib import Path

from aloha import (
    PURE_PEAK,
    SLOTTED_PEAK,
    pure_aloha_theory,
    simulate_pure_aloha,
    simulate_slotted_aloha,
    slotted_aloha_theory,
)
from csma_cd import simulate_csma_cd

LOADS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]


def sweep(seed: int, frames: int, stations: int, frame_slots: int) -> dict:
    """EN: One row per offered load. A fixed seed makes the whole table reproducible.

    PT: Uma linha por carga oferecida. Uma semente fixa torna a tabela inteira reproduzível.

    ES: Una fila por carga ofrecida. Una semilla fija hace reproducible toda la tabla.
    """
    rng = random.Random(seed)
    rows = []
    for load in LOADS:
        csma = simulate_csma_cd(load, frames // 4, rng, stations, frame_slots)
        rows.append(
            {
                "load": load,
                "pureAloha": round(simulate_pure_aloha(load, frames, rng), 5),
                "pureAlohaTheory": round(pure_aloha_theory(load), 5),
                "slottedAloha": round(simulate_slotted_aloha(load, frames, rng), 5),
                "slottedAlohaTheory": round(slotted_aloha_theory(load), 5),
                "csmaCd": round(csma.throughput, 5),
                "csmaCdCollisions": csma.collisions,
                "csmaCdDropped": csma.dropped,
            }
        )
    return {
        "project": "aloha-csma",
        "command": "docker compose run --rm python-demo",
        "runtime": f"Python {platform.python_version()}",
        "machine": f"{platform.machine()}, {platform.system()} {platform.release()}, in Docker",
        "seed": seed,
        "framesPerLoad": frames,
        "csmaCd": {"stations": stations, "frameSlots": frame_slots, "frameTimes": frames // 4},
        "theoreticalPeaks": {
            "pureAloha": round(PURE_PEAK, 5),
            "slottedAloha": round(SLOTTED_PEAK, 5),
        },
        "rows": rows,
    }


def peak(rows: list[dict], key: str) -> dict:
    return max(rows, key=lambda row: row[key])


def markdown(report: dict) -> str:
    rows = report["rows"]
    pure, slotted, csma = (peak(rows, key) for key in ("pureAloha", "slottedAloha", "csmaCd"))
    peaks = report["theoreticalPeaks"]
    lines = [
        "# Results: aloha-csma",
        "",
        f"- Command: `{report['command']}`",
        f"- Runtime: {report['runtime']}",
        f"- Machine: {report['machine']}",
        f"- Seed: {report['seed']}, {report['framesPerLoad']} attempts (pure) or slots (slotted) "
        "per load",
        f"- CSMA/CD: {report['csmaCd']['stations']} stations, frames of "
        f"{report['csmaCd']['frameSlots']} contention slots, {report['csmaCd']['frameTimes']} "
        "frame times per load",
        "",
        "Time is simulated, so the same seed gives this exact table on any machine.",
        "",
        "## Peaks",
        "",
        "| protocol | simulated peak | at load G | theoretical peak | difference |",
        "| --- | --- | --- | --- | --- |",
        peak_line("pure ALOHA", pure["pureAloha"], pure["load"], peaks["pureAloha"]),
        peak_line("slotted ALOHA", slotted["slottedAloha"], slotted["load"], peaks["slottedAloha"]),
        f"| CSMA/CD | {csma['csmaCd']:.4f} | {csma['load']} | no closed form here | |",
        "",
        "## Throughput S against offered load G",
        "",
        "| G | pure ALOHA | theory | slotted ALOHA | theory | CSMA/CD | collisions | dropped |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    lines += [
        f"| {row['load']} | {row['pureAloha']:.4f} | {row['pureAlohaTheory']:.4f} | "
        f"{row['slottedAloha']:.4f} | {row['slottedAlohaTheory']:.4f} | {row['csmaCd']:.4f} | "
        f"{row['csmaCdCollisions']} | {row['csmaCdDropped']} |"
        for row in rows
    ]
    return "\n".join(lines) + "\n"


def peak_line(name: str, simulated: float, load: float, theory: float) -> str:
    difference = (simulated - theory) / theory * 100
    return f"| {name} | {simulated:.4f} | {load} | {theory:.4f} | {difference:+.2f}% |"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("results"))
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--frames", type=int, default=200_000)
    parser.add_argument("--stations", type=int, default=50)
    parser.add_argument("--frame-slots", type=int, default=32)
    args = parser.parse_args()

    report = sweep(args.seed, args.frames, args.stations, args.frame_slots)
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "results.json").write_text(json.dumps(report, indent="\t") + "\n", encoding="utf-8")
    table = markdown(report)
    (args.out / "results.md").write_text(table, encoding="utf-8")
    print(table)


if __name__ == "__main__":
    main()
