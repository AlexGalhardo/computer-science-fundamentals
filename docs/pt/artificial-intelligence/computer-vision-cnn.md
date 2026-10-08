# Visão computacional com uma CNN

> English version: [docs/en/artificial-intelligence/computer-vision-cnn.md](../../en/artificial-intelligence/computer-vision-cnn.md)

Mini-projeto MP-AI-8, em [`projects/artificial-intelligence/computer-vision-cnn`](../../../projects/artificial-intelligence/computer-vision-cnn). Ensina como uma rede enxerga: imagens como números, convolução, pooling e filtros aprendidos. A base está na seção 16 da [página da área](README.md#16-visão-computacional). O framework é o PyTorch, apresentado na [seção 14](README.md#14-o-que-um-framework-oferece-pytorch), rodando na CPU.

## O problema

Um programa que reconhece um triângulo não pode ser escrito como uma lista de regras, porque o triângulo pode estar maior, mais fino, um pouco à esquerda ou levemente girado. Queremos uma rede que aprenda isso com exemplos. A primeira ideia, ligar cada pixel a cada neurônio, só funciona enquanto a forma fica onde estava durante o treino. Este mini-projeto mostra por quê, e o que a rede convolucional faz de diferente.

## Uma imagem é uma tabela de números

Toda imagem aqui é uma figura 20 x 20 em tons de cinza: 400 números de 0 (preto) a 1 (branco). O próprio projeto as desenha, a partir da geometria de quatro formas (círculo, quadrado, triângulo, cruz), com tamanho, espessura do traço e brilho aleatórios, uma posição que varia 1 pixel, e ruído. Nada é baixado, e a mesma semente sempre dá as mesmas imagens.

O PyTorch quer as imagens em lotes, como um tensor de quatro dimensões: imagens x canais x altura x largura. As 1200 imagens de treino são um tensor de formato `1200 x 1 x 20 x 20`. A dimensão dos canais vale 1 porque a imagem é em tons de cinza. Uma imagem colorida teria 3.

## Convolução à mão

Um filtro é uma tabela pequena de pesos. A convolução o coloca sobre um pedaço da imagem, multiplica cada peso pelo pixel embaixo dele, soma os produtos, escreve a soma, e segue adiante. `python/conv.py` faz exatamente isso com quatro laços: dois escolhem a posição e dois percorrem o filtro.

Um caso pequeno, que dá para conferir no papel. A imagem tem 6 colunas, escura à esquerda e clara à direita, e o filtro é o de Sobel para bordas verticais:

```text
uma linha da imagem         Sobel x
 0  0  0  1  1  1          -1  0  1
 (as 6 linhas são iguais)  -2  0  2
                           -1  0  1

filtro sobre as colunas 0-2:  tudo zero                           ->  0
filtro sobre as colunas 1-3:  a coluna direita vale 1: 1 + 2 + 1  ->  4
filtro sobre as colunas 2-4:  a coluna direita vale 1: 1 + 2 + 1  ->  4
filtro sobre as colunas 3-5:  esquerda -1 -2 -1, direita 1 + 2 + 1 ->  0
```

A linha de saída é `0 4 4 0`: um número grande onde o brilho muda e zero onde a imagem é lisa. Isso é um detector de bordas, e é um dos testes.

Dois detalhes que o código deixa escritos:

- **O filtro não é espelhado.** A matemática chama esta operação de correlação cruzada e reserva a palavra convolução para a versão com o filtro virado. As bibliotecas de deep learning usam a versão sem virar e a chamam de convolução. Como os pesos são aprendidos, virar não mudaria nada.
- **Tamanho da saída.** Com uma imagem de lado W, um filtro de lado F, padding P (zeros somados em cada borda) e stride S (o salto entre posições), a saída tem lado `(W - F + 2P) / S + 1`, arredondado para baixo.

A demo roda a versão escrita à mão e `torch.nn.functional.conv2d` na mesma imagem e compara as duas:

| Stride | Padding | (W - F + 2P) / S + 1 | Saída do framework | Mesmos números |
| ---: | ---: | ---: | ---: | :---: |
| 1 | 0 | 18 x 18 | 18 x 18 | sim |
| 1 | 1 | 20 x 20 | 20 x 20 | sim |
| 2 | 0 | 9 x 9 | 9 x 9 | sim |
| 2 | 1 | 10 x 10 | 10 x 10 | sim |
| 3 | 2 | 8 x 8 | 8 x 8 | sim |

| Entrada | Sobel x (bordas verticais) | Sobel y (bordas horizontais) |
| :---: | :---: | :---: |
| ![entrada](../../../projects/artificial-intelligence/computer-vision-cnn/results/edge-input.png) | ![sobel x](../../../projects/artificial-intelligence/computer-vision-cnn/results/edge-sobel-x.png) | ![sobel y](../../../projects/artificial-intelligence/computer-vision-cnn/results/edge-sobel-y.png) |

Cinza é 0, branco é "do escuro para o claro" e preto é "do claro para o escuro". O Sobel x enxerga só os lados verticais do quadrado, o Sobel y só os horizontais.

## As duas redes

**A CNN** repete convolução, ReLU e max pooling duas vezes, depois tira a média de cada mapa e decide:

```text
1 x 20 x 20  -> conv 3x3, 8 filtros  -> 8 x 20 x 20  -> max pool 2x2 -> 8 x 10 x 10
             -> conv 3x3, 24 filtros -> 24 x 10 x 10 -> max pool 2x2 -> 24 x 5 x 5
             -> média de cada mapa   -> 24 números   -> linear       -> 4 notas
```

- **Pesos compartilhados.** A primeira camada tem 8 filtros de 3 x 3 pesos mais 8 vieses: 8 x 9 + 8 = 80 parâmetros, seja qual for o tamanho da imagem. Os mesmos 9 pesos são usados nas 400 posições, então um padrão aprendido em um lugar é encontrado em todos.
- **Max pooling** guarda o maior valor de cada bloco 2 x 2. `[[1, 3], [2, 0]]` vira `3`. Ele divide cada lado por dois, não tem parâmetros, e um padrão que anda 1 pixel muitas vezes continua dentro do mesmo bloco.
- **Média global (global average pooling)** transforma cada um dos 24 mapas finais em um número, a sua média. Esse número diz quanto de um padrão existe na imagem, e não mais onde.

Parâmetros: 80 + (24 x 3 x 3 x 8 + 24) + (24 x 4 + 4) = 80 + 1752 + 100 = **1932**.

**A rede totalmente conectada (MLP)** liga os 400 pixels a 5 neurônios escondidos e estes às 4 notas: (400 x 5 + 5) + (5 x 4 + 4) = 2005 + 24 = **2029** parâmetros, 5,0% a mais que a CNN. Cada peso dela pertence a uma posição de pixel.

As duas são treinadas do mesmo jeito: 20 épocas, mini-lotes de 32 imagens cortados à mão de uma ordem embaralhada, o otimizador Adam, a perda de entropia cruzada, e os cinco passos de todo laço em PyTorch (prever, calcular a perda, `zero_grad`, `backward`, `step`).

## Resultado 1: quando a forma muda de lugar

As duas redes são treinadas em 1200 formas centradas e medidas em 800 imagens geradas com outra semente, primeiro centradas como no treino, depois com cada forma deslocada de 2 a 4 pixels em cada eixo.

| Modelo | Parâmetros | Teste, centradas | Teste, deslocadas |
| --- | ---: | ---: | ---: |
| CNN | 1932 | 99,9% | 93,3% |
| Totalmente conectada (MLP) | 2029 | 99,9% | 5,1% |

Nas imagens centradas não há diferença: com este conjunto de dados fácil, as duas são quase perfeitas. Nas deslocadas a rede totalmente conectada cai para 5,1%. Um chute ao acaso entre 4 classes acertaria 25%, então ela não está chutando: está errando de forma sistemática. O que ela aprendeu foi "estes pixels ficam claros em uma cruz", e uma forma deslocada acende pixels que significavam outra coisa.

A CNN mantém 93,3% porque os seus filtros acham os mesmos cantos e pontas de traço onde quer que estejam, e a média no fim joga a posição fora. É honesto dizer o que isto não mostra:

- A CNN não é perfeitamente invariante a deslocamento. Ela perde 6,6 pontos. Os zeros do padding na borda e a grade fixa 2 x 2 do pooling fazem uma forma deslocada produzir números um pouco diferentes.
- A convolução sozinha não basta. Durante o desenvolvimento, uma variante que achatava os 24 x 5 x 5 valores na camada linear (um peso por posição, o desenho clássico) caiu para cerca de 8% no conjunto deslocado, como a MLP. É a média global que transforma "a resposta anda junto com a forma" em "a decisão não muda". Essa variante não está no código nem nos resultados versionados.

## Resultado 2: aumento de dados

Um triângulo deslocado alguns pixels ou girado 20 graus ainda é um triângulo. O aumento de dados (data augmentation) aplica mudanças aleatórias desse tipo a cada lote de treino, então a rede nunca vê a mesma imagem duas vezes e aprende a ignorá-las. Aqui cada imagem de treino recebe um deslocamento aleatório de até 4 pixels e uma rotação aleatória de até 30 graus. As imagens de teste nunca são aumentadas. A CNN é treinada de novo a partir dos mesmos pesos iniciais, então o aumento de dados é a única diferença:

| Treino da CNN | Centradas | Deslocadas | Giradas |
| --- | ---: | ---: | ---: |
| sem aumento de dados | 99,9% | 93,3% | 62,5% |
| com aumento de dados | 97,5% | 94,9% | 84,9% |

É na rotação que ele faz diferença: uma convolução não tem nenhuma tolerância embutida a ela, e a rede treinada só com formas em pé acerta 62,5% das formas giradas de 10 a 30 graus. Com o aumento de dados ela chega a 84,9%. O ganho nas imagens deslocadas é pequeno (1,6 ponto), porque a arquitetura já lidava com deslocamentos. E há um preço: nas imagens centradas a acurácia cai de 99,9% para 97,5%. A tarefa ficou mais difícil e a rede e as 20 épocas continuaram as mesmas, como a perda mostra:

| Modelo | Época 1 | Época 5 | Época 10 | Época 15 | Época 20 |
| --- | ---: | ---: | ---: | ---: | ---: |
| CNN | 1,358 | 0,706 | 0,140 | 0,036 | 0,016 |
| Totalmente conectada (MLP) | 0,855 | 0,020 | 0,005 | 0,002 | 0,001 |
| CNN + aumento de dados | 1,372 | 1,040 | 0,584 | 0,379 | 0,296 |

![curva de perda](../../../projects/artificial-intelligence/computer-vision-cnn/results/loss-curve.svg)

A rede totalmente conectada tem a menor perda de treino de todas, e o pior resultado nas imagens deslocadas. Uma perda de treino baixa diz que a rede se ajustou às imagens que viu, não que aprendeu a ideia certa.

## O que a rede aprendeu

Ninguém deu o filtro de Sobel à CNN. Estes são os 8 filtros da primeira camada depois do treino (sem aumento de dados), cada um ampliado. Cinza é um peso 0, branco um peso positivo, preto um negativo:

![filtros](../../../projects/artificial-intelligence/computer-vision-cnn/results/filters.png)

Esta é uma imagem de teste e os 8 mapas de ativação (mapas de características) que ela produz, na mesma ordem dos filtros. Um pixel claro quer dizer "este filtro achou o seu padrão aqui":

![entrada](../../../projects/artificial-intelligence/computer-vision-cnn/results/input.png)

![mapas de ativação](../../../projects/artificial-intelligence/computer-vision-cnn/results/activation-maps.png)

O mapa com a resposta mais forte, do filtro 3:

![mapa de ativação](../../../projects/artificial-intelligence/computer-vision-cnn/results/activation-map.png)

O filtro 3 é escuro à esquerda e claro à direita, e o seu mapa acende no lado esquerdo do triângulo: ele funciona como um detector de bordas. Os filtros 6 e 8 são quase todos positivos, e os seus mapas são uma cópia borrada da forma: eles medem o brilho. Com 8 filtros minúsculos e 1200 imagens simples, os filtros são mais ruidosos que os detectores de borda limpos dos livros, que vêm de redes grandes treinadas com milhões de fotografias.

## O que um sistema de visão real acrescenta

- **Redes maiores e mais profundas.** A ResNet empilha dezenas ou centenas de camadas, que se tornam treináveis com conexões de atalho. Esta CNN tem 1932 parâmetros, uma ResNet-50 tem cerca de 25 milhões.
- **Transfer learning.** Em vez de treinar do zero, reaproveita-se uma rede já treinada com milhões de imagens, e treina-se só a última camada, ou a rede toda com uma taxa de aprendizado pequena.
- **Outras tarefas.** A detecção dá uma caixa e um rótulo para cada objeto, e a segmentação dá um rótulo para cada pixel. Aqui há um rótulo por imagem.
- **Dados reais.** Fotografias coloridas, luz variada, fundos cheios de coisas, e muitos outros aumentos de dados (espelhar, recortar, mudar as cores).
- **GPUs e carregadores de dados.** Os lotes são carregados e aumentados em paralelo, e o treino roda em GPU. Aqui tudo cabe na memória e roda na CPU em segundos.

Nada disso é implementado aqui. As peças são as mesmas: filtros que deslizam, pooling, e uma perda que o treino reduz.

## Como rodar

```sh
cd projects/artificial-intelligence/computer-vision-cnn
./setup-unix-computer-vision-cnn.sh        # ou ./setup-windows-computer-vision-cnn.ps1
docker compose run --rm python-test        # só os testes
docker compose run --rm python-demo        # treina as redes e regrava results/
```

O único requisito é o Docker. Os containers não têm acesso à rede, e as sementes, as 2 threads e os algoritmos determinísticos do PyTorch são fixos, então a demo grava os mesmos números a cada execução na mesma imagem.
