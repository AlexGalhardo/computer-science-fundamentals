import random

import pytest

from decompose import (
    chase,
    decompose_bcnf,
    is_3nf,
    is_bcnf,
    is_lossless,
    lost_dependencies,
    synthesise_3nf,
)
from examples import EXAMPLES, Example
from fd import FD, Attributes, fmt_fd, parse_fds, parse_schema
from normal_forms import all_violations, highest_normal_form


def load(example: Example) -> tuple[Attributes, list[FD]]:
    _, attributes = parse_schema(example.schema)
    return frozenset(attributes), parse_fds(example.fds, attributes)


def sets(*relations: str) -> list[Attributes]:
    return sorted((frozenset(relation.split()) for relation in relations), key=sorted)


@pytest.mark.parametrize("example", EXAMPLES, ids=lambda example: example.name)
def test_textbook_examples_have_the_documented_normal_form(example: Example) -> None:
    relation, fds = load(example)
    assert highest_normal_form(relation, fds) == example.normal_form


def test_violations_name_the_offending_dependency() -> None:
    relation, fds = load(next(example for example in EXAMPLES if example.name == "supplier"))
    found = all_violations(relation, fds)
    assert [fmt_fd(violation.fd) for violation in found["2NF"]] == ["fno -> cidade, status"]
    assert "cidade -> status" in [fmt_fd(violation.fd) for violation in found["3NF"]]


def test_chase_on_the_two_classic_decompositions() -> None:
    # EN: R(A, B, C) with A -> B. Splitting on A is lossless (Heath's theorem). Splitting on B is
    #     lossy, because B determines nothing and the join invents combinations.
    # PT: R(A, B, C) com A -> B. Dividir por A é sem perda (teorema de Heath). Dividir por B tem
    #     perda, porque B não determina nada e a junção inventa combinações.
    relation = frozenset("ABC")
    fds = parse_fds("A -> B")
    assert is_lossless(relation, sets("A B", "A C"), fds)
    assert not is_lossless(relation, sets("A B", "B C"), fds)
    assert not is_lossless(relation, sets("A B", "C"), fds)


def test_chase_tableau_starts_with_one_row_per_relation() -> None:
    lossless, initial, final = chase(frozenset("ABC"), sets("A B", "A C"), parse_fds("A -> B"))
    assert initial == [{"A": "a", "B": "a", "C": "b1"}, {"A": "a", "B": "b2", "C": "a"}]
    assert lossless
    assert {"A": "a", "B": "a", "C": "a"} in final


def test_chase_needs_more_than_one_pass() -> None:
    # EN: Three relations: no pair of rows is enough at first, the rule A -> B has to fire before
    #     B -> C can.
    # PT: Três relações: nenhum par de linhas basta de início, a regra A -> B precisa disparar
    #     antes que B -> C possa.
    relation = frozenset("ABCD")
    fds = parse_fds("A -> B; B -> C; C -> D")
    assert is_lossless(relation, sets("A B", "B C", "C D"), fds)
    assert not is_lossless(relation, sets("A B", "C D"), fds)


def test_teaching_example_reaches_bcnf_by_losing_a_dependency() -> None:
    relation, fds = load(next(example for example in EXAMPLES if example.name == "teaching"))
    bcnf, steps = decompose_bcnf(relation, fds)
    assert bcnf == sets("aluno professor", "disciplina professor")
    assert len(steps) == 1
    assert is_lossless(relation, bcnf, fds)
    assert [fmt_fd(fd) for fd in lost_dependencies(bcnf, fds)] == ["aluno, disciplina -> professor"]

    synthesis = synthesise_3nf(relation, fds)
    assert is_lossless(relation, synthesis.relations, fds)
    assert lost_dependencies(synthesis.relations, fds) == []


def test_supplier_example_decomposes_into_one_relation_per_fact() -> None:
    relation, fds = load(next(example for example in EXAMPLES if example.name == "supplier"))
    expected = sets("fno pno qtd", "fno cidade", "cidade status")
    assert synthesise_3nf(relation, fds).relations == expected
    assert decompose_bcnf(relation, fds)[0] == expected


def test_synthesis_adds_a_key_relation_when_none_contains_a_key() -> None:
    relation = frozenset("ABCD")
    fds = parse_fds("A -> B; C -> D")
    synthesis = synthesise_3nf(relation, fds)
    assert synthesis.added_key == frozenset("AC")
    assert synthesis.relations == sets("A B", "A C", "C D")
    assert is_lossless(relation, synthesis.relations, fds)


@pytest.mark.parametrize("example", EXAMPLES, ids=lambda example: example.name)
def test_decompositions_of_textbook_examples_are_lossless(example: Example) -> None:
    relation, fds = load(example)
    synthesis = synthesise_3nf(relation, fds)
    assert is_lossless(relation, synthesis.relations, fds)
    assert lost_dependencies(synthesis.relations, fds) == []
    assert all(is_3nf(part, fds) for part in synthesis.relations)

    bcnf, _ = decompose_bcnf(relation, fds)
    assert is_lossless(relation, bcnf, fds)
    assert all(is_bcnf(part, fds) for part in bcnf)


def random_fds(generator: random.Random, names: list[str]) -> list[FD]:
    fds = []
    for _ in range(generator.randrange(0, 6)):
        lhs = frozenset(generator.sample(names, generator.randrange(1, 3)))
        rhs = frozenset(generator.sample(names, generator.randrange(1, 3)))
        fds.append(FD(lhs, rhs))
    return fds


def test_decompositions_are_lossless_on_random_schemas() -> None:
    # EN: The acceptance criterion of MP-DB-2.2, beyond the textbook cases: for 300 random sets
    #     of dependencies the chase must confirm that both decompositions are lossless. The
    #     other promises of each algorithm are checked too: 3NF synthesis keeps every
    #     dependency and yields 3NF relations, and the BCNF algorithm yields BCNF relations.
    # PT: O critério de aceite de MP-DB-2.2, além dos casos de livro: para 300 conjuntos
    #     aleatórios de dependências o chase precisa confirmar que as duas decomposições são sem
    #     perda. As outras promessas de cada algoritmo também são conferidas: a síntese para a
    #     3FN mantém todas as dependências e gera relações na 3FN, e o algoritmo da FNBC gera
    #     relações na FNBC.
    generator = random.Random(2026)
    for _ in range(300):
        names = list("ABCDEF")[: generator.randrange(2, 7)]
        relation = frozenset(names)
        fds = random_fds(generator, names)

        synthesis = synthesise_3nf(relation, fds)
        assert frozenset().union(*synthesis.relations) == relation
        assert is_lossless(relation, synthesis.relations, fds)
        assert lost_dependencies(synthesis.relations, fds) == []
        assert all(is_3nf(part, fds) for part in synthesis.relations)

        bcnf, _ = decompose_bcnf(relation, fds)
        assert frozenset().union(*bcnf) == relation
        assert is_lossless(relation, bcnf, fds)
        assert all(is_bcnf(part, fds) for part in bcnf)
