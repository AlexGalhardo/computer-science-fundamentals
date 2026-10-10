# Fundamentos de PyTorch

> English version: [docs/en/artificial-intelligence/pytorch-basics.md](../../en/artificial-intelligence/pytorch-basics.md) · Versão em português: [docs/pt/artificial-intelligence/pytorch-basics.md](../../pt/artificial-intelligence/pytorch-basics.md)

Miniproyecto MP-AI-6, en [`projects/artificial-intelligence/pytorch-basics`](../../../projects/artificial-intelligence/pytorch-basics). Enseña qué hace por ti un framework de deep learning, rehaciendo [neural-network-from-scratch](neural-network-from-scratch.md) (MP-AI-2) con PyTorch. La base está en la sección [14](README.md#14-qué-te-da-un-framework-pytorch) de la página del área.

## El plan

MP-AI-2 escribió tres cosas a mano: un número que recuerda cómo se calculó (`Value`), una red hecha de esos números, y un bucle de entrenamiento. Un framework trae listo el primero, da bloques de construcción para el segundo y deja el tercero en tus manos. Este proyecto hace el mismo trabajo de nuevo y comprueba, número por número, que no cambió nada excepto quién escribió el código.

1. `tensors.py`: qué es un tensor, y diferenciación automática en ejemplos pequeños.
2. `gradients.py`: la misma red en ambas versiones, y sus gradientes calculados de tres maneras.
3. `model.py` y `train.py`: la red como un `nn.Module` y el bucle de entrenamiento escrito a mano.
4. `versus.py`: líneas de código y tiempo de entrenamiento de las dos versiones.

Los archivos de MP-AI-2 se copian en `python/scratch/`, porque un miniproyecto nunca importa otro.

## Un tensor es un arreglo con una forma

En MP-AI-2 una capa era una lista de objetos `Neuron`, y cada neurona tenía una lista de pesos. En PyTorch una capa entera es un **tensor**: un bloque de números con una `shape` (forma) y un `dtype` (el tipo de número, floats de 32 bits por defecto).

Existen dos multiplicaciones, y confundirlas es el bug más común:

```text
a = [[1, 2],      b = [[5, 6],
     [3, 4]]           [7, 8]]

a * b = [[ 5, 12],     position by position
         [21, 32]]

a @ b = [[19, 22],     matrix product: row of a times column of b
         [43, 50]]     19 = 1 x 5 + 2 x 7
```

Una capa totalmente conectada es un producto de matrices. `nn.Linear(2, 8)` es dueña de una matriz de pesos de forma (8, 2), una fila por neurona, y de un sesgo (bias) de forma (8,). Para un lote de N puntos, forma (N, 2):

```text
output = inputs @ weight.T + bias
         (N, 2)   (2, 8)     (8,)     ->   (N, 8)
```

El sesgo tiene 8 números y el producto tiene N filas de 8. PyTorch repite el sesgo en cada fila. Esta repetición automática del tensor más pequeño se llama **broadcasting**. A lo largo de toda la red las formas van (N, 2), (N, 8), (N, 8), (N, 1): todos los puntos se calculan a la vez, sin bucle de Python sobre puntos ni neuronas. De ahí viene la velocidad.

## Diferenciación automática

Un tensor creado con `requires_grad=True` está vigilado: PyTorch registra cada operación hecha con él. `backward()` recorre ese registro desde el resultado hasta las entradas y deja cada pendiente en `.grad`. Es el `backward()` de la clase `Value`, para arreglos enteros.

```python
x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(1.0, requires_grad=True)
z = torch.tensor(4.0, requires_grad=True)
f = (x + y) * z  # 12
f.backward()
# x.grad = 4, y.grad = 4, z.grad = 3
```

Estos son los números que MP-AI-2 encontró para la misma expresión. Un detalle también es el mismo: **los gradientes se acumulan**. Para `x * x` con x = 3 el gradiente es 6. Un segundo `backward()` deja 12 en `x.grad`, no 6, y solo `zero_()` lo devuelve a 0. Por eso todo bucle de entrenamiento limpia los gradientes en cada paso.

## La misma red, tres gradientes

Esta es la comprobación central del proyecto. La red 2-8-8-1 de MP-AI-2 se crea con su semilla 7, y cada uno de sus 105 pesos se copia en un modelo de PyTorch (en floats de 64 bits, la precisión de los números de Python). Ambas versiones calculan la pérdida sobre los 80 puntos de entrenamiento y ejecutan la retropropagación. Un tercer gradiente viene de la definición de pendiente, sin ningún cálculo:

```text
numerical gradient = (loss(w + h) - loss(w - h)) / 2h        with h = 0.000001
```

| | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Loss | 0.4576158373 | 0.4576158373 |

| Parameter | Hand-written backpropagation | PyTorch `backward()` | Numerical |
| --- | ---: | ---: | ---: |
| `hidden1` `w[0][0]` | -0.060789 | -0.060789 | -0.060789 |
| `hidden1` `w[0][1]` | 0.012666 | 0.012666 | 0.012666 |
| `hidden1` b[0] | -0.049645 | -0.049645 | -0.049645 |
| `hidden1` `w[1][0]` | -0.133021 | -0.133021 | -0.133021 |
| `hidden1` `w[1][1]` | 0.010081 | 0.010081 | 0.010081 |
| `hidden1` b[1] | -0.105778 | -0.105778 | -0.105778 |

Sobre los 105 gradientes, PyTorch y la retropropagación escrita a mano difieren en menos de 1e-12, y PyTorch y el gradiente numérico en menos de 1e-8. Los dos primeros son el mismo algoritmo, así que coinciden hasta los últimos dígitos. El numérico es una aproximación, así que coincide un poco menos. Un error de signo en un solo peso aparecería como una diferencia miles de veces por encima de la tolerancia, y una prueba también comprueba eso.

## El modelo y los cinco pasos

```python
class MoonsNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.hidden1 = nn.Linear(2, 8)
        self.hidden2 = nn.Linear(8, 8)
        self.output = nn.Linear(8, 1)

    def forward(self, inputs):
        hidden = torch.tanh(self.hidden1(inputs))
        hidden = torch.tanh(self.hidden2(hidden))
        return self.output(hidden)  # a logit, no sigmoid
```

Asignar una capa a `self` la registra, así que `model.parameters()` encuentra los 105 números por sí solo. El bucle se escribe a mano, y es el bucle de MP-AI-2 con una línea más:

```python
loss_fn = nn.BCEWithLogitsLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.5)

for epoch in range(120):
    logits = model(inputs)  # 1. forward
    loss = loss_fn(logits, targets)  # 2. loss
    optimizer.zero_grad()  # 3. clear the old gradients
    loss.backward()  # 4. backward
    optimizer.step()  # 5. update every parameter
```

`BCEWithLogitsLoss` es la pérdida de MP-AI-2 con otro nombre. Para un logit z calcula `log(1 + e^(-z))` cuando la etiqueta es 1 y `log(1 + e^z)` cuando es 0, que es el `log(1 + e^(-s z))` escrito allí a mano, promediado sobre el lote. Recibe el logit, no la probabilidad: calcular sigmoide y logaritmo en una sola fórmula evita `log(0)`. `optimizer.step()` es `w = w - lr * grad` para cada parámetro, y una prueba lo comprueba tras un paso.

Medir usa dos interruptores que a menudo se confunden:

```python
model.eval()  # tells the layers they are not training (dropout and similar)
with torch.no_grad():  # stops recording operations: no graph, less memory
    predictions = model(test_inputs) > 0
```

`eval()` no detiene los gradientes, y `no_grad()` no cambia el comportamiento de las capas. Una prueba muestra ambos hechos. La respuesta es la clase 1 cuando el logit es positivo, porque `sigmoid(z) > 0.5` exactamente cuando `z > 0`.

## Resultados

Red 2-8-8-1 con tanh, 120 épocas de descenso de gradiente con lote completo y tasa de aprendizaje 0.5, sobre los 80 puntos de entrenamiento de MP-AI-2. La exactitud se mide en sus 200 puntos de prueba.

| Starting weights | Epochs | First loss | Last loss | Training accuracy | Test accuracy |
| --- | ---: | ---: | ---: | ---: | ---: |
| The rule of MP-AI-2, drawn by PyTorch (`torch.manual_seed(7)`) | 120 | 0.7541 | 0.1057 | 97.5% | 98.0% |
| Copied from MP-AI-2 (its seed 7), 64-bit floats | 120 | 0.4576 | 0.0604 | 98.8% | 99.5% |
| The default of `nn.Linear` | 120 | 0.7011 | 0.2405 | 87.5% | 92.5% |
| The default of `nn.Linear` | 300 | 0.7011 | 0.0182 | 100.0% | 99.5% |

En esta tabla se pueden leer tres cosas.

- **La primera fila** es la ejecución del criterio de aceptación: una semilla fija y 98.0% en los puntos de prueba. Usa la regla inicial de MP-AI-2 (pesos uniformes entre -1 y 1, sesgos en cero), con números sorteados por el propio generador de PyTorch.
- **La segunda fila** parte de los mismos pesos de MP-AI-2 y da exactamente su resultado publicado: pérdida de 0.4576 a 0.0604, 98.8% y 99.5%. Mismos pesos, misma aritmética, misma respuesta. Durante las primeras 20 épocas las dos curvas de pérdida difieren en menos de 1e-9.
- **Las dos últimas filas** muestran que los pesos iniciales importan. `nn.Linear` empieza con pesos menores (entre -1/sqrt(entradas) y 1/sqrt(entradas)), una elección que mantiene estables las redes profundas. Esta red diminuta aprende entonces más despacio: 92.5% tras 120 épocas, 99.5% tras 300.

![Loss per epoch](../../../projects/artificial-intelligence/pytorch-basics/results/loss-curve.svg)

## Desde cero frente al framework

El trabajo es el mismo en ambas versiones y corre dentro del mismo contenedor: construir la red y entrenarla durante 20 épocas con los 80 puntos de entrenamiento. Cinco ejecuciones cada una, tras una ejecución de PyTorch descartada. Las líneas de código son las líneas que contienen código, sin líneas en blanco, comentarios ni docstrings.

| Version | Lines of code | Median of 5 runs | Fastest | Slowest | Per epoch |
| --- | ---: | ---: | ---: | ---: | ---: |
| From scratch (MP-AI-2) | 198 | 8.121 s | 7.679 s | 8.464 s | 406.04 ms |
| PyTorch (this version) | 78 | 0.027 s | 0.021 s | 0.065 s | 1.37 ms |

| Part | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Automatic differentiation | 102 | 0 |
| Network | 45 | 19 |
| Loss, training loop and accuracy | 51 | 59 |
| **Total** | **198** | **78** |

Máquina: AMD Ryzen 7 5700X3D, 16 núcleos lógicos vistos por el contenedor, PyTorch limitado a 2 hilos, Linux bajo WSL2, imagen `python:3.14.8-slim-trixie`, Python 3.14.8, PyTorch 2.14.1+cpu. Son tiempos de reloj: cambian de una máquina a otra y de una ejecución a otra (la máquina estaba ocupada con otros contenedores, y otra ejecución dio 6.4 s frente a 0.010 s). Lo que se mantiene es el orden de magnitud: cientos de veces.

Dos lecturas de la tabla:

- Toda la diferencia en líneas es la diferenciación automática. El bucle de entrenamiento no es más corto con PyTorch, y ese es el punto de este proyecto: el framework no oculta el bucle, oculta los gradientes.
- La velocidad no viene de un algoritmo más astuto. La versión desde cero crea un objeto de Python por cada suma y multiplicación de cada punto. PyTorch hace un producto de matrices por capa para todos los puntos, en código compilado.

## Qué añade un sistema real

- **Una GPU.** `model.to("cuda")` lleva el mismo código a una tarjeta gráfica. Nada de esto la necesita.
- **Mini-batches.** Los conjuntos de datos reales no caben en un solo lote, así que cada paso usa una pequeña parte aleatoria de los datos, servida por un `DataLoader`.
- **Mejores optimizadores** como Adam, más tipos de capa (convoluciones, atención, normalización) y formas de guardar y cargar un modelo entrenado.
- **Más cuidado con la aleatoriedad.** Una semilla fija da los mismos números en la misma máquina y versión. Entre CPUs y versiones los últimos dígitos pueden diferir.

El miniproyecto [tensorflow-keras-basics](tensorflow-keras-basics.md) entrena esta misma red con el otro gran framework, donde el bucle puede ocultarse tras una sola llamada.

## Ejecútalo

```sh
cd projects/artificial-intelligence/pytorch-basics
./setup-unix-pytorch-basics.sh
```

En Windows, `./setup-windows-pytorch-basics.ps1`. Solo la demo: `docker compose run --rm python-demo`.
