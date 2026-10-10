import random
from collections import Counter
from pathlib import Path

import pytest

import entropy
import huffman
import lz77
import report
import samples

PROJECT = Path(__file__).resolve().parent.parent


# EN: The property that makes a compressor lossless: decode(encode(x)) == x for every x.
# PT: A propriedade que torna um compressor sem perdas: decode(encode(x)) == x para todo x.
# ES: La propiedad que hace sin pérdidas a un compresor: decode(encode(x)) == x para todo x.
def assert_round_trip(data: bytes) -> None:
    assert huffman.decode(huffman.encode(data)) == data
    assert lz77.decode(lz77.encode(data)) == data


def test_entropy_of_known_inputs() -> None:
    assert entropy.bits_per_byte(b"A" * 5000) == 0.0
    assert entropy.bits_per_byte(bytes(range(256)) * 4) == pytest.approx(8.0, abs=1e-12)
    assert entropy.bits_per_byte(b"") == 0.0
    assert entropy.bits_per_byte(b"aabc") == pytest.approx(1.5)
    assert entropy.bits_per_byte(b"aaaabbcd") == pytest.approx(1.75)


def test_text_binary_and_empty_files_round_trip() -> None:
    assert_round_trip(samples.text())
    assert_round_trip(samples.random())
    assert_round_trip(b"")


def test_random_inputs_of_many_shapes_round_trip() -> None:
    # EN: Small alphabets produce long matches and deep trees; large ones produce none.
    # PT: Alfabetos pequenos produzem repetições longas e árvores fundas; os grandes, nenhuma.
    # ES: Los alfabetos pequeños producen repeticiones largas y árboles hondos; los grandes, no.
    generator = random.Random(42)
    for _ in range(200):
        alphabet = generator.randint(1, 256)
        length = generator.randrange(0, 600)
        assert_round_trip(bytes(generator.randrange(alphabet) for _ in range(length)))


def test_huffman_lengths_follow_the_frequencies() -> None:
    # A=5, B=2, C=1, D=1: C+D=2, then B+CD=4, then A+4=9. Depths 1, 2, 3, 3 and 15 bits in all.
    lengths = huffman.code_lengths(Counter(b"AAAAABBCD"))
    assert [lengths[symbol] for symbol in b"ABCD"] == [1, 2, 3, 3]
    assert len(huffman.encode(b"AAAAABBCD")) == huffman.HEADER_LEN + 2


def test_huffman_edge_cases() -> None:
    assert len(huffman.encode(b"")) == huffman.HEADER_LEN
    assert huffman.decode(huffman.encode(b"z")) == b"z"
    assert len(huffman.encode(bytes([7]) * 1000)) == huffman.HEADER_LEN + 125


def test_lz77_tokens() -> None:
    # EN: An overlapping copy (length > offset) repeats the pattern it is writing.
    # PT: Uma cópia sobreposta (comprimento > deslocamento) repete o padrão que está escrevendo.
    # ES: Una copia superpuesta (longitud > desplazamiento) repite el patrón que está escribiendo.
    assert lz77.expand([(0, 0, ord("a")), (0, 0, ord("b")), (2, 4, ord("c"))]) == b"abababc"
    assert lz77.tokenize(b"aaaaaaaaaa") == [(0, 0, ord("a")), (1, 8, ord("a"))]
    assert lz77.tokenize(b"abcdefabcdefX")[-1] == (6, 6, ord("X"))
    assert len(lz77.encode(bytes(range(256)))) == 8 + 4 * 256


def test_damaged_input_is_rejected() -> None:
    packed = huffman.encode(b"compression removes redundancy")
    for broken in (packed[:5], packed[:-1], packed[:8] + bytes(256) + packed[huffman.HEADER_LEN :]):
        with pytest.raises(huffman.DecodeError):
            huffman.decode(broken)
    packed = lz77.encode(b"abcabcabcabc")
    for broken in (packed[:4], packed[:-1], packed[:-4]):
        with pytest.raises(huffman.DecodeError):
            lz77.decode(broken)
    with pytest.raises(huffman.DecodeError):
        lz77.expand([(1, 1, 97)])


def test_same_bytes_as_the_rust_version() -> None:
    # EN: `fixtures/expected.tsv` was written by the Rust program. Equal sizes and fingerprints
    #     mean that samples, Huffman output and LZ77 output are identical in both languages.
    # PT: `fixtures/expected.tsv` foi escrito pelo programa em Rust. Tamanhos e impressões
    #     digitais iguais significam que as amostras, a saída do Huffman e a do LZ77 são
    #     idênticas nas duas linguagens.
    # ES: `fixtures/expected.tsv` lo escribió el programa en Rust. Tamaños y huellas digitales
    #     iguales significan que las muestras, la salida de Huffman y la de LZ77 son idénticas
    #     en los dos lenguajes.
    assert report.fixture() == (PROJECT / "fixtures" / "expected.tsv").read_text()
    assert report.markdown() == (PROJECT / "results" / "comparison-table.md").read_text()
