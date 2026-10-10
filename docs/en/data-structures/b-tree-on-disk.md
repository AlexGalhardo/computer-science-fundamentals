# B-tree on disk

> Versão em português: [docs/pt/data-structures/b-tree-on-disk.md](../../pt/data-structures/b-tree-on-disk.md) · Versión en español: [docs/es/data-structures/b-tree-on-disk.md](../../es/data-structures/b-tree-on-disk.md)

Mini-project: [projects/data-structures/b-tree-on-disk](../../../projects/data-structures/b-tree-on-disk). Languages: C++, Rust. Quiz topics: `data-structures` / `binary-search-trees`, `avl-trees`, `red-black-trees`.

## The problem

In memory, following a pointer costs nanoseconds, so the cost of a search tree is the number of comparisons. On disk, data is read in **pages** (here 4096 bytes), and fetching a page costs thousands of times more than comparing keys already in memory. The cost of a search becomes the number of pages it reads.

A balanced binary tree with a million keys is about 20 levels tall. If each node lives in a different page, a search reads about 20 pages. The B-tree fixes this by making each node as large as a page.

## The structure

A node holds many keys in order, and one child between each pair of keys:

```text
                  [ 30 | 60 ]
                 /     |     \
     [ 10 | 20 ]   [ 40 | 50 ]   [ 70 | 80 | 90 ]
```

With minimum degree t:

- every node except the root has between t - 1 and 2t - 1 keys,
- an internal node with k keys has k + 1 children,
- the keys of a node are sorted, and child i holds only keys between key i - 1 and key i,
- **all leaves are at the same depth**.

In this mini-project a page fits 169 keys, 169 values and 170 child page numbers, so t = 85. A million keys fit in 3 levels.

## The file

| Page | Content |
| --- | --- |
| 0 | header: magic number, minimum degree, root page, key count, height, head of the free-page list |
| any other | one node, or a free page that stores the number of the next free page |

Children are **page numbers**, not memory addresses. A pointer means nothing after the program ends, a page number is valid for as long as the file exists. The **pager** is the only code that touches the file, and it counts every page read and written. It has no cache on purpose: one node visited is one page read.

## The operations

**Search** reads one page per level, binary-searches the keys inside it and follows one child.

**Insert** goes down once. Before entering a full child it **splits** it: the middle key goes up to the parent and half of the keys move to a new page.

```text
before: parent [ 50 ]            child [ 10 | 20 | 30 ]  (full, t = 2)
after:  parent [ 20 | 50 ]       children [ 10 ] and [ 30 ]
```

When the root itself is full, it is split under a new root. This is the only way the tree gets taller, and it makes every leaf one level deeper at the same time.

**Remove** also goes down once. Before entering a child with only t - 1 keys, it refills it:

- **redistribution**: a sibling with spare keys lends one through the parent (the parent key goes down, the key of the sibling goes up),
- **merge**: when no sibling can lend, the child, one sibling and the parent key between them become one node, and a page is freed.

A key found in an internal node is replaced by its predecessor or successor, which is in a leaf, and that one is removed. When the root is left with no keys, its only child becomes the root and the tree gets one level shorter.

Freed pages go to a linked list inside the file and are reused before the file grows.

## What the tests prove

- 100,000 random operations with minimum degree 2, 3 and 85 give the same answers as the ordered map of the language, and after them the invariants hold: number of keys per node, order, equal leaf depth.
- With 1,000,000 keys the tree has 3 levels and no search, successful or not, reads more than 3 pages.

## The comparison

The same keys go into a binary search tree stored in the same kind of file (128 nodes per page, in arrival order). Committed result: [results/page-reads.md](../../../projects/data-structures/b-tree-on-disk/results/page-reads.md).

| Keys | B-tree levels | B-tree pages per search (avg / max) | BST height (nodes) | BST pages per search (avg / max) |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 2 | 1.99 / 2 | 25 | 3.26 / 7 |
| 10,000 | 2 | 1.99 / 2 | 33 | 7.33 / 18 |
| 100,000 | 3 | 2.99 / 3 | 41 | 11.90 / 26 |
| 1,000,000 | 3 | 2.99 / 3 | 50 | 16.46 / 34 |

These are counts, not times, and the C++ and Rust programs print the same table. The binary tree here is not balanced (height 50 for a million random keys). A perfectly balanced one would still be about 20 nodes tall, and it would save only the first few levels, which share a page. The gain of the B-tree comes from the width of the node, not from better balancing.

## Limits of this implementation

- The BST file is built in memory and written once. Only its searches run against the file.
- There is no cache, no write-ahead log and no concurrency control. A crash in the middle of a split can leave the file inconsistent. Real databases add those layers on top of the same structure.

## Run it

```sh
cd projects/data-structures/b-tree-on-disk
./setup-unix-b-tree-on-disk.sh          # or ./setup-windows-b-tree-on-disk.ps1
docker compose run --rm cpp-test btree_demo
```
