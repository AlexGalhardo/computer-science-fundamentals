# cache-friendly-matrix

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Three ways to multiply two matrices, in C++ and in Rust: the textbook order (i-j-k), the same loops interchanged (i-k-j), and a blocked version. All three do exactly the same `n³` multiplications and additions and return the same matrix, bit for bit. The only difference is the order in which memory is visited, and that alone makes the textbook order several times slower. The lesson: Big O counts operations, and the processor also charges for where the data is.

Plan item: MP-PERF-3. Languages: C++ and Rust. Full write-up: [docs/en/performance/cache-friendly-matrix.md](../../../docs/en/performance/cache-friendly-matrix.md).

## What it teaches

- A matrix stored row-major has contiguous rows and scattered columns. A **cache line** is 64 bytes, which is 8 doubles: walking a row costs one cache miss every 8 elements, walking a column costs one per element once the column no longer fits in the cache.
- **Loop interchange** (i-k-j) turns the column walk into two row walks. That is spatial locality.
- **Blocking** cuts the work into `B × B` tiles whose working set (`3 × B² × 8` bytes) fits in a cache level, so the data is reused before it is evicted. That is temporal locality.
- A size that is a multiple of a power of two can be far worse than a slightly smaller one, because the elements of a column then compete for the same cache set (conflict misses).
- How to measure it without fooling yourself: same input, same optimisation level, a checksum proving the variants agree, several runs, and the spread.

## Results

Measured on the machine described in [results/results.md](results/results.md) (AMD Ryzen 7 5700X3D: 32 KiB of L1 data cache and 512 KiB of L2 per core, 96 MiB of shared L3, 64-byte cache lines), while other programs were using it. The numbers are noisy, and the spread is part of the result.

Largest size, `n = 1500` (18 MiB per matrix), whole process, mean ± standard deviation of 3 runs after 1 warm-up, from the committed benchmark:

| Variant | C++ (ms) | Rust (ms) |
| --- | ---: | ---: |
| `naive` (i-j-k) | 5524 ± 755 | 26648 ± 5773 |
| `interchanged` (i-k-j) | 1968 ± 530 | 1575 ± 141 |
| `blocked-32` | 2080 ± 191 | 1757 ± 166 |
| `blocked-64` | 1566 ± 17 | 1360 ± 760 |
| `naive` / `blocked-64` | **3.5 times** | **19.6 times** |

The blocked version was at least 2 times faster than the naive one at the largest size in every run made for this project, but by how much varied a lot. The `speedup` demo (median of 3 runs in one process) gave 3.3 and 8.8 times in C++ and 5.5 and 9.0 times in Rust on two occasions, and the benchmark above gave 3.5 and 19.6. The naive variant is the unstable one (4.6 s to 30 s for the same work): it is limited by memory, so it suffers most when other programs compete for the shared L3 cache and the memory bus. The Rust figure of 26.6 s is an outlier of that kind. Read "several times faster", not a precise factor.

What the numbers say, and what they do not:

- **Loop order matters more than the language.** In both languages the naive order is the slow one, and the two cache-friendly variants are close to each other.
- **Blocking did not beat plain interchange on this machine.** The differences between `interchanged`, `blocked-32` and `blocked-64` are inside the noise. The three matrices take 54 MiB and this processor has 96 MiB of L3, so the interchanged loops stream through data that is still in the last cache level, with the prefetcher helping. Blocking pays off more when the matrices are larger than the last-level cache.
- **1024 against 1000.** The naive variant took 6636 ms at `n = 1024` and 1402 ms at `n = 1000` in C++ (6454 ms and 1930 ms in Rust): 7% more work, more than three times the time. With `n = 1024` the elements of a column are 8192 bytes apart, a multiple of 4096 bytes, so they all fall in the same set of the L1 cache, which holds only 8 lines per set. The interchanged and blocked variants do not walk columns and are not affected.

### Block size

`docker compose run --rm cpp-sweep` and `rust-sweep`, `n = 1500`, median of 3 runs:

| Block `B` | Working set `3 × B² × 8` bytes | Fits in | C++ (ms) | Rust (ms) |
| ---: | ---: | --- | ---: | ---: |
| 8 | 1.5 KiB | L1 | 2411 | 1827 |
| 16 | 6 KiB | L1 | 1705 | 1204 |
| 32 | 24 KiB | L1 (32 KiB) | 1330 | 1004 |
| 64 | 96 KiB | L2 | 1349 | 772 |
| 128 | 384 KiB | L2 (512 KiB) | 1352 | 717 |
| 256 | 1.5 MiB | L3 only | 1682 | 945 |
| 512 | 6 MiB | L3 only | 1657 | 919 |

The curve is a U. Very small blocks waste time in loop overhead and cut the inner loop into pieces too short for vector instructions. Blocks whose working set passes the 512 KiB of L2 lose the reuse that blocking exists for. The best block sizes (32 to 128) are the ones whose working set fits in L1 or L2. The right block size is a property of the cache, so it is found by measuring on the target machine.

## Quiz topics it demonstrates

Area `performance`:

- `cpu-cache-locality` (memory hierarchy, cache line, spatial and temporal locality, row-major traversal, loop interchange, blocking)
- `benchmarking-methodology` (warm-up, several runs and their spread, checksum against dead-code elimination and to prove equal work, same Big O with different speed)

## Run

The only requirement is Docker.

```sh
./setup-unix-cache-friendly-matrix.sh        # Linux and macOS
./setup-windows-cache-friendly-matrix.ps1    # Windows
```

The script builds the two images and runs the tests of both languages.

## Demo

```sh
docker compose run --rm cpp-speedup     # the three variants at n = 1500, fails below 2 times
docker compose run --rm rust-speedup
docker compose run --rm cpp-sweep       # block sizes from 8 to 512
docker compose run --rm rust-sweep
```

`MATRIX_N=1024 docker compose run --rm cpp-speedup` changes the size. `speedup` prints a table with the checksum of each variant and exits with an error unless the blocked variant is at least 2 times faster than the naive one and the three matrices agree.

## Benchmark

```sh
bun run bench -- --project cache-friendly-matrix    # from the repository root
```

The runner builds both programs, runs every variant at `n` = 256, 512, 1000, 1024 and 1500 inside the language images with hyperfine (3 runs after 1 warm-up), and writes `results/results.md`, `results.json` and `results.js`. It takes about five minutes. `dashboard/index.html` charts `results/results.js` and works when opened from disk.

## Structure

| Path | Content |
| --- | --- |
| `cpp/matrix.hpp` | The three multiplications, the input generator and the checksum |
| `cpp/main.cpp` | Benchmark entry, `speedup` and `sweep` |
| `cpp/test_matrix.cpp` | Tests |
| `rust/src/lib.rs`, `rust/src/main.rs` | The same in Rust, with the tests inside `lib.rs` |
| `bench.json`, `results/` | Benchmark grid and committed results |
| `dashboard/` | Static page that charts `results/results.js` |

## Tests

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- The three variants give the same matrix within a tolerance of `1e-9 × n`, and the same checksum, at eight sizes and six block sizes, including sizes that the block does not divide and a block larger than the matrix.
- A known 2 × 2 product, multiplication by the identity, and the same generated input in both languages (shared checksum).
- At `n = 512` the naive order must take more than 1.5 times the time of the interchanged and of the blocked variant. It is a ratio with a wide margin (3 to 8 times was measured), not an absolute time.

Formatters and linters (clang-format, rustfmt, clippy) run in the base images of [docs/en/environment.md](../../../docs/en/environment.md):

```sh
./lint.sh          # check
./lint.sh --fix    # rewrite
```

## Versions

| Component | Version |
| --- | --- |
| C++ | `gcc:16.2.0-trixie`, `-std=c++23 -O3 -ffp-contract=off` |
| Rust | `rust:1.99.0-slim-trixie`, edition 2024, release profile, no dependencies |
| hyperfine | 2.0.0, in the benchmark image of the repository |
