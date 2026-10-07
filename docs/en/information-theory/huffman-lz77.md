# Huffman and LZ77 (MP-INFO-1)

> Versão em português: [docs/pt/information-theory/huffman-lz77.md](../../pt/information-theory/huffman-lz77.md)

Code: [projects/information-theory/huffman-lz77](../../../projects/information-theory/huffman-lz77). Languages: Rust and Python.

## What it teaches

Compression works by removing **redundancy**, and there are two different kinds of it:

| Redundancy | Example | Who removes it |
| --- | --- | --- |
| Some symbols are much more frequent than others | the letter `e` against the letter `z` | a symbol code: Huffman |
| Whole stretches come back | the same word, the same header, a run of zeros | a dictionary method: LZ77 |

**Entropy** says how much of the first kind exists, and therefore how far a symbol code can go.

## Entropy: the yardstick

For a file, the order-0 entropy is

```
H = sum over the byte values that appear of  p * log2(1 / p)      p = count / total
```

It is the average number of bits per byte that a symbol-by-symbol code needs at least. One repeated value gives 0, and 256 equally frequent values give 8. `H * size / 8` is the entropy bound in bytes shown in the table.

"Order 0" matters: each byte is looked at alone. A file made of `0, 1, 2, ..., 255` repeated has H = 8 and is still extremely predictable. Order-0 entropy is a limit for codes that treat symbols independently, not for every compressor.

## Huffman: short codes for frequent symbols

```
counts: A=5  B=2  C=1  D=1

1. join the two lightest:  C(1) + D(1)  -> node 2
2. join the two lightest:  B(2) + node 2 -> node 4
3. join the two lightest:  A(5) + node 4 -> root 9

        (9)
       /   \
      A    (4)            A = 0      1 bit
          /   \           B = 10     2 bits
         B    (2)         C = 110    3 bits
             /   \        D = 111    3 bits
            C     D
                          5*1 + 2*2 + 1*3 + 1*3 = 15 bits instead of 9 * 8 = 72
```

- Symbols sit only on leaves, so no code is the start of another (a **prefix code**) and the decoder never needs separators.
- A min-heap gives the two lightest nodes in O(log n).
- The decoder needs the same code. This project stores only the **code lengths** (256 bytes) and rebuilds the codes with a fixed rule, the canonical Huffman code. Together with the original size, the header costs 264 bytes.
- The average length L satisfies H ≤ L < H + 1. Equality needs every probability to be a power of 1/2. The floor is 1 bit per symbol, however predictable the file is.

## LZ77: point at what was already seen

The output is a list of tokens `(offset, length, literal)`: copy `length` bytes starting `offset` bytes back, then write one literal byte.

```
input:   a b c d e f a b c d e f X
tokens:  (0,0,a) (0,0,b) (0,0,c) (0,0,d) (0,0,e) (0,0,f) (6,6,X)
                                                           |
                                    "6 back, copy 6, then X"
```

- The dictionary is the data itself, inside a **sliding window** of 4,096 bytes. Nothing extra is sent: the decoder rebuilds the window as it writes.
- The copy may be longer than the offset. `a` followed by `(1, 8, a)` means ten `a`: the copy reads bytes it has just written. That is how a long run costs one token.
- Finding the longest match is the expensive part. An index of where each group of 3 bytes started gives the candidates. Decoding only copies, so it is much faster than encoding.
- This teaching format spends 4 bytes per token, even for a lone literal, so data with no repetition grows 4 times.

## The table

Five generated samples of 16,384 bytes. Sizes in bytes, ratio = compressed / original in brackets.

| Sample | Bytes | Entropy (bits/byte) | Entropy bound (bytes) | Huffman | LZ77 | LZ77 + Huffman |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-symbol` | 16384 | 0.000 | 0 | 2312 (0.141) | 268 (0.016) | 340 (0.021) |
| `byte-cycle` | 16384 | 8.000 | 16384 | 16648 (1.016) | 1284 (0.078) | 758 (0.046) |
| `random` | 16384 | 7.988 | 16361 | 16648 (1.016) | 65496 (3.998) | 24756 (1.511) |
| `skewed` | 16384 | 1.749 | 3583 | 3847 (0.235) | 8616 (0.526) | 6374 (0.389) |
| `text` | 16384 | 4.157 | 8513 | 8842 (0.540) | 8920 (0.544) | 6971 (0.425) |

| Sample | What it is | Lesson |
| --- | --- | --- |
| `single-symbol` | the byte `a` repeated | H = 0, but Huffman cannot spend less than 1 bit per byte: 2,048 bytes of codes plus the header. LZ77 needs 65 tokens |
| `byte-cycle` | 0 to 255, repeated | H = 8 and Huffman only adds its header. LZ77 sees the repetition and reaches 8%. Order-0 entropy is not the limit of a compressor that uses context |
| `random` | pseudo-random bytes | no redundancy of either kind. Every lossless compressor makes some inputs larger, and here both do |
| `skewed` | independent symbols with probabilities 1/2, 1/4, 1/8, 1/8 | the codes take 3,583 bytes, exactly the bound: Huffman is optimal when probabilities are powers of 1/2. LZ77 finds only chance repetitions |
| `text` | generated words and sentences | Huffman stays within 1% of the order-0 bound. LZ77 followed by Huffman goes below that bound, because repeated words are a redundancy that order 0 does not measure |

The last column is the idea of DEFLATE (gzip, zip, PNG): the dictionary stage removes repeated stretches, and the entropy stage then squeezes the uneven statistics of what is left.

## How the answers are verified

- **Entropy**: 0 for one symbol, 8 for uniform bytes, and distributions worked by hand (1.5 and 1.75 bits).
- **Lossless round trip**: `decode(encode(x)) == x` for both methods on text, binary and empty inputs, on the five samples, and on hundreds of random inputs with alphabets from 1 to 256 symbols.
- **Hand-worked cases**: the tree above, the overlapping copy, the token for a repeated stretch.
- **Source coding theorem**: on every sample the average Huffman code length is between H and H + 1.
- **Damaged input**: truncated or inconsistent data returns an error.
- **Two languages, one answer**: the samples come from a hand-written generator with the same constants in Rust and Python. `fixtures/expected.tsv` holds sizes and fingerprints written by the Rust program, and the tests of both languages must reproduce it, and the committed table, exactly.

## Running

```sh
./setup-unix-huffman-lz77.sh        # or setup-windows-huffman-lz77.ps1
docker compose run --rm rust-test cargo run --quiet --release -- compare
docker compose run --rm python-test python report.py
```

## Related quiz topics

`information-theory`: `shannon-entropy`, `source-coding-prefix-codes`, `huffman-coding`, `arithmetic-coding-lz-family`, `limits-of-compression`, `encoding-hashing-encryption`.
