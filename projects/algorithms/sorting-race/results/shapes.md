# Input shapes, TypeScript, n = 10,000

Median of 5 runs in milliseconds after 2 warm-up runs, with the range in parentheses.
Measured section only (the call to the sort), inside one process.

| algorithm | random | sorted | reversed |
| --- | ---: | ---: | ---: |
| bubble | 219.95 (185.42 to 241.47) | 0.13 (0.09 to 0.14) | 241.48 (178.09 to 269.47) |
| insertion | 126.49 (86.31 to 141.15) | 0.36 (0.27 to 6.05) | 137.64 (133.26 to 217.60) |
| merge | 4.45 (1.85 to 5.90) | 1.41 (1.30 to 2.07) | 1.00 (0.95 to 1.01) |
| quick | 2.15 (1.28 to 12.62) | 0.93 (0.65 to 2.84) | 0.58 (0.52 to 0.66) |
| heap | 2.31 (1.10 to 8.50) | 1.11 (0.90 to 1.59) | 0.94 (0.89 to 1.19) |
| radix | 0.59 (0.56 to 2.44) | 0.91 (0.38 to 5.31) | 0.29 (0.22 to 0.38) |
