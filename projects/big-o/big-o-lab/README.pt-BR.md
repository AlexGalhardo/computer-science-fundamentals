# big-o-lab

> English version: [README.md](README.md)

Um laboratório que ensina a **medir uma função e reconhecer sua curva de crescimento**. Seis algoritmos pequenos, um por classe (O(1), O(log n), O(n), O(n log n), O(n²) e O(2ⁿ)), contam suas próprias operações básicas enquanto o tamanho da entrada dobra. As contagens são conferidas com uma fórmula fechada, e uma etapa de ajuste de curvas nomeia a classe só a partir dos números.

Explicação completa: [docs/pt/big-o/big-o-lab.md](../../../docs/pt/big-o/big-o-lab.md).

## Tópicos do quiz que ele demonstra

- `big-o` / `growth-of-functions`: a escada de classes e o que dobrar n faz com cada uma.
- `big-o` / `counting-operations`: contar a operação básica de laços, laços aninhados e laços que dividem ao meio.
- `big-o` / `asymptotic-notation`: constantes e termos de ordem inferior não mudam a classe (n(n − 1)/2 continua quadrático).

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-big-o-lab.sh        # Linux e macOS
./setup-windows-big-o-lab.ps1    # Windows
```

O script constrói a imagem, roda os testes e roda a demo.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/samples.ts` | os seis algoritmos instrumentados e suas fórmulas fechadas |
| `ts/src/fit.ts` | ajuste por mínimos quadrados das contagens às seis curvas candidatas |
| `ts/src/lab.ts` | roda cada amostra em cada tamanho e mede o tempo |
| `ts/src/demo.ts` | a CLI: imprime as tabelas e grava `results/` |
| `dashboard/` | página estática (HTML + Tailwind CSS v4, CSS compilado versionado) |
| `results/` | resultados versionados: `results.md`, `results.json`, `results.js` |

A implementação é em TypeScript na imagem fixada `oven/bun:1.4.2`, sem dependências.

## Testes

```sh
docker compose run --rm ts-test
```

Os testes conferem que cada contagem de operações é igual à sua fórmula fechada, que os tamanhos dobram e que o ajuste nomeia a classe certa para as seis amostras.

## Demo e dashboard

```sh
docker compose run --rm ts-demo
```

Isso roda `bun run demo` no contêiner. Ele imprime uma tabela por amostra (n, operações contadas, fórmula, tempo) com o melhor ajuste e seu erro, e regrava `results/`. Depois abra `dashboard/index.html` em um navegador, direto do disco: ele plota os resultados versionados em eixos log-log.

As contagens de operações são exatas e iguais em qualquer máquina. Os tempos são a mediana de 5 execuções e dependem da máquina registrada em `results/results.md`.
