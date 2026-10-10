"""EN: The simplest language model: a table of counts. No training loop, no gradients.

PT: O modelo de linguagem mais simples: uma tabela de contagens. Sem laço de treino, sem gradientes.

ES: El modelo de lenguaje más simple: una tabla de conteos. Sin bucle de entrenamiento, sin
gradientes.
"""

import numpy as np


def bigram_counts(ids: np.ndarray, vocab_size: int) -> np.ndarray:
    """EN: counts[a, b] = how many times token b came right after token a in the text.

    PT: counts[a, b] = quantas vezes o token b veio logo depois do token a no texto.

    ES: counts[a, b] = cuántas veces el token b vino justo después del token a en el texto.
    """
    counts = np.zeros((vocab_size, vocab_size), dtype=np.int64)
    np.add.at(counts, (ids[:-1], ids[1:]), 1)
    return counts


def bigram_probabilities(counts: np.ndarray, smoothing: float = 1.0) -> np.ndarray:
    """EN: Turns each row of counts into a probability distribution: divide by the row total.

    Before dividing, `smoothing` is added to every cell (add-one smoothing). Without it, a pair
    never seen in training would get probability 0, and one such pair in the held-out text would
    make the loss infinite, because the loss is -log(probability) and log(0) is minus infinity.

    PT: Transforma cada linha de contagens em uma distribuição de probabilidade: divide pelo
    total da linha.

    Antes de dividir, soma-se `smoothing` a cada célula (suavização "soma um"). Sem isso, um par
    nunca visto no treino teria probabilidade 0, e um único par desses no texto reservado
    deixaria a perda infinita, porque a perda é -log(probabilidade) e log(0) é menos infinito.

    ES: Convierte cada fila de conteos en una distribución de probabilidad: divide entre el total
    de la fila.

    Antes de dividir, se suma `smoothing` a cada celda (suavizado "suma uno"). Sin eso, un par
    nunca visto en el entrenamiento tendría probabilidad 0, y un solo par así en el texto reservado
    dejaría la pérdida infinita, porque la pérdida es -log(probabilidad) y log(0) es menos infinito.
    """
    smoothed = counts.astype(np.float64) + smoothing
    return smoothed / smoothed.sum(axis=1, keepdims=True)


def bigram_loss(probabilities: np.ndarray, ids: np.ndarray) -> float:
    """EN: Cross-entropy in nats: the mean of -ln P(next token | previous token) over the text.

    It measures surprise. A model that gives probability 1 to every token that really comes has
    loss 0. A model that spreads its bets evenly over V tokens has loss ln(V).

    PT: Entropia cruzada em nats: a média de -ln P(próximo token | token anterior) no texto.

    Ela mede surpresa. Um modelo que dá probabilidade 1 a cada token que realmente vem tem perda
    0. Um modelo que divide as apostas igualmente entre V tokens tem perda ln(V).

    ES: Entropía cruzada en nats: la media de -ln P(siguiente token | token anterior) en el texto.

    Mide sorpresa. Un modelo que da probabilidad 1 a cada token que realmente viene tiene pérdida
    0. Un modelo que reparte las apuestas por igual entre V tokens tiene pérdida ln(V).
    """
    return float(-np.log(probabilities[ids[:-1], ids[1:]]).mean())


def perplexity(loss: float) -> float:
    """EN: exp(loss): "the model hesitates as if between this many equally likely tokens".

    PT: exp(perda): "o modelo hesita como se estivesse entre esta quantidade de tokens
    igualmente prováveis".

    ES: exp(pérdida): "el modelo duda como si estuviera entre esta cantidad de tokens igualmente
    probables".
    """
    return float(np.exp(loss))


def bigram_sample(
    probabilities: np.ndarray, start: int, length: int, rng: np.random.Generator
) -> list[int]:
    """EN: Generation is a loop: look at the row of the last token, draw the next one from it,
    append, repeat. The generator `rng` carries the seed, so the same seed gives the same text.

    PT: Gerar é um laço: olha a linha do último token, sorteia o próximo a partir dela, anexa,
    repete. O gerador `rng` carrega a semente, então a mesma semente dá o mesmo texto.

    ES: Generar es un bucle: mira la fila del último token, sortea el siguiente a partir de ella,
    lo añade, repite. El generador `rng` lleva la semilla, así que la misma semilla da el mismo
    texto.
    """
    ids = [start]
    for _ in range(length):
        row = probabilities[ids[-1]]
        ids.append(int(rng.choice(len(row), p=row)))
    return ids
