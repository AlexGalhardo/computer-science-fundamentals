"""EN: Decomposition to 3NF (synthesis) and to BCNF, plus the two quality tests of a
decomposition: lossless join (chase) and dependency preservation.

PT: Decomposição para a 3FN (síntese) e para a FNBC, mais os dois testes de qualidade de uma
decomposição: junção sem perda (chase) e preservação de dependências.

ES: Descomposición a la 3FN (síntesis) y a la FNBC, más las dos pruebas de calidad de una
descomposición: join sin pérdida (chase) y preservación de dependencias.
"""

from dataclasses import dataclass
from itertools import combinations

from fd import FD, Attributes, candidate_keys, closure, is_superkey, minimal_cover


@dataclass(frozen=True)
class SynthesisResult:
    relations: list[Attributes]
    cover: list[FD]
    groups: list[tuple[Attributes, Attributes]]
    added_key: Attributes | None
    removed: list[Attributes]


def sort_relations(relations: list[Attributes] | set[Attributes]) -> list[Attributes]:
    return sorted(set(relations), key=lambda relation: sorted(relation))


def synthesise_3nf(relation: Attributes, fds: list[FD]) -> SynthesisResult:
    """EN: 3NF by synthesis: build one relation per determinant of a minimal cover.

    PT: 3FN por síntese: monta uma relação por determinante de uma cobertura mínima.

    ES: 3FN por síntesis: arma una relación por determinante de una cobertura mínima.
    """
    # EN: 1. Take a minimal cover. 2. Group its dependencies by left side: each group X -> A,
    #     X -> B becomes the relation X ∪ {A, B}, where X is a key. This keeps every dependency
    #     checkable inside one relation. 3. If no relation contains a candidate key of the
    #     original relation, add one relation that is a key: it is what makes the join lossless.
    #     4. Drop a relation whose attributes are all inside another one.
    # PT: 1. Pega uma cobertura mínima. 2. Agrupa as dependências pelo lado esquerdo: cada grupo
    #     X -> A, X -> B vira a relação X ∪ {A, B}, em que X é chave. Isso mantém cada
    #     dependência verificável dentro de uma única relação. 3. Se nenhuma relação contém uma
    #     chave candidata da relação original, acrescenta uma relação que é uma chave: é ela que
    #     torna a junção sem perda. 4. Descarta a relação cujos atributos estão todos dentro de
    #     outra.
    # ES: 1. Toma una cobertura mínima. 2. Agrupa sus dependencias por lado izquierdo: cada
    #     grupo X -> A, X -> B se convierte en la relación X ∪ {A, B}, donde X es clave. Esto
    #     mantiene cada dependencia verificable dentro de una sola relación. 3. Si ninguna
    #     relación contiene una clave candidata de la relación original, agrega una relación que
    #     sea una clave: es lo que hace que el join sea sin pérdida. 4. Descarta la relación cuyos
    #     atributos están todos dentro de otra.
    cover = minimal_cover(fds)
    grouped: dict[Attributes, set[str]] = {}
    for fd in cover:
        grouped.setdefault(fd.lhs, set()).update(fd.rhs)
    groups = [(lhs, frozenset(rhs)) for lhs, rhs in grouped.items()]
    relations = [lhs | rhs for lhs, rhs in groups]

    keys = candidate_keys(relation, fds)
    added_key = None
    if not any(key <= candidate for key in keys for candidate in relations):
        added_key = keys[0]
        relations.append(added_key)

    removed = [
        candidate for candidate in relations if any(candidate < other for other in relations)
    ]
    kept = sort_relations([candidate for candidate in relations if candidate not in removed])
    return SynthesisResult(kept, cover, groups, added_key, sort_relations(removed))


@dataclass(frozen=True)
class BcnfStep:
    relation: Attributes
    lhs: Attributes
    closure_inside: Attributes
    first: Attributes
    second: Attributes


def find_bcnf_violation(
    relation: Attributes, fds: list[FD]
) -> tuple[Attributes, Attributes] | None:
    # EN: Inside a projection, X breaks BCNF when its closure reaches something new but not the
    #     whole projection: X determines an attribute without being a key. Closures are computed
    #     with the original dependencies and cut to the projection, which finds dependencies
    #     that are implied but not written. Smaller left sides are tried first.
    # PT: Dentro de uma projeção, X viola a FNBC quando o fecho dele alcança algo novo, mas não
    #     a projeção inteira: X determina um atributo sem ser chave. Os fechos são calculados
    #     com as dependências originais e recortados para a projeção, o que encontra
    #     dependências implicadas, mas não escritas. Lados esquerdos menores são testados antes.
    # ES: Dentro de una proyección, X viola la FNBC cuando su cierre alcanza algo nuevo, pero no
    #     toda la proyección: X determina un atributo sin ser clave. Los cierres se calculan
    #     con las dependencias originales y se recortan a la proyección, lo que encuentra
    #     dependencias implicadas pero no escritas. Los lados izquierdos menores se prueban antes.
    names = sorted(relation)
    for size in range(1, len(names)):
        for subset in combinations(names, size):
            lhs = frozenset(subset)
            inside = closure(lhs, fds) & relation
            if inside != lhs and inside != relation:
                return lhs, inside
    return None


def decompose_bcnf(relation: Attributes, fds: list[FD]) -> tuple[list[Attributes], list[BcnfStep]]:
    """EN: BCNF by repeated splitting. Returns the relations and the splits that were made.

    PT: FNBC por divisões repetidas. Devolve as relações e as divisões feitas.

    ES: FNBC por divisiones repetidas. Devuelve las relaciones y las divisiones realizadas.
    """
    # EN: While some relation R has a violation X -> Y, replace R by two projections:
    #     R1 = X+ (inside R), where X is a key, and R2 = R minus what X determines, keeping X.
    #     X is the common part and it is a key of R1, so by Heath's theorem each split is
    #     lossless. Each split makes relations smaller, so the loop ends. What may be lost is a
    #     dependency whose attributes end up in different relations.
    # PT: Enquanto alguma relação R tiver uma violação X -> Y, troca R por duas projeções:
    #     R1 = X+ (dentro de R), em que X é chave, e R2 = R menos o que X determina, mantendo X.
    #     X é a parte comum e é chave de R1, então pelo teorema de Heath cada divisão é sem
    #     perda. Cada divisão diminui as relações, então o laço termina. O que pode se perder é
    #     uma dependência cujos atributos vão parar em relações diferentes.
    # ES: Mientras alguna relación R tenga una violación X -> Y, reemplaza R por dos
    #     proyecciones: R1 = X+ (dentro de R), donde X es clave, y R2 = R menos lo que X
    #     determina, conservando X. X es la parte común y es clave de R1, así que por el teorema
    #     de Heath cada división es sin pérdida. Cada división reduce las relaciones, así que el
    #     ciclo termina. Lo que puede perderse es una dependencia cuyos atributos terminan en
    #     relaciones distintas.
    done: list[Attributes] = []
    pending = [relation]
    steps: list[BcnfStep] = []
    while pending:
        current = pending.pop()
        violation = find_bcnf_violation(current, fds)
        if violation is None:
            done.append(current)
            continue
        lhs, inside = violation
        first = inside
        second = current - (inside - lhs)
        steps.append(BcnfStep(current, lhs, inside, first, second))
        pending.extend([second, first])
    return sort_relations(done), steps


Tableau = list[dict[str, str]]


def chase(
    relation: Attributes, decomposition: list[Attributes], fds: list[FD]
) -> tuple[bool, Tableau, Tableau]:
    """EN: The chase test for a lossless join. Returns (lossless, first tableau, final tableau).

    PT: O teste chase para junção sem perda. Devolve (sem perda, tableau inicial, tableau final).

    ES: La prueba chase para un join sin pérdida. Devuelve (sin pérdida, tableau inicial,
    tableau final).
    """
    # EN: The tableau has one row per relation of the decomposition and one column per
    #     attribute. Row i holds the distinguished symbol `a` in the columns relation i keeps,
    #     and a unique symbol `b<i>` elsewhere: "this row knows the real value here, and an
    #     unknown one there". Each dependency X -> Y is then applied as a rule: two rows that
    #     agree on X must agree on Y, so their Y symbols are made equal, preferring `a`. When
    #     nothing changes any more, the join is lossless exactly when some row is all `a`: that
    #     row proves every joined tuple was already a tuple of the original relation.
    # PT: O tableau tem uma linha por relação da decomposição e uma coluna por atributo. A
    #     linha i tem o símbolo distinguido `a` nas colunas que a relação i mantém, e um símbolo
    #     único `b<i>` nas demais: "esta linha conhece o valor real aqui, e um desconhecido ali".
    #     Cada dependência X -> Y é então aplicada como regra: duas linhas iguais em X precisam
    #     ser iguais em Y, então os símbolos de Y são igualados, preferindo `a`. Quando nada
    #     mais muda, a junção é sem perda exatamente quando alguma linha é toda `a`: essa linha
    #     prova que toda tupla da junção já era tupla da relação original.
    # ES: El tableau tiene una fila por relación de la descomposición y una columna por
    #     atributo. La fila i tiene el símbolo distinguido `a` en las columnas que la relación i
    #     conserva, y un símbolo único `b<i>` en las demás: "esta fila conoce el valor real aquí,
    #     y uno desconocido allá". Cada dependencia X -> Y se aplica entonces como regla: dos
    #     filas iguales en X deben ser iguales en Y, así que sus símbolos de Y se igualan,
    #     prefiriendo `a`. Cuando ya nada cambia, el join es sin pérdida exactamente cuando
    #     alguna fila es toda `a`: esa fila prueba que toda tupla del join ya era tupla de la
    #     relación original.
    names = sorted(relation)
    rows: Tableau = [
        {name: "a" if name in part else f"b{index + 1}" for name in names}
        for index, part in enumerate(decomposition)
    ]
    initial = [dict(row) for row in rows]
    changed = True
    while changed:
        changed = False
        for fd in fds:
            for first, second in combinations(rows, 2):
                if any(first[name] != second[name] for name in fd.lhs):
                    continue
                for name in sorted(fd.rhs):
                    if first[name] == second[name]:
                        continue
                    old, new = sorted([first[name], second[name]], reverse=True)
                    # EN: Every occurrence of the replaced symbol changes, in every row: the two
                    #     symbols were just proved to be the same value.
                    # PT: Toda ocorrência do símbolo substituído muda, em todas as linhas:
                    #     acabou de ser provado que os dois símbolos são o mesmo valor.
                    # ES: Toda aparición del símbolo reemplazado cambia, en todas las filas:
                    #     acaba de probarse que los dos símbolos son el mismo valor.
                    for row in rows:
                        if row[name] == old:
                            row[name] = new
                    changed = True
    lossless = any(all(symbol == "a" for symbol in row.values()) for row in rows)
    return lossless, initial, rows


def is_lossless(relation: Attributes, decomposition: list[Attributes], fds: list[FD]) -> bool:
    return chase(relation, decomposition, fds)[0]


def lost_dependencies(decomposition: list[Attributes], fds: list[FD]) -> list[FD]:
    """EN: The dependencies that can no longer be checked inside single relations.

    PT: As dependências que não podem mais ser verificadas dentro de relações isoladas.

    ES: Las dependencias que ya no pueden verificarse dentro de relaciones individuales.
    """
    # EN: X -> Y is preserved when Y can be reached from X using only dependencies that live
    #     inside one relation at a time. Z starts as X, and each relation Ri contributes what
    #     the part of Z it can see determines inside Ri. If Y never enters Z, enforcing X -> Y
    #     would need a join.
    # PT: X -> Y é preservada quando Y pode ser alcançado a partir de X usando só dependências
    #     que vivem dentro de uma relação por vez. Z começa como X, e cada relação Ri contribui
    #     com o que a parte de Z que ela enxerga determina dentro de Ri. Se Y nunca entra em Z,
    #     garantir X -> Y exigiria uma junção.
    # ES: X -> Y se preserva cuando Y puede alcanzarse desde X usando solo dependencias que
    #     viven dentro de una relación a la vez. Z empieza como X, y cada relación Ri aporta lo
    #     que la parte de Z que ve determina dentro de Ri. Si Y nunca entra en Z, hacer cumplir
    #     X -> Y requeriría un join.
    lost: list[FD] = []
    for fd in minimal_cover(fds):
        reached = set(fd.lhs)
        changed = True
        while changed:
            changed = False
            for part in decomposition:
                gained = (closure(reached & part, fds) & part) - reached
                if gained:
                    reached |= gained
                    changed = True
        if not fd.rhs <= reached:
            lost.append(fd)
    return lost


def is_bcnf(relation: Attributes, fds: list[FD]) -> bool:
    return find_bcnf_violation(relation, fds) is None


def is_3nf(relation: Attributes, fds: list[FD]) -> bool:
    """EN: 3NF test for a projection of the original relation, using implied dependencies.

    PT: Teste de 3FN para uma projeção da relação original, usando dependências implicadas.

    ES: Prueba de 3FN para una proyección de la relación original, usando dependencias implicadas.
    """
    # EN: Keys of the projection: sets whose closure covers it, smallest first, skipping any set
    #     that contains a key already found (it would be a superkey, not a key).
    # PT: Chaves da projeção: conjuntos cujo fecho a cobre, do menor para o maior, pulando todo
    #     conjunto que contém uma chave já encontrada (seria superchave, não chave).
    # ES: Claves de la proyección: conjuntos cuyo cierre la cubre, del menor al mayor, saltando
    #     todo conjunto que contenga una clave ya encontrada (sería superclave, no clave).
    names = sorted(relation)
    keys: list[Attributes] = []
    for size in range(1, len(names) + 1):
        for subset in combinations(names, size):
            candidate = frozenset(subset)
            if any(key <= candidate for key in keys):
                continue
            if relation <= closure(candidate, fds):
                keys.append(candidate)
    prime = frozenset().union(*keys)
    for size in range(1, len(names)):
        for subset in combinations(names, size):
            lhs = frozenset(subset)
            determined = (closure(lhs, fds) & relation) - lhs
            if determined - prime and not is_superkey(lhs, relation, fds):
                return False
    return True
