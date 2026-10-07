# Travelling salesman

> Versão em português: [docs/pt/algorithms/travelling-salesman.md](../../pt/algorithms/travelling-salesman.md)

Mini-project: [`projects/algorithms/travelling-salesman`](../../../projects/algorithms/travelling-salesman/README.md) (MP-ALG-3). Languages: TypeScript and Rust. Quiz: area `algorithms`, topics `backtracking`, `dynamic-programming` and `greedy`.

## The problem

Given `n` cities and the distance between every pair, find the shortest tour that visits each city once and returns to the start. The problem is NP-hard: no algorithm is known that always finds the best tour in polynomial time. That makes it a good place to see three different attitudes towards a hard problem.

| Approach | Idea | Time | Answer |
| --- | --- | --- | --- |
| Brute force | try every order | `O(n!)` | optimal |
| Held-Karp | dynamic programming over subsets of cities | `O(n² · 2^n)`, memory `O(n · 2^n)` | optimal |
| Nearest neighbour | always go to the closest unvisited city | `O(n²)` | valid, no guarantee |
| 2-opt | swap two legs while the tour gets shorter | `O(n²)` per pass | local optimum |

## Where brute force stops

With the start fixed there are `(n - 1)!` orders. The growth is not "twice as slow per city" but "`n` times as slow per city":

| Cities | Orders |
| ---: | ---: |
| 8 | 5,040 |
| 10 | 362,880 |
| 12 | 39,916,800 |
| 13 | 479,001,600 |
| 14 | 6,227,020,800 |
| 16 | 1,307,674,368,000 |

Measured in the committed benchmark (the machine and the exact commands are in [`results/results.md`](../../../projects/algorithms/travelling-salesman/results/results.md)):

| Cities | Brute force, TypeScript (ms) | Brute force, Rust (ms) | Held-Karp, TypeScript (ms) | Held-Karp, Rust (ms) |
| ---: | ---: | ---: | ---: | ---: |
| 11 | 202 | 70.9 | 3.79 | 0.25 |
| 12 | 1,709 | 765 | 4.58 | 0.59 |
| 13 | over 12,000 (stopped) | 7,351 | 5.69 | 1.37 |
| 14 | stopped | over 12,000 (stopped) | 9.38 | 3.10 |
| 20 | not run | not run | 569 | 437 |

Brute force exceeds 10 seconds at **13 cities in TypeScript** and at **14 cities in Rust**. From 11 to 12 cities the time grows about 10 times in both languages, as `11! / 10! = 11` predicts. A language that is 2 to 3 times faster buys one city. The benchmark stops brute force after 12 seconds, so the rows marked "stopped" report the deadline, not a result.

## Why Held-Karp is so much faster

Brute force treats two partial paths as different even when they visited the same cities and stopped at the same place. For what comes next, they are equivalent: only the set of visited cities and the last city matter. Held-Karp keeps one number per pair (set, last city), the length of the best path with that description, and builds larger sets from smaller ones. The sets are bit masks, filled in increasing numeric order, because removing a city from a set always gives a smaller mask.

It is still exponential. For 20 cities the table has about 20 million entries, and for 30 it would have 16 billion. The limit moved from time to memory.

## What a heuristic trades away

Nearest neighbour is greedy: it never revisits a choice, so cheap legs at the start can force expensive legs at the end. 2-opt repairs the worst of that by local search: it removes crossings until no single swap of two legs helps. On the random instances of this project (5 to 12 cities, 64 instances) nearest neighbour was on average 8% above the optimum and at worst 33%, and 2-opt was on average 0.6% above and at worst 5.6%, finding the optimum in 49 of 64. The tests enforce the factors 1.6 and 1.2.

Those numbers describe this family of instances. In general, nearest neighbour has no constant guarantee, and 2-opt stops at a local optimum that may not be the best tour. What the heuristics give in return is scale: 100 cities in well under a millisecond, a size where both exact methods are out of reach.

## Things to try

- Remove the deadline and time brute force on 13 and 14 cities.
- Add pruning to brute force (stop a branch when its partial length already reaches the best tour) and count how many orders are skipped.
- Start 2-opt from a random tour instead of the nearest-neighbour tour and compare the results.
