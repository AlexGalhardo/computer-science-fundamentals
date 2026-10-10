# diffusion-toy

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

It teaches **how an image model learns to remove noise**, on two-dimensional points instead of pixels. The "image" is one point on a ring. A forward process adds Gaussian noise step by step until the ring has become pure noise, a small network written by hand with NumPy (no deep learning framework) learns to predict the noise that was added, and generation starts from pure noise and removes a little of it 100 times, until the points are back on the ring. It is the method of "Denoising Diffusion Probabilistic Models" (Ho, Jain and Abbeel, 2020) made small enough to plot every step.

Full explanation: [docs/en/artificial-intelligence/diffusion-toy.md](../../../docs/en/artificial-intelligence/diffusion-toy.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `image-generation`: the forward process (noise added step by step, and the shortcut to any step), the training objective (predict the noise), generation step by step from pure noise, why a diffusion model is slower than a model that answers in a single pass (one call of the network per step).
- `artificial-intelligence` / `probability-statistics`: the Gaussian distribution, mean and variance, why the sum of Gaussian noises is Gaussian, how to check that a sample looks Gaussian.
- `artificial-intelligence` / `training`: the mean squared error loss, backpropagation written by hand, the Adam optimiser, the numerical gradient check.

## Run

The only requirement is Docker.

```sh
./setup-unix-diffusion-toy.sh        # Linux and macOS
./setup-windows-diffusion-toy.ps1    # Windows
```

The script builds the image, runs the tests and runs the demo, which rewrites `results/`.

## Structure

| Path | What it is |
| --- | --- |
| `python/diffusion.py` | everything that is the lesson: the ring, the noise schedule, the forward process (step by step and shortcut), the network, backpropagation, Adam, training, the reverse process, and the measurements (distance to the ring, slices, Gaussian checks) |
| `python/svg.py` | the scatter plots and the line chart, written as SVG text |
| `python/demo.py` | trains, runs both processes and writes `results/` |
| `python/test_diffusion.py` | the tests, one or more per acceptance criterion |
| `results/forward.svg`, `results/reverse.svg` | the points at steps 0, 10, 25, 50, 75 and 100 of each process |
| `results/loss.svg` | the training loss |
| `results/results.md` | every number quoted below |

One language, Python (`python:3.14.8-slim-trixie`), with one runtime dependency, `numpy==2.5.3`, used only for arrays and matrix products. There is no PyTorch or TensorFlow: the network, its backward pass and the optimiser are a small part of `diffusion.py`. No code is imported from another mini-project.

## Tests

```sh
docker compose run --rm python-test
```

It runs `ruff check`, `ruff format --check` and 12 tests (about 15 seconds, most of it the single training run that the tests share).

| Criterion | Test | What it proves |
| --- | --- | --- |
| MP-AI-5.1 | `test_last_forward_step_is_indistinguishable_from_gaussian_noise` | 20000 points noised step by step pass 7 checks against a standard normal, while the clean ring and step 25 fail them |
| MP-AI-5.1 | `test_step_by_step_agrees_with_the_shortcut` | walking the steps and jumping with the closed formula give the same statistics |
| MP-AI-5.2 | `test_generated_points_land_on_the_ring` | mean distance of 2000 generated points to the ring below **0.10** |
| MP-AI-5.2 | `test_generated_points_cover_the_whole_ring` | each of the 12 slices of the ring holds between 50% and 150% of an even share |
| MP-AI-5.3 | `test_demo_writes_the_points_of_several_reverse_steps` | the demo writes the four result files, with 6 panels of 300 points |
| (support) | `test_backpropagation_matches_numerical_gradient` | the hand-written gradients equal centred differences, for all 195 weights of a small network |

## Demo

```sh
docker compose run --rm python-demo    # writes results/
```

The reverse process, from pure noise (left) to the generated points (right). The dashed circle is the target:

![reverse process](results/reverse.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0.535 | 1.244 | 0.647 | 0.967 | 0.995 |
| 75 | 0.543 | 1.252 | 0.654 | 0.971 | 1.023 |
| 50 | 0.509 | 1.206 | 0.622 | 0.936 | 0.905 |
| 25 | 0.449 | 1.099 | 0.556 | 0.772 | 0.744 |
| 10 | 0.256 | 0.992 | 0.320 | 0.552 | 0.534 |
| 0 | 0.047 | 0.987 | 0.066 | 0.496 | 0.482 |

What gives the number 0.047 a meaning:

| Points | Mean distance to the ring |
| --- | ---: |
| Real data (the training set) | 0.024 |
| Generated (step 0 of the reverse process) | 0.047 |
| Pure noise (step 100, where generation starts) | 0.535 |
| Threshold of the test | 0.10 |

The threshold 0.10 is about twice the measured value and less than a fifth of the distance of pure noise. All 12 slices of the ring are populated (137 to 182 points each, 167 if perfectly even), so the model did not collapse onto one spot.

The forward process, from the ring (left) to noise (right):

![forward process](results/forward.svg)

At step 100 the 20000 points pass every check against a standard normal (mean, variance, correlations, shares within 1 and 2 standard deviations, Kolmogorov-Smirnov statistic 0.0038 and 0.0113 against a tolerance of 0.0138). The signal that is left is sqrt(alpha_bar_100) = 0.0045 of the original point.

The training loss falls from 0.2465 (first 200 iterations) to 0.1702 (last 200):

![training loss](results/loss.svg)

There is no dashboard: the three figures and the tables in [`results/results.md`](results/results.md) are the result.

## Limits

- "Indistinguishable from Gaussian noise" means that the seven checks cannot tell the two apart with 20000 points. The original point is still there, multiplied by 0.0045. Seeing that would take a sample of the order of a million points.
- The generated ring is about twice as thick as the real one (spread of the radius 0.066 against 0.030). That comes from the error of a small network trained for a few seconds and from the coarse steps (100 instead of 1000). The demo does not separate the two causes.
- The loss does not go to zero and never could: the same noisy point can come from many different pairs of clean point and noise, so the best possible answer is an average.
- One shape, no condition: the model always draws the ring. There is no text prompt, no U-Net, no latent space and none of the faster samplers. The docs page says what each one adds.
- Every seed is fixed and the numbers were written by the Docker demo. On another processor the last decimal of a rounded number may differ, which is why the tests use thresholds and not exact values.
