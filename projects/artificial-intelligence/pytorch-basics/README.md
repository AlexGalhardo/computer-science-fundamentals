# pytorch-basics

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

It teaches **what a deep learning framework does for you**, by redoing the mini-project [neural-network-from-scratch](../neural-network-from-scratch/) (MP-AI-2) with PyTorch. The same 2-8-8-1 network is built in both, and the gradients PyTorch computes are compared with the hand-written backpropagation and with numerical gradients. Then the training loop is written by hand (forward, loss, clear, backward, step) on the same dataset, and a table compares lines of code and training time of the two versions.

Full explanation: [docs/en/artificial-intelligence/pytorch-basics.md](../../../docs/en/artificial-intelligence/pytorch-basics.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `pytorch`: tensors (shape, dtype), `requires_grad`, `backward()` and `.grad`, gradients that accumulate and `zero_grad`, `nn.Module` and `nn.Linear`, the optimiser, the five steps of the training loop, `torch.no_grad()` against `model.eval()`.
- `artificial-intelligence` / `training`: the numerical gradient check, full-batch gradient descent, the loss curve, why the starting weights matter.
- `artificial-intelligence` / `linear-algebra`: a linear layer applied to a whole batch as one matrix product, and the shapes along the way: (N, 2) to (N, 8) to (N, 8) to (N, 1).

## Run

The only requirement is Docker.

```sh
./setup-unix-pytorch-basics.sh        # Linux and macOS
./setup-windows-pytorch-basics.ps1    # Windows
```

The script builds the image, runs the tests and runs the demo. The first build downloads the CPU-only PyTorch wheel (a few hundred megabytes). After that nothing uses the network: both services run with `network_mode: "none"`.

## Structure

| Path | What it is |
| --- | --- |
| `python/model.py` | `MoonsNet`: the 2-8-8-1 network as an `nn.Module` |
| `python/train.py` | the training loop written by hand, the accuracy, `train_moons()` |
| `python/tensors.py` | small examples: `*` against `@`, a linear layer by hand, `backward`, accumulation |
| `python/gradients.py` | copies the weights of the from-scratch network into PyTorch and computes the gradients in three ways |
| `python/versus.py` | counts lines of code, times both versions, records the machine |
| `python/render.py` | the loss chart as SVG |
| `python/demo.py` | `python demo.py`: runs everything and writes `results/` |
| `python/test_pytorch_basics.py` | the tests |
| `python/scratch/` | a **copy** of MP-AI-2 (`engine.py`, `nn.py`, `data.py`, `train.py`) |
| `results/` | committed results: `results.md`, `timing.md`, `loss.csv`, `loss-curve.svg` |

A mini-project never imports another one, so the files of MP-AI-2 that are needed were copied into `python/scratch/`. `data.py` and `engine.py` are identical to the originals. In `nn.py` and `train.py` only the import lines changed. The dataset is therefore literally the same, and a test pins some of its points.

Python only: `python:3.14.8-slim-trixie` with `torch==2.14.1` (CPU wheel) and `numpy==2.5.3`. PyTorch runs on the CPU with 2 threads.

## Tests

```sh
docker compose run --rm python-test
```

It runs `ruff check`, `ruff format --check` and 32 tests (about 10 seconds):

- **MP-AI-6.1** tensors (shapes, `*` against `@`, broadcasting, a linear layer as a matrix product) and automatic differentiation (`requires_grad`, accumulation, `zero_grad`, `no_grad` against `eval`). The weights of the from-scratch network are copied into PyTorch, and the 105 gradients of the loss on the 80 training points agree with the hand-written backpropagation within 1e-10 and with the numerical gradient within 1e-6.
- **MP-AI-6.2** the loop written by hand reaches at least 95% on the 200 test points with a fixed seed, the same seed gives the same training, `BCEWithLogitsLoss` equals the loss written by hand in MP-AI-2, and one optimiser step is `w - lr * grad`. Started from the weights of MP-AI-2, PyTorch follows its loss curve within 1e-9.
- **MP-AI-6.3** the line counter ignores blank lines, comments and docstrings, and the timing table has both versions, positive numbers and the machine. No test asserts on an absolute time.

## Demo

```sh
docker compose run --rm python-demo
```

It prints and rewrites [`results/results.md`](results/results.md) and [`results/timing.md`](results/timing.md), plus `loss.csv` and `loss-curve.svg`. It takes under a minute, almost all of it spent in the from-scratch version.

The gradients, three ways, on the same network (first rows, all 105 are compared):

| Parameter | Hand-written backpropagation | PyTorch `backward()` | Numerical |
| --- | ---: | ---: | ---: |
| `hidden1` `w[0][0]` | -0.060789 | -0.060789 | -0.060789 |
| `hidden1` `w[0][1]` | 0.012666 | 0.012666 | 0.012666 |
| `hidden1` b[0] | -0.049645 | -0.049645 | -0.049645 |

The largest difference between PyTorch and the hand-written backpropagation is below 1e-12, and between PyTorch and the numerical gradient below 1e-8.

Training, 2-8-8-1 with tanh, SGD with learning rate 0.5, full batch:

| Starting weights | Epochs | First loss | Last loss | Training accuracy | Test accuracy |
| --- | ---: | ---: | ---: | ---: | ---: |
| The rule of MP-AI-2, drawn by PyTorch (`torch.manual_seed(7)`) | 120 | 0.7541 | 0.1057 | 97.5% | 98.0% |
| Copied from MP-AI-2 (its seed 7), 64-bit floats | 120 | 0.4576 | 0.0604 | 98.8% | 99.5% |
| The default of `nn.Linear` | 120 | 0.7011 | 0.2405 | 87.5% | 92.5% |
| The default of `nn.Linear` | 300 | 0.7011 | 0.0182 | 100.0% | 99.5% |

The first row is the run of the acceptance criterion: **98.0% on the 200 test points**. The second row is exactly the result of MP-AI-2, because it starts from the same weights and does the same arithmetic.

![Loss per epoch](results/loss-curve.svg)

From scratch against the framework ([`results/timing.md`](results/timing.md)). The job is the same in both: build the network and train it for 20 epochs on the 80 training points, 5 runs each.

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

Lines of code are the lines that hold code: blank lines, comment lines and docstrings are not counted (`count_code_lines` in `python/versus.py`).

Machine of that run: AMD Ryzen 7 5700X3D (16 logical cores seen by the container, PyTorch limited to 2 threads), Linux 6.18 under WSL2, image `python:3.14.8-slim-trixie`, Python 3.14.8, PyTorch 2.14.1+cpu. **The times change from machine to machine and from run to run**: other containers were running on this machine during the measurement, and another run on it gave 6.4 s against 0.010 s. The order of magnitude (hundreds of times) is the result, not the exact ratio. Every other number in `results/` is deterministic.

There is no dashboard: the figure is an SVG file written by the demo, with no plotting library.

## Limits

- The network has 105 parameters and the dataset 80 points. At this size PyTorch spends most of its time in the overhead of each call, not in arithmetic, so the gap to the from-scratch version would be much larger on a real model. Nothing here uses a GPU.
- The line count compares what had to be written, not the size of the software: PyTorch itself is hundreds of thousands of lines. The from-scratch `train.py` also holds the XOR run of MP-AI-2, which is a few of its 51 lines.
- The criterion run does not start from the same random numbers as MP-AI-2, only from the same rule (weights uniform in (-1, 1), biases at zero): PyTorch and Python have different random generators. The row "Copied from MP-AI-2" is the one that starts from identical weights.
- With the default starting weights of `nn.Linear`, 120 epochs reach only 92.5% on the test points. It is the same model learning more slowly, and 300 epochs reach 99.5%.
- Training uses 32-bit floats, the PyTorch default. The losses are rounded to 4 decimals in `results/`, which is stable on this machine. Another CPU may differ in the last digit.

The mini-project [tensorflow-keras-basics](../tensorflow-keras-basics/) trains the same network with TensorFlow and Keras and puts the two frameworks side by side.
