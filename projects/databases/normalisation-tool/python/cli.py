"""EN: Command line of the normalisation tool.

  python cli.py                                   explains the default example
  python cli.py --example supplier --lang pt      explains a built-in example, in Portuguese
  python cli.py --list                            lists the built-in examples
  python cli.py "R(A, B, C)" "A -> B; B -> C"     explains your own schema

PT: Linha de comando da ferramenta de normalização.

  python cli.py                                   explica o exemplo padrão
  python cli.py --example supplier --lang pt      explica um exemplo embutido, em português
  python cli.py --list                            lista os exemplos embutidos
  python cli.py "R(A, B, C)" "A -> B; B -> C"     explica o seu próprio esquema
"""

import argparse
import sys

from examples import BY_NAME, EXAMPLES
from explain import explain
from fd import parse_fds, parse_schema

DEFAULT_EXAMPLE = "teaching"

# EN: The search for keys and the projection of dependencies try subsets of attributes, so the
#     work doubles with each extra attribute. The limit keeps a typo from freezing the terminal.
# PT: A busca por chaves e a projeção de dependências testam subconjuntos de atributos, então o
#     trabalho dobra a cada atributo a mais. O limite evita que um erro de digitação trave o
#     terminal.
MAX_ATTRIBUTES = 12


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cli.py",
        description="Explains closure, keys, normal form and decomposition of a schema.",
    )
    parser.add_argument("schema", nargs="?", help='for example "R(A, B, C)"')
    parser.add_argument("fds", nargs="?", default="", help='for example "A -> B; B -> C"')
    parser.add_argument("--example", choices=sorted(BY_NAME), help="a built-in example")
    parser.add_argument("--lang", choices=["en", "pt"], default="en")
    parser.add_argument("--list", action="store_true", help="list the built-in examples")
    return parser


def main(argv: list[str] | None = None) -> int:
    arguments = build_parser().parse_args(argv)
    if arguments.list:
        for example in EXAMPLES:
            note = example.note_pt if arguments.lang == "pt" else example.note_en
            print(f"{example.name}: {example.schema} | {example.fds}\n    {note}")
        return 0

    schema_text = arguments.schema
    fds_text = arguments.fds
    if schema_text is None:
        example = BY_NAME[arguments.example or DEFAULT_EXAMPLE]
        schema_text, fds_text = example.schema, example.fds
        print((example.note_pt if arguments.lang == "pt" else example.note_en) + "\n")

    try:
        name, attributes = parse_schema(schema_text)
        if len(attributes) > MAX_ATTRIBUTES:
            raise ValueError(f"at most {MAX_ATTRIBUTES} attributes are supported")
        fds = parse_fds(fds_text, attributes)
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    print(explain(name, attributes, fds, arguments.lang), end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
