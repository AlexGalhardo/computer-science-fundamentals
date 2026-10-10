# Fundamentos de TensorFlow y Keras

> English version: [docs/en/artificial-intelligence/tensorflow-keras-basics.md](../../en/artificial-intelligence/tensorflow-keras-basics.md) · Versão em português: [docs/pt/artificial-intelligence/tensorflow-keras-basics.md](../../pt/artificial-intelligence/tensorflow-keras-basics.md)

Miniproyecto MP-AI-7, en [`projects/artificial-intelligence/tensorflow-keras-basics`](../../../projects/artificial-intelligence/tensorflow-keras-basics). Enseña el mismo modelo en otro framework, y lo que oculta una API de alto nivel. La base está en la sección [15](README.md#15-tensorflow-y-keras) de la página del área, y el lado de PyTorch de cada comparación está en [pytorch-basics](pytorch-basics.md) (MP-AI-6).

## El plan

La red es la de [neural-network-from-scratch](neural-network-from-scratch.md) (MP-AI-2): 2 entradas, dos capas ocultas de 8 neuronas con tanh, 1 salida, 105 parámetros. El conjunto de datos también es el mismo: 80 puntos de entrenamiento y 200 puntos de prueba de dos semicírculos entrelazados, hechos por una copia del mismo generador. Solo cambia la herramienta.

1. `model.py`: la red descrita como una lista de capas de Keras.
2. `keras_api.py`: entrenamiento con tres llamadas, `compile`, `fit` y `evaluate`.
3. `tape.py`: el mismo entrenamiento con el paso escrito a mano alrededor de una cinta de gradiente, y luego como un grafo.
4. `side_by_side.py`: cada concepto en PyTorch y en TensorFlow.

## Describir el modelo

```python
model = keras.Sequential(
    [
        keras.Input(shape=(2,)),
        keras.layers.Dense(8, activation="tanh"),
        keras.layers.Dense(8, activation="tanh"),
        keras.layers.Dense(1),
    ]
)
```

`Dense(8)` es una capa totalmente conectada de 8 neuronas. Solo se indica el número de salidas: el número de entradas viene de la capa anterior, empezando en `Input`. La cuenta de parámetros se puede hacer a mano:

```text
first layer    2 x 8 weights + 8 biases = 24
second layer   8 x 8 weights + 8 biases = 72
output layer   8 x 1 weights + 1 bias   =  9
total                                    105
```

Un detalle difiere de PyTorch: Keras guarda los pesos de una capa con forma (entradas, salidas), así que el primer kernel es (2, 8), y PyTorch guarda (salidas, entradas), así que su primer peso es (8, 2). El cálculo es el mismo producto de matrices.

**¿Logit o sigmoide?** La última capa no tiene activación, así que el modelo produce un logit, y la pérdida se crea con `from_logits=True`. La otra forma común de escribirlo es una última capa con `activation="sigmoid"` y la pérdida `"binary_crossentropy"`. Es el mismo modelo: la sigmoide solo pasa de dentro de la pérdida a la última capa. Una prueba comprueba que ambos dan el mismo número, y que ese número es el `log(1 + e^(-s z))` de MP-AI-2. La forma con logit es más segura con números muy grandes o muy pequeños.

Los pesos iniciales siguen la regla de MP-AI-2, uniformes entre -1 y 1, como en la versión de PyTorch.

## Tres llamadas

```python
keras.utils.set_random_seed(7)
model.compile(
    optimizer=keras.optimizers.SGD(learning_rate=0.5),
    loss=keras.losses.BinaryCrossentropy(from_logits=True),
    metrics=[keras.metrics.BinaryAccuracy(threshold=0.0)],
)
history = model.fit(inputs, targets, epochs=120, batch_size=80, shuffle=False, verbose=0)
loss, accuracy = model.evaluate(test_inputs, test_targets, verbose=0)
```

- `compile` no calcula nada. Guarda tres elecciones: cómo actualizar (el optimizador), qué minimizar (la pérdida) y qué más informar (las métricas).
- `fit` es el bucle de entrenamiento. Por defecto corta los datos en mini-batches de 32 puntos y los baraja. Aquí el lote es todo el conjunto de entrenamiento, como en MP-AI-2: una época, una actualización.
- `evaluate` mide sobre datos sin entrenar, y devuelve la pérdida y luego cada métrica.

En estas pocas líneas se ven dos trampas. El `metrics=["accuracy"]` habitual corta la salida en 0.5, lo que es correcto para una probabilidad e incorrecto para un logit: un logit de 0.2 significa clase 1, y 0.2 está por debajo de 0.5. A la métrica se le indica que corte en 0. Y el `batch_size=32` por defecto haría tres actualizaciones por época con 80 puntos, un entrenamiento distinto del que se quiere reproducir.

| Set | Points | Loss | Accuracy |
| --- | ---: | ---: | ---: |
| Training | 80 | 0.0839 | 97.5% |
| Test (never used in training) | 200 | 0.0710 | 98.5% |

| Epoch | Loss |
| ---: | ---: |
| 1 | 0.6567 |
| 10 | 0.2980 |
| 50 | 0.2222 |
| 100 | 0.1132 |
| 120 | 0.0850 |

En ninguna parte de este código hay un gradiente ni una actualización. Ocurrieron dentro de `fit`.

## Gradientes con una cinta

TensorFlow registra las operaciones solo dentro de un bloque `tf.GradientTape`, y luego se le pide a la cinta una pendiente:

```python
x = tf.Variable(3.0)
with tf.GradientTape() as tape:
    y = x * x
tape.gradient(y, x)  # 6.0, because dy/dx = 2x
```

El ejemplo de MP-AI-2, `f = (x + y) * z` en x = 2, y = 1, z = 4, se puede hacer primero a mano: `df/dx = z = 4`, `df/dy = z = 4`, `df/dz = x + y = 3`. La cinta devuelve 4, 4 y 3.

Tres reglas que difieren de PyTorch:

- Un `tf.Tensor` no se puede cambiar. Lo que cambia el entrenamiento es una `tf.Variable`, y las variables las vigila la cinta automáticamente. Una constante no: su gradiente vuelve como `None`, sin ningún error, a menos que se llame a `tape.watch(x)`. La demo muestra `None` y luego 6.
- Una cinta responde a una sola llamada de `gradient` y luego se libera. Una segunda llamada lanza un error, a menos que la cinta se haya creado con `persistent=True`.
- Nada se acumula. La cinta devuelve gradientes nuevos cada vez, así que no hay `zero_grad`.

## El paso que fit oculta

```python
optimizer = keras.optimizers.SGD(learning_rate=0.5)
loss_fn = keras.losses.BinaryCrossentropy(from_logits=True)

for epoch in range(120):
    with tf.GradientTape() as tape:
        logits = model(inputs, training=True)  # 1. forward
        loss = loss_fn(targets, logits)  # 2. loss
    gradients = tape.gradient(loss, model.trainable_variables)  # 3 and 4. gradients
    optimizer.apply_gradients(zip(gradients, model.trainable_variables))  # 5. update
```

Este es el bucle de la versión de PyTorch dicho con otras palabras. Con la misma semilla parte de los mismos pesos que la ejecución con `fit`, y da los mismos números:

| How it was trained | First loss | Last loss | Training accuracy | Test accuracy | Python ran the step |
| --- | ---: | ---: | ---: | ---: | ---: |
| `model.fit` | 0.6567 | 0.0850 | 97.5% | 98.5% | hidden |
| Gradient tape, eager | 0.6567 | 0.0850 | 97.5% | 98.5% | 120 |
| Gradient tape inside `tf.function` | 0.6567 | 0.0850 | 97.5% | 98.5% | 1 |

En cada una de las 120 épocas las pérdidas difieren en menos de 0.0001. Así que `fit` no es un algoritmo distinto: es este bucle, ya escrito.

![Loss per epoch](../../../projects/artificial-intelligence/tensorflow-keras-basics/results/loss-curve.svg)

La figura tiene dos curvas, `fit` y el bucle con cinta, y quedan una encima de la otra.

## Eager frente a grafo

La última columna de la tabla cuenta cuántas veces Python ejecutó realmente el cuerpo del paso. Ejecutado normalmente (**ejecución eager**, o ansiosa), cada línea corre en cada paso: 120 veces. Envuelto en `tf.function`, la primera llamada ejecuta el código Python una vez para registrar las operaciones en un **grafo** (esto se llama tracing, o trazado), y las otras 119 llamadas ejecutan el grafo sin pasar por Python: el contador se queda en 1.

Eso explica una sorpresa clásica: un `print` o cualquier otro código Python común dentro de una `tf.function` corre solo durante el trazado. Una prueba también muestra cuándo ocurre un nuevo trazado: llamar al paso con un lote de otra forma (10 puntos en lugar de 80) registra un segundo grafo.

## PyTorch y TensorFlow lado a lado

| Concept | PyTorch | TensorFlow and Keras |
| --- | --- | --- |
| Tensor | `torch.Tensor`: `torch.tensor(points)` | `tf.Tensor` (cannot be changed): `tf.constant(points)`. Parameters are `tf.Variable` |
| Gradient | `requires_grad=True`, `loss.backward()`, read `.grad` | `with tf.GradientTape() as tape:`, then `tape.gradient(loss, variables)` |
| Layer | `nn.Linear(2, 8)` followed by `torch.tanh` | `keras.layers.Dense(8, activation="tanh")` |
| Model | a class that inherits from `nn.Module`, with `forward` | `keras.Sequential([...])` |
| Loss on a logit | `nn.BCEWithLogitsLoss()` | `keras.losses.BinaryCrossentropy(from_logits=True)` |
| Optimiser | `torch.optim.SGD(model.parameters(), lr=0.5)`, `zero_grad()` and `step()` | `keras.optimizers.SGD(learning_rate=0.5)`, `apply_gradients(zip(grads, variables))` |
| Training loop | written by hand: forward, loss, `zero_grad`, `backward`, `step` | `model.compile(...)` and `model.fit(...)`, or by hand with a tape |
| Measuring | `model.eval()` and `with torch.no_grad():` | `model.evaluate(...)`, or `model(inputs, training=False)` |
| Execution | eager: the graph is rebuilt at every forward pass | eager by default, a recorded graph with `@tf.function` |
| **Measured accuracy, 80 training points** | **97.5%** | **97.5%** (`fit`) |
| **Measured accuracy, 200 test points** | **98.0%** | **98.5%** (`fit`), **98.5%** (gradient tape) |

Las exactitudes de PyTorch vienen de los resultados confirmados de [pytorch-basics](pytorch-basics.md) (`projects/artificial-intelligence/pytorch-basics/results/results.md`, primera fila de la tabla de entrenamiento). Este proyecto no contiene PyTorch. Ambas ejecuciones usan el mismo conjunto de datos, red, regla inicial, número de semilla, tasa de aprendizaje y número de épocas. No parten de los mismos pesos aleatorios, porque cada framework tiene su propio generador aleatorio, así que las exactitudes son cercanas y no iguales: 196 frente a 197 de los 200 puntos de prueba. Como referencia, el propio MP-AI-2 alcanzó 99.5% desde sus propios pesos iniciales.

La tabla es la lección: cada fila es una idea con dos grafías. Quien entiende los cinco pasos del bucle puede leer cualquiera de los dos frameworks.

## Qué añade un sistema real

- **Conjuntos de datos que no caben en memoria**, leídos en mini-batches por `tf.data` y barajados en cada época.
- **Callbacks** en `fit`: detenerse antes cuando la pérdida de validación deja de mejorar, guardar el mejor modelo, registrar curvas.
- **Guardar y desplegar.** Un grafo registrado por `tf.function` se puede guardar y ejecutar donde no hay Python, como un teléfono o un servidor en otro lenguaje.
- **Entrenamiento personalizado.** Cuando un solo `fit` no basta (dos redes que se entrenan una contra otra, por ejemplo), el paso se escribe con una cinta, como aquí.

## Ejecútalo

```sh
cd projects/artificial-intelligence/tensorflow-keras-basics
./setup-unix-tensorflow-keras-basics.sh
```

En Windows, `./setup-windows-tensorflow-keras-basics.ps1`. Solo la demo: `docker compose run --rm python-demo`. La imagen usa Python 3.13 porque TensorFlow 2.21.0 no tiene paquete para Python 3.14, e instala Keras 3.15.1 y NumPy 2.5.3. Las líneas sobre CUDA que imprime TensorFlow solo dicen que no se encontró ninguna GPU.
