"""EN: Classic classroom schemas with the answers that textbooks document for them.

They are used twice: the tests check that the tool returns the documented keys and normal
forms, and the CLI can explain any of them step by step.

PT: Esquemas clássicos de sala de aula com as respostas que os livros documentam para eles.

Eles são usados duas vezes: os testes conferem que a ferramenta devolve as chaves e formas
normais documentadas, e a CLI consegue explicar qualquer um deles passo a passo.

ES: Esquemas clásicos de aula con las respuestas que los libros documentan para ellos.

Se usan dos veces: las pruebas comprueban que la herramienta devuelve las claves y formas
normales documentadas, y la CLI puede explicar cualquiera de ellos paso a paso.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Example:
    name: str
    schema: str
    fds: str
    keys: list[str]
    normal_form: str
    note_en: str
    note_pt: str
    note_es: str


EXAMPLES: list[Example] = [
    Example(
        name="teaching",
        schema="AULA(aluno, disciplina, professor)",
        fds="aluno, disciplina -> professor; professor -> disciplina",
        keys=["aluno, disciplina", "aluno, professor"],
        normal_form="3NF",
        note_en="Student, subject, teacher: the classic relation that is in 3NF but not in BCNF.",
        note_pt="Aluno, disciplina, professor: a relação clássica na 3FN, mas não na FNBC.",
        note_es="Alumno, asignatura, profesor: la relación clásica en 3FN pero no en FNBC.",
    ),
    Example(
        name="supplier",
        schema="FORNECE(fno, pno, qtd, cidade, status)",
        fds="fno, pno -> qtd; fno -> cidade; cidade -> status",
        keys=["fno, pno"],
        normal_form="1NF",
        note_en="Shipments mixed with supplier data: a partial and a transitive dependency.",
        note_pt="Fornecimentos com dados do fornecedor: dependência parcial e transitiva.",
        note_es="Envíos mezclados con datos del proveedor: dependencia parcial y transitiva.",
    ),
    Example(
        name="employee",
        schema="EMP(eno, nome, dno, cidade_depto)",
        fds="eno -> nome, dno; dno -> cidade_depto",
        keys=["eno"],
        normal_form="2NF",
        note_en="A single-attribute key and a transitive dependency: 2NF but not 3NF.",
        note_pt="Chave de um único atributo e uma dependência transitiva: 2FN, mas não 3FN.",
        note_es="Una clave de un solo atributo y una dependencia transitiva: 2FN pero no 3FN.",
    ),
    Example(
        name="cycle",
        schema="R(A, B, C, D)",
        fds="A, B -> C; C -> D; D -> A",
        keys=["A, B", "B, C", "B, D"],
        normal_form="3NF",
        note_en="A cycle of dependencies gives three overlapping candidate keys.",
        note_pt="Um ciclo de dependências gera três chaves candidatas sobrepostas.",
        note_es="Un ciclo de dependencias produce tres claves candidatas que se solapan.",
    ),
    Example(
        name="four-keys",
        schema="R(A, B, C, D, E)",
        fds="A -> B, C; C, D -> E; B -> D; E -> A",
        keys=["A", "E", "B, C", "C, D"],
        normal_form="3NF",
        note_en="A well-known exercise with four candidate keys: A, E, BC and CD.",
        note_pt="Um exercício conhecido com quatro chaves candidatas: A, E, BC e CD.",
        note_es="Un ejercicio conocido con cuatro claves candidatas: A, E, BC y CD.",
    ),
    Example(
        name="chain",
        schema="R(A, B, C, D, E)",
        fds="A -> B; B -> C; C, D -> E",
        keys=["A, D"],
        normal_form="1NF",
        note_en="A and D appear on no right side, so the only key is {A, D}.",
        note_pt="A e D não aparecem em nenhum lado direito, então a única chave é {A, D}.",
        note_es="A y D no aparecen en ningún lado derecho, así que la única clave es {A, D}.",
    ),
    Example(
        name="address",
        schema="ENDERECO(cidade, rua, cep)",
        fds="cidade, rua -> cep; cep -> cidade",
        keys=["cidade, rua", "cep, rua"],
        normal_form="3NF",
        note_en="City, street, postcode: BCNF is reached only by losing a dependency.",
        note_pt="Cidade, rua, CEP: a FNBC só é alcançada perdendo uma dependência.",
        note_es="Ciudad, calle, código postal: la FNBC solo se alcanza perdiendo una dependencia.",
    ),
    Example(
        name="already-bcnf",
        schema="R(A, B, C)",
        fds="A -> B, C",
        keys=["A"],
        normal_form="BCNF",
        note_en="The only determinant is the key, so nothing has to be decomposed.",
        note_pt="O único determinante é a chave, então nada precisa ser decomposto.",
        note_es="El único determinante es la clave, así que no hay nada que descomponer.",
    ),
]

BY_NAME = {example.name: example for example in EXAMPLES}
