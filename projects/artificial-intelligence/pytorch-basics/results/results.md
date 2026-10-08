# Results: pytorch-basics

Generated with `docker compose run --rm python-demo` (PyTorch on CPU, fixed seeds). The wall-clock times are in [`timing.md`](timing.md), the only file here that changes from run to run.

## Automatic differentiation on one expression

```text
f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = 12
df/dx = 4   df/dy = 4   df/dz = 3

x * x at x = 3: x.grad after one backward() = 6, after a second one = 12, after zero_() = 0
```

## The same gradients, three ways

The 2-8-8-1 network of MP-AI-2 (seed 7, 105 parameters) was copied weight by weight into PyTorch, in 64-bit floats. Both compute the loss on the 80 training points and run backpropagation.

| | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Loss | 0.4576158373 | 0.4576158373 |

The first six of the gradients (the first two neurons of the first layer):

| Parameter | Hand-written backpropagation | PyTorch `backward()` | Numerical |
| --- | ---: | ---: | ---: |
| `hidden1` w[0][0] | -0.060789 | -0.060789 | -0.060789 |
| `hidden1` w[0][1] | 0.012666 | 0.012666 | 0.012666 |
| `hidden1` b[0] | -0.049645 | -0.049645 | -0.049645 |
| `hidden1` w[1][0] | -0.133021 | -0.133021 | -0.133021 |
| `hidden1` w[1][1] | 0.010081 | 0.010081 | 0.010081 |
| `hidden1` b[1] | -0.105778 | -0.105778 | -0.105778 |

| Largest difference over the 105 gradients | Limit | Within the limit |
| --- | ---: | --- |
| PyTorch against the hand-written backpropagation | 1e-12 | yes |
| PyTorch against the numerical gradient | 1e-08 | yes |

## Training on the two moons

Network 2-8-8-1 with tanh (105 parameters), `BCEWithLogitsLoss`, `torch.optim.SGD` with learning rate 0.5, full batch. 80 training points and 200 test points, generated with noise 0.12: the dataset of MP-AI-2.

| Starting weights | Epochs | First loss | Last loss | Training accuracy | Test accuracy |
| --- | ---: | ---: | ---: | ---: | ---: |
| The rule of MP-AI-2, drawn by PyTorch (`torch.manual_seed(7)`) | 120 | 0.7541 | 0.1057 | 97.5% | 98.0% |
| Copied from MP-AI-2 (its seed 7), 64-bit floats | 120 | 0.4576 | 0.0604 | 98.8% | 99.5% |
| The default of `nn.Linear` | 120 | 0.7011 | 0.2405 | 87.5% | 92.5% |
| The default of `nn.Linear` | 300 | 0.7011 | 0.0182 | 100.0% | 99.5% |

The first row is the run of the acceptance criterion. The second one repeats MP-AI-2 number by number: its published result is a loss from 0.4576 to 0.0604, 98.8% on the training points and 99.5% on the test points.

Loss of the first row:

| Epoch | Loss |
| ---: | ---: |
| 1 | 0.7541 |
| 2 | 0.5170 |
| 5 | 0.3844 |
| 10 | 0.3088 |
| 25 | 0.2620 |
| 50 | 0.2369 |
| 100 | 0.1391 |
| 120 | 0.1057 |

Per epoch: [`loss.csv`](loss.csv). Curves: [`loss-curve.svg`](loss-curve.svg).

![Loss per epoch](loss-curve.svg)

## Lines of code

Lines that hold code: blank lines, comment lines and docstrings are not counted (`count_code_lines` in `python/versus.py`).

| Part | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Automatic differentiation | 102 (`scratch/engine.py`) | 0 (none: the framework brings it) |
| Network | 45 (`scratch/nn.py`) | 19 (`model.py`) |
| Loss, training loop and accuracy | 51 (`scratch/train.py`) | 59 (`train.py`) |
| **Total** | **198** | **78** |

Training time and the machine: [`timing.md`](timing.md).
