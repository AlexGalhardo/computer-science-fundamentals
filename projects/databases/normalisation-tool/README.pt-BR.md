# normalisation-tool

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Uma ferramenta pequena que mostra como as **dependências funcionais conduzem as formas normais**. Informe uma relação e suas dependências e ela imprime, passo a passo, a cobertura mínima, os fechos de atributos, as chaves candidatas, a forma normal mais alta com a dependência que viola a seguinte, e as decomposições para a 3FN e para a FNBC. Toda decomposição é conferida com o teste **chase** (junção sem perda) e quanto à preservação de dependências. Python, só com a biblioteca padrão.

Explicação completa: [docs/pt/databases/normalisation-tool.md](../../../docs/pt/databases/normalisation-tool.md).

## Tópicos do quiz que ela demonstra

- `databases` / `functional-dependencies-and-normalisation`: fecho, chaves candidatas, cobertura mínima, 2FN, 3FN, FNBC, decomposição sem perda e preservação de dependências.
- `databases` / `relational-model`: chaves candidatas e superchaves.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-normalisation-tool.sh        # Linux e macOS
./setup-windows-normalisation-tool.ps1    # Windows
```

O script constrói a imagem fixada, roda o linter, a checagem do formatador e os testes, e depois imprime a explicação do exemplo padrão.

## Demo

Um comando imprime o raciocínio para o esquema de exemplo `AULA(aluno, disciplina, professor)`:

```sh
docker compose run --rm explain --lang pt
```

Outros usos:

```sh
docker compose run --rm explain --list --lang pt               # exemplos embutidos
docker compose run --rm explain --example supplier --lang pt   # um exemplo, em português (`--lang` aceita `en`, `pt` ou `es`)
docker compose run --rm explain --lang pt "R(A, B, C, D)" "A, B -> C; C -> D; D -> A"
```

Um trecho da saída (algumas linhas omitidas):

```text
2. Chaves candidatas
  atributos em nenhum lado direito (estão em toda chave): {aluno}
  {aluno, disciplina}+ = {aluno, disciplina, professor}
      aluno, disciplina -> professor  acrescenta {professor}
      alcança todos os atributos, então é chave.
  chaves candidatas: {aluno, disciplina}  {aluno, professor}

3. Forma normal
  2FN: ok
  3FN: ok
  FNBC: violada
      professor -> disciplina: o determinante não é superchave.
  forma normal mais alta: 3FN
```

## Estrutura

| Arquivo em `python/` | Conteúdo |
| --- | --- |
| `fd.py` | leitura, fecho, chaves candidatas, cobertura mínima, projeção de dependências |
| `normal_forms.py` | verificações de 2FN, 3FN e FNBC, com a dependência que viola |
| `decompose.py` | síntese para a 3FN, decomposição para a FNBC, teste chase, preservação de dependências |
| `explain.py` | o texto passo a passo, em inglês, português e espanhol |
| `cli.py` | linha de comando |
| `examples.py` | esquemas de sala de aula com suas chaves e formas normais documentadas |

## Testes

```sh
docker compose run --rm python-test
```

- Oito esquemas de sala de aula devolvem as chaves candidatas e a forma normal documentadas.
- O chase aceita a divisão sem perda e rejeita as divisões com perda do clássico `R(A, B, C)` com `A -> B`.
- Para os esquemas de sala de aula e para 300 conjuntos aleatórios de dependências, as duas decomposições são sem perda pelo chase, a síntese para a 3FN preserva todas as dependências e gera relações na 3FN, e o algoritmo da FNBC gera relações na FNBC.
- A linha de comando é testada nas três línguas.

## Limites

A ferramenta raciocina só com dependências funcionais, então para na FNBC: dependências multivaloradas e de junção (4FN e 5FN) ficam de fora. A busca por chaves e a projeção de dependências testam subconjuntos de atributos, então a linha de comando aceita no máximo 12 atributos.
