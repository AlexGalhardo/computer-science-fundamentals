"""EN: Drawings with no plotting library: a loss curve and a decision boundary, as SVG and text.

SVG is plain text that a browser (and GitHub) draws, so the project needs no dependency to make
a figure.

PT: Desenhos sem biblioteca de gráficos: uma curva de perda e uma fronteira de decisão, em SVG e
em texto.

SVG é texto puro que um navegador (e o GitHub) desenha, então o projeto não precisa de nenhuma
dependência para fazer uma figura.

ES: Dibujos sin biblioteca de gráficos: una curva de pérdida y una frontera de decisión, en SVG y
en texto.

SVG es texto plano que un navegador (y GitHub) dibuja, así que el proyecto no necesita ninguna
dependencia para hacer una figura.
"""

from data import Point
from nn import MLP
from train import predict, probability

X_RANGE = (-1.6, 2.6)
Y_RANGE = (-1.3, 1.8)
BLUE = "#2563eb"
ORANGE = "#ea580c"


def loss_curve_svg(losses: list[float], title: str) -> str:
    width, height, margin = 640, 320, 48
    top = max(losses)
    steps = len(losses) - 1

    def at(epoch: int, loss: float) -> str:
        x = margin + (width - 2 * margin) * epoch / steps
        y = height - margin - (height - 2 * margin) * loss / top
        return f"{x:.2f},{y:.2f}"

    points = " ".join(at(epoch, loss) for epoch, loss in enumerate(losses))
    axis = height - margin
    return "\n".join(
        [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
            'font-family="sans-serif" font-size="12">',
            f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
            f'<text x="{margin}" y="24" font-size="14">{title}</text>',
            f'<line x1="{margin}" y1="{axis}" x2="{width - margin}" y2="{axis}" stroke="#111"/>',
            f'<line x1="{margin}" y1="{margin}" x2="{margin}" y2="{axis}" stroke="#111"/>',
            f'<text x="{margin - 6}" y="{margin + 4}" text-anchor="end">{top:.2f}</text>',
            f'<text x="{margin - 6}" y="{axis + 4}" text-anchor="end">0</text>',
            f'<text x="{margin}" y="{axis + 18}">epoch 1</text>',
            f'<text x="{width - margin}" y="{axis + 18}" text-anchor="end">epoch {len(losses)}'
            "</text>",
            f'<text x="{width / 2:.0f}" y="{axis + 34}" text-anchor="middle">'
            "loss (binary cross-entropy) per epoch</text>",
            f'<polyline fill="none" stroke="{BLUE}" stroke-width="2" points="{points}"/>',
            "</svg>",
            "",
        ]
    )


def _grid(columns: int, rows: int) -> list[list[Point]]:
    """EN: The centres of a grid of cells covering the plane.

    PT: Os centros de uma grade.

    ES: Los centros de una cuadrícula.
    """
    x_step = (X_RANGE[1] - X_RANGE[0]) / columns
    y_step = (Y_RANGE[1] - Y_RANGE[0]) / rows
    return [
        [
            (X_RANGE[0] + (column + 0.5) * x_step, Y_RANGE[1] - (row + 0.5) * y_step)
            for column in range(columns)
        ]
        for row in range(rows)
    ]


def decision_boundary_text(model: MLP, points: list[Point], labels: list[int]) -> str:
    """EN: The decision boundary as characters: the network is asked for its answer at every
    cell of a grid. `.` is where it answers class 0 and `#` where it answers class 1. The
    training points are drawn on top, `o` for class 0 and `x` for class 1.

    PT: A fronteira de decisão em caracteres: pergunta-se à rede a resposta em cada célula de uma
    grade. `.` é onde ela responde classe 0 e `#` onde responde classe 1. Os pontos de treino são
    desenhados por cima, `o` para a classe 0 e `x` para a classe 1.

    ES: La frontera de decisión en caracteres: se le pregunta a la red la respuesta en cada celda de
    una cuadrícula. `.` es donde responde clase 0 y `#` donde responde clase 1. Los puntos de
    entrenamiento se dibujan encima, `o` para la clase 0 y `x` para la clase 1.
    """
    columns, rows = 64, 24
    cells = [
        ["#" if predict(model, cell) == 1 else "." for cell in line]
        for line in _grid(columns, rows)
    ]
    for (x, y), label in zip(points, labels, strict=True):
        column = int((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]) * columns)
        row = int((Y_RANGE[1] - y) / (Y_RANGE[1] - Y_RANGE[0]) * rows)
        if 0 <= column < columns and 0 <= row < rows:
            cells[row][column] = "x" if label == 1 else "o"
    return "\n".join("".join(line) for line in cells) + "\n"


def decision_boundary_svg(model: MLP, points: list[Point], labels: list[int], title: str) -> str:
    """EN: The same picture in colour: each cell is painted with the probability of class 1.

    PT: A mesma figura em cores: cada célula é pintada com a probabilidade da classe 1.

    ES: La misma figura en colores: cada celda se pinta con la probabilidad de la clase 1.
    """
    columns, rows, cell, margin = 56, 40, 10, 32
    width, height = columns * cell, rows * cell + margin
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        'font-family="sans-serif" font-size="13">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        f'<text x="8" y="21">{title}</text>',
    ]
    for row, line in enumerate(_grid(columns, rows)):
        for column, centre in enumerate(line):
            chance = probability(model, centre)
            colour = ORANGE if chance > 0.5 else BLUE
            # EN: The colour is stronger where the network is more certain.
            # PT: A cor é mais forte onde a rede tem mais certeza.
            # ES: El color es más fuerte donde la red está más segura.
            opacity = 0.12 + 0.5 * abs(chance - 0.5) * 2
            parts.append(
                f'<rect x="{column * cell}" y="{row * cell + margin}" width="{cell}" '
                f'height="{cell}" fill="{colour}" fill-opacity="{opacity:.2f}"/>'
            )
    for (x, y), label in zip(points, labels, strict=True):
        cx = (x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]) * width
        cy = (Y_RANGE[1] - y) / (Y_RANGE[1] - Y_RANGE[0]) * rows * cell + margin
        colour = ORANGE if label == 1 else BLUE
        parts.append(
            f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="3" fill="{colour}" stroke="#111" '
            'stroke-width="0.6"/>'
        )
    parts += ["</svg>", ""]
    return "\n".join(parts)
