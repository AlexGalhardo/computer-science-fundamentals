"""EN: How one token is chosen from the probabilities the model gives: greedy, temperature,
top-k and top-p. The model is the same in all of them. Only the way of choosing changes.

Every function works on a batch: one row per text being written, one column per token.

PT: Como um token é escolhido a partir das probabilidades que o modelo dá: guloso, temperatura,
top-k e top-p. O modelo é o mesmo em todos. Só muda o jeito de escolher.

Toda função trabalha em lote: uma linha por texto sendo escrito, uma coluna por token.
"""

from dataclasses import dataclass

import numpy as np

from transformer import Config, Params, forward, softmax


@dataclass(frozen=True)
class Setting:
    label: str
    temperature: float = 1.0
    top_k: int | None = None
    top_p: float | None = None
    greedy: bool = False


def apply_temperature(logits: np.ndarray, temperature: float) -> np.ndarray:
    """EN: Divides the logits by T before softmax. T < 1 stretches the gaps between scores, so
    the favourite gets even more probability (sharper). T > 1 shrinks the gaps (flatter).

    PT: Divide os logits por T antes do softmax. T < 1 estica as diferenças entre as notas,
    então o favorito ganha ainda mais probabilidade (mais afiado). T > 1 encolhe as diferenças
    (mais achatado).
    """
    return softmax(logits.astype(np.float64) / temperature)


def _ranks(probabilities: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    # EN: order[i] lists the tokens of row i from the most to the least probable. A stable sort
    #     breaks ties by the smaller token id, so the result never depends on the platform.
    # PT: order[i] lista os tokens da linha i do mais para o menos provável. Uma ordenação
    #     estável desempata pelo menor id de token, então o resultado não depende da plataforma.
    order = np.argsort(-probabilities, axis=1, kind="stable")
    return order, np.take_along_axis(probabilities, order, axis=1)


def _keep_sorted(probabilities: np.ndarray, order: np.ndarray, keep: np.ndarray) -> np.ndarray:
    mask = np.zeros_like(keep)
    np.put_along_axis(mask, order, keep, axis=1)
    kept = np.where(mask, probabilities, 0.0)
    return kept / kept.sum(axis=1, keepdims=True)


def top_k_filter(probabilities: np.ndarray, k: int) -> np.ndarray:
    """EN: Keeps the k most probable tokens, zeroes the rest and renormalises to sum 1.

    PT: Mantém os k tokens mais prováveis, zera o resto e renormaliza para somar 1.
    """
    order, sorted_probabilities = _ranks(probabilities)
    keep = np.arange(probabilities.shape[1])[None, :] < k
    return _keep_sorted(probabilities, order, np.broadcast_to(keep, sorted_probabilities.shape))


def top_p_filter(probabilities: np.ndarray, p: float) -> np.ndarray:
    """EN: Nucleus sampling: keeps the SMALLEST set of most probable tokens whose probabilities
    add up to at least p. A token is kept when the tokens before it have not reached p yet, so
    the token that crosses the threshold is included. Unlike top-k, the size of the set adapts:
    one token when the model is sure, many when it hesitates.

    PT: Amostragem por núcleo: mantém o MENOR conjunto de tokens mais prováveis cujas
    probabilidades somam pelo menos p. Um token fica quando os anteriores a ele ainda não
    chegaram a p, então o token que cruza o limite entra. Diferente do top-k, o tamanho do
    conjunto se adapta: um token quando o modelo tem certeza, muitos quando ele hesita.
    """
    order, sorted_probabilities = _ranks(probabilities)
    before = np.cumsum(sorted_probabilities, axis=1) - sorted_probabilities
    return _keep_sorted(probabilities, order, before < p)


def next_token_distribution(logits: np.ndarray, setting: Setting) -> np.ndarray:
    """EN: The distribution a token is really drawn from: temperature, then top-k, then top-p.
    Greedy is the limit case: all the probability on the single most probable token.

    PT: A distribuição da qual o token é realmente sorteado: temperatura, depois top-k, depois
    top-p. Guloso é o caso limite: toda a probabilidade no único token mais provável.
    """
    if setting.greedy:
        one_hot = np.zeros(logits.shape, dtype=np.float64)
        one_hot[np.arange(len(logits)), logits.argmax(axis=1)] = 1.0
        return one_hot
    probabilities = apply_temperature(logits, setting.temperature)
    if setting.top_k is not None:
        probabilities = top_k_filter(probabilities, setting.top_k)
    if setting.top_p is not None:
        probabilities = top_p_filter(probabilities, setting.top_p)
    return probabilities


def entropy_bits(probabilities: np.ndarray) -> np.ndarray:
    """EN: Entropy of each row, in bits: -sum(p * log2 p). It measures how open the choice is.
    0 bits = one token has all the probability. 1 bit = a fair coin between two tokens.
    log2(V) bits = every token equally likely.

    PT: Entropia de cada linha, em bits: -soma(p * log2 p). Mede o quanto a escolha está em
    aberto. 0 bits = um token tem toda a probabilidade. 1 bit = uma moeda justa entre dois
    tokens. log2(V) bits = todos os tokens igualmente prováveis.
    """
    safe = np.where(probabilities > 0, probabilities, 1.0)
    return -(probabilities * np.log2(safe)).sum(axis=1)


def sample_rows(probabilities: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """EN: Draws one token per row. Picture each row as a ruler from 0 to 1 cut into pieces,
    one per token, each as long as its probability. A random point on the ruler picks a piece.

    PT: Sorteia um token por linha. Imagine cada linha como uma régua de 0 a 1 cortada em
    pedaços, um por token, cada um do tamanho da sua probabilidade. Um ponto aleatório da régua
    escolhe um pedaço.
    """
    cumulative = np.cumsum(probabilities, axis=1)
    points = rng.random(len(probabilities))[:, None] * cumulative[:, -1:]
    chosen = (cumulative <= points).sum(axis=1)
    return np.minimum(chosen, probabilities.shape[1] - 1)


@dataclass(frozen=True)
class Generation:
    lines: list[list[int]]
    # EN: Mean entropy (bits) of the distributions the tokens were drawn from.
    # PT: Entropia média (bits) das distribuições das quais os tokens foram sorteados.
    mean_entropy_bits: float


def generate_lines(
    params: Params,
    config: Config,
    setting: Setting,
    *,
    newline_id: int,
    count: int,
    max_length: int,
    seed: int,
) -> Generation:
    """EN: Writes `count` lines at once. Every text starts as a single line break, and the loop
    is the whole of text generation: run the model, take the scores of the LAST position, choose
    one token, append it, run again. A line ends at the next line break or at `max_length`.

    PT: Escreve `count` linhas de uma vez. Todo texto começa como uma única quebra de linha, e
    o laço é toda a geração de texto: roda o modelo, pega as notas da ÚLTIMA posição, escolhe
    um token, anexa, roda de novo. Uma linha acaba na próxima quebra de linha ou em `max_length`.
    """
    rng = np.random.default_rng(seed)
    tokens = np.full((count, 1), newline_id, dtype=np.int64)
    active = np.ones(count, dtype=bool)
    entropy_sum, entropy_count = 0.0, 0
    for _ in range(max_length):
        # EN: The model only sees its context window, so older tokens are dropped.
        # PT: O modelo só enxerga a janela de contexto, então os tokens mais antigos saem.
        logits, _ = forward(params, config, tokens[:, -config.block_size :])
        probabilities = next_token_distribution(logits[:, -1, :], setting)
        entropy_sum += float(entropy_bits(probabilities)[active].sum())
        entropy_count += int(active.sum())
        chosen = sample_rows(probabilities, rng)
        tokens = np.concatenate([tokens, chosen[:, None]], axis=1)
        active &= chosen != newline_id
        if not active.any():
            break
    lines = []
    for row in tokens[:, 1:]:
        ends = np.flatnonzero(row == newline_id)
        lines.append([int(token) for token in (row[: ends[0]] if len(ends) else row)])
    return Generation(lines, entropy_sum / entropy_count)


def next_token_probabilities(params: Params, config: Config, tokens: np.ndarray) -> np.ndarray:
    """EN: P(next token | this context), for one sequence of ids.

    PT: P(próximo token | este contexto), para uma sequência de ids.
    """
    logits, _ = forward(params, config, tokens[None, -config.block_size :])
    return softmax(logits[0, -1].astype(np.float64))
