# Results: sorting-lower-bound (Python)

Generated at 2026-10-07T22:49:59+00:00 with `docker compose run --rm python-demo` (Python 3.14.8, image python:3.14.8-slim-trixie).
Comparisons are counted by a key class that overloads the comparison operators, so the built-in `sorted` is measured too. Every number is a count, not a time.

## Every permutation of small inputs

min is the best case, mean the average case and max the worst case over all n! orders.

### n = 3: log2(n!) = 2.58, ceil(log2 n!) = 3

| Algorithm | min comparisons | mean | max | inputs sorted |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 2 | 2.67 | 3 | 6 of 6 |
| sorted() (Timsort) | 2 | 4.00 | 6 | 6 of 6 |

### n = 4: log2(n!) = 4.58, ceil(log2 n!) = 5

| Algorithm | min comparisons | mean | max | inputs sorted |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 4 | 4.67 | 5 | 24 of 24 |
| sorted() (Timsort) | 3 | 6.54 | 8 | 24 of 24 |

### n = 5: log2(n!) = 6.91, ceil(log2 n!) = 7

| Algorithm | min comparisons | mean | max | inputs sorted |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 5 | 7.17 | 8 | 120 of 120 |
| sorted() (Timsort) | 4 | 9.12 | 11 | 120 of 120 |

### n = 6: log2(n!) = 9.49, ceil(log2 n!) = 10

| Algorithm | min comparisons | mean | max | inputs sorted |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 7 | 9.83 | 11 | 720 of 720 |
| sorted() (Timsort) | 5 | 11.83 | 14 | 720 of 720 |

### n = 7: log2(n!) = 12.30, ceil(log2 n!) = 13

| Algorithm | min comparisons | mean | max | inputs sorted |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 9 | 12.73 | 14 | 5,040 of 5,040 |
| sorted() (Timsort) | 6 | 14.69 | 17 | 5,040 of 5,040 |

## 1,000 random inputs of n = 1,000

Random permutations of 0..n-1 from seed 20261007. log2(n!) = 8,529.40, ceil(log2 n!) = 8,530.

| Algorithm | min comparisons | mean | max | inputs sorted |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 8,650 | 8,708.14 | 8,756 | 1,000 of 1,000 |
| sorted() (Timsort) | 8,620 | 8,657.43 | 8,701 | 1,000 of 1,000 |
| counting sort | 0 | 0.00 | 0 | 1,000 of 1,000 |
| radix sort | 0 | 0.00 | 0 | 1,000 of 1,000 |

## The bound is about the worst case

`sorted` on 1,000 keys that are already in order makes 999 comparisons, far below log2(n!) = 8,529.40. That is a best case. The theorem says that some input needs at least ceil(log2 n!) comparisons, not that every input does.
