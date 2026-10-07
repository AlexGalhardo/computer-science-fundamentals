# Hybrid quicksort

> Versão em português: [docs/pt/algorithms/hybrid-quicksort.md](../../pt/algorithms/hybrid-quicksort.md)

Mini-project: [`projects/algorithms/hybrid-quicksort`](../../../projects/algorithms/hybrid-quicksort/README.md) (MP-ALG-4). Languages: C++ and Rust. Quiz: area `algorithms`, topic `quicksort`.

## Two decisions inside quicksort

Quicksort partitions a range around a pivot and sorts each side. Its analysis hides two practical decisions, and this mini-project turns each one into a knob.

### 1. Which value is the pivot

The ideal pivot is the median, which halves the range and gives `log n` levels. The worst pivot is the minimum or the maximum, which removes one value per level and gives `n` levels and `O(n²)` time.

| Strategy | Random input | Sorted or reversed input | Weakness |
| --- | --- | --- | --- |
| First element | `O(n log n)` | `O(n²)`: the first value is an extreme | Real data is often already sorted |
| Random | `O(n log n)` expected | `O(n log n)` expected | Cost of a random number per partition, and a tiny chance of bad luck |
| Median of three | `O(n log n)` | `O(n log n)`: the middle value is the true median | Specially built inputs can still defeat it |

The code always recurses on the smaller side and loops on the larger one. That detail matters for the experiment: the quadratic case becomes slow, but it does not overflow the stack, so it can be measured.

### 2. When to stop recursing

Most calls of quicksort handle tiny ranges: half of the recursion tree is in its last level. On a range of ten values, the overhead of choosing a pivot, partitioning and making two calls is larger than the work itself. Insertion sort is quadratic, but on ten values that means a few dozen simple steps with no call at all. A hybrid quicksort hands every range of at most `k` values to insertion sort.

The threshold does not change the order of growth: there are at most `n / k` small ranges, each costing `O(k²)`, which is `O(n · k)` in total, and the levels above them still cost `O(n log(n / k))`. It changes the constant, and the right `k` can only be found by measuring.

## What was measured

From the committed benchmark ([`results/results.md`](../../../projects/algorithms/hybrid-quicksort/results/results.md)), measured section in milliseconds:

| Implementation | Shape | n | C++ | Rust |
| --- | --- | ---: | ---: | ---: |
| `first-k0` | sorted | 4,000 | 3.81 | 14.9 |
| `first-k0` | sorted | 16,000 | 51.4 | 212 |
| `median3-k0` | sorted | 16,000 | 0.17 | 0.19 |
| `median3-k0` | random | 1,000,000 | 89.8 | 121 |
| `median3-k50` | random | 1,000,000 | 68.1 | 65.7 |

- With the first element as the pivot, 4 times more sorted values cost 13.5 times more time in C++ and 14.2 in Rust. Quadratic growth predicts 16.
- The threshold sweep over `k` = 0, 5, 10, 20 and 50 recorded **k = 50** as the best value in both languages (`results/threshold-cpp.md` and `results/threshold-rust.md`). The differences between neighbouring thresholds are smaller than the spread of the runs, so the safe reading is that a threshold of a few dozen values helps.

## Reading the dashboard

Open `projects/algorithms/hybrid-quicksort/dashboard/index.html` from disk and pick the variant `sorted`. On the log-log chart a straight line of slope 1 is linear growth and slope 2 is quadratic. `first-k0` follows slope 2 and stops at 16,000 values, the cap of the benchmark. Every other strategy stays close to slope 1.

## Things to try

- Add a "last element" pivot and check which shapes break it.
- Feed an array where every value is equal and watch all three strategies. Then implement three-way partitioning.
- Sweep `k` up to 500 and find the point where the hybrid becomes slower than the plain quicksort.
