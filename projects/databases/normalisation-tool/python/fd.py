"""EN: Functional dependencies: parsing, attribute closure, candidate keys and minimal cover.

PT: Dependências funcionais: leitura, fecho de atributos, chaves candidatas e cobertura mínima.
"""

import re
from dataclasses import dataclass
from itertools import combinations

Attributes = frozenset[str]


@dataclass(frozen=True)
class FD:
    """EN: A functional dependency `lhs -> rhs`: two rows that agree on every attribute of `lhs`
    must agree on every attribute of `rhs`. `lhs` is called the determinant.

    PT: Uma dependência funcional `lhs -> rhs`: duas linhas iguais em todos os atributos de
    `lhs` precisam ser iguais em todos os atributos de `rhs`. `lhs` é chamado de determinante.
    """

    lhs: Attributes
    rhs: Attributes


def fmt_set(attributes: Attributes | set[str]) -> str:
    return "{" + ", ".join(sorted(attributes)) + "}"


def fmt_fd(fd: FD) -> str:
    return f"{', '.join(sorted(fd.lhs))} -> {', '.join(sorted(fd.rhs))}"


def sort_fds(fds: list[FD] | set[FD]) -> list[FD]:
    # EN: A fixed order makes every run print the same steps, which matters in a teaching tool.
    # PT: Uma ordem fixa faz toda execução imprimir os mesmos passos, o que importa em uma
    #     ferramenta de ensino.
    return sorted(fds, key=lambda fd: (sorted(fd.lhs), sorted(fd.rhs)))


def parse_attributes(text: str) -> list[str]:
    names = [name for name in re.split(r"[,\s]+", text.strip()) if name]
    for name in names:
        if not re.fullmatch(r"\w+", name):
            raise ValueError(f"invalid attribute name: {name!r}")
    return names


def parse_schema(text: str) -> tuple[str, list[str]]:
    """EN: Reads `R(A, B, C)` and returns the relation name and its attributes, in order.

    PT: Lê `R(A, B, C)` e devolve o nome da relação e seus atributos, em ordem.
    """
    match = re.fullmatch(r"\s*(\w+)\s*\((.*)\)\s*", text)
    if match is None:
        raise ValueError(f"expected a schema like R(A, B, C), got: {text!r}")
    attributes = parse_attributes(match.group(2))
    if not attributes:
        raise ValueError("a relation needs at least one attribute")
    if len(set(attributes)) != len(attributes):
        raise ValueError("an attribute appears twice in the schema")
    return match.group(1), attributes


def parse_fds(text: str, attributes: list[str] | None = None) -> list[FD]:
    """EN: Reads dependencies written as `A, B -> C; C -> D`. When the attributes of the
    relation are given, a dependency that mentions an unknown attribute is rejected.

    PT: Lê dependências escritas como `A, B -> C; C -> D`. Quando os atributos da relação são
    informados, uma dependência que cita um atributo desconhecido é rejeitada.
    """
    fds: list[FD] = []
    for part in text.split(";"):
        if not part.strip():
            continue
        sides = part.split("->")
        if len(sides) != 2:
            raise ValueError(f"expected 'left -> right', got: {part.strip()!r}")
        lhs = frozenset(parse_attributes(sides[0]))
        rhs = frozenset(parse_attributes(sides[1]))
        if not lhs or not rhs:
            raise ValueError(f"both sides of a dependency need attributes: {part.strip()!r}")
        unknown = (lhs | rhs) - set(attributes) if attributes is not None else set()
        if unknown:
            raise ValueError(f"attributes not in the schema: {fmt_set(unknown)}")
        fds.append(FD(lhs, rhs))
    return fds


def closure_steps(attributes: Attributes | set[str], fds: list[FD]) -> list[tuple[FD, Attributes]]:
    """EN: The steps of the closure algorithm: which dependency fired and what it added.

    PT: Os passos do algoritmo de fecho: qual dependência disparou e o que ela acrescentou.
    """
    # EN: Start with the given attributes. Whenever the whole left side of a dependency is
    #     already in the set, its right side is determined too, so it is added. Repeat until a
    #     full pass adds nothing. The result is everything the attributes determine.
    # PT: Começa com os atributos dados. Sempre que o lado esquerdo inteiro de uma dependência
    #     já está no conjunto, o lado direito também é determinado, então ele é acrescentado.
    #     Repete até uma passada completa não acrescentar nada. O resultado é tudo o que os
    #     atributos determinam.
    result = set(attributes)
    steps: list[tuple[FD, Attributes]] = []
    changed = True
    while changed:
        changed = False
        for fd in fds:
            if fd.lhs <= result and not fd.rhs <= result:
                added = frozenset(fd.rhs - result)
                result |= added
                steps.append((fd, added))
                changed = True
    return steps


def closure(attributes: Attributes | set[str], fds: list[FD]) -> Attributes:
    """EN: The closure X+: every attribute functionally determined by `attributes`.

    PT: O fecho X+: todo atributo determinado funcionalmente por `attributes`.
    """
    result = set(attributes)
    for _, added in closure_steps(attributes, fds):
        result |= added
    return frozenset(result)


def is_superkey(attributes: Attributes | set[str], relation: Attributes, fds: list[FD]) -> bool:
    return relation <= closure(attributes, fds)


def mandatory_attributes(relation: Attributes, fds: list[FD]) -> Attributes:
    """EN: Attributes that appear on no right side. Nothing determines them, so they cannot be
    derived and must belong to every candidate key.

    PT: Atributos que não aparecem em nenhum lado direito. Nada os determina, então não podem
    ser deduzidos e precisam pertencer a toda chave candidata.
    """
    determined: set[str] = set()
    for fd in fds:
        determined |= fd.rhs - fd.lhs
    return frozenset(relation - determined)


def candidate_keys(relation: Attributes, fds: list[FD]) -> list[Attributes]:
    """EN: All candidate keys: the sets of attributes whose closure is the whole relation and
    from which no attribute can be removed.

    PT: Todas as chaves candidatas: os conjuntos de atributos cujo fecho é a relação inteira e
    dos quais nenhum atributo pode ser retirado.
    """
    # EN: Every key contains the mandatory attributes, so the search only has to decide which
    #     of the other attributes to add. Trying smaller additions first and skipping any set
    #     that contains a key already found guarantees that every key kept is irreducible. The
    #     search is exponential in the worst case, which is fine for classroom schemas.
    # PT: Toda chave contém os atributos obrigatórios, então a busca só precisa decidir quais
    #     dos outros atributos acrescentar. Tentar primeiro os acréscimos menores e pular todo
    #     conjunto que contém uma chave já encontrada garante que toda chave mantida é
    #     irredutível. A busca é exponencial no pior caso, o que é aceitável para esquemas de
    #     sala de aula.
    core = mandatory_attributes(relation, fds)
    optional = sorted(relation - core)
    keys: list[Attributes] = []
    for size in range(len(optional) + 1):
        for extra in combinations(optional, size):
            candidate = core | frozenset(extra)
            if any(key <= candidate for key in keys):
                continue
            if is_superkey(candidate, relation, fds):
                keys.append(candidate)
    return sorted(keys, key=lambda key: (len(key), sorted(key)))


CoverStep = tuple[str, FD, FD | None]


def minimal_cover_steps(fds: list[FD]) -> tuple[list[FD], list[CoverStep]]:
    """EN: A minimal (irreducible) cover and the steps that produced it. Each step is
    (`split` | `reduce` | `drop`, dependency before, dependency after or None).

    PT: Uma cobertura mínima (irredutível) e os passos que a produziram. Cada passo é
    (`split` | `reduce` | `drop`, dependência antes, dependência depois ou None).
    """
    steps: list[CoverStep] = []

    # EN: Step 1, one attribute on each right side. `A -> B, C` says the same as `A -> B` and
    #     `A -> C`, and single right sides make the next two steps simple.
    # PT: Passo 1, um atributo em cada lado direito. `A -> B, C` diz o mesmo que `A -> B` e
    #     `A -> C`, e lados direitos unitários simplificam os dois passos seguintes.
    current: list[FD] = []
    for fd in sort_fds(fds):
        for attribute in sorted(fd.rhs - fd.lhs):
            single = FD(fd.lhs, frozenset({attribute}))
            if len(fd.rhs) > 1:
                steps.append(("split", fd, single))
            if single not in current:
                current.append(single)

    # EN: Step 2, no spare attribute on a left side. An attribute of the left side is spare when
    #     the remaining ones already determine the right side (their closure contains it).
    # PT: Passo 2, nenhum atributo sobrando no lado esquerdo. Um atributo do lado esquerdo sobra
    #     quando os restantes já determinam o lado direito (o fecho deles o contém).
    reduced: list[FD] = []
    for fd in current:
        lhs = set(fd.lhs)
        for attribute in sorted(fd.lhs):
            smaller = lhs - {attribute}
            if smaller and fd.rhs <= closure(smaller, current):
                lhs = smaller
        shorter = FD(frozenset(lhs), fd.rhs)
        if shorter != fd:
            steps.append(("reduce", fd, shorter))
        if shorter not in reduced:
            reduced.append(shorter)

    # EN: Step 3, no redundant dependency. A dependency is redundant when the others already
    #     imply it: the closure of its left side, computed without it, still reaches its right
    #     side. They are tested one at a time, because removing one can make another necessary.
    # PT: Passo 3, nenhuma dependência redundante. Uma dependência é redundante quando as outras
    #     já a implicam: o fecho do lado esquerdo dela, calculado sem ela, ainda alcança o lado
    #     direito. Elas são testadas uma de cada vez, porque remover uma pode tornar outra
    #     necessária.
    cover = list(reduced)
    for fd in sorted(
        reduced, key=lambda item: (-len(item.lhs), sorted(item.lhs), sorted(item.rhs))
    ):
        others = [other for other in cover if other != fd]
        if fd.rhs <= closure(fd.lhs, others):
            cover = others
            steps.append(("drop", fd, None))
    return sort_fds(cover), steps


def minimal_cover(fds: list[FD]) -> list[FD]:
    return minimal_cover_steps(fds)[0]


def equivalent(first: list[FD], second: list[FD]) -> bool:
    """EN: Two sets of dependencies are equivalent when each one implies every dependency of the
    other. This is how a minimal cover is checked: fewer dependencies, same meaning.

    PT: Dois conjuntos de dependências são equivalentes quando cada um implica todas as
    dependências do outro. É assim que uma cobertura mínima é conferida: menos dependências,
    mesmo significado.
    """
    return all(fd.rhs <= closure(fd.lhs, second) for fd in first) and all(
        fd.rhs <= closure(fd.lhs, first) for fd in second
    )


def project_fds(relation: Attributes, fds: list[FD]) -> list[FD]:
    """EN: The dependencies that hold inside a projection of the original relation.

    PT: As dependências que valem dentro de uma projeção da relação original.
    """
    # EN: A dependency of the projection may not be written anywhere: with A -> B and B -> C,
    #     the projection on {A, C} satisfies A -> C. So every subset X of the projection is
    #     tried, and what its closure reaches inside the projection becomes X -> (X+ ∩ R) - X.
    # PT: Uma dependência da projeção pode não estar escrita em lugar nenhum: com A -> B e
    #     B -> C, a projeção sobre {A, C} satisfaz A -> C. Então todo subconjunto X da projeção
    #     é testado, e o que o fecho dele alcança dentro da projeção vira X -> (X+ ∩ R) - X.
    projected: list[FD] = []
    names = sorted(relation)
    for size in range(1, len(names)):
        for subset in combinations(names, size):
            lhs = frozenset(subset)
            rhs = (closure(lhs, fds) & relation) - lhs
            if rhs:
                projected.append(FD(lhs, frozenset(rhs)))
    return projected
