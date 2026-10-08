# Modelo de linguagem minúsculo

> English version: [docs/en/artificial-intelligence/tiny-language-model.md](../../en/artificial-intelligence/tiny-language-model.md)

Mini-projeto MP-AI-4, em [`projects/artificial-intelligence/tiny-language-model`](../../../projects/artificial-intelligence/tiny-language-model). Ensina como um modelo de linguagem prevê o próximo token, da contagem à autoatenção. A base está nas seções 9 e 10 da página da área: [atenção e o transformer](README.md#9-atenção-e-o-transformer) e [como um modelo de linguagem prevê e amostra](README.md#10-como-um-modelo-de-linguagem-prevê-e-amostra).

## O problema

Um modelo de linguagem faz uma coisa só: dado o texto até aqui, ele dá uma probabilidade a cada próximo token possível. Escrever texto é um laço em volta disso: pedir as probabilidades, escolher um token, anexar, pedir de novo.

Este projeto constrói dois modelos assim sobre o mesmo texto e compara os dois:

1. uma **tabela de bigramas**, feita por contagem, que olha só o token anterior;
2. um **transformer** pequeno, que olha até 32 tokens anteriores por meio da autoatenção.

Os dois são escritos com Python e NumPy. Não há PyTorch nem TensorFlow, então cada passo, inclusive o gradiente da atenção, pode ser lido no código.

Um token aqui é um caractere. Cortar o texto em tokens maiores é outro assunto, mostrado no [bpe-tokenizer](bpe-tokenizer.md).

## Um texto em que o contexto importa

Se o próximo caractere dependesse só do anterior, uma tabela bastaria e a atenção não teria nada a acrescentar. Por isso o texto é gerado por uma gramática pequena com quatro tipos de linha, cada um escondendo uma pista vários caracteres atrás:

| Tipo | Exemplo | A pista |
| --- | --- | --- |
| pronome | `ana has a cat. she likes it.` | "she" ou "he" depende do nome, 15 caracteres atrás |
| concordância | `the red cats see a dog.` | um gato "sees", dois gatos "see": o verbo depende do "s" do sujeito |
| aritmética | `tom says 4+5=9.` | o dígito depois de "=" depende dos dois números |
| colchetes | `([x]y){z}` | o fechamento precisa casar com o último que ficou aberto |

O gerador tem semente fixa e produz 2400 linhas diferentes com um vocabulário de 45 caracteres. Uma linha só entra na primeira vez em que é sorteada, então nenhuma aparece duas vezes. As linhas são embaralhadas, 2160 servem para o treino e as últimas 240 ficam **reservadas**: nenhum modelo treina com elas, e um teste confere que os dois conjuntos não têm linha em comum. As linhas reservadas são combinações novas de palavras conhecidas. O modelo viu "ana", "cat" e "she" no treino, mas nunca aquela frase exata.

Medir em texto reservado é o que separa aprender uma regra de decorar as linhas de treino.

## Passo 1: o bigrama, uma tabela de contagens

Conte quantas vezes cada caractere vem depois de cada outro, e divida cada linha da tabela pelo seu total:

```text
depois de "the":  cat 3 vezes, dog 1 vez
P(cat | the) = 3/4 = 0,75      P(dog | the) = 1/4 = 0,25
```

Cada linha agora é uma distribuição de probabilidade: os números ficam entre 0 e 1 e somam 1. Esse é o modelo inteiro. Não existe laço de treino.

Um detalhe importa. Um par que nunca apareceu no treino teria probabilidade 0, e um único par desses no texto reservado deixaria a perda infinita. Por isso soma-se 1 a cada célula antes de dividir (**suavização "soma um"**). Com três tokens possíveis o exemplo vira (3 + 1) / (4 + 3) = 0,571 para "cat", e o par nunca visto "the the" recebe 1/7 e não 0.

Para escrever texto, parte-se de um caractere, sorteia-se o próximo a partir da linha dele, e repete-se. O sorteio usa um gerador aleatório com semente, então a mesma semente sempre escreve o mesmo texto.

## Quão boa é uma previsão: entropia cruzada e perplexidade

Para cada caractere do texto, olhe a probabilidade que o modelo deu ao caractere que realmente veio e tome menos o logaritmo natural dela. A **entropia cruzada** é a média:

```text
o modelo deu 0,5, 0,25 e 1,0 aos três caracteres que realmente vieram
perda = (-ln 0,5 - ln 0,25 - ln 1,0) / 3 = (0,693 + 1,386 + 0) / 3 = 0,693
```

Dar probabilidade 1 à verdade custa 0. Ser surpreendido custa caro. A unidade é o nat, porque o logaritmo é o natural.

A **perplexidade** é exp(perda). Aqui exp(0,693) = 2: em média este modelo hesita como se tivesse de escolher entre 2 caracteres igualmente prováveis. Um modelo que não sabe nada e dá 1/45 a cada um dos 45 caracteres tem perda ln(45) = 3,807 e perplexidade 45.

## Passo 2: o transformer

```text
ids dos caracteres
   |
[ embedding do token + embedding da posição ]   um vetor de 48 números por caractere
   |
[ bloco 1: atenção -> MLP ]                     os caracteres trocam informação, depois cada um "pensa"
[ bloco 2: atenção -> MLP ]
   |
[ camada linear final + softmax ]
   |
uma probabilidade para cada um dos 45 caracteres, em cada posição
```

As peças, na ordem de `python/transformer.py`:

- **Embeddings.** Cada id de caractere escolhe uma linha de uma tabela de vetores aprendidos. A atenção sozinha vê um saco de tokens sem ordem, então soma-se um segundo vetor aprendido, escolhido pela posição. Um teste zera os vetores de posição e mostra que "1 2 3" e "2 1 3" passam a dar a mesma previsão.
- **Autoatenção.** Cada posição produz uma query ("o que eu procuro?"), uma key ("o que eu ofereço?") e um value ("o que eu repasso se for escolhido"). A nota entre duas posições é o produto escalar de uma query com uma key, dividido pela raiz quadrada do tamanho do vetor. O softmax transforma as notas de uma linha em pesos que somam 1, e a saída é a média dos values com esses pesos.
- **Máscara causal.** Uma posição não pode olhar o que vem depois dela, ou copiaria a resposta. Antes do softmax as notas das posições seguintes viram menos infinito, então o peso delas é exatamente 0.
- **Quatro cabeças.** Os 48 números são cortados em 4 fatias de 12, e cada fatia roda a sua própria atenção.
- **MLP.** Depois da atenção, cada posição passa sozinha por uma rede pequena com ReLU.
- **Conexões residuais e normalização de camada.** Cada um dos dois passos soma o seu resultado à sua entrada (x = x + f(x)) e normaliza a entrada antes. Esse arranjo "pre-norm" é o usado pelo GPT-2.

O modelo tem 62 253 números para aprender.

### Retropropagação à mão, e como saber que está certa

O treino precisa, para cada um desses números, da direção em que a perda cai: o gradiente. Um framework calcula isso sozinho. Aqui ele é escrito à mão, percorrendo a passagem direta de trás para frente com a regra da cadeia. Duas regras cobrem quase tudo:

```text
y = x @ W          ->   dW = x^T @ dy      dx = dy @ W^T
y = x + f(x)       ->   o gradiente de x é a soma dos dois caminhos
```

Gradientes escritos à mão erram com facilidade, então eles são conferidos contra um método que não precisa de cálculo. Mexa em um peso um pouquinho para cima e para baixo e veja quanto a perda se move:

```text
f(w) = w^2 em w = 3       a fórmula diz que o gradiente é 2w = 6
(f(3,001) - f(2,999)) / 0,002 = (9,006001 - 8,994001) / 0,002 = 6,000
```

O teste faz isso para cada peso de um modelo minúsculo em float64 e exige que os dois gradientes de cada grupo de parâmetros concordem com erro relativo abaixo de 0,000001.

### Adam e mini-lotes

Cada passo de treino sorteia 32 janelas aleatórias de 32 caracteres. O alvo de cada posição é simplesmente o caractere seguinte, então não é preciso rótulo nenhum. A perda é medida, retropropagada, e o otimizador **Adam** mexe em cada peso. O Adam guarda duas médias móveis por peso, do gradiente e do quadrado dele, e anda a primeira dividida pela raiz quadrada da segunda: todo peso recebe um passo de tamanho parecido, qualquer que seja a escala do seu gradiente. O treino leva 1000 passos, cerca de meio minuto em um núcleo de CPU.

## Resultados

Todos os números abaixo vêm da demo e estão versionados em [`results/results.md`](../../../projects/artificial-intelligence/tiny-language-model/results/results.md).

| Modelo | Contexto que enxerga | Perda no treino | Perda no texto reservado | Perplexidade no texto reservado |
| --- | --- | ---: | ---: | ---: |
| Chute uniforme, ln(45) | nada |  | 3,807 | 45,00 |
| Bigrama (contagem) | 1 caractere | 1,730 | 1,741 | 5,70 |
| Transformer | até 32 caracteres | 0,640 | 0,662 | 1,94 |

![Curva de perda](../../../projects/artificial-intelligence/tiny-language-model/results/loss-curve.svg)

Três coisas para ler:

1. Enxergar um caractere leva a perplexidade de 45 para 5,7. Enxergar o contexto leva para 1,94: em média o transformer hesita entre dois caracteres, o bigrama entre quase seis.
2. O transformer ultrapassa o bigrama nos primeiros 100 passos e depois melhora devagar.
3. A perda dele no treino (0,640) e no texto reservado (0,662) ficam próximas, então ele aprendeu regras e não decorou linhas.

A perda não tem como chegar a 0. O substantivo de uma frase ou os números de uma soma são sorteados pelo gerador, e ninguém consegue prever isso.

### O que o contexto compra

A probabilidade que cada modelo dá ao caractere que a gramática exige (`_` é um espaço):

| Contexto | Próximo certo | Próximo errado | Bigrama: P(certo) | Bigrama: P(errado) | Transformer: P(certo) | Transformer: P(errado) |
| --- | :---: | :---: | ---: | ---: | ---: | ---: |
| `ana_has_a_cat._` | `s` | `h` | 0,141 | 0,077 | 0,982 | 0,011 |
| `leo_has_a_cat._` | `h` | `s` | 0,077 | 0,141 | 0,980 | 0,014 |
| `the_old_dogs_see` | `_` | `s` | 0,395 | 0,099 | 0,999 | 0,000 |
| `the_old_dog_see` | `s` | `_` | 0,099 | 0,395 | 0,998 | 0,001 |
| `tom_says_4+5=` | `9` | `1` | 0,091 | 0,417 | 0,433 | 0,410 |
| `tom_says_7+8=1` | `5` | `.` | 0,051 | 0,110 | 0,350 | 0,000 |
| `{[x]` | `}` | `]` | 0,065 | 0,100 | 0,210 | 0,005 |
| `[{x}` | `]` | `}` | 0,113 | 0,099 | 0,327 | 0,009 |

Nas duas primeiras linhas o bigrama dá exatamente os mesmos números para "ana" e para "leo": tudo o que ele enxerga é o espaço. O transformer lê o nome. Depois de `{[x]` ele dá 0,210 para `}` e só 0,005 para `]`. O resto da probabilidade vai para continuar com uma letra ou abrir outro colchete, o que a gramática também permite.

As somas são o ponto fraco, dito com honestidade: depois de `4+5=` o modelo dá 0,433 para "9" e 0,410 para "1". Ele aprendeu que ali vem um dígito e está só na metade do caminho para aprender a tabuada da soma em 1000 passos. Uma perda média esconde esse tipo de detalhe, e sondas como estas mostram.

### A atenção de uma cabeça

![Mapa de atenção](../../../projects/artificial-intelligence/tiny-language-model/results/attention.svg)

Cada linha é uma posição que pergunta, cada coluna uma posição que ela olha, na linha reservada `the sad cups see a hat.`. O triângulo cinza é a máscara causal: nenhuma posição olha para a direita. A linha contornada é o último "e" de "see", onde o modelo precisa decidir se vem um "s". A única pista é o "s" de "cups". Esta cabeça, no bloco 2, põe 0,98 do peso dessa linha nesse único caractere. Ninguém programou isso. Saiu do treino.

## Amostragem: como o próximo caractere é escolhido

O modelo treinado é fixo. O que muda o estilo da saída é como um caractere é escolhido a partir das probabilidades.

| Método | O que faz |
| --- | --- |
| Guloso | pega sempre o caractere mais provável |
| Temperatura T | divide as notas por T antes do softmax |
| Top-k | mantém os k caracteres mais prováveis e renormaliza |
| Top-p (núcleo) | mantém o menor conjunto de caracteres mais prováveis cujas probabilidades chegam a p, incluindo o que cruza p, e renormaliza |

A variedade é medida com a **entropia** da distribuição, em bits: 0 quando um caractere tem toda a probabilidade, 1 para uma moeda justa, log2(3) = 1,585 para três caracteres igualmente prováveis. Para as notas (2, 1, 0):

```text
T = 0,5   (0,867, 0,117, 0,016)   entropia 0,636 bits     mais afiado
T = 1,0   (0,665, 0,245, 0,090)   entropia 1,201 bits     o modelo como foi treinado
T = 2,0   (0,506, 0,307, 0,186)   entropia 1,472 bits     mais achatado
```

E para top-k e top-p sobre as probabilidades (0,5, 0,3, 0,15, 0,05), entropia de 1,648 bits:

```text
top-k 2     mantém 0,5 e 0,3                     -> (0,625, 0,375)   0,954 bits
top-p 0,7   0,5 não basta, 0,5 + 0,3 = 0,8
            cruza 0,7, então os dois ficam       -> (0,625, 0,375)   0,954 bits
```

A demo escreve 100 linhas com cada configuração, sempre com a mesma semente, e mede a entropia média das distribuições das quais os caracteres foram realmente sorteados:

| Configuração | Entropia média (bits) | Linhas distintas em 100 | Linhas gramaticais em 100 | Primeira linha escrita |
| --- | ---: | ---: | ---: | --- |
| guloso | 0,000 | 1 | 100 | `the new cat sees a cup.` |
| temperatura 0,2 | 0,304 | 66 | 100 | `the old cups see a cup.` |
| temperatura 0,5 | 0,520 | 97 | 95 | `the old bags see a cat.` |
| temperatura 1,0 | 0,856 | 99 | 73 | `ana says 5+8=14.` |
| temperatura 1,5 | 1,464 | 100 | 38 | `[9=1ups find a k map.` |
| temperatura 1,0, top-k 3 | 0,380 | 86 | 85 | `leo says 4+9=14.` |
| temperatura 1,0, top-p 0,9 | 0,751 | 99 | 87 | `[[x[y]{zx}x]}x` |
| temperatura 1,5, top-k 3 | 0,464 | 92 | 72 | `leo says 4+9=14.` |
| temperatura 1,5, top-p 0,9 | 1,039 | 99 | 67 | `[[x(y){z(yzyy)}]` |

- **Temperatura menor, menos variedade.** A entropia cai de 1,464 para 0,856, 0,520 e 0,304 bits, e o número de linhas diferentes de 100 para 66. O guloso é o fim da estrada: 0 bits, e a mesma linha 100 vezes.
- **Menos variedade, menos erros.** Uma linha é gramatical quando obedece a uma das quatro regras. Com temperatura 0,2 todas as 100 obedecem, com 1,5 só 38. Uma temperatura alta dá chance real aos caracteres improváveis, e um caractere errado quebra uma linha.
- **Top-k e top-p cortam a cauda.** Com temperatura 1,5 eles levam as linhas gramaticais de 38 de volta para 72 e 67 e ainda escrevem mais de 90 linhas diferentes. É por isso que sistemas reais combinam uma temperatura com um deles.

Para comparar, a tabela de bigramas escreve linhas como `likeog w cu2+8=6it.`. Nenhuma das suas 100 linhas é gramatical.

## O que um sistema real acrescenta

- **Tamanho.** Bilhões de parâmetros, dezenas de blocos, contextos de milhares de tokens e texto de treino medido em terabytes, em GPUs. O algoritmo é o mostrado aqui.
- **Tokens de subpalavra** no lugar de caracteres, como no [bpe-tokenizer](bpe-tokenizer.md).
- **Diferenciação automática.** Ninguém escreve a passagem reversa à mão: um framework a deriva da passagem direta.
- **Cache de chaves e valores.** Esta demo roda a janela inteira de novo a cada caractere. Sistemas reais guardam as keys e os values já calculados.
- **Truques de treino**: dropout, decaimento de pesos, aquecimento da taxa de aprendizado, corte de gradiente, GELU no lugar da ReLU.
- **Ajuste fino** em conversas e instruções, que transforma um previsor de próximo token em um assistente.

## Como rodar

```sh
cd projects/artificial-intelligence/tiny-language-model
./setup-unix-tiny-language-model.sh        # ou ./setup-windows-tiny-language-model.ps1
docker compose run --rm python-demo        # treina os dois modelos e regrava results/
```
