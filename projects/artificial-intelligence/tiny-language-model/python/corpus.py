"""EN: The text the models learn from. It is generated here, with a fixed seed, by a tiny grammar.

The grammar is built so that the previous character is NOT enough to guess the next one. Every
kind of line hides a clue several characters back:

- pronoun:    "ana has a cat. she likes it."   "she" or "he" depends on the name, 15 characters back
- agreement:  "the red cats see a dog."        "see" or "sees" depends on the "s" of the subject
- arithmetic: "tom says 4+5=9."                the digit after "=" depends on both numbers
- brackets:   "([x]y){z}"                      the closing bracket must match the one left open

A model that sees one character (the bigram) cannot use those clues. A model with attention can.

PT: O texto com que os modelos aprendem. Ele é gerado aqui, com semente fixa, por uma gramática
minúscula.

A gramática foi montada para que o caractere anterior NÃO baste para adivinhar o próximo. Cada
tipo de linha esconde uma pista vários caracteres atrás:

- pronome:      "ana has a cat. she likes it."   "she" ou "he" depende do nome, 15 caracteres atrás
- concordância: "the red cats see a dog."        "see" ou "sees" depende do "s" do sujeito
- aritmética:   "tom says 4+5=9."                o dígito depois de "=" depende dos dois números
- colchetes:    "([x]y){z}"                      o fechamento precisa casar com o que ficou aberto

Um modelo que vê um caractere (o bigrama) não consegue usar essas pistas. Um com atenção consegue.

ES: El texto con el que aprenden los modelos. Se genera aquí, con semilla fija, mediante una
gramática diminuta.

La gramática se armó para que el carácter anterior NO baste para adivinar el siguiente. Cada
tipo de línea esconde una pista varios caracteres atrás:

- pronombre:     "ana has a cat. she likes it."   "she" o "he" depende del nombre, 15 atrás
- concordancia:  "the red cats see a dog."        "see" o "sees" depende de la "s" del sujeto
- aritmética:    "tom says 4+5=9."                el dígito tras "=" depende de los dos números
- corchetes:     "([x]y){z}"                      el cierre debe coincidir con lo que quedó abierto

Un modelo que ve un carácter (el bigrama) no puede usar esas pistas. Uno con atención sí.
"""

import random
import re
from dataclasses import dataclass

import numpy as np

CORPUS_SEED = 2024
NAMES_SHE = ("ana", "eva", "mia", "lia")
NAMES_HE = ("leo", "tom", "max", "ben")
NOUNS = ("hat", "cat", "dog", "pen", "cup", "map", "bag", "key")
ADJECTIVES = ("red", "big", "old", "new", "sad")
HAVE_VERBS = ("has", "finds", "gets")
KEEP_VERBS = ("likes", "wants", "keeps")
AGREEMENT_VERBS = ("see", "want", "like", "find")
BRACKET_PAIRS = ("()", "[]", "{}")
BRACKET_LETTERS = "xyz"
MAX_BRACKET_DEPTH = 3
MAX_BRACKET_LENGTH = 16
# EN: How many different lines of each kind go into the corpus. The grammar can produce more
#     than that of every kind (576 pronoun lines, 2560 agreement lines, 800 arithmetic lines),
#     so some lines are left out and the held-out part can be made of lines never trained on.
# PT: Quantas linhas diferentes de cada tipo entram no corpus. A gramática consegue produzir
#     mais do que isso de cada tipo (576 linhas de pronome, 2560 de concordância, 800 de
#     aritmética), então sobram linhas e a parte reservada pode ter só linhas nunca treinadas.
# ES: Cuántas líneas distintas de cada tipo entran en el corpus. La gramática puede producir más
#     que eso de cada tipo (576 líneas de pronombre, 2560 de concordancia, 800 de aritmética), así
#     que sobran líneas y la parte reservada puede tener solo líneas nunca entrenadas.
LINES_PER_KIND = {"pronoun": 400, "agreement": 800, "arithmetic": 500, "brackets": 700}
HELDOUT_FRACTION = 0.1

_NAMES = "|".join(NAMES_SHE + NAMES_HE)
_NOUNS = "|".join(NOUNS)
_PRONOUN_RE = re.compile(
    rf"({_NAMES}) ({'|'.join(HAVE_VERBS)}) a ({_NOUNS})\. (she|he) ({'|'.join(KEEP_VERBS)}) it\."
)
_AGREEMENT_RE = re.compile(
    rf"the ({'|'.join(ADJECTIVES)}) ({_NOUNS})(s?) ({'|'.join(AGREEMENT_VERBS)})(s?) a ({_NOUNS})\."
)
_ARITHMETIC_RE = re.compile(rf"({_NAMES}) says (\d)\+(\d)=(\d+)\.")


@dataclass(frozen=True)
class Corpus:
    train_lines: list[str]
    heldout_lines: list[str]
    # EN: Every character that appears, in sorted order. Its position is the token id.
    # PT: Todo caractere que aparece, em ordem. A posição dele é o id do token.
    # ES: Todo carácter que aparece, en orden. Su posición es el id del token.
    vocabulary: list[str]

    @property
    def train_text(self) -> str:
        return lines_to_text(self.train_lines)

    @property
    def heldout_text(self) -> str:
        return lines_to_text(self.heldout_lines)


def lines_to_text(lines: list[str]) -> str:
    # EN: The text starts with a line break too, so "line break" always means "a line starts
    #     here", and a model can be asked to write a line by giving it a single "\n".
    # PT: O texto também começa com uma quebra de linha, então "quebra de linha" sempre quer
    #     dizer "uma linha começa aqui", e dá para pedir uma linha ao modelo com um único "\n".
    # ES: El texto también empieza con un salto de línea, así que "salto de línea" siempre quiere
    #     decir "aquí empieza una línea", y se le puede pedir una línea al modelo con un solo "\n".
    return "\n" + "\n".join(lines) + "\n"


def pronoun_line(rng: random.Random) -> str:
    she = rng.random() < 0.5
    name = rng.choice(NAMES_SHE if she else NAMES_HE)
    pronoun = "she" if she else "he"
    return (
        f"{name} {rng.choice(HAVE_VERBS)} a {rng.choice(NOUNS)}. "
        f"{pronoun} {rng.choice(KEEP_VERBS)} it."
    )


def agreement_line(rng: random.Random) -> str:
    # EN: English agreement: one cat "sees", two cats "see". Exactly one of the two words
    #     carries the final "s".
    # PT: Concordância do inglês: um gato "sees", dois gatos "see". Exatamente uma das duas
    #     palavras leva o "s" final.
    # ES: Concordancia del inglés: un gato "sees", dos gatos "see". Exactamente una de las dos
    #     palabras lleva la "s" final.
    plural = rng.random() < 0.5
    subject = rng.choice(NOUNS) + ("s" if plural else "")
    verb = rng.choice(AGREEMENT_VERBS) + ("" if plural else "s")
    return f"the {rng.choice(ADJECTIVES)} {subject} {verb} a {rng.choice(NOUNS)}."


def arithmetic_line(rng: random.Random) -> str:
    left, right = rng.randrange(10), rng.randrange(10)
    return f"{rng.choice(NAMES_SHE + NAMES_HE)} says {left}+{right}={left + right}."


def _bracket_items(rng: random.Random, depth: int) -> str:
    parts: list[str] = []
    for _ in range(rng.randint(1, 3)):
        if depth < MAX_BRACKET_DEPTH and rng.random() < 0.45:
            opening, closing = rng.choice(BRACKET_PAIRS)
            parts.append(opening + _bracket_items(rng, depth + 1) + closing)
        else:
            parts.append(rng.choice(BRACKET_LETTERS))
    return "".join(parts)


def brackets_line(rng: random.Random) -> str:
    while True:
        line = _bracket_items(rng, 0)
        if len(line) <= MAX_BRACKET_LENGTH and any(char in "([{" for char in line):
            return line


GENERATORS = {
    "pronoun": pronoun_line,
    "agreement": agreement_line,
    "arithmetic": arithmetic_line,
    "brackets": brackets_line,
}


def brackets_are_balanced(line: str) -> bool:
    """EN: The classic stack check: every closing bracket must match the last one left open.

    PT: A checagem clássica com pilha: todo fechamento precisa casar com o último aberto.

    ES: La comprobación clásica con pila: todo cierre tiene que coincidir con el último abierto.
    """
    closing_of = dict(BRACKET_PAIRS)
    stack: list[str] = []
    for char in line:
        if char in closing_of:
            stack.append(closing_of[char])
        elif char in closing_of.values():
            if not stack or stack.pop() != char:
                return False
        elif char not in BRACKET_LETTERS:
            return False
    return not stack and bool(line)


def line_kind(line: str) -> str | None:
    """EN: Says which rule of the grammar a line obeys, or None when it breaks all of them.

    The demo uses it to count how many of the lines WRITTEN BY THE MODEL are correct: right
    pronoun, right agreement, right sum, matched brackets.

    PT: Diz a qual regra da gramática uma linha obedece, ou None quando ela quebra todas.

    A demo usa isto para contar quantas das linhas ESCRITAS PELO MODELO estão corretas: pronome
    certo, concordância certa, soma certa, colchetes casados.

    ES: Dice a qué regla de la gramática obedece una línea, o None cuando las rompe todas.

    La demo usa esto para contar cuántas de las líneas ESCRITAS POR EL MODELO son correctas:
    pronombre correcto, concordancia correcta, suma correcta, corchetes emparejados.
    """
    match = _PRONOUN_RE.fullmatch(line)
    if match:
        expected = "she" if match.group(1) in NAMES_SHE else "he"
        return "pronoun" if match.group(4) == expected else None
    match = _AGREEMENT_RE.fullmatch(line)
    if match:
        # EN: Exactly one "s": on the subject (plural) or on the verb (singular).
        # PT: Exatamente um "s": no sujeito (plural) ou no verbo (singular).
        # ES: Exactamente una "s": en el sujeto (plural) o en el verbo (singular).
        return "agreement" if (match.group(3) == "s") != (match.group(5) == "s") else None
    match = _ARITHMETIC_RE.fullmatch(line)
    if match:
        total = int(match.group(2)) + int(match.group(3))
        return "arithmetic" if match.group(4) == str(total) else None
    if brackets_are_balanced(line) and any(char in "([{" for char in line):
        return "brackets"
    return None


def agreement_positions(line: str) -> tuple[int, int] | None:
    """EN: For a plural "agreement" line, the index of the "s" that ends the subject and the
    index of the last letter of the verb. None for any other line.

    PT: Para uma linha de "concordância" no plural, o índice do "s" que termina o sujeito e o
    índice da última letra do verbo. None para qualquer outra linha.

    ES: Para una línea de "concordancia" en plural, el índice de la "s" que termina el sujeto y el
    índice de la última letra del verbo. None para cualquier otra línea.
    """
    match = _AGREEMENT_RE.fullmatch(line)
    if not match or match.group(3) != "s" or match.group(5) == "s":
        return None
    return match.start(3), match.end(4) - 1


def generate_corpus(seed: int = CORPUS_SEED) -> Corpus:
    """EN: Builds the corpus: unique lines, shuffled, the last 10% held out.

    Uniqueness is what makes the held-out text honest. A line is kept only the first time it is
    drawn, so the list has no repeats, and a line that falls in the held-out part cannot also be
    in the training part. Held-out lines are therefore NEW COMBINATIONS of known words: the model
    saw "ana", "cat" and "she" during training, but never that exact sentence.

    `random.Random` (not NumPy) is used because its sequence is the same on every platform.

    PT: Monta o corpus: linhas únicas, embaralhadas, os últimos 10% reservados.

    A unicidade é o que torna honesto o texto reservado. Uma linha só entra na primeira vez em
    que é sorteada, então a lista não tem repetições, e uma linha que cai na parte reservada não
    pode estar também na parte de treino. As linhas reservadas são, portanto, COMBINAÇÕES NOVAS
    de palavras conhecidas: o modelo viu "ana", "cat" e "she" no treino, mas nunca aquela frase.

    Usa-se `random.Random` (e não o NumPy) porque a sequência dele é igual em toda plataforma.

    ES: Arma el corpus: líneas únicas, barajadas, el último 10% reservado.

    La unicidad es lo que vuelve honesto el texto reservado. Una línea entra solo la primera vez
    que se sortea, así que la lista no tiene repeticiones, y una línea que cae en la parte
    reservada no puede estar también en la parte de entrenamiento. Las líneas reservadas son,
    por lo tanto, COMBINACIONES NUEVAS de palabras conocidas: el modelo vio "ana", "cat" y "she"
    en el entrenamiento, pero nunca esa frase.

    Se usa `random.Random` (y no NumPy) porque su secuencia es igual en toda plataforma.
    """
    rng = random.Random(seed)
    lines: list[str] = []
    for kind, wanted in LINES_PER_KIND.items():
        seen: set[str] = set()
        while len(seen) < wanted:
            line = GENERATORS[kind](rng)
            if line not in seen:
                seen.add(line)
                lines.append(line)
    rng.shuffle(lines)
    heldout_count = round(len(lines) * HELDOUT_FRACTION)
    train_lines, heldout_lines = lines[:-heldout_count], lines[-heldout_count:]
    vocabulary = sorted(set(lines_to_text(lines)))
    return Corpus(train_lines, heldout_lines, vocabulary)


def encode(text: str, vocabulary: list[str]) -> np.ndarray:
    """EN: Character-level tokens: one id per character. Splitting text into bigger pieces is
    the subject of another mini-project (bpe-tokenizer).

    PT: Tokens no nível do caractere: um id por caractere. Cortar o texto em pedaços maiores é
    assunto de outro mini-projeto (bpe-tokenizer).

    ES: Tokens a nivel de carácter: un id por carácter. Cortar el texto en trozos mayores es tema
    de otro miniproyecto (bpe-tokenizer).
    """
    index = {char: token_id for token_id, char in enumerate(vocabulary)}
    return np.array([index[char] for char in text], dtype=np.int64)


def decode(ids: np.ndarray | list[int], vocabulary: list[str]) -> str:
    return "".join(vocabulary[int(token_id)] for token_id in ids)
