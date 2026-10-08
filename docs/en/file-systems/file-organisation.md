# File organisation and indexes

> Versão em português: [docs/pt/file-systems/file-organisation.md](../../pt/file-systems/file-organisation.md)

Mini-project: [projects/file-systems/file-organisation](../../../projects/file-systems/file-organisation). Languages: C++, Rust. Quiz topics: `file-systems` / `record-organisation`, `indexes`, `compression-and-space-reclamation`.

## The problem

To the operating system a file is a sequence of bytes. Fields, records, keys and free space are an interpretation that the program has to write into the file, in a way that lets it be read back. And because an access to disk costs about a hundred thousand times more than an access to memory, the organisation is judged by how many reads a search needs, not by how many comparisons.

This mini-project builds the classic answers one on top of the other: fixed-length records, a header, a free list, a primary index, secondary indexes, and compression.

## The data file

```
byte 0                     32             96             160
     +----------------------+--------------+--------------+-----
     | header (32 bytes)    | slot, RRN 0  | slot, RRN 1  | ...
     +----------------------+--------------+--------------+-----
```

| Header field | Bytes | Meaning |
| --- | --- | --- |
| magic | 0 to 3 | `FORG` |
| version | 4 to 7 | 1 |
| record size | 8 to 11 | 64 |
| slot count | 12 to 15 | slots in the file, live or free |
| live count | 16 to 19 | records in use |
| free head | 20 to 23 | RRN of the top of the free list, or -1 |

| Slot field | Bytes | Meaning |
| --- | --- | --- |
| tag | 0 | 0x01 for a live record, `*` for a free slot |
| id | 1 to 4 | primary key (in a free slot: RRN of the next free slot) |
| year | 5 to 6 | |
| city | 7 to 26 | text padded with spaces |
| name | 27 to 63 | text padded with spaces |

Integers are little-endian at fixed positions, so the file does not depend on the machine or on the language that wrote it.

Because every slot has 64 bytes, the slot with relative record number (RRN) n starts at **byte 32 + n x 64**. RRNs start at zero. Reading record 25 is one seek to byte 1,632, with no other record read. The price is the padding: a city of 6 letters still takes 20 bytes.

## The free list

Deleting a record does not move anything. The slot is marked with `*`, the old head of the free list is written inside it, and the header now points to this slot. The list is a stack that lives in the space it manages:

```
delete RRN 3, then 7, then 2:      header.free_head = 2
                                   slot 2: * next 7
                                   slot 7: * next 3
                                   slot 3: * next -1
insert X:                          X goes to slot 2, header.free_head = 7
```

An insertion pops the top of the stack, and the file grows only when the stack is empty. Any free slot fits any record, which is why a stack is enough here. With variable-length records the list would have to be searched for a slot that fits (first-fit, best-fit, worst-fit).

## The primary index

The index is a list of fixed-length entries (id, RRN) sorted by id. The data file stays in arrival order. Searching for an id is a binary search in memory, at most 14 probes for 10,500 entries, followed by one slot read.

The index lives in memory while the files are open and is written to `primary.idx` by `close()`. The file has an **out-of-date flag** in its header. Before the first change of a session the flag is set on disk, and `close()` clears it. If the next open finds the flag set, the last session did not finish, and the index is rebuilt by reading the data file. The data is the truth and the index is derived from it.

## Secondary indexes and inverted lists

A secondary index answers searches by a field that repeats, here the city and the year. It has two parts:

```
key table (city.sec)             list file (city.lst)
NATAL   -> 1                     0: id 30, next -1
RECIFE  -> 2                     1: id 20, next -1
                                 2: id 10, next 3
                                 3: id 20, next 0
```

The key table has one entry per city, with the position of the first node of a linked list. Each node holds a **primary key** and the position of the next node. Adding a record appends one node and changes one link, whatever the length of the list.

Two decisions matter:

- **Late binding.** The lists hold primary keys, not RRNs. A search by city goes through the primary index to find each record. That costs one more lookup in memory, and in exchange a deletion touches only the primary index: the key of the removed record stays in the list and is dropped when the primary index does not know it.
- **Sorted lists.** Each list is kept in increasing order of primary key, so the query "city = RECIFE and year = 2010" is a cosequential match: both lists are walked once, advancing the one with the smaller key.

## Compression

- **Run-length encoding**: a run of 4 or more equal bytes becomes 3 bytes (marker 0xFF, value, count up to 255). A data byte equal to the marker is always written as a run. It removes the padding of the records.
- **Huffman coding**: the two least frequent nodes are joined until one tree is left, and the code of a byte is its path from the root. Frequent bytes get short codes, and no code is the beginning of another. The compressed file stores the original length and the 256 frequencies, from which the decoder rebuilds the same tree.

## What the tests prove

| Plan item | Test |
| --- | --- |
| MP-FS-1.1 deleted slots are reused | the file has the same size after 334 deletions and after the 334 insertions that follow, every reused slot is below the old end of the file, and one more insertion adds exactly 64 bytes |
| MP-FS-1.2 index search equals full scan | after 6,000 random insertions and removals, the searches by city, by year and by both return exactly the records of a full scan, with the indexes of the session, loaded from disk and rebuilt after an unclean end |
| MP-FS-1.3 lossless round trip and ratio | nine inputs survive encode and decode with both methods and their chain, hand-computed sizes are asserted, and the demo reports the ratios |

## The demo

The demo prints counts, never times, so its output is the same on any machine and in both languages. It is committed in [results/demo.md](../../../projects/file-systems/file-organisation/results/demo.md), and a test in each language compares the output with that file.

| Step | Slots in the file | Live records | Free slots | File size (bytes) |
| --- | ---: | ---: | ---: | ---: |
| insert 10000 records | 10000 | 10000 | 0 | 640032 |
| delete 3000 records | 10000 | 7000 | 3000 | 640032 |
| insert 3000 records | 10000 | 10000 | 0 | 640032 |
| insert 500 records | 10500 | 10500 | 0 | 672032 |

A search by city reads about 880 slots through the index, the ones that match, against 10,500 for the scan. The data file of 672,096 bytes shrinks to 67.3% with run-length encoding, to 57.1% with Huffman coding and to 53.1% with one after the other.

## Limits of this implementation

- Fixed-length records only, with no variable-length records and no placement strategies.
- The indexes fit in memory. An index too large for memory is the subject of [B-tree on disk](../data-structures/b-tree-on-disk.md).
- Secondary lists are cleaned only by a rebuild.
- No protection against a crash in the middle of a write to the data file: that is what a journal is for.

## Run it

```sh
cd projects/file-systems/file-organisation
./setup-unix-file-organisation.sh            # or ./setup-windows-file-organisation.ps1
docker compose run --rm cpp-test forg_demo   # or rust-test
```
