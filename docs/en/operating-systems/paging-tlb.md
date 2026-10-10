# Paging and TLB simulator

> Versão em português: [docs/pt/operating-systems/paging-tlb.md](../../pt/operating-systems/paging-tlb.md) · Versión en español: [docs/es/operating-systems/paging-tlb.md](../../es/operating-systems/paging-tlb.md)

Mini-project: [`projects/operating-systems/paging-tlb`](../../../projects/operating-systems/paging-tlb/). Plan item: MP-OS-2. Quiz topic: `operating-systems` / `memory-management`.

## What it teaches

With virtual memory a program uses virtual addresses, and the hardware translates each one to a physical address. The simulator shows the three things that can happen on an access (TLB hit, TLB miss, page fault), what each costs, and how the algorithm that chooses the page to evict changes the number of page faults.

## Address translation

A virtual address is split in two: the high bits are the page number and the low bits are the offset. The page number is replaced by a frame number and the offset is copied.

```text
page size 4096:  20500 = 5 × 4096 + 20   ->  page 5, offset 20
page 5 is in frame 3                     ->  3 × 4096 + 20 = 12308
```

The translation is looked up in this order:

1. **TLB**, a small cache of recent translations. A hit costs no extra memory access.
2. **Page table**, on a TLB miss. One memory access per level of the table.
3. **Page fault**, when the page is not in memory. A frame is found, evicting another page if necessary, and the page is loaded from disk. The evicted page leaves the page table and the TLB.

## Reference trace of the MMU

Configuration: 3 frames, a TLB of 2 entries, LRU for both. The tests check exactly this table.

| Access | Page | TLB | Page fault | Frame | Note |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 0 | miss | yes | 0 | |
| 2 | 1 | miss | yes | 1 | |
| 3 | 0 | hit | no | 0 | |
| 4 | 2 | miss | yes | 2 | TLB drops page 1 |
| 5 | 0 | hit | no | 0 | |
| 6 | 3 | miss | yes | 1 | memory evicts page 1, TLB drops page 2 |
| 7 | 1 | miss | yes | 2 | memory evicts page 2, TLB drops page 0 |
| 8 | 0 | miss | no | 0 | page still in memory: a TLB miss without a page fault |

Totals: 2 TLB hits, 6 TLB misses, 5 page faults.

## Effective access time

The TLB is always consulted. On a hit one memory access follows, and on a miss the page table is read first:

```text
EAT = h × (tlb + mem) + (1 − h) × (tlb + levels × mem + mem)
h = 0.8, tlb = 10 ns, mem = 100 ns, 1 level:  0.8 × 110 + 0.2 × 210 = 130 ns
```

## Page replacement

| Algorithm | Victim | Comment |
| --- | --- | --- |
| FIFO | the page longest in memory | ignores use, subject to Belady's anomaly |
| Clock | walks a circle: R = 1 gets a second chance (R is cleared), the first R = 0 leaves | cheap approximation of LRU |
| LRU | the page whose last use is the oldest | good, expensive to implement exactly |
| Optimal | the page whose next use is farthest away | needs the future: a lower bound, not a real algorithm |

Counts checked by the tests, all with 3 frames:

| Reference string | FIFO | Clock | LRU | Optimal |
| --- | ---: | ---: | ---: | ---: |
| 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 | 15 | 14 | 12 | 9 |
| 1 2 3 1 4 2 5 1 2 3 | 8 | | | 6 |
| 4 1 4 2 3 4 1 2 | 7 | | 6 | 5 |
| 1 2 3 4 2 5 2 | 6 | 5 | | |

The last line is the second chance at work. After page 4 is loaded, all R bits were cleared by the hand. Page 2 is then used again, so R = 1. When page 5 faults, the hand finds page 2 with R = 1, clears it and evicts page 3. The next reference to page 2 is a hit, where FIFO would fault.

## Belady's anomaly

Reference string `1 2 3 4 1 2 5 1 2 3 4 5`:

| Frames | 1 | 2 | 3 | 4 | 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| FIFO | 12 | 12 | 9 | 10 | 5 |
| LRU | 12 | 12 | 10 | 8 | 5 |
| Optimal | 12 | 9 | 7 | 6 | 5 |

FIFO has 9 faults with 3 frames and 10 with 4. LRU and optimal are stack algorithms: the pages kept with n frames are always a subset of those kept with n + 1, so more memory never hurts.

## TLB size

20,000 accesses with locality of reference (95% of them inside a window of 16 pages that moves from time to time), 64 frames, clock replacement. Effective access time with a memory access of 100 ns, a TLB lookup of 1 ns and a 4-level page table:

| TLB entries | Hit ratio | Page faults | EAT (ns) |
| ---: | ---: | ---: | ---: |
| 4 | 22.43% | 1786 | 411.3 |
| 8 | 44.40% | 1786 | 323.4 |
| 16 | 81.10% | 1786 | 176.6 |
| 32 | 89.70% | 1786 | 142.2 |
| 64 | 91.07% | 1786 | 136.7 |

The jump happens when the TLB becomes as large as the hot window (16 pages): that is locality at work. The number of page faults does not depend on the TLB. Full tables: [`results/results.md`](../../../projects/operating-systems/paging-tlb/results/results.md).

## Run it

```sh
cd projects/operating-systems/paging-tlb
./setup-unix-paging-tlb.sh           # or setup-windows-paging-tlb.ps1
docker compose run --rm demo         # tables and results/
docker compose run --rm rust-demo    # the page-fault tables from Rust
```

## Two languages

TypeScript is the reference implementation, with one class per algorithm. In Rust the algorithm is an `enum` and the choice of the victim is a `match` that the compiler checks for missing cases, a missing value is an `Option` and the trace is borrowed. Both print identical page-fault tables.

## Source

Tanenbaum, Modern Operating Systems (4th edition), chapter 3, sections 3.3 and 3.4.
