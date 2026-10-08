"""EN: Two small charts written as SVG text, with no plotting library: a row of scatter plots and a
line chart. SVG is plain text, so the figures show up on GitHub and their changes can be read in a
diff. Every number is rounded to 2 decimals to keep the files stable.

PT: Dois gráficos pequenos escritos como texto SVG, sem biblioteca de gráficos: uma fileira de
gráficos de dispersão e um gráfico de linha. SVG é texto puro, então as figuras aparecem no GitHub
e as suas mudanças podem ser lidas em um diff. Todo número é arredondado para 2 casas decimais para
os arquivos ficarem estáveis.
"""

import numpy as np
import numpy.typing as npt

Array = npt.NDArray[np.float64]

PANEL = 200
GAP = 12
TITLE = 26
FONT = 'font-family="sans-serif" font-size="13"'


def scatter_panels(panels: list[tuple[str, Array]], radius: float, limit: float = 3.2) -> str:
    """EN: One square panel per (title, points) pair, side by side. Each panel shows the region
    from -limit to +limit in both axes, with the target ring drawn as a thin grey circle.

    PT: Um painel quadrado por par (título, pontos), lado a lado. Cada painel mostra a região de
    -limit a +limit nos dois eixos, com o anel alvo desenhado como um círculo cinza fino.
    """
    # EN: A point (x, y) of the plane becomes a pixel. The y axis is flipped because in SVG the
    #     pixel row grows downwards, and in mathematics y grows upwards.
    # PT: Um ponto (x, y) do plano vira um pixel. O eixo y é invertido porque no SVG a linha de
    #     pixels cresce para baixo, e na matemática y cresce para cima.
    scale = PANEL / (2.0 * limit)
    width = len(panels) * PANEL + (len(panels) + 1) * GAP
    height = PANEL + TITLE + GAP
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
    ]
    for index, (title, points) in enumerate(panels):
        left = GAP + index * (PANEL + GAP)
        centre_x = left + PANEL / 2.0
        centre_y = TITLE + PANEL / 2.0
        parts += [
            f'<text x="{centre_x:.2f}" y="18" text-anchor="middle" {FONT} fill="#1f2937">'
            f"{title}</text>",
            f'<rect x="{left}" y="{TITLE}" width="{PANEL}" height="{PANEL}" fill="#f8fafc" '
            f'stroke="#94a3b8"/>',
            f'<circle cx="{centre_x:.2f}" cy="{centre_y:.2f}" r="{radius * scale:.2f}" '
            f'fill="none" stroke="#94a3b8" stroke-dasharray="4 3"/>',
            '<g fill="#2563eb" fill-opacity="0.6">',
        ]
        # EN: Points outside the panel are pinned to its border, so that none is lost.
        # PT: Pontos fora do painel ficam presos à borda, para nenhum se perder.
        for x, y in np.clip(points, -limit, limit):
            parts.append(
                f'<circle cx="{centre_x + x * scale:.2f}" cy="{centre_y - y * scale:.2f}" r="1.6"/>'
            )
        parts.append("</g>")
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def line_chart(xs: list[int], ys: list[float], title: str, x_label: str) -> str:
    """EN: A line through the points (xs, ys), with the y axis starting at zero.

    PT: Uma linha pelos pontos (xs, ys), com o eixo y começando em zero.
    """
    width, height = 560, 300
    left, right, top, bottom = 56, 16, 34, 44
    plot_width = width - left - right
    plot_height = height - top - bottom
    top_value = max(ys) * 1.1

    def place(x: float, y: float) -> tuple[float, float]:
        return (
            left + (x - xs[0]) / (xs[-1] - xs[0]) * plot_width,
            top + (1.0 - y / top_value) * plot_height,
        )

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        f'<text x="{width / 2:.2f}" y="20" text-anchor="middle" {FONT} fill="#1f2937">'
        f"{title}</text>",
        f'<rect x="{left}" y="{top}" width="{plot_width}" height="{plot_height}" fill="#f8fafc" '
        f'stroke="#94a3b8"/>',
    ]
    for tick in range(5):
        value = top_value * tick / 4.0
        _, y = place(xs[0], value)
        parts += [
            f'<line x1="{left}" y1="{y:.2f}" x2="{left + plot_width}" y2="{y:.2f}" '
            f'stroke="#e2e8f0"/>',
            f'<text x="{left - 6}" y="{y + 4:.2f}" text-anchor="end" {FONT} fill="#475569">'
            f"{value:.2f}</text>",
        ]
    for x_value in (xs[0], xs[len(xs) // 2], xs[-1]):
        x, _ = place(x_value, 0.0)
        parts.append(
            f'<text x="{x:.2f}" y="{top + plot_height + 16}" text-anchor="middle" {FONT} '
            f'fill="#475569">{x_value}</text>'
        )
    path = " ".join(
        f"{x:.2f},{y:.2f}" for x, y in (place(x, y) for x, y in zip(xs, ys, strict=True))
    )
    parts += [
        f'<text x="{left + plot_width / 2:.2f}" y="{height - 8}" text-anchor="middle" {FONT} '
        f'fill="#475569">{x_label}</text>',
        f'<polyline points="{path}" fill="none" stroke="#2563eb" stroke-width="2"/>',
        "</svg>",
    ]
    return "\n".join(parts) + "\n"
