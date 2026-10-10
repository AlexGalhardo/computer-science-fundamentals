# Memory allocator

> Versão em português: [docs/pt/operating-systems/memory-allocator.md](../../pt/operating-systems/memory-allocator.md) · Versión en español: [docs/es/operating-systems/memory-allocator.md](../../es/operating-systems/memory-allocator.md)

Mini-project: [`projects/operating-systems/memory-allocator`](../../../projects/operating-systems/memory-allocator/). Plan item: MP-OS-3. Quiz topic: `operating-systems` / `memory-management`.

## What it teaches

An allocator hands out pieces of a fixed region of memory (the arena) and takes them back. After many allocations and frees of different sizes, the free memory is no longer one block: it is scattered in holes. A request can then fail although the total free space would be enough. The mini-project shows how four strategies deal with that, and measures it.

The arena is simulated: an allocation is an offset and a size, and no real byte is touched. The lesson is the bookkeeping.

## Two kinds of fragmentation

| Kind | What is wasted | Who suffers |
| --- | --- | --- |
| External | free memory split into holes too small to be useful | free-list allocators, variable partitions, segmentation |
| Internal | space inside a block that the caller did not ask for | fixed-size units: the buddy system, paging |

Measures used in the table:

- **External fragmentation** = 1 − largest free block / total free memory. 0 means one free block.
- **Internal fragmentation** = (bytes reserved − bytes requested) / bytes reserved.

## The strategies

| Strategy | Chooses | Tendency |
| --- | --- | --- |
| First fit | the first hole that is large enough | fast, good in practice |
| Best fit | the smallest hole that is large enough | keeps large holes, leaves tiny leftovers |
| Worst fit | the largest hole | leftovers stay large, but large holes disappear |
| Buddy | a block of the next power of two, splitting larger blocks in halves | fast merge, pays with internal fragmentation |

Example checked by the tests. Holes of 12, 5, 30, 8 and 20 units, in address order, and a request of 7:

| Strategy | Hole chosen |
| --- | --- |
| First fit | 12 (the first that fits) |
| Best fit | 8 (the tightest) |
| Worst fit | 30 (the largest) |

## Coalescing

When a block is freed, it is merged with a free neighbour on either side. Without this step the arena would end up as many adjacent small holes. The tests free everything in random order and require one free block of the size of the arena at the end.

In the buddy system the neighbour to merge with is the buddy: for a block of size `s` at offset `o`, it is at `o XOR s`. A request of 70 in an arena of 1024 takes a block of 128 at offset 0 and leaves free blocks of 128, 256 and 512. Internal fragmentation is 128 − 70 = 58. Freeing it merges 128 + 128, then 256 + 256, then 512 + 512, back to 1024.

## The benchmark

At every step the program allocates a block of random size (55% of the time) or frees a random live block. The arena fills up, and from then on a request fails when no hole is large enough. Fragmentation is sampled at every step. `mixed` has 70% of blocks from 16 to 512 bytes, 25% from 513 to 8192 and 5% from 8193 to 65536. `small` has blocks from 8 to 256 bytes.

Workload `mixed`, arena of 1 MiB, 20,000 steps:

| Strategy | Attempts | Failed | Failed % | External fragmentation % | Internal fragmentation % | Peak used (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| first-fit | 11054 | 905 | 8.19 | 80.54 | 0.00 | 969266 |
| best-fit | 11054 | 868 | 7.85 | 78.65 | 0.00 | 1013220 |
| worst-fit | 11054 | 1258 | 11.38 | 95.72 | 0.00 | 653051 |
| buddy | 11054 | 1098 | 9.93 | 68.07 | 25.48 | 1047424 |

How to read it:

- Worst fit is the worst: by always cutting the largest hole, it leaves no hole for large requests. It refuses the most and never uses more than 63% of the arena.
- Best fit and first fit are close, with best fit slightly ahead here. First fit does less work per allocation, because it stops at the first hole.
- The buddy system has the lowest external fragmentation, because buddies always merge back into aligned blocks, but about a quarter of what it reserves is internal fragmentation, so it still refuses more requests than first fit.

The numbers are a deterministic simulation with a seeded generator: they count events and describe the layout of the arena, and they do not measure time. Both workloads are in [`results/results.md`](../../../projects/operating-systems/memory-allocator/results/results.md).

## Run it

```sh
cd projects/operating-systems/memory-allocator
./setup-unix-memory-allocator.sh     # or setup-windows-memory-allocator.ps1
docker compose run --rm demo         # the benchmark from C++, writes results/
docker compose run --rm rust-demo    # the same table from Rust
```

## Two languages

Both implementations manage the simulated arena with the same algorithms and print identical tables. In C++ the allocators share an abstract class with virtual methods, a missing result is `std::optional`, and the bit tricks of the buddy system come from `<bit>`. In Rust the abstract class is a trait, the missing result is `Option`, and `#[must_use]` makes the compiler complain when the result of `release` is ignored.

## Source

Tanenbaum, Modern Operating Systems (4th edition), chapter 3, section 3.2 (memory management with free lists) and section 3.7 (segmentation). The buddy system is described in the Linux case study, chapter 10.
