# neural-network-from-scratch

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **qué calcula una neurona y cómo la retropropagación encuentra los gradientes**. Un motor de diferenciación automática escalar se escribe en Python puro, un perceptrón multicapa se construye encima y se entrena con descenso de gradiente, y cada gradiente se comprueba contra uno numérico. La red aprende XOR y un conjunto de datos de dos clases, y la demo escribe la pérdida por época y la frontera de decisión.

Explicación completa: [docs/es/artificial-intelligence/neural-network-from-scratch.md](../../../docs/es/artificial-intelligence/neural-network-from-scratch.md).

## Temas del quiz que demuestra

- `artificial-intelligence` / `neural-networks`: qué calcula una neurona, funciones de activación (tanh, ReLU, sigmoide), capas, contar parámetros, por qué XOR necesita una capa oculta, inicialización aleatoria.
- `artificial-intelligence` / `training`: el gradiente, la actualización `w = w - lr * grad`, la retropropagación como regla de la cadena, gradientes que se acumulan, la comprobación numérica del gradiente, la curva de pérdida.
- `artificial-intelligence` / `supervised-learning`: clasificación, la pérdida, conjunto de entrenamiento frente a conjunto de prueba.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-neural-network-from-scratch.sh        # Linux and macOS
./setup-windows-neural-network-from-scratch.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y ejecuta la demo.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `python/engine.py` | `Value`: un número que recuerda cómo se calculó, y `backward()` |
| `python/nn.py` | `Neuron`, `Layer` y `MLP` construidos sobre `Value` |
| `python/data.py` | XOR y el conjunto de datos de dos lunas generado (conjuntos de entrenamiento y de prueba) |
| `python/train.py` | la pérdida, el bucle de entrenamiento y la exactitud |
| `python/render.py` | la curva de pérdida y la frontera de decisión, como SVG y como texto |
| `python/demo.py` | `python demo.py`: entrena y escribe `results/` |
| `python/test_network.py` | las pruebas |
| `results/` | resultados confirmados (committed): `results.md`, `loss-xor.csv`, `loss-moons.csv`, `loss-curve.svg`, `decision-boundary.txt`, `decision-boundary.svg` |

Solo Python (`python:3.14.8-slim-trixie`), sin dependencias en tiempo de ejecución: ni siquiera NumPy. Cada número de la red es un objeto de Python, lo que es lento y es justo el punto: no se oculta nada.

## Pruebas

```sh
docker compose run --rm python-test
```

Ejecuta `ruff check`, `ruff format --check` y 36 pruebas (cerca de medio minuto, la mayor parte entrenando):

- cada operación del motor, y una red completa, contra el gradiente numérico `(f(x + h) - f(x - h)) / 2h`, dentro de 1e-6;
- XOR aprendido exactamente, y una sola neurona fallando en él;
- al menos 95% de exactitud en puntos de prueba que no se usaron en el entrenamiento.

## Demo

```sh
docker compose run --rm python-demo
```

Imprime [`results/results.md`](results/results.md) y reescribe los archivos de `results/`.

| Problem | Network | Parameters | Result |
| --- | --- | ---: | --- |
| XOR | 2-4-1, tanh | 17 | 4 of 4 right, loss 0.7863 to 0.0244 in 300 epochs |
| Two moons | 2-8-8-1, tanh | 105 | 98.8% on the 80 training points, 99.5% on the 200 test points |

La pérdida por época de la red de dos lunas:

![Loss per epoch](results/loss-curve.svg)

La frontera de decisión, con los puntos de prueba:

![Decision boundary](results/decision-boundary.svg)

No hay panel (dashboard): las figuras son archivos SVG escritos por la demo, sin biblioteca de gráficos.

## Límites

Un objeto de Python por número lo hace miles de veces más lento que una biblioteca real, que guarda capas enteras como arreglos y las ejecuta con código optimizado. La red tiene unos cien parámetros y el conjunto de datos tiene 80 puntos. El miniproyecto [pytorch-basics](../pytorch-basics/) rehace la misma red con PyTorch y compara las dos.
