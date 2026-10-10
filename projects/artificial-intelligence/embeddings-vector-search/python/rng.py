"""EN: A tiny seeded random generator (mulberry32), the same one written in ts/src/rng.ts.
The built-in generators of Python and JavaScript use different algorithms, so they can never draw
the same numbers. This one uses only 32-bit integer arithmetic, which has no rounding, so both
languages produce the same sequence bit for bit, and the random planes of the index are identical.

PT: Um gerador aleatório pequeno e com semente (mulberry32), o mesmo escrito em ts/src/rng.ts.
Os geradores embutidos do Python e do JavaScript usam algoritmos diferentes, então nunca sorteiam
os mesmos números. Este usa só aritmética inteira de 32 bits, que não arredonda, então as duas
linguagens produzem a mesma sequência bit a bit, e os planos aleatórios do índice são idênticos.

ES: Un generador aleatorio pequeño y con semilla (mulberry32), el mismo escrito en ts/src/rng.ts.
Los generadores incorporados de Python y de JavaScript usan algoritmos distintos, así que nunca
sortean los mismos números. Este usa solo aritmética de enteros de 32 bits, que no redondea, así
que los dos lenguajes producen la misma secuencia bit a bit, y los planos aleatorios del índice
son idénticos.
"""

from collections.abc import Callable

Rng = Callable[[], float]

MASK = 0xFFFFFFFF


def mulberry32(seed: int) -> Rng:
    """Returns a function that yields numbers in [0, 1), the same sequence for the same seed."""
    state = seed & MASK

    def next_number() -> float:
        nonlocal state
        # EN: A Python integer never overflows, a JavaScript 32-bit integer does. `& MASK` keeps
        #     the low 32 bits after every step, which is what JavaScript does by itself.
        # PT: Um inteiro do Python nunca estoura, um inteiro de 32 bits do JavaScript estoura.
        #     `& MASK` guarda os 32 bits baixos depois de cada passo, que é o que o JavaScript
        #     faz sozinho.
        # ES: Un entero de Python nunca desborda, un entero de 32 bits de JavaScript sí. `& MASK`
        #     conserva los 32 bits bajos después de cada paso, que es lo que JavaScript hace solo.
        state = (state + 0x6D2B79F5) & MASK
        t = state
        t = ((t ^ (t >> 15)) * (t | 1)) & MASK
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & MASK)) & MASK
        return (t ^ (t >> 14)) / 4294967296

    return next_number


def bell_random(rng: Rng) -> float:
    """EN: Four uniform numbers added, minus 2: a bell-like shape around zero using only additions,
    which give the same result in every language (log and cos may differ in the last digit).

    PT: Quatro números uniformes somados, menos 2: uma forma parecida com o sino ao redor de zero
    usando só somas, que dão o mesmo resultado em qualquer linguagem (log e cos podem diferir no
    último dígito).

    ES: Cuatro números uniformes sumados, menos 2: una forma parecida a la campana alrededor de cero
    usando solo sumas, que dan el mismo resultado en cualquier lenguaje (log y cos pueden diferir en
    el último dígito).
    """
    return rng() + rng() + rng() + rng() - 2
