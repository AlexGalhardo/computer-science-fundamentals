# Results: tensorflow-keras-basics

Generated with `docker compose run --rm python-demo` (TensorFlow on CPU, fixed seeds). Python 3.13.16, TensorFlow 2.21.0, Keras 3.15.1, NumPy 2.5.3.

## Gradients with a tape

```text
y = x * x at x = 3                         ->   dy/dx = 6
f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = 12
df/dx = 4   df/dy = 4   df/dz = 3

x = tf.constant(3.0), y = x * x: gradient without tape.watch = None, with tape.watch = 6
```

## Keras: compile, fit, evaluate

`keras.Sequential` 2-8-8-1 with tanh (105 parameters), output as a logit, `BinaryCrossentropy(from_logits=True)`, `SGD` with learning rate 0.5, 120 epochs, full batch (`batch_size=80`), `keras.utils.set_random_seed(7)`. 80 training points and 200 test points, generated with noise 0.12: the dataset of MP-AI-2.

What `model.evaluate` returned:

| Set | Points | Loss | Accuracy |
| --- | ---: | ---: | ---: |
| Training | 80 | 0.0839 | 97.5% |
| Test (never used in training) | 200 | 0.0710 | 98.5% |

The loss per epoch that `fit` returned in its history:

| Epoch | Loss |
| ---: | ---: |
| 1 | 0.6567 |
| 2 | 0.4884 |
| 5 | 0.3552 |
| 10 | 0.2980 |
| 25 | 0.2598 |
| 50 | 0.2222 |
| 100 | 0.1132 |
| 120 | 0.0850 |

Per epoch: [`loss.csv`](loss.csv). Curves: [`loss-curve.svg`](loss-curve.svg).

![Loss per epoch](loss-curve.svg)

## The same training step with a gradient tape

Same model, same seed, same optimiser, 120 steps on the whole training set. The accuracies of this table are counted by hand (the answer is class 1 when the logit is positive), with no Keras metric. The last column counts how many times Python really ran the body of the step.

| How it was trained | First loss | Last loss | Training accuracy | Test accuracy | Python ran the step |
| --- | ---: | ---: | ---: | ---: | ---: |
| `model.fit` | 0.6567 | 0.0850 | 97.5% | 98.5% | hidden |
| Gradient tape, eager | 0.6567 | 0.0850 | 97.5% | 98.5% | 120 |
| Gradient tape inside `tf.function` | 0.6567 | 0.0850 | 97.5% | 98.5% | 1 |

| The loss of every epoch differs by less than 0.0001 | |
| --- | --- |
| `fit` against the eager tape loop | yes |
| the eager tape loop against the `tf.function` one | yes |

## PyTorch and TensorFlow side by side

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

The PyTorch accuracies were measured by the mini-project pytorch-basics (MP-AI-6) and are quoted from its committed `pytorch-basics/results/results.md` (same dataset, same network, same starting rule, seed 7, 120 epochs). This project contains no PyTorch. The two frameworks draw different random starting weights from the same seed number, so the accuracies are close and not equal.
