# travelling-salesman

> English version: [README.md](README.md)

Quatro formas de resolver o problema do caixeiro-viajante (visitar cada cidade uma vez e voltar ao início com o passeio mais curto): força bruta sobre todas as ordens, programação dinâmica sobre subconjuntos (Held-Karp), a heurística gulosa do vizinho mais próximo e a busca local 2-opt. O projeto mostra onde a busca exaustiva deixa de ser usável, até onde um algoritmo exato melhor empurra esse muro, e do que uma heurística abre mão para responder na hora.

Item do plano: MP-ALG-3. Linguagens: TypeScript (referência) e Rust. Texto completo: [docs/pt/algorithms/travelling-salesman.md](../../../docs/pt/algorithms/travelling-salesman.md).

## O que ensina

- A força bruta testa `(n - 1)!` ordens. Cada cidade a mais multiplica o trabalho pelo número de cidades, então o muro é repentino: confortável com 11 cidades, sem esperança com 14.
- O Held-Karp reaproveita subproblemas ("quais cidades foram visitadas e onde o caminho termina") e custa `O(n² · 2^n)`: exponencial, mas 20 cidades levam um instante. O limite dele é a memória, `O(n · 2^n)`.
- Uma linguagem mais rápida desloca o muro da força bruta em cerca de uma cidade. Um algoritmo melhor desloca em dez.
- O vizinho mais próximo e o 2-opt respondem em microssegundos para tamanhos que nenhum método exato alcança, sem garantia de otimalidade.

## Tópicos do quiz que demonstra

Área `algorithms`:

- `backtracking` (força bruta sobre permutações, crescimento fatorial, poda com limite)
- `dynamic-programming` (o Held-Karp é tabulação sobre subconjuntos)
- `greedy` (o vizinho mais próximo como heurística gulosa sem garantia)

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-travelling-salesman.sh        # Linux e macOS
./setup-windows-travelling-salesman.ps1    # Windows
```

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/instance.ts` | Cidades aleatórias de uma semente fixa, matriz de distâncias inteiras, validação de passeio |
| `ts/src/brute-force.ts`, `held-karp.ts` | Os dois resolvedores exatos |
| `ts/src/heuristics.ts` | Vizinho mais próximo e 2-opt |
| `ts/src/demo.ts`, `ts/src/bench.ts` | Tabela de distância ao ótimo e entrada do benchmark |
| `rust/src/lib.rs`, `rust/src/main.rs` | Os mesmos quatro resolvedores e a entrada do benchmark em Rust |
| `bench.json`, `results/` | Grade do benchmark e resultados versionados |
| `dashboard/` | Página estática que desenha `results/results.js` |

As cidades são pontos aleatórios em uma grade de 1000 por 1000. As distâncias são euclidianas, arredondadas para inteiros, então os comprimentos dos passeios são exatos e as duas linguagens podem ser comparadas por igualdade simples.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

- Força bruta e Held-Karp devolvem um passeio do mesmo comprimento ótimo em toda instância testada de até 10 cidades (20 instâncias por tamanho até 8 cidades, 4 para 9 e 10), e cada passeio é conferido como permutação válida com aquele comprimento. A ordem de visita em si pode diferir pelo sentido ou quando dois passeios empatam.
- As heurísticas ficam dentro dos fatores documentados em 64 instâncias de 5 a 12 cidades.
- Os testes em Rust também exigem comprimentos impressos pela referência em TypeScript, o que prova que as duas linguagens montam as mesmas instâncias.

Formatadores e linters:

```sh
./lint.sh                                                    # rustfmt e clippy, na imagem base de Rust
bunx biome check projects/algorithms/travelling-salesman     # TypeScript, a partir da raiz do repositório
```

## Heurísticas contra o ótimo

```sh
docker compose run --rm demo
```

Razão entre o passeio de cada heurística e o passeio ótimo (1,000 significa ótimo), 8 instâncias aleatórias por tamanho:

| cidades | instâncias | vizinho mais próximo: média | pior | 2-opt: média | pior | 2-opt ótimo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 5 | 8 | 1,029 | 1,141 | 1,000 | 1,000 | 8 de 8 |
| 6 | 8 | 1,059 | 1,150 | 1,000 | 1,000 | 8 de 8 |
| 7 | 8 | 1,071 | 1,172 | 1,006 | 1,047 | 7 de 8 |
| 8 | 8 | 1,093 | 1,210 | 1,007 | 1,055 | 6 de 8 |
| 9 | 8 | 1,070 | 1,158 | 1,016 | 1,056 | 5 de 8 |
| 10 | 8 | 1,103 | 1,235 | 1,001 | 1,010 | 7 de 8 |
| 11 | 8 | 1,097 | 1,160 | 1,014 | 1,040 | 3 de 8 |
| 12 | 8 | 1,137 | 1,326 | 1,005 | 1,022 | 5 de 8 |
| todas | 64 | 1,082 | 1,326 | 1,006 | 1,056 | 49 de 64 |

Fatores documentados, exigidos pelos testes em instâncias de até 12 cidades: vizinho mais próximo no máximo **1,6** vez o ótimo, 2-opt (partindo do passeio do vizinho mais próximo) no máximo **1,2** vez. São limites medidos para esta família de instâncias aleatórias, não garantias teóricas: em instâncias arbitrárias o vizinho mais próximo não tem fator constante.

## Benchmark

```sh
bun run bench -- --project projects/algorithms/travelling-salesman
```

A grade roda os quatro resolvedores com 6, 8, 10, 11, 12, 13, 14, 16, 18, 20 e 100 cidades nas duas linguagens e escreve `results/`. Abra `dashboard/index.html` direto do disco para ver o gráfico.

Limites:

| Limite | Valor | Motivo |
| --- | --- | --- |
| Prazo da força bruta | 12 segundos, depois a linha informa `timeout` como checksum | 14 cidades levariam minutos e 16 cidades levariam dias |
| Tamanhos da força bruta | até 14 cidades | O tamanho depois do primeiro timeout não acrescenta nada |
| Tamanhos do Held-Karp | até 20 cidades na grade, 22 no código | A tabela tem `n · 2^n` entradas |
| Execuções | 3 execuções medidas, sem aquecimento, por linha | Mantém as linhas que batem no prazo abaixo de um minuto cada |

### Onde a força bruta passa de 10 segundos

Trecho medido em milissegundos, do `results/results.md` versionado (78 linhas, cerca de 5 minutos):

| Cidades | Força bruta, TypeScript | Força bruta, Rust | Held-Karp, TypeScript | Held-Karp, Rust |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 13,1 | 6,81 | 3,63 | 0,09 |
| 11 | 202 | 70,9 | 3,79 | 0,25 |
| 12 | 1.709 | 765 | 4,58 | 0,59 |
| 13 | **timeout (mais de 12.000)** | 7.351 | 5,69 | 1,37 |
| 14 | timeout | **timeout (mais de 12.000)** | 9,38 | 3,10 |
| 20 | não roda | não roda | 569 | 437 |

- **TypeScript: a força bruta passa de 10 segundos com 13 cidades.**
- **Rust: a força bruta passa de 10 segundos com 14 cidades** (13 cidades levam 7,4 segundos).
- O Rust é de 2 a 3 vezes mais rápido e ganha exatamente uma cidade. O Held-Karp resolve 20 cidades em cerca de meio segundo nas duas linguagens.
- As heurísticas levam menos de 2 ms para 100 cidades em TypeScript e 0,05 ms em Rust.
- Sempre que a força bruta terminou, ela imprimiu o mesmo comprimento de passeio que o Held-Karp, e as duas linguagens imprimiram os mesmos comprimentos para os quatro resolvedores.
