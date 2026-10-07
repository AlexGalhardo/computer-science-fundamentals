# Page reads per search: B-tree and binary search tree on disk

Output of the demo, committed as text. The numbers are counts of pages read, not times, so they do not depend on the machine: the C++ and the Rust implementations print exactly the same table.

- Commands: `docker compose run --rm cpp-test btree_demo` and `docker compose run --rm rust-test btree_demo`
- Images: `gcc:16.2.0-trixie` and `rust:1.99.0-slim-trixie`
- Run on Docker Engine 29.8.1 (Docker Desktop, kernel 6.18.33.2-microsoft-standard-WSL2), 2026-10-07
- Page size: 4096 bytes. B-tree: minimum degree 85, up to 169 keys per node. BST: 128 nodes of 32 bytes per page, in arrival order.
- Keys: n distinct pseudo-random 64-bit keys, inserted in the same order in both structures. Searches: 10,000 keys that exist, the same in both.

| Keys | B-tree levels | B-tree pages per search (avg / max) | BST height (nodes) | BST pages per search (avg / max) | B-tree file pages | BST file pages |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1000 | 2 | 1.99 / 2 | 25 | 3.26 / 7 | 10 | 9 |
| 10000 | 2 | 1.99 / 2 | 33 | 7.33 / 18 | 85 | 80 |
| 100000 | 3 | 2.99 / 3 | 41 | 11.90 / 26 | 891 | 783 |
| 1000000 | 3 | 2.99 / 3 | 50 | 16.46 / 34 | 8437 | 7814 |

Reading: the B-tree never reads more pages than its number of levels, and going from a thousand to a million keys adds one page. The binary tree on disk reads 16 pages on average and up to 34 for a million keys, although both files have almost the same size.
