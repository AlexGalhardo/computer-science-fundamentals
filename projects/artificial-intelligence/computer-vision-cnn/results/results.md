# computer-vision-cnn: results

Written by `docker compose run --rm python-demo`. Seeds are fixed, so the numbers are the same at every run on the same image.

- Images: 20 x 20 greyscale, classes: circle, square, triangle, cross.
- Training set: 1200 centred images. Each held-out set: 800 images from another seed.
- Shifted set: 2 to 4 pixels away from the centre on each axis. Rotated set: 10 to 30 degrees.
- Training: 20 epochs, batches of 32, Adam, learning rate 0.01, seed 0.

## Convolution by hand against the framework (MP-AI-8.1)

A 20 x 20 image and the 3 x 3 Sobel filter (W = 20, F = 3).

| Stride | Padding | (W - F + 2P) / S + 1 | Framework output | Same numbers |
| ---: | ---: | ---: | ---: | :---: |
| 1 | 0 | 18 x 18 | 18 x 18 | yes |
| 1 | 1 | 20 x 20 | 20 x 20 | yes |
| 2 | 0 | 9 x 9 | 9 x 9 | yes |
| 2 | 1 | 10 x 10 | 10 x 10 | yes |
| 3 | 2 | 8 x 8 | 8 x 8 | yes |

| Input | Sobel x (vertical edges) | Sobel y (horizontal edges) |
| :---: | :---: | :---: |
| ![input](edge-input.png) | ![sobel x](edge-sobel-x.png) | ![sobel y](edge-sobel-y.png) |

Grey is 0 (no edge), white is dark to bright, black is bright to dark.

## CNN against a fully connected network (MP-AI-8.2)

| Model | Parameters | Held-out, centred | Held-out, shifted |
| --- | ---: | ---: | ---: |
| CNN | 1932 | 99.9% | 93.3% |
| Fully connected (MLP) | 2029 | 99.9% | 5.1% |

The two parameter counts differ by 5.0%.

## Augmentation (MP-AI-8.3)

| Training of the CNN | Centred | Shifted | Rotated |
| --- | ---: | ---: | ---: |
| without augmentation | 99.9% | 93.3% | 62.5% |
| with augmentation | 97.5% | 94.9% | 84.9% |

## Training loss

| Model | Epoch 1 | Epoch 5 | Epoch 10 | Epoch 15 | Epoch 20 |
| --- | ---: | ---: | ---: | ---: | ---: |
| CNN | 1.358 | 0.706 | 0.140 | 0.036 | 0.016 |
| Fully connected (MLP) | 0.855 | 0.020 | 0.005 | 0.002 | 0.001 |
| CNN + augmentation | 1.372 | 1.040 | 0.584 | 0.379 | 0.296 |

![loss curve](loss-curve.svg)

## What the first layer learned (MP-AI-8.3)

The 8 filters (3 x 3) of the first layer of the CNN trained without augmentation. Grey is a weight of 0, white a positive weight, black a negative one:

![filters](filters.png)

One test image and the 8 activation maps it produces, in the same order as the filters:

![input](input.png)

![activation maps](activation-maps.png)

The map with the strongest response (filter 3):

![activation map](activation-map.png)
