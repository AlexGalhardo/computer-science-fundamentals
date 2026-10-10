# external-sorting

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How to sort a file that is larger than memory, written in Rust and in Go. Run generation sorts one memory-sized piece at a time and writes it as a sorted run, and a k-way merge driven by a min-heap joins the runs, in one pass or in several. A container with 32 MiB of memory sorts a file of 320 MiB, and a benchmark shows what the run size and the merge fan-in do to the total time.

Plan item: MP-FS-2. Full explanation: [docs/en/file-systems/external-sorting.md](../../../docs/en/file-systems/external-sorting.md).

## What it teaches

- An in-memory sort needs memory proportional to the file. Under a 32 MiB limit, loading a 320 MiB file gets the process killed. External merge sort uses memory proportional to the run size, whatever the size of the file.
- Phase 1 reads the input once and writes runs. Phase 2 reads the runs sequentially and writes the output. Nothing seeks back and forth.
- A min-heap with one entry per run gives the next line in about log2(k) comparisons, and only one line of each run is in memory.
- With more runs than the fan-in, the merge takes several passes: ceil(log base fan-in of the number of runs). Each pass reads and writes the whole file once.
- The run size and the fan-in are the two knobs. Larger runs mean fewer runs and more memory. A larger fan-in means fewer passes and, with a fixed budget, smaller buffers per run.
- A memory limit on a container also counts the page cache of the files being written, which is a lesson the demo ran into: see [results/memory-limit.md](results/memory-limit.md).

## Quiz topics it demonstrates

Area `file-systems`:

- `external-sorting`: the two phases, number of runs, number of merge passes, the heap of the k-way merge, the effect of the fan-in, the volume of input and output per pass.

## Run

The only requirement is Docker.

```sh
./setup-unix-external-sorting.sh        # Linux and macOS
./setup-windows-external-sorting.ps1    # Windows
```

The script builds one pinned image per language (`rust:1.99.0-slim-trixie`, and `golang:1.27.1-bookworm` with `golangci-lint` v2.14.0), runs format check, linter and tests in each, runs the memory-limit demo in both languages, and checks that the in-memory sort is killed under the same limit. It took between 1.5 and 6 minutes on the machine of the results, depending on what else was using the disk, almost all of it in the memory-limit demo, which writes about 1.3 GiB per language inside the container and forces it to disk. Nothing is installed on the host, there is no dependency besides the standard library of each language, and every file the programs create lives in `/tmp` inside the container and disappears with it.

## Structure

| Path | Content |
| --- | --- |
| `rust/src/lines.rs`, `go/lines.go` | seeded generator of the input file, order-independent checksum, the writer that bounds dirty pages, the check of a sorted file |
| `rust/src/sorter.rs`, `go/sorter.go` | run generation, the min-heap of runs, the k-way merge, the multi-pass driver, and the in-memory sort used as the bad example |
| `rust/src/main.rs`, `go/main.go` | the `extsort` command: `generate`, `sort`, `bench`, `limit-check`, `in-memory-check` |
| `rust/tests/`, `go/extsort_test.go` | the tests |
| `fixtures/checksum-1000.txt` | checksum of the first 1,000 generated lines, asserted by both languages |
| `docker-compose.yml` | test services and the two services with the 32 MiB memory limit |
| `bench.json` | benchmark grid read by the repository runner |
| `results/` | committed results: `memory-limit.md`, and `results.md`, `results.json`, `results.js` from the runner |
| `dashboard/` | static page that charts `results/results.js` |

Both languages implement the same algorithm and the same generator (SplitMix64, seed 20261007), so they sort byte-identical files and print the same checksum.

## Tests

```sh
docker compose run --rm rust-test
docker compose run --rm go-test
```

- **Output equals an in-memory sort (MP-FS-2.2)**: 7 inputs (0, 1, 2, 500 and 5,000 lines, 5,000 lines with 7 distinct keys, 3,000 lines with a single key) are sorted with 4 run sizes (128 bytes to 1 MiB) and 4 fan-ins (2, 3, 8, 64), 112 combinations in each language. In every one the output file is exactly the list of input lines sorted in memory, which means sorted and with the same multiset of lines. The number of merge passes is checked against the formula, and no run file is left behind.
- **Runs**: each run is sorted, fits in the run buffer, and the runs together hold exactly the lines of the input.
- **Checks are checked**: a file out of order, a file with a missing repeated line and a file with a changed line are all detected.
- **Edges**: an input without a final line break, empty lines, a line longer than the run size (an error) and a fan-in of 1 (an error).
- **Heap**: the smallest current line is always on top, and equal lines leave in run order.
- **Same generator**: both languages assert the checksum in `fixtures/checksum-1000.txt`.

## Demo: the memory limit (MP-FS-2.1)

```sh
docker compose run --rm rust-limit
docker compose run --rm go-limit
```

Each container has `mem_limit: 32m` and `memswap_limit: 32m` in `docker-compose.yml`. The program generates 335,544,323 bytes of lines (10 times the limit), sorts them with runs of 8 MiB and a fan-in of 8, checks that the output is sorted and has the same lines, reads its peak resident memory from the `VmHWM` line of `/proc/self/status`, and fails unless that peak is below the limit.

| Language | Runs | Merge passes | Peak resident memory | Share of the limit |
| --- | ---: | ---: | ---: | ---: |
| Rust | 41 | 2 | 11.2 MiB | 35% |
| Go | 41 | 2 | 19.9 MiB | 62% |

To prove that the limit is real, the same file sorted in memory under the same limit is killed by the kernel:

```sh
docker compose run --rm rust-limit extsort in-memory-check 32   # exit code 137
```

Full output and how the limit was checked: [results/memory-limit.md](results/memory-limit.md).

## Benchmark: run size and fan-in (MP-FS-2.3)

```sh
bun run bench -- --project external-sorting    # from the repository root
```

The runner starts one container per row, with no network, and hyperfine measures the whole process 7 times after 1 warm-up run. Grid: 250,000 and 1,000,000 lines (12.5 MB and 50 MB), runs of 1, 4 and 16 MiB, fan-in of 2, 4, 16 and 64, in both languages. The full table, with machine, versions and commands, is [results/results.md](results/results.md), and `dashboard/index.html` charts it when opened from disk.

Whole process, mean ± standard deviation in milliseconds over 7 runs, for 1,000,000 lines (50 MB). In parentheses, the number of merge passes.

| Language | Run size | Runs | Fan-in 2 | Fan-in 4 | Fan-in 16 | Fan-in 64 | Peak memory (KiB) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rust | 1 MiB | 48 | 971 ± 379 (6) | 669 ± 221 (3) | 496 ± 20 (2) | 588 ± 119 (1) | 3,416 to 3,516 |
| Rust | 4 MiB | 12 | 979 ± 219 (4) | 619 ± 315 (2) | 389 ± 10 (1) | 538 ± 123 (1) | 7,080 to 7,584 |
| Rust | 16 MiB | 3 | 833 ± 286 (2) | 606 ± 304 (1) | 432 ± 37 (1) | 693 ± 646 (1) | 21,252 to 21,304 |
| Go | 1 MiB | 48 | 820 ± 39 (6) | 611 ± 21 (3) | 572 ± 14 (2) | 814 ± 96 (1) | 6,536 to 7,476 |
| Go | 4 MiB | 12 | 877 ± 71 (4) | 564 ± 36 (2) | 509 ± 23 (1) | 730 ± 96 (1) | 10,652 to 15,468 |
| Go | 16 MiB | 3 | 893 ± 92 (2) | 618 ± 34 (1) | 701 ± 87 (1) | 899 ± 319 (1) | 32,356 to 35,672 |

Measured on 2026-10-08 on an AMD Ryzen 7 5700X3D with Docker Desktop (WSL2), while other workloads were using the same machine.

- **Fan-in 2 is the slowest column in every row but one**, in both languages. It needs 6, 4 and 2 merge passes, and every pass reads and writes the 50 MB again.
- **Fewer passes pay off up to a point.** With runs of 1 MiB, going from fan-in 2 to fan-in 16 cuts the passes from 6 to 2 and the time by 49% in Rust (971 to 496 ms) and by 30% in Go (820 to 572 ms).
- **Fan-in 64 saves one more pass and is not faster.** With runs of 1 MiB it merges the 48 runs in a single pass, and in Go it is slower than fan-in 16 (814 ± 96 against 572 ± 14 ms). The 1 MiB budget is split among 65 buffers, so each run is read 16 KiB at a time.
- **The run size sets the memory**, about 3.4, 7 and 21 MiB in Rust and 7, 11 to 15 and 32 to 36 MiB in Go. Here it changes the time much less than the fan-in does, because a 50 MB file fits in the page cache and reading a run back costs no disk access.
- **Mind the spread.** Several Rust cells have a standard deviation above 30% of the mean, because the machine was shared. A difference smaller than the spread is not a difference: the columns for fan-in 4, 16 and 64 cannot be ranked from the Rust rows alone.

## Limits

- Lines are compared as bytes, from the first byte. There is no key extraction and no locale.
- Runs are made by sorting memory-sized chunks. Replacement selection, which makes runs about twice as long, is covered by the quiz and not implemented.
- The merge buffers are sized as the run size divided by the fan-in plus one, with a floor of 4 KiB, so that the merge uses about as much memory as run generation.
- The benchmark ran on an SSD behind a virtual disk, where a seek costs almost nothing. The penalty of a very large fan-in on a magnetic disk, many small refills that are each a seek, does not show in these numbers.
- The comparison of the input with the output on large files uses the line count and an order-independent 64-bit checksum. The tests on small files compare the files exactly.
