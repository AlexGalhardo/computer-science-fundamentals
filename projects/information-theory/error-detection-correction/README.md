# error-detection-correction

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How does redundancy detect and repair flipped bits? This mini-project implements, in C++, three **detecting** codes (parity bit, Internet checksum, CRC-32) and three **correcting** codes (triple repetition, Hamming(7,4) and extended Hamming(8,4)), and a **noise simulator** that sends blocks through a binary symmetric channel and counts how many damaged blocks each scheme detected, corrected or missed.

Full explanation: [docs/en/information-theory/error-detection-correction.md](../../../docs/en/information-theory/error-detection-correction.md).

## Quiz topics it demonstrates

- `information-theory` / `error-detection`: parity and what it misses, additive checksum and its blindness to order, CRC as a polynomial remainder, burst guarantee, detection followed by retransmission.
- `information-theory` / `error-correction`: Hamming distance, repetition with majority vote, Hamming(7,4) encoding and syndrome, miscorrection of double errors, SECDED.
- `information-theory` / `channel-capacity-noise`: the binary symmetric channel, bit error rate against block error rate.
- `information-theory` / `encoding-hashing-encryption`: a CRC protects against accidents, not against an attacker.

## Run

The only requirement is Docker.

```sh
./setup-unix-error-detection-correction.sh        # Linux and macOS
./setup-windows-error-detection-correction.ps1    # Windows
```

The script builds the pinned image, runs the formatter check and the tests, and then runs the simulator.

## Structure

| Path | Content |
| --- | --- |
| `cpp/detection.hpp` | even parity, Internet checksum (RFC 1071), CRC-32 bit by bit and with a table |
| `cpp/hamming.hpp` | Hamming(7,4), extended Hamming(8,4), repetition (3,1) |
| `cpp/simulator.hpp` | pseudo-random generator, binary symmetric channel, tallies and the table |
| `cpp/demo.cpp` | the noise simulator |
| `cpp/test_codes.cpp` | the tests |
| `results/results.md` | the committed table |

Header-only C++23 with the standard library only. The code is compiled with `-Wall -Wextra -Werror` and checked with clang-format.

## Tests

```sh
docker compose run --rm cpp-test
```

- CRC-32 gives the standard check value `0xCBF43926` for the string `123456789`, bit by bit and with the table, and the two versions agree on random data.
- Hamming(7,4), exhaustively: every single-bit error in every one of the 16 codewords is corrected (16 × 7 cases), and every double error is miscorrected (16 × 21 cases).
- Hamming(8,4), exhaustively: every single error corrected (16 × 8) and every double error detected (16 × 28).
- Minimum distances 3 and 4 are measured over all pairs of codewords.
- Parity catches every single flip and misses every double flip. The checksum reproduces the RFC 1071 example and misses two swapped words, which CRC-32 catches.
- CRC-32 detects every burst of up to 12 bits at every position of a frame, and 100,000 random bursts of up to 32 bits.
- The simulator is deterministic, its counts add up, and the share of damaged blocks matches 1 − (1 − p)^n.

## Demo

```sh
docker compose run --rm demo
```

It prints the table and rewrites [results/results.md](results/results.md). The run is seeded, so the numbers are the same on every machine. 200,000 blocks per row. Excerpt (full table in the results file):

| Scheme | Block (bits) | BER | With errors | Detected | Corrected | Missed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Parity bit | 9 | 0.01 | 17220 | 16582 | 0 | 638 |
| Internet checksum | 272 | 0.01 | 186952 | 185317 | 0 | 1635 |
| CRC-32 | 288 | 0.01 | 188736 | 188736 | 0 | 0 |
| Repetition (3,1) | 3 | 0.01 | 6123 | 0 | 6068 | 55 |
| Hamming (7,4) | 7 | 0.01 | 13613 | 0 | 13225 | 388 |
| Hamming (8,4) SECDED | 8 | 0.01 | 15359 | 518 | 14825 | 16 |

What to read in it:

- **Detected** means "retransmit", **corrected** means "repaired on the spot", **missed** means "wrong data delivered as good". Missed is the column that matters.
- Parity misses every block with an even number of flips. CRC-32 misses nothing in more than 600,000 damaged frames.
- The checksum misses frames in which two flips cancel in the sum (the same bit position of two words, one going up and one going down).
- Hamming(7,4) repairs single errors but turns every double error into wrong data. One more bit, Hamming(8,4), turns almost all of those into detected errors.
- At a bit error rate of 0.01, 94% of the 288-bit frames arrive damaged. A small rate per bit is a large rate per frame.

## Limits

The channel flips bits independently. Real links also produce bursts, which is the case CRCs are designed for and Hamming codes are not. The codes work on one block at a time: there is no framing, retransmission protocol or interleaving.
