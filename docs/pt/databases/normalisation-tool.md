# Ferramenta de normalização (MP-DB-2)

> English version: [docs/en/databases/normalisation-tool.md](../../en/databases/normalisation-tool.md) · Versión en español: [docs/es/databases/normalisation-tool.md](../../es/databases/normalisation-tool.md)

Código: [projects/databases/normalisation-tool](../../../projects/databases/normalisation-tool). Linguagem: Python.

## O que ela ensina

A normalização costuma ser ensinada como uma lista de regras para decorar. Esta ferramenta mostra que cada passo é um pequeno cálculo sobre **dependências funcionais**: sabendo calcular o fecho de um conjunto de atributos, chaves, formas normais e decomposições saem todos dele.

```sh
docker compose run --rm explain --lang pt
```

## 1. Dependência funcional e fecho

`X -> Y` vale quando duas linhas iguais em `X` são sempre iguais em `Y`. O **fecho** `X+` é tudo o que `X` determina. O algoritmo começa com `X` e vai acrescentando o lado direito de toda dependência cujo lado esquerdo já está dentro, até nada mudar.

```text
F = { A -> B, B -> C, CD -> E }

{A}+ :  {A}  --A->B-->  {A, B}  --B->C-->  {A, B, C}      (CD -> E precisa de D: para)
```

Todo o resto da ferramenta é construído sobre essa única função.

## 2. Chaves candidatas

`X` é superchave quando `X+` é a relação inteira, e chave candidata quando nenhum atributo pode ser retirado dele. Um atributo que não aparece em nenhum lado direito nunca pode ser deduzido, então pertence a toda chave. A ferramenta parte desses e tenta acrescentar os outros, dos conjuntos menores para os maiores, pulando todo conjunto que já contém uma chave.

| Esquema | Dependências | Chaves candidatas |
| --- | --- | --- |
| `R(A, B, C, D, E)` | `A -> B; B -> C; C, D -> E` | `{A, D}` |
| `R(A, B, C, D)` | `A, B -> C; C -> D; D -> A` | `{A, B}`, `{B, C}`, `{B, D}` |
| `R(A, B, C, D, E)` | `A -> B, C; C, D -> E; B -> D; E -> A` | `{A}`, `{E}`, `{B, C}`, `{C, D}` |
| `AULA(aluno, disciplina, professor)` | `aluno, disciplina -> professor; professor -> disciplina` | `{aluno, disciplina}`, `{aluno, professor}` |

## 3. Cobertura mínima

Um conjunto de dependências costuma dizer algumas coisas duas vezes. A cobertura mínima (irredutível) diz o mesmo sem nada sobrando, em três passos: um atributo em cada lado direito, nenhum atributo sobrando no lado esquerdo, nenhuma dependência implicada pelas outras. Cada teste é um fecho. Exemplo: `{A -> B, C; B -> C; A -> B; A, B -> C}` vira `{A -> B; B -> C}`.

## 4. Formas normais

Um atributo é **primo** quando pertence a alguma chave candidata. Com `X -> A` uma dependência não trivial:

| Forma | Exigência | O que a viola |
| --- | --- | --- |
| 2FN | nenhum atributo não primo depende de uma parte própria de uma chave | dependência parcial |
| 3FN | `X` é superchave, ou `A` é primo | um atributo não primo pendurado em algo que não é chave (dependência transitiva) |
| FNBC | `X` é superchave | qualquer determinante que não seja chave |

A 1FN é pressuposta, porque trata de valores atômicos, o que dependências não conseguem expressar. A ferramenta informa cada forma como ok ou violada e nomeia a dependência culpada. A 4FN e a 5FN precisam de dependências multivaloradas e de junção e ficam fora do escopo.

## 5. Duas decomposições

**3FN por síntese.** Pega a cobertura mínima, agrupa as dependências pelo lado esquerdo e cria uma relação por grupo. Se nenhuma relação contém uma chave candidata da relação original, acrescenta uma que seja chave. O resultado é sempre sem perda **e** mantém toda dependência verificável dentro de uma única relação.

**FNBC por divisão.** Enquanto uma relação tiver um determinante `X` que não é chave, divide em `X+` e o resto mais `X`. O resultado é sempre sem perda, mas uma dependência pode se perder. O caso clássico:

```text
AULA(aluno, disciplina, professor)
  aluno, disciplina -> professor        professor -> disciplina

FNBC:    {disciplina, professor}   {aluno, professor}
perdida: aluno, disciplina -> professor   (agora ela envolve duas relações)
```

Essa é a troca entre as duas formas: a 3FN sempre consegue manter as dependências, a FNBC remove mais redundância.

## 6. O chase: provando que uma decomposição é sem perda

Uma decomposição é sem perda quando juntar os pedaços devolve exatamente a relação original, sem linhas inventadas. O chase confere isso com uma tabela pequena: uma linha por pedaço, `a` onde o pedaço tem o atributo e um `b` único onde não tem.

```text
R(A, B, C) com A -> B, pedaços {A, B} e {A, C}

início           A -> B: as linhas são iguais em A, então precisam ser iguais em B
A | B  | C       A | B | C
a | a  | b1      a | a | b1
a | b2 | a       a | a | a      <- uma linha só com 'a': sem perda
```

Com os pedaços `{A, B}` e `{B, C}` as linhas nunca são iguais em `A`, nenhuma regra dispara, nenhuma linha fica toda `a`, e a decomposição tem perda. A ferramenta imprime a tabela antes e depois para cada decomposição que produz.

## Como é verificada

- Oito esquemas de sala de aula devolvem suas chaves candidatas e forma normal documentadas.
- O chase é testado em decomposições sabidamente sem perda e com perda.
- Nos esquemas de sala de aula e em 300 conjuntos aleatórios de dependências, as duas decomposições passam no chase; a síntese preserva todas as dependências e gera relações na 3FN; o algoritmo da FNBC gera relações na FNBC.

```sh
docker compose run --rm python-test
```

## Tópicos do quiz relacionados

`databases` / `functional-dependencies-and-normalisation`, `databases` / `relational-model`.

Fonte das ideias: C. J. Date, *An Introduction to Database Systems*, capítulos 11 (Functional Dependencies) e 12 (Further Normalization I).
