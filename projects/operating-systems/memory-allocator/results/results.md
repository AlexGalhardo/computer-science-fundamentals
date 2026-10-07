# memory-allocator: results

Command: `docker compose run --rm demo`

The benchmark is a deterministic simulation (seeded generator, no timing), so the numbers do not depend on the machine. The Rust implementation prints the same table.

- **Failed**: allocations refused because no free block was large enough.
- **External fragmentation**: share of the free memory that is not in the largest free block, averaged over all steps.
- **Internal fragmentation**: bytes reserved but not requested, as a share of the used memory, averaged over all steps.

## Workload: mixed (arena 1048576 bytes, 20000 steps, seed 2026)

| Strategy | Attempts | Failed | Failed % | External fragmentation % | Internal fragmentation % | Peak used (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| first-fit | 11054 | 905 | 8.19 | 80.54 | 0.00 | 969266 |
| best-fit | 11054 | 868 | 7.85 | 78.65 | 0.00 | 1013220 |
| worst-fit | 11054 | 1258 | 11.38 | 95.72 | 0.00 | 653051 |
| buddy | 11054 | 1098 | 9.93 | 68.07 | 25.48 | 1047424 |

## Workload: small (arena 65536 bytes, 20000 steps, seed 2026)

| Strategy | Attempts | Failed | Failed % | External fragmentation % | Internal fragmentation % | Peak used (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| first-fit | 10973 | 1445 | 13.17 | 77.78 | 0.00 | 60744 |
| best-fit | 10973 | 1407 | 12.82 | 74.81 | 0.00 | 63383 |
| worst-fit | 10973 | 1535 | 13.99 | 95.57 | 0.00 | 51119 |
| buddy | 10973 | 1559 | 14.21 | 72.90 | 24.44 | 65536 |

