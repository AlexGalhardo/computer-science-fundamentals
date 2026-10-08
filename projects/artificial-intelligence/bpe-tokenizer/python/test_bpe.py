import json

import pytest

from bpe import (
    BASE_VOCABULARY,
    DEFAULT_MERGES,
    count_pairs,
    decode,
    encode,
    merge_pair,
    most_frequent_pair,
    read_data,
    token_count_table,
    token_label,
    train,
)
from cli import describe
from demo import DEMO_SENTENCE, render_markdown

CORPUS = read_data("corpus.txt")
SAMPLE = read_data("sample.txt")
TOKENIZER = train(CORPUS, DEFAULT_MERGES)


def test_counts_overlapping_pairs() -> None:
    assert most_frequent_pair(count_pairs(list(b"aaab"))) == ((97, 97), 2)


def test_a_tie_goes_to_the_smaller_pair() -> None:
    assert most_frequent_pair(count_pairs(list(b"ab cd"))) == ((32, 99), 1)
    assert most_frequent_pair(count_pairs(list(b"cdab"))) == ((97, 98), 1)


def test_merging_skips_both_items_of_a_replaced_pair() -> None:
    assert merge_pair([97, 97, 97], 97, 97, 256) == [256, 97]


def test_the_worked_example_of_the_docs() -> None:
    small = train("banana bandana", 3)
    assert [token_label(small, merge.id) for merge in small.merges] == ["an", "ban", "ana"]
    counts = [len(encode(small, "banana bandana", limit)) for limit in range(4)]
    assert counts == [14, 10, 8, 6]


def test_each_merge_adds_exactly_one_token() -> None:
    assert len(TOKENIZER.merges) == DEFAULT_MERGES
    assert len(TOKENIZER.vocabulary) == BASE_VOCABULARY + DEFAULT_MERGES


def test_training_stops_when_no_pair_repeats() -> None:
    assert train("abcdef", 10).merges == []


# MP-AI-1.1: encode then decode returns the original text for ASCII, accented and emoji input.
@pytest.mark.parametrize(
    "text",
    [
        "The quick brown fox jumps over the lazy dog, 1234567890 times!",
        "Ação, coração, pão de queijo, à noite, über, niño, façade, crème brûlée.",
        "Tokens 🙂🚀 and a family 👨‍👩‍👧 and a flag 🇧🇷.",
        "日本語のテキスト, русский текст, ελληνικά, עברית",
        "tabs\tand\nnew lines\r\n",
        "",
    ],
    ids=["ascii", "accented", "emoji", "never-seen", "control", "empty"],
)
def test_round_trip(text: str) -> None:
    ids = encode(TOKENIZER, text)
    assert decode(TOKENIZER, ids) == text
    assert len(ids) <= len(text.encode("utf-8"))


def test_with_no_merges_every_token_is_one_byte() -> None:
    assert encode(TOKENIZER, "é🙂", 0) == [0xC3, 0xA9, 0xF0, 0x9F, 0x99, 0x82]


def test_an_unknown_id_is_an_error() -> None:
    with pytest.raises(ValueError, match="unknown token id"):
        decode(TOKENIZER, [BASE_VOCABULARY + DEFAULT_MERGES])


# MP-AI-1.2: the count falls as merges grow, and the table equals the committed one, which the
# TypeScript tests compare with too. That is what "identical in both languages" means here.
def test_the_count_falls_as_the_merges_grow() -> None:
    rows = token_count_table(TOKENIZER, CORPUS, SAMPLE)
    for before, after in zip(rows, rows[1:], strict=False):
        assert after["sampleTokens"] < before["sampleTokens"]
        assert after["corpusTokens"] < before["corpusTokens"]
    assert rows[0]["sampleTokens"] == len(SAMPLE.encode("utf-8"))
    assert rows[-1]["sampleTokens"] * 2 < len(SAMPLE.encode("utf-8"))


def test_matches_the_committed_table() -> None:
    assert token_count_table(TOKENIZER, CORPUS, SAMPLE) == json.loads(
        read_data("expected-table.json")
    )


def test_matches_the_committed_merges() -> None:
    merges = [[merge.left, merge.right, merge.count] for merge in TOKENIZER.merges]
    assert merges == json.loads(read_data("expected-merges.json"))


# MP-AI-1.3: the CLI shows the tokens of a sentence, with ids and boundaries.
def test_cli_prints_tokens_ids_and_boundaries() -> None:
    text = "the token"
    ids = encode(TOKENIZER, text)
    output = describe(TOKENIZER, text)
    assert f"tokens: {len(ids)}" in output
    assert "ids:        " + " ".join(map(str, ids)) in output
    assert "boundaries: " + "|".join(token_label(TOKENIZER, i) for i in ids) in output
    assert "decode(encode(text)) == text" in output


def test_a_partial_character_is_shown_as_bytes() -> None:
    assert token_label(TOKENIZER, 0xF0) == "<f0>"
    assert token_label(TOKENIZER, 0x41) == "A"


def test_the_report_contains_the_demo_sentence() -> None:
    assert DEMO_SENTENCE in render_markdown("Python", "python demo.py")
