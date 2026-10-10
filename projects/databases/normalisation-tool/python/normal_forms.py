"""EN: Normal form check: 2NF, 3NF and BCNF, each with the dependency that breaks it.

PT: Verificação de forma normal: 2FN, 3FN e FNBC, cada uma com a dependência que a viola.

ES: Verificación de forma normal: 2FN, 3FN y FNBC, cada una con la dependencia que la viola.
"""

from dataclasses import dataclass
from itertools import combinations

from fd import FD, Attributes, candidate_keys, closure, is_superkey, minimal_cover

LADDER = ["1NF", "2NF", "3NF", "BCNF"]


@dataclass(frozen=True)
class Violation:
    """EN: One reason why a relation is not in `normal_form`: the dependency and its kind.

    PT: Um motivo pelo qual a relação não está em `normal_form`: a dependência e o tipo dela.

    ES: Un motivo por el cual la relación no está en `normal_form`: la dependencia y su tipo.
    """

    normal_form: str
    kind: str
    fd: FD
    key: Attributes | None = None


def prime_attributes(keys: list[Attributes]) -> Attributes:
    """EN: A prime attribute belongs to at least one candidate key. 2NF and 3NF only restrict
    the non-prime ones, which is exactly why they are weaker than BCNF.

    PT: Um atributo primo pertence a pelo menos uma chave candidata. A 2FN e a 3FN só
    restringem os não primos, e é exatamente por isso que são mais fracas que a FNBC.

    ES: Un atributo primo pertenece a al menos una clave candidata. La 2FN y la 3FN solo
    restringen a los no primos, y es exactamente por eso que son más débiles que la FNBC.
    """
    return frozenset().union(*keys) if keys else frozenset()


def violations_2nf(relation: Attributes, fds: list[FD]) -> list[Violation]:
    # EN: 2NF forbids partial dependencies: a non-prime attribute determined by a proper subset
    #     of a candidate key. Each proper subset of each key is tried, and its closure shows
    #     which non-prime attributes depend on only that part of the key.
    # PT: A 2FN proíbe dependências parciais: um atributo não primo determinado por um
    #     subconjunto próprio de uma chave candidata. Cada subconjunto próprio de cada chave é
    #     testado, e o fecho dele mostra quais atributos não primos dependem só daquela parte
    #     da chave.
    # ES: La 2FN prohíbe las dependencias parciales: un atributo no primo determinado por un
    #     subconjunto propio de una clave candidata. Se prueba cada subconjunto propio de cada
    #     clave, y su cierre muestra qué atributos no primos dependen solo de esa parte de la
    #     clave.
    keys = candidate_keys(relation, fds)
    prime = prime_attributes(keys)
    found: list[Violation] = []
    seen: set[FD] = set()
    for key in keys:
        for size in range(1, len(key)):
            for part in combinations(sorted(key), size):
                lhs = frozenset(part)
                partial = (closure(lhs, fds) & relation) - prime - lhs
                fd = FD(lhs, frozenset(partial))
                if partial and fd not in seen:
                    seen.add(fd)
                    found.append(Violation("2NF", "partial", fd, key))
    return found


def violations_3nf(relation: Attributes, fds: list[FD]) -> list[Violation]:
    # EN: 3NF: for every nontrivial X -> A, either X is a superkey or A is prime. What it
    #     forbids is a non-prime attribute hanging from something that is not a key, which is
    #     the transitive dependency key -> X -> A. Checking a cover of the dependencies is
    #     enough.
    # PT: 3FN: para toda X -> A não trivial, ou X é superchave ou A é primo. O que ela proíbe é
    #     um atributo não primo pendurado em algo que não é chave, que é a dependência
    #     transitiva chave -> X -> A. Verificar uma cobertura das dependências é suficiente.
    # ES: 3FN: para toda X -> A no trivial, o bien X es superclave o bien A es primo. Lo que
    #     prohíbe es un atributo no primo colgado de algo que no es clave, que es la dependencia
    #     transitiva clave -> X -> A. Verificar una cobertura de las dependencias es suficiente.
    prime = prime_attributes(candidate_keys(relation, fds))
    return [
        Violation("3NF", "transitive", fd)
        for fd in minimal_cover(fds)
        if not is_superkey(fd.lhs, relation, fds) and not fd.rhs <= prime
    ]


def violations_bcnf(relation: Attributes, fds: list[FD]) -> list[Violation]:
    # EN: BCNF: every determinant is a superkey, with no exception for prime attributes. A
    #     relation can be in 3NF and still break BCNF when candidate keys overlap.
    # PT: FNBC: todo determinante é superchave, sem exceção para atributos primos. Uma relação
    #     pode estar na 3FN e ainda violar a FNBC quando chaves candidatas se sobrepõem.
    # ES: FNBC: todo determinante es superclave, sin excepción para atributos primos. Una
    #     relación puede estar en 3FN y aun así violar la FNBC cuando las claves candidatas se
    #     solapan.
    return [
        Violation("BCNF", "determinant", fd)
        for fd in minimal_cover(fds)
        if not is_superkey(fd.lhs, relation, fds)
    ]


def all_violations(relation: Attributes, fds: list[FD]) -> dict[str, list[Violation]]:
    return {
        "2NF": violations_2nf(relation, fds),
        "3NF": violations_3nf(relation, fds),
        "BCNF": violations_bcnf(relation, fds),
    }


def highest_normal_form(relation: Attributes, fds: list[FD]) -> str:
    """EN: The highest of 1NF, 2NF, 3NF and BCNF that the relation satisfies. 1NF is assumed:
    it is about values being atomic, which dependencies cannot express.

    PT: A mais alta entre 1FN, 2FN, 3FN e FNBC que a relação satisfaz. A 1FN é pressuposta: ela
    trata de valores atômicos, o que dependências não conseguem expressar.

    ES: La más alta entre 1FN, 2FN, 3FN y FNBC que la relación satisface. Se presupone la 1FN:
    trata de valores atómicos, algo que las dependencias no pueden expresar.
    """
    # EN: The forms are nested, so climbing stops at the first one that fails.
    # PT: As formas são aninhadas, então a subida para na primeira que falha.
    # ES: Las formas están anidadas, así que el ascenso se detiene en la primera que falla.
    found = all_violations(relation, fds)
    highest = "1NF"
    for form in LADDER[1:]:
        if found[form]:
            break
        highest = form
    return highest
