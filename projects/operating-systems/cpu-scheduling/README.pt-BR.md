# cpu-scheduling

> English version: [README.md](README.md)

Um simulador de escalonamento de CPU. Ele executa o mesmo conjunto de processos em cinco políticas (FCFS, job mais curto primeiro, round-robin, prioridade e múltiplas filas com realimentação), desenha o gráfico de Gantt de cada uma e compara os tempos médios de espera, de retorno e de resposta. Ele ensina que nenhuma política ganha em todas as métricas: o que é melhor para a média é injusto com alguém, e o que responde rápido termina tarde.

Explicação completa: [docs/pt/operating-systems/cpu-scheduling.md](../../../docs/pt/operating-systems/cpu-scheduling.md).

## Tópicos do quiz que ele demonstra

- `operating-systems` / `scheduling`: FCFS, SJF, round-robin e o quantum, prioridade e inanição, múltiplas filas com realimentação, tempos de espera, de retorno e de resposta.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-cpu-scheduling.sh        # Linux e macOS
./setup-windows-cpu-scheduling.ps1    # Windows
```

O script constrói as imagens, roda os testes das duas linguagens e roda a demo.

## Demo

```sh
docker compose run --rm demo
```

Ela imprime o gráfico de Gantt de um exemplo com cinco processos em cada política e a tabela de comparação em três cargas geradas, e grava `results/results.md`, `results/results.json` e `results/results.js`. Depois abra `dashboard/index.html` direto do disco: a página desenha os mesmos gráficos de Gantt e as tabelas, sem servidor e sem rede.

```
RR(q=4)
|     A     |     B     |     C     |     D     |     A     |  E  |     C     |D |C |
0           4           8           12          16          20    22          26 27 28
average waiting 13.00, turnaround 18.60, response 6.40
```

`docker compose run --rm python-demo` imprime o mesmo texto a partir da implementação em Python.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/scheduler.ts` | o motor e as cinco políticas (implementação de referência) |
| `ts/src/gantt.ts` | o gráfico de Gantt em texto |
| `ts/src/workload.ts` | gerador de cargas reproduzível |
| `ts/src/report.ts`, `ts/src/cli.ts` | demo, tabelas e arquivos de resultado |
| `python/scheduler.py`, `python/cli.py` | o mesmo simulador em Python |
| `dashboard/` | página estática (HTML, Tailwind CSS v4 compilado, sem CDN) |
| `results/` | tabelas versionadas |

Cada pasta de linguagem tem seu próprio Dockerfile em uma imagem fixada (`oven/bun:1.4.2`, `python:3.14.8-slim-trixie`) e nenhuma dependência além das ferramentas de teste e lint.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

Os testes conferem os exemplos de livro documentados na página de docs, a saída do Gantt, e que toda política dá a cada processo exatamente o seu tempo de CPU, sem sobreposição.

## Resultados

A tabela versionada é [results/results.md](results/results.md). A simulação usa unidades de tempo abstratas e um gerador com semente, então os números são os mesmos em qualquer máquina.
