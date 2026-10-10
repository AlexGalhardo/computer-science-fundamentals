# Normalisation tool (MP-DB-2)

> Versão em português: [docs/pt/databases/normalisation-tool.md](../../pt/databases/normalisation-tool.md) · Versión en español: [docs/es/databases/normalisation-tool.md](../../es/databases/normalisation-tool.md)

Code: [projects/databases/normalisation-tool](../../../projects/databases/normalisation-tool). Language: Python.

## What it teaches

Normalisation is often taught as a list of rules to memorise. This tool shows that every step is a small computation on **functional dependencies**: once the closure of a set of attributes can be computed, keys, normal forms and decompositions all follow from it.

```sh
docker compose run --rm explain
```

## 1. Functional dependency and closure

`X -> Y` holds when two rows that agree on `X` always agree on `Y`. The **closure** `X+` is everything `X` determines. The algorithm starts with `X` and keeps adding the right side of any dependency whose left side is already inside, until nothing changes.

```text
F = { A -> B, B -> C, CD -> E }

{A}+ :  {A}  --A->B-->  {A, B}  --B->C-->  {A, B, C}      (CD -> E needs D: stop)
```

Everything else in the tool is built on this one function.

## 2. Candidate keys

`X` is a superkey when `X+` is the whole relation, and a candidate key when no attribute can be removed from it. An attribute that appears on no right side can never be derived, so it belongs to every key. The tool starts from those and tries to add the others, smallest sets first, skipping any set that already contains a key.

| Schema | Dependencies | Candidate keys |
| --- | --- | --- |
| `R(A, B, C, D, E)` | `A -> B; B -> C; C, D -> E` | `{A, D}` |
| `R(A, B, C, D)` | `A, B -> C; C -> D; D -> A` | `{A, B}`, `{B, C}`, `{B, D}` |
| `R(A, B, C, D, E)` | `A -> B, C; C, D -> E; B -> D; E -> A` | `{A}`, `{E}`, `{B, C}`, `{C, D}` |
| `AULA(aluno, disciplina, professor)` | `aluno, disciplina -> professor; professor -> disciplina` | `{aluno, disciplina}`, `{aluno, professor}` |

## 3. Minimal cover

A set of dependencies usually says some things twice. The minimal (irreducible) cover says the same with nothing to spare, in three steps: one attribute on each right side, no spare attribute on a left side, no dependency implied by the others. Each test is a closure. Example: `{A -> B, C; B -> C; A -> B; A, B -> C}` becomes `{A -> B; B -> C}`.

## 4. Normal forms

An attribute is **prime** when it belongs to some candidate key. With `X -> A` a nontrivial dependency:

| Form | Requirement | What breaks it |
| --- | --- | --- |
| 2NF | no non-prime attribute depends on a proper part of a key | partial dependency |
| 3NF | `X` is a superkey, or `A` is prime | a non-prime attribute hanging from a non-key (transitive dependency) |
| BCNF | `X` is a superkey | any determinant that is not a key |

1NF is assumed, because it is about values being atomic, which dependencies cannot express. The tool reports each form as ok or violated and names the offending dependency. 4NF and 5NF need multivalued and join dependencies and are outside its scope.

## 5. Two decompositions

**3NF by synthesis.** Take the minimal cover, group the dependencies by left side and make one relation per group. If no relation contains a candidate key of the original relation, add one that is a key. The result is always lossless **and** keeps every dependency checkable inside one relation.

**BCNF by splitting.** While a relation has a determinant `X` that is not a key, split it into `X+` and the rest plus `X`. The result is always lossless, but a dependency can be lost. The classic case:

```text
AULA(aluno, disciplina, professor)
  aluno, disciplina -> professor        professor -> disciplina

BCNF:  {disciplina, professor}   {aluno, professor}
lost:  aluno, disciplina -> professor   (it now spans two relations)
```

That is the trade-off between the two forms: 3NF can always keep the dependencies, BCNF removes more redundancy.

## 6. The chase: proving a decomposition is lossless

A decomposition is lossless when joining the pieces gives back exactly the original relation, with no invented rows. The chase checks it with a small table: one row per piece, `a` where the piece has the attribute and a unique `b` where it does not.

```text
R(A, B, C) with A -> B, pieces {A, B} and {A, C}

start            A -> B: the rows agree on A, so they must agree on B
A | B  | C       A | B | C
a | a  | b1      a | a | b1
a | b2 | a       a | a | a      <- a row with only 'a': lossless
```

With the pieces `{A, B}` and `{B, C}` the rows never agree on `A`, no rule fires, no row becomes all `a`, and the decomposition is lossy. The tool prints the table before and after for every decomposition it produces.

## How it is verified

- Eight classroom schemas return their documented candidate keys and normal form.
- The chase is tested on known lossless and lossy decompositions.
- On the classroom schemas and on 300 random sets of dependencies, both decompositions pass the chase; the synthesis preserves every dependency and yields 3NF relations; the BCNF algorithm yields BCNF relations.

```sh
docker compose run --rm python-test
```

## Related quiz topics

`databases` / `functional-dependencies-and-normalisation`, `databases` / `relational-model`.

Source of the ideas: C. J. Date, *An Introduction to Database Systems*, chapters 11 (Functional Dependencies) and 12 (Further Normalization I).
