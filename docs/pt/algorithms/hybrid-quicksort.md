# Quicksort híbrido

> English version: [docs/en/algorithms/hybrid-quicksort.md](../../en/algorithms/hybrid-quicksort.md)

Mini-projeto: [`projects/algorithms/hybrid-quicksort`](../../../projects/algorithms/hybrid-quicksort/README.pt-BR.md) (MP-ALG-4). Linguagens: C++ e Rust. Quiz: área `algorithms`, tópico `quicksort`.

## Duas decisões dentro do quicksort

O quicksort particiona um trecho em torno de um pivô e ordena cada lado. A análise dele esconde duas decisões práticas, e este mini-projeto transforma cada uma em um botão.

### 1. Qual valor é o pivô

O pivô ideal é a mediana, que divide o trecho ao meio e dá `log n` níveis. O pior pivô é o mínimo ou o máximo, que tira um valor por nível e dá `n` níveis e tempo `O(n²)`.

| Estratégia | Entrada aleatória | Entrada ordenada ou invertida | Fraqueza |
| --- | --- | --- | --- |
| Primeiro elemento | `O(n log n)` | `O(n²)`: o primeiro valor é um extremo | Dados reais muitas vezes já chegam ordenados |
| Aleatório | `O(n log n)` esperado | `O(n log n)` esperado | Custo de um número aleatório por partição, e uma chance mínima de azar |
| Mediana de três | `O(n log n)` | `O(n log n)`: o valor do meio é a mediana real | Entradas montadas de propósito ainda conseguem derrotá-la |

O código sempre faz a recursão no lado menor e o laço no lado maior. Esse detalhe importa para o experimento: o caso quadrático fica lento, mas não estoura a pilha, então pode ser medido.

### 2. Quando parar a recursão

A maioria das chamadas do quicksort trata trechos minúsculos: metade da árvore de recursão está no último nível. Em um trecho de dez valores, o custo de escolher um pivô, particionar e fazer duas chamadas é maior que o trabalho em si. O insertion sort é quadrático, mas em dez valores isso significa algumas dezenas de passos simples, sem nenhuma chamada. Um quicksort híbrido entrega todo trecho de no máximo `k` valores ao insertion sort.

O limiar não muda a ordem de crescimento: há no máximo `n / k` trechos pequenos, cada um custando `O(k²)`, o que dá `O(n · k)` no total, e os níveis acima deles ainda custam `O(n log(n / k))`. Ele muda a constante, e o `k` certo só pode ser achado medindo.

## O que foi medido

Do benchmark versionado ([`results/results.md`](../../../projects/algorithms/hybrid-quicksort/results/results.md)), trecho medido em milissegundos:

| Implementação | Formato | n | C++ | Rust |
| --- | --- | ---: | ---: | ---: |
| `first-k0` | sorted | 4.000 | 3,81 | 14,9 |
| `first-k0` | sorted | 16.000 | 51,4 | 212 |
| `median3-k0` | sorted | 16.000 | 0,17 | 0,19 |
| `median3-k0` | random | 1.000.000 | 89,8 | 121 |
| `median3-k50` | random | 1.000.000 | 68,1 | 65,7 |

- Com o primeiro elemento como pivô, 4 vezes mais valores ordenados custam 13,5 vezes mais tempo em C++ e 14,2 em Rust. O crescimento quadrático prevê 16.
- A varredura do limiar sobre `k` = 0, 5, 10, 20 e 50 registrou **k = 50** como o melhor valor nas duas linguagens (`results/threshold-cpp.md` e `results/threshold-rust.md`). As diferenças entre limiares vizinhos são menores que a dispersão das execuções, então a leitura segura é que um limiar de algumas dezenas de valores ajuda.

## Como ler o dashboard

Abra `projects/algorithms/hybrid-quicksort/dashboard/index.html` direto do disco e escolha a variante `sorted`. No gráfico log-log, uma reta de inclinação 1 é crescimento linear e inclinação 2 é quadrático. `first-k0` segue a inclinação 2 e para em 16.000 valores, o limite do benchmark. Todas as outras estratégias ficam perto da inclinação 1.

## Para experimentar

- Acrescente um pivô "último elemento" e veja quais formatos o quebram.
- Passe um vetor em que todos os valores são iguais e observe as três estratégias. Depois implemente a partição em três vias.
- Varra `k` até 500 e ache o ponto em que o híbrido fica mais lento que o quicksort puro.
