"""EN: Two small figures written as SVG text, with no plotting library: the loss curve and the
attention heat map. SVG is plain text, so the files show up on GitHub and diff well.

PT: Duas figuras pequenas escritas como texto SVG, sem biblioteca de gráficos: a curva de perda
e o mapa de calor da atenção. SVG é texto puro, então os arquivos aparecem no GitHub e geram
diffs legíveis.

ES: Dos figuras pequeñas escritas como texto SVG, sin biblioteca de gráficos: la curva de pérdida
y el mapa de calor de la atención. SVG es texto plano, así que los archivos aparecen en GitHub y
generan diffs legibles.
"""

import numpy as np

FONT = 'font-family="monospace" font-size="12"'


def display_char(char: str) -> str:
    # EN: Invisible characters get a visible stand-in in the figures.
    # PT: Caracteres invisíveis ganham um substituto visível nas figuras.
    # ES: Los caracteres invisibles reciben un sustituto visible en las figuras.
    return {"\n": "\\n", " ": "_"}.get(char, char)


def _escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def loss_curve_svg(
    steps: list[int],
    series: list[tuple[str, str, list[float]]],
    baselines: list[tuple[str, str, float]],
) -> str:
    """EN: `series` are (label, colour, one loss per step). `baselines` are horizontal lines.

    PT: `series` são (rótulo, cor, uma perda por passo). `baselines` são linhas horizontais.

    ES: `series` son (etiqueta, color, una pérdida por paso). `baselines` son líneas horizontales.
    """
    width, height, left, right, top, bottom = 680, 380, 56, 20, 20, 44
    plot_w, plot_h = width - left - right, height - top - bottom
    y_max = 4.0

    def x_of(step: int) -> float:
        return left + plot_w * step / steps[-1]

    def y_of(loss: float) -> float:
        return top + plot_h * (1 - min(loss, y_max) / y_max)

    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
    ]
    for tick in range(5):
        y = y_of(float(tick))
        out.append(
            f'<line x1="{left}" y1="{y:.2f}" x2="{width - right}" y2="{y:.2f}" stroke="#e5e7eb"/>'
        )
        out.append(
            f'<text x="{left - 8}" y="{y + 4:.2f}" text-anchor="end" {FONT} fill="#374151">'
            f"{tick}.0</text>"
        )
    for index in range(6):
        step = round(steps[-1] * index / 5)
        out.append(
            f'<text x="{x_of(step):.2f}" y="{height - bottom + 18}" text-anchor="middle" {FONT} '
            f'fill="#374151">{step}</text>'
        )
    out.append(
        f'<text x="{left + plot_w / 2:.2f}" y="{height - 6}" text-anchor="middle" {FONT} '
        'fill="#111827">training step</text>'
    )
    out.append(
        f'<text x="14" y="{top + plot_h / 2:.2f}" text-anchor="middle" {FONT} fill="#111827" '
        f'transform="rotate(-90 14 {top + plot_h / 2:.2f})">loss (nats)</text>'
    )
    for label, colour, value in baselines:
        y = y_of(value)
        out.append(
            f'<line x1="{left}" y1="{y:.2f}" x2="{width - right}" y2="{y:.2f}" stroke="{colour}" '
            'stroke-dasharray="6 4"/>'
        )
        out.append(
            f'<text x="{width - right - 4}" y="{y - 5:.2f}" text-anchor="end" {FONT} '
            f'fill="{colour}">{_escape(label)} = {value:.3f}</text>'
        )
    for index, (label, colour, values) in enumerate(series):
        points = " ".join(
            f"{x_of(step):.2f},{y_of(value):.2f}" for step, value in zip(steps, values, strict=True)
        )
        out.append(f'<polyline points="{points}" fill="none" stroke="{colour}" stroke-width="2"/>')
        legend_y = top + 100 + 18 * index
        out.append(
            f'<line x1="{left + 250}" y1="{legend_y - 4}" x2="{left + 274}" y2="{legend_y - 4}" '
            f'stroke="{colour}" stroke-width="2"/>'
        )
        out.append(
            f'<text x="{left + 280}" y="{legend_y}" {FONT} fill="#111827">'
            f"{_escape(label)} (final {values[-1]:.3f})</text>"
        )
    out.append(
        f'<rect x="{left}" y="{top}" width="{plot_w}" height="{plot_h}" fill="none" '
        'stroke="#374151"/>'
    )
    out.append("</svg>")
    return "\n".join(out) + "\n"


def attention_svg(text: str, weights: np.ndarray, query_position: int, title: str) -> str:
    """EN: One square per pair (row = the position that asks, column = the position looked at).
    The darker the blue, the larger the weight. Grey squares with a dot are the future, which
    the causal mask forbids: the whole upper triangle.

    PT: Um quadrado por par (linha = a posição que pergunta, coluna = a posição olhada). Quanto
    mais escuro o azul, maior o peso. Quadrados cinza com um ponto são o futuro, que a máscara
    causal proíbe: todo o triângulo superior.

    ES: Un cuadrado por par (fila = la posición que pregunta, columna = la posición mirada).
    Cuanto más oscuro el azul, mayor el peso. Los cuadrados grises con un punto son el futuro, que
    la máscara causal prohíbe: todo el triángulo superior.
    """
    cell, left, top = 18, 40, 62
    size = len(text)
    width, height = left + size * cell + 16, top + size * cell + 16
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        f'<text x="{left}" y="16" {FONT} fill="#111827">{_escape(title)}</text>',
        f'<text x="{left}" y="32" {FONT} fill="#374151">row asks, column is looked at, '
        "grey = masked future</text>",
    ]
    for index, char in enumerate(text):
        label = _escape(display_char(char))
        centre = left + index * cell + cell / 2
        out.append(
            f'<text x="{centre:.1f}" y="{top - 6}" text-anchor="middle" {FONT} '
            f'fill="#111827">{label}</text>'
        )
        weight = ' font-weight="bold"' if index == query_position else ""
        out.append(
            f'<text x="{left - 8}" y="{top + index * cell + 13}" text-anchor="end" {FONT} '
            f'fill="#111827"{weight}>{label}</text>'
        )
    for row in range(size):
        for column in range(size):
            x, y = left + column * cell, top + row * cell
            if column > row:
                out.append(
                    f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="#e5e7eb" '
                    'stroke="#ffffff"/>'
                )
                out.append(
                    f'<circle cx="{x + cell / 2:.1f}" cy="{y + cell / 2:.1f}" r="1.5" '
                    'fill="#9ca3af"/>'
                )
            else:
                out.append(
                    f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="#1d4ed8" '
                    f'fill-opacity="{weights[row, column]:.2f}" stroke="#dbeafe"/>'
                )
    y = top + query_position * cell
    out.append(
        f'<rect x="{left}" y="{y}" width="{(query_position + 1) * cell}" height="{cell}" '
        'fill="none" stroke="#dc2626" stroke-width="2"/>'
    )
    out.append("</svg>")
    return "\n".join(out) + "\n"


def attention_text_grid(text: str, weights: np.ndarray) -> list[str]:
    """EN: The same map as text. Each cell is the weight in tenths (7 means 0.7 to 0.8, and 9 goes
    up to 1.0), "." is a masked position.

    PT: O mesmo mapa em texto. Cada célula é o peso em décimos (7 quer dizer de 0,7 a 0,8, e 9 vai
    até 1,0), "." é uma posição mascarada.

    ES: El mismo mapa en texto. Cada celda es el peso en décimas (7 quiere decir de 0,7 a 0,8, y 9
    llega hasta 1,0), "." es una posición enmascarada.
    """
    labels = [display_char(char) for char in text]
    lines = ["     " + " ".join(f"{label:>2}" for label in labels)]
    for row, label in enumerate(labels):
        cells = [
            " ." if column > row else f"{min(int(weights[row, column] * 10), 9):>2}"
            for column in range(len(text))
        ]
        lines.append(f"{label:>3}  " + " ".join(cells))
    return lines
