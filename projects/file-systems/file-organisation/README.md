# file-organisation

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How records, free space and indexes live inside files, written in C++ and in Rust. A data file of fixed-length records with a header gives direct access by relative record number (RRN) and reuses deleted slots through a free list kept inside the file. A primary index and two secondary indexes with inverted lists answer searches without scanning the file. Run-length encoding and Huffman coding compress the data file and report the ratio.

Plan item: MP-FS-1. Full explanation: [docs/en/file-systems/file-organisation.md](../../../docs/en/file-systems/file-organisation.md).

## What it teaches

- With fixed-length records the position of a record is computed, not searched for: byte offset = 32 + RRN x 64. One seek reads any record.
- Deleting marks a slot and pushes it on a stack whose head is in the header. The next insertion pops it, so the file does not grow while there are free slots.
- An index separates the search order from the data: small sorted entries in memory, records in arrival order on disk. A search by city reads only the slots that match, where a scan reads every slot of the file.
- A secondary index that stores primary keys (late binding) does not change when a record is deleted or moved. Only the primary index does.
- An index kept in memory needs an out-of-date flag on disk, so that a session that ended badly is detected and the index is rebuilt from the data.
- Padding compresses very well. Run-length encoding removes the runs of spaces, Huffman coding gives short codes to frequent bytes, and the two can be chained.

## Quiz topics it demonstrates

Area `file-systems`:

- `record-organisation`: fixed-length records and their padding, header record, RRN and byte offset, why direct access needs a fixed size.
- `indexes`: simple index and binary search, secondary index, inverted lists, late binding, matching two lists (AND), the out-of-date flag and the rebuild.
- `compression-and-space-reclamation`: free list as a stack inside the file, run-length encoding, Huffman codes and the prefix property.

## Run

The only requirement is Docker.

```sh
./setup-unix-file-organisation.sh        # Linux and macOS
./setup-windows-file-organisation.ps1    # Windows
```

The script builds one pinned image per language (`gcc:16.2.0-trixie` and `rust:1.99.0-slim-trixie`) and runs format check, linter and tests in each. Nothing is installed on the host and there is no dependency besides the standard library of each language. Every file the programs create lives in `/tmp` inside the container.

## Structure

| Path | Content |
| --- | --- |
| `cpp/record_file.hpp`, `rust/src/record_file.rs` | the data file: header, fixed-length slots, RRN access, free list |
| `cpp/indexes.hpp`, `rust/src/indexes.rs` | primary index with counted binary search, secondary index with inverted lists, cosequential matching |
| `cpp/database.hpp`, `rust/src/database.rs` | data file plus indexes: insert, remove, search by id, city and year, full scan, out-of-date flag and rebuild |
| `cpp/compression.hpp`, `rust/src/compression.rs` | run-length encoding and Huffman coding |
| `cpp/workload.hpp`, `rust/src/workload.rs` | seeded generator of records and the demo |
| `cpp/demo.cpp`, `rust/src/demo.rs` | the demo command |
| `results/demo.md` | the committed output of the demo |

Both languages use the same file layouts (little-endian integers at fixed offsets), the same algorithms and the same pseudo-random generator (SplitMix64, seed 20261007), so they write byte-identical files and print the same tables.

## Tests

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- **Free list (MP-FS-1.1)**: 1,000 records take 32 + 1,000 x 64 bytes. After 334 deletions the file has the same size, after 334 insertions it still has the same size and every new record went to a slot below 1,000, and one more insertion makes it grow by exactly 64 bytes. Slots are reused in LIFO order, and header and records are read back after reopening the file.
- **Index against scan (MP-FS-1.2)**: 6,000 random insertions and removals over 3,000 ids, checked against the ordered map of the language. Then, for each of the 12 cities, 27 years and 27 pairs of city and year, the search through the indexes returns exactly the records of a full scan. The comparison is repeated with indexes loaded from disk and with indexes rebuilt after a session that did not close.
- **Compression (MP-FS-1.3)**: both methods and their chain give back the original bytes for nine inputs (empty, one byte, one distinct byte, only marker bytes, runs, a skewed alphabet, random bytes, the data file). Sizes worked out by hand are asserted: 18 bytes with two long runs become 10, and 100 symbols with frequencies 45, 25, 15, 10 and 5 take 200 bits.
- **Demo**: the output of the demo equals `results/demo.md`, in both languages.

## Demo

```sh
docker compose run --rm cpp-test forg_demo
docker compose run --rm rust-test forg_demo
```

Prints four tables for 10,000 records: file size after each step of the free-list scenario, slots read by a scan against slots read through the index, what the next open did after a clean and an unclean end, and the compressed sizes with their ratios. Pass another number of records (100 to 50,000) as the first argument. Every number is a count, not a time, so the output does not depend on the machine. The committed output is [results/demo.md](results/demo.md):

| Method | Bytes | Ratio (compressed / original) |
| --- | ---: | ---: |
| none | 672,096 | 1.000 |
| run-length | 452,375 | 0.673 |
| Huffman | 383,834 | 0.571 |
| run-length, then Huffman | 357,092 | 0.531 |

## Limits

- Records have a fixed length only. Variable-length records, with first-fit, best-fit and worst-fit, are covered by the quiz and not implemented.
- The secondary indexes are never cleaned while the files are open: keys of removed records stay in the lists and are filtered through the primary index. A rebuild is what drops them.
- The Huffman file stores the 256 frequencies (1,032 bytes of header), so small inputs get larger.
- Huffman and LZ77 against the entropy of the source are the subject of another mini-project, `projects/information-theory/huffman-lz77`. No code is shared: this mini-project has its own Huffman coder.
