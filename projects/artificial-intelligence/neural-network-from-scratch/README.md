# neural-network-from-scratch

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

It teaches **what a neuron computes and how backpropagation finds the gradients**. A scalar automatic differentiation engine is written in plain Python, a multi-layer perceptron is built on top of it and trained with gradient descent, and every gradient is checked against a numerical one. The network learns XOR and a two-class dataset, and the demo writes the loss per epoch and the decision boundary.

Full explanation: [docs/en/artificial-intelligence/neural-network-from-scratch.md](../../../docs/en/artificial-intelligence/neural-network-from-scratch.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `neural-networks`: what a neuron computes, activation functions (tanh, ReLU, sigmoid), layers, counting parameters, why XOR needs a hidden layer, random initialisation.
- `artificial-intelligence` / `training`: the gradient, the update `w = w - lr * grad`, backpropagation as the chain rule, gradients that accumulate, the numerical gradient check, the loss curve.
- `artificial-intelligence` / `supervised-learning`: classification, the loss, training set against test set.

## Run

The only requirement is Docker.

```sh
./setup-unix-neural-network-from-scratch.sh        # Linux and macOS
./setup-windows-neural-network-from-scratch.ps1    # Windows
```

The script builds the image, runs the tests and runs the demo.

## Structure

| Path | What it is |
| --- | --- |
| `python/engine.py` | `Value`: a number that remembers how it was computed, and `backward()` |
| `python/nn.py` | `Neuron`, `Layer` and `MLP` built on `Value` |
| `python/data.py` | XOR and the generated two-moons dataset (training and test sets) |
| `python/train.py` | the loss, the training loop and the accuracy |
| `python/render.py` | the loss curve and the decision boundary, as SVG and as text |
| `python/demo.py` | `python demo.py`: trains and writes `results/` |
| `python/test_network.py` | the tests |
| `results/` | committed results: `results.md`, `loss-xor.csv`, `loss-moons.csv`, `loss-curve.svg`, `decision-boundary.txt`, `decision-boundary.svg` |

Python only (`python:3.14.8-slim-trixie`), with no runtime dependency: not even NumPy. Every number in the network is one Python object, which is slow and exactly the point: nothing is hidden.

## Tests

```sh
docker compose run --rm python-test
```

It runs `ruff check`, `ruff format --check` and 36 tests (about half a minute, most of it training):

- every operation of the engine, and a whole network, against the numerical gradient `(f(x + h) - f(x - h)) / 2h`, within 1e-6;
- XOR learned exactly, and a single neuron failing at it;
- at least 95% accuracy on test points that were not used in training.

## Demo

```sh
docker compose run --rm python-demo
```

It prints [`results/results.md`](results/results.md) and rewrites the files in `results/`.

| Problem | Network | Parameters | Result |
| --- | --- | ---: | --- |
| XOR | 2-4-1, tanh | 17 | 4 of 4 right, loss 0.7863 to 0.0244 in 300 epochs |
| Two moons | 2-8-8-1, tanh | 105 | 98.8% on the 80 training points, 99.5% on the 200 test points |

The loss per epoch of the two-moons network:

![Loss per epoch](results/loss-curve.svg)

The decision boundary, with the test points:

![Decision boundary](results/decision-boundary.svg)

There is no dashboard: the figures are SVG files written by the demo, with no plotting library.

## Limits

One Python object per number makes this thousands of times slower than a real library, which stores whole layers as arrays and runs them on optimised code. The network has about a hundred parameters and the dataset has 80 points. The mini-project [pytorch-basics](../pytorch-basics/) redoes the same network with PyTorch and compares the two.
