# Results: big-o-lab

Generated at 2026-10-07T22:26:18.527Z with `docker compose run --rm ts-demo`.
Time is the median of 5 runs of the algorithm alone. Operation counts are exact.

## Machine

- CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- logical cores: 16
- memory: 15.6 GiB
- platform: linux x64
- runtime: Bun 1.4.2 (oven/bun:1.4.2)

## constant: read the middle element of an array

Counted operation: array reads. Closed formula: `1`.
Best fit: **O(1)**, relative error 0.00e+0.

| n | array reads | formula | time (ms) |
| ---: | ---: | ---: | ---: |
| 16 | 1 | 1 | 0.0004 |
| 32 | 1 | 1 | 0.0002 |
| 64 | 1 | 1 | 0.0002 |
| 128 | 1 | 1 | 0.0002 |
| 256 | 1 | 1 | 0.0002 |
| 512 | 1 | 1 | 0.0002 |
| 1,024 | 1 | 1 | 0.0007 |
| 2,048 | 1 | 1 | 0.0003 |
| 4,096 | 1 | 1 | 0.0002 |
| 8,192 | 1 | 1 | 0.0002 |
| 16,384 | 1 | 1 | 0.0001 |
| 32,768 | 1 | 1 | 0.0002 |

| candidate | relative error |
| --- | ---: |
| O(1) (best) | 0.00e+0 |
| O(log n) | 0.00e+0 |
| O(n) | 0.00e+0 |
| O(n log n) | 0.00e+0 |
| O(n^2) | 0.00e+0 |
| O(2^n) | does not fit |

## logarithmic: binary search for a missing value

Counted operation: halvings of the interval. Closed formula: `floor(log2 n) + 1`.
Best fit: **O(log n)**, relative error 0.00e+0.

| n | halvings of the interval | formula | time (ms) |
| ---: | ---: | ---: | ---: |
| 16 | 5 | 5 | 0.0006 |
| 32 | 6 | 6 | 0.0006 |
| 64 | 7 | 7 | 0.0006 |
| 128 | 8 | 8 | 0.0006 |
| 256 | 9 | 9 | 0.0015 |
| 512 | 10 | 10 | 0.0016 |
| 1,024 | 11 | 11 | 0.0017 |
| 2,048 | 12 | 12 | 0.0005 |
| 4,096 | 13 | 13 | 0.0004 |
| 8,192 | 14 | 14 | 0.0005 |
| 16,384 | 15 | 15 | 0.0006 |
| 32,768 | 16 | 16 | 0.0006 |

| candidate | relative error |
| --- | ---: |
| O(1) | 3.29e-1 |
| O(log n) (best) | 0.00e+0 |
| O(n) | 2.16e-1 |
| O(n log n) | 2.25e-1 |
| O(n^2) | 2.63e-1 |
| O(2^n) | does not fit |

## linear: sum of all elements

Counted operation: additions. Closed formula: `n`.
Best fit: **O(n)**, relative error 0.00e+0.

| n | additions | formula | time (ms) |
| ---: | ---: | ---: | ---: |
| 16 | 16 | 16 | 0.0026 |
| 32 | 32 | 32 | 0.0018 |
| 64 | 64 | 64 | 0.0058 |
| 128 | 128 | 128 | 0.0028 |
| 256 | 256 | 256 | 0.0059 |
| 512 | 512 | 512 | 0.0116 |
| 1,024 | 1,024 | 1,024 | 0.0249 |
| 2,048 | 2,048 | 2,048 | 0.0687 |
| 4,096 | 4,096 | 4,096 | 0.0926 |
| 8,192 | 8,192 | 8,192 | 0.0879 |
| 16,384 | 16,384 | 16,384 | 0.1168 |
| 32,768 | 32,768 | 32,768 | 0.2431 |

| candidate | relative error |
| --- | ---: |
| O(1) | 1.73e+0 |
| O(log n) | 1.14e+0 |
| O(n) (best) | 0.00e+0 |
| O(n log n) | 7.32e-2 |
| O(n^2) | 4.82e-1 |
| O(2^n) | does not fit |

## linearithmic: merge sort

Counted operation: elements written while merging. Closed formula: `n * ceil(log2 n) - 2^ceil(log2 n) + n`.
Best fit: **O(n log n)**, relative error 0.00e+0.

| n | elements written while merging | formula | time (ms) |
| ---: | ---: | ---: | ---: |
| 16 | 64 | 64 | 0.0416 |
| 32 | 160 | 160 | 0.0277 |
| 64 | 384 | 384 | 0.0561 |
| 128 | 896 | 896 | 0.1225 |
| 256 | 2,048 | 2,048 | 0.1803 |
| 512 | 4,608 | 4,608 | 0.3691 |
| 1,024 | 10,240 | 10,240 | 0.6700 |
| 2,048 | 22,528 | 22,528 | 1.2319 |
| 4,096 | 49,152 | 49,152 | 2.2686 |
| 8,192 | 106,496 | 106,496 | 5.0080 |
| 16,384 | 229,376 | 229,376 | 6.6093 |
| 32,768 | 491,520 | 491,520 | 13.7485 |

| candidate | relative error |
| --- | ---: |
| O(1) | 1.84e+0 |
| O(log n) | 1.26e+0 |
| O(n) | 7.79e-2 |
| O(n log n) (best) | 0.00e+0 |
| O(n^2) | 4.41e-1 |
| O(2^n) | does not fit |

## quadratic: count inversions comparing every pair

Counted operation: comparisons. Closed formula: `n * (n - 1) / 2`.
Best fit: **O(n^2)**, relative error 1.40e-4.

| n | comparisons | formula | time (ms) |
| ---: | ---: | ---: | ---: |
| 16 | 120 | 120 | 0.0160 |
| 32 | 496 | 496 | 0.0106 |
| 64 | 2,016 | 2,016 | 0.0294 |
| 128 | 8,128 | 8,128 | 0.1279 |
| 256 | 32,640 | 32,640 | 0.1528 |
| 512 | 130,816 | 130,816 | 0.7476 |
| 1,024 | 523,776 | 523,776 | 1.3044 |
| 2,048 | 2,096,128 | 2,096,128 | 6.2967 |
| 4,096 | 8,386,560 | 8,386,560 | 36.2592 |

| candidate | relative error |
| --- | ---: |
| O(1) | 2.10e+0 |
| O(log n) | 1.54e+0 |
| O(n) | 5.67e-1 |
| O(n log n) | 4.70e-1 |
| O(n^2) (best) | 1.40e-4 |
| O(2^n) | does not fit |

## exponential: enumerate every subset

Counted operation: subsets visited. Closed formula: `2^n`.
Best fit: **O(2^n)**, relative error 0.00e+0.

| n | subsets visited | formula | time (ms) |
| ---: | ---: | ---: | ---: |
| 1 | 2 | 2 | 0.0021 |
| 2 | 4 | 4 | 0.0025 |
| 4 | 16 | 16 | 0.0087 |
| 8 | 256 | 256 | 0.0231 |
| 16 | 65,536 | 65,536 | 1.4622 |

| candidate | relative error |
| --- | ---: |
| O(1) | 1.99e+0 |
| O(log n) | 1.40e+0 |
| O(n) | 8.68e-1 |
| O(n log n) | 6.99e-1 |
| O(n^2) | 4.59e-1 |
| O(2^n) (best) | 0.00e+0 |
