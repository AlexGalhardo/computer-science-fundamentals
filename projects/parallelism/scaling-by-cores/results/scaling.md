# Scaling by cores: speed-up, efficiency and Amdahl fit

Derived by `report/scaling.ts` from `results.json` (generated at 2026-10-07T23:40:52.587Z, n = 9,000,000, 5 runs per row after 1 warm-up). Machine, runtime versions and exact commands are in [results.md](results.md).

- `Mean ± sd` is the whole process measured by hyperfine: mean and standard deviation of the runs. `Best` is the fastest run.
- `Speed-up` is the best sequential time divided by the best time with N workers. Other load on the machine can only slow a run down, so the fastest runs are the closest to the program itself.
- `Efficiency` is that speed-up divided by N.
- `Serial fraction` is the Karp-Flatt metric: the s that Amdahl's law needs to explain that row.
- `Speed-up (mean)` is the same ratio between mean times, with the uncertainty that follows from the two standard deviations. It shows how much the noise of the machine moves the result.

## Results are identical

Every row of a workload printed the same checksum, in the three languages, both schedules and all worker counts, sequential rows included.

| Workload | Checksum |
| --- | --- |
| mandelbrot | `1554159510:99d0e04fa277c931` |
| primes | `602489:2613521583098` |

## primes

| Language | Schedule | Workers | Mean ± sd (ms) | Best (ms) | Speed-up | Efficiency | Serial fraction | Speed-up (mean) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | sequential | 1 | 1925 ± 189 | 1481 | 1.00 | 100.0% | | 1.00 |
| cpp | static | 1 | 1620 ± 117 | 1504 | 0.98 | 98.4% |  | 1.19 ± 0.14 |
| cpp | static | 2 | 1192 ± 187 | 988 | 1.50 | 75.0% | 33.4% | 1.62 ± 0.30 |
| cpp | static | 4 | 691 ± 43.5 | 631 | 2.35 | 58.7% | 23.5% | 2.79 ± 0.33 |
| cpp | static | 8 | 400 ± 54.5 | 348 | 4.26 | 53.3% | 12.5% | 4.81 ± 0.81 |
| cpp | dynamic | 1 | 1686 ± 51.0 | 1641 | 0.90 | 90.2% |  | 1.14 ± 0.12 |
| cpp | dynamic | 2 | 922 ± 85.3 | 852 | 1.74 | 86.9% | 15.1% | 2.09 ± 0.28 |
| cpp | dynamic | 4 | 522 ± 85.4 | 459 | 3.22 | 80.6% | 8.0% | 3.68 ± 0.70 |
| cpp | dynamic | 8 | 426 ± 48.5 | 351 | 4.22 | 52.7% | 12.8% | 4.52 ± 0.68 |
| go | sequential | 1 | 2012 ± 136 | 1572 | 1.00 | 100.0% | | 1.00 |
| go | static | 1 | 1935 ± 34.9 | 1906 | 0.82 | 82.5% |  | 1.04 ± 0.07 |
| go | static | 2 | 1260 ± 141 | 1050 | 1.50 | 74.9% | 33.6% | 1.60 ± 0.21 |
| go | static | 4 | 1128 ± 230 | 992 | 1.59 | 39.6% | 50.7% | 1.78 ± 0.38 |
| go | static | 8 | 921 ± 296 | 639 | 2.46 | 30.8% | 32.1% | 2.18 ± 0.72 |
| go | dynamic | 1 | 2335 ± 398 | 1926 | 0.82 | 81.6% |  | 0.86 ± 0.16 |
| go | dynamic | 2 | 1319 ± 93.6 | 1207 | 1.30 | 65.1% | 53.6% | 1.53 ± 0.15 |
| go | dynamic | 4 | 764 ± 104 | 621 | 2.53 | 63.3% | 19.3% | 2.63 ± 0.40 |
| go | dynamic | 8 | 534 ± 61.0 | 471 | 3.34 | 41.7% | 20.0% | 3.77 ± 0.50 |
| rust | sequential | 1 | 1646 ± 169 | 1388 | 1.00 | 100.0% | | 1.00 |
| rust | static | 1 | 1845 ± 413 | 1563 | 0.89 | 88.8% |  | 0.89 ± 0.22 |
| rust | static | 2 | 1122 ± 129 | 948 | 1.46 | 73.2% | 36.6% | 1.47 ± 0.23 |
| rust | static | 4 | 662 ± 79.7 | 610 | 2.28 | 56.9% | 25.2% | 2.49 ± 0.39 |
| rust | static | 8 | 486 ± 62.3 | 419 | 3.31 | 41.4% | 20.2% | 3.39 ± 0.56 |
| rust | dynamic | 1 | 1930 ± 100 | 1840 | 0.75 | 75.4% |  | 0.85 ± 0.10 |
| rust | dynamic | 2 | 958 ± 116 | 830 | 1.67 | 83.7% | 19.5% | 1.72 ± 0.27 |
| rust | dynamic | 4 | 584 ± 23.4 | 556 | 2.49 | 62.4% | 20.1% | 2.82 ± 0.31 |
| rust | dynamic | 8 | 486 ± 47.5 | 452 | 3.07 | 38.4% | 22.9% | 3.38 ± 0.48 |

## mandelbrot

| Language | Schedule | Workers | Mean ± sd (ms) | Best (ms) | Speed-up | Efficiency | Serial fraction | Speed-up (mean) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | sequential | 1 | 4999 ± 300 | 4455 | 1.00 | 100.0% | | 1.00 |
| cpp | static | 1 | 5198 ± 325 | 4927 | 0.90 | 90.4% |  | 0.96 ± 0.08 |
| cpp | static | 2 | 2710 ± 218 | 2473 | 1.80 | 90.1% | 11.0% | 1.84 ± 0.19 |
| cpp | static | 4 | 2511 ± 168 | 2286 | 1.95 | 48.7% | 35.1% | 1.99 ± 0.18 |
| cpp | static | 8 | 1907 ± 115 | 1717 | 2.59 | 32.4% | 29.8% | 2.62 ± 0.22 |
| cpp | dynamic | 1 | 5474 ± 283 | 5013 | 0.89 | 88.9% |  | 0.91 ± 0.07 |
| cpp | dynamic | 2 | 2361 ± 114 | 2226 | 2.00 | 100.1% | -0.1% | 2.12 ± 0.16 |
| cpp | dynamic | 4 | 1359 ± 138 | 1239 | 3.59 | 89.9% | 3.8% | 3.68 ± 0.43 |
| cpp | dynamic | 8 | 730 ± 10.2 | 714 | 6.24 | 78.0% | 4.0% | 6.84 ± 0.42 |
| go | sequential | 1 | 5395 ± 340 | 4550 | 1.00 | 100.0% | | 1.00 |
| go | static | 1 | 5385 ± 398 | 4934 | 0.92 | 92.2% |  | 1.00 ± 0.10 |
| go | static | 2 | 2472 ± 201 | 2239 | 2.03 | 101.6% | -1.6% | 2.18 ± 0.22 |
| go | static | 4 | 2422 ± 49.0 | 2365 | 1.92 | 48.1% | 36.0% | 2.23 ± 0.15 |
| go | static | 8 | 1966 ± 195 | 1717 | 2.65 | 33.1% | 28.8% | 2.74 ± 0.32 |
| go | dynamic | 1 | 4979 ± 126 | 4835 | 0.94 | 94.1% |  | 1.08 ± 0.07 |
| go | dynamic | 2 | 2586 ± 184 | 2423 | 1.88 | 93.9% | 6.5% | 2.09 ± 0.20 |
| go | dynamic | 4 | 1565 ± 198 | 1364 | 3.34 | 83.4% | 6.6% | 3.45 ± 0.49 |
| go | dynamic | 8 | 913 ± 74.1 | 848 | 5.37 | 67.1% | 7.0% | 5.91 ± 0.61 |
| rust | sequential | 1 | 6135 ± 755 | 5246 | 1.00 | 100.0% | | 1.00 |
| rust | static | 1 | 6982 ± 394 | 6677 | 0.79 | 78.6% |  | 0.88 ± 0.12 |
| rust | static | 2 | 4318 ± 852 | 3479 | 1.51 | 75.4% | 32.7% | 1.42 ± 0.33 |
| rust | static | 4 | 3541 ± 459 | 2942 | 1.78 | 44.6% | 41.4% | 1.73 ± 0.31 |
| rust | static | 8 | 2050 ± 181 | 1858 | 2.82 | 35.3% | 26.2% | 2.99 ± 0.45 |
| rust | dynamic | 1 | 6219 ± 252 | 5967 | 0.88 | 87.9% |  | 0.99 ± 0.13 |
| rust | dynamic | 2 | 3004 ± 312 | 2649 | 1.98 | 99.0% | 1.0% | 2.04 ± 0.33 |
| rust | dynamic | 4 | 1613 ± 132 | 1466 | 3.58 | 89.5% | 3.9% | 3.80 ± 0.56 |
| rust | dynamic | 8 | 1095 ± 101 | 964 | 5.44 | 68.1% | 6.7% | 5.60 ± 0.86 |

## Amdahl fit

One serial fraction per series, fitted by least squares over 2, 4 and 8 workers, from the best runs. `Limit` is 1/s, the speed-up Amdahl's law allows with unlimited workers. `Predicted` is what the fitted law gives for 8 workers, next to what was measured. `Fit on means` is the same fit made on the mean times.

| Workload | Language | Schedule | Fitted serial fraction | Limit (1/s) | Predicted S(8) | Measured S(8) | Fit on means |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| primes | cpp | static | 19.8% | 5.1 | 3.36 | 4.26 | 13.5% |
| primes | cpp | dynamic | 11.5% | 8.7 | 4.44 | 4.22 | 5.7% |
| primes | go | static | 39.0% | 2.6 | 2.14 | 2.46 | 37.2% |
| primes | go | dynamic | 25.1% | 4.0 | 2.91 | 3.34 | 18.9% |
| primes | rust | static | 24.6% | 4.1 | 2.94 | 3.31 | 22.4% |
| primes | rust | dynamic | 21.4% | 4.7 | 3.20 | 3.07 | 17.0% |
| mandelbrot | cpp | static | 28.7% | 3.5 | 2.66 | 2.59 | 27.6% |
| mandelbrot | cpp | dynamic | 3.3% | 30.5 | 6.51 | 6.24 | 1.3% |
| mandelbrot | go | static | 26.6% | 3.8 | 2.80 | 2.65 | 21.4% |
| mandelbrot | go | dynamic | 6.8% | 14.7 | 5.42 | 5.37 | 3.7% |
| mandelbrot | rust | static | 32.7% | 3.1 | 2.43 | 2.82 | 33.6% |
| mandelbrot | rust | dynamic | 4.8% | 20.8 | 5.98 | 5.44 | 3.3% |
