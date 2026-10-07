# paging-tlb: results

Command: `docker compose run --rm demo`

The simulation is deterministic (seed 2026), so the numbers do not depend on the machine. The Rust implementation prints the same page-fault tables.

## Page faults per number of frames

Reference string: `7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1`

| Frames | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| fifo | 20 | 15 | 15 | 10 | 9 | 6 | 6 |
| clock | 20 | 15 | 14 | 9 | 9 | 6 | 6 |
| lru | 20 | 17 | 12 | 8 | 7 | 6 | 6 |
| optimal | 20 | 13 | 9 | 8 | 7 | 6 | 6 |

## Belady's anomaly

Reference string: `1 2 3 4 1 2 5 1 2 3 4 5`

| Frames | 1 | 2 | 3 | 4 | 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| fifo | 12 | 12 | 9 | 10 | 5 |
| lru | 12 | 12 | 10 | 8 | 5 |
| optimal | 12 | 9 | 7 | 6 | 5 |

FIFO has more faults with 4 frames than with 3. LRU and optimal never get worse with more memory.

## TLB size against hit ratio

20000 accesses with locality of reference, 64 frames, clock replacement. Effective access time (EAT) with a memory access of 100 ns, a TLB lookup of 1 ns and a 4-level page table.

| TLB entries | TLB hits | TLB misses | Hit ratio | Page faults | EAT (ns) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 4486 | 15514 | 22.43% | 1786 | 411.3 |
| 8 | 8880 | 11120 | 44.40% | 1786 | 323.4 |
| 16 | 16220 | 3780 | 81.10% | 1786 | 176.6 |
| 32 | 17941 | 2059 | 89.70% | 1786 | 142.2 |
| 64 | 18214 | 1786 | 91.07% | 1786 | 136.7 |
