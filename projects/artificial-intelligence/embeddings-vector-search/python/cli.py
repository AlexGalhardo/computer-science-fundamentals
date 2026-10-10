"""EN: `python cli.py "your question"` builds the word vectors from the corpus and prints the
three passages most similar to the question, with their cosine scores.

PT: `python cli.py "sua pergunta"` constrói os vetores de palavras a partir do corpus e imprime as
três passagens mais parecidas com a pergunta, com as suas notas de cosseno.

ES: `python cli.py "tu pregunta"` construye los vectores de palabras a partir del corpus e imprime
los tres pasajes más parecidos a la pregunta, con sus puntuaciones de coseno.
"""

import json
import sys

from retrieval import Model, embed, load_model, retrieve

DEFAULT_TOP = 3


def describe(model: Model, question: str, top: int = DEFAULT_TOP) -> str:
    embedding = embed(model, question)
    lines = [
        f"question: {json.dumps(question, ensure_ascii=False)}",
        f"words used: {' '.join(embedding.known) or '(none)'}",
        # EN: A word the corpus never showed has no vector, so it cannot help the search.
        # PT: Uma palavra que o corpus nunca mostrou não tem vetor, então não ajuda na busca.
        # ES: Una palabra que el corpus nunca mostró no tiene vector, así que no ayuda en la
        #     búsqueda.
        f"not in the vocabulary: {' '.join(embedding.unknown) or '(none)'}",
        f"compared with {len(model.passages)} passages by brute force",
        "",
    ]
    if not embedding.known:
        lines.append(
            "No word of the question is in the vocabulary, so there is nothing to compare."
        )
        return "\n".join(lines)
    for position, (passage, score) in enumerate(retrieve(model, question, top), start=1):
        lines.append(f"{position}. score {score:.3f}  {passage.id}  {passage.title}")
        lines.append(f"   {passage.text}")
    return "\n".join(lines)


def main() -> None:
    question = " ".join(sys.argv[1:]).strip()
    if not question:
        print('usage: cli "your question"', file=sys.stderr)
        raise SystemExit(2)
    print(describe(load_model(), question))


if __name__ == "__main__":
    main()
