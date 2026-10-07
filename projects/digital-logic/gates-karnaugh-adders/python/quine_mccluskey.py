"""Quine-McCluskey minimisation.

EN: The tabular version of the Karnaugh map, in two steps: find every prime implicant, then
    pick the cheapest set of prime implicants that covers all the minterms. This file is an
    independent second implementation of `ts/src/quine-mccluskey.ts`.

PT: A versão tabular do mapa de Karnaugh, em dois passos: achar todos os implicantes primos e
    depois escolher o conjunto mais barato de implicantes primos que cobre todos os mintermos.
    Este arquivo é uma segunda implementação, independente, de `ts/src/quine-mccluskey.ts`.
"""

from collections.abc import Iterable, Sequence
from dataclasses import dataclass


@dataclass(frozen=True, order=True)
class Implicant:
    """A product term, that is, a group of cells of the map.

    EN: `mask` marks the eliminated variables (the dashes of the tabular method) and `value`
        holds the value of the others. With 4 variables, mask 0b1010 and value 0 are -0-0,
        the term ~B & ~D.
    PT: `mask` marca as variáveis eliminadas (os traços do método tabular) e `value` guarda o
        valor das outras. Com 4 variáveis, mask 0b1010 e value 0 são -0-0, o termo ~B & ~D.
    """

    mask: int
    value: int

    def covers(self, minterm: int) -> bool:
        return minterm & ~self.mask == self.value

    def literal_count(self, variable_count: int) -> int:
        return variable_count - self.mask.bit_count()


@dataclass(frozen=True)
class Minimisation:
    variable_count: int
    prime_implicants: tuple[Implicant, ...]
    essential: tuple[Implicant, ...]
    cover: tuple[Implicant, ...]


def find_prime_implicants(terms: Iterable[int]) -> list[Implicant]:
    """Step 1: merge terms that differ in one variable until nothing merges.

    EN: X & Y | X & ~Y = X. Two terms with the same dashes whose values differ in exactly one
        bit become one term with one more dash. A term that never merged is a prime implicant.
    PT: X & Y | X & ~Y = X. Dois termos com os mesmos traços cujos valores diferem em exatamente
        um bit viram um termo com um traço a mais. Um termo que nunca se fundiu é um implicante
        primo.
    """
    current = {Implicant(0, term) for term in terms}
    primes: set[Implicant] = set()
    while current:
        merged: set[Implicant] = set()
        following: set[Implicant] = set()
        ordered = sorted(current)
        for index, first in enumerate(ordered):
            for second in ordered[index + 1 :]:
                difference = first.value ^ second.value
                if first.mask == second.mask and difference.bit_count() == 1:
                    following.add(Implicant(first.mask | difference, first.value & ~difference))
                    merged.update((first, second))
        primes |= current - merged
        current = following
    return sorted(primes)


def minimise(
    variable_count: int, minterms: Iterable[int], dont_cares: Iterable[int] = ()
) -> Minimisation:
    """Step 2: essential prime implicants first, then an exact search for the rest.

    EN: A prime implicant is essential when it is the only one covering some minterm. Don't-care
        terms help to build larger groups in step 1 but do not have to be covered.
    PT: Um implicante primo é essencial quando é o único que cobre algum mintermo. Os termos
        irrelevantes ajudam a formar grupos maiores no passo 1, mas não precisam ser cobertos.
    """
    required = sorted(set(minterms))
    optional = set(dont_cares)
    limit = 1 << variable_count
    for term in [*required, *optional]:
        if not 0 <= term < limit:
            raise ValueError(f"term {term} does not fit in {variable_count} variables")
    primes = find_prime_implicants({*required, *optional})

    essential: list[Implicant] = []
    for minterm in required:
        candidates = [prime for prime in primes if prime.covers(minterm)]
        if len(candidates) == 1 and candidates[0] not in essential:
            essential.append(candidates[0])

    def cost(cover: Sequence[Implicant]) -> tuple[int, int]:
        return len(cover), sum(item.literal_count(variable_count) for item in cover)

    best: list[Implicant] | None = None

    def search(chosen: list[Implicant], uncovered: list[int]) -> None:
        nonlocal best
        if best is not None and cost(chosen) >= cost(best):
            return
        if not uncovered:
            best = list(chosen)
            return
        options = min(
            ([prime for prime in primes if prime.covers(minterm)] for minterm in uncovered),
            key=len,
        )
        for option in options:
            search([*chosen, option], [m for m in uncovered if not option.covers(m)])

    search(list(essential), [m for m in required if not any(p.covers(m) for p in essential)])
    return Minimisation(
        variable_count, tuple(primes), tuple(sorted(essential)), tuple(sorted(best or []))
    )


def to_expression(cover: Sequence[Implicant], variables: Sequence[str]) -> str:
    """Writes a cover as a sum of products in the syntax that `logic.parse` reads."""
    if not cover:
        return "0"
    terms = []
    for implicant in cover:
        literals = []
        for index, name in enumerate(variables):
            bit = 1 << (len(variables) - 1 - index)
            if implicant.mask & bit:
                continue
            literals.append(name if implicant.value & bit else f"~{name}")
        terms.append(" & ".join(literals) if literals else "1")
    return " | ".join(terms)
