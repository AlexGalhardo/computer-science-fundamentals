# Results: master-theorem

Generated at 2026-10-07T22:32:30.946Z with `docker compose run --rm ts-demo` (Bun 1.4.2, image oven/bun:1.4.2).
Everything here is a count, not a time, so the numbers are the same on every machine.

## Classified recurrences

| Algorithm | Recurrence | log_b a | Result | Solution |
| --- | --- | ---: | --- | --- |
| binary search | `T(n) = T(n/2) + 1` | 0.000 | case-2 | Θ(log n) |
| merge sort | `T(n) = 2T(n/2) + n` | 1.000 | case-2 | Θ(n log n) |
| binary tree traversal | `T(n) = 2T(n/2) + 1` | 1.000 | case-1 | Θ(n) |
| Karatsuba multiplication | `T(n) = 3T(n/2) + n` | 1.585 | case-1 | Θ(n^1.58) |
| Strassen matrix multiplication (7-way split) | `T(n) = 7T(n/2) + n^2` | 2.807 | case-1 | Θ(n^2.81) |
| schoolbook matrix multiplication by blocks | `T(n) = 8T(n/2) + n^2` | 3.000 | case-1 | Θ(n^3) |
| median-like halving with linear work | `T(n) = T(n/2) + n` | 0.000 | case-3 | Θ(n) |
| two halves with quadratic work | `T(n) = 2T(n/2) + n^2` | 1.000 | case-3 | Θ(n^2) |
| two halves with n log n work (gap) | `T(n) = 2T(n/2) + n log n` | 1.000 | not-applicable | none (extended case 2: Θ(n log^2 n)) |
| two halves with n / log n work (gap) | `T(n) = 2T(n/2) + n log^-1 n` | 1.000 | not-applicable | none |

## Empirical check

A generated recursive function really runs and counts its calls and its work. `work / g(n)` uses the predicted class g(n) and must settle on a constant. The drift is the relative change of that ratio between the two largest sizes: it must be the smallest for the predicted class.

### merge sort: `T(n) = 2T(n/2) + n`, predicted Θ(n log n)

| n | calls | work | work / g(n) |
| ---: | ---: | ---: | ---: |
| 256 | 511 | 2,304 | 1.1250 |
| 1,024 | 2,047 | 11,264 | 1.1000 |
| 4,096 | 8,191 | 53,248 | 1.0833 |
| 16,384 | 32,767 | 245,760 | 1.0714 |
| 32,768 | 65,535 | 524,288 | 1.0667 |
| 65,536 | 131,071 | 1,114,112 | 1.0625 |

Drift: predicted class 0.0039, one log factor less 0.0625, one log factor more 0.0662. Agrees: **yes**.

### binary search: `T(n) = T(n/2) + 1`, predicted Θ(log n)

| n | calls | work | work / g(n) |
| ---: | ---: | ---: | ---: |
| 256 | 9 | 9 | 1.1250 |
| 4,096 | 13 | 13 | 1.0833 |
| 65,536 | 17 | 17 | 1.0625 |
| 1,048,576 | 21 | 21 | 1.0500 |
| 8,388,608 | 24 | 24 | 1.0435 |
| 16,777,216 | 25 | 25 | 1.0417 |

Drift: predicted class 0.0017, one log factor less 0.0417, one log factor more 0.0433. Agrees: **yes**.

### 7-way split: `T(n) = 7T(n/2) + n^2`, predicted Θ(n^2.81)

| n | calls | work | work / g(n) |
| ---: | ---: | ---: | ---: |
| 4 | 57 | 93 | 1.8980 |
| 8 | 400 | 715 | 2.0845 |
| 16 | 2,801 | 5,261 | 2.1912 |
| 32 | 19,608 | 37,851 | 2.2521 |
| 64 | 137,257 | 269,053 | 2.2869 |
| 128 | 960,800 | 1,899,755 | 2.3068 |

Drift: predicted class 0.0087, one log factor less 0.1768, one log factor more 0.1354. Agrees: **yes**.
