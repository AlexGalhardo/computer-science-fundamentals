# Timing: from scratch against PyTorch

Generated with `docker compose run --rm python-demo`. **These are wall-clock times: they change from machine to machine and from run to run.** Everything else in `results/` is deterministic.

The job, the same in both versions and inside the same container: build the 2-8-8-1 network and train it for 20 epochs of full-batch gradient descent on the 80 training points. 5 runs of each version, after one discarded PyTorch run (warm-up). Lines of code are counted without blank lines, comments and docstrings.

| Version | Lines of code | Median of 5 runs | Fastest | Slowest | Per epoch |
| --- | ---: | ---: | ---: | ---: | ---: |
| From scratch (MP-AI-2) | 198 | 8.121 s | 7.679 s | 8.464 s | 406.04 ms |
| PyTorch (this version) | 78 | 0.027 s | 0.021 s | 0.065 s | 1.37 ms |

On this run PyTorch was about 297 times faster.

Same work, checked: over these 20 epochs the loss of the from-scratch run and the loss of PyTorch started from the same weights differ by less than 1e-09: yes.

## Lines of code by part

| Part | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Automatic differentiation | 102 (`scratch/engine.py`) | 0 (none: the framework brings it) |
| Network | 45 (`scratch/nn.py`) | 19 (`model.py`) |
| Loss, training loop and accuracy | 51 (`scratch/train.py`) | 59 (`train.py`) |
| **Total** | **198** | **78** |

## Machine

| Item | Value |
| --- | --- |
| CPU | AMD Ryzen 7 5700X3D 8-Core Processor |
| Logical cores seen by the container | 16 |
| Threads PyTorch may use | 2 |
| System | Linux 6.18.33.2-microsoft-standard-WSL2 (x86_64) |
| Image | python:3.14.8-slim-trixie |
| Python | 3.14.8 |
| PyTorch | 2.14.1+cpu |

Command: `docker compose run --rm python-demo`.
