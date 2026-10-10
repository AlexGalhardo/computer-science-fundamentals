# diffusion-toy

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **cómo un modelo de imágenes aprende a quitar ruido**, con puntos bidimensionales en lugar de píxeles. La "imagen" es un punto sobre un anillo. Un proceso directo (forward) añade ruido gaussiano paso a paso hasta que el anillo se vuelve ruido puro, una red pequeña escrita a mano con NumPy (sin framework de deep learning) aprende a predecir el ruido que se añadió, y la generación parte de ruido puro y le quita un poco 100 veces, hasta que los puntos vuelven al anillo. Es el método de "Denoising Diffusion Probabilistic Models" (Ho, Jain y Abbeel, 2020) reducido hasta poder graficar cada paso.

Explicación completa: [docs/es/artificial-intelligence/diffusion-toy.md](../../../docs/es/artificial-intelligence/diffusion-toy.md).

## Temas del quiz que demuestra

- `artificial-intelligence` / `image-generation`: el proceso directo (ruido añadido paso a paso, y el atajo a cualquier paso), el objetivo del entrenamiento (predecir el ruido), la generación paso a paso desde ruido puro, por qué un modelo de difusión es más lento que un modelo que responde en una sola pasada (una llamada a la red por paso).
- `artificial-intelligence` / `probability-statistics`: la distribución gaussiana, media y varianza, por qué la suma de ruidos gaussianos es gaussiana, cómo comprobar que una muestra parece gaussiana.
- `artificial-intelligence` / `training`: la pérdida de error cuadrático medio, la retropropagación escrita a mano, el optimizador Adam, la comprobación numérica del gradiente.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-diffusion-toy.sh        # Linux and macOS
./setup-windows-diffusion-toy.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y ejecuta la demo, que reescribe `results/`.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `python/diffusion.py` | todo lo que es la lección: el anillo, el calendario de ruido, el proceso directo (paso a paso y atajo), la red, la retropropagación, Adam, el entrenamiento, el proceso inverso, y las mediciones (distancia al anillo, porciones, comprobaciones gaussianas) |
| `python/svg.py` | los diagramas de dispersión y el gráfico de líneas, escritos como texto SVG |
| `python/demo.py` | entrena, ejecuta ambos procesos y escribe `results/` |
| `python/test_diffusion.py` | las pruebas, una o más por criterio de aceptación |
| `results/forward.svg`, `results/reverse.svg` | los puntos en los pasos 0, 10, 25, 50, 75 y 100 de cada proceso |
| `results/loss.svg` | la pérdida de entrenamiento |
| `results/results.md` | cada número citado abajo |

Un solo lenguaje, Python (`python:3.14.8-slim-trixie`), con una dependencia en tiempo de ejecución, `numpy==2.5.3`, usada solo para arreglos y productos de matrices. No hay PyTorch ni TensorFlow: la red, su pasada hacia atrás y el optimizador son una pequeña parte de `diffusion.py`. No se importa código de otro miniproyecto.

## Pruebas

```sh
docker compose run --rm python-test
```

Ejecuta `ruff check`, `ruff format --check` y 12 pruebas (unos 15 segundos, la mayor parte del único entrenamiento que comparten las pruebas).

| Criterion | Test | What it proves |
| --- | --- | --- |
| MP-AI-5.1 | `test_last_forward_step_is_indistinguishable_from_gaussian_noise` | 20000 puntos con ruido añadido paso a paso pasan 7 comprobaciones contra una normal estándar, mientras el anillo limpio y el paso 25 no las pasan |
| MP-AI-5.1 | `test_step_by_step_agrees_with_the_shortcut` | recorrer los pasos y saltar con la fórmula cerrada dan las mismas estadísticas |
| MP-AI-5.2 | `test_generated_points_land_on_the_ring` | distancia media de 2000 puntos generados al anillo por debajo de **0.10** |
| MP-AI-5.2 | `test_generated_points_cover_the_whole_ring` | cada una de las 12 porciones del anillo contiene entre 50% y 150% de una parte equitativa |
| MP-AI-5.3 | `test_demo_writes_the_points_of_several_reverse_steps` | la demo escribe los cuatro archivos de resultados, con 6 paneles de 300 puntos |
| (support) | `test_backpropagation_matches_numerical_gradient` | los gradientes escritos a mano son iguales a las diferencias centradas, para los 195 pesos de una red pequeña |

## Demo

```sh
docker compose run --rm python-demo    # writes results/
```

El proceso inverso, desde ruido puro (izquierda) hasta los puntos generados (derecha). El círculo punteado es el objetivo:

![reverse process](results/reverse.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0.535 | 1.244 | 0.647 | 0.967 | 0.995 |
| 75 | 0.543 | 1.252 | 0.654 | 0.971 | 1.023 |
| 50 | 0.509 | 1.206 | 0.622 | 0.936 | 0.905 |
| 25 | 0.449 | 1.099 | 0.556 | 0.772 | 0.744 |
| 10 | 0.256 | 0.992 | 0.320 | 0.552 | 0.534 |
| 0 | 0.047 | 0.987 | 0.066 | 0.496 | 0.482 |

Lo que da sentido al número 0.047:

| Points | Mean distance to the ring |
| --- | ---: |
| Real data (the training set) | 0.024 |
| Generated (step 0 of the reverse process) | 0.047 |
| Pure noise (step 100, where generation starts) | 0.535 |
| Threshold of the test | 0.10 |

El umbral 0.10 es aproximadamente el doble del valor medido y menos de una quinta parte de la distancia del ruido puro. Las 12 porciones del anillo están pobladas (de 137 a 182 puntos cada una, 167 si fuera perfectamente equitativo), así que el modelo no colapsó en un solo lugar.

El proceso directo, desde el anillo (izquierda) hasta el ruido (derecha):

![forward process](results/forward.svg)

En el paso 100 los 20000 puntos pasan todas las comprobaciones contra una normal estándar (media, varianza, correlaciones, proporciones dentro de 1 y 2 desviaciones estándar, estadístico de Kolmogorov-Smirnov 0.0038 y 0.0113 frente a una tolerancia de 0.0138). La señal que queda es sqrt(alpha_bar_100) = 0.0045 del punto original.

La pérdida de entrenamiento baja de 0.2465 (primeras 200 iteraciones) a 0.1702 (últimas 200):

![training loss](results/loss.svg)

No hay panel (dashboard): las tres figuras y las tablas de [`results/results.md`](results/results.md) son el resultado.

## Límites

- "Indistinguible del ruido gaussiano" significa que las siete comprobaciones no pueden distinguir los dos con 20000 puntos. El punto original sigue ahí, multiplicado por 0.0045. Verlo requeriría una muestra del orden de un millón de puntos.
- El anillo generado es aproximadamente el doble de grueso que el real (dispersión del radio 0.066 frente a 0.030). Eso viene del error de una red pequeña entrenada durante unos segundos y de los pasos gruesos (100 en lugar de 1000). La demo no separa las dos causas.
- La pérdida no llega a cero y nunca podría: el mismo punto ruidoso puede venir de muchos pares distintos de punto limpio y ruido, así que la mejor respuesta posible es un promedio.
- Una forma, sin condición: el modelo siempre dibuja el anillo. No hay prompt de texto, ni U-Net, ni espacio latente, ni ninguno de los muestreadores más rápidos. La página de documentación dice qué añade cada uno.
- Todas las semillas están fijadas y los números los escribió la demo de Docker. En otro procesador el último decimal de un número redondeado puede diferir, por eso las pruebas usan umbrales y no valores exactos.
