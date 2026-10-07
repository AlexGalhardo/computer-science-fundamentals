# EN: The five sample files are generated, not downloaded, so the table can be reproduced
#     anywhere and nothing is copied from a third party. Each one isolates a kind of redundancy.
#     The comments on what each sample shows are in `rust/src/samples.rs`; this file mirrors it.
# PT: Os cinco arquivos de amostra são gerados, e não baixados, então a tabela pode ser
#     reproduzida em qualquer lugar e nada é copiado de terceiros. Cada um isola um tipo de
#     redundância. Os comentários sobre o que cada amostra mostra estão em `rust/src/samples.rs`;
#     este arquivo o espelha.
SAMPLE_SIZE = 16 * 1024
SEED = 0x001F_07E0
MASK = (1 << 64) - 1

WORDS = [
    "the", "a", "of", "to", "and", "in", "is", "bit", "code", "byte", "symbol", "source", "tree",
    "short", "long", "rare", "common", "entropy", "message", "window", "match", "length", "prefix",
    "channel", "noise", "signal", "pattern", "repeat", "count", "table", "sender", "receiver",
    "redundancy", "compress", "information", "frequency", "dictionary", "literal", "offset",
    "decode",
]  # fmt: skip


# EN: The same xorshift64* generator as the Rust version. Rust integers wrap at 64 bits by
#     themselves; Python integers grow without limit, so every step that can overflow is cut
#     back to 64 bits with `& MASK`.
# PT: O mesmo gerador xorshift64* da versão em Rust. Os inteiros do Rust dão a volta em 64 bits
#     sozinhos; os do Python crescem sem limite, então cada passo que pode transbordar é cortado
#     de volta para 64 bits com `& MASK`.
class Rng:
    def __init__(self, seed: int) -> None:
        self.state = max(seed, 1)

    def next_u64(self) -> int:
        self.state ^= self.state >> 12
        self.state ^= (self.state << 25) & MASK
        self.state ^= self.state >> 27
        return (self.state * 0x2545_F491_4F6C_DD1D) & MASK

    def below(self, n: int) -> int:
        return (self.next_u64() >> 33) % n


def single_symbol() -> bytes:
    return b"a" * SAMPLE_SIZE


def byte_cycle() -> bytes:
    return bytes(i % 256 for i in range(SAMPLE_SIZE))


def random() -> bytes:
    rng = Rng(SEED)
    return bytes(rng.next_u64() >> 56 for _ in range(SAMPLE_SIZE))


def skewed() -> bytes:
    # Probabilities 1/2, 1/4, 1/8, 1/8.
    rng = Rng(SEED + 1)
    return bytes(b"aaaabbcd"[rng.below(8)] for _ in range(SAMPLE_SIZE))


def text() -> bytes:
    rng = Rng(SEED + 2)
    out = bytearray()
    while len(out) < SAMPLE_SIZE:
        first = rng.below(len(WORDS))
        second = rng.below(len(WORDS))
        out += WORDS[min(first, second)].encode()
        out += b".\n" if rng.below(12) == 0 else b" "
    return bytes(out[:SAMPLE_SIZE])


def all_samples() -> list[tuple[str, bytes]]:
    return [
        ("single-symbol", single_symbol()),
        ("byte-cycle", byte_cycle()),
        ("random", random()),
        ("skewed", skewed()),
        ("text", text()),
    ]
