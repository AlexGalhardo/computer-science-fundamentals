# master-theorem

> English version: [README.md](README.md)

Um teorema mestre interativo. Ele ensina **como os três casos do teorema mestre decidem o custo de uma recorrência** `T(n) = a·T(n/b) + f(n)`: um classificador devolve o caso e a solução, uma função recursiva gerada confere a previsão contando chamadas reais, e uma página estática desenha a árvore de recursão para o `a`, o `b` e a `f(n)` que você escolher.

Explicação completa: [docs/pt/big-o/master-theorem.md](../../../docs/pt/big-o/master-theorem.md).

## Tópicos do quiz que ele demonstra

- `big-o` / `recurrences-master-theorem`: escrever a recorrência de um algoritmo de divisão e conquista, os três casos, a árvore de recursão e as recorrências que o teorema não cobre.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-master-theorem.sh        # Linux e macOS
./setup-windows-master-theorem.ps1    # Windows
```

O script constrói a imagem, roda os testes e roda a demo.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/classify.ts` | o classificador: caso, solução e um aviso quando o teorema não se aplica |
| `ts/src/tree.ts` | a árvore de recursão, nível a nível |
| `ts/src/empirical.ts` | uma função recursiva gerada que conta suas chamadas e seu trabalho |
| `ts/src/cli.ts` | `bun run classify <a> <b> <d> [k]` |
| `ts/src/demo.ts` | `bun run demo`: recorrências conhecidas, conferência empírica, `results/` |
| `dashboard/` | página estática (HTML + Tailwind CSS v4, CSS compilado versionado) |
| `results/` | resultados versionados: `results.md`, `results.json`, `results.js` |

TypeScript na imagem fixada `oven/bun:1.4.2`. A única dependência é o `zod` 4.6.5, que valida a entrada da linha de comando contra as hipóteses do teorema (`a ≥ 1`, `b > 1`).

## Testes

```sh
docker compose run --rm ts-test
```

Os testes cobrem uma recorrência por caso e recorrências que não se encaixam, e conferem que o crescimento medido concorda com a classe prevista para merge sort, busca binária e uma divisão em 7.

## Demo, linha de comando e página

```sh
docker compose run --rm ts-demo                              # todas as recorrências conhecidas e a conferência empírica
docker compose run --rm ts-demo bun run classify 7 2 2       # uma recorrência: T(n) = 7T(n/2) + n^2
docker compose run --rm ts-demo bun run classify 2 2 1 1     # T(n) = 2T(n/2) + n log n: não se aplica
```

Os argumentos são `a`, `b`, `d` e um `k` opcional, para `f(n) = n^d · (log n)^k`. O comando imprime o caso, o motivo em inglês e português, a solução e a árvore de recursão para um `n` pequeno.

Depois abra `dashboard/index.html` em um navegador, direto do disco. Escolha `a`, `b` e `f(n)`: a página mostra o caso e desenha a árvore com uma barra por nível, para você ver se quem paga a conta são as folhas, todos os níveis ou a raiz.
