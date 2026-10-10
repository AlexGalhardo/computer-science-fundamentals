# Cache-friendly matrix multiplication (MP-PERF-3)

> Versão em português: [docs/pt/performance/cache-friendly-matrix.md](../../pt/performance/cache-friendly-matrix.md) · Versión en español: [docs/es/performance/cache-friendly-matrix.md](../../es/performance/cache-friendly-matrix.md)

Mini-project: [`projects/performance/cache-friendly-matrix`](../../../projects/performance/cache-friendly-matrix/README.md). Quiz topics: `cpu-cache-locality`, `benchmarking-methodology`.

## Same Big O, different speed

Multiplying two `n × n` matrices with three nested loops is `O(n³)` whatever the order of the loops. Big O counts operations and assumes every memory access costs the same. On a real processor it does not: a value in the L1 cache arrives in about a nanosecond, a value in main memory in about a hundred. The order of the loops decides which of the two you pay for.

## The memory hierarchy and the cache line

```text
registers   <  L1 (tens of KiB)  <  L2 (hundreds of KiB)  <  L3 (MiB)  <  RAM (GiB)
fastest, smallest                                              slowest, largest
```

The cache does not hold single values. It holds **lines** of 64 bytes, so reading one `double` brings its 7 neighbours along for free. Programs that use neighbours next (spatial locality) or use the same data again soon (temporal locality) run mostly from the cache.

A matrix is stored row-major: element `(i, j)` is at index `i × n + j`.

```text
row walk:     a[i][0] a[i][1] a[i][2] ... 8 elements per cache line, 1 miss in 8
column walk:  b[0][j]            one element per line
              b[1][j]            n × 8 bytes further on
              b[2][j]            a miss on every element once the column outgrows the cache
```

## The three variants

| Variant | Loops | Inner loop walks | Locality |
| --- | --- | --- | --- |
| `naive` | i, j, k | a row of A and a **column** of B | poor: one line of B per element |
| `interchanged` | i, k, j | a row of B and a row of C | spatial: contiguous, prefetched, vectorised |
| `blocked-B` | tiles of `B × B`, then i, k, j | pieces of rows inside one tile | spatial and temporal: the tile stays in the cache |

Loop interchange changes nothing but the order of two `for` lines. Blocking adds three outer loops that pick a tile. Inside a tile the code touches `B²` elements of each of the three matrices, `3 × B² × 8` bytes: 24 KiB for `B = 32` (fits in a 32 KiB L1) and 96 KiB for `B = 64` (fits in L2).

For each element of the result, the three variants add the same products in the same order of `k`, so the results are identical bit for bit. The tests still compare with a tolerance, because that is the honest contract of floating-point code, and the C++ build uses `-ffp-contract=off` so the compiler cannot fuse a multiply and an add on processors that have such an instruction.

## Measured results

The full grid is in [`results/results.md`](../../../projects/performance/cache-friendly-matrix/results/results.md), and the tables with comments are in the [README](../../../projects/performance/cache-friendly-matrix/README.md#results). The machine has 32 KiB of L1 data cache and 512 KiB of L2 per core, 96 MiB of L3, and 64-byte lines, and it was shared with other programs.

- **Naive against blocked, `n = 1500`**: `blocked-64` was 3.5 times faster in C++ (5524 ms against 1566 ms) and 19.6 times in Rust (26648 ms against 1360 ms) in the committed benchmark. The `speedup` demo, run twice, gave 3.3 and 8.8 times in C++ and 5.5 and 9.0 times in Rust. Always more than 2 times, never the same factor twice: the naive variant is memory-bound and its time moved between 4.6 s and 30 s with the load on the machine.
- **Cache line**: the naive inner loop reads `n` elements of B that are `n × 8` bytes apart, so it uses one value of each 64-byte line it fetches and wastes the other seven. The interchanged loop uses all eight.
- **Block size**: in the sweep, the best blocks were 32 to 128, with working sets of 24 KiB to 384 KiB, inside L1 or L2. `B = 8` was the slowest (too little work per tile), and `B = 256` and `512`, whose working sets of 1.5 MiB and 6 MiB no longer fit in the 512 KiB of L2, were slower again.
- **Blocked against interchanged**: no clear winner on this machine. With 96 MiB of L3 the three matrices (54 MiB) stay in the last cache level, where the interchanged loops stream through them. Blocking is expected to matter more on a processor with a smaller last-level cache or with larger matrices. This was not measured here.
- **Conflict misses**: the naive variant is more than three times slower at `n = 1024` than at `n = 1000`. A column step of 8192 bytes is a multiple of the 4096 bytes covered by one way of the L1 cache, so the whole column maps to one set of 8 lines.

## Method

- Same generated input in both languages (a fixed-seed generator), and a checksum printed with every result: 844274790.842 at `n = 1500` for every variant in both languages.
- C++ at `-O3` and Rust in release mode, which are equivalent levels. At `-O2` GCC does not vectorise the interchanged loop and the comparison between languages would be unfair.
- The benchmark runner repeats each process 3 times after 1 warm-up and reports mean, standard deviation and range. Small sizes repeat the multiplication 5 times inside the process and report the median.
- The machine was shared, and the spread is large. A difference smaller than the spread is not reported as a difference.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-PERF-3.1 the three give the same matrix within floating-point tolerance | `docker compose run --rm cpp-test` and `rust-test` (tolerance `1e-9 × n`, eight sizes, six block sizes) |
| MP-PERF-3.2 blocked at least 2 times faster than naive at the largest size | `docker compose run --rm cpp-speedup` and `rust-speedup` (exit with an error below 2 times, `n = 1500`), and the `n = 1500` rows of `results/results.md` |
| MP-PERF-3.3 the README relates the result to cache line and block size | "Results" and "Block size" in the README |

## Run

```sh
cd projects/performance/cache-friendly-matrix
./setup-unix-cache-friendly-matrix.sh      # tests
docker compose run --rm cpp-speedup        # demo
```
