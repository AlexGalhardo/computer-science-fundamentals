"""EN: Word vectors from counting, with no neural network and no training loop.
1. For every word, count which words appear near it (co-occurrence counts).
2. Re-weight the counts so that surprising neighbours matter more than frequent ones (PPMI).
3. The row of a word in that table is its vector. Two words are similar when their rows point in
   the same direction (cosine similarity).
The TypeScript version does this with loops over arrays. Here the table is a NumPy matrix, and
each step is one operation on the whole matrix.

PT: Vetores de palavras a partir de contagem, sem rede neural e sem laço de treino.
1. Para cada palavra, conta quais palavras aparecem perto dela (contagens de coocorrência).
2. Repesa as contagens para que vizinhos surpreendentes valham mais que os frequentes (PPMI).
3. A linha de uma palavra nessa tabela é o seu vetor. Duas palavras são parecidas quando as suas
   linhas apontam na mesma direção (similaridade do cosseno).
A versão em TypeScript faz isso com laços sobre arrays. Aqui a tabela é uma matriz NumPy, e cada
passo é uma operação sobre a matriz inteira.
"""

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import numpy.typing as npt

Matrix = npt.NDArray[np.float64]
Groups = dict[str, list[str]]

DATA_DIR = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))

# How many words on each side count as "near".
WINDOW = 4

WORD = re.compile(r"[a-z]+")
SENTENCE_END = re.compile(r"[.!?\n]+")


def read_data(name: str) -> str:
    return (DATA_DIR / name).read_text(encoding="utf-8")


def read_lines(name: str) -> list[str]:
    return [line for line in read_data(name).split("\n") if line]


def read_groups() -> Groups:
    return json.loads(read_data("groups.json"))


def tokenize(text: str) -> list[str]:
    """Lower-case words made of letters only. Punctuation and digits separate words."""
    return WORD.findall(text.lower())


def split_sentences(text: str) -> list[str]:
    """Cuts a paragraph at the end-of-sentence marks, so a window never crosses two sentences."""
    return [part.strip() for part in SENTENCE_END.split(text) if part.strip()]


@dataclass(frozen=True)
class WordVectors:
    # Every distinct word of the corpus, in alphabetical order. Position = row and column.
    vocabulary: list[str]
    index: dict[str, int]
    # One row per word, already scaled to length 1.
    matrix: Matrix


def build_vocabulary(sentences: list[list[str]]) -> list[str]:
    """EN: Sorted, so the numbering of the words is the same in TypeScript and in Python.

    PT: Ordenado, então a numeração das palavras é a mesma em TypeScript e em Python.
    """
    return sorted({word for sentence in sentences for word in sentence})


def cooccurrence(sentences: list[list[str]], index: dict[str, int], window: int = WINDOW) -> Matrix:
    """EN: counts[i, j] = how many times word j appeared at most `window` positions away from
    word i, on either side. The window is symmetric, so the matrix is too.

    PT: counts[i, j] = quantas vezes a palavra j apareceu a no máximo `window` posições da
    palavra i, de qualquer lado. A janela é simétrica, então a matriz também é.
    """
    counts = np.zeros((len(index), len(index)))
    for sentence in sentences:
        ids = [index[word] for word in sentence if word in index]
        for centre, word_id in enumerate(ids):
            start = max(0, centre - window)
            for other in ids[start:centre] + ids[centre + 1 : centre + window + 1]:
                counts[word_id, other] += 1
    return counts


def ppmi(counts: Matrix) -> Matrix:
    """EN: Raw counts are dominated by frequent words: "the" is near almost every word, so every
    row has its biggest numbers in the same few columns and all rows point the same way.
    PMI asks how many times more often two words meet than they would by chance:
        pmi(w, c) = log2( count(w, c) * total / (row(w) * row(c)) )
    PPMI keeps only the positive part. In NumPy the whole table is one expression: `np.outer`
    builds the matrix of "expected by chance" and the division is done cell by cell.

    PT: Contagens cruas são dominadas pelas palavras frequentes: "the" fica perto de quase toda
    palavra, então toda linha tem os maiores números nas mesmas poucas colunas e todas apontam
    para o mesmo lado. A PMI pergunta quantas vezes mais duas palavras se encontram do que se
    encontrariam por acaso:
        pmi(w, c) = log2( cont(w, c) * total / (linha(w) * linha(c)) )
    A PPMI guarda só a parte positiva. No NumPy a tabela inteira é uma expressão: `np.outer`
    monta a matriz do "esperado por acaso" e a divisão é feita célula a célula.
    """
    row_sums = counts.sum(axis=1)
    expected = np.outer(row_sums, row_sums) / row_sums.sum()
    weighted = np.zeros_like(counts)
    seen = counts > 0
    weighted[seen] = np.log2(counts[seen] / expected[seen])
    return np.maximum(weighted, 0.0)


def normalize_rows(matrix: Matrix) -> Matrix:
    """EN: Divides every row by its own length. After that, the cosine similarity of two rows is
    just their dot product, because cosine = dot(a, b) / (|a| * |b|) and both lengths are 1.
    A row of zeros stays a row of zeros.

    PT: Divide cada linha pelo próprio comprimento. Depois disso, a similaridade do cosseno de
    duas linhas é só o produto escalar, porque cosseno = dot(a, b) / (|a| * |b|) e os dois
    comprimentos são 1. Uma linha de zeros continua uma linha de zeros.
    """
    lengths = np.linalg.norm(matrix, axis=1, keepdims=True)
    return np.divide(matrix, lengths, out=np.zeros_like(matrix), where=lengths > 0)


def cosine(a: Matrix, b: Matrix) -> float:
    """Cosine similarity of two vectors: 1 = same direction, 0 = nothing in common."""
    lengths = float(np.linalg.norm(a) * np.linalg.norm(b))
    return 0.0 if lengths == 0 else float(a @ b) / lengths


def build_word_vectors(
    sentences: list[list[str]], weighting: str = "ppmi", window: int = WINDOW
) -> WordVectors:
    vocabulary = build_vocabulary(sentences)
    index = {word: position for position, word in enumerate(vocabulary)}
    counts = cooccurrence(sentences, index, window)
    table = ppmi(counts) if weighting == "ppmi" else counts
    return WordVectors(vocabulary, index, normalize_rows(table))


def nearest_neighbours(model: WordVectors, word: str, k: int) -> list[tuple[str, float]]:
    """EN: Brute force in one line: `matrix @ vector` is the dot product of the word with every
    row at once, that is, its cosine similarity with every word of the vocabulary. Equal
    similarities are ordered alphabetically, the same rule as the TypeScript version.

    PT: Força bruta em uma linha: `matrix @ vector` é o produto escalar da palavra com todas as
    linhas de uma vez, ou seja, a sua similaridade do cosseno com todas as palavras do
    vocabulário. Similaridades iguais são ordenadas alfabeticamente, a mesma regra da versão em
    TypeScript.
    """
    similarities = model.matrix @ model.matrix[model.index[word]]
    scored = [
        (other, float(similarities[position]))
        for position, other in enumerate(model.vocabulary)
        if other != word
    ]
    scored.sort(key=lambda item: (-item[1], item[0]))
    return scored[:k]


@dataclass(frozen=True)
class GroupPrecision:
    group: str
    # Share of the top-k neighbours of the words of this group that belong to the same group.
    precision: float
    # How many words of the group have ALL their top-k neighbours inside the group.
    perfect_words: int
    words: int


def group_precision(model: WordVectors, groups: Groups, k: int) -> list[GroupPrecision]:
    """EN: The test of the vectors. Nobody told the code that "dog" and "cat" are animals. If the
    neighbours of "dog" are all animals, the groups were recovered from the contexts alone.

    PT: O teste dos vetores. Ninguém disse ao código que "dog" e "cat" são animais. Se os
    vizinhos de "dog" são todos animais, os grupos foram recuperados só a partir dos contextos.
    """
    rows = []
    for group, words in groups.items():
        members = set(words)
        hits = [
            sum(neighbour in members for neighbour, _ in nearest_neighbours(model, word, k))
            for word in words
        ]
        rows.append(GroupPrecision(group, sum(hits) / (len(words) * k), hits.count(k), len(words)))
    return rows


def overall_precision(rows: list[GroupPrecision]) -> float:
    return sum(row.precision * row.words for row in rows) / sum(row.words for row in rows)


def group_contrast(model: WordVectors, groups: Groups) -> tuple[float, float]:
    """EN: (mean cosine of two test words of the same group, mean cosine of two test words of
    different groups). `rows @ rows.T` is the table of all pairs at once. With raw counts the two
    numbers are close, with PPMI they are far apart.

    PT: (cosseno médio de duas palavras de teste do mesmo grupo, cosseno médio de duas palavras
    de teste de grupos diferentes). `rows @ rows.T` é a tabela de todos os pares de uma vez. Com
    contagens cruas os dois números ficam próximos, com PPMI ficam distantes.
    """
    tagged = [(group, word) for group, words in groups.items() for word in words]
    rows = model.matrix[[model.index[word] for _, word in tagged]]
    similarities = rows @ rows.T
    labels = np.array([group for group, _ in tagged])
    same = labels[:, None] == labels[None, :]
    upper = np.triu(np.ones_like(same), k=1)
    return float(similarities[same & upper].mean()), float(similarities[~same & upper].mean())
