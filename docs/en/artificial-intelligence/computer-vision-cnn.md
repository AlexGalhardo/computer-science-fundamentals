# Computer vision with a CNN

> Versão em português: [docs/pt/artificial-intelligence/computer-vision-cnn.md](../../pt/artificial-intelligence/computer-vision-cnn.md) · Versión en español: [docs/es/artificial-intelligence/computer-vision-cnn.md](../../es/artificial-intelligence/computer-vision-cnn.md)

Mini-project MP-AI-8, in [`projects/artificial-intelligence/computer-vision-cnn`](../../../projects/artificial-intelligence/computer-vision-cnn). It teaches how a network sees: images as numbers, convolution, pooling and learned filters. The background is section 16 of [the area page](README.md#16-computer-vision). The framework is PyTorch, introduced in [section 14](README.md#14-what-a-framework-gives-you-pytorch), running on the CPU.

## The problem

A program that recognises a triangle cannot be written as a list of rules, because the triangle may be bigger, thinner, a little to the left or slightly turned. We want a network that learns it from examples. The first idea, connecting every pixel to every neuron, works only while the shape stays where it was during training. This mini-project shows why, and what the convolutional network does differently.

## An image is a table of numbers

Every image here is a 20 x 20 greyscale picture: 400 numbers from 0 (black) to 1 (white). The project draws them itself, from the geometry of four shapes (circle, square, triangle, cross), with a random size, line thickness, brightness, a position that varies by 1 pixel, and noise. Nothing is downloaded, and the same seed always gives the same images.

PyTorch wants images in batches, as a tensor with four dimensions: images x channels x height x width. The 1200 training images are one tensor of shape `1200 x 1 x 20 x 20`. The channel dimension is 1 because the image is greyscale. A colour image would have 3.

## Convolution by hand

A filter is a small table of weights. The convolution places it over a patch of the image, multiplies each weight by the pixel under it, adds the products, writes the sum, and moves on. `python/conv.py` does exactly that with four loops: two choose the position and two walk over the filter.

A small case that can be checked on paper. The image has 6 columns, dark on the left and bright on the right, and the filter is the Sobel filter for vertical edges:

```text
one row of the image        Sobel x
 0  0  0  1  1  1          -1  0  1
 (all 6 rows are equal)    -2  0  2
                           -1  0  1

filter over columns 0-2:  all zeros                          ->  0
filter over columns 1-3:  right column is 1: 1 + 2 + 1       ->  4
filter over columns 2-4:  right column is 1: 1 + 2 + 1       ->  4
filter over columns 3-5:  left -1 -2 -1, right 1 + 2 + 1     ->  0
```

The output row is `0 4 4 0`: a large number where the brightness changes and zero where the image is flat. That is an edge detector, and it is one of the tests.

Two details that the code states:

- **The filter is not flipped.** Mathematics calls this operation cross-correlation and keeps the word convolution for the version with the filter turned around. Deep learning libraries use the one without the flip and call it convolution. Since the weights are learned, the flip would change nothing.
- **Output size.** With an image of side W, a filter of side F, padding P (zeros added on each border) and stride S (the jump between positions), the output has side `(W - F + 2P) / S + 1`, rounded down.

The demo runs the hand-written version and `torch.nn.functional.conv2d` on the same image and compares them:

| Stride | Padding | (W - F + 2P) / S + 1 | Framework output | Same numbers |
| ---: | ---: | ---: | ---: | :---: |
| 1 | 0 | 18 x 18 | 18 x 18 | yes |
| 1 | 1 | 20 x 20 | 20 x 20 | yes |
| 2 | 0 | 9 x 9 | 9 x 9 | yes |
| 2 | 1 | 10 x 10 | 10 x 10 | yes |
| 3 | 2 | 8 x 8 | 8 x 8 | yes |

| Input | Sobel x (vertical edges) | Sobel y (horizontal edges) |
| :---: | :---: | :---: |
| ![input](../../../projects/artificial-intelligence/computer-vision-cnn/results/edge-input.png) | ![sobel x](../../../projects/artificial-intelligence/computer-vision-cnn/results/edge-sobel-x.png) | ![sobel y](../../../projects/artificial-intelligence/computer-vision-cnn/results/edge-sobel-y.png) |

Grey is 0, white is "dark to bright" and black is "bright to dark". Sobel x sees only the vertical sides of the square, Sobel y only the horizontal ones.

## The two networks

**The CNN** repeats convolution, ReLU and max pooling twice, then averages each map and decides:

```text
1 x 20 x 20  -> conv 3x3, 8 filters  -> 8 x 20 x 20  -> max pool 2x2 -> 8 x 10 x 10
             -> conv 3x3, 24 filters -> 24 x 10 x 10 -> max pool 2x2 -> 24 x 5 x 5
             -> average of each map  -> 24 numbers   -> linear       -> 4 scores
```

- **Shared weights.** The first layer has 8 filters of 3 x 3 weights plus 8 biases: 8 x 9 + 8 = 80 parameters, whatever the size of the image. The same 9 weights are used at all the 400 positions, so a pattern learned in one place is found everywhere.
- **Max pooling** keeps the largest value of each 2 x 2 block. `[[1, 3], [2, 0]]` becomes `3`. It halves each side, has no parameters, and a pattern that moves 1 pixel often stays inside the same block.
- **Global average pooling** turns each of the 24 final maps into one number, its mean. That number says how much of a pattern is in the image, and no longer where.

Parameters: 80 + (24 x 3 x 3 x 8 + 24) + (24 x 4 + 4) = 80 + 1752 + 100 = **1932**.

**The fully connected network (MLP)** connects the 400 pixels to 5 hidden neurons and those to the 4 scores: (400 x 5 + 5) + (5 x 4 + 4) = 2005 + 24 = **2029** parameters, 5.0% more than the CNN. Each of its weights belongs to one pixel position.

Both are trained in the same way: 20 epochs, mini-batches of 32 images cut by hand from a shuffled order, the Adam optimiser, cross-entropy loss, and the five steps of every PyTorch loop (predict, compute the loss, `zero_grad`, `backward`, `step`).

## Result 1: when the shape moves

Both networks are trained on 1200 centred shapes and measured on 800 images generated from another seed, first centred as in training, then with every shape moved 2 to 4 pixels on each axis.

| Model | Parameters | Held-out, centred | Held-out, shifted |
| --- | ---: | ---: | ---: |
| CNN | 1932 | 99.9% | 93.3% |
| Fully connected (MLP) | 2029 | 99.9% | 5.1% |

On centred images there is no difference: with this easy dataset, both are nearly perfect. On shifted images the fully connected network falls to 5.1%. A random guess among 4 classes would get 25%, so it is not guessing: it is systematically wrong. What it learned is "these pixels are bright for a cross", and a moved shape lights up pixels that meant something else.

The CNN keeps 93.3% because its filters find the same corners and line ends wherever they are, and the average at the end throws the position away. It is honest to say what this does not show:

- The CNN is not perfectly shift-invariant. It loses 6.6 points. The zeros of the padding at the border and the fixed 2 x 2 grid of the pooling make a moved shape produce slightly different numbers.
- The convolution alone is not enough. During development, a variant that flattened the 24 x 5 x 5 values into the linear layer (one weight per position, the classic layout) fell to about 8% on the shifted set, like the MLP. The global average is what turns "the response moves with the shape" into "the answer does not change". That variant is not in the code or in the committed results.

## Result 2: augmentation

A triangle moved a few pixels or turned 20 degrees is still a triangle. Data augmentation applies such random changes to each training batch, so the network never sees the same image twice and learns to ignore them. Here each training image gets a random shift of up to 4 pixels and a random rotation of up to 30 degrees. The held-out images are never augmented. The CNN is trained again from the same starting weights, so augmentation is the only difference:

| Training of the CNN | Centred | Shifted | Rotated |
| --- | ---: | ---: | ---: |
| without augmentation | 99.9% | 93.3% | 62.5% |
| with augmentation | 97.5% | 94.9% | 84.9% |

Rotation is where it matters: a convolution has no built-in tolerance to it, and the network trained only on upright shapes gets 62.5% on shapes turned 10 to 30 degrees. With augmentation it reaches 84.9%. The gain on shifted images is small (1.6 points), because the architecture already handled shifts. And there is a price: on centred images accuracy drops from 99.9% to 97.5%. The task became harder and the network and the 20 epochs stayed the same, as the loss shows:

| Model | Epoch 1 | Epoch 5 | Epoch 10 | Epoch 15 | Epoch 20 |
| --- | ---: | ---: | ---: | ---: | ---: |
| CNN | 1.358 | 0.706 | 0.140 | 0.036 | 0.016 |
| Fully connected (MLP) | 0.855 | 0.020 | 0.005 | 0.002 | 0.001 |
| CNN + augmentation | 1.372 | 1.040 | 0.584 | 0.379 | 0.296 |

![loss curve](../../../projects/artificial-intelligence/computer-vision-cnn/results/loss-curve.svg)

The fully connected network has the lowest training loss of all, and the worst result on shifted images. A low training loss says the network fits the images it saw, not that it learned the right idea.

## What the network learned

Nobody gave the CNN the Sobel filter. These are the 8 filters of its first layer after training (without augmentation), each enlarged. Grey is a weight of 0, white a positive weight, black a negative one:

![filters](../../../projects/artificial-intelligence/computer-vision-cnn/results/filters.png)

This is one test image and the 8 activation maps (feature maps) it produces, in the same order as the filters. A bright pixel means "this filter found its pattern here":

![input](../../../projects/artificial-intelligence/computer-vision-cnn/results/input.png)

![activation maps](../../../projects/artificial-intelligence/computer-vision-cnn/results/activation-maps.png)

The map with the strongest response, from filter 3:

![activation map](../../../projects/artificial-intelligence/computer-vision-cnn/results/activation-map.png)

Filter 3 is dark on the left and bright on the right, and its map lights up on the left side of the triangle: it works as an edge detector. Filters 6 and 8 are almost all positive, and their maps are a blurred copy of the shape: they measure brightness. With 8 tiny filters and 1200 simple images, the filters are noisier than the clean edge detectors shown in textbooks, which come from large networks trained on millions of photographs.

## What a real vision system adds

- **Bigger and deeper networks.** ResNet stacks dozens or hundreds of layers, made trainable by shortcut connections. This CNN has 1932 parameters, a ResNet-50 has about 25 million.
- **Transfer learning.** Instead of training from zero, a network already trained on millions of images is reused, and only its last layer is trained, or all of it with a small learning rate.
- **Other tasks.** Detection gives a box and a label for each object, and segmentation gives a label for each pixel. Here there is one label per image.
- **Real data.** Colour photographs, varied light, cluttered backgrounds, and many more augmentations (mirroring, cropping, colour changes).
- **GPUs and data loaders.** Batches are loaded and augmented in parallel, and training runs on a GPU. Here everything fits in memory and runs on the CPU in seconds.

None of this is implemented here. The pieces are the same: filters that slide, pooling, and a loss that training reduces.

## Run it

```sh
cd projects/artificial-intelligence/computer-vision-cnn
./setup-unix-computer-vision-cnn.sh        # or ./setup-windows-computer-vision-cnn.ps1
docker compose run --rm python-test        # only the tests
docker compose run --rm python-demo        # trains the networks and rewrites results/
```

The only requirement is Docker. The containers have no network access, and the seeds, the 2 threads and the deterministic algorithms of PyTorch are fixed, so the demo writes the same numbers at every run on the same image.
