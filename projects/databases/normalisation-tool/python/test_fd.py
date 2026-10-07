import pytest

from examples import EXAMPLES, Example
from fd import (
    FD,
    candidate_keys,
    closure,
    closure_steps,
    equivalent,
    fmt_fd,
    mandatory_attributes,
    minimal_cover,
    parse_attributes,
    parse_fds,
    parse_schema,
    project_fds,
)


def keys_of(schema: str, fds: str) -> list[str]:
    _, attributes = parse_schema(schema)
    keys = candidate_keys(frozenset(attributes), parse_fds(fds, attributes))
    return sorted(", ".join(sorted(key)) for key in keys)


def test_closure_follows_dependencies_until_nothing_changes() -> None:
    fds = parse_fds("A -> B; B -> C; C, D -> E")
    assert closure({"A"}, fds) == {"A", "B", "C"}
    assert closure({"A", "D"}, fds) == {"A", "B", "C", "D", "E"}
    assert closure({"D"}, fds) == {"D"}
    assert closure(set(), fds) == set()


def test_closure_steps_say_which_dependency_added_what() -> None:
    fds = parse_fds("B -> C; A -> B")
    steps = [(fmt_fd(fd), sorted(added)) for fd, added in closure_steps({"A"}, fds)]
    assert steps == [("A -> B", ["B"]), ("B -> C", ["C"])]


@pytest.mark.parametrize("example", EXAMPLES, ids=lambda example: example.name)
def test_textbook_examples_return_the_documented_keys(example: Example) -> None:
    # EN: The acceptance criterion of MP-DB-2.1: every classroom schema in `examples.py` must
    #     return exactly the candidate keys that the literature documents for it.
    # PT: O critério de aceite de MP-DB-2.1: todo esquema de sala de aula em `examples.py`
    #     precisa devolver exatamente as chaves candidatas que a literatura documenta para ele.
    documented = sorted(", ".join(sorted(parse_attributes(key))) for key in example.keys)
    assert keys_of(example.schema, example.fds) == documented


def test_every_key_is_a_superkey_and_irreducible() -> None:
    for example in EXAMPLES:
        _, attributes = parse_schema(example.schema)
        relation = frozenset(attributes)
        fds = parse_fds(example.fds, attributes)
        for key in candidate_keys(relation, fds):
            assert closure(key, fds) == relation
            for attribute in key:
                assert closure(key - {attribute}, fds) != relation


def test_relation_without_dependencies_is_all_key() -> None:
    assert keys_of("R(A, B, C)", "") == ["A, B, C"]


def test_mandatory_attributes_are_those_on_no_right_side() -> None:
    fds = parse_fds("A, B -> C; C -> D; D -> A")
    assert mandatory_attributes(frozenset("ABCD"), fds) == {"B"}


def test_minimal_cover_of_the_classic_example() -> None:
    # EN: Documented result: {A -> BC, B -> C, A -> B, AB -> C} reduces to {A -> B, B -> C}.
    # PT: Resultado documentado: {A -> BC, B -> C, A -> B, AB -> C} se reduz a {A -> B, B -> C}.
    fds = parse_fds("A -> B, C; B -> C; A -> B; A, B -> C")
    cover = minimal_cover(fds)
    assert [fmt_fd(fd) for fd in cover] == ["A -> B", "B -> C"]
    assert equivalent(cover, fds)


def test_minimal_cover_removes_a_transitive_shortcut() -> None:
    cover = minimal_cover(parse_fds("A -> B; B -> C; A -> C"))
    assert [fmt_fd(fd) for fd in cover] == ["A -> B", "B -> C"]


def test_minimal_cover_is_equivalent_and_irreducible_for_every_example() -> None:
    for example in EXAMPLES:
        fds = parse_fds(example.fds)
        cover = minimal_cover(fds)
        assert equivalent(cover, fds)
        for fd in cover:
            assert len(fd.rhs) == 1
            others = [other for other in cover if other != fd]
            assert not fd.rhs <= closure(fd.lhs, others)
            for attribute in fd.lhs:
                smaller = fd.lhs - {attribute}
                assert not (smaller and fd.rhs <= closure(smaller, cover))


def test_projection_finds_dependencies_that_are_not_written() -> None:
    fds = parse_fds("A -> B; B -> C")
    projected = project_fds(frozenset({"A", "C"}), fds)
    assert projected == [FD(frozenset({"A"}), frozenset({"C"}))]


def test_parser_rejects_bad_input() -> None:
    with pytest.raises(ValueError, match="schema like"):
        parse_schema("R A B")
    with pytest.raises(ValueError, match="twice"):
        parse_schema("R(A, A)")
    with pytest.raises(ValueError, match="left -> right"):
        parse_fds("A B")
    with pytest.raises(ValueError, match="not in the schema"):
        parse_fds("A -> Z", ["A", "B"])
    with pytest.raises(ValueError, match="invalid attribute"):
        parse_fds("A -> B!")
