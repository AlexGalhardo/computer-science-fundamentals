# tensorflow-keras-basics

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **el mismo modelo en otro framework, y lo que oculta una API de alto nivel**. La red 2-8-8-1 de [neural-network-from-scratch](../neural-network-from-scratch/) (MP-AI-2) se describe con Keras y se entrena sobre el mismo conjunto de datos de tres maneras: con `compile`, `fit` y `evaluate`, con un paso de entrenamiento escrito a mano alrededor de un `tf.GradientTape`, y con ese mismo paso convertido en un grafo por `tf.function`. Los tres dan la misma pérdida en cada época, lo que muestra qué estaba haciendo `fit` todo el tiempo. Una tabla pone después PyTorch y TensorFlow lado a lado.

Explicación completa: [docs/es/artificial-intelligence/tensorflow-keras-basics.md](../../../docs/es/artificial-intelligence/tensorflow-keras-basics.md).

## Temas del quiz que demuestra

- `artificial-intelligence` / `tensorflow-keras`: tensores (`tf.constant`) y variables (`tf.Variable`), `tf.GradientTape` y `tape.watch`, `keras.Sequential`, `Dense`, `compile`, `fit`, `evaluate`, un logit con `from_logits=True` frente a una salida sigmoide, ejecución ansiosa (eager) frente a un grafo y el trazado (tracing) de `tf.function`.
- `artificial-intelligence` / `pytorch`: los mismos conceptos lado a lado (tensor, gradiente, capa, optimizador, bucle de entrenamiento).

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-tensorflow-keras-basics.sh        # Linux and macOS
./setup-windows-tensorflow-keras-basics.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas y ejecuta la demo. La primera construcción descarga TensorFlow (un paquete grande: la imagen ocupa cerca de 3 GB en disco). Después de eso nada usa la red: ambos servicios corren con `network_mode: "none"`.

TensorFlow tarda varios segundos en importarse, y en una máquina sin GPU imprime unas pocas líneas en la salida de error ("Could not find cuda drivers", "failed call to cuInit"). Son inofensivas: todo aquí corre en la CPU, y `TF_CPP_MIN_LOG_LEVEL=2` ya oculta el resto.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `python/model.py` | `build_model()`: la red 2-8-8-1 como un `keras.Sequential`, la pérdida, los datos como arreglos, la exactitud contada a mano |
| `python/keras_api.py` | `train_with_fit()`: `compile`, `fit`, `evaluate` |
| `python/tape.py` | gradientes con `tf.GradientTape`, el paso de entrenamiento escrito a mano, en modo eager o dentro de `tf.function` |
| `python/side_by_side.py` | la tabla de PyTorch y TensorFlow, con la exactitud citada de pytorch-basics |
| `python/data.py` | una **copia** del generador del conjunto de datos de MP-AI-2 |
| `python/render.py` | el gráfico de pérdida como SVG |
| `python/demo.py` | `python demo.py`: entrena de tres maneras y escribe `results/` |
| `python/test_tensorflow_keras_basics.py` | las pruebas |
| `python/pytest.ini` | oculta una advertencia de deprecación de una biblioteca que instala TensorFlow (véase Límites) |
| `results/` | resultados confirmados (committed): `results.md`, `loss.csv`, `loss-curve.svg` |

Un miniproyecto nunca importa otro, así que `python/data.py` se copió de MP-AI-2 y es idéntico al original. El conjunto de datos es por tanto literalmente el mismo (80 puntos de entrenamiento, 200 puntos de prueba), y una prueba fija algunos de sus puntos. Este proyecto no contiene PyTorch.

Solo Python: `python:3.13.16-slim-trixie` con `tensorflow==2.21.0`, que trae Keras 3.15.1 y NumPy 2.5.3. Los demás miniproyectos de esta área usan Python 3.14. Este usa 3.13 porque TensorFlow 2.21.0 no tiene paquete para Python 3.14. TensorFlow corre en la CPU con 2 hilos.

## Pruebas

```sh
docker compose run --rm python-test
```

Ejecuta `ruff check`, `ruff format --check` y 26 pruebas (unos 15 segundos, más la importación de TensorFlow). Los tres entrenamientos se ejecutan una vez y todas las pruebas los comparten.

- **MP-AI-7.1** el modelo tiene tres capas `Dense` y 105 parámetros, y `compile` + `fit` + `evaluate` con una semilla fija alcanzan al menos 95% en los 200 puntos de prueba. `evaluate` coincide con la exactitud contada a mano, un logit con `from_logits=True` da la misma pérdida que una salida sigmoide, y la métrica de exactitud debe cortar un logit en 0.
- **MP-AI-7.2** la cinta (tape) da 6 para `x * x` en x = 3 y 4, 4, 3 para `f = (x + y) * z` en x = 2, y = 1, z = 4, los valores calculados a mano. Una constante da `None` sin `tape.watch`. La pérdida del bucle escrito a mano baja a lo largo de los pasos, sigue la pérdida de `fit` dentro de 1e-4 en cada época, y dentro de `tf.function` Python ejecuta el paso una vez para 120 pasos.
- **MP-AI-7.3** la tabla lado a lado tiene una fila por cada concepto con ambos frameworks rellenados, y las dos exactitudes medidas. Una prueba también comprueba que PyTorch no está instalado aquí.

## Demo

```sh
docker compose run --rm python-demo
```

Imprime y reescribe [`results/results.md`](results/results.md), además de `loss.csv` y `loss-curve.svg`. Tarda cerca de medio minuto, y cada número es determinista (semilla fija).

Gradientes con una cinta:

```text
y = x * x at x = 3                         ->   dy/dx = 6
f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = 12
df/dx = 4   df/dy = 4   df/dz = 3

x = tf.constant(3.0), y = x * x: gradient without tape.watch = None, with tape.watch = 6
```

Keras, 2-8-8-1 con tanh (105 parámetros), SGD con tasa de aprendizaje 0.5, 120 épocas, lote completo, `keras.utils.set_random_seed(7)`. Lo que devolvió `model.evaluate`:

| Set | Points | Loss | Accuracy |
| --- | ---: | ---: | ---: |
| Training | 80 | 0.0839 | 97.5% |
| Test (never used in training) | 200 | 0.0710 | 98.5% |

El mismo entrenamiento, de tres maneras:

| How it was trained | First loss | Last loss | Training accuracy | Test accuracy | Python ran the step |
| --- | ---: | ---: | ---: | ---: | ---: |
| `model.fit` | 0.6567 | 0.0850 | 97.5% | 98.5% | hidden |
| Gradient tape, eager | 0.6567 | 0.0850 | 97.5% | 98.5% | 120 |
| Gradient tape inside `tf.function` | 0.6567 | 0.0850 | 97.5% | 98.5% | 1 |

La pérdida de cada época difiere en menos de 0.0001 entre `fit` y el bucle con cinta, y entre el bucle eager y el de `tf.function`.

![Loss per epoch](results/loss-curve.svg)

Las dos curvas de la figura quedan una encima de la otra: ese es el resultado.

### PyTorch y TensorFlow lado a lado

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

Las exactitudes de PyTorch las midió el miniproyecto [pytorch-basics](../pytorch-basics/) (MP-AI-6) y se citan de su [`results/results.md`](../pytorch-basics/results/results.md) confirmado, primera fila de la sección "Training on the two moons": mismo conjunto de datos, misma red, misma regla inicial, semilla 7, 120 épocas, tasa de aprendizaje 0.5. Las exactitudes de TensorFlow las midió esta demo. Los dos frameworks sortean pesos iniciales aleatorios distintos a partir del mismo número de semilla, así que las exactitudes son cercanas y no iguales: 98.0% son 196 de los 200 puntos de prueba y 98.5% son 197.

No hay panel (dashboard): la figura es un archivo SVG escrito por la demo, sin biblioteca de gráficos.

## Límites

- La columna de PyTorch se cita, no se ejecuta aquí. Si pytorch-basics cambia, la constante de `python/side_by_side.py` y esta tabla deben actualizarse a mano. Una prueba fija el valor citado, no el otro proyecto.
- `python/pytest.ini` oculta una `DeprecationWarning` que imprime la biblioteca `gast`, que TensorFlow instala y usa dentro de `tf.function`. En Python 3.13 aparece decenas de veces por ejecución y concierne solo a esa biblioteca. No se filtra ninguna otra advertencia.
- Las líneas sobre CUDA en la salida no se pueden desactivar con `TF_CPP_MIN_LOG_LEVEL`. Solo dicen que no se encontró ninguna GPU.
- En Keras 3 los parámetros de un modelo son variables de Keras que envuelven un `tf.Variable`. La cinta y el optimizador las aceptan directamente, así que el código no muestra la diferencia.
- La red tiene 105 parámetros y 80 puntos de entrenamiento. A este tamaño `fit` gasta su tiempo en el costo fijo de cada época (callbacks, métricas, la maquinaria de progreso), por eso 120 épocas tardan segundos. Aquí no se informa ningún tiempo: la comparación de tiempos está en pytorch-basics, entre la versión desde cero y PyTorch.
- El entrenamiento usa floats de 32 bits. Las pérdidas se redondean a 4 decimales en `results/`, lo que es estable en esta máquina. Otra CPU puede diferir en el último dígito.
