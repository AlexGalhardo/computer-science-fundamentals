# mutation-testing

> English version: [README.md](README.md)

Duas suítes de testes para o mesmo módulo pequeno, as duas com **100% de cobertura de linhas**. Uma não afirma quase nada, a outra afirma valores exatos. A cobertura não consegue diferenciá-las. O teste de mutação consegue: um pequeno mutador, escrito aqui em cerca de 100 linhas, planta um bug por vez no módulo e conta quantos desses bugs cada suíte percebe. A suíte fraca percebe 21%, a forte 95%.

Código: MP-TEST-3. Explicação completa: [docs/pt/testing/mutation-testing.md](../../../docs/pt/testing/mutation-testing.md).

## Tópicos do quiz que ele demonstra

- `testing` / `coverage-mutation`: cobertura de linhas como métrica e o que ela não mostra, mutantes, mortos e sobreviventes, pontuação de mutação, mutantes equivalentes, o custo de uma execução de mutação

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-mutation-testing.sh        # Linux e macOS
./setup-windows-mutation-testing.ps1    # Windows
```

O script roda os testes, o relatório de cobertura das duas suítes e a execução de mutação, e remove os contêineres no fim.

## Testes e cobertura

```sh
docker compose run --rm ts-test            # checagem de tipos + todos os testes
docker compose run --rm coverage-weak      # relatório de cobertura da suíte fraca
docker compose run --rm coverage-strong    # relatório de cobertura da suíte forte
```

Os dois comandos de cobertura falham abaixo de 100% de linhas ou de funções (`ts/bunfig.toml`). Este é o relatório da suíte **fraca**:

```
-----------------|---------|---------|-------------------
File             | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|---------|-------------------
All files        |  100.00 |  100.00 |
 src/shipping.ts |  100.00 |  100.00 |
-----------------|---------|---------|-------------------
```

## Demo: a execução de mutação

```sh
docker compose run --rm mutation
```

Ela gera 19 mutantes de `ts/src/shipping.ts`, roda cada suíte contra cada mutante (38 execuções de teste, alguns segundos) e escreve [`results/mutation-report.md`](results/mutation-report.md). O comando falha a menos que a suíte fraca pontue abaixo de 60% e a forte acima de 90%.

| Suíte | Cobertura de linhas | Mutantes | Mortos | Sobreviventes | Pontuação de mutação |
| --- | --- | --- | --- | --- | --- |
| fraca (`tests/weak`) | 100% | 19 | 4 | 15 | 21,1% |
| forte (`tests/strong`) | 100% | 19 | 18 | 1 | 94,7% |

Como ler:

- **Morto** (killed) significa que pelo menos um teste falhou no mutante: a suíte percebeu o bug. **Sobrevivente** (survived) significa que todos os testes passaram: a suíte também passaria com esse bug em produção.
- A suíte fraca confere que um preço "é um número" e "é positivo". Trocar 150 centavos por quilo por 151, ou `+` por `-`, não muda nenhuma das duas coisas, então esses mutantes vivem.
- O único sobrevivente da suíte forte (`>` para `>=` na linha 38) é um **mutante equivalente**: para um pacote de exatamente 2 kg a cobrança extra é `(2 - 2) * 150 = 0` dos dois jeitos, então nenhum teste jamais enxerga diferença. Por isso a pontuação aqui é a bruta (mortos / todos os mutantes) e por isso 100% nem sempre é alcançável.

## O mutador

Escrito para este mini-projeto, sem nenhuma dependência, porque construí-lo é a lição (`ts/src/mutator.ts`). Ele divide o código em tokens, pula comentários, strings e identificadores, e produz um mutante por operador ou número:

| Tipo | Mudanças |
| --- | --- |
| Aritmético | `+` e `-` trocados, `*` e `/` trocados |
| Relacional (limite) | `<` para `<=`, `<=` para `<`, `>` para `>=`, `>=` para `>` |
| Igualdade | `===` e `!==` trocados |
| Lógico | `&&` e `\|\|` trocados, `!` removido, `true` e `false` trocados |
| Constante | um número `n` vira `n + 1` |

É uma ferramenta didática com limites declarados: ela trabalha em tokens, não na árvore sintática, então não distingue um genérico `<T>` de uma comparação nem uma expressão regular de uma divisão. O módulo sob teste evita essas formas. Uma ferramenta de produção (Stryker, PIT, mutmut) trabalha na árvore sintática, tem muito mais operadores e roda só os testes que cobrem cada mutante.

## Estrutura

```
ts/src/shipping.ts             o módulo sob teste
ts/src/mutator.ts              tokenizador e gerador de mutantes
ts/src/run-mutation.ts         a execução de mutação e o relatório
ts/tests/weak/                 100% de cobertura de linhas, asserções fracas
ts/tests/strong/               100% de cobertura de linhas, valores exatos e limites
ts/tests/mutator/              testes do próprio mutador
results/mutation-report.md     o último relatório, uma linha por mutante
```

Dependências, fixadas: `typescript` 7.0.2 e `@types/bun` 1.4.2 para a checagem de tipos, sobre `oven/bun:1.4.2`. A cobertura vem do `bun test --coverage`.
