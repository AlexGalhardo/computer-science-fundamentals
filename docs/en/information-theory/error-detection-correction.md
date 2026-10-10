# Error detection and correction (MP-INFO-2)

> Versão em português: [docs/pt/information-theory/error-detection-correction.md](../../pt/information-theory/error-detection-correction.md) · Versión en español: [docs/es/information-theory/error-detection-correction.md](../../es/information-theory/error-detection-correction.md)

Code: [projects/information-theory/error-detection-correction](../../../projects/information-theory/error-detection-correction). Language: C++.

## What it teaches

A noisy channel flips bits. The sender cannot prevent that, but it can add **redundancy**: extra bits computed from the data. With a little redundancy the receiver notices that something changed (**detection**, followed by a retransmission). With more, it finds out which bit changed and flips it back (**correction**).

The idea behind both is **distance**. Only some bit patterns are valid words. If any two valid words differ in at least d positions (the minimum Hamming distance), then:

| Minimum distance | Guarantee |
| ---: | --- |
| 2 | detects 1 error (parity bit) |
| 3 | detects 2 errors, **or** corrects 1 (Hamming(7,4), repetition) |
| 4 | corrects 1 **and** detects 2 (extended Hamming(8,4)) |

In general, detecting d errors needs distance d + 1 and correcting d errors needs distance 2d + 1.

## Detecting

**Parity bit.** One bit that makes the number of 1 bits even. It is the XOR of all data bits. Any odd number of flips is caught, and any even number goes through.

**Internet checksum.** The data is read as 16-bit words, the words are added with the carries folded back in, and the complement of the sum is sent. It is cheap, and it is blind to anything that keeps the sum: two swapped words, or one bit going up in one word while the same bit goes down in another.

**CRC-32.** The message is a polynomial with coefficients 0 and 1, and the CRC is the remainder of its division by a fixed generator of degree 32. Subtraction is XOR, so the division is shifts and XORs:

```text
1101000 | 1011        message 1101, generator 1011 (degree 3), three zeros appended
1011
----
 1100
 1011
 ----
  1110
  1011
  ----
   1010
   1011
   ----
    001               remainder: the frame sent is 1101 001
```

A damaged frame escapes only if the error pattern is itself a multiple of the generator. That never happens for bursts of up to 32 bits, and for longer random damage it happens about once in 2^32. The implementation here is the reflected CRC-32 of Ethernet and zip, first bit by bit and then with a 256-entry table built at compile time. Both give `0xCBF43926` for `123456789`, the standard check value.

A CRC protects against accidents only. Anyone can recompute it, so it gives no protection against a deliberate change.

## Correcting

**Repetition (3,1).** Every bit is sent three times and the majority wins. It corrects one error per block and costs 3 bits per data bit.

**Hamming(7,4).** Four data bits and three parity bits, placed so that the parity checks point at the wrong bit:

```text
position   1   2   3   4   5   6   7
content    p1  p2  d1  p4  d2  d3  d4

p1 covers 1, 3, 5, 7      p2 covers 2, 3, 6, 7      p4 covers 4, 5, 6, 7

data 1011      ->  word      0 1 1 0 0 1 1
position 6 flips -> received 0 1 1 0 0 0 1
checks: p1 ok (0), p2 fails (1), p4 fails (1)  ->  syndrome 110 = 6  ->  flip position 6
```

The parity bits sit at the powers of two, and each position is covered by the parity bits whose numbers add up to it. So the failed checks, read as a binary number (the **syndrome**), are the position of the error. In the code the syndrome is computed as the XOR of the numbers of all positions that hold a 1.

Two errors are too many: the syndrome becomes the XOR of two positions, which names a third bit. The decoder flips it and delivers wrong data, believing it corrected an error.

**Extended Hamming(8,4), SECDED.** One more bit with the parity of the whole word tells an odd number of errors from an even one:

| Syndrome | Overall parity | Conclusion |
| --- | --- | --- |
| 0 | ok | no error |
| not 0 | wrong | one error: correct it |
| not 0 | ok | two errors: detect only |
| 0 | wrong | the overall parity bit itself was hit |

This is the scheme of ECC memory.

## The noise simulator

A binary symmetric channel flips each bit independently with probability BER (bit error rate). For each scheme and each BER, 200,000 blocks are sent and every damaged block is classified:

- **detected**: the receiver knows the block is bad (it would ask for a retransmission);
- **corrected**: the receiver repaired it and the data is right;
- **missed**: the receiver delivered wrong data as if it were right.

The simulator can tell a missed error because it knows what was sent. A real receiver cannot, which is exactly why this column matters.

| Scheme | Block (bits) | BER | Blocks | With errors | Detected | Corrected | Missed | Missed / with errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Parity bit | 9 | 0.0001 | 200000 | 179 | 179 | 0 | 0 | 0.000% |
| Parity bit | 9 | 0.001 | 200000 | 1748 | 1741 | 0 | 7 | 0.400% |
| Parity bit | 9 | 0.01 | 200000 | 17220 | 16582 | 0 | 638 | 3.705% |
| Parity bit | 9 | 0.05 | 200000 | 73783 | 60989 | 0 | 12794 | 17.340% |
| Parity bit | 9 | 0.1 | 200000 | 122342 | 86441 | 0 | 35901 | 29.345% |
| Internet checksum | 272 | 0.0001 | 200000 | 5284 | 5282 | 0 | 2 | 0.038% |
| Internet checksum | 272 | 0.001 | 200000 | 47332 | 47154 | 0 | 178 | 0.376% |
| Internet checksum | 272 | 0.01 | 200000 | 186952 | 185317 | 0 | 1635 | 0.875% |
| Internet checksum | 272 | 0.05 | 200000 | 200000 | 199986 | 0 | 14 | 0.007% |
| Internet checksum | 272 | 0.1 | 200000 | 200000 | 199997 | 0 | 3 | 0.002% |
| CRC-32 | 288 | 0.0001 | 200000 | 5634 | 5634 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.001 | 200000 | 49730 | 49730 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.01 | 200000 | 188736 | 188736 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.05 | 200000 | 199999 | 199999 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.1 | 200000 | 200000 | 200000 | 0 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.0001 | 200000 | 62 | 0 | 62 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.001 | 200000 | 658 | 0 | 658 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.01 | 200000 | 6123 | 0 | 6068 | 55 | 0.898% |
| Repetition (3,1) | 3 | 0.05 | 200000 | 28625 | 0 | 27107 | 1518 | 5.303% |
| Repetition (3,1) | 3 | 0.1 | 200000 | 54003 | 0 | 48351 | 5652 | 10.466% |
| Hamming (7,4) | 7 | 0.0001 | 200000 | 148 | 0 | 148 | 0 | 0.000% |
| Hamming (7,4) | 7 | 0.001 | 200000 | 1387 | 0 | 1380 | 7 | 0.505% |
| Hamming (7,4) | 7 | 0.01 | 200000 | 13613 | 0 | 13225 | 388 | 2.850% |
| Hamming (7,4) | 7 | 0.05 | 200000 | 60198 | 0 | 51186 | 9012 | 14.971% |
| Hamming (7,4) | 7 | 0.1 | 200000 | 104208 | 0 | 74134 | 30074 | 28.860% |
| Hamming (8,4) SECDED | 8 | 0.0001 | 200000 | 161 | 0 | 161 | 0 | 0.000% |
| Hamming (8,4) SECDED | 8 | 0.001 | 200000 | 1566 | 5 | 1561 | 0 | 0.000% |
| Hamming (8,4) SECDED | 8 | 0.01 | 200000 | 15359 | 518 | 14825 | 16 | 0.104% |
| Hamming (8,4) SECDED | 8 | 0.05 | 200000 | 67275 | 10395 | 55782 | 1098 | 1.632% |
| Hamming (8,4) SECDED | 8 | 0.1 | 200000 | 113827 | 30736 | 76245 | 6846 | 6.014% |

The run uses a hand-written generator with a fixed seed, so the table is the same on every machine: `docker compose run --rm demo`.

Reading the table:

- **Bit error rate against block error rate.** At BER 0.01 only 1 bit in 100 is wrong, yet 94% of the 288-bit frames are damaged: 1 − 0.99^288. Long frames need strong detection.
- **Parity** misses the blocks with an even number of flips, which become common as the BER grows.
- **The checksum** misses frames where two flips cancel in the sum. At a very high BER it misses fewer, only because heavily damaged frames rarely happen to keep the sum.
- **CRC-32** misses none of the more than 600,000 damaged frames. A random escape has probability 2^−32.
- **Repetition** at BER 0.1 delivers 5,652 wrong bits in 200,000, 2.8%, the value of 3p²(1 − p) + p³.
- **Hamming(7,4)** never says "detected": every block with two or more flips is delivered wrong. **Hamming(8,4)** moves most of them to the detected column, and what it still misses are blocks with three or more flips.
- **Correction is not free of risk.** A code that corrects must guess, and with more errors than it was designed for it guesses wrong. That is why very noisy links combine correction with a CRC on top.

## How the answers are verified

- CRC-32: the standard check value, agreement of the two implementations, all bursts of up to 12 bits at every position of a frame and 100,000 random bursts of up to 32 bits.
- Hamming(7,4): all 16 × 7 single errors corrected, all 16 × 21 double errors miscorrected, minimum distance 3.
- Hamming(8,4): all 16 × 8 single errors corrected, all 16 × 28 double errors detected, minimum distance 4.
- Parity: every single flip caught, every double flip missed. Checksum: the RFC 1071 example, and the swapped words it cannot see.
- Simulator: no noise means no damage, the same seed gives the same table, the counts add up, and the share of damaged blocks matches 1 − (1 − p)^n.

## Related quiz topics

`information-theory`: `error-detection`, `error-correction`, `channel-capacity-noise`, `encoding-hashing-encryption`.
