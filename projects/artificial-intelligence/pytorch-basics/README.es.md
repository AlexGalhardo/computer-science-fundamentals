# pytorch-basics

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **qué hace por ti un framework de deep learning**, rehaciendo el miniproyecto [neural-network-from-scratch](../neural-network-from-scratch/) (MP-AI-2) con PyTorch. La misma red 2-8-8-1 se construye en ambos, y los gradientes que calcula PyTorch se comparan con la retropropagación escrita a mano y con gradientes numéricos. Después el bucle de entrenamiento se escribe a mano (forward, pérdida, limpiar, backward, step) sobre el mismo conjunto de datos, y una tabla compara líneas de código y tiempo de entrenamiento de las dos versiones.

Explicación completa: [docs/es/artificial-intelligence/pytorch-basics.md](../../../docs/es/artificial-intelligence/pytorch-basics.md).

## Temas del quiz que demuestra

- `artificial-intelligence` / `pytorch`: tensores (forma, dtype), `requires_grad`, `backward()` y `.grad`, gradientes que se acumulan y `zero_grad`, `nn.Module` y `nn.Linear`, el optimizador, los cinco pasos del bucle de entrenamiento, `torch.no_grad()` frente a `model.eval()`.
- `artificial-intelligence` / `training`: la comprobación numérica del gradiente, descenso de gradiente con el lote completo, la curva de pérdida, por qué importan los pesos iniciales.
- `artificial-intelligence` / `linear-algebra`: una capa lineal aplicada a un lote entero como un solo producto de matrices, y las formas en el camino: (N, 2) a (N, 8) a (N, 8) a (N, 1).

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-pytorch-basics.sh        # Linux and macOS
./setup-windows-pytorch-basics.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y ejecuta la demo. La primera construcción descarga el wheel de PyTorch solo para CPU (unos cientos de megabytes). Después de eso nada usa la red: ambos servicios corren con `network_mode: "none"`.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `python/model.py` | `MoonsNet`: la red 2-8-8-1 como un `nn.Module` |
| `python/train.py` | el bucle de entrenamiento escrito a mano, la exactitud, `train_moons()` |
| `python/tensors.py` | ejemplos pequeños: `*` frente a `@`, una capa lineal a mano, `backward`, acumulación |
| `python/gradients.py` | copia los pesos de la red desde cero en PyTorch y calcula los gradientes de tres maneras |
| `python/versus.py` | cuenta líneas de código, mide el tiempo de ambas versiones, registra la máquina |
| `python/render.py` | el gráfico de pérdida como SVG |
| `python/demo.py` | `python demo.py`: ejecuta todo y escribe `results/` |
| `python/test_pytorch_basics.py` | las pruebas |
| `python/scratch/` | una **copia** de MP-AI-2 (`engine.py`, `nn.py`, `data.py`, `train.py`) |
| `results/` | resultados confirmados (committed): `results.md`, `timing.md`, `loss.csv`, `loss-curve.svg` |

Un miniproyecto nunca importa otro, así que los archivos de MP-AI-2 que hacen falta se copiaron en `python/scratch/`. `data.py` y `engine.py` son idénticos a los originales. En `nn.py` y `train.py` solo cambiaron las líneas de importación. Por lo tanto el conjunto de datos es literalmente el mismo, y una prueba fija algunos de sus puntos.

Solo Python: `python:3.14.8-slim-trixie` con `torch==2.14.1` (wheel para CPU) y `numpy==2.5.3`. PyTorch corre en la CPU con 2 hilos.

## Pruebas

```sh
docker compose run --rm python-test
```

Ejecuta `ruff check`, `ruff format --check` y 32 pruebas (unos 10 segundos):

- **MP-AI-6.1** tensores (formas, `*` frente a `@`, broadcasting, una capa lineal como producto de matrices) y diferenciación automática (`requires_grad`, acumulación, `zero_grad`, `no_grad` frente a `eval`). Los pesos de la red desde cero se copian en PyTorch, y los 105 gradientes de la pérdida sobre los 80 puntos de entrenamiento coinciden con la retropropagación escrita a mano dentro de 1e-10 y con el gradiente numérico dentro de 1e-6.
- **MP-AI-6.2** el bucle escrito a mano alcanza al menos 95% en los 200 puntos de prueba con una semilla fija, la misma semilla da el mismo entrenamiento, `BCEWithLogitsLoss` es igual a la pérdida escrita a mano en MP-AI-2, y un paso del optimizador es `w - lr * grad`. Partiendo de los pesos de MP-AI-2, PyTorch sigue su curva de pérdida dentro de 1e-9.
- **MP-AI-6.3** el contador de líneas ignora las líneas en blanco, los comentarios y los docstrings, y la tabla de tiempos tiene ambas versiones, números positivos y la máquina. Ninguna prueba afirma sobre un tiempo absoluto.

## Demo

```sh
docker compose run --rm python-demo
```

Imprime y reescribe [`results/results.md`](results/results.md) y [`results/timing.md`](results/timing.md), además de `loss.csv` y `loss-curve.svg`. Tarda menos de un minuto, casi todo en la versión desde cero.

Los gradientes, de tres maneras, sobre la misma red (primeras filas, se comparan los 105):

| Parameter | Hand-written backpropagation | PyTorch `backward()` | Numerical |
| --- | ---: | ---: | ---: |
| `hidden1` `w[0][0]` | -0.060789 | -0.060789 | -0.060789 |
| `hidden1` `w[0][1]` | 0.012666 | 0.012666 | 0.012666 |
| `hidden1` b[0] | -0.049645 | -0.049645 | -0.049645 |

La mayor diferencia entre PyTorch y la retropropagación escrita a mano es inferior a 1e-12, y entre PyTorch y el gradiente numérico inferior a 1e-8.

Entrenamiento, 2-8-8-1 con tanh, SGD con tasa de aprendizaje 0.5, lote completo:

| Starting weights | Epochs | First loss | Last loss | Training accuracy | Test accuracy |
| --- | ---: | ---: | ---: | ---: | ---: |
| The rule of MP-AI-2, drawn by PyTorch (`torch.manual_seed(7)`) | 120 | 0.7541 | 0.1057 | 97.5% | 98.0% |
| Copied from MP-AI-2 (its seed 7), 64-bit floats | 120 | 0.4576 | 0.0604 | 98.8% | 99.5% |
| The default of `nn.Linear` | 120 | 0.7011 | 0.2405 | 87.5% | 92.5% |
| The default of `nn.Linear` | 300 | 0.7011 | 0.0182 | 100.0% | 99.5% |

La primera fila es la ejecución del criterio de aceptación: **98.0% en los 200 puntos de prueba**. La segunda fila es exactamente el resultado de MP-AI-2, porque parte de los mismos pesos y hace la misma aritmética.

![Loss per epoch](results/loss-curve.svg)

Desde cero frente al framework ([`results/timing.md`](results/timing.md)). El trabajo es el mismo en ambos: construir la red y entrenarla durante 20 épocas con los 80 puntos de entrenamiento, 5 ejecuciones cada uno.

| Version | Lines of code | Median of 5 runs | Fastest | Slowest | Per epoch |
| --- | ---: | ---: | ---: | ---: | ---: |
| From scratch (MP-AI-2) | 198 | 8.121 s | 7.679 s | 8.464 s | 406.04 ms |
| PyTorch (this version) | 78 | 0.027 s | 0.021 s | 0.065 s | 1.37 ms |

| Part | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Automatic differentiation | 102 (`scratch/engine.py`) | 0 (none: the framework brings it) |
| Network | 45 (`scratch/nn.py`) | 19 (`model.py`) |
| Loss, training loop and accuracy | 51 (`scratch/train.py`) | 59 (`train.py`) |
| **Total** | **198** | **78** |

Las líneas de código son las líneas que contienen código: las líneas en blanco, las líneas de comentario y los docstrings no se cuentan (`count_code_lines` en `python/versus.py`).

Máquina de esa ejecución: AMD Ryzen 7 5700X3D (16 núcleos lógicos vistos por el contenedor, PyTorch limitado a 2 hilos), Linux 6.18 bajo WSL2, imagen `python:3.14.8-slim-trixie`, Python 3.14.8, PyTorch 2.14.1+cpu. **Los tiempos cambian de una máquina a otra y de una ejecución a otra**: había otros contenedores corriendo en esta máquina durante la medición, y otra ejecución en ella dio 6.4 s frente a 0.010 s. El orden de magnitud (cientos de veces) es el resultado, no la proporción exacta. Todos los demás números de `results/` son deterministas.

No hay panel (dashboard): la figura es un archivo SVG escrito por la demo, sin biblioteca de gráficos.

## Límites

- La red tiene 105 parámetros y el conjunto de datos 80 puntos. A este tamaño PyTorch gasta la mayor parte de su tiempo en la sobrecarga de cada llamada, no en aritmética, así que la brecha con la versión desde cero sería mucho mayor en un modelo real. Nada aquí usa una GPU.
- El conteo de líneas compara lo que hubo que escribir, no el tamaño del software: PyTorch en sí son cientos de miles de líneas. El `train.py` desde cero también contiene la ejecución de XOR de MP-AI-2, que son unas pocas de sus 51 líneas.
- La ejecución del criterio no parte de los mismos números aleatorios que MP-AI-2, solo de la misma regla (pesos uniformes en (-1, 1), sesgos en cero): PyTorch y Python tienen generadores aleatorios distintos. La fila "Copied from MP-AI-2" es la que parte de pesos idénticos.
- Con los pesos iniciales por defecto de `nn.Linear`, 120 épocas alcanzan solo 92.5% en los puntos de prueba. Es el mismo modelo aprendiendo más despacio, y 300 épocas alcanzan 99.5%.
- El entrenamiento usa floats de 32 bits, el valor por defecto de PyTorch. Las pérdidas se redondean a 4 decimales en `results/`, lo que es estable en esta máquina. Otra CPU puede diferir en el último dígito.

El miniproyecto [tensorflow-keras-basics](../tensorflow-keras-basics/) entrena la misma red con TensorFlow y Keras y pone los dos frameworks lado a lado.
