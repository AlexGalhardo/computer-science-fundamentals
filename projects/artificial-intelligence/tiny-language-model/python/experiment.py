"""EN: The one experiment that the tests and the demo share: same corpus, same seed, same
training function. What the tests check is therefore exactly what the demo reports.

PT: O único experimento que os testes e a demo compartilham: mesmo corpus, mesma semente, mesma
função de treino. O que os testes conferem é, portanto, exatamente o que a demo relata.

ES: El único experimento que las pruebas y la demo comparten: mismo corpus, misma semilla, misma
función de entrenamiento. Lo que comprueban las pruebas es, por lo tanto, exactamente lo que
informa la demo.
"""

from dataclasses import dataclass

import numpy as np

from bigram import bigram_counts, bigram_loss, bigram_probabilities
from corpus import Corpus, agreement_positions, decode, encode, generate_corpus, line_kind
from sampling import Setting, generate_lines, next_token_probabilities
from transformer import Config, LossPoint, Params, evaluate, forward, train

MODEL_SEED = 7
TRAIN_STEPS = 1000
BATCH_SIZE = 32
LEARNING_RATE = 3e-3
SAMPLE_COUNT = 100
SAMPLE_MAX_LENGTH = 40
SAMPLE_SEED = 11

SETTINGS = (
    Setting("greedy", greedy=True),
    Setting("temperature 0.2", temperature=0.2),
    Setting("temperature 0.5", temperature=0.5),
    Setting("temperature 1.0", temperature=1.0),
    Setting("temperature 1.5", temperature=1.5),
    Setting("temperature 1.0, top-k 3", top_k=3),
    Setting("temperature 1.0, top-p 0.9", top_p=0.9),
    Setting("temperature 1.5, top-k 3", temperature=1.5, top_k=3),
    Setting("temperature 1.5, top-p 0.9", temperature=1.5, top_p=0.9),
)


@dataclass(frozen=True)
class Experiment:
    corpus: Corpus
    train_ids: np.ndarray
    heldout_ids: np.ndarray
    bigram: np.ndarray
    config: Config
    params: Params
    history: list[LossPoint]
    uniform_loss: float
    bigram_train_loss: float
    bigram_heldout_loss: float
    transformer_train_loss: float
    transformer_heldout_loss: float


def run_experiment() -> Experiment:
    corpus = generate_corpus()
    vocab_size = len(corpus.vocabulary)
    train_ids = encode(corpus.train_text, corpus.vocabulary)
    heldout_ids = encode(corpus.heldout_text, corpus.vocabulary)
    # EN: Both models learn from the training text only. The held-out text is used to measure.
    # PT: Os dois modelos aprendem só com o texto de treino. O texto reservado serve para medir.
    # ES: Los dos modelos aprenden solo con el texto de entrenamiento. El texto reservado sirve
    #     para medir.
    bigram = bigram_probabilities(bigram_counts(train_ids, vocab_size))
    config = Config(vocab_size=vocab_size)
    params, history = train(
        config,
        train_ids,
        heldout_ids,
        steps=TRAIN_STEPS,
        batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        seed=MODEL_SEED,
    )
    return Experiment(
        corpus=corpus,
        train_ids=train_ids,
        heldout_ids=heldout_ids,
        bigram=bigram,
        config=config,
        params=params,
        history=history,
        # EN: The loss of a model that knows nothing and gives 1/V to every token.
        # PT: A perda de um modelo que não sabe nada e dá 1/V a cada token.
        # ES: La pérdida de un modelo que no sabe nada y da 1/V a cada token.
        uniform_loss=float(np.log(vocab_size)),
        bigram_train_loss=bigram_loss(bigram, train_ids),
        bigram_heldout_loss=bigram_loss(bigram, heldout_ids),
        transformer_train_loss=evaluate(params, config, train_ids),
        transformer_heldout_loss=evaluate(params, config, heldout_ids),
    )


# EN: (context, the character the grammar demands next, a tempting wrong character). In every
#     case the last character of the context is the same for the right and the wrong answer, so
#     a model that sees only that character cannot tell them apart.
# PT: (contexto, o caractere que a gramática exige em seguida, um caractere errado tentador).
#     Em todos os casos o último caractere do contexto é o mesmo para a resposta certa e para a
#     errada, então um modelo que vê só esse caractere não consegue distinguir as duas.
# ES: (contexto, el carácter que la gramática exige a continuación, un carácter incorrecto
#     tentador). En todos los casos el último carácter del contexto es el mismo para la respuesta
#     correcta y para la incorrecta, así que un modelo que ve solo ese carácter no puede
#     distinguir las dos.
PROBES = (
    ("ana has a cat. ", "s", "h"),
    ("leo has a cat. ", "h", "s"),
    ("the old dogs see", " ", "s"),
    ("the old dog see", "s", " "),
    ("tom says 4+5=", "9", "1"),
    ("tom says 7+8=1", "5", "."),
    ("{[x]", "}", "]"),
    ("[{x}", "]", "}"),
)


@dataclass(frozen=True)
class ProbeRow:
    context: str
    right: str
    wrong: str
    bigram_right: float
    bigram_wrong: float
    transformer_right: float
    transformer_wrong: float


def probe_rows(experiment: Experiment) -> list[ProbeRow]:
    """EN: For each probe, the probability each model gives to the right and to the wrong
    next character. It turns "attention uses the context" into numbers.

    PT: Para cada sonda, a probabilidade que cada modelo dá ao próximo caractere certo e ao
    errado. Transforma "a atenção usa o contexto" em números.

    ES: Para cada sonda, la probabilidad que cada modelo da al siguiente carácter correcto y al
    incorrecto. Convierte "la atención usa el contexto" en números.
    """
    vocabulary = experiment.corpus.vocabulary
    rows = []
    for context, right, wrong in PROBES:
        ids = encode("\n" + context, vocabulary)
        right_id, wrong_id = vocabulary.index(right), vocabulary.index(wrong)
        bigram_row = experiment.bigram[ids[-1]]
        transformer_row = next_token_probabilities(experiment.params, experiment.config, ids)
        rows.append(
            ProbeRow(
                context,
                right,
                wrong,
                float(bigram_row[right_id]),
                float(bigram_row[wrong_id]),
                float(transformer_row[right_id]),
                float(transformer_row[wrong_id]),
            )
        )
    return rows


@dataclass(frozen=True)
class SamplingRow:
    setting: Setting
    mean_entropy_bits: float
    distinct_lines: int
    grammatical_lines: int
    lines: list[str]


def sampling_rows(experiment: Experiment) -> list[SamplingRow]:
    """EN: Writes SAMPLE_COUNT lines with each sampling setting and measures two things: the
    mean entropy of the distributions the characters were drawn from, and how varied the result
    is (how many different lines). It also counts the lines that obey the grammar.

    Every setting uses the same seed, so the only thing that changes from row to row is the
    sampling rule.

    PT: Escreve SAMPLE_COUNT linhas com cada configuração de amostragem e mede duas coisas: a
    entropia média das distribuições das quais os caracteres foram sorteados, e o quanto o
    resultado varia (quantas linhas diferentes). Também conta as linhas que obedecem à gramática.

    Toda configuração usa a mesma semente, então a única coisa que muda de uma linha da tabela
    para a outra é a regra de amostragem.

    ES: Escribe SAMPLE_COUNT líneas con cada configuración de muestreo y mide dos cosas: la
    entropía media de las distribuciones de las que se sortearon los caracteres, y cuánto varía el
    resultado (cuántas líneas distintas). También cuenta las líneas que obedecen la gramática.

    Toda configuración usa la misma semilla, así que lo único que cambia de una fila de la tabla
    a otra es la regla de muestreo.
    """
    vocabulary = experiment.corpus.vocabulary
    rows = []
    for setting in SETTINGS:
        generation = generate_lines(
            experiment.params,
            experiment.config,
            setting,
            newline_id=vocabulary.index("\n"),
            count=SAMPLE_COUNT,
            max_length=SAMPLE_MAX_LENGTH,
            seed=SAMPLE_SEED,
        )
        lines = [decode(line, vocabulary) for line in generation.lines]
        rows.append(
            SamplingRow(
                setting,
                generation.mean_entropy_bits,
                len(set(lines)),
                sum(line_kind(line) is not None for line in lines),
                lines,
            )
        )
    return rows


@dataclass(frozen=True)
class AttentionExample:
    text: str
    layer: int
    head: int
    # EN: The position that asks (the last letter of the verb) and the position that holds the
    #     clue (the "s" of the plural subject).
    # PT: A posição que pergunta (a última letra do verbo) e a posição que guarda a pista (o
    #     "s" do sujeito no plural).
    # ES: La posición que pregunta (la última letra del verbo) y la posición que guarda la pista (la
    #     "s" del sujeto en plural).
    query_position: int
    clue_position: int
    weights: np.ndarray


def attention_example(experiment: Experiment) -> AttentionExample:
    """EN: The attention weights of one head on one held-out sentence of the "agreement" kind.

    In "the sad cups see" the model, standing on the last "e", must decide whether the verb
    gets an "s". The only clue is the "s" that ends the subject, a few characters back. The
    head shown is the one that, from that "e", puts the most weight on that "s".

    PT: Os pesos de atenção de uma cabeça em uma frase reservada do tipo "concordância".

    Em "the sad cups see" o modelo, parado no último "e", precisa decidir se o verbo leva um
    "s". A única pista é o "s" que termina o sujeito, alguns caracteres atrás. A cabeça
    mostrada é a que, a partir desse "e", põe mais peso nesse "s".

    ES: Los pesos de atención de una cabeza en una frase reservada del tipo "concordancia".

    En "the sad cups see" el modelo, parado en la última "e", tiene que decidir si el verbo lleva
    una "s". La única pista es la "s" que termina el sujeto, unos caracteres atrás. La cabeza
    mostrada es la que, desde esa "e", pone más peso en esa "s".
    """
    line, positions = next(
        (line, positions)
        for line in experiment.corpus.heldout_lines
        if (positions := agreement_positions(line)) is not None
    )
    text = "\n" + line
    # EN: +1 because of the line break placed before the line.
    # PT: +1 por causa da quebra de linha colocada antes da linha.
    # ES: +1 por el salto de línea colocado antes de la línea.
    clue_position, query_position = positions[0] + 1, positions[1] + 1
    ids = encode(text, experiment.corpus.vocabulary)
    _, cache = forward(experiment.params, experiment.config, ids[None, :])
    best: tuple[float, int, int] = (-1.0, 0, 0)
    for layer, block in enumerate(cache["blocks"]):
        for head in range(experiment.config.n_heads):
            weight = float(block["weights"][0, head, query_position, clue_position])
            best = max(best, (weight, layer, head))
    _, layer, head = best
    weights = cache["blocks"][layer]["weights"][0, head].astype(np.float64)
    return AttentionExample(text, layer, head, query_position, clue_position, weights)
