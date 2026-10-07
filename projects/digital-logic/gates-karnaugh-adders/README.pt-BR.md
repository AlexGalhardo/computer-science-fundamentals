# gates-karnaugh-adders

> English version: [README.md](README.md)

Mini-projeto MP-DL-1. Ele ensina **como uma função booleana vira um circuito**, em três passos: uma expressão é analisada e simulada com portas para gerar a sua tabela-verdade, uma tabela-verdade é minimizada pelo método de Quine-McCluskey (o mapa de Karnaugh feito em forma de tabela), e portas são ligadas para formar um meio somador, um somador completo e um somador de 8 bits com propagação de vai-um que soma de verdade.

Explicação completa: [docs/pt/digital-logic/gates-karnaugh-adders.md](../../../docs/pt/digital-logic/gates-karnaugh-adders.md).

## Tópicos do quiz que ele demonstra

- `digital-logic` / `logic-gates`: portas, tabelas-verdade, leitura de um circuito.
- `digital-logic` / `boolean-algebra`: De Morgan, absorção, consenso, mintermos e formas canônicas, tudo conferido pela comparação de tabelas-verdade.
- `digital-logic` / `karnaugh-maps`: agrupamento, implicantes primos e essenciais, condições irrelevantes, soma de produtos mínima.
- `digital-logic` / `arithmetic-circuits`: meio somador, somador completo, somador ripple-carry e o caminho do vai-um.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-gates-karnaugh-adders.sh        # Linux e macOS
./setup-windows-gates-karnaugh-adders.ps1    # Windows
```

O script constrói as duas imagens, roda todos os testes e depois as duas demos.

## Estrutura

| Caminho | O que contém |
| --- | --- |
| `ts/src/gates.ts` | NOT, AND, OR e as portas derivadas delas |
| `ts/src/expression.ts` | Parser de expressões como `A·B + C'`, avaliação do circuito, tabela-verdade |
| `ts/src/quine-mccluskey.ts` | Implicantes primos, essenciais, cobertura mínima exata, condições irrelevantes |
| `ts/src/adders.ts` | Meio somador, somador completo, somador ripple-carry de n bits |
| `python/logic.py` | Tabelas-verdade como colunas bit-paralelas, analisadas com o `ast` do próprio Python |
| `python/quine_mccluskey.py` | Segunda implementação, independente, da minimização |
| `python/adders.py` | A mesma rede de somadores, somando os 65.536 pares em uma única passada |
| `results/` | Saída das duas demos |

TypeScript é a implementação de referência: uma linha por vez, do jeito que o circuito é explicado no papel. A versão em Python existe porque a lição muda: os inteiros do Python não têm limite de tamanho, então uma coluna inteira da tabela-verdade é um único inteiro e cada porta trata todas as linhas com uma só operação (simulação bit-paralela).

### Sintaxe das expressões (TypeScript)

| Operação | Como se escreve |
| --- | --- |
| NOT | `A'` (pós-fixado), `!A` ou `~A` (prefixado) |
| AND | `A·B`, `A*B`, `A&B`, `A.B` ou apenas `AB` |
| XOR | `A ^ B` |
| OR | `A + B` ou `A \| B` |

Prioridade: NOT, depois AND, depois XOR, depois OR. Uma variável é uma letra seguida de dígitos opcionais. A versão em Python usa os operadores do Python: `~`, `&`, `^`, `|`.

## Testes

```sh
docker compose run --rm ts-test        # bun test
docker compose run --rm python-test    # ruff check, ruff format --check, pytest
```

| Critério de aceite | Teste |
| --- | --- |
| As tabelas-verdade coincidem com tabelas escritas à mão para 20 expressões | `ts/tests/expression.test.ts`, `python/test_logic.py` |
| A expressão minimizada é equivalente à original para toda entrada | `ts/tests/quine-mccluskey.test.ts` (todas as 256 funções de 3 variáveis, todas as 65.536 de 4 variáveis, aleatórias de 5 e 6, com e sem condições irrelevantes), `python/test_quine_mccluskey.py` |
| O somador de 8 bits concorda com a soma nativa para os 65.536 pares de entrada | `ts/tests/adders.test.ts`, `python/test_adders.py` |

O lint e os tipos do código TypeScript rodam a partir da raiz do repositório: `bunx biome check projects/digital-logic/gates-karnaugh-adders` e `bunx tsc --noEmit -p projects/digital-logic/gates-karnaugh-adders/ts`.

## Demo

```sh
docker compose run --rm ts-demo
docker compose run --rm python-demo
```

Cada demo imprime o seu relatório e o grava em [`results/results-ts.md`](results/results-ts.md) e [`results/results-python.md`](results/results-python.md). Uma amostra da tabela de minimização:

| Função | Soma de produtos mínima | Literais |
| --- | --- | ---: |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | `B'·D' + B·D` | 4 |
| Σm(0, 1, 2, 5, 8, 9, 10) | `A'·C'·D + B'·C' + B'·D'` | 7 |
| Σm(1, 3, 7) + d(5) | `C` | 1 |
| Σm(1, 2, 4, 7) | `A'·B'·C + A'·B·C' + A·B'·C' + A·B·C` | 12 |

Não há dependências além das imagens fixadas (`oven/bun:1.4.2` e `python:3.14.8-slim-trixie` com ruff 0.16.10 e pytest 9.1.1).
