import math

import entropy
import huffman
import lz77
import samples

MASK = (1 << 64) - 1


# EN: FNV-1a, a short non-cryptographic hash. It is only a fingerprint to prove that Rust and
#     Python produced the same bytes without committing the bytes themselves.
# PT: FNV-1a, um hash curto e não criptográfico. É só uma impressão digital para provar que Rust
#     e Python produziram os mesmos bytes sem versionar os próprios bytes.
# ES: FNV-1a, un hash corto y no criptográfico. Es solo una huella digital para probar que Rust
#     y Python produjeron los mismos bytes sin versionar los bytes mismos.
def fnv1a64(data: bytes) -> int:
    value = 0xCBF2_9CE4_8422_2325
    for byte in data:
        value = ((value ^ byte) * 0x0000_0100_0000_01B3) & MASK
    return value


# EN: Ratio = compressed size / original size. Below 1 the file shrank, above 1 it grew.
# PT: Taxa = tamanho comprimido / tamanho original. Abaixo de 1 o arquivo encolheu, acima de 1
#     ele cresceu.
# ES: Razón = tamaño comprimido / tamaño original. Por debajo de 1 el archivo se redujo, por
#     encima de 1 creció.
def cell(compressed: int, original: int) -> str:
    return f"{compressed} ({compressed / original:.3f})"


def markdown() -> str:
    lines = [
        "| Sample | Bytes | Entropy (bits/byte) | Entropy bound (bytes) "
        "| Huffman | LZ77 | LZ77 + Huffman |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for name, data in samples.all_samples():
        packed = lz77.encode(data)
        # EN: Huffman applied to the LZ77 output, the idea behind DEFLATE.
        # PT: Huffman aplicado à saída do LZ77, a ideia por trás do DEFLATE.
        # ES: Huffman aplicado a la salida de LZ77, la idea detrás de DEFLATE.
        both = huffman.encode(packed)
        size = len(data)
        lines.append(
            f"| `{name}` | {size} | {entropy.bits_per_byte(data):.3f} "
            f"| {math.ceil(entropy.bound_bytes(data))} | {cell(len(huffman.encode(data)), size)} "
            f"| {cell(len(packed), size)} | {cell(len(both), size)} |"
        )
    return "\n".join(lines) + "\n"


def fixture() -> str:
    lines = ["name\tsize\tsample\thuffman_size\thuffman\tlz77_size\tlz77\tboth_size"]
    for name, data in samples.all_samples():
        packed_huffman = huffman.encode(data)
        packed_lz77 = lz77.encode(data)
        lines.append(
            f"{name}\t{len(data)}\t{fnv1a64(data):016x}\t{len(packed_huffman)}\t"
            f"{fnv1a64(packed_huffman):016x}\t{len(packed_lz77)}\t{fnv1a64(packed_lz77):016x}\t"
            f"{len(huffman.encode(packed_lz77))}"
        )
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    print(markdown(), end="")
