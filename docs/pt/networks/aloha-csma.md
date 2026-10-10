# ALOHA e CSMA/CD

> English version: [docs/en/networks/aloha-csma.md](../../en/networks/aloha-csma.md) · Versión en español: [docs/es/networks/aloha-csma.md](../../es/networks/aloha-csma.md)

Mini-projeto: [`projects/networks/aloha-csma`](../../../projects/networks/aloha-csma/README.pt-BR.md). Linguagem: Python. Tópico do quiz: `networks` / `medium-access-control`.

## O problema

Muitas estações compartilham um canal: uma frequência de rádio, um cabo. Se duas transmitem ao mesmo tempo, os dois quadros são destruídos. Não há um coordenador distribuindo a vez, então cada estação precisa decidir sozinha quando transmitir. Os três protocolos aqui são três respostas, cada uma acrescentando uma única ideia à anterior.

| Protocolo | Regra | Ideia acrescentada |
| --- | --- | --- |
| ALOHA puro | transmita sempre que tiver um quadro | nenhuma |
| slotted ALOHA | transmita só no início de um slot | um relógio comum |
| CSMA/CD | escute antes, pare assim que perceber uma colisão, espere um tempo aleatório | escuta de portadora, detecção de colisão, recuo |

## Unidades

O tempo é medido em **tempos de quadro**: um quadro leva 1 unidade. A **carga oferecida G** é o número médio de tentativas de transmissão por tempo de quadro. A **vazão S** é o número médio de quadros que passam por tempo de quadro, ou seja, a fração do canal que faz trabalho útil. S nunca passa de 1.

## ALOHA puro

Um quadro que começa no instante t ocupa o canal até t + 1. Ele é destruído por qualquer quadro que tenha começado depois de t - 1 (ainda no ar) ou que comece antes de t + 1. O **período vulnerável** é, portanto, de 2 tempos de quadro. Com tentativas de Poisson, a probabilidade de nenhum outro início em 2 tempos de quadro é e^(-2G), o que dá:

```text
S = G * e^(-2G)        máximo em G = 0,5:  S = 1/(2e) = 0,184
```

`simulate_pure_aloha` sorteia intervalos exponenciais entre inícios consecutivos e conta um quadro como bem-sucedido quando o intervalo antes dele e o intervalo depois dele são ambos de pelo menos 1.

## Slotted ALOHA

Se os quadros só podem começar no início de um slot, dois quadros ou se sobrepõem por inteiro ou não se tocam. O período vulnerável cai pela metade, para 1 tempo de quadro:

```text
S = G * e^(-G)         máximo em G = 1:  S = 1/e = 0,368
```

`simulate_slotted_aloha` sorteia o número de tentativas em cada slot e conta os slots com exatamente uma.

## CSMA/CD com recuo binário exponencial

O simulador em `csma_cd.py` modela um cabo com 50 estações. O relógio dele anda em **slots de contenção**: um slot é uma ida e volta no cabo (2τ), o tempo de que uma estação precisa para ter certeza de que o canal é dela. Um quadro dura 32 slots.

- **Escuta de portadora, 1-persistente**: uma estação com quadro transmite assim que o canal fica livre.
- **Detecção de colisão**: se duas ou mais começam no mesmo slot, elas percebem dentro desse slot e param. A colisão desperdiça 1 slot, não um quadro.
- **Recuo**: depois da n-ésima colisão do mesmo quadro, a estação espera um número aleatório de slots entre 0 e 2^min(n, 10) - 1. Depois de 16 colisões o quadro é descartado.

O número que importa é a razão entre o quadro e o slot. Um sucesso usa 32 slots de canal, uma colisão desperdiça 1. É a mesma razão pela qual a Ethernet tem tamanho mínimo de quadro e comprimento máximo de cabo: a detecção de colisão só funciona se o quadro durar mais que a ida e volta.

## Resultados

De [results/results.md](../../../projects/networks/aloha-csma/results/results.md), semente 2026:

![Vazão por carga oferecida](../../../projects/networks/aloha-csma/results/throughput.svg)

| G | ALOHA puro | teoria | slotted ALOHA | teoria | CSMA/CD |
| --- | --- | --- | --- | --- | --- |
| 0,2 | 0,1339 | 0,1341 | 0,1644 | 0,1638 | 0,2042 |
| 0,5 | 0,1833 | 0,1839 | 0,3029 | 0,3033 | 0,4998 |
| 1,0 | 0,1356 | 0,1353 | 0,3684 | 0,3679 | 0,8987 |
| 2,0 | 0,0365 | 0,0366 | 0,2708 | 0,2707 | 0,9355 |
| 5,0 | 0,0002 | 0,0002 | 0,0330 | 0,0337 | 0,9353 |

- Os picos simulados são 0,1833 em G = 0,5 e 0,3684 em G = 1,0, isto é, 0,34% abaixo e 0,15% acima da teoria.
- Depois do pico, o ALOHA piora à medida que a carga cresce. Em G = 5 o ALOHA puro não entrega quase nada: o canal está cheio de quadros e todos estão danificados.
- O CSMA/CD entrega o que é oferecido enquanto a carga é baixa e depois se estabiliza perto de 0,94. Sob sobrecarga ele também descarta quadros (a última coluna da tabela completa): o recuo mantém o canal útil, não cria capacidade.

## Reprodutibilidade

Os simuladores usam tempo simulado e um gerador aleatório semeado pela linha de comando. A mesma semente escreve o mesmo `results.json` em qualquer máquina, e por isso o arquivo versionado pode ser comparado com uma nova execução. O gráfico é desenhado apenas a partir desse arquivo.

## Limites do modelo

- O ALOHA usa o modelo clássico de população infinita, em que as tentativas (novas e repetidas) formam um processo de Poisson. Ele reproduz as fórmulas, não modela estações individuais tentando de novo.
- O CSMA/CD ignora o atraso de propagação dentro de um slot e o sinal de jam, e todos os quadros têm o mesmo tamanho.
- Sem estações ocultas: toda estação ouve todas as outras, como em um cabo. Redes sem fio precisam de CSMA/CA, que é assunto do quiz e não é simulado aqui.

## Como verificar

```sh
cd projects/networks/aloha-csma
docker compose run --rm python-test
docker compose run --rm python-demo
docker compose run --rm python-chart
```
