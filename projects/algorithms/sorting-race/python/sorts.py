"""The six sorting algorithms of the race, in pure Python.

EN: Same algorithms and same decisions as the TypeScript reference in `ts/src/`, where each
    one is explained in detail. What changes here is the cost of each step: CPython interprets
    every comparison and every index access, so the constant factor is tens of times larger
    than in a compiled language, while the order of growth stays the same.
PT: Mesmos algoritmos e mesmas decisões da referência em TypeScript em `ts/src/`, onde cada um
    é explicado em detalhe. O que muda aqui é o custo de cada passo: o CPython interpreta cada
    comparação e cada acesso por índice, então o fator constante é dezenas de vezes maior que
    em uma linguagem compilada, enquanto a ordem de crescimento continua a mesma.
"""

from collections.abc import Callable

SortFunction = Callable[[list[int]], list[int]]


def bubble_sort(values: list[int]) -> list[int]:
    # EN: Swap out-of-order neighbours. Stop when a pass makes no swap.
    # PT: Troca vizinhos fora de ordem. Para quando uma passada não faz trocas.
    a = list(values)
    for end in range(len(a) - 1, 0, -1):
        swapped = False
        for i in range(end):
            if a[i] > a[i + 1]:
                a[i], a[i + 1] = a[i + 1], a[i]
                swapped = True
        if not swapped:
            break
    return a


def insertion_sort(values: list[int]) -> list[int]:
    # EN: Insert each value into the sorted prefix, shifting the larger values right.
    # PT: Insere cada valor no prefixo ordenado, deslocando os maiores para a direita.
    a = list(values)
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
    return a


def merge_sort(values: list[int]) -> list[int]:
    # EN: Split in half, sort each half, merge. One buffer is reused by every merge.
    # PT: Divide ao meio, ordena cada metade, intercala. Um buffer é reusado em toda intercalação.
    a = list(values)
    buffer = [0] * len(a)

    def sort_range(lo: int, hi: int) -> None:
        if hi - lo < 2:
            return
        mid = (lo + hi) // 2
        sort_range(lo, mid)
        sort_range(mid, hi)
        i, j, k = lo, mid, lo
        while i < mid and j < hi:
            # EN: `<=` takes the left value on a tie, which keeps the sort stable.
            # PT: `<=` pega o valor da esquerda no empate, o que mantém a ordenação estável.
            if a[i] <= a[j]:
                buffer[k] = a[i]
                i += 1
            else:
                buffer[k] = a[j]
                j += 1
            k += 1
        while i < mid:
            buffer[k] = a[i]
            i += 1
            k += 1
        while j < hi:
            buffer[k] = a[j]
            j += 1
            k += 1
        a[lo:hi] = buffer[lo:hi]

    sort_range(0, len(a))
    return a


def quick_sort(values: list[int]) -> list[int]:
    # EN: Hoare partition around the median of three. Recursing on the smaller side and looping
    #     on the larger one keeps the stack at O(log n), far from Python's recursion limit.
    # PT: Partição de Hoare em torno da mediana de três. Fazer a recursão no lado menor e o laço
    #     no maior mantém a pilha em O(log n), longe do limite de recursão do Python.
    a = list(values)

    def sort_range(lo: int, hi: int) -> None:
        while lo < hi:
            x, y, z = a[lo], a[(lo + hi) // 2], a[hi]
            pivot = max(min(x, y), min(max(x, y), z))
            i, j = lo, hi
            while i <= j:
                while a[i] < pivot:
                    i += 1
                while a[j] > pivot:
                    j -= 1
                if i <= j:
                    a[i], a[j] = a[j], a[i]
                    i += 1
                    j -= 1
            if j - lo < hi - i:
                sort_range(lo, j)
                lo = i
            else:
                sort_range(i, hi)
                hi = j

    sort_range(0, len(a) - 1)
    return a


def heap_sort(values: list[int]) -> list[int]:
    # EN: Build a max-heap inside the list, then move the maximum to the end n - 1 times.
    # PT: Constrói um max-heap dentro da lista e move o máximo para o fim n - 1 vezes.
    a = list(values)
    n = len(a)

    def sift_down(start: int, size: int) -> None:
        value = a[start]
        i = start
        while True:
            child = 2 * i + 1
            if child >= size:
                break
            if child + 1 < size and a[child + 1] > a[child]:
                child += 1
            if a[child] <= value:
                break
            a[i] = a[child]
            i = child
        a[i] = value

    for i in range(n // 2 - 1, -1, -1):
        sift_down(i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]
        sift_down(0, end)
    return a


def radix_sort(values: list[int]) -> list[int]:
    # EN: LSD radix sort in base 256: four stable counting passes, one per byte of the key.
    #     Valid for integers from 0 to 2^31 - 1.
    # PT: Radix sort LSD na base 256: quatro passadas estáveis de contagem, uma por byte da
    #     chave. Válido para inteiros de 0 a 2^31 - 1.
    source = list(values)
    target = [0] * len(source)
    for shift in range(0, 32, 8):
        count = [0] * 256
        for value in source:
            count[(value >> shift) & 255] += 1
        for digit in range(1, 256):
            count[digit] += count[digit - 1]
        for value in reversed(source):
            digit = (value >> shift) & 255
            count[digit] -= 1
            target[count[digit]] = value
        source, target = target, source
    return source


SORTS: dict[str, SortFunction] = {
    "bubble": bubble_sort,
    "insertion": insertion_sort,
    "merge": merge_sort,
    "quick": quick_sort,
    "heap": heap_sort,
    "radix": radix_sort,
}
