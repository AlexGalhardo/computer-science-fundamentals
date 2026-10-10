"""EN: The dataset: small greyscale images of four shapes, drawn by this file. Nothing is
downloaded.

Each image is a 20 x 20 tensor of brightness values from 0 (black) to 1 (white). The shape is
drawn from its geometry (a formula for "how far is this pixel from the outline"), so the same
function can draw it bigger, thicker, moved or rotated. The file also has the two image
transformations used for data augmentation: moving and rotating an image that already exists.

PT: O conjunto de dados: imagens pequenas em tons de cinza de quatro formas, desenhadas por este
arquivo. Nada é baixado.

Cada imagem é um tensor 20 x 20 de valores de brilho de 0 (preto) a 1 (branco). A forma é
desenhada a partir da sua geometria (uma fórmula para "a que distância este pixel está do
contorno"), então a mesma função consegue desenhá-la maior, mais grossa, deslocada ou girada. O
arquivo também tem as duas transformações de imagem usadas no aumento de dados: deslocar e girar
uma imagem que já existe.

ES: El conjunto de datos: imágenes pequeñas en escala de grises de cuatro formas, dibujadas por
este archivo. No se descarga nada.

Cada imagen es un tensor de 20 x 20 con valores de brillo de 0 (negro) a 1 (blanco). La forma se
dibuja a partir de su geometría (una fórmula para "a qué distancia está este píxel del contorno"),
así que la misma función puede dibujarla más grande, más gruesa, desplazada o girada. El archivo
también tiene las dos transformaciones de imagen usadas en el aumento de datos: desplazar y girar
una imagen que ya existe.
"""

import math

import torch

SIZE = 20
CLASSES = ("circle", "square", "triangle", "cross")
# EN: The middle of a 20-pixel side is between pixels 9 and 10, so the centre is at 9.5.
# PT: O meio de um lado de 20 pixels fica entre os pixels 9 e 10, então o centro está em 9.5.
# ES: La mitad de un lado de 20 píxeles queda entre los píxeles 9 y 10, así que el centro está
#     en 9.5.
CENTRE = (SIZE - 1) / 2


def _segment_distance(
    u: torch.Tensor, v: torch.Tensor, start: tuple[float, float], end: tuple[float, float]
) -> torch.Tensor:
    # EN: Distance from every pixel to a line segment: project the pixel on the line, keep the
    #     projection between the two ends, and measure the distance to that point.
    # PT: Distância de cada pixel a um segmento de reta: projeta o pixel na reta, mantém a
    #     projeção entre as duas pontas e mede a distância até esse ponto.
    # ES: Distancia de cada píxel a un segmento de recta: proyecta el píxel sobre la recta, mantiene
    #     la proyección entre los dos extremos y mide la distancia hasta ese punto.
    px, py = end[0] - start[0], end[1] - start[1]
    t = (((u - start[0]) * px + (v - start[1]) * py) / (px * px + py * py)).clamp(0.0, 1.0)
    return torch.sqrt((u - start[0] - t * px) ** 2 + (v - start[1] - t * py) ** 2)


def draw_shape(
    kind: str,
    centre_x: float = CENTRE,
    centre_y: float = CENTRE,
    radius: float = 4.0,
    thickness: float = 1.5,
    angle_degrees: float = 0.0,
    size: int = SIZE,
) -> torch.Tensor:
    """EN: Draws the outline of one shape and returns a size x size tensor with values in [0, 1].

    PT: Desenha o contorno de uma forma e devolve um tensor size x size com valores em [0, 1].

    ES: Dibuja el contorno de una forma y devuelve un tensor size x size con valores en [0, 1].
    """
    # EN: Two tables with the coordinates of every pixel: ys[r][c] = r and xs[r][c] = c. All the
    #     pixels are then computed at once, with no loop.
    # PT: Duas tabelas com as coordenadas de cada pixel: ys[r][c] = r e xs[r][c] = c. Todos os
    #     pixels são então calculados de uma vez, sem laço.
    # ES: Dos tablas con las coordenadas de cada píxel: ys[r][c] = r y xs[r][c] = c. Todos los
    #     píxeles se calculan entonces de una vez, sin bucle.
    axis = torch.arange(size, dtype=torch.float32)
    ys, xs = torch.meshgrid(axis, axis, indexing="ij")
    dx, dy = xs - centre_x, ys - centre_y

    # EN: To draw a rotated shape we rotate the coordinates the other way and draw the upright
    #     shape in them. (u, v) are the coordinates of the pixel as the shape sees them.
    # PT: Para desenhar uma forma girada giramos as coordenadas no sentido contrário e desenhamos
    #     nelas a forma em pé. (u, v) são as coordenadas do pixel vistas pela forma.
    # ES: Para dibujar una forma girada giramos las coordenadas en sentido contrario y dibujamos en
    #     ellas la forma derecha. (u, v) son las coordenadas del píxel vistas por la forma.
    angle = math.radians(angle_degrees)
    u = dx * math.cos(angle) + dy * math.sin(angle)
    v = -dx * math.sin(angle) + dy * math.cos(angle)

    if kind == "circle":
        distance = (torch.sqrt(u * u + v * v) - radius).abs()
    elif kind == "square":
        half_side = 0.8 * radius
        distance = (torch.maximum(u.abs(), v.abs()) - half_side).abs()
    elif kind == "cross":
        horizontal = _segment_distance(u, v, (-radius, 0.0), (radius, 0.0))
        vertical = _segment_distance(u, v, (0.0, -radius), (0.0, radius))
        distance = torch.minimum(horizontal, vertical)
    elif kind == "triangle":
        # EN: Three corners on a circle, 120 degrees apart, the first one pointing up (the y axis
        #     of an image grows downwards, so "up" is a negative y).
        # PT: Três cantos sobre um círculo, a 120 graus um do outro, o primeiro apontando para
        #     cima (o eixo y de uma imagem cresce para baixo, então "para cima" é um y negativo).
        # ES: Tres esquinas sobre un círculo, a 120 grados una de otra, la primera apuntando hacia
        #     arriba (el eje y de una imagen crece hacia abajo, así que "hacia arriba" es una y
        #     negativa).
        corners = [
            (radius * math.cos(math.radians(a)), radius * math.sin(math.radians(a)))
            for a in (-90.0, 30.0, 150.0)
        ]
        sides = [_segment_distance(u, v, corners[i], corners[(i + 1) % 3]) for i in range(3)]
        distance = torch.minimum(torch.minimum(sides[0], sides[1]), sides[2])
    else:
        raise ValueError(f"unknown shape: {kind}")

    # EN: Pixels on the outline get 1, pixels far from it get 0, and the pixels at the border of
    #     the line get something in between, which gives a smooth line and not a staircase.
    # PT: Os pixels sobre o contorno recebem 1, os distantes recebem 0, e os pixels na beira do
    #     traço recebem algo no meio, o que dá um traço suave e não uma escada.
    # ES: Los píxeles sobre el contorno reciben 1, los lejanos reciben 0, y los píxeles en el borde
    #     del trazo reciben algo intermedio, lo que da un trazo suave y no una escalera.
    return (thickness / 2 + 0.5 - distance).clamp(0.0, 1.0)


def make_dataset(
    count: int,
    seed: int,
    shift: tuple[float, float] = (0.0, 0.0),
    angle: tuple[float, float] = (0.0, 0.0),
    jitter: float = 1.0,
    noise: float = 0.08,
) -> tuple[torch.Tensor, torch.Tensor]:
    """EN: Generates `count` labelled images. Returns images (count x 1 x 20 x 20) and labels.

    Every image has a random size, line thickness, brightness, a small random position (`jitter`
    pixels around the centre) and noise. `shift=(2, 4)` moves each shape 2 to 4 pixels away from
    the centre on both axes, to the left or right and up or down at random. `angle=(10, 30)`
    rotates each shape 10 to 30 degrees, clockwise or not at random. The same seed always gives
    the same images.

    PT: Gera `count` imagens rotuladas. Devolve as imagens (count x 1 x 20 x 20) e os rótulos.

    Cada imagem tem tamanho, espessura do traço e brilho aleatórios, uma pequena posição
    aleatória (`jitter` pixels em volta do centro) e ruído. `shift=(2, 4)` afasta cada forma de 2
    a 4 pixels do centro nos dois eixos, para a esquerda ou a direita e para cima ou para baixo
    ao acaso. `angle=(10, 30)` gira cada forma de 10 a 30 graus, em um sentido ou no outro ao
    acaso. A mesma semente sempre dá as mesmas imagens.

    ES: Genera `count` imágenes etiquetadas. Devuelve las imágenes (count x 1 x 20 x 20) y las
    etiquetas.

    Cada imagen tiene tamaño, grosor del trazo y brillo aleatorios, una pequeña posición aleatoria
    (`jitter` píxeles alrededor del centro) y ruido. `shift=(2, 4)` aleja cada forma de 2 a 4
    píxeles del centro en los dos ejes, a la izquierda o a la derecha y hacia arriba o hacia abajo
    al azar. `angle=(10, 30)` gira cada forma de 10 a 30 grados, en un sentido o en el otro al
    azar. La misma semilla siempre da las mismas imágenes.
    """
    generator = torch.Generator().manual_seed(seed)
    # EN: One row of random numbers in [0, 1) per image; each column decides one property.
    # PT: Uma linha de números aleatórios em [0, 1) por imagem; cada coluna decide uma propriedade.
    # ES: Una fila de números aleatorios en [0, 1) por imagen; cada columna decide una propiedad.
    rolls = torch.rand(count, 10, generator=generator).tolist()

    def signed(low_high: tuple[float, float], amount: float, side: float) -> float:
        value = low_high[0] + (low_high[1] - low_high[0]) * amount
        return value if side < 0.5 else -value

    images = torch.zeros(count, 1, SIZE, SIZE)
    # EN: Labels 0, 1, 2, 3, 0, 1, ... so that every class has the same number of images.
    # PT: Rótulos 0, 1, 2, 3, 0, 1, ... para que toda classe tenha o mesmo número de imagens.
    # ES: Etiquetas 0, 1, 2, 3, 0, 1, ... para que cada clase tenga el mismo número de imágenes.
    labels = torch.arange(count) % len(CLASSES)
    for index, roll in enumerate(rolls):
        centre_x = CENTRE + jitter * (2 * roll[0] - 1) + signed(shift, roll[1], roll[2])
        centre_y = CENTRE + jitter * (2 * roll[3] - 1) + signed(shift, roll[4], roll[5])
        shape = draw_shape(
            CLASSES[int(labels[index])],
            centre_x,
            centre_y,
            radius=3.0 + 1.5 * roll[6],
            thickness=1.0 + roll[7],
            angle_degrees=signed(angle, roll[8], roll[9]),
        )
        images[index, 0] = shape
    brightness = 0.7 + 0.3 * torch.rand(count, 1, 1, 1, generator=generator)
    grain = noise * torch.randn(count, 1, SIZE, SIZE, generator=generator)
    return (images * brightness + grain).clamp(0.0, 1.0), labels


def transform_batch(
    images: torch.Tensor, angles_degrees: torch.Tensor, shifts: torch.Tensor
) -> torch.Tensor:
    """EN: Rotates and moves images that already exist. `shifts` holds (dx, dy) in pixels.

    For every pixel of the NEW image we compute where it comes from in the OLD image (undo the
    shift, then undo the rotation) and read the brightness there. When that place falls between
    four pixels, their values are mixed (bilinear interpolation), and when it falls outside the
    image the result is 0 (black). `affine_grid` builds the table "new pixel -> old position" and
    `grid_sample` does the reading.

    PT: Gira e desloca imagens que já existem. `shifts` guarda (dx, dy) em pixels.

    Para cada pixel da imagem NOVA calculamos de onde ele vem na imagem ANTIGA (desfaz o
    deslocamento, depois desfaz a rotação) e lemos o brilho ali. Quando esse lugar cai entre
    quatro pixels, os valores deles são misturados (interpolação bilinear), e quando cai fora da
    imagem o resultado é 0 (preto). `affine_grid` monta a tabela "pixel novo -> posição antiga" e
    `grid_sample` faz a leitura.

    ES: Gira y desplaza imágenes que ya existen. `shifts` guarda (dx, dy) en píxeles.

    Para cada píxel de la imagen NUEVA calculamos de dónde viene en la imagen ANTIGUA (deshace el
    desplazamiento, luego deshace la rotación) y leemos el brillo ahí. Cuando ese lugar cae entre
    cuatro píxeles, sus valores se mezclan (interpolación bilineal), y cuando cae fuera de la
    imagen el resultado es 0 (negro). `affine_grid` arma la tabla "píxel nuevo -> posición antigua"
    y `grid_sample` hace la lectura.
    """
    radians = angles_degrees * (math.pi / 180.0)
    cos, sin = torch.cos(radians), torch.sin(radians)
    # EN: affine_grid measures positions from -1 (one border) to +1 (the other border), so a side
    #     of 20 pixels is 2 units long and one pixel is 2 / 20 of a unit.
    # PT: affine_grid mede posições de -1 (uma borda) a +1 (a outra borda), então um lado de 20
    #     pixels tem 2 unidades e um pixel vale 2 / 20 de unidade.
    # ES: affine_grid mide posiciones de -1 (un borde) a +1 (el otro borde), así que un lado de 20
    #     píxeles tiene 2 unidades y un píxel vale 2 / 20 de unidad.
    tx = shifts[:, 0] * (2.0 / images.shape[-1])
    ty = shifts[:, 1] * (2.0 / images.shape[-2])
    theta = torch.stack(
        [
            torch.stack([cos, sin, -(cos * tx + sin * ty)], dim=1),
            torch.stack([-sin, cos, -(-sin * tx + cos * ty)], dim=1),
        ],
        dim=1,
    )
    grid = torch.nn.functional.affine_grid(theta, list(images.shape), align_corners=False)
    return torch.nn.functional.grid_sample(
        images, grid, mode="bilinear", padding_mode="zeros", align_corners=False
    )


def random_augment(
    images: torch.Tensor,
    generator: torch.Generator,
    max_shift: float = 4.0,
    max_angle: float = 30.0,
) -> torch.Tensor:
    """EN: Data augmentation: every image of the batch gets its own random shift and rotation.

    The label stays true (a moved, slightly rotated triangle is still a triangle), so the network
    sees new examples for free and learns that position and small rotations do not matter. It is
    applied to training batches only, never to the images used to measure accuracy.

    PT: Aumento de dados: cada imagem do lote recebe o seu próprio deslocamento e rotação
    aleatórios.

    O rótulo continua verdadeiro (um triângulo deslocado e um pouco girado ainda é um triângulo),
    então a rede vê exemplos novos de graça e aprende que a posição e pequenas rotações não
    importam. É aplicado só aos lotes de treino, nunca às imagens usadas para medir a acurácia.

    ES: Aumento de datos: cada imagen del lote recibe su propio desplazamiento y rotación
    aleatorios.

    La etiqueta sigue siendo verdadera (un triángulo desplazado y un poco girado sigue siendo un
    triángulo), así que la red ve ejemplos nuevos gratis y aprende que la posición y las rotaciones
    pequeñas no importan. Se aplica solo a los lotes de entrenamiento, nunca a las imágenes usadas
    para medir la exactitud.
    """
    count = images.shape[0]
    angles = (2 * torch.rand(count, generator=generator) - 1) * max_angle
    shifts = (2 * torch.rand(count, 2, generator=generator) - 1) * max_shift
    return transform_batch(images, angles, shifts)
