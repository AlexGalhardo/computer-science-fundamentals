import pytest

from corpus import (
    LINES_PER_KIND,
    agreement_positions,
    brackets_are_balanced,
    decode,
    encode,
    generate_corpus,
    line_kind,
)

CORPUS = generate_corpus()


def test_the_corpus_is_the_same_on_every_run() -> None:
    again = generate_corpus()
    assert again.train_lines == CORPUS.train_lines
    assert again.heldout_lines == CORPUS.heldout_lines
    assert generate_corpus(seed=1).train_lines != CORPUS.train_lines


# MP-AI-4.2: "held-out" means text the models never trained on.
def test_no_heldout_line_is_a_training_line() -> None:
    lines = CORPUS.train_lines + CORPUS.heldout_lines
    assert len(lines) == len(set(lines)) == sum(LINES_PER_KIND.values())
    assert not set(CORPUS.train_lines) & set(CORPUS.heldout_lines)
    assert len(CORPUS.heldout_lines) == 240


def test_every_line_obeys_its_rule_and_every_kind_is_held_out() -> None:
    kinds = [line_kind(line) for line in CORPUS.train_lines + CORPUS.heldout_lines]
    assert None not in kinds
    assert {kind: kinds.count(kind) for kind in LINES_PER_KIND} == LINES_PER_KIND
    assert {line_kind(line) for line in CORPUS.heldout_lines} == set(LINES_PER_KIND)


@pytest.mark.parametrize(
    ("line", "kind"),
    [
        ("ana has a cat. she likes it.", "pronoun"),
        ("ana has a cat. he likes it.", None),
        ("leo gets a pen. he keeps it.", "pronoun"),
        ("the red cats see a dog.", "agreement"),
        ("the red cat sees a dog.", "agreement"),
        ("the red cats sees a dog.", None),
        ("the red cat see a dog.", None),
        ("tom says 7+8=15.", "arithmetic"),
        ("tom says 7+8=16.", None),
        ("([x]y){z}", "brackets"),
        ("([x)]", None),
        ("(x", None),
        ("xyz", None),
        ("", None),
    ],
)
def test_line_kind_accepts_only_grammatical_lines(line: str, kind: str | None) -> None:
    assert line_kind(line) == kind


def test_bracket_matching_uses_a_stack() -> None:
    assert brackets_are_balanced("{[()]}x")
    assert not brackets_are_balanced("{[(])}")
    assert not brackets_are_balanced("x)")


def test_agreement_positions_point_at_the_clue_and_at_the_verb() -> None:
    line = "the sad cups see a hat."
    assert agreement_positions(line) == (11, 15)
    assert (line[11], line[15]) == ("s", "e")
    assert agreement_positions("the sad cup sees a hat.") is None
    assert agreement_positions("([x])") is None


def test_the_vocabulary_is_a_few_dozen_characters() -> None:
    assert 30 <= len(CORPUS.vocabulary) <= 60
    assert CORPUS.vocabulary == sorted(set(CORPUS.vocabulary))
    assert "\n" in CORPUS.vocabulary


def test_encode_and_decode_are_inverse() -> None:
    text = CORPUS.heldout_text
    ids = encode(text, CORPUS.vocabulary)
    assert len(ids) == len(text)
    assert decode(ids, CORPUS.vocabulary) == text
    assert text.startswith("\n") and text.endswith("\n")
