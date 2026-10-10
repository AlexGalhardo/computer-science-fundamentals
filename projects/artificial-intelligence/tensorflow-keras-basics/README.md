# tensorflow-keras-basics

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

It teaches **the same model in another framework, and what a high-level API hides**. The 2-8-8-1 network of [neural-network-from-scratch](../neural-network-from-scratch/) (MP-AI-2) is described with Keras and trained on the same dataset in three ways: with `compile`, `fit` and `evaluate`, with a training step written by hand around a `tf.GradientTape`, and with that same step turned into a graph by `tf.function`. The three give the same loss at every epoch, which shows what `fit` was doing all along. A table then puts PyTorch and TensorFlow side by side.

Full explanation: [docs/en/artificial-intelligence/tensorflow-keras-basics.md](../../../docs/en/artificial-intelligence/tensorflow-keras-basics.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `tensorflow-keras`: tensors (`tf.constant`) and variables (`tf.Variable`), `tf.GradientTape` and `tape.watch`, `keras.Sequential`, `Dense`, `compile`, `fit`, `evaluate`, a logit with `from_logits=True` against a sigmoid output, eager execution against a graph and `tf.function` tracing.
- `artificial-intelligence` / `pytorch`: the same concepts side by side (tensor, gradient, layer, optimiser, training loop).

## Run

The only requirement is Docker.

```sh
./setup-unix-tensorflow-keras-basics.sh        # Linux and macOS
./setup-windows-tensorflow-keras-basics.ps1    # Windows
```

The script builds the image, runs the tests and runs the demo. The first build downloads TensorFlow (a large package: the image is about 3 GB on disk). After that nothing uses the network: both services run with `network_mode: "none"`.

TensorFlow takes several seconds to import, and on a machine with no GPU it prints a few lines to the error output ("Could not find cuda drivers", "failed call to cuInit"). They are harmless: everything here runs on the CPU, and `TF_CPP_MIN_LOG_LEVEL=2` already hides the rest.

## Structure

| Path | What it is |
| --- | --- |
| `python/model.py` | `build_model()`: the 2-8-8-1 network as a `keras.Sequential`, the loss, the data as arrays, the accuracy counted by hand |
| `python/keras_api.py` | `train_with_fit()`: `compile`, `fit`, `evaluate` |
| `python/tape.py` | gradients with `tf.GradientTape`, the training step written by hand, eager or inside `tf.function` |
| `python/side_by_side.py` | the PyTorch and TensorFlow table, with the accuracy quoted from pytorch-basics |
| `python/data.py` | a **copy** of the dataset generator of MP-AI-2 |
| `python/render.py` | the loss chart as SVG |
| `python/demo.py` | `python demo.py`: trains three ways and writes `results/` |
| `python/test_tensorflow_keras_basics.py` | the tests |
| `python/pytest.ini` | hides one deprecation warning of a library TensorFlow installs (see Limits) |
| `results/` | committed results: `results.md`, `loss.csv`, `loss-curve.svg` |

A mini-project never imports another one, so `python/data.py` was copied from MP-AI-2 and is identical to the original. The dataset is therefore literally the same (80 training points, 200 test points), and a test pins some of its points. This project contains no PyTorch.

Python only: `python:3.13.16-slim-trixie` with `tensorflow==2.21.0`, which brings Keras 3.15.1 and NumPy 2.5.3. The other mini-projects of this area use Python 3.14. This one uses 3.13 because TensorFlow 2.21.0 has no package for Python 3.14. TensorFlow runs on the CPU with 2 threads.

## Tests

```sh
docker compose run --rm python-test
```

It runs `ruff check`, `ruff format --check` and 26 tests (about 15 seconds, plus the import of TensorFlow). The three trainings run once and are shared by all the tests.

- **MP-AI-7.1** the model has three `Dense` layers and 105 parameters, and `compile` + `fit` + `evaluate` with a fixed seed reach at least 95% on the 200 test points. `evaluate` agrees with the accuracy counted by hand, a logit with `from_logits=True` gives the same loss as a sigmoid output, and the accuracy metric must cut a logit at 0.
- **MP-AI-7.2** the tape gives 6 for `x * x` at x = 3 and 4, 4, 3 for `f = (x + y) * z` at x = 2, y = 1, z = 4, the values computed by hand. A constant gives `None` without `tape.watch`. The loss of the hand-written loop falls over the steps, it follows the loss of `fit` within 1e-4 at every epoch, and inside `tf.function` Python runs the step once for 120 steps.
- **MP-AI-7.3** the side-by-side table has a row for each concept with both frameworks filled in, and both measured accuracies. A test also checks that PyTorch is not installed here.

## Demo

```sh
docker compose run --rm python-demo
```

It prints and rewrites [`results/results.md`](results/results.md), plus `loss.csv` and `loss-curve.svg`. It takes about half a minute, and every number is deterministic (fixed seed).

Gradients with a tape:

```text
y = x * x at x = 3                         ->   dy/dx = 6
f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = 12
df/dx = 4   df/dy = 4   df/dz = 3

x = tf.constant(3.0), y = x * x: gradient without tape.watch = None, with tape.watch = 6
```

Keras, 2-8-8-1 with tanh (105 parameters), SGD with learning rate 0.5, 120 epochs, full batch, `keras.utils.set_random_seed(7)`. What `model.evaluate` returned:

| Set | Points | Loss | Accuracy |
| --- | ---: | ---: | ---: |
| Training | 80 | 0.0839 | 97.5% |
| Test (never used in training) | 200 | 0.0710 | 98.5% |

The same training, three ways:

| How it was trained | First loss | Last loss | Training accuracy | Test accuracy | Python ran the step |
| --- | ---: | ---: | ---: | ---: | ---: |
| `model.fit` | 0.6567 | 0.0850 | 97.5% | 98.5% | hidden |
| Gradient tape, eager | 0.6567 | 0.0850 | 97.5% | 98.5% | 120 |
| Gradient tape inside `tf.function` | 0.6567 | 0.0850 | 97.5% | 98.5% | 1 |

The loss of every epoch differs by less than 0.0001 between `fit` and the tape loop, and between the eager loop and the `tf.function` one.

![Loss per epoch](results/loss-curve.svg)

The two curves of the figure lie on top of each other: that is the result.

### PyTorch and TensorFlow side by side

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

The PyTorch accuracies were measured by the mini-project [pytorch-basics](../pytorch-basics/) (MP-AI-6) and are quoted from its committed [`results/results.md`](../pytorch-basics/results/results.md), first row of the section "Training on the two moons": same dataset, same network, same starting rule, seed 7, 120 epochs, learning rate 0.5. The TensorFlow accuracies were measured by this demo. The two frameworks draw different random starting weights from the same seed number, so the accuracies are close and not equal: 98.0% is 196 of the 200 test points and 98.5% is 197.

There is no dashboard: the figure is an SVG file written by the demo, with no plotting library.

## Limits

- The PyTorch column is quoted, not run here. If pytorch-basics changes, the constant in `python/side_by_side.py` and this table must be updated by hand. A test pins the quoted value, not the other project.
- `python/pytest.ini` hides one `DeprecationWarning` printed by the library `gast`, which TensorFlow installs and uses inside `tf.function`. On Python 3.13 it appears dozens of times per run and concerns only that library. No other warning is filtered.
- The lines about CUDA in the output cannot be turned off with `TF_CPP_MIN_LOG_LEVEL`. They only say that no GPU was found.
- In Keras 3 the parameters of a model are Keras variables that wrap a `tf.Variable`. The tape and the optimiser accept them directly, so the code does not show the difference.
- The network has 105 parameters and 80 training points. At this size `fit` spends its time in the fixed cost of each epoch (callbacks, metrics, the progress machinery), which is why 120 epochs take seconds. No timing is reported here: the comparison of times is in pytorch-basics, between the from-scratch version and PyTorch.
- Training uses 32-bit floats. The losses are rounded to 4 decimals in `results/`, which is stable on this machine. Another CPU may differ in the last digit.
