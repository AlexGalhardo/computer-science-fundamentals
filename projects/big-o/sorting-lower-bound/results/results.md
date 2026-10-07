# Results: sorting-lower-bound

Generated at 2026-10-07T22:49:57.026Z with `docker compose run --rm ts-demo` (Bun 1.4.2, image oven/bun:1.4.2).
Every number is a count of comparisons, not a time, so it is the same on every machine.

## Decision trees

A tree needs n! leaves, so its height is at least ceil(log2 n!). Merge sort reaches that height for n = 3 and n = 4.

| Algorithm | n | leaves | n! | height (worst case) | ceil(log2 n!) | average depth | log2 n! |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| merge sort | 3 | 6 | 6 | 3 | 3 | 2.67 | 2.58 |
| heapsort | 3 | 6 | 6 | 3 | 3 | 3 | 2.58 |
| quicksort | 3 | 6 | 6 | 3 | 3 | 2.67 | 2.58 |
| merge sort | 4 | 24 | 24 | 5 | 5 | 4.67 | 4.58 |
| heapsort | 4 | 24 | 24 | 7 | 5 | 6.50 | 4.58 |
| quicksort | 4 | 24 | 24 | 6 | 5 | 4.83 | 4.58 |

## Every permutation of small inputs

The bound is about the worst case (at least ceil(log2 n!)) and the average (at least log2 n!). The best case may be smaller.

| Algorithm | n | best | average | worst | log2 n! | ceil(log2 n!) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| merge sort | 2 | 1 | 1 | 1 | 1 | 1 |
| heapsort | 2 | 1 | 1 | 1 | 1 | 1 |
| quicksort | 2 | 1 | 1 | 1 | 1 | 1 |
| merge sort | 3 | 2 | 2.67 | 3 | 2.58 | 3 |
| heapsort | 3 | 3 | 3 | 3 | 2.58 | 3 |
| quicksort | 3 | 2 | 2.67 | 3 | 2.58 | 3 |
| merge sort | 4 | 4 | 4.67 | 5 | 4.58 | 5 |
| heapsort | 4 | 6 | 6.50 | 7 | 4.58 | 5 |
| quicksort | 4 | 4 | 4.83 | 6 | 4.58 | 5 |
| merge sort | 5 | 5 | 7.17 | 8 | 6.91 | 7 |
| heapsort | 5 | 9 | 10.95 | 12 | 6.91 | 7 |
| quicksort | 5 | 6 | 7.40 | 10 | 6.91 | 7 |
| merge sort | 6 | 7 | 9.83 | 11 | 9.49 | 10 |
| heapsort | 6 | 12 | 15.13 | 17 | 9.49 | 10 |
| quicksort | 6 | 8 | 10.30 | 15 | 9.49 | 10 |
| merge sort | 7 | 9 | 12.73 | 14 | 12.30 | 13 |
| heapsort | 7 | 16 | 19.79 | 22 | 12.30 | 13 |
| quicksort | 7 | 10 | 13.49 | 21 | 12.30 | 13 |
| merge sort | 8 | 12 | 15.73 | 17 | 15.30 | 16 |
| heapsort | 8 | 21 | 25.81 | 29 | 15.30 | 16 |
| quicksort | 8 | 13 | 16.92 | 28 | 15.30 | 16 |

## 1,000 random inputs of n = 1,000

Random permutations of 0..n-1 from seed 20261007. log2(n!) = 8529.40. Counting sort and radix sort index an array by the key and make no comparison between elements.

| Algorithm | min comparisons | mean | max | min / log2 n! | inputs sorted |
| --- | ---: | ---: | ---: | ---: | ---: |
| merge sort | 8,654 | 8708.4 | 8,762 | 1.015 | 1000 of 1000 |
| heapsort | 16,758 | 16854.7 | 16,945 | 1.965 | 1000 of 1000 |
| quicksort | 9,664 | 11003.2 | 13,515 | 1.133 | 1000 of 1000 |
| counting sort | 0 | 0 | 0 | 0.000 | 1000 of 1000 |
| radix sort | 0 | 0 | 0 | 0.000 | 1000 of 1000 |
