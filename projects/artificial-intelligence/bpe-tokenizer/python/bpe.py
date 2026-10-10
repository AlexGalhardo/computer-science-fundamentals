"""EN: Byte-pair encoding (BPE) in Python, the same algorithm as ts/src/bpe.ts.

Python is here because the lesson changes: `bytes` is a built-in type, so "text is bytes, a token
is a run of bytes" can be read directly in the code, and the result must be identical to the
TypeScript one, which proves that the algorithm (and its tie-break rule) is fully specified.

PT: Byte-pair encoding (BPE) em Python, o mesmo algoritmo de ts/src/bpe.ts.

O Python está aqui porque a lição muda: `bytes` é um tipo nativo, então "texto são bytes, um
token é uma sequência de bytes" pode ser lido direto no código, e o resultado precisa ser idêntico
ao do TypeScript, o que prova que o algoritmo (e a sua regra de desempate) está todo especificado.

ES: Byte-pair encoding (BPE) en Python, el mismo algoritmo de ts/src/bpe.ts.

Python está aquí porque la lección cambia: `bytes` es un tipo nativo, así que "el texto son bytes,
un token es una secuencia de bytes" se puede leer directamente en el código, y el resultado tiene
que ser idéntico al de TypeScript, lo que prueba que el algoritmo (y su regla de desempate) está
completamente especificado.
"""

import os
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

# EN: Every UTF-8 text is a sequence of bytes and a byte has 256 values, so the base vocabulary
#     has 256 tokens and no text is ever "unknown".
# PT: Todo texto em UTF-8 é uma sequência de bytes e um byte tem 256 valores, então o
#     vocabulário base tem 256 tokens e nenhum texto é "desconhecido".
# ES: Todo texto en UTF-8 es una secuencia de bytes y un byte tiene 256 valores, así que el
#     vocabulario base tiene 256 tokens y ningún texto es "desconocido".
BASE_VOCABULARY = 256
# EN: The corpus is small on purpose, and after some 360 merges no pair appears twice any more.
# PT: O corpus é pequeno de propósito, e depois de umas 360 fusões nenhum par aparece duas vezes.
# ES: El corpus es pequeño a propósito, y tras unas 360 fusiones ningún par aparece dos veces.
TABLE_STEPS = (0, 10, 25, 50, 100, 200, 300)
DEFAULT_MERGES = 300
DATA_DIR = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))


def read_data(name: str) -> str:
    # EN: newline="" keeps the file exactly as it is on disk, as the TypeScript side does.
    # PT: newline="" mantém o arquivo exatamente como está no disco, como faz o lado TypeScript.
    # ES: newline="" mantiene el archivo exactamente como está en el disco, como hace el lado
    #     TypeScript.
    with (DATA_DIR / name).open(encoding="utf-8", newline="") as file:
        return file.read()


@dataclass(frozen=True)
class Merge:
    """EN: One learned rule: (left, right) becomes the token `id`.

    PT: Uma regra aprendida: (left, right) vira o token `id`.

    ES: Una regla aprendida: (left, right) se convierte en el token `id`.
    """

    left: int
    right: int
    id: int
    count: int


@dataclass
class Tokenizer:
    merges: list[Merge] = field(default_factory=list)
    # EN: The bytes each id stands for. Ids 0 to 255 are the single bytes.
    # PT: Os bytes que cada id representa. Os ids de 0 a 255 são os bytes isolados.
    # ES: Los bytes que representa cada id. Los ids de 0 a 255 son los bytes sueltos.
    vocabulary: list[bytes] = field(default_factory=lambda: [bytes([b]) for b in range(256)])


def count_pairs(ids: list[int]) -> Counter[tuple[int, int]]:
    """EN: Counts every pair of neighbours, overlapping ones included.

    PT: Conta todos os pares de vizinhos, inclusive os sobrepostos.

    ES: Cuenta todos los pares de vecinos, incluidos los que se solapan.
    """
    return Counter(zip(ids, ids[1:], strict=False))


def most_frequent_pair(counts: Counter[tuple[int, int]]) -> tuple[tuple[int, int], int] | None:
    """EN: The most frequent pair. A tie goes to the smaller left id, then the smaller right id.

    Without a written tie-break rule two implementations would learn different vocabularies.

    PT: O par mais frequente. O empate vai para o menor id da esquerda, depois o menor da direita.

    Sem uma regra de desempate escrita, duas implementações aprenderiam vocabulários diferentes.

    ES: El par más frecuente. El empate va al menor id de la izquierda, luego al menor de la
    derecha.

    Sin una regla de desempate escrita, dos implementaciones aprenderían vocabularios distintos.
    """
    if not counts:
        return None
    pair = min(counts, key=lambda item: (-counts[item], item))
    return pair, counts[pair]


def merge_pair(ids: list[int], left: int, right: int, new_id: int) -> list[int]:
    """EN: Replaces the pair from left to right, jumping over both items after a replacement.

    PT: Troca o par da esquerda para a direita, pulando os dois itens depois de uma troca.

    ES: Reemplaza el par de izquierda a derecha, saltando los dos elementos tras un reemplazo.
    """
    merged: list[int] = []
    index = 0
    while index < len(ids):
        if index + 1 < len(ids) and ids[index] == left and ids[index + 1] == right:
            merged.append(new_id)
            index += 2
        else:
            merged.append(ids[index])
            index += 1
    return merged


def train(corpus: str, merge_count: int) -> Tokenizer:
    """EN: Count the pairs, pick the most frequent, merge it into a new token, repeat.

    Each turn adds one token, so the vocabulary size is 256 + merges. Training stops early when
    no pair appears twice, because merging a pair seen once compresses nothing.

    PT: Conte os pares, escolha o mais frequente, funda-o em um token novo, repita.

    Cada volta acrescenta um token, então o tamanho do vocabulário é 256 + fusões. O treino para
    antes quando nenhum par aparece duas vezes, porque fundir um par visto uma vez não comprime.

    ES: Cuenta los pares, elige el más frecuente, fusiónalo en un token nuevo, repite.

    Cada vuelta añade un token, así que el tamaño del vocabulario es 256 + fusiones. El
    entrenamiento se detiene antes cuando ningún par aparece dos veces, porque fusionar un par
    visto una sola vez no comprime nada.
    """
    ids = list(corpus.encode("utf-8"))
    tokenizer = Tokenizer()
    for _ in range(merge_count):
        best = most_frequent_pair(count_pairs(ids))
        if best is None or best[1] < 2:
            break
        (left, right), count = best
        new_id = BASE_VOCABULARY + len(tokenizer.merges)
        ids = merge_pair(ids, left, right, new_id)
        tokenizer.merges.append(Merge(left, right, new_id, count))
        tokenizer.vocabulary.append(tokenizer.vocabulary[left] + tokenizer.vocabulary[right])
    return tokenizer


def encode(tokenizer: Tokenizer, text: str, limit: int | None = None) -> list[int]:
    """EN: Replays the merges in the order they were learned. `limit` uses only the first ones.

    PT: Repete as fusões na ordem em que foram aprendidas. `limit` usa só as primeiras.

    ES: Repite las fusiones en el orden en que se aprendieron. `limit` usa solo las primeras.
    """
    ids = list(text.encode("utf-8"))
    for merge in tokenizer.merges[:limit]:
        if len(ids) < 2:
            break
        ids = merge_pair(ids, merge.left, merge.right, merge.id)
    return ids


def token_bytes(tokenizer: Tokenizer, ids: list[int]) -> bytes:
    for token_id in ids:
        if not 0 <= token_id < len(tokenizer.vocabulary):
            raise ValueError(f"unknown token id {token_id}")
    return b"".join(tokenizer.vocabulary[token_id] for token_id in ids)


def decode(tokenizer: Tokenizer, ids: list[int]) -> str:
    """EN: Each id gives back its bytes, and the joined bytes are read as UTF-8. Nothing is lost.

    PT: Cada id devolve os seus bytes, e os bytes juntados são lidos como UTF-8. Nada se perde.

    ES: Cada id devuelve sus bytes, y los bytes unidos se leen como UTF-8. No se pierde nada.
    """
    return token_bytes(tokenizer, ids).decode("utf-8", errors="replace")


def token_label(tokenizer: Tokenizer, token_id: int) -> str:
    """EN: A token may hold only part of a character (an emoji is 4 bytes). Then it is shown as
    hexadecimal bytes instead of text.

    PT: Um token pode conter só parte de um caractere (um emoji são 4 bytes). Nesse caso ele é
    mostrado em bytes hexadecimais em vez de texto.

    ES: Un token puede contener solo parte de un carácter (un emoji son 4 bytes). En ese caso se
    muestra como bytes hexadecimales en lugar de texto.
    """
    piece = tokenizer.vocabulary[token_id]
    try:
        return piece.decode("utf-8")
    except UnicodeDecodeError:
        return f"<{piece.hex(' ')}>"


def token_count_table(
    tokenizer: Tokenizer, corpus: str, sample: str, steps: tuple[int, ...] = TABLE_STEPS
) -> list[dict[str, int]]:
    """EN: The same two texts encoded with a growing number of merges.

    PT: Os mesmos dois textos codificados com um número crescente de fusões.

    ES: Los mismos dos textos codificados con un número creciente de fusiones.
    """
    return [
        {
            "merges": merges,
            "vocabulary": BASE_VOCABULARY + merges,
            "sampleTokens": len(encode(tokenizer, sample, merges)),
            "corpusTokens": len(encode(tokenizer, corpus, merges)),
        }
        for merges in steps
    ]
