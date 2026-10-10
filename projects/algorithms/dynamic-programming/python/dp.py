"""Knapsack, longest common subsequence and coin change, three versions each.

EN: Same recurrences as the TypeScript reference in `ts/src/`, where each problem is explained
    in detail. Every problem has a naive version (plain recursion), a memoised version (the
    same recursion with a cache) and a tabulated version (loops filling a table). The recursive
    versions receive a `Counter`, because the number of calls is what shows the repeated work.
PT: Mesmas recorrências da referência em TypeScript em `ts/src/`, onde cada problema é explicado
    em detalhe. Todo problema tem uma versão ingênua (recursão pura), uma memoizada (a mesma
    recursão com cache) e uma tabulada (laços preenchendo uma tabela). As versões recursivas
    recebem um `Counter`, porque o número de chamadas é o que mostra o trabalho repetido.
ES: Mismas recurrencias que la referencia en TypeScript en `ts/src/`, donde cada problema se explica
    en detalle. Todo problema tiene una versión ingenua (recursión pura), una memoizada (la misma
    recursión con caché) y una tabulada (bucles que llenan una tabla). Las versiones recursivas
    reciben un `Counter`, porque el número de llamadas es lo que muestra el trabajo repetido.
"""

from collections.abc import Callable, Sequence
from dataclasses import dataclass

IMPOSSIBLE = float("inf")


@dataclass
class Counter:
    calls: int = 0


@dataclass(frozen=True)
class Item:
    value: int
    weight: int


def lehmer(seed: int) -> Callable[[], int]:
    # EN: Same generator as the TypeScript side, so both languages build the same instances.
    # PT: Mesmo gerador do lado TypeScript, então as duas linguagens montam as mesmas instâncias.
    # ES: Mismo generador que el lado TypeScript, así ambos lenguajes construyen las mismas
    #     instancias.
    state = seed % 2147483646 + 1

    def step() -> int:
        nonlocal state
        state = state * 48271 % 2147483647
        return state

    return step


# --- 0-1 knapsack / mochila 0-1 -------------------------------------------------------------
# EN: best(i, w) = max(best(i + 1, w), value[i] + best(i + 1, w - weight[i])): take or skip.
# PT: best(i, w) = max(best(i + 1, w), valor[i] + best(i + 1, w - peso[i])): levar ou pular.
# ES: best(i, w) = max(best(i + 1, w), valor[i] + best(i + 1, w - peso[i])): llevar u omitir.


def knapsack_naive(items: Sequence[Item], capacity: int, counter: Counter) -> int:
    def best(i: int, w: int) -> int:
        counter.calls += 1
        if i == len(items):
            return 0
        skip = best(i + 1, w)
        item = items[i]
        return max(skip, item.value + best(i + 1, w - item.weight)) if item.weight <= w else skip

    return best(0, capacity)


def knapsack_memo(items: Sequence[Item], capacity: int, counter: Counter) -> int:
    # EN: The cache key is the pair (i, w): the only things the answer depends on.
    # PT: A chave do cache é o par (i, w): as únicas coisas de que a resposta depende.
    # ES: La clave del caché es el par (i, w): lo único de lo que depende la respuesta.
    memo: dict[tuple[int, int], int] = {}

    def best(i: int, w: int) -> int:
        counter.calls += 1
        if i == len(items):
            return 0
        if (i, w) in memo:
            return memo[(i, w)]
        skip = best(i + 1, w)
        item = items[i]
        result = max(skip, item.value + best(i + 1, w - item.weight)) if item.weight <= w else skip
        memo[(i, w)] = result
        return result

    return best(0, capacity)


def knapsack_table(items: Sequence[Item], capacity: int) -> list[list[int]]:
    # EN: Row i reads only row i - 1, so the rows are filled from top to bottom.
    # PT: A linha i só lê a linha i - 1, então as linhas são preenchidas de cima para baixo.
    # ES: La fila i solo lee la fila i - 1, así que las filas se llenan de arriba hacia abajo.
    table = [[0] * (capacity + 1)]
    for item in items:
        previous = table[-1]
        row = [
            max(previous[w], item.value + previous[w - item.weight])
            if item.weight <= w
            else previous[w]
            for w in range(capacity + 1)
        ]
        table.append(row)
    return table


def knapsack_tab(items: Sequence[Item], capacity: int) -> int:
    return knapsack_table(items, capacity)[-1][capacity]


# --- longest common subsequence / maior subsequência comum ----------------------------------
# EN: A match consumes one character of each string. A mismatch tries dropping one of them.
# PT: Uma coincidência consome um caractere de cada string. Uma diferença tenta descartar um deles.
# ES: Una coincidencia consume un carácter de cada cadena. Una diferencia intenta descartar uno
#     de ellos.


def lcs_naive(a: str, b: str, counter: Counter) -> int:
    def lcs(i: int, j: int) -> int:
        counter.calls += 1
        if i == len(a) or j == len(b):
            return 0
        if a[i] == b[j]:
            return 1 + lcs(i + 1, j + 1)
        return max(lcs(i + 1, j), lcs(i, j + 1))

    return lcs(0, 0)


def lcs_memo(a: str, b: str, counter: Counter) -> int:
    memo: dict[tuple[int, int], int] = {}

    def lcs(i: int, j: int) -> int:
        counter.calls += 1
        if i == len(a) or j == len(b):
            return 0
        if (i, j) in memo:
            return memo[(i, j)]
        result = 1 + lcs(i + 1, j + 1) if a[i] == b[j] else max(lcs(i + 1, j), lcs(i, j + 1))
        memo[(i, j)] = result
        return result

    return lcs(0, 0)


def lcs_table(a: str, b: str) -> list[list[int]]:
    table = [[0] * (len(b) + 1)]
    for i in range(1, len(a) + 1):
        previous = table[-1]
        row = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            row[j] = previous[j - 1] + 1 if a[i - 1] == b[j - 1] else max(previous[j], row[j - 1])
        table.append(row)
    return table


def lcs_tab(a: str, b: str) -> int:
    return lcs_table(a, b)[-1][len(b)]


# --- coin change / troco --------------------------------------------------------------------
# EN: coins(v) = 1 + min(coins(v - c)) over every coin c <= v, and -1 when v cannot be made.
# PT: coins(v) = 1 + min(coins(v - c)) sobre toda moeda c <= v, e -1 quando v não pode ser formado.
# ES: coins(v) = 1 + min(coins(v - c)) sobre toda moneda c <= v, y -1 cuando v no se puede formar.


def _finish(result: float) -> int:
    return -1 if result == IMPOSSIBLE else int(result)


def coin_change_naive(coins: Sequence[int], amount: int, counter: Counter) -> int:
    def fewest(v: int) -> float:
        counter.calls += 1
        if v == 0:
            return 0
        return min((1 + fewest(v - coin) for coin in coins if coin <= v), default=IMPOSSIBLE)

    return _finish(fewest(amount))


def coin_change_memo(coins: Sequence[int], amount: int, counter: Counter) -> int:
    memo: dict[int, float] = {}

    def fewest(v: int) -> float:
        counter.calls += 1
        if v == 0:
            return 0
        if v in memo:
            return memo[v]
        memo[v] = min((1 + fewest(v - coin) for coin in coins if coin <= v), default=IMPOSSIBLE)
        return memo[v]

    return _finish(fewest(amount))


def coin_change_table(coins: Sequence[int], amount: int) -> list[float]:
    # EN: dp[v] only reads smaller amounts, so ascending order makes them final before use.
    # PT: dp[v] só lê valores menores, então a ordem crescente os deixa prontos antes do uso.
    # ES: dp[v] solo lee montos menores, así que el orden ascendente los deja listos antes de
    #     usarlos.
    dp: list[float] = [0] + [IMPOSSIBLE] * amount
    for v in range(1, amount + 1):
        for coin in coins:
            if coin <= v:
                dp[v] = min(dp[v], dp[v - coin] + 1)
    return dp


def coin_change_tab(coins: Sequence[int], amount: int) -> int:
    return _finish(coin_change_table(coins, amount)[amount])
