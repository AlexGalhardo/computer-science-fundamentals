"""EN: Draws the chart of throughput against offered load from a results.json file, as SVG.

PT: Desenha o gráfico de vazão por carga oferecida a partir de um results.json, em SVG.

ES: Dibuja el gráfico de rendimiento según la carga ofrecida a partir de un results.json, en SVG.
"""

import argparse
import json
from pathlib import Path

WIDTH, HEIGHT = 760, 420
LEFT, RIGHT, TOP, BOTTOM = 60, 20, 20, 50

# EN: Solid lines are simulations, dashed lines are the formulas. When the two overlap, the
#     simulation agrees with the theory.
# PT: Linhas cheias são simulações, linhas tracejadas são as fórmulas. Quando as duas se
#     sobrepõem, a simulação concorda com a teoria.
# ES: Las líneas continuas son simulaciones, las líneas punteadas son las fórmulas. Cuando las dos
#     se superponen, la simulación concuerda con la teoría.
SERIES = [
    ("pureAloha", "pure ALOHA (simulated)", "#dc2626", ""),
    ("pureAlohaTheory", "pure ALOHA: G·e^(−2G)", "#dc2626", "6 4"),
    ("slottedAloha", "slotted ALOHA (simulated)", "#2563eb", ""),
    ("slottedAlohaTheory", "slotted ALOHA: G·e^(−G)", "#2563eb", "6 4"),
    ("csmaCd", "CSMA/CD with binary exponential backoff (simulated)", "#16a34a", ""),
]


def render(report: dict) -> str:
    rows = report["rows"]
    max_load = max(row["load"] for row in rows)

    def x(load: float) -> float:
        return LEFT + load / max_load * (WIDTH - LEFT - RIGHT)

    def y(throughput: float) -> float:
        return HEIGHT - BOTTOM - throughput * (HEIGHT - TOP - BOTTOM)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" '
        f'font-family="sans-serif" font-size="12">',
        "<title>Throughput against offered load: pure ALOHA, slotted ALOHA and CSMA/CD</title>",
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="#ffffff"/>',
    ]
    for tick in range(11):
        value = tick / 10
        parts.append(
            f'<line x1="{LEFT}" x2="{WIDTH - RIGHT}" y1="{y(value):.1f}" y2="{y(value):.1f}" '
            f'stroke="#e2e8f0"/>'
            f'<text x="{LEFT - 8}" y="{y(value) + 4:.1f}" text-anchor="end">{value:.1f}</text>'
        )
    for tick in range(int(max_load) + 1):
        parts.append(
            f'<line x1="{x(tick):.1f}" x2="{x(tick):.1f}" y1="{TOP}" y2="{HEIGHT - BOTTOM}" '
            f'stroke="#e2e8f0"/>'
            f'<text x="{x(tick):.1f}" y="{HEIGHT - BOTTOM + 18}" text-anchor="middle">{tick}</text>'
        )
    parts.append(
        f'<text x="{(LEFT + WIDTH - RIGHT) / 2}" y="{HEIGHT - 10}" text-anchor="middle">'
        "offered load G (attempts per frame time)</text>"
        f'<text x="16" y="{(TOP + HEIGHT - BOTTOM) / 2}" text-anchor="middle" '
        f'transform="rotate(-90 16 {(TOP + HEIGHT - BOTTOM) / 2})">throughput S</text>'
    )
    for index, (key, label, colour, dash) in enumerate(SERIES):
        points = " ".join(f"{x(row['load']):.1f},{y(row[key]):.1f}" for row in rows)
        dashed = f' stroke-dasharray="{dash}"' if dash else ""
        parts.append(
            f'<polyline id="{key}" points="{points}" fill="none" stroke="{colour}" '
            f'stroke-width="2"{dashed}/>'
        )
        legend_y = TOP + 150 + index * 18
        parts.append(
            f'<line x1="{WIDTH - 360}" x2="{WIDTH - 330}" y1="{legend_y}" y2="{legend_y}" '
            f'stroke="{colour}" stroke-width="2"{dashed}/>'
            f'<text x="{WIDTH - 322}" y="{legend_y + 4}">{label}</text>'
        )
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("results", type=Path)
    parser.add_argument("svg", type=Path)
    args = parser.parse_args()
    report = json.loads(args.results.read_text(encoding="utf-8"))
    args.svg.write_text(render(report), encoding="utf-8")
    print(f"wrote {args.svg}")


if __name__ == "__main__":
    main()
