"""EN: A loss chart with several curves, written as SVG text with no plotting library.

PT: Um gráfico de perda com várias curvas, escrito como texto SVG sem biblioteca de gráficos.

ES: Un gráfico de pérdida con varias curvas, escrito como texto SVG sin biblioteca de gráficos.
"""

COLOURS = ["#2563eb", "#ea580c", "#16a34a"]


def loss_curves_svg(curves: dict[str, list[float]], title: str) -> str:
    width, height, margin = 640, 340, 48
    top = max(max(losses) for losses in curves.values())
    longest = max(len(losses) for losses in curves.values())
    axis = height - margin

    def at(epoch: int, loss: float) -> str:
        x = margin + (width - 2 * margin) * epoch / (longest - 1)
        y = axis - (height - 2 * margin) * loss / top
        return f"{x:.2f},{y:.2f}"

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        'font-family="sans-serif" font-size="12">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        f'<text x="{margin}" y="24" font-size="14">{title}</text>',
        f'<line x1="{margin}" y1="{axis}" x2="{width - margin}" y2="{axis}" stroke="#111"/>',
        f'<line x1="{margin}" y1="{margin}" x2="{margin}" y2="{axis}" stroke="#111"/>',
        f'<text x="{margin - 6}" y="{margin + 4}" text-anchor="end">{top:.2f}</text>',
        f'<text x="{margin - 6}" y="{axis + 4}" text-anchor="end">0</text>',
        f'<text x="{margin}" y="{axis + 18}">epoch 1</text>',
        f'<text x="{width - margin}" y="{axis + 18}" text-anchor="end">epoch {longest}</text>',
        f'<text x="{width / 2:.0f}" y="{axis + 34}" text-anchor="middle">'
        "loss (binary cross-entropy) per epoch</text>",
    ]
    for index, (label, losses) in enumerate(curves.items()):
        colour = COLOURS[index % len(COLOURS)]
        points = " ".join(at(epoch, loss) for epoch, loss in enumerate(losses))
        legend_y = margin + 14 + 18 * index
        lines += [
            f'<polyline fill="none" stroke="{colour}" stroke-width="2" points="{points}"/>',
            f'<rect x="{width - margin - 250}" y="{legend_y - 9}" width="12" height="4" '
            f'fill="{colour}"/>',
            f'<text x="{width - margin - 232}" y="{legend_y}">{label}</text>',
        ]
    return "\n".join([*lines, "</svg>", ""])
