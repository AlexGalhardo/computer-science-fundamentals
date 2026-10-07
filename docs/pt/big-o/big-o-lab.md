# Laboratório de Big O

> English version: [docs/en/big-o/big-o-lab.md](../../en/big-o/big-o-lab.md)

Mini-projeto MP-BIGO-1, em [`projects/big-o/big-o-lab`](../../../projects/big-o/big-o-lab). Ele ensina a medir uma função e reconhecer sua curva de crescimento.

## A ideia

A notação O descreve como o custo de um algoritmo cresce com o tamanho da entrada. O laboratório transforma essa frase em um experimento de três passos:

1. **Contar.** Cada algoritmo incrementa um contador na sua operação básica, o passo que mais se repete. Uma contagem, ao contrário de um tempo, é igual em qualquer máquina.
2. **Dobrar.** O tamanho da entrada dobra a cada execução. Como a contagem reage à duplicação é a assinatura da classe.
3. **Ajustar.** As contagens são comparadas com seis curvas candidatas, e a mais próxima dá nome à classe.

## As seis amostras

| Classe | Algoritmo | Operação contada | Fórmula fechada | Quando n dobra |
| --- | --- | --- | --- | --- |
| O(1) | ler o elemento do meio de um vetor | leituras do vetor | 1 | nada muda |
| O(log n) | busca binária por um valor ausente | cortes do intervalo ao meio | floor(log₂ n) + 1 | um passo a mais |
| O(n) | soma de todos os elementos | adições | n | a contagem dobra |
| O(n log n) | merge sort | elementos escritos na intercalação | n·ceil(log₂ n) − 2^ceil(log₂ n) + n | um pouco mais que o dobro |
| O(n²) | contar inversões comparando todos os pares | comparações | n(n − 1)/2 | cerca de quatro vezes |
| O(2ⁿ) | enumerar todos os subconjuntos | subconjuntos visitados | 2ⁿ | a contagem é elevada ao quadrado |

A fórmula do merge sort resolve T(n) = T(⌊n/2⌋) + T(⌈n/2⌉) + n com T(1) = 0, e vale n·log₂ n quando n é potência de dois. A amostra exponencial usa n = 1, 2, 4, 8, 16: mais uma duplicação significaria mais de quatro bilhões de subconjuntos, e essa é a lição sobre custos intratáveis.

## Ajuste de curvas

Para cada candidata g(n), a ferramenta encontra, por mínimos quadrados, a reta `y = a + c·g(n)` mais próxima dos pontos medidos, e informa a raiz do erro quadrático médio dividida pela média de y. Vence a candidata de menor erro relativo, e o empate fica com a curva de crescimento mais lento.

Dois pontos merecem atenção nos resultados:

- A constante `c` encontrada pelo ajuste é a constante que a notação O esconde. Na amostra quadrática ela sai como cerca de 0,4999, porque a contagem é n(n − 1)/2.
- A amostra quadrática é a única cujo melhor ajuste não é exato (erro relativo de cerca de 1,4 × 10⁻⁴). A contagem tem um termo de ordem inferior, −n/2, que uma curva n² pura não acompanha. O erro é minúsculo e o veredito não muda: termos de ordem inferior não mudam a classe.

## Contagem contra tempo

A demo também registra o tempo de cada execução (mediana de 5). O tempo segue a mesma curva só de forma aproximada: em entradas pequenas ele é dominado por ruído, pelo compilador JIT e pelo cache. Por isso a classe é decidida pelas contagens, e o tempo aparece ao lado para comparação.

## Como rodar

```sh
cd projects/big-o/big-o-lab
docker compose run --rm ts-test    # testes
docker compose run --rm ts-demo    # bun run demo: imprime as tabelas e regrava results/
```

Depois abra `dashboard/index.html` direto do disco. Os resultados versionados estão em [`results/results.md`](../../../projects/big-o/big-o-lab/results/results.md).

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-BIGO-1.1 | as contagens de operações batem com a fórmula fechada de cada amostra | `ts/tests/samples.test.ts` |
| MP-BIGO-1.2 | a ferramenta nomeia a classe certa para as seis amostras | `ts/tests/fit.test.ts` |
| MP-BIGO-1.3 | `bun run demo` imprime a tabela e o dashboard plota os resultados versionados | `docker compose run --rm ts-demo`, `dashboard/index.html` |

## Tópicos do quiz relacionados

`big-o` / `growth-of-functions`, `counting-operations` e `asymptotic-notation`.
