"""EN: The lower bound of comparison sorting, seen from Python.

The TypeScript version counts comparisons by passing a comparator function to its own sorts.
Python allows something stronger: a key class that overloads the comparison operators. Every
comparison between two keys is intercepted, even the ones made inside the built-in `sorted`
(Timsort), whose code we cannot edit. And a sort that makes no comparison is proven to make
none: its counter stays at zero.

PT: O limite inferior da ordenação por comparação, visto do Python.

A versão em TypeScript conta comparações passando uma função comparadora para suas próprias
ordenações. O Python permite algo mais forte: uma classe de chave que sobrecarrega os operadores
de comparação. Toda comparação entre duas chaves é interceptada, inclusive as feitas dentro do
`sorted` embutido (Timsort), cujo código não podemos editar. E uma ordenação que não faz
comparações fica provada: seu contador permanece em zero.
"""

import itertools
import math
import random
from collections.abc import Callable, Sequence
from dataclasses import dataclass


class Counter:
    """EN: Counts comparisons between two keys. PT: Conta comparações entre duas chaves."""

    def __init__(self) -> None:
        self.comparisons = 0


class Key:
    """EN: An integer that reports every comparison made with another key.

    Reading `key.value` is not a comparison: it looks at one element only. That is exactly the
    difference between a comparison sort and a counting sort.

    PT: Um inteiro que registra toda comparação feita com outra chave.

    Ler `key.value` não é uma comparação: olha para um único elemento. Essa é exatamente a
    diferença entre uma ordenação por comparação e um counting sort.
    """

    __slots__ = ("_counter", "value")

    def __init__(self, value: int, counter: Counter) -> None:
        self.value = value
        self._counter = counter

    def __lt__(self, other: "Key") -> bool:
        self._counter.comparisons += 1
        return self.value < other.value

    def __le__(self, other: "Key") -> bool:
        self._counter.comparisons += 1
        return self.value <= other.value

    def __gt__(self, other: "Key") -> bool:
        self._counter.comparisons += 1
        return self.value > other.value

    def __ge__(self, other: "Key") -> bool:
        self._counter.comparisons += 1
        return self.value >= other.value

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Key):
            return NotImplemented
        self._counter.comparisons += 1
        return self.value == other.value


Sort = Callable[[Sequence[Key]], list[Key]]


def merge_sort(items: Sequence[Key]) -> list[Key]:
    """EN: Merge sort written with the `<` operator, so every comparison is counted.

    PT: Merge sort escrito com o operador `<`, então toda comparação é contada.
    """
    if len(items) <= 1:
        return list(items)
    half = len(items) // 2
    left = merge_sort(items[:half])
    right = merge_sort(items[half:])
    merged: list[Key] = []
    i = j = 0
    while i < len(left) and j < len(right):
        if right[j] < left[i]:
            merged.append(right[j])
            j += 1
        else:
            merged.append(left[i])
            i += 1
    return merged + left[i:] + right[j:]


def builtin_sort(items: Sequence[Key]) -> list[Key]:
    """EN: The built-in `sorted` (Timsort). It only ever uses `<`, which the key intercepts.

    PT: O `sorted` embutido (Timsort). Ele só usa `<`, que a chave intercepta.
    """
    return sorted(items)


def _sort_by_digit(items: Sequence[Key], buckets: int, digit: Callable[[int], int]) -> list[Key]:
    # EN: A stable counting sort: count each digit, turn the counts into first positions, then
    #     place every item. The digit is used as an index. No two items are ever compared.
    # PT: Um counting sort estável: conta cada dígito, transforma as contagens em primeiras
    #     posições, depois coloca cada item. O dígito é usado como índice. Dois itens nunca são
    #     comparados.
    positions = [0] * (buckets + 1)
    for item in items:
        positions[digit(item.value) + 1] += 1
    for index in range(1, buckets + 1):
        positions[index] += positions[index - 1]
    result: list[Key | None] = [None] * len(items)
    for item in items:
        slot = digit(item.value)
        result[positions[slot]] = item
        positions[slot] += 1
    return [item for item in result if item is not None]


def counting_sort(items: Sequence[Key], limit: int) -> list[Key]:
    """EN: Counting sort for keys in [0, limit): Theta(n + limit), zero comparisons.

    PT: Counting sort para chaves em [0, limit): Theta(n + limit), zero comparações.
    """
    for item in items:
        if not 0 <= item.value < limit:
            raise ValueError(f"key {item.value} is not in [0, {limit})")
    return _sort_by_digit(items, limit, lambda value: value)


def radix_sort(items: Sequence[Key], base: int = 10) -> list[Key]:
    """EN: Radix sort, least significant digit first: one stable counting sort per digit.

    PT: Radix sort, do dígito menos significativo para o mais: um counting sort estável por dígito.
    """
    result = list(items)
    largest = 0
    for item in items:
        if item.value < 0:
            raise ValueError(f"key {item.value} is negative")
        largest = max(largest, item.value)
    divisor = 1
    while largest // divisor > 0:
        result = _sort_by_digit(result, base, lambda value, d=divisor: (value // d) % base)
        divisor *= base
    return result


def log2_factorial(n: int) -> float:
    """EN: log2(n!), the information needed to tell n! input orders apart, in bits.

    PT: log2(n!), a informação necessária para distinguir n! ordens de entrada, em bits.
    """
    return sum(math.log2(value) for value in range(2, n + 1))


def minimum_comparisons(n: int) -> int:
    """EN: ceil(log2(n!)), computed exactly with Python's unlimited integers.

    For a positive integer x, ceil(log2(x)) is the number of bits of x - 1. No floating point
    is involved, so the answer is exact even for n in the thousands.

    PT: ceil(log2(n!)), calculado exatamente com os inteiros ilimitados do Python.

    Para um inteiro positivo x, ceil(log2(x)) é o número de bits de x - 1. Não há ponto
    flutuante envolvido, então a resposta é exata mesmo para n na casa dos milhares.
    """
    return (math.factorial(n) - 1).bit_length()


def measure(sort: Sort, values: Sequence[int]) -> tuple[list[int], int]:
    """EN: Sorts the values and returns the result with the number of comparisons made.

    PT: Ordena os valores e devolve o resultado com o número de comparações feitas.
    """
    counter = Counter()
    result = sort([Key(value, counter) for value in values])
    return [key.value for key in result], counter.comparisons


COMPARISON_SORTS: dict[str, Sort] = {
    "merge sort": merge_sort,
    "sorted() (Timsort)": builtin_sort,
}


def linear_sorts(limit: int) -> dict[str, Sort]:
    """EN: The sorts that index by key. PT: As ordenações que indexam pela chave."""
    return {
        "counting sort": lambda items: counting_sort(items, limit),
        "radix sort": radix_sort,
    }


@dataclass(frozen=True)
class Row:
    """EN: One line of a results table. PT: Uma linha de uma tabela de resultados."""

    algorithm: str
    minimum: int
    mean: float
    maximum: int
    sorted_inputs: int


def _row(name: str, sort: Sort, inputs: Sequence[Sequence[int]]) -> Row:
    counts: list[int] = []
    sorted_inputs = 0
    for values in inputs:
        result, comparisons = measure(sort, values)
        counts.append(comparisons)
        sorted_inputs += result == sorted(values)
    return Row(name, min(counts), sum(counts) / len(counts), max(counts), sorted_inputs)


def exhaustive(n: int) -> list[Row]:
    """EN: Every one of the n! input orders, for the comparison sorts.

    The minimum is the best case, the mean is the average case and the maximum is the worst
    case. The theorem bounds the last two.

    PT: Cada uma das n! ordens de entrada, para as ordenações por comparação.

    O mínimo é o melhor caso, a média é o caso médio e o máximo é o pior caso. O teorema limita
    os dois últimos.
    """
    inputs = list(itertools.permutations(range(n)))
    return [_row(name, sort, inputs) for name, sort in COMPARISON_SORTS.items()]


def random_inputs(n: int, count: int, seed: int) -> list[list[int]]:
    """EN: Seeded random permutations of 0..n-1, so the tables can be reproduced.

    PT: Permutações aleatórias de 0..n-1 com semente, para que as tabelas sejam reproduzíveis.
    """
    generator = random.Random(seed)
    return [generator.sample(range(n), n) for _ in range(count)]


def random_experiment(n: int, count: int, seed: int) -> list[Row]:
    """EN: The same random inputs through every sort, comparison-based or not.

    PT: As mesmas entradas aleatórias em todas as ordenações, por comparação ou não.
    """
    inputs = random_inputs(n, count, seed)
    sorts = {**COMPARISON_SORTS, **linear_sorts(n)}
    return [_row(name, sort, inputs) for name, sort in sorts.items()]


def best_case(n: int) -> int:
    """EN: Comparisons `sorted` makes on input that is already sorted: n - 1.

    Far below log2(n!), and no contradiction: the bound is about the worst case, not about
    every input.

    PT: Comparações que o `sorted` faz em uma entrada já ordenada: n - 1.

    Muito abaixo de log2(n!), e sem contradição: o limite fala do pior caso, não de toda entrada.
    """
    return measure(builtin_sort, range(n))[1]
