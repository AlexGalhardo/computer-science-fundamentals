# External sorting

> Versão em português: [docs/pt/file-systems/external-sorting.md](../../pt/file-systems/external-sorting.md)

Mini-project: [projects/file-systems/external-sorting](../../../projects/file-systems/external-sorting). Languages: Rust, Go. Quiz topic: `file-systems` / `external-sorting`.

## The problem

Sorting in memory assumes that the data fits in memory. When the file is larger, two easy ways out both fail. Loading it anyway ends with the process killed, or with the machine swapping. Sorting the file in place, with an algorithm that jumps around in it, turns every comparison into a disk access, and a disk access costs about a hundred thousand times more than a memory access.

External merge sort keeps two promises: memory use does not depend on the size of the file, and every file is read and written sequentially.

## Phase 1: run generation

```
input file:   [ ......... 320 MiB, in any order ......... ]
                 |          |          |               |
              read 8 MiB  read 8 MiB  read 8 MiB  ...  read the rest
              sort        sort        sort             sort
              write       write       write            write
                 v          v          v               v
runs:         run-0      run-1      run-2      ...   run-40     (each one sorted)
```

One buffer of the size of a run is the only large piece of memory. It is filled from the file, the lines in it are sorted, and they are written as one **run**, a sorted file. The lines are not moved to be sorted: the program sorts an index of (start, length) pairs that point into the buffer, at 8 bytes per line. A line cut by the end of the buffer is carried to the start of the next one.

Number of runs = ceil(file size / run size), give or take one, because the buffer never ends in the middle of a line.

## Phase 2: k-way merge with a heap

```
run-0:  apple  fig    pear  ...        heap of run numbers, ordered by
run-1:  banana grape  plum  ...   -->  the current line of each run   -->  output
run-2:  cherry kiwi   lime  ...        (top = smallest current line)
```

Each run is read from start to end through its own buffer, and only one line of each run is in memory. A **min-heap** holds one entry per run. The top is the run whose current line is the smallest: that line goes to the output, the next line of the same run is read, and the entry sinks to its place. Each line costs about log2(k) comparisons, instead of the k - 1 of looking at every run. When two lines are equal, the lower run number goes first, which keeps the merge stable.

## Several passes

The merge reads at most `fan-in` runs at a time. With more runs than that, a pass joins groups of `fan-in` runs into longer runs, and the next pass joins those:

```
41 runs, fan-in 8:   41  -->  6  -->  1        2 merge passes
48 runs, fan-in 2:   48 -> 24 -> 12 -> 6 -> 3 -> 2 -> 1      6 merge passes
```

Passes = ceil(log base fan-in of the number of runs). Each pass reads and writes every line once, so the number of passes is the real cost of a configuration.

## The two knobs

| Knob | Larger means | Price |
| --- | --- | --- |
| run size | fewer runs, so fewer passes | more memory, since the run buffer is the memory of phase 1 |
| fan-in | fewer passes | with a fixed memory budget, smaller buffers per run, so more refills, and on a magnetic disk each refill is a seek |

In this implementation each merge buffer has `run size / (fan-in + 1)` bytes, with a floor of 4 KiB, so the merge uses about as much memory as run generation.

## The memory limit

The `*-limit` services of `docker-compose.yml` run the sort in a container with `mem_limit: 32m` and `memswap_limit: 32m`: 32 MiB of memory and no swap. The program generates a file of 320 MiB, ten times the limit, sorts it with runs of 8 MiB and a fan-in of 8, checks the output, and then reads its own **peak resident memory** from the `VmHWM` line of `/proc/self/status`. It exits with an error unless the peak is below the limit.

| Language | Runs | Merge passes | Peak resident memory | Share of the limit |
| --- | ---: | ---: | ---: | ---: |
| Rust | 41 | 2 | 11.2 MiB | 35% |
| Go | 41 | 2 | 19.9 MiB | 62% |

The limit is proved to be real by the opposite experiment: `extsort in-memory-check 32` sorts the same file by loading it whole, in the same container, and the kernel kills it (exit code 137). The setup script requires that failure.

### What the limit also counts

The first version of the demo was killed while it was still writing the input file, when its own memory was under 1 MiB. The reason is worth knowing. Bytes handed to the kernel with `write` are not on the disk yet: they wait in the **page cache** as dirty pages. The memory limit of a container counts those pages too, and a dirty page cannot be dropped before it is written. A program that writes faster than the disk fills the limit with pages that are not its own memory, and gets killed.

The fix is in the writer every output file goes through: when a sync interval is set, it calls `fdatasync` after every 4 MiB, which bounds the dirty pages the process can leave behind. The interval is used only in the limit demo. It is why that demo is slow: the disk sets the pace, not the sort.

## How the output is checked

- **Small files, in the tests**: the output is compared with the list of input lines sorted in memory. Being equal to that list means sorted, and the same multiset of lines.
- **Large files, in the demo and the benchmark**: one sequential pass over the output checks that each line is greater than or equal to the previous one, and compares the line count and a checksum with those of the input. The checksum is the sum and the exclusive-or of a 64-bit hash of every line, so it does not depend on the order of the lines and needs O(1) memory. The generator computes it for the input while writing.

Both languages generate the same file from the same seed, and a test in each one asserts the same checksum.

## What the tests prove

| Plan item | How it is verified |
| --- | --- |
| MP-FS-2.1 peak memory under the limit with a file 10 times larger | `docker compose run --rm rust-limit` and `go-limit`: container limit of 32 MiB with no swap, file of 320 MiB, peak resident memory of 11.2 MiB and 19.9 MiB read from `VmHWM`, and the in-memory sort killed under the same limit |
| MP-FS-2.2 output sorted, same multiset of lines | 112 combinations of input, run size and fan-in in each language, each one equal to the in-memory sort |
| MP-FS-2.3 table of total time per configuration | `bun run bench -- --project external-sorting`, committed in `results/results.md` |

## Results

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

## Limits of this implementation

- Lines are compared as bytes. There is no key extraction.
- Runs come from sorting chunks. Replacement selection, which doubles the average run length, is not implemented.
- On the SSD used for the benchmark a seek is almost free, so the penalty of a very large fan-in on a magnetic disk does not appear.

## Run it

```sh
cd projects/file-systems/external-sorting
./setup-unix-external-sorting.sh             # or ./setup-windows-external-sorting.ps1
docker compose run --rm rust-limit           # or go-limit
bun run bench -- --project external-sorting  # from the repository root
```
