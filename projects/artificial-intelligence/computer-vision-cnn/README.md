# computer-vision-cnn

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

It teaches **how a network sees: images as numbers, convolution, pooling and learned filters**. A convolution is written by hand with loops and checked against PyTorch, number by number. Then a small convolutional network (CNN) learns to classify four shapes that the project draws itself (circle, square, triangle, cross), is compared with a fully connected network of the same size on shapes that moved, is trained again with data augmentation, and has its learned filters and activation maps saved as pictures.

Full explanation: [docs/en/artificial-intelligence/computer-vision-cnn.md](../../../docs/en/artificial-intelligence/computer-vision-cnn.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `computer-vision`: images as tensors, convolution as a sliding dot product, the edge filter (Sobel), the output size (W - F + 2P) / S + 1, parameter sharing, max pooling, a CNN against a fully connected network on shifted images, data augmentation, learned filters and activation (feature) maps.
- `artificial-intelligence` / `image-generation`: convolution arithmetic (filter size, stride, padding and the size of the output).
- `artificial-intelligence` / `pytorch`: tensors and their shapes (batch x channels x height x width), `nn.Module`, the training loop (predict, loss, `zero_grad`, `backward`, `step`), mini-batches, fixed seeds.

## Run

The only requirement is Docker.

```sh
./setup-unix-computer-vision-cnn.sh        # Linux and macOS
./setup-windows-computer-vision-cnn.ps1    # Windows
```

The script builds the image, runs the tests, then runs the demo, which trains the three networks and rewrites `results/`. Everything runs on the CPU, with no network access: no dataset and no model is downloaded.

## Structure

| Path | What it is |
| --- | --- |
| `python/conv.py` | the convolution written with four loops, the Sobel filters, the output size formula, and the same call done by PyTorch |
| `python/shapes.py` | the dataset: draws the four shapes into 20 x 20 tensors with a fixed seed, and the shift and rotation used for augmentation |
| `python/cnn.py` | the CNN, the fully connected network (MLP), the training loop, the accuracy and the experiment that trains and measures the three models |
| `python/figures.py` | a PNG writer (standard library only) and the SVG loss curve |
| `python/demo.py` | runs the experiment and writes `results/` |
| `python/test_conv.py`, `python/test_cnn.py` | the tests, marked with the acceptance criterion they prove |
| `results/` | committed results: `results.md`, `loss-curve.svg` and the PNG pictures |

The image is `python:3.14.8-slim-trixie` with `torch==2.14.1` (CPU wheel), `numpy==2.5.3`, `pytest==9.1.1` and `ruff==0.16.10`. There is no torchvision, Pillow or matplotlib: the shapes, the transformations and the picture files are written by the project. NumPy is installed because PyTorch uses it when present, and the code never imports it. Nothing is imported from another mini-project.

## Tests

```sh
docker compose run --rm python-test
```

It runs `ruff check`, `ruff format --check` and `pytest` (38 tests, 10 to 30 seconds of pytest on the machine where they were written, depending on its load, with PyTorch limited to 2 threads). The three networks are trained once and every test reads that one experiment.

| Criterion | What the tests check |
| --- | --- |
| MP-AI-8.1 | the hand-written convolution with the Sobel filter equals `torch.nn.functional.conv2d` on a generated image, also with 5 stride and padding variants and 3 filters, the output size follows the formula, and the filter is not flipped |
| MP-AI-8.2 | the CNN reaches at least 95% on held-out images, the two networks have parameter counts within 10% of each other, and the fully connected network is at least 30 points worse than the CNN on shifted images |
| MP-AI-8.3 | the results table has the accuracy on centred, shifted and rotated images with and without augmentation, augmentation gains at least 10 points on rotated images, and the filters and activation maps are written as valid PNG files |

## Demo

```sh
docker compose run --rm python-demo    # writes results/
```

The numbers below are the ones in [`results/results.md`](results/results.md).

**Convolution by hand against the framework.** A 20 x 20 image and the 3 x 3 Sobel filter:

| Stride | Padding | (W - F + 2P) / S + 1 | Framework output | Same numbers |
| ---: | ---: | ---: | ---: | :---: |
| 1 | 0 | 18 x 18 | 18 x 18 | yes |
| 1 | 1 | 20 x 20 | 20 x 20 | yes |
| 2 | 0 | 9 x 9 | 9 x 9 | yes |
| 2 | 1 | 10 x 10 | 10 x 10 | yes |
| 3 | 2 | 8 x 8 | 8 x 8 | yes |

| Input | Sobel x (vertical edges) | Sobel y (horizontal edges) |
| :---: | :---: | :---: |
| ![input](results/edge-input.png) | ![sobel x](results/edge-sobel-x.png) | ![sobel y](results/edge-sobel-y.png) |

**CNN against a fully connected network.** Both are trained on 1200 centred shapes and measured on 800 images they never saw:

| Model | Parameters | Held-out, centred | Held-out, shifted |
| --- | ---: | ---: | ---: |
| CNN | 1932 | 99.9% | 93.3% |
| Fully connected (MLP) | 2029 | 99.9% | 5.1% |

Both learn the centred shapes. When the shapes move 2 to 4 pixels, the CNN keeps 93.3% and the fully connected network falls to 5.1%, which is below the 25% of a random guess: it is not guessing, it is systematically wrong. Each of its weights belongs to one pixel position, so a moved shape lights up pixels that meant something else during training.

**Augmentation.** The same CNN, from the same starting weights, trained with random shifts and rotations:

| Training of the CNN | Centred | Shifted | Rotated |
| --- | ---: | ---: | ---: |
| without augmentation | 99.9% | 93.3% | 62.5% |
| with augmentation | 97.5% | 94.9% | 84.9% |

**What the first layer learned.** The 8 learned filters (grey is 0, white positive, black negative), one test image, and the 8 activation maps it produces:

![filters](results/filters.png)

![input](results/input.png)

![activation maps](results/activation-maps.png)

![loss curve](results/loss-curve.svg)

There is no dashboard: the tables and pictures in [`results/`](results/) are the result.

## Limits

- The dataset is a toy: 20 x 20 images, four clean shapes, 1200 training images. Accuracy here says nothing about photographs.
- The CNN is not perfectly shift-invariant: it loses 6.6 points on shifted images. The zeros of the padding at the border and the fixed 2 x 2 grid of the pooling make a moved shape produce slightly different numbers.
- Most of the shift robustness comes from the global average pooling at the end, together with the shared weights. During development, a variant that flattened the last maps into a linear layer (one weight per position) fell to about 8% on the shifted images, like the fully connected network. That variant is not in the code and not in the committed results.
- Augmentation is not free: centred accuracy drops from 99.9% to 97.5% and the training loss is still falling after 20 epochs (0.296), because the task is harder and the network and the number of epochs are the same. On rotated images it reaches 84.9%, not 100%.
- With 8 filters of 3 x 3 trained on little data, the learned filters are noisier than the textbook edge detectors. Some look like edge filters, others only measure brightness.
- The numbers are reproducible on the same Docker image (fixed seeds, 2 threads, deterministic algorithms). Another CPU or PyTorch version may change the last decimals, which is why the tests use thresholds and not exact values.
- No ResNet, transfer learning, detection or segmentation: the docs page says what they add.
