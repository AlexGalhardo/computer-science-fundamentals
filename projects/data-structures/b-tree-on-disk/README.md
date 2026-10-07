# b-tree-on-disk

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A B-tree stored in a file, one node per 4096-byte page, with insertion (node split), search and removal (redistribution and merge), written in C++ and in Rust. A pager counts every page read. It teaches why databases and file systems use wide trees: what a search costs on disk is the number of pages it reads, and a wide tree reads 3 pages where a binary tree reads 16.

Full explanation: [docs/en/data-structures/b-tree-on-disk.md](../../../docs/en/data-structures/b-tree-on-disk.md).

## Quiz topics it demonstrates

- `data-structures` / `binary-search-trees`: the ordering property generalised to many keys per node, search by discarding subtrees, removal through the predecessor or successor.
- `data-structures` / `avl-trees` and `data-structures` / `red-black-trees`: the same goal, a guaranteed logarithmic height, reached by another route: all leaves at the same depth, with splits and merges instead of rotations.
- `data-structures` / `binary-trees-and-traversals`: height against number of nodes, and why the height is what a search pays.

## Run

The only requirement is Docker.

```sh
./setup-unix-b-tree-on-disk.sh        # Linux and macOS
./setup-windows-b-tree-on-disk.ps1    # Windows
```

The script builds one pinned image per language and runs format check, linter and tests in each. The tests take about 30 seconds per language, because they build a tree with a million keys through the pager. All files are written in `/tmp` inside the container.

## Structure

| Path | Content |
| --- | --- |
| `cpp/pager.hpp`, `rust/src/pager.rs` | the file seen as an array of pages, with read and write counters |
| `cpp/btree.hpp`, `rust/src/btree.rs` | the B-tree: search, insert with split, remove with redistribution and merge, invariant checker, free-page list |
| `cpp/disk_bst.hpp`, `rust/src/disk_bst.rs` | a binary search tree in the same kind of file, for comparison |
| `cpp/workload.hpp`, `rust/src/workload.rs` | builds both structures with the same keys and measures the page reads |
| `cpp/demo.cpp`, `rust/src/demo.rs` | the demo that prints the comparison table |
| `results/page-reads.md` | the committed comparison table |

Both languages use the same file layout (little-endian integers at fixed offsets) and the same algorithms.

## Tests

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- **Basics**: splits with minimum degree 2, search, replace, remove, and the tree read back after closing and reopening the file.
- **100,000 random operations**, three times (minimum degree 2, 3 and 85): every insert, remove and search is compared with the ordered map of the language, and the invariants are checked every 5,000 operations and at the end: legal number of keys per node, keys in order, all leaves at the same depth, key count equal to the header. Then every key is removed (the tree is back to one empty leaf) and inserted again twice, to prove that freed pages are reused.
- **Page reads**: with 1,000,000 keys the tree has 3 levels, and none of 10,000 successful and 10,000 failed searches reads more than 3 pages.

## Demo: the comparison table

```sh
docker compose run --rm cpp-test btree_demo
docker compose run --rm rust-test btree_demo
```

Prints the pages read per search for a B-tree and for a binary search tree on disk, with 1,000 to 1,000,000 keys. Pass a smaller limit as the first argument for a faster run, for example `btree_demo 100000`. The committed output is [results/page-reads.md](results/page-reads.md).
