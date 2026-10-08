# Results: diffusion-toy

Generated with `docker compose run --rm python-demo`. Every seed is fixed, so a new run on the same image writes the same numbers.

- Data: 4000 points on a ring of radius 1, with a radial jitter of 0.03.
- Schedule: 100 steps, beta from 0.001 to 0.2 in a straight line.
- Network: 18 -> 64 -> 64 -> 64 -> 2 (tanh), 9666 parameters.
- Training: 6000 iterations of 256 points, Adam, learning rate 0.003 falling to 0.

## The noise schedule

`signal` is what multiplies the original point and `noise` is what multiplies the Gaussian noise in the shortcut formula.

| Step t | beta_t | alpha_bar_t | signal = sqrt(alpha_bar_t) | noise = sqrt(1 - alpha_bar_t) |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0.0000 | 1.000000 | 1.0000 | 0.0000 |
| 10 | 0.0191 | 0.903813 | 0.9507 | 0.3101 |
| 25 | 0.0492 | 0.527916 | 0.7266 | 0.6871 |
| 50 | 0.0995 | 0.074197 | 0.2724 | 0.9622 |
| 75 | 0.1497 | 0.002578 | 0.0508 | 0.9987 |
| 100 | 0.2000 | 0.000020 | 0.0045 | 1.0000 |

## Forward process (MP-AI-5.1)

20000 points of the ring, noised step by step. Figure: [forward.svg](forward.svg) (the first 300 points).

![forward process](forward.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 0.024 | 1.000 | 0.030 | 0.496 | 0.504 |
| 10 | 0.240 | 1.005 | 0.301 | 0.544 | 0.556 |
| 25 | 0.433 | 1.088 | 0.537 | 0.736 | 0.735 |
| 50 | 0.525 | 1.222 | 0.640 | 0.957 | 0.947 |
| 75 | 0.539 | 1.254 | 0.651 | 1.016 | 0.981 |
| 100 | 0.546 | 1.261 | 0.658 | 1.002 | 1.020 |

### Is step 100 Gaussian noise?

Tolerances are about 4 standard errors for 20000 points.

| Check | Expected for standard Gaussian noise | Measured (x, y) | Tolerance |
| --- | ---: | ---: | ---: |
| Mean | 0 | -0.0033, -0.0110 | 0.0283 |
| Variance | 1 | 1.0021, 1.0202 | 0.0400 |
| Correlation between x and y | 0 | -0.0031 | 0.0283 |
| Correlation with the starting point | 0 | -0.0006, -0.0069 | 0.0283 |
| Share within 1 standard deviation | 0.6827 | 0.6804, 0.6792 | 0.0132 |
| Share within 2 standard deviations | 0.9545 | 0.9537, 0.9520 | 0.0059 |
| Kolmogorov-Smirnov statistic | 0 | 0.0038, 0.0113 | 0.0138 |

Checks that failed: none. Signal left at step 100: sqrt(alpha_bar) = 0.0045.

## Training loss

Mean squared error between the true noise and the predicted noise, averaged over each block of 200 iterations. Figure: [loss.svg](loss.svg).

![training loss](loss.svg)

| Iterations | Loss |
| ---: | ---: |
| 1 to 200 | 0.2465 |
| 201 to 400 | 0.2223 |
| 401 to 600 | 0.2079 |
| 801 to 1000 | 0.1877 |
| 1801 to 2000 | 0.1814 |
| 2801 to 3000 | 0.1731 |
| 3801 to 4000 | 0.1714 |
| 4801 to 5000 | 0.1733 |
| 5801 to 6000 | 0.1702 |

## Reverse process (MP-AI-5.2 and MP-AI-5.3)

2000 points generated from pure noise (seed 7). Figure: [reverse.svg](reverse.svg) (the first 300 points).

![reverse process](reverse.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0.535 | 1.244 | 0.647 | 0.967 | 0.995 |
| 75 | 0.543 | 1.252 | 0.654 | 0.971 | 1.023 |
| 50 | 0.509 | 1.206 | 0.622 | 0.936 | 0.905 |
| 25 | 0.449 | 1.099 | 0.556 | 0.772 | 0.744 |
| 10 | 0.256 | 0.992 | 0.320 | 0.552 | 0.534 |
| 0 | 0.047 | 0.987 | 0.066 | 0.496 | 0.482 |

### Mean distance to the ring

| Points | Mean distance to the ring |
| --- | ---: |
| Real data (the training set) | 0.024 |
| Generated (step 0 of the reverse process) | 0.047 |
| Pure noise (step 100, where generation starts) | 0.535 |
| Threshold of the test | 0.10 |

Slices of the ring with points: 12 of 12. Points per slice: smallest 137, largest 182, 167 if perfectly even.
