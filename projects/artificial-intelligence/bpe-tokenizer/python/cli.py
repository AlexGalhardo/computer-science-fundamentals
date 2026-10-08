"""EN: `python cli.py [--merges N] "a sentence"` prints the tokens of a sentence, with the id,
the bytes and the text of each one, and the boundaries.

PT: `python cli.py [--merges N] "uma frase"` imprime os tokens de uma frase, com o id, os bytes e
o texto de cada um, e as fronteiras.
"""

import argparse
import json

from bpe import DEFAULT_MERGES, Tokenizer, decode, encode, read_data, token_label, train


def describe(tokenizer: Tokenizer, text: str) -> str:
    ids = encode(tokenizer, text)
    size = len(text.encode("utf-8"))
    lines = [
        f"text:       {json.dumps(text, ensure_ascii=False)}",
        f"characters: {len(text)}   bytes: {size}   tokens: {len(ids)}",
        f"vocabulary: {len(tokenizer.vocabulary)} (256 bytes + {len(tokenizer.merges)} merges)",
        "",
        "   id  bytes                 text",
    ]
    for token_id in ids:
        piece = tokenizer.vocabulary[token_id].hex(" ")
        label = json.dumps(token_label(tokenizer, token_id), ensure_ascii=False)
        lines.append(f"{token_id:>5}  {piece:<20}  {label}")
    # EN: The boundaries line shows where the cuts fall in the sentence.
    # PT: A linha de fronteiras mostra onde os cortes caem na frase.
    pieces = [token_label(tokenizer, token_id).replace("\n", "\\n") for token_id in ids]
    lines += [
        "",
        "boundaries: " + "|".join(pieces),
        "ids:        " + " ".join(str(token_id) for token_id in ids),
        "round trip: "
        + ("decode(encode(text)) == text" if decode(tokenizer, ids) == text else "MISMATCH"),
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Show the BPE tokens of a sentence.")
    parser.add_argument("--merges", type=int, default=DEFAULT_MERGES)
    parser.add_argument("words", nargs="+")
    args = parser.parse_args()
    print(describe(train(read_data("corpus.txt"), args.merges), " ".join(args.words)))


if __name__ == "__main__":
    main()
