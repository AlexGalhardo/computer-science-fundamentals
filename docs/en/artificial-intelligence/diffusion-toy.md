# Diffusion toy

> Versão em português: [docs/pt/artificial-intelligence/diffusion-toy.md](../../pt/artificial-intelligence/diffusion-toy.md) · Versión en español: [docs/es/artificial-intelligence/diffusion-toy.md](../../es/artificial-intelligence/diffusion-toy.md)

Mini-project MP-AI-5, in [`projects/artificial-intelligence/diffusion-toy`](../../../projects/artificial-intelligence/diffusion-toy). It teaches how an image model learns to remove noise, on two-dimensional points instead of pixels. The background is section 12 of [the area page](README.md#12-image-generation), with the Gaussian distribution from [section 2](README.md#2-probability-and-statistics) and backpropagation from [section 6](README.md#6-gradient-descent-and-backpropagation).

## The problem

Drawing a plausible image in one go is hard. Removing a little noise from an image that is almost clean is easy. A diffusion model turns the hard problem into the easy one, repeated many times: it learns to remove a little noise, and then it is applied over and over, starting from nothing but noise.

An image of 64 x 64 pixels is 12,288 numbers, and nobody can look at a space with 12,288 dimensions. So here an "image" has 2 numbers: it is a point (x, y), and the "pictures worth generating" are the points of a ring of radius 1. Everything else is the real method, following the paper "Denoising Diffusion Probabilistic Models" (Ho, Jain and Abbeel, 2020), and because the data is 2D each step can be drawn.

```text
forward (fixed, nothing to learn):   ring  ->  blurry ring  ->  ...  ->  noise
reverse (a trained network):         noise ->  ...  ->  blurry ring  ->  ring
```

## The data

4000 points on a ring: a random angle, and a radius of 1 plus a small jitter (standard deviation 0.03), because real data is never perfectly clean. The ring was chosen because the distance from any point p to it is exact:

```text
distance = | length of p - 1 |
p = (0.6, 0.9):   length = sqrt(0.36 + 0.81) = 1.082    distance = 0.082
```

The mean of this distance over a cloud of points says how well the cloud sits on the ring. It is the number the acceptance test uses.

## Forward process: adding noise step by step

Each step shrinks the point a little and adds a little Gaussian noise:

```text
x_t = sqrt(1 - beta_t) x_(t-1) + sqrt(beta_t) noise          noise ~ normal(0, 1), a fresh draw each step
```

`beta_t` is the variance of the noise of step t. The shrinking is what keeps the cloud from growing forever. If the variance was 1 before the step, after it the variance is (1 - beta) x 1 + beta x 1 = 1. So the process is pulled towards one fixed destination, a normal distribution with mean 0 and variance 1, whatever the starting shape.

The list of betas is the **noise schedule**. Here there are 100 steps and beta grows in a straight line from 0.001 to 0.2.

Two more names:

- `alpha_t = 1 - beta_t`: the share of the previous point that survives step t.
- `alpha_bar_t = alpha_1 x alpha_2 x ... x alpha_t`: the share of the **original** point that survives t steps.

| Step t | beta_t | alpha_bar_t | signal = sqrt(alpha_bar_t) | noise = sqrt(1 - alpha_bar_t) |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0.0000 | 1.000000 | 1.0000 | 0.0000 |
| 10 | 0.0191 | 0.903813 | 0.9507 | 0.3101 |
| 25 | 0.0492 | 0.527916 | 0.7266 | 0.6871 |
| 50 | 0.0995 | 0.074197 | 0.2724 | 0.9622 |
| 75 | 0.1497 | 0.002578 | 0.0508 | 0.9987 |
| 100 | 0.2000 | 0.000020 | 0.0045 | 1.0000 |

### The shortcut

A sum of Gaussian noises is again Gaussian noise. So the t small noises of t steps can be replaced by one bigger noise, and any step is reached in one jump from the clean point:

```text
x_t = sqrt(alpha_bar_t) x_0 + sqrt(1 - alpha_bar_t) noise

x_0 = (1, 0), t = 25, noise = (0.5, -1.0):
x_25 = 0.7266 x (1, 0) + 0.6871 x (0.5, -1.0) = (1.0702, -0.6871)
```

Training depends on this shortcut: each example costs one multiplication instead of up to 100 steps. A test walks 20000 points step by step, sends 20000 others with the shortcut, and checks that the two clouds have the same statistics at steps 10, 25, 50 and 100.

![forward process](../../../projects/artificial-intelligence/diffusion-toy/results/forward.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 0.024 | 1.000 | 0.030 | 0.496 | 0.504 |
| 10 | 0.240 | 1.005 | 0.301 | 0.544 | 0.556 |
| 25 | 0.433 | 1.088 | 0.537 | 0.736 | 0.735 |
| 50 | 0.525 | 1.222 | 0.640 | 0.957 | 0.947 |
| 75 | 0.539 | 1.254 | 0.651 | 1.016 | 0.981 |
| 100 | 0.546 | 1.261 | 0.658 | 1.002 | 1.020 |

The variance of each coordinate goes from 0.5 (a ring of radius 1) to 1 (the noise), exactly as the shortcut says: at step 25, 0.528 x 0.5 + 0.472 x 1 = 0.736.

### Why 100 steps here and 1000 in the paper

The reverse process, below, assumes that undoing one step is again a small Gaussian move. That is only a good approximation when each forward step adds very little noise. The paper uses 1000 steps with beta from 0.0001 to 0.02, because images are complicated and need that care. Here there are 10 times fewer steps and each beta is 10 times bigger, so the total amount of noise is about the same and the end is still pure noise. Each step is rougher. For a ring that costs a little sharpness. For a photograph it would not be acceptable.

### Is the last step really noise?

The acceptance criterion says that after the last step the points are statistically indistinguishable from Gaussian noise. The test takes 20000 points of the ring, noises them through the 100 steps one by one, and compares the result with a standard normal in seven ways:

| Check | Expected for standard Gaussian noise | Measured (x, y) | Tolerance |
| --- | ---: | ---: | ---: |
| Mean | 0 | -0.0033, -0.0110 | 0.0283 |
| Variance | 1 | 1.0021, 1.0202 | 0.0400 |
| Correlation between x and y | 0 | -0.0031 | 0.0283 |
| Correlation with the starting point | 0 | -0.0006, -0.0069 | 0.0283 |
| Share within 1 standard deviation | 0.6827 | 0.6804, 0.6792 | 0.0132 |
| Share within 2 standard deviations | 0.9545 | 0.9537, 0.9520 | 0.0059 |
| Kolmogorov-Smirnov statistic | 0 | 0.0038, 0.0113 | 0.0138 |

The tolerances are about 4 standard errors for 20000 points. A measurement made on a sample is never exactly the true value, and its typical error shrinks with 1 / sqrt(n): for the mean of 20000 values of variance 1 it is 1 / sqrt(20000) = 0.0071, and 4 times that is 0.0283.

The **Kolmogorov-Smirnov statistic** compares the whole shape, not only two numbers. Sort the values. After the i-th of n values the sample says "a share i / n of me is below this value", and the normal distribution has its own answer for the same value, computed with `math.erf`. The statistic is the largest gap between the two answers. For a sample that really is normal it stays below 1.95 / sqrt(n) = 0.0138 in 999 of 1000 cases.

The same test also proves that the checks are not blind. The clean ring fails the Kolmogorov-Smirnov check, step 25 fails the variance check and is still correlated with its starting point, and 20000 values drawn directly from a normal pass everything.

**What "indistinguishable" means, honestly.** It means "these checks cannot tell the two apart with 20000 points". It does not mean that nothing is left. The original point is still inside x_100, multiplied by sqrt(alpha_bar_100) = 0.0045. That would show up as a correlation of about 0.003 with the starting point, and 20000 points can only see correlations above about 0.03. A sample of the order of a million points would see it. The schedule is built so that this leftover is negligible, not zero.

## The network and the training objective

The network receives a noisy point and the step number, and answers with two numbers: its guess of the noise that is inside that point.

```text
input (18 numbers): x_t (2)  +  time embedding of t (16)
layers:             18 -> 64 -> 64 -> 64 -> 2      tanh after each hidden layer
parameters:         9666
```

**Why the step is an input.** At step 5 the point is almost clean and the noise is a small correction. At step 95 the point is almost pure noise. The network must know which case it is in. One raw number would be a poor input, so the step is described by 8 sines and 8 cosines of different speeds: the slow waves say "early or late" and the fast ones separate neighbouring steps. It is the same idea as the position encoding of a transformer.

**Training** repeats five lines, 6000 times, on batches of 256 points:

```text
1. take clean points x_0 from the data
2. pick a random step t for each one, from 1 to 100
3. draw the noise and jump to x_t with the shortcut
4. ask the network for the noise, given x_t and t
5. loss = mean of (true noise - guess)^2, and move the weights to make it smaller
```

The labels (the noise) were made by us. So this is ordinary supervised learning with a mean squared error, as in section 4 of the area page.

![training loss](../../../projects/artificial-intelligence/diffusion-toy/results/loss.svg)

| Iterations | Loss |
| ---: | ---: |
| 1 to 200 | 0.2465 |
| 801 to 1000 | 0.1877 |
| 2801 to 3000 | 0.1731 |
| 5801 to 6000 | 0.1702 |

A network that always answers "no noise" (zeros) would have a loss of 1, the variance of the noise. The loss settles near 0.17 and cannot reach 0: the same noisy point can come from many different pairs of clean point and noise, so the best possible answer is an average of them, and the average is never exactly the noise that was drawn.

### No framework: backpropagation and Adam by hand

The only library is NumPy, for arrays and matrix products. For one layer `out = in @ W + b`, with `g` meaning "how much the loss changes when `out` changes":

```text
dLoss/dW = in.T @ g          dLoss/db = sum of g over the batch          g for the layer before = g @ W.T
crossing a tanh multiplies g by (1 - tanh^2)
```

**Gradient check.** A hand-written derivative is easy to get wrong, so a test compares it with a slope measured with no calculus at all: nudge one weight by +h and by -h, and compute (loss_plus - loss_minus) / 2h. With h = 0.000001 and 64-bit floats the two agree for every one of the 195 weights of a small network, with a relative error below 0.00001.

**Adam** replaces the single step size of plain gradient descent. For each weight it keeps a running mean of the gradient (the direction) and of the squared gradient (the usual size), and divides the first by the square root of the second. Every weight then moves about one learning rate per step, whatever the scale of its gradient. The learning rate starts at 0.003 and falls smoothly to 0.

## Reverse process: generating

Generation starts from 2000 points of pure Gaussian noise and applies this step 100 times, from t = 100 down to t = 1:

```text
x_(t-1) = ( x_t - (1 - alpha_t) / sqrt(1 - alpha_bar_t) x guess ) / sqrt(alpha_t)  +  sigma_t z
```

- `guess` is the noise the network sees in x_t. Only the part that belongs to this one step is removed.
- Dividing by `sqrt(alpha_t)` undoes the shrinking of the forward step.
- `sigma_t z` adds a little fresh noise back, with `sigma_t = sqrt(beta_t)` (one of the two choices of the paper). The network gives an average answer, and without this noise the points would slide to a blurry average. At the last step z = 0, because the result must be clean.

One step with numbers, at t = 25, for the point of the shortcut example and a network that guesses the noise exactly:

```text
beta_25 = 0.0492    sqrt(alpha_25) = 0.9751    (1 - alpha_25) / sqrt(1 - alpha_bar_25) = 0.0492 / 0.6871 = 0.0716
x = (1.0702 - 0.0716 x 0.5) / 0.9751 = 1.0608
y = (-0.6871 - 0.0716 x (-1.0)) / 0.9751 = -0.6312
then add sigma_25 z, with sigma_25 = sqrt(0.0492) = 0.2218
```

The point moved only a little, from (1.0702, -0.6871) to about (1.0608, -0.6312). No single step does the work. A hundred of them do.

![reverse process](../../../projects/artificial-intelligence/diffusion-toy/results/reverse.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0.535 | 1.244 | 0.647 | 0.967 | 0.995 |
| 75 | 0.543 | 1.252 | 0.654 | 0.971 | 1.023 |
| 50 | 0.509 | 1.206 | 0.622 | 0.936 | 0.905 |
| 25 | 0.449 | 1.099 | 0.556 | 0.772 | 0.744 |
| 10 | 0.256 | 0.992 | 0.320 | 0.552 | 0.534 |
| 0 | 0.047 | 0.987 | 0.066 | 0.496 | 0.482 |

Read this table next to the one of the forward process: the rows match, in the opposite order. The reverse process walks back through the same clouds. Most of the visible change happens in the last 25 steps, as most of the destruction happened in the first 25.

### Did it land on the ring?

| Points | Mean distance to the ring |
| --- | ---: |
| Real data (the training set) | 0.024 |
| Generated (step 0 of the reverse process) | 0.047 |
| Pure noise (step 100, where generation starts) | 0.535 |
| Threshold of the test | 0.10 |

The documented threshold is **0.10**: about twice the measured 0.047, and less than a fifth of the distance of pure noise. The generated points are 11 times closer to the ring than the noise they started from, and about twice as far as the real data. The generated ring is thicker than the real one (spread of the radius 0.066 against 0.030), which comes from the error of a small network and from the coarse steps.

A small distance is not enough. A model that put every point on the same spot of the ring would also have it. So a second test cuts the plane into 12 equal slices and requires each one to hold between 50% and 150% of an even share. Measured: 137 to 182 points per slice, with 167 for a perfectly even ring. A third test checks that the points are new: none of them is a copy of a training point.

### Why diffusion is slow to generate

The network was called 100 times to produce one batch of points. A GAN or the decoder of an autoencoder is called once. That is the price of splitting a hard problem into easy steps, and it is why so much work went into samplers that need fewer steps.

## What a real image model adds

- **Pixels instead of 2D points.** The same formulas, applied to every number of the image tensor at once. A 512 x 512 colour image has 786,432 of them.
- **A U-Net (or a transformer) instead of an MLP.** The network that guesses the noise must understand the picture, so it is built from convolutions that shrink the image, process it, and grow it back, with shortcuts between the two halves. It has hundreds of millions of parameters instead of 9666.
- **Latent diffusion.** The whole process runs on the small latent of an autoencoder (for example 64 x 64 x 4 numbers instead of 512 x 512 x 3), and the decoder turns the result into pixels only at the end. It costs much less computation.
- **Text conditioning.** The network receives a third input besides the noisy image and the step: the prompt, encoded by a text model and read through cross-attention. Here there is no condition, so the model can only ever draw the ring.
- **Fewer steps.** Samplers that jump over steps generate with a few tens of calls instead of 1000.
- **Details of training at scale.** Other noise schedules, a running average of the weights, and far more data and steps.

None of them changes the three ideas shown here: destroy the data with a known noise, learn to guess that noise, and generate by removing it little by little.

## Run it

```sh
cd projects/artificial-intelligence/diffusion-toy
./setup-unix-diffusion-toy.sh          # build, tests, demo
docker compose run --rm python-test    # the tests only
docker compose run --rm python-demo    # rewrites results/
```

All the numbers on this page are in [`results/results.md`](../../../projects/artificial-intelligence/diffusion-toy/results/results.md), written by the demo with fixed seeds.
