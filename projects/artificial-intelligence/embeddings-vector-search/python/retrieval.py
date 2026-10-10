"""EN: Retrieval: the question picks the passages that are most likely to answer it. This is the
"R" of RAG (retrieval-augmented generation): before a language model answers, a search step
chooses which texts are placed in its prompt.
A text becomes one vector by averaging the vectors of its words. The question is embedded in
exactly the same way, and the passages are ranked by cosine similarity with it.

PT: Recuperação: a pergunta escolhe as passagens com mais chance de respondê-la. É o "R" de RAG
(geração aumentada por recuperação): antes de um modelo de linguagem responder, uma etapa de
busca escolhe quais textos entram no prompt.
Um texto vira um vetor pela média dos vetores das suas palavras. A pergunta é transformada
exatamente do mesmo jeito, e as passagens são ordenadas pela similaridade do cosseno com ela.

ES: Recuperación: la pregunta elige los pasajes con más probabilidad de responderla. Es la "R" de
RAG (generación aumentada por recuperación): antes de que un modelo de lenguaje responda, una
etapa de búsqueda elige qué textos entran en el prompt.
Un texto se convierte en un vector por el promedio de los vectores de sus palabras. La pregunta se
transforma exactamente de la misma manera, y los pasajes se ordenan por la similitud del coseno
con ella.
"""

import json
import math
from dataclasses import dataclass

import numpy as np

from embeddings import (
    Matrix,
    WordVectors,
    build_word_vectors,
    read_data,
    read_lines,
    split_sentences,
    tokenize,
)

# EN: The idf of this project is counted on a few thousand sentences, where "how" and "why" are
#     rare and would look important. A real system counts idf on millions of documents. Here a
#     short list of function words (a "stop list") is skipped when a text is embedded. The words
#     stay in the corpus and still take part in the co-occurrence counts.
# PT: O idf deste projeto é contado em alguns milhares de frases, onde "how" e "why" são raras e
#     pareceriam importantes. Um sistema real conta o idf em milhões de documentos. Aqui uma
#     lista curta de palavras funcionais (uma "stop list") é ignorada quando um texto vira vetor.
#     As palavras continuam no corpus e ainda participam das contagens de coocorrência.
# ES: El idf de este proyecto se cuenta en unos pocos miles de frases, donde "how" y "why" son raras
#     y parecerían importantes. Un sistema real cuenta el idf en millones de documentos. Aquí se
#     ignora una lista corta de palabras funcionales (una "stop list") cuando un texto se vuelve
#     vector. Las palabras siguen en el corpus y aún participan en los conteos de coocurrencia.
STOP_LIST = (
    "a an the and or but of in on at to for from with by as if then than not no so "
    "is are was were be been do does did has have had can will would should "
    "i you he she it we they me him her us them my your his its our their "
    "this that these those there here what which who whom when where why how "
    "all any each every some most more too very just only into out up down over after before "
    "again once"
)
STOP_WORDS = frozenset(STOP_LIST.split())


@dataclass(frozen=True)
class Passage:
    id: str
    title: str
    text: str


@dataclass(frozen=True)
class DemoQuestion:
    question: str
    # The id of the passage a person would pick.
    expected: str


@dataclass(frozen=True)
class Model:
    words: WordVectors
    # One weight per word of the vocabulary: high for rare words, near 0 for "the".
    idf: Matrix
    passages: list[Passage]
    # One row per passage, each of length 1.
    passage_matrix: Matrix


@dataclass(frozen=True)
class Embedding:
    # Length 1, or all zeros when no word of the text is in the vocabulary.
    vector: Matrix
    known: list[str]
    unknown: list[str]


def read_passages() -> list[Passage]:
    return [Passage(**item) for item in json.loads(read_data("passages.json"))]


def read_questions() -> list[DemoQuestion]:
    return [DemoQuestion(**item) for item in json.loads(read_data("questions.json"))]


def content_key(sentence: str) -> str:
    """EN: Two sentences with the same content words in another order get the same vector,
    because an average forgets the order. This key is equal exactly for such sentences. The
    search experiment uses it to store each vector once.

    PT: Duas frases com as mesmas palavras de conteúdo em outra ordem recebem o mesmo vetor,
    porque uma média esquece a ordem. Esta chave é igual exatamente para essas frases. O
    experimento de busca a usa para guardar cada vetor uma vez só.

    ES: Dos frases con las mismas palabras de contenido en otro orden reciben el mismo vector,
    porque un promedio olvida el orden. Esta clave es igual exactamente para esas frases. El
    experimento de búsqueda la usa para guardar cada vector una sola vez.
    """
    return " ".join(sorted(word for word in tokenize(sentence) if word not in STOP_WORDS))


def distinct_by_content(sentences: list[str]) -> list[str]:
    """The first sentence of each distinct content key, in the original order."""
    first: dict[str, str] = {}
    for sentence in sentences:
        first.setdefault(content_key(sentence), sentence)
    return list(first.values())


def training_sentences(corpus: list[str], passages: list[Passage]) -> list[list[str]]:
    """EN: The word vectors are learned from the generated sentences AND from the passages, so
    that the words of the passages have a vector too. The questions are never in the corpus.

    PT: Os vetores de palavras são aprendidos das frases geradas E das passagens, para que as
    palavras das passagens também tenham vetor. As perguntas nunca fazem parte do corpus.

    ES: Los vectores de palabras se aprenden de las frases generadas Y de los pasajes, para que las
    palabras de los pasajes también tengan vector. Las preguntas nunca forman parte del corpus.
    """
    passage_sentences = [
        sentence
        for passage in passages
        for sentence in split_sentences(f"{passage.title}. {passage.text}")
    ]
    return [tokenize(sentence) for sentence in corpus + passage_sentences]


def inverse_document_frequency(sentences: list[list[str]], index: dict[str, int]) -> Matrix:
    """EN: In a plain average, "the" would weigh as much as "thunder".
    idf(word) = ln(number of sentences / sentences containing the word): near 0 for a word found
    in almost every sentence, large for a rare one.

    PT: Numa média simples, "the" pesaria tanto quanto "thunder".
    idf(palavra) = ln(número de frases / frases que contêm a palavra): perto de 0 para uma
    palavra presente em quase toda frase, grande para uma palavra rara.

    ES: En un promedio simple, "the" pesaría tanto como "thunder".
    idf(palabra) = ln(número de frases / frases que contienen la palabra): cerca de 0 para una
    palabra presente en casi toda frase, grande para una palabra rara.
    """
    containing = [0] * len(index)
    for sentence in sentences:
        for word in set(sentence):
            containing[index[word]] += 1
    return np.array([math.log(len(sentences) / count) if count else 0.0 for count in containing])


def embed_text(words: WordVectors, idf: Matrix, text: str) -> Embedding:
    """EN: text vector = normalise( sum over the words of idf(word) * vector(word) ).
    A word that is not in the vocabulary has no vector and is skipped: a counting model knows
    nothing about a word it never saw. With NumPy the sum is one product: the weights of the
    words times the rows of the words.

    PT: vetor do texto = normaliza( soma, nas palavras, de idf(palavra) * vetor(palavra) ).
    Uma palavra fora do vocabulário não tem vetor e é ignorada: um modelo de contagem não sabe
    nada sobre uma palavra que nunca viu. Com NumPy a soma é um produto: os pesos das palavras
    vezes as linhas das palavras.

    ES: vector del texto = normaliza( suma, en las palabras, de idf(palabra) * vector(palabra) ).
    Una palabra fuera del vocabulario no tiene vector y se ignora: un modelo de conteo no sabe nada
    sobre una palabra que nunca vio. Con NumPy la suma es un producto: los pesos de las palabras
    por las filas de las palabras.
    """
    content = [word for word in tokenize(text) if word not in STOP_WORDS]
    known = [word for word in content if word in words.index]
    unknown = [word for word in content if word not in words.index]
    ids = [words.index[word] for word in known]
    total = idf[ids] @ words.matrix[ids] if ids else np.zeros(len(words.vocabulary))
    length = float(np.linalg.norm(total))
    return Embedding(total / length if length > 0 else total, known, unknown)


def build_model(corpus: list[str], passages: list[Passage]) -> Model:
    sentences = training_sentences(corpus, passages)
    words = build_word_vectors(sentences)
    idf = inverse_document_frequency(sentences, words.index)
    rows = [
        embed_text(words, idf, f"{passage.title}. {passage.text}").vector for passage in passages
    ]
    return Model(words, idf, passages, np.array(rows))


def load_model() -> Model:
    return build_model(read_lines("corpus.txt"), read_passages())


def embed(model: Model, text: str) -> Embedding:
    return embed_text(model.words, model.idf, text)


def retrieve(model: Model, question: str, k: int) -> list[tuple[Passage, float]]:
    """EN: The k passages most similar to the question, best first. `passage_matrix @ query` is
    the score of every passage at once. Equal scores keep the file order (a stable sort).

    PT: As k passagens mais parecidas com a pergunta, a melhor primeiro. `passage_matrix @ query`
    é a nota de todas as passagens de uma vez. Notas iguais mantêm a ordem do arquivo (uma
    ordenação estável).

    ES: Los k pasajes más parecidos a la pregunta, el mejor primero. `passage_matrix @ query` es la
    puntuación de todos los pasajes a la vez. Las puntuaciones iguales mantienen el orden del
    archivo (una ordenación estable).
    """
    scores = model.passage_matrix @ embed(model, question).vector
    order = sorted(range(len(model.passages)), key=lambda position: -float(scores[position]))
    return [(model.passages[position], float(scores[position])) for position in order[:k]]
