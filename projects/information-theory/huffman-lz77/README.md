# huffman-lz77

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

How far can a file shrink, and why? This mini-project measures the **Shannon entropy** of a file, compresses it with **Huffman coding** (short codes for frequent bytes) and with **LZ77** (references to repeated stretches), and puts the three numbers side by side for five generated sample files. The same code is written in Rust and in Python, and the two produce byte-identical output.

Full explanation: [docs/en/information-theory/huffman-lz77.md](../../../docs/en/information-theory/huffman-lz77.md).

## Quiz topics it demonstrates

- `information-theory` / `shannon-entropy`: order-0 entropy of a file, 0 bits for one symbol and 8 bits for uniform bytes, and why order 0 is not the limit for a compressor that uses context.
- `information-theory` / `source-coding-prefix-codes`: prefix codes, greedy decoding, average length between H and H + 1.
- `information-theory` / `huffman-coding`: joining the two lightest nodes with a heap, code lengths, the header the decoder needs, the 1-bit floor per symbol.
- `information-theory` / `arithmetic-coding-lz-family`: LZ77 triples (offset, length, literal), overlapping copies, the sliding window, LZ77 followed by Huffman as in DEFLATE.
- `information-theory` / `limits-of-compression`: lossless round trip, random data that grows when "compressed".
- `information-theory` / `encoding-hashing-encryption`: data that looks random (such as ciphertext) cannot be compressed.

## Run

The only requirement is Docker.

```sh
./setup-unix-huffman-lz77.sh        # Linux and macOS
./setup-windows-huffman-lz77.ps1    # Windows
```

The script builds the two pinned images and runs, for each language, the formatter check, the linter and the tests.

## Structure

| Path | Content |
| --- | --- |
| `rust/src/entropy.rs`, `python/entropy.py` | order-0 Shannon entropy of a byte sequence |
| `rust/src/huffman.rs`, `python/huffman.py` | Huffman tree, canonical codes, encoder and decoder |
| `rust/src/lz77.rs`, `python/lz77.py` | LZ77 tokens, encoder and decoder |
| `rust/src/samples.rs`, `python/samples.py` | the five generated sample files |
| `rust/src/report.rs`, `python/report.py` | the comparison table and the cross-language fixture |
| `rust/src/main.rs` | command line: `compare`, `entropy`, `compress`, `decompress` |
| `fixtures/expected.tsv` | sizes and fingerprints that both languages must reproduce |
| `results/comparison-table.md` | the committed table |

The Rust crate has no dependencies and the Python code uses only the standard library.

## Tests

```sh
docker compose run --rm rust-test
docker compose run --rm python-test
```

- Entropy: one repeated symbol gives 0 and uniform bytes give 8 bits per byte.
- Round trip `decode(encode(x)) == x` for Huffman and LZ77 on text, binary and empty inputs, on the five samples and on hundreds of random inputs.
- Known cases worked by hand: Huffman lengths 1, 2, 3, 3 for the counts 5, 2, 1, 1; the LZ77 overlapping copy that turns `ab` + (2, 4, `c`) into `abababc`.
- Damaged input is rejected with an error instead of producing wrong data.
- Both languages reproduce `fixtures/expected.tsv` and `results/comparison-table.md` exactly, which proves that they generate the same samples and the same compressed bytes.

## Demo

```sh
docker compose run --rm rust-test cargo run --quiet --release -- compare
docker compose run --rm python-test python report.py
```

Both print the table below (sizes in bytes, ratio = compressed / original in brackets). The sizes are deterministic, so the table does not depend on the machine.

| Sample | Bytes | Entropy (bits/byte) | Entropy bound (bytes) | Huffman | LZ77 | LZ77 + Huffman |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-symbol` | 16384 | 0.000 | 0 | 2312 (0.141) | 268 (0.016) | 340 (0.021) |
| `byte-cycle` | 16384 | 8.000 | 16384 | 16648 (1.016) | 1284 (0.078) | 758 (0.046) |
| `random` | 16384 | 7.988 | 16361 | 16648 (1.016) | 65496 (3.998) | 24756 (1.511) |
| `skewed` | 16384 | 1.749 | 3583 | 3847 (0.235) | 8616 (0.526) | 6374 (0.389) |
| `text` | 16384 | 4.157 | 8513 | 8842 (0.540) | 8920 (0.544) | 6971 (0.425) |

What to read in it:

- **`skewed`**: Huffman lands on the entropy bound (3,583 bytes of codes plus the 264-byte header). LZ77 does much worse, because independent symbols have no repeated structure to point at.
- **`single-symbol`**: the entropy is 0, yet Huffman cannot go below 1 bit per byte. LZ77 describes the whole file with 65 tokens.
- **`byte-cycle`**: the order-0 entropy is the maximum, 8 bits, and Huffman gains nothing, yet LZ77 shrinks the file to 8%. Order-0 entropy bounds symbol codes only.
- **`random`**: nothing compresses. Huffman adds its header, and this simple LZ77 format multiplies the size by 4.
- **`text`**: both redundancies exist, and LZ77 followed by Huffman beats each one alone and the order-0 bound.

To compress a file of your own (run from this folder; on Windows PowerShell use `${PWD}` instead of `$PWD`):

```sh
docker compose run --rm -v "$PWD:/data" rust-test cargo run --quiet --release -- compress huffman /data/README.md /data/README.huff
docker compose run --rm -v "$PWD:/data" rust-test cargo run --quiet --release -- entropy /data/README.md
```

## Limits

Teaching formats, not production ones: the Huffman header always costs 264 bytes, LZ77 spends 4 bytes on every token (even for a single literal), the window is 4,096 bytes, and whole files are read into memory. Real formats such as DEFLATE fix each of these points.
