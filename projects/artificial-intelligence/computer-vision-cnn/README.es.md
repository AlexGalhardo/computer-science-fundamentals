# computer-vision-cnn

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **cómo ve una red: imágenes como números, convolución, pooling y filtros aprendidos**. Una convolución se escribe a mano con bucles y se comprueba contra PyTorch, número por número. Después, una pequeña red convolucional (CNN) aprende a clasificar cuatro formas que dibuja el propio proyecto (círculo, cuadrado, triángulo, cruz), se compara con una red totalmente conectada del mismo tamaño sobre formas que se movieron, se vuelve a entrenar con aumento de datos (data augmentation), y sus filtros aprendidos y sus mapas de activación se guardan como imágenes.

Explicación completa: [docs/es/artificial-intelligence/computer-vision-cnn.md](../../../docs/es/artificial-intelligence/computer-vision-cnn.md).

## Temas del quiz que demuestra

- `artificial-intelligence` / `computer-vision`: imágenes como tensores, la convolución como producto punto deslizante, el filtro de bordes (Sobel), el tamaño de la salida (W - F + 2P) / S + 1, compartición de parámetros, max pooling, una CNN frente a una red totalmente conectada con imágenes desplazadas, aumento de datos, filtros aprendidos y mapas de activación (de características).
- `artificial-intelligence` / `image-generation`: aritmética de la convolución (tamaño del filtro, stride, padding y tamaño de la salida).
- `artificial-intelligence` / `pytorch`: tensores y sus formas (batch x canales x alto x ancho), `nn.Module`, el bucle de entrenamiento (predecir, pérdida, `zero_grad`, `backward`, `step`), mini-batches, semillas fijas.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-computer-vision-cnn.sh        # Linux and macOS
./setup-windows-computer-vision-cnn.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y luego ejecuta la demo, que entrena las tres redes y reescribe `results/`. Todo corre en la CPU, sin acceso a la red: no se descarga ningún dataset ni ningún modelo.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `python/conv.py` | la convolución escrita con cuatro bucles, los filtros Sobel, la fórmula del tamaño de la salida, y la misma llamada hecha por PyTorch |
| `python/shapes.py` | el dataset: dibuja las cuatro formas en tensores de 20 x 20 con una semilla fija, y el desplazamiento y la rotación usados para el aumento de datos |
| `python/cnn.py` | la CNN, la red totalmente conectada (MLP), el bucle de entrenamiento, la exactitud y el experimento que entrena y mide los tres modelos |
| `python/figures.py` | un escritor de PNG (solo biblioteca estándar) y la curva de pérdida en SVG |
| `python/demo.py` | ejecuta el experimento y escribe `results/` |
| `python/test_conv.py`, `python/test_cnn.py` | las pruebas, marcadas con el criterio de aceptación que demuestran |
| `results/` | resultados confirmados (committed): `results.md`, `loss-curve.svg` y las imágenes PNG |

La imagen es `python:3.14.8-slim-trixie` con `torch==2.14.1` (wheel para CPU), `numpy==2.5.3`, `pytest==9.1.1` y `ruff==0.16.10`. No hay torchvision, Pillow ni matplotlib: las formas, las transformaciones y los archivos de imagen los escribe el proyecto. NumPy está instalado porque PyTorch lo usa cuando está presente, y el código nunca lo importa. No se importa nada de otro miniproyecto.

## Pruebas

```sh
docker compose run --rm python-test
```

Ejecuta `ruff check`, `ruff format --check` y `pytest` (38 pruebas, de 10 a 30 segundos de pytest en la máquina donde se escribieron, según su carga, con PyTorch limitado a 2 hilos). Las tres redes se entrenan una vez y todas las pruebas leen ese único experimento.

| Criterion | What the tests check |
| --- | --- |
| MP-AI-8.1 | la convolución escrita a mano con el filtro Sobel es igual a `torch.nn.functional.conv2d` sobre una imagen generada, también con 5 variantes de stride y padding y 3 filtros, el tamaño de la salida sigue la fórmula, y el filtro no se invierte |
| MP-AI-8.2 | la CNN alcanza al menos 95% en imágenes reservadas, las dos redes tienen cantidades de parámetros a menos de 10% una de otra, y la red totalmente conectada es al menos 30 puntos peor que la CNN con imágenes desplazadas |
| MP-AI-8.3 | la tabla de resultados tiene la exactitud en imágenes centradas, desplazadas y rotadas con y sin aumento de datos, el aumento gana al menos 10 puntos en imágenes rotadas, y los filtros y los mapas de activación se escriben como archivos PNG válidos |

## Demo

```sh
docker compose run --rm python-demo    # writes results/
```

Los números de abajo son los de [`results/results.md`](results/results.md).

**Convolución a mano frente al framework.** Una imagen de 20 x 20 y el filtro Sobel de 3 x 3:

| Stride | Padding | (W - F + 2P) / S + 1 | Framework output | Same numbers |
| ---: | ---: | ---: | ---: | :---: |
| 1 | 0 | 18 x 18 | 18 x 18 | yes |
| 1 | 1 | 20 x 20 | 20 x 20 | yes |
| 2 | 0 | 9 x 9 | 9 x 9 | yes |
| 2 | 1 | 10 x 10 | 10 x 10 | yes |
| 3 | 2 | 8 x 8 | 8 x 8 | yes |

| Input | Sobel x (vertical edges) | Sobel y (horizontal edges) |
| :---: | :---: | :---: |
| ![input](results/edge-input.png) | ![sobel x](results/edge-sobel-x.png) | ![sobel y](results/edge-sobel-y.png) |

**CNN frente a una red totalmente conectada.** Ambas se entrenan con 1200 formas centradas y se miden con 800 imágenes que nunca vieron:

| Model | Parameters | Held-out, centred | Held-out, shifted |
| --- | ---: | ---: | ---: |
| CNN | 1932 | 99.9% | 93.3% |
| Fully connected (MLP) | 2029 | 99.9% | 5.1% |

Ambas aprenden las formas centradas. Cuando las formas se mueven de 2 a 4 píxeles, la CNN mantiene 93.3% y la red totalmente conectada cae a 5.1%, que está por debajo del 25% de una suposición al azar: no está adivinando, se equivoca de forma sistemática. Cada uno de sus pesos pertenece a una posición de píxel, así que una forma movida enciende píxeles que significaban otra cosa durante el entrenamiento.

**Aumento de datos.** La misma CNN, desde los mismos pesos iniciales, entrenada con desplazamientos y rotaciones aleatorios:

| Training of the CNN | Centred | Shifted | Rotated |
| --- | ---: | ---: | ---: |
| without augmentation | 99.9% | 93.3% | 62.5% |
| with augmentation | 97.5% | 94.9% | 84.9% |

**Lo que aprendió la primera capa.** Los 8 filtros aprendidos (el gris es 0, el blanco positivo, el negro negativo), una imagen de prueba, y los 8 mapas de activación que produce:

![filters](results/filters.png)

![input](results/input.png)

![activation maps](results/activation-maps.png)

![loss curve](results/loss-curve.svg)

No hay panel (dashboard): las tablas y las imágenes de [`results/`](results/) son el resultado.

## Límites

- El dataset es de juguete: imágenes de 20 x 20, cuatro formas limpias, 1200 imágenes de entrenamiento. La exactitud de aquí no dice nada sobre fotografías.
- La CNN no es perfectamente invariante al desplazamiento: pierde 6.6 puntos con imágenes desplazadas. Los ceros del padding en el borde y la cuadrícula fija de 2 x 2 del pooling hacen que una forma movida produzca números ligeramente distintos.
- La mayor parte de la robustez al desplazamiento viene del global average pooling del final, junto con los pesos compartidos. Durante el desarrollo, una variante que aplanaba los últimos mapas en una capa lineal (un peso por posición) cayó a cerca de 8% con las imágenes desplazadas, como la red totalmente conectada. Esa variante no está en el código ni en los resultados confirmados.
- El aumento de datos no es gratis: la exactitud en imágenes centradas baja de 99.9% a 97.5% y la pérdida de entrenamiento aún sigue bajando tras 20 épocas (0.296), porque la tarea es más difícil y la red y el número de épocas son los mismos. En imágenes rotadas llega a 84.9%, no a 100%.
- Con 8 filtros de 3 x 3 entrenados con pocos datos, los filtros aprendidos son más ruidosos que los detectores de bordes de los libros de texto. Algunos parecen filtros de bordes, otros solo miden brillo.
- Los números son reproducibles en la misma imagen de Docker (semillas fijas, 2 hilos, algoritmos deterministas). Otra CPU u otra versión de PyTorch puede cambiar los últimos decimales, por eso las pruebas usan umbrales y no valores exactos.
- Sin ResNet, transfer learning, detección ni segmentación: la página de documentación dice qué añaden.
