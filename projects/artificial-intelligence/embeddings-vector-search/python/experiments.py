"""EN: The three experiments of the project, run once and shared by the demo and by the tests:
the neighbours of the test words, the trade-off of the index, and the retrieval questions.
`summarize` keeps only what must be identical in TypeScript and in Python; that summary is
compared with data/expected.json by both test suites.

PT: Os três experimentos do projeto, rodados uma vez e compartilhados pela demo e pelos testes:
os vizinhos das palavras de teste, a troca do índice e as perguntas de recuperação.
`summarize` guarda só o que precisa ser idêntico em TypeScript e em Python; esse resumo é
comparado com data/expected.json pelas duas suítes de teste.

ES: Los tres experimentos del proyecto, ejecutados una vez y compartidos por la demo y las pruebas:
los vecinos de las palabras de prueba, el intercambio del índice y las preguntas de recuperación.
`summarize` guarda solo lo que debe ser idéntico en TypeScript y en Python; ese resumen lo
comparan con data/expected.json las dos suites de pruebas.
"""

from dataclasses import asdict, dataclass

import numpy as np

from embeddings import (
    GroupPrecision,
    Groups,
    Matrix,
    WordVectors,
    build_word_vectors,
    group_contrast,
    group_precision,
    nearest_neighbours,
    overall_precision,
    read_groups,
    read_lines,
)
from retrieval import (
    DemoQuestion,
    Model,
    build_model,
    distinct_by_content,
    embed,
    read_passages,
    read_questions,
    retrieve,
    training_sentences,
)
from search import TradeOffRow, trade_off

# How many neighbours of each test word are checked.
NEIGHBOURS = 5
# How many passages a question retrieves.
TOP_PASSAGES = 3

# EN: A question that shares no content word with the passages it should find. It can only work
#     through the word vectors: "drizzle" and "hail" are near "rain" and "snow".
# PT: Uma pergunta que não compartilha nenhuma palavra de conteúdo com as passagens que deveria
#     achar. Ela só pode funcionar pelos vetores de palavras: "drizzle" e "hail" ficam perto de
#     "rain" e "snow".
# ES: Una pregunta que no comparte ninguna palabra de contenido con los pasajes que debería
#     encontrar. Solo puede funcionar a través de los vectores de palabras: "drizzle" y "hail"
#     están cerca de "rain" y "snow".
RELATED_QUESTION = "Will drizzle or hail come tomorrow?"
RELATED_PASSAGES = ["p13", "p14", "p15"]

# A question the method gets wrong, kept in the results on purpose.
MISSED_QUESTION = DemoQuestion("Why does the sea rise and fall?", "p25")


@dataclass(frozen=True)
class Experiment:
    model: Model
    raw_words: WordVectors
    groups: Groups
    corpus_sentences: int
    training_sentences: int
    precision: list[GroupPrecision]
    raw_precision: list[GroupPrecision]
    # (mean cosine inside a group, mean cosine between groups)
    contrast: tuple[float, float]
    raw_contrast: tuple[float, float]
    # How many corpus sentences were indexed, and how many queries were asked.
    indexed: int
    queries: int
    trade_off: list[TradeOffRow]
    questions: list[DemoQuestion]


def index_data(model: Model, corpus: list[str], queries: list[str]) -> tuple[Matrix, Matrix]:
    """EN: What the index stores: one vector per sentence of the corpus with distinct content,
    built exactly like a passage vector. The 80 word vectors and the 30 passages are too few for
    an index to matter, about 2000 sentences are enough to see the difference. The queries are
    the 400 new sentences of data/queries.txt.

    PT: O que o índice guarda: um vetor por frase do corpus com conteúdo distinto, construído
    exatamente como o vetor de uma passagem. Os 80 vetores de palavras e as 30 passagens são
    poucos para um índice fazer diferença, cerca de 2000 frases bastam para ver a diferença. As
    consultas são as 400 frases novas de data/queries.txt.

    ES: Lo que guarda el índice: un vector por frase del corpus con contenido distinto, construido
    exactamente como el vector de un pasaje. Los 80 vectores de palabras y los 30 pasajes son
    pocos para que un índice marque diferencia, unas 2000 frases bastan para ver la diferencia.
    Las consultas son las 400 frases nuevas de data/queries.txt.
    """
    vectors = [embed(model, sentence).vector for sentence in distinct_by_content(corpus)]
    return np.array(vectors), np.array([embed(model, sentence).vector for sentence in queries])


def run_experiment() -> Experiment:
    corpus = read_lines("corpus.txt")
    passages = read_passages()
    groups = read_groups()
    model = build_model(corpus, passages)
    sentences = training_sentences(corpus, passages)
    raw_words = build_word_vectors(sentences, "raw")
    vectors, queries = index_data(model, corpus, read_lines("queries.txt"))
    return Experiment(
        model=model,
        raw_words=raw_words,
        groups=groups,
        corpus_sentences=len(corpus),
        training_sentences=len(sentences),
        precision=group_precision(model.words, groups, NEIGHBOURS),
        raw_precision=group_precision(raw_words, groups, NEIGHBOURS),
        contrast=group_contrast(model.words, groups),
        raw_contrast=group_contrast(raw_words, groups),
        indexed=len(vectors),
        queries=len(queries),
        trade_off=trade_off(vectors, queries),
        questions=read_questions(),
    )


def top_ids(model: Model, question: str) -> list[str]:
    return [passage.id for passage, _ in retrieve(model, question, TOP_PASSAGES)]


def summarize(experiment: Experiment) -> dict[str, object]:
    """The same keys, in the same order, as the summary of the TypeScript version."""
    words = experiment.model.words
    neighbours = {
        word: [neighbour for neighbour, _ in nearest_neighbours(words, word, NEIGHBOURS)]
        for group in experiment.groups.values()
        for word in group
    }
    asked = [item.question for item in experiment.questions]
    asked += [RELATED_QUESTION, MISSED_QUESTION.question]
    return {
        "neighbours": neighbours,
        "precision": round(overall_precision(experiment.precision), 4),
        "indexed": experiment.indexed,
        "queries": experiment.queries,
        "tradeOff": [
            asdict(row)
            | {"agreement": round(row.agreement, 4), "comparisons": round(row.comparisons, 1)}
            for row in experiment.trade_off
        ],
        "retrieval": [
            {"question": question, "top": top_ids(experiment.model, question)} for question in asked
        ],
    }
