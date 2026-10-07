# normalisation-tool

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A small tool that shows how **functional dependencies drive the normal forms**. Give it a relation and its dependencies and it prints, step by step, the minimal cover, the attribute closures, the candidate keys, the highest normal form with the dependency that breaks the next one, and the decompositions to 3NF and to BCNF. Every decomposition is checked with the **chase** test (lossless join) and for dependency preservation. Python, standard library only.

Full explanation: [docs/en/databases/normalisation-tool.md](../../../docs/en/databases/normalisation-tool.md).

## Quiz topics it demonstrates

- `databases` / `functional-dependencies-and-normalisation`: closure, candidate keys, minimal cover, 2NF, 3NF, BCNF, lossless decomposition and dependency preservation.
- `databases` / `relational-model`: candidate keys and superkeys.

## Run

The only requirement is Docker.

```sh
./setup-unix-normalisation-tool.sh        # Linux and macOS
./setup-windows-normalisation-tool.ps1    # Windows
```

The script builds the pinned image, runs the linter, the formatter check and the tests, and then prints the explanation of the default example.

## Demo

One command prints the reasoning for the example schema `AULA(aluno, disciplina, professor)`:

```sh
docker compose run --rm explain
```

Other uses:

```sh
docker compose run --rm explain --list                         # built-in examples
docker compose run --rm explain --example supplier --lang pt   # an example, in Portuguese
docker compose run --rm explain "R(A, B, C, D)" "A, B -> C; C -> D; D -> A"
```

A piece of the output (some lines omitted):

```
2. Candidate keys
  attributes on no right side (must be in every key): {aluno}
  {aluno, disciplina}+ = {aluno, disciplina, professor}
      aluno, disciplina -> professor  adds {professor}
      it reaches every attribute, so it is a key.
  candidate keys: {aluno, disciplina}  {aluno, professor}

3. Normal form
  2NF: ok
  3NF: ok
  BCNF: violated
      professor -> disciplina: the determinant is not a superkey.
  highest normal form: 3NF
```

## Structure

| File in `python/` | Content |
| --- | --- |
| `fd.py` | parsing, closure, candidate keys, minimal cover, projection of dependencies |
| `normal_forms.py` | 2NF, 3NF and BCNF checks, with the offending dependency |
| `decompose.py` | 3NF synthesis, BCNF decomposition, chase test, dependency preservation |
| `explain.py` | the step-by-step text, in English and Portuguese |
| `cli.py` | command line |
| `examples.py` | classroom schemas with their documented keys and normal forms |

## Tests

```sh
docker compose run --rm python-test
```

- Eight classroom schemas return the documented candidate keys and normal form.
- The chase accepts the lossless split and rejects the lossy ones of the classic `R(A, B, C)` with `A -> B`.
- For the classroom schemas and for 300 random sets of dependencies, both decompositions are lossless by the chase, the 3NF synthesis preserves every dependency and yields 3NF relations, and the BCNF algorithm yields BCNF relations.
- The command line is tested in both languages.

## Limits

The tool reasons about functional dependencies only, so it stops at BCNF: multivalued and join dependencies (4NF and 5NF) are out. The key search and the projection of dependencies try subsets of attributes, so the command line accepts at most 12 attributes.
