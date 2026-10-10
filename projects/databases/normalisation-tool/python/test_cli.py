import pytest

from cli import main
from examples import EXAMPLES


def test_default_command_prints_the_reasoning_for_the_example_schema(
    capsys: pytest.CaptureFixture[str],
) -> None:
    # EN: The acceptance criterion of MP-DB-2.3: one command, with no arguments, prints every
    #     step of the reasoning for an example schema.
    # PT: O critério de aceite de MP-DB-2.3: um comando, sem argumentos, imprime cada passo do
    #     raciocínio para um esquema de exemplo.
    # ES: El criterio de aceptación de MP-DB-2.3: un comando, sin argumentos, imprime cada paso del
    #     razonamiento para un esquema de ejemplo.
    assert main([]) == 0
    output = capsys.readouterr().out
    for expected in [
        "Relation AULA(aluno, disciplina, professor)",
        "1. Minimal cover",
        "2. Candidate keys",
        "{aluno, disciplina}+ = {aluno, disciplina, professor}",
        "candidate keys: {aluno, disciplina}  {aluno, professor}",
        "3NF: ok",
        "BCNF: violated",
        "professor -> disciplina: the determinant is not a superkey.",
        "highest normal form: 3NF",
        "4. Decomposition to 3NF (synthesis)",
        "5. Decomposition to BCNF",
        "split into {disciplina, professor} and {aluno, professor}",
        "the decomposition is lossless",
        "not checkable inside one relation any more: aluno, disciplina -> professor",
    ]:
        assert expected in output, expected


def test_explanation_in_portuguese(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["--example", "supplier", "--lang", "pt"]) == 0
    output = capsys.readouterr().out
    assert "chaves candidatas: {fno, pno}" in output
    assert "fno -> cidade, status é uma dependência parcial" in output
    assert "forma normal mais alta: 1FN" in output
    assert "a decomposição é sem perda" in output


def test_explanation_in_spanish(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["--example", "supplier", "--lang", "es"]) == 0
    output = capsys.readouterr().out
    assert "claves candidatas: {fno, pno}" in output
    assert "fno -> cidade, status es una dependencia parcial" in output
    assert "forma normal más alta: 1FN" in output
    assert "la descomposición es sin pérdida" in output


def test_custom_schema_from_the_command_line(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["R(A, B, C, D)", "A, B -> C; C -> D; D -> A"]) == 0
    output = capsys.readouterr().out
    assert "candidate keys: {A, B}  {B, C}  {B, D}" in output


def test_every_example_can_be_explained_in_every_language(
    capsys: pytest.CaptureFixture[str],
) -> None:
    for example in EXAMPLES:
        for lang in ("en", "pt", "es"):
            assert main(["--example", example.name, "--lang", lang]) == 0
            output = capsys.readouterr().out
            assert "LOSSY" not in output.replace("PERDA", "LOSSY").replace("PÉRDIDA", "LOSSY")


def test_list_and_errors(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["--list"]) == 0
    assert "teaching: AULA(aluno, disciplina, professor)" in capsys.readouterr().out
    assert main(["R(A, B)", "A -> Z"]) == 2
    assert "not in the schema" in capsys.readouterr().err
