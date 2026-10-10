# The lower bound of comparison sorting

> Versão em português: [docs/pt/big-o/sorting-lower-bound.md](../../pt/big-o/sorting-lower-bound.md) · Versión en español: [docs/es/big-o/sorting-lower-bound.md](../../es/big-o/sorting-lower-bound.md)

Mini-project MP-BIGO-3, in [`projects/big-o/sorting-lower-bound`](../../../projects/big-o/sorting-lower-bound). It teaches why no comparison sort beats Ω(n lg n) and how counting sorts escape it.

## The argument

A comparison sort learns about its input only by asking "is a smaller than b?". Every run of it is a path in a **decision tree**: each comparison is a node, each answer is a branch, and the final order is a leaf.

1. n distinct elements can arrive in n! orders, and each order needs a different rearrangement. So the tree needs at least **n! leaves**.
2. A binary tree of height h has at most 2^h leaves.
3. Therefore 2^h ≥ n!, that is, **h ≥ lg(n!)**. The height is the number of comparisons of the worst case, and it is a whole number, so the worst case is at least ⌈lg(n!)⌉.
4. lg(n!) = lg 1 + lg 2 + ... + lg n is Θ(n lg n).

The bound is a statement about the problem, not about one algorithm.

## The decision tree generator

`ts/src/decision-tree.ts` does not draw a tree by hand: it discovers the tree of a real sort. The algorithm runs on items whose order is unknown, and the comparator replays a list of answers. When the algorithm asks one more question, the run stops, the question becomes a node, and the algorithm runs again for "yes" and for "no". A branch that no input order can reach is left empty.

| Algorithm | n | leaves | height | ⌈lg n!⌉ |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 3 | 6 | 3 | 3 |
| merge sort | 4 | 24 | 5 | 5 |
| heapsort | 4 | 24 | 7 | 5 |
| quicksort | 4 | 24 | 6 | 5 |

Every correct sort has exactly n! reachable leaves. Merge sort reaches the minimum height for n = 3 and n = 4. Heapsort and quicksort are correct but taller, and merge sort itself stops being optimal at n = 5 (8 comparisons in the worst case against a bound of 7): the bound says what is impossible, not that a given algorithm reaches it.

## What the bound promises, and what it does not

Checking every permutation for n up to 8 shows the three cases side by side:

| Algorithm | n | best | average | worst | lg n! | ⌈lg n!⌉ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| merge sort | 5 | 5 | 7.17 | 8 | 6.91 | 7 |
| heapsort | 5 | 9 | 10.95 | 12 | 6.91 | 7 |
| quicksort | 5 | 6 | 7.40 | 10 | 6.91 | 7 |

The **worst case** is never below ⌈lg n!⌉ and the **average** is never below lg n!. The **best case** can be: merge sort sorts some inputs of 5 elements with 5 comparisons. In Python, `sorted` on 1,000 keys already in order makes 999 comparisons, against lg(1000!) ≈ 8,529.

This matters for reading the acceptance criterion "counted comparisons never fall below lg(n!) on 1,000 random inputs". It holds, and the tests check it, but as an observation about random inputs of n = 1,000, where the count concentrates near its average. It is not a consequence of the theorem for each single input.

## 1,000 random inputs of n = 1,000

Random permutations of 0..999 from a fixed seed, lg(1000!) = 8,529.40:

| Algorithm | min comparisons | mean | max | min / lg n! |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 8,654 | 8,708.4 | 8,762 | 1.015 |
| heapsort | 16,758 | 16,854.7 | 16,945 | 1.965 |
| quicksort | 9,664 | 11,003.2 | 13,515 | 1.133 |
| counting sort | 0 | 0 | 0 | 0 |
| radix sort | 0 | 0 | 0 | 0 |

Merge sort stays within 2% of the bound. Heapsort makes about twice the comparisons, because sifting down costs two per level. All five algorithms sorted all 1,000 inputs.

## How counting sort and radix sort escape

They never compare two elements. Counting sort uses the key as an index into an array of counters, in Θ(n + k) for keys in [0, k). Radix sort applies a stable counting sort to each digit, in Θ(d·(n + k)). An algorithm that does not work by comparisons is not described by a decision tree, so the theorem says nothing about it. The price is generality: these sorts only work for keys that are small integers or can be cut into digits.

## Why there is a Python version

In TypeScript the comparison is a function passed to our own sorts, and counting sort makes zero comparisons by construction. Python allows a stronger experiment. `python/lower_bound.py` defines a `Key` class that overloads `<`, `<=`, `>`, `>=` and `==`, so **every** comparison between two keys is counted, including those made inside the built-in `sorted` (Timsort). Counting sort and radix sort run on the same keys and their counter stays at zero: the claim is measured, not assumed. Python's unlimited integers also give ⌈lg n!⌉ exactly, as the bit length of n! − 1.

| Algorithm (Python, n = 1,000, 1,000 inputs) | min comparisons | mean | max |
| --- | ---: | ---: | ---: |
| merge sort | 8,650 | 8,708.14 | 8,756 |
| sorted() (Timsort) | 8,620 | 8,657.43 | 8,701 |
| counting sort | 0 | 0 | 0 |
| radix sort | 0 | 0 | 0 |

The inputs differ from the TypeScript ones because each language uses its own seeded generator.

## Running it

```sh
cd projects/big-o/sorting-lower-bound
docker compose run --rm ts-test
docker compose run --rm python-test
docker compose run --rm ts-demo        # results/results.md and results.json
docker compose run --rm python-demo    # results/results-python.md
```

## Acceptance criteria

| Item | Criterion | Where it is verified |
| --- | --- | --- |
| MP-BIGO-3.1 | the tree has n! leaves and its height equals ⌈lg(n!)⌉, for n = 3 and 4 | `ts/tests/decision-tree.test.ts` (merge sort) |
| MP-BIGO-3.2 | counted comparisons never fall below lg(n!) on 1,000 random inputs | `ts/tests/experiment.test.ts`, `results/results.md` |
| MP-BIGO-3.3 | counting and radix sort sort the same inputs with zero element comparisons, in the same table | `ts/tests/experiment.test.ts`, `python/test_lower_bound.py`, `results/` |

## Related quiz topics

`big-o` / `sorting-lower-bound`, `asymptotic-notation` and `best-worst-average-case`.
