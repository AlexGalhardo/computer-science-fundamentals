# Caixeiro-viajante

> English version: [docs/en/algorithms/travelling-salesman.md](../../en/algorithms/travelling-salesman.md)

Mini-projeto: [`projects/algorithms/travelling-salesman`](../../../projects/algorithms/travelling-salesman/README.pt-BR.md) (MP-ALG-3). Linguagens: TypeScript e Rust. Quiz: área `algorithms`, tópicos `backtracking`, `dynamic-programming` e `greedy`.

## O problema

Dadas `n` cidades e a distância entre cada par, achar o passeio mais curto que visita cada cidade uma vez e volta ao início. O problema é NP-difícil: não se conhece algoritmo que sempre ache o melhor passeio em tempo polinomial. Isso o torna um bom lugar para ver três atitudes diferentes diante de um problema difícil.

| Abordagem | Ideia | Tempo | Resposta |
| --- | --- | --- | --- |
| Força bruta | tentar toda ordem | `O(n!)` | ótima |
| Held-Karp | programação dinâmica sobre subconjuntos de cidades | `O(n² · 2^n)`, memória `O(n · 2^n)` | ótima |
| Vizinho mais próximo | ir sempre à cidade não visitada mais próxima | `O(n²)` | válida, sem garantia |
| 2-opt | trocar dois trechos enquanto o passeio encurta | `O(n²)` por passada | ótimo local |

## Onde a força bruta para

Com a partida fixa existem `(n - 1)!` ordens. O crescimento não é "duas vezes mais lento por cidade", e sim "`n` vezes mais lento por cidade":

| Cidades | Ordens |
| ---: | ---: |
| 8 | 5.040 |
| 10 | 362.880 |
| 12 | 39.916.800 |
| 13 | 479.001.600 |
| 14 | 6.227.020.800 |
| 16 | 1.307.674.368.000 |

Medido no benchmark versionado (a máquina e os comandos exatos estão em [`results/results.md`](../../../projects/algorithms/travelling-salesman/results/results.md)):

| Cidades | Força bruta, TypeScript (ms) | Força bruta, Rust (ms) | Held-Karp, TypeScript (ms) | Held-Karp, Rust (ms) |
| ---: | ---: | ---: | ---: | ---: |
| 11 | 202 | 70,9 | 3,79 | 0,25 |
| 12 | 1.709 | 765 | 4,58 | 0,59 |
| 13 | mais de 12.000 (interrompida) | 7.351 | 5,69 | 1,37 |
| 14 | interrompida | mais de 12.000 (interrompida) | 9,38 | 3,10 |
| 20 | não roda | não roda | 569 | 437 |

A força bruta passa de 10 segundos com **13 cidades em TypeScript** e com **14 cidades em Rust**. De 11 para 12 cidades o tempo cresce cerca de 10 vezes nas duas linguagens, como `11! / 10! = 11` prevê. Uma linguagem de 2 a 3 vezes mais rápida compra uma cidade. O benchmark interrompe a força bruta após 12 segundos, então as linhas marcadas como "interrompida" informam o prazo, não um resultado.

## Por que o Held-Karp é tão mais rápido

A força bruta trata dois caminhos parciais como diferentes mesmo quando visitaram as mesmas cidades e pararam no mesmo lugar. Para o que vem depois, eles são equivalentes: só importam o conjunto de cidades visitadas e a última cidade. O Held-Karp guarda um número por par (conjunto, última cidade), o comprimento do melhor caminho com essa descrição, e monta conjuntos maiores a partir de menores. Os conjuntos são máscaras de bits, preenchidas em ordem numérica crescente, porque tirar uma cidade de um conjunto sempre dá uma máscara menor.

Ainda é exponencial. Para 20 cidades a tabela tem cerca de 20 milhões de entradas, e para 30 teria 16 bilhões. O limite passou do tempo para a memória.

## Do que uma heurística abre mão

O vizinho mais próximo é guloso: nunca revê uma escolha, então trechos baratos no início podem forçar trechos caros no fim. O 2-opt conserta o pior disso com busca local: remove cruzamentos até que nenhuma troca de dois trechos ajude. Nas instâncias aleatórias deste projeto (5 a 12 cidades, 64 instâncias), o vizinho mais próximo ficou em média 8% acima do ótimo e no pior caso 33%, e o 2-opt ficou em média 0,6% acima e no pior caso 5,6%, achando o ótimo em 49 de 64. Os testes exigem os fatores 1,6 e 1,2.

Esses números descrevem esta família de instâncias. No caso geral, o vizinho mais próximo não tem garantia constante, e o 2-opt para em um ótimo local que pode não ser o melhor passeio. O que as heurísticas dão em troca é escala: 100 cidades em bem menos de um milissegundo, um tamanho em que os dois métodos exatos estão fora de alcance.

## Para experimentar

- Remova o prazo e cronometre a força bruta com 13 e 14 cidades.
- Acrescente poda à força bruta (parar um ramo quando o comprimento parcial já alcança o melhor passeio) e conte quantas ordens são puladas.
- Comece o 2-opt de um passeio aleatório em vez do passeio do vizinho mais próximo e compare os resultados.
