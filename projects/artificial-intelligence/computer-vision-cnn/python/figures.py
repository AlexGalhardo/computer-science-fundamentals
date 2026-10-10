"""EN: Figures without any plotting or image library: a PNG writer and an SVG line chart.

A PNG file is a signature followed by chunks. Three chunks are enough for a greyscale picture:
IHDR (width, height, 8 bits per pixel, greyscale), IDAT (the pixels, compressed with zlib) and
IEND. An SVG file is text that describes lines and labels, so the loss curve is written as text.

PT: Figuras sem nenhuma biblioteca de gráficos ou de imagens: um gravador de PNG e um gráfico de
linhas em SVG.

Um arquivo PNG é uma assinatura seguida de blocos (chunks). Três blocos bastam para uma figura em
tons de cinza: IHDR (largura, altura, 8 bits por pixel, tons de cinza), IDAT (os pixels,
comprimidos com zlib) e IEND. Um arquivo SVG é texto que descreve linhas e rótulos, então a curva
de perda é escrita como texto.

ES: Figuras sin ninguna biblioteca de gráficos ni de imágenes: un escritor de PNG y un gráfico de
líneas en SVG.

Un archivo PNG es una firma seguida de bloques (chunks). Tres bloques bastan para una figura en
escala de grises: IHDR (ancho, alto, 8 bits por píxel, escala de grises), IDAT (los píxeles,
comprimidos con zlib) y IEND. Un archivo SVG es texto que describe líneas y etiquetas, así que la
curva de pérdida se escribe como texto.
"""

import struct
import zlib
from pathlib import Path

import torch

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def _chunk(kind: bytes, data: bytes) -> bytes:
    # EN: Every chunk is: length, 4-letter type, data, and a checksum (CRC) of type + data.
    # PT: Todo bloco é: tamanho, tipo de 4 letras, dados e uma soma de verificação (CRC) de
    #     tipo + dados.
    # ES: Todo bloque es: tamaño, tipo de 4 letras, datos y una suma de verificación (CRC) de
    #     tipo + datos.
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def png_bytes(pixels: torch.Tensor) -> bytes:
    """EN: Encodes a 2D tensor of integers from 0 (black) to 255 (white) as an 8-bit greyscale
    PNG.

    PT: Codifica um tensor 2D de inteiros de 0 (preto) a 255 (branco) como um PNG de 8 bits em
    tons de cinza.

    ES: Codifica un tensor 2D de enteros de 0 (negro) a 255 (blanco) como un PNG de 8 bits en
    escala de grises.
    """
    height, width = pixels.shape
    header = struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0)
    # EN: Each row starts with one byte saying which filter was applied to it. 0 means "none".
    # PT: Cada linha começa com um byte dizendo qual filtro foi aplicado a ela. 0 é "nenhum".
    # ES: Cada fila empieza con un byte que dice qué filtro se le aplicó. 0 es "ninguno".
    rows = b"".join(b"\x00" + bytes(row) for row in pixels.to(torch.uint8).tolist())
    return (
        PNG_SIGNATURE
        + _chunk(b"IHDR", header)
        + _chunk(b"IDAT", zlib.compress(rows, 9))
        + _chunk(b"IEND", b"")
    )


def write_png(path: Path, pixels: torch.Tensor) -> None:
    path.write_bytes(png_bytes(pixels))


def to_grey(values: torch.Tensor, signed: bool = False) -> torch.Tensor:
    """EN: Turns any 2D tensor into grey levels 0 to 255.

    Unsigned (brightness, activations): 0 is black and the largest value is white.
    Signed (filter weights, edge responses): 0 is middle grey, the largest positive value is
    white and the largest negative value is black, so the sign stays visible.

    PT: Transforma qualquer tensor 2D em níveis de cinza de 0 a 255.

    Sem sinal (brilho, ativações): 0 é preto e o maior valor é branco.
    Com sinal (pesos de filtros, respostas de borda): 0 é cinza médio, o maior valor positivo é
    branco e o maior valor negativo é preto, então o sinal continua visível.

    ES: Transforma cualquier tensor 2D en niveles de gris de 0 a 255.

    Sin signo (brillo, activaciones): 0 es negro y el mayor valor es blanco.
    Con signo (pesos de filtros, respuestas de borde): 0 es gris medio, el mayor valor positivo es
    blanco y el mayor valor negativo es negro, así que el signo sigue siendo visible.
    """
    values = values.detach().float()
    peak = float(values.abs().max())
    scaled = values / peak if peak > 0 else values
    if signed:
        scaled = 0.5 + 0.5 * scaled
    return (scaled.clamp(0.0, 1.0) * 255).round().to(torch.uint8)


def upscale(pixels: torch.Tensor, factor: int) -> torch.Tensor:
    # EN: Nearest neighbour: every pixel becomes a factor x factor square of the same grey, so a
    #     3 x 3 filter is visible without being blurred.
    # PT: Vizinho mais próximo: cada pixel vira um quadrado factor x factor do mesmo cinza, então
    #     um filtro 3 x 3 fica visível sem ser borrado.
    # ES: Vecino más cercano: cada píxel se convierte en un cuadrado factor x factor del mismo gris,
    #     así un filtro 3 x 3 se ve sin quedar borroso.
    return pixels.repeat_interleave(factor, dim=0).repeat_interleave(factor, dim=1)


def tile(pictures: list[torch.Tensor], gap: int = 4, background: int = 96) -> torch.Tensor:
    """EN: Puts pictures of the same size side by side, in one row, with a gap between them.

    PT: Coloca figuras do mesmo tamanho lado a lado, em uma linha, com um espaço entre elas.

    ES: Coloca figuras del mismo tamaño una al lado de otra, en una fila, con un espacio entre
    ellas.
    """
    height, width = pictures[0].shape
    total = gap + len(pictures) * (width + gap)
    canvas = torch.full((height + 2 * gap, total), background, dtype=torch.uint8)
    for index, picture in enumerate(pictures):
        left = gap + index * (width + gap)
        canvas[gap : gap + height, left : left + width] = picture
    return canvas


def loss_curve_svg(series: dict[str, list[float]]) -> str:
    """EN: A line chart "training loss per epoch", one line per model, as SVG text.

    PT: Um gráfico de linhas "perda de treino por época", uma linha por modelo, em texto SVG.

    ES: Un gráfico de líneas "pérdida de entrenamiento por época", una línea por modelo, en
    texto SVG.
    """
    width, height = 640, 360
    left, right, top, bottom = 60, 20, 40, 50
    plot_width, plot_height = width - left - right, height - top - bottom
    epochs = max(len(values) for values in series.values())
    peak = max(max(values) for values in series.values())
    # EN: Round the top of the vertical axis up to the next 0.5, so the ticks are round numbers.
    # PT: Arredonda o topo do eixo vertical para o próximo 0.5, para as marcas serem redondas.
    # ES: Redondea el tope del eje vertical al siguiente 0.5, para que las marcas sean redondas.
    y_max = max(0.5, -(-peak // 0.5) * 0.5)
    colours = ["#1d4ed8", "#b45309", "#15803d", "#7e22ce"]

    def x_of(epoch: int) -> float:
        return left + plot_width * (epoch - 1) / max(1, epochs - 1)

    def y_of(loss: float) -> float:
        return top + plot_height * (1 - loss / y_max)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" font-family="sans-serif" font-size="12">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        f'<text x="{left}" y="22" font-size="14" fill="#111827">'
        "Training loss per epoch (cross-entropy)</text>",
    ]
    ticks = int(round(y_max / 0.5))
    for tick in range(ticks + 1):
        value = 0.5 * tick
        y = y_of(value)
        parts.append(
            f'<line x1="{left}" y1="{y:.2f}" x2="{width - right}" y2="{y:.2f}" stroke="#e5e7eb"/>'
        )
        parts.append(
            f'<text x="{left - 8}" y="{y + 4:.2f}" text-anchor="end" fill="#374151">'
            f"{value:.1f}</text>"
        )
    for epoch in [1, *range(5, epochs + 1, 5)]:
        parts.append(
            f'<text x="{x_of(epoch):.2f}" y="{height - bottom + 18}" text-anchor="middle" '
            f'fill="#374151">{epoch}</text>'
        )
    parts.append(
        f'<text x="{left + plot_width / 2:.2f}" y="{height - 10}" text-anchor="middle" '
        'fill="#374151">epoch</text>'
    )
    parts.append(
        f'<rect x="{left}" y="{top}" width="{plot_width}" height="{plot_height}" fill="none" '
        'stroke="#9ca3af"/>'
    )
    for index, (name, values) in enumerate(series.items()):
        colour = colours[index % len(colours)]
        points = " ".join(
            f"{x_of(epoch):.2f},{y_of(loss):.2f}" for epoch, loss in enumerate(values, start=1)
        )
        parts.append(
            f'<polyline points="{points}" fill="none" stroke="{colour}" stroke-width="2"/>'
        )
        legend_y = top + 18 + 18 * index
        parts.append(
            f'<line x1="{width - right - 190}" y1="{legend_y - 4}" x2="{width - right - 166}" '
            f'y2="{legend_y - 4}" stroke="{colour}" stroke-width="2"/>'
        )
        parts.append(f'<text x="{width - right - 160}" y="{legend_y}" fill="#111827">{name}</text>')
    parts.append("</svg>")
    return "\n".join(parts) + "\n"
