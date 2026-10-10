# Inteligência artificial e LLMs

> English version: [docs/en/artificial-intelligence/README.md](../../en/artificial-intelligence/README.md) · Versión en español: [docs/es/artificial-intelligence/README.md](../../es/artificial-intelligence/README.md)

Esta página explica, para quem está começando, as ideias por trás da IA moderna: como um programa aprende a partir de dados, o que são tokens e vetores, como um modelo de linguagem escreve texto e como um modelo de imagem desenha. Ela segue a ordem dos tópicos do quiz da área (QC-AI), e cada seção aponta para o mini-projeto que mostra a ideia funcionando. Todos os números abaixo são pequenos o bastante para conferir à mão.

As fontes usadas para escrever esta área estão listadas, com links, em [references.md](references.md).

| Seção | Tópico do quiz | Mini-projeto |
| --- | --- | --- |
| [1. IA, aprendizado de máquina e aprendizado profundo](#1-ia-aprendizado-de-máquina-e-aprendizado-profundo) | `ai-ml-foundations` | |
| [2. Probabilidade e estatística](#2-probabilidade-e-estatística) | `probability-statistics` | [tiny-language-model](tiny-language-model.md) |
| [3. Vetores e matrizes](#3-vetores-e-matrizes) | `linear-algebra` | [embeddings-vector-search](embeddings-vector-search.md) |
| [4. Aprendizado supervisionado e perda](#4-aprendizado-supervisionado-e-perda) | `supervised-learning` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [5. Neurônios, camadas e funções de ativação](#5-neurônios-camadas-e-funções-de-ativação) | `neural-networks` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [6. Descida do gradiente e retropropagação](#6-descida-do-gradiente-e-retropropagação) | `training` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [7. Tokens e tokenização](#7-tokens-e-tokenização) | `tokenization` | [bpe-tokenizer](bpe-tokenizer.md) |
| [8. Embeddings e similaridade](#8-embeddings-e-similaridade) | `embeddings` | [embeddings-vector-search](embeddings-vector-search.md) |
| [9. Atenção e o transformer](#9-atenção-e-o-transformer) | `attention-transformer` | [tiny-language-model](tiny-language-model.md) |
| [10. Como um modelo de linguagem prevê e amostra](#10-como-um-modelo-de-linguagem-prevê-e-amostra) | `language-models` | [tiny-language-model](tiny-language-model.md) |
| [11. Uso de LLMs](#11-uso-de-llms) | `using-llms` | [embeddings-vector-search](embeddings-vector-search.md) |
| [12. Geração de imagens](#12-geração-de-imagens) | `image-generation` | [diffusion-toy](diffusion-toy.md) |
| [13. Limites, viés, segurança e custo](#13-limites-viés-segurança-e-custo) | `limits-safety-cost` | |
| [14. O que um framework oferece: PyTorch](#14-o-que-um-framework-oferece-pytorch) | `pytorch` | [pytorch-basics](pytorch-basics.md) |
| [15. TensorFlow e Keras](#15-tensorflow-e-keras) | `tensorflow-keras` | [tensorflow-keras-basics](tensorflow-keras-basics.md) |
| [16. Visão computacional](#16-visão-computacional) | `computer-vision` | [computer-vision-cnn](computer-vision-cnn.md) |

## A ideia inteira em um parágrafo

Um modelo é uma **função com números ajustáveis** (os parâmetros, ou pesos). O treinamento mostra muitos exemplos à função, mede com um único número (a perda) o quanto as saídas estão erradas, e empurra cada parâmetro na direção que diminui a perda. Repita isso milhões de vezes e a função se torna útil. Um modelo de linguagem é uma função dessas cuja entrada é uma sequência de tokens e cuja saída é uma probabilidade para cada próximo token possível. Um modelo de imagem é uma função dessas cuja entrada é uma figura com ruído e cuja saída é um palpite sobre o ruído. Todo o resto desta página é detalhe sobre essas três frases.

## 1. IA, aprendizado de máquina e aprendizado profundo

Os três termos são encaixados, como caixas dentro de caixas:

```text
+----------------------------------------------------------------+
| Inteligência artificial: programas que fazem tarefas que       |
| associamos à inteligência (jogar, traduzir, reconhecer)        |
|  +----------------------------------------------------------+  |
|  | Aprendizado de máquina: o comportamento é aprendido a    |  |
|  | partir de dados, em vez de escrito regra por regra       |  |
|  |  +----------------------------------------------------+  |  |
|  |  | Aprendizado profundo: quem aprende é uma rede      |  |  |
|  |  | neural de muitas camadas, que também aprende as    |  |  |
|  |  | próprias características                           |  |  |
|  |  +----------------------------------------------------+  |  |
|  +----------------------------------------------------------+  |
+----------------------------------------------------------------+
```

Na programação clássica uma pessoa escreve as regras: `se o e-mail contém "prêmio" então é spam`. No aprendizado de máquina (machine learning) uma pessoa fornece exemplos (e-mails já marcados como spam ou não) e um algoritmo de aprendizado encontra as regras. O aprendizado profundo (deep learning) dá mais um passo. Os métodos antigos precisavam que uma pessoa escolhesse as características (quantidade de letras maiúsculas, número de links). Uma rede profunda recebe a entrada crua e aprende características úteis nas próprias camadas. É a isso que "profundo" se refere: várias camadas de representação aprendida, não profundidade de compreensão.

**Tipos de aprendizado**, pelo sinal que quem aprende recebe:

| Tipo | Os dados | Exemplo |
| --- | --- | --- |
| Supervisionado | entradas com a resposta certa (rótulo) | fotos rotuladas "gato" ou "cachorro" |
| Não supervisionado | só entradas, o objetivo é achar estrutura | agrupar clientes por comportamento |
| Autossupervisionado | só entradas, mas o rótulo é recortado da própria entrada | esconder a próxima palavra de uma frase e pedir que o modelo a preveja |
| Por reforço | ações e recompensas vindas de um ambiente | um programa que aprende um jogo jogando |

O aprendizado autossupervisionado é o motivo de os modelos de linguagem terem conseguido crescer tanto: qualquer texto é o próprio gabarito, então ninguém precisa rotular bilhões de frases à mão.

Palavras usadas o tempo todo:

- **Parâmetros** (pesos): os números que o treinamento ajusta. **Hiperparâmetros**: os números que uma pessoa escolhe antes do treinamento (taxa de aprendizado, número de camadas).
- **Treinamento**: ajustar os parâmetros. **Inferência**: usar o modelo pronto, com os parâmetros congelados.
- **Generalização**: ir bem em exemplos que o modelo nunca viu. É o objetivo real. Ir bem só nos exemplos de treino é memorização.
- Modelos **discriminativos** respondem a uma pergunta sobre uma entrada ("isto é spam?"). Modelos **generativos** produzem dados novos parecidos com os dados de treino (texto, imagens).

## 2. Probabilidade e estatística

Um modelo que escreve texto não "sabe" a próxima palavra. Ele dá uma **probabilidade** a cada candidata. Por isso a linguagem da IA é a linguagem da probabilidade.

Uma **distribuição de probabilidade** lista os resultados possíveis e o quanto cada um é provável. Os números ficam entre 0 e 1 e somam 1. Em um dado honesto cada uma das seis faces tem 1/6.

A **esperança** (média) é o resultado médio no longo prazo, cada valor pesado pela sua probabilidade. Para o dado: (1 + 2 + 3 + 4 + 5 + 6) / 6 = 3,5. A **variância** mede o quanto os resultados se espalham em torno dessa média, e o **desvio padrão** é a sua raiz quadrada, na mesma unidade dos dados.

A **distribuição normal (gaussiana)** é a curva em forma de sino. Ela é descrita por uma média e um desvio padrão, e cerca de 68% dos valores caem a até um desvio padrão da média, cerca de 95% a até dois. Nesta área ela aparece como o ruído que os modelos de difusão somam às imagens, e como os números aleatórios que inicializam os pesos de uma rede.

A **probabilidade condicional**, escrita P(A | B), é a probabilidade de A quando já sabemos B. Um modelo de linguagem é uma máquina de probabilidades condicionais: P(próximo token | os tokens até aqui). A **regra da cadeia** as multiplica para obter a probabilidade de uma frase inteira:

```text
P("o gato dormiu") = P("o") x P("gato" | "o") x P("dormiu" | "o gato")
```

O **teorema de Bayes** inverte uma condicional. Suponha que 20% dos e-mails são spam, e que a palavra "prêmio" aparece em 40% dos spams e em 5% dos e-mails normais. Chega um e-mail com "prêmio". Qual a chance de ser spam?

```text
P(spam | prêmio) = P(prêmio | spam) x P(spam) / P(prêmio)
                 = 0,40 x 0,20 / (0,40 x 0,20 + 0,05 x 0,80)
                 = 0,08 / 0,12
                 = 0,667
```

O erro comum é responder 40%, que é P(prêmio | spam), a condicional oposta. A resposta certa depende também de quão frequente é o spam (a probabilidade a priori, 20%).

A **verossimilhança** (likelihood) é a probabilidade que um modelo dá aos dados que de fato observamos, vista como função dos parâmetros. Se uma moeda dá 7 caras em 10 lançamentos, o valor de p que torna esse resultado mais provável é p = 7/10. Escolher parâmetros assim é a **máxima verossimilhança**, e treinar uma rede neural é exatamente isso. Como um produto de muitas probabilidades pequenas fica pequeno demais para o computador guardar, somamos logaritmos em vez de multiplicar, e como os otimizadores minimizam, usamos o **negativo do logaritmo da verossimilhança**.

A função **softmax** transforma qualquer lista de notas (chamadas logits) em uma distribuição de probabilidade: eleve e a cada nota e divida pela soma. Para as notas (2, 1, 0):

```text
e^2 = 7,389   e^1 = 2,718   e^0 = 1,000   soma = 11,107
softmax = (0,665, 0,245, 0,090)        soma 1
```

A **perda de entropia cruzada** (cross-entropy) de uma previsão é o negativo do logaritmo da probabilidade dada à resposta certa. Se a classe certa era a primeira, a perda é -ln(0,665) = 0,408. Uma previsão perfeita (probabilidade 1) custa 0, e uma previsão errada e confiante custa muito. A **entropia** mede o quanto uma distribuição é incerta: uma moeda honesta tem 1 bit, uma moeda que sempre dá cara tem 0.

Funcionando: o [tiny-language-model](tiny-language-model.md) conta uma tabela de probabilidades condicionais, confere que cada linha soma 1 e mede a entropia das amostras.

## 3. Vetores e matrizes

Redes neurais só fazem aritmética com listas de números.

- Um **escalar** é um número. Um **vetor** é uma lista de números, como (3, 4). Uma **matriz** é uma tabela de números com linhas e colunas. **Tensor** é o nome geral, com qualquer número de dimensões: uma imagem colorida é um tensor de altura x largura x 3.
- O **formato** (shape) diz quantos números há em cada dimensão. A maioria dos bugs em código de aprendizado de máquina é bug de formato.

Um vetor pode ser lido como um ponto no espaço ou como uma seta da origem até esse ponto. O seu **comprimento** (norma) vem de Pitágoras: o comprimento de (3, 4) é raiz(9 + 16) = 5.

O **produto escalar** (dot product) multiplica dois vetores posição a posição e soma os resultados:

```text
(1, 2, 3) . (4, 0, -1) = 1x4 + 2x0 + 3x(-1) = 1
```

Ele é grande quando os dois vetores apontam para o mesmo lado, zero quando são perpendiculares e negativo quando apontam para lados opostos. A **similaridade do cosseno** é o produto escalar dividido pelos dois comprimentos, de modo que só a direção conta:

```text
a = (3, 4)   b = (4, 3)
a . b = 12 + 12 = 24        |a| = 5   |b| = 5
cosseno = 24 / (5 x 5) = 0,96
```

Ela vai de -1 (opostos), passando por 0 (sem relação), até 1 (mesma direção). (1, 2, 2) e (2, 4, 4) têm cosseno 1, porque um é o outro multiplicado por 2. Essa única fórmula é como um buscador decide que dois textos falam da mesma coisa (seção 8).

Uma **matriz vezes um vetor** é um lote de produtos escalares: cada linha da matriz é multiplicada pelo vetor. Uma matriz com m linhas e n colunas recebe um vetor de n números e devolve um vetor de m números. Uma camada de rede neural é essa operação mais um vetor de vieses: `y = W x + b`. Quando duas matrizes são multiplicadas, o número de colunas da primeira precisa ser igual ao número de linhas da segunda, e a ordem importa: A x B em geral é diferente de B x A.

Funcionando: o [embeddings-vector-search](embeddings-vector-search.md) ordena palavras e passagens pela similaridade do cosseno.

## 4. Aprendizado supervisionado e perda

O aprendizado supervisionado tem pares (entrada, resposta certa). Se a resposta é um número (o preço de uma casa) a tarefa é **regressão**. Se a resposta é uma categoria (spam ou não) é **classificação**.

A **função de perda** (loss) transforma "o quanto o modelo está errado?" em um número, que o treinamento tenta tornar pequeno. Para regressão a mais usual é o **erro quadrático médio** (MSE):

```text
previsões: 2, 4, 6        respostas certas: 3, 4, 4
erros:     -1, 0, 2       quadrados: 1, 0, 4
MSE = (1 + 0 + 4) / 3 = 1,667
```

Para classificação é a entropia cruzada da seção 2.

Os dados são divididos em três partes, e essa divisão é o hábito mais importante da área:

| Parte | Serve para |
| --- | --- |
| Conjunto de treino | ajustar os parâmetros |
| Conjunto de validação | escolher hiperparâmetros e decidir quando parar |
| Conjunto de teste | uma medição final e honesta, em dados nunca usados para decisão alguma |

**Sobreajuste (overfitting)** é quando o modelo decora o conjunto de treino, inclusive o ruído, e vai mal em dados novos. O sinal é uma perda de treino que continua caindo enquanto a perda de validação começa a subir. **Subajuste (underfitting)** é o oposto: o modelo é simples demais (ou treinou de menos) e vai mal nos dois.

```text
perda
 |\
 | \   .  validação                . '
 |  \    ' .                 . '
 |   \       ' - . _ _ . - '        <- o sobreajuste começa aqui
 |    '.
 |      ' - . _  treino
 |               ' ' - - . . . _ _ _
 +------------------------------------> tempo de treinamento
```

Duas armadilhas para quem começa. Primeira, **a acurácia pode enganar**: se 99% das transações são legítimas, um modelo que sempre responde "legítima" tem 99% de acurácia e é inútil, e é por isso que existem precisão e revocação (recall). Segunda, o **vazamento de dados**: se informação do conjunto de teste escapa para o treino (o mesmo exemplo dos dois lados, ou uma característica que não existiria no momento da previsão), o resultado medido é melhor que a realidade.

Funcionando: o [neural-network-from-scratch](neural-network-from-scratch.md) treina um classificador e o mede em pontos que não usou no treino.

## 5. Neurônios, camadas e funções de ativação

Um **neurônio** artificial faz três coisas: multiplica cada entrada por um peso, soma tudo mais um viés (bias), e passa o resultado por uma função de ativação.

```text
x1 = 1,0 --( w1 =  0,5 )--\
                           (+) --> z = 0,5 - 2,0 + 0,5 = -1,0 --> ativação --> saída
x2 = 2,0 --( w2 = -1,0 )--/
              viés b = 0,5
```

Com a ativação ReLU a saída é max(0, -1,0) = 0. Com tanh é tanh(-1,0) = -0,762.

A **função de ativação** é o que faz a rede ser mais que uma fórmula linear. Sem ela, duas camadas seguidas seriam `W2 (W1 x)`, que é o mesmo que uma camada com a matriz `W2 W1`: empilhar não acrescentaria nada. As mais comuns:

| Função | Fórmula | Faixa da saída | Observação |
| --- | --- | --- | --- |
| Sigmoide | 1 / (1 + e^-z) | 0 a 1 | lê-se como probabilidade, mas satura: longe de zero a inclinação é quase 0 |
| tanh | (e^z - e^-z) / (e^z + e^-z) | -1 a 1 | centrada em zero, também satura |
| ReLU | max(0, z) | 0 a infinito | barata e não satura no lado positivo. Um neurônio preso no lado negativo para de aprender ("ReLU morta") |

Os neurônios são organizados em **camadas**. Cada neurônio de uma camada recebe todas as saídas da camada anterior. Uma rede com entrada, camadas ocultas e saída é um perceptron multicamadas (MLP):

```text
entrada (2)    oculta (8)      saída (1)
   o ----------- o o o o
     \  /  /  /  o o o o ----------- o
   o ----------- (cada entrada vai a todos os neurônios ocultos)
```

Contando os **parâmetros**: cada neurônio oculto tem 2 pesos e 1 viés, então 2 x 8 + 8 = 24. O neurônio de saída tem 8 pesos e 1 viés, 9. Total: 33. Um modelo de linguagem é o mesmo tipo de conta com bilhões no lugar de 33.

Por que as camadas ocultas importam: um único neurônio só consegue separar as entradas com uma linha reta. O XOR ("um ou outro, mas não os dois") não pode ser separado por uma linha, então um neurônio nunca o aprende. Uma camada oculta dobra o espaço de modo que depois uma linha basta. O teorema clássico diz que uma rede com uma camada oculta consegue aproximar qualquer função contínua se tiver neurônios suficientes. Ele diz que os pesos certos existem, não que o treinamento vai encontrá-los.

Funcionando: o [neural-network-from-scratch](neural-network-from-scratch.md) constrói neurônios, camadas e um MLP, e aprende o XOR.

## 6. Descida do gradiente e retropropagação

Treinar é procurar os parâmetros que deixam a perda pequena. Imagine a perda como um relevo de morros e os parâmetros como a sua posição. Você está na neblina e só sente a inclinação sob os pés. O plano sensato é dar um passo pequeno morro abaixo e sentir de novo. Esse plano é a **descida do gradiente**.

O **gradiente** é a lista de inclinações, uma por parâmetro: o quanto a perda cresceria se aquele parâmetro crescesse um pouco. Como ele aponta morro acima, andamos contra ele:

```text
peso novo = peso antigo - taxa de aprendizado x gradiente
```

Um caso resolvido com um parâmetro. A perda é L(w) = (w - 3)^2, cujo mínimo está em w = 3 e cuja inclinação é 2 (w - 3). Comece em w = 0 com taxa de aprendizado 0,1:

```text
passo 1: inclinação = 2 x (0 - 3)    = -6,0    w = 0    - 0,1 x (-6,0) = 0,6
passo 2: inclinação = 2 x (0,6 - 3)  = -4,8    w = 0,6  - 0,1 x (-4,8) = 1,08
passo 3: inclinação = 2 x (1,08 - 3) = -3,84   w = 1,08 - 0,1 x (-3,84) = 1,464
```

Cada passo chega mais perto de 3. A **taxa de aprendizado** é o tamanho do passo. Pequena demais e o treinamento não acaba nunca. Grande demais e os passos pulam por cima do vale e a perda cresce em vez de cair (com taxa 1,1 neste exemplo, w se afasta de 3 a cada passo).

A **retropropagação** (backpropagation) é como o gradiente de milhões de parâmetros é calculado em uma única passada. É a regra da cadeia do cálculo aplicada da perda de volta até as entradas. Cada operação conhece apenas a sua inclinação local, e as inclinações são multiplicadas no caminho de volta. Para f = (x + y) x z com x = 2, y = 1, z = 4:

```text
ida:     q = x + y = 3        f = q x z = 12
volta:   df/dz = q = 3        df/dq = z = 4
         df/dx = df/dq x dq/dx = 4 x 1 = 4
         df/dy = df/dq x dq/dy = 4 x 1 = 4
```

Conferindo à mão: subir x de 2 para 2,01 dá f = 3,01 x 4 = 12,04, um aumento de 0,04 = 4 x 0,01. É também assim que o código é testado: comparar o gradiente da retropropagação com (f(x + h) - f(x - h)) / 2h, o **gradiente numérico**.

O vocabulário de um treinamento:

- **Lote (batch)**: os exemplos usados em uma atualização. Usar poucos exemplos por vez (um mini-lote) é a **descida do gradiente estocástica**: cada passo tem mais ruído, mas custa muito menos que usar todos os dados. Uma passada pelo conjunto de treino inteiro é uma **época**.
- Os **otimizadores** mudam como o passo é dado. O momento (momentum) guarda parte do passo anterior, como uma bola que ganha velocidade. O Adam também adapta o tamanho do passo de cada parâmetro.
- A **regularização** combate o sobreajuste: o decaimento de pesos (L2) puxa os pesos para zero, o **dropout** desliga neurônios ao acaso durante o treino (nunca na inferência), e a parada antecipada encerra o treino quando a perda de validação para de melhorar.
- **Gradientes que desaparecem**: em uma rede profunda as inclinações são multiplicadas camada após camada. Se elas são menores que 1 (como nas partes planas da sigmoide e da tanh), o produto encolhe para perto de zero e as primeiras camadas param de aprender. ReLU, conexões residuais (somar a entrada de um bloco à sua saída) e camadas de normalização são os remédios usuais.

Funcionando: o [neural-network-from-scratch](neural-network-from-scratch.md) implementa a regra da cadeia valor por valor, confere contra o gradiente numérico e grava a curva de perda.

## 7. Tokens e tokenização

Um modelo calcula com números, então o texto precisa virar números antes. A unidade é o **token**: um pedaço de texto com um id inteiro. A lista de todos os tokens que um modelo conhece é o seu **vocabulário**.

Três formas de cortar o texto:

| Unidade | Vocabulário | Problema |
| --- | --- | --- |
| Palavras | enorme (toda forma de toda palavra) | uma palavra fora do vocabulário não pode ser representada |
| Caracteres | minúsculo | as sequências ficam muito longas e cada unidade carrega pouco significado |
| **Subpalavras** | médio, escolhido por nós | nenhum dos dois: palavras comuns são um token, palavras raras são divididas em pedaços conhecidos |

Os modelos modernos usam subpalavras, e o algoritmo mais conhecido é o **byte-pair encoding (BPE)**. Treiná-lo é um laço: conte todos os pares de tokens vizinhos, funda o par mais frequente em um token novo, repita. Com o texto `banana bandana`, partindo de caracteres (14 tokens, contando o espaço):

```text
início    b a n a n a _ b a n d a n a         14 tokens
fusão 1   "a"+"n" (4 vezes)  ->  b an an a _ b an d an a      10 tokens
fusão 2   "b"+"an" (2 vezes) ->  ban an a _ ban d an a         8 tokens
fusão 3   "an"+"a" (2 vezes) ->  ban ana _ ban d ana           6 tokens
```

Cada fusão acrescenta um token ao vocabulário e encurta o texto. Essa é a troca: **um vocabulário maior dá menos tokens para o mesmo texto**.

Os tokenizadores reais partem de **bytes**, não de caracteres. Todo texto em UTF-8 é uma sequência de bytes, e um byte tem só 256 valores, então o vocabulário base tem 256 tokens e nenhum texto é "desconhecido": `é` são 2 bytes, um emoji são 4. O tamanho do vocabulário é então 256 mais o número de fusões (mais alguns tokens especiais, como o que marca o fim de um texto). Decodificar junta os bytes de volta, então codificar e depois decodificar devolve exatamente o texto original.

Consequências que importam na prática:

- **Um token não é uma palavra.** Uma palavra comum do inglês costuma ser um token, uma palavra rara ou longa são vários, e a mesma frase dá contagens diferentes em línguas diferentes e em tokenizadores diferentes. Regras práticas como "um token tem uns três ou quatro caracteres de inglês" são só estimativas.
- **Os modelos são limitados e cobrados em tokens**, porque o token é a unidade de trabalho: o modelo roda uma vez para cada token que lê e uma vez para cada token que escreve.
- A **janela de contexto** é o número máximo de tokens que o modelo consegue olhar de uma vez: as instruções, a conversa até ali, os documentos anexados e a resposta sendo escrita dividem esse espaço. É uma memória de trabalho, diferente do que o modelo aprendeu no treinamento. O texto que não cabe simplesmente não é visto.

Funcionando: o [bpe-tokenizer](bpe-tokenizer.md) treina BPE sobre bytes, mostra os tokens de uma frase com ids e fronteiras, e tabela como a contagem cai quando as fusões aumentam.

## 8. Embeddings e similaridade

Um id de token é só um rótulo: o token 512 não é "mais" que o token 511. Para calcular com significado, cada token recebe um vetor, chamado **embedding**. Ele é uma linha de uma grande tabela com uma linha por token do vocabulário, e os números dessa tabela são parâmetros, aprendidos como quaisquer outros.

De onde vem o significado? Da **hipótese distribucional**: palavras que aparecem nos mesmos contextos têm significados parecidos. "Café" e "chá" aparecem perto de "xícara", "quente" e "beber". Conte, para cada palavra, quais palavras aparecem perto dela, e as duas linhas de contagens serão parecidas:

```text
            xícara   quente   beber   motor   estrada
café           8        6       9       0        0
chá            7        5       8       0        0
carro          0        1       0       9        7
```

Cada linha é um vetor. A similaridade do cosseno (seção 3) entre "café" e "chá" fica perto de 1, e entre "café" e "carro" fica perto de 0. Métodos como word2vec e GloVe produzem vetores curtos e densos a partir desse mesmo sinal, e neles algumas direções carregam significado, e é por isso que uma conta como rei - homem + mulher cai perto de rainha.

Esses vetores são **estáticos**: um vetor por palavra, então o "banco" da praça e o "banco" do dinheiro dividem o mesmo. Dentro de um transformer o vetor de cada token é atualizado pelos tokens ao redor (seção 9), o que dá embeddings **contextuais**.

O mesmo truque funciona para frases e documentos inteiros: um modelo leva um texto a um vetor, e textos de significado parecido caem perto um do outro. A **busca vetorial** é então: transforme a pergunta em um vetor e encontre os vetores guardados mais próximos dele.

- A **força bruta** compara a pergunta com todos os vetores guardados. É exata, e o custo cresce com o número de vetores.
- Um **índice aproximado** olha só uma parte promissora dos dados. Um índice simples traça planos aleatórios pelo espaço e anota de que lado de cada plano o vetor cai. Vetores que apontam em direções parecidas tendem a receber o mesmo padrão de lados, então acabam no mesmo balde, e uma consulta é comparada só com o próprio balde. É muito mais rápido e às vezes perde o verdadeiro vizinho mais próximo. A fração de respostas certas que ele encontra é a sua **revocação (recall)**.

Funcionando: o [embeddings-vector-search](embeddings-vector-search.md) constrói vetores de palavras a partir de contagens de coocorrência, compara a força bruta com um índice de planos aleatórios e recupera as passagens que respondem a uma pergunta.

## 9. Atenção e o transformer

Para prever a próxima palavra de "O animal não atravessou a rua porque ele estava muito cansado", o modelo precisa descobrir que "ele" é o animal. O vetor de "ele" precisa de informação de outra posição. A **atenção** é a operação que move informação entre posições.

Cada token produz três vetores a partir do seu embedding: uma **consulta** (query, "o que estou procurando?"), uma **chave** (key, "o que eu ofereço?") e um **valor** (value, "o que eu repasso se for escolhido"). Para um token:

1. A sua consulta é comparada com a chave de todos os tokens por um produto escalar. Isso dá uma nota por token.
2. O softmax transforma as notas em pesos que somam 1.
3. A saída é a média dos valores, ponderada por esses pesos.

```text
consulta q = (1, 0)
chaves   k1 = (1, 0)   k2 = (0, 1)   k3 = (1, 1)
notas    q.k1 = 1      q.k2 = 0      q.k3 = 1
pesos    softmax(1, 0, 1) = (0,422, 0,155, 0,422)
valores  v1 = 10       v2 = 20       v3 = 30
saída    0,422 x 10 + 0,155 x 20 + 0,422 x 30 = 20,0
```

O artigo que apresentou o transformer escreve tudo isso em uma linha, `softmax(Q K^T / sqrt(d_k)) V`. A divisão pela raiz quadrada do tamanho das chaves impede que as notas cresçam com o tamanho do vetor, o que empurraria o softmax para uma saída quase one-hot, com gradiente quase nulo.

Três detalhes completam o quadro:

- A **atenção com várias cabeças** (multi-head) roda várias atenções em paralelo, cada uma com as suas matrizes de consulta, chave e valor, de modo que uma cabeça pode seguir a gramática enquanto outra segue quem é "ele". As saídas são juntadas.
- **Máscara causal**: um modelo que prevê o próximo token não pode ver o futuro. Antes do softmax, as notas das posições posteriores recebem menos infinito, então o peso delas é 0.

    ```text
    a posição pode olhar ->   1   2   3   4
    token 1                   x   .   .   .
    token 2                   x   x   .   .
    token 3                   x   x   x   .
    token 4                   x   x   x   x
    ```

- **Informação de posição**: a atenção trata a entrada como um saco de tokens, sem ordem. Por isso um vetor que codifica a posição é somado ao embedding de cada token.

Um **bloco transformer** é a atenção seguida de um pequeno MLP aplicado a cada posição, cada um dos dois envolvido por uma conexão residual e uma normalização. Um modelo é uma pilha desses blocos:

```text
ids dos tokens
   |
[ embedding do token + embedding da posição ]
   |
[ bloco 1: atenção -> MLP ]     os tokens trocam informação, depois cada um "pensa"
[ bloco 2: atenção -> MLP ]
   ...
[ camada linear final + softmax ]
   |
uma probabilidade para cada token do vocabulário
```

O transformer original tinha um **codificador** (encoder, lê a entrada inteira, cada token vê todos os outros) e um **decodificador** (decoder, escreve a saída um token por vez), e foi feito para tradução. Modelos que só entendem texto, como o BERT, ficam com o codificador. Modelos que geram texto, como o GPT, ficam com o decodificador.

Comparado com as redes recorrentes usadas antes, um transformer processa todas as posições de uma vez durante o treino, o que combina com hardware paralelo. O preço é que cada token olha para todos os outros: com n tokens há n x n pares, então dobrar o comprimento do texto multiplica esse trabalho por quatro.

Funcionando: o [tiny-language-model](tiny-language-model.md) implementa a autoatenção causal e um bloco transformer com NumPy, ida e volta.

## 10. Como um modelo de linguagem prevê e amostra

Um modelo de linguagem faz uma coisa: dados os tokens até aqui, devolve uma **probabilidade para cada próximo token possível**. Gerar texto é um laço em volta dessa única coisa:

```text
"O céu está"  -> modelo -> { azul: 0,62, limpo: 0,11, caindo: 0,02, ... }
                 escolhe um token ("azul"), acrescenta
"O céu está azul" -> modelo -> { .: 0,41, e: 0,20, ... }
                 ... até um token de fim ou um limite de tamanho
```

O modelo de linguagem mais simples conta. Um modelo de **bigramas** olha só para o token anterior: conte quantas vezes cada token vem depois de cada outro, e divida cada linha pelo seu total.

```text
depois de "o":  gato 3 vezes, cão 1 vez   ->  P(gato | o) = 3/4 = 0,75   P(cão | o) = 0,25
```

Um transformer faz o mesmo trabalho com uma memória muito melhor: ele condiciona na janela de contexto inteira em vez de em um token, e compartilha o que aprendeu entre contextos parecidos em vez de guardar uma linha de tabela por contexto.

O **treinamento** não precisa de rótulos: pegue qualquer texto, esconda o próximo token, peça a previsão e use a entropia cruzada contra o token que de fato veio. O número relatado costuma ser a perda, ou a sua exponencial, a **perplexidade**: um modelo que hesita igualmente entre 8 tokens a cada passo tem perplexidade 8. Menor é melhor, e ela é medida em texto separado do treino.

A **amostragem** é como um token é escolhido da distribuição. A escolha muda o estilo da saída mais do que se imagina:

| Método | O que faz |
| --- | --- |
| Guloso (greedy) | sempre o token mais provável. Determinístico, tende a ser monótono e repetitivo |
| Amostragem | sorteia um token com a probabilidade que o modelo deu a ele |
| Temperatura T | divide os logits por T antes do softmax |
| Top-k | fica com os k tokens mais prováveis, renormaliza e sorteia |
| Top-p (nucleus) | fica com o menor conjunto de tokens cujas probabilidades somam p, renormaliza e sorteia |

O efeito da temperatura sobre os logits (2, 1, 0):

```text
T = 0,5   logits (4, 2, 0)      ->  (0,867, 0,117, 0,016)    mais concentrado, mais seguro
T = 1,0   logits (2, 1, 0)      ->  (0,665, 0,245, 0,090)    o modelo como foi treinado
T = 2,0   logits (1, 0,5, 0)    ->  (0,506, 0,307, 0,186)    mais plano, mais variado
```

Quando T se aproxima de 0 o resultado se aproxima da decodificação gulosa. É por isso que a mesma pergunta pode receber respostas diferentes: o modelo é amostrado, não consultado como uma tabela.

**Pré-treinamento e ajuste fino.** O pré-treinamento é a fase longa e cara, sobre uma quantidade enorme de texto geral com o objetivo de prever o próximo token, em que o modelo adquire gramática, fatos e padrões de raciocínio. O **ajuste fino (fine-tuning)** continua o treinamento em um conjunto menor e específico: conversas, para virar um assistente, ou os documentos de uma área. O BERT é pré-treinado com outro jogo: alguns tokens são mascarados e o modelo preenche as lacunas usando os dois lados do contexto, o que é bom para compreender e não serve para escrever.

Funcionando: o [tiny-language-model](tiny-language-model.md) compara uma tabela de bigramas com um pequeno transformer em texto separado do treino e tabela como a temperatura muda a entropia das amostras.

## 11. Uso de LLMs

Um grande modelo de linguagem (LLM, large language model) é usado através da sua janela de contexto. Tudo o que ele sabe sobre o seu pedido é o texto nessa janela mais o que ficou guardado nos pesos durante o treinamento.

- **Prompt**: o texto dado ao modelo. Um **prompt de sistema** define o papel e as regras, e as mensagens do usuário vêm depois. Instruções claras e específicas, com o contexto necessário, funcionam melhor que dicas curtas.
- **Few-shot**: coloque alguns exemplos resolvidos no prompt e o modelo continua o padrão. Nada é treinado: os pesos ficam iguais, os exemplos agem só pelo contexto (aprendizado em contexto).
- **O modelo não tem memória entre chamadas.** Uma aplicação de chat reenvia a conversa inteira a cada vez. Quando a conversa não cabe mais na janela, algo precisa ser cortado ou resumido.

A **geração aumentada por recuperação (RAG, retrieval-augmented generation)** responde a "como o modelo pode usar documentos que nunca viu no treinamento?":

```text
pergunta --> [ busca: vetoriza a pergunta, acha as passagens mais próximas ] --> passagens
                                                                                    |
resposta <-- [ modelo: lê pergunta + passagens no seu contexto ] <------------------+
```

O passo de busca é a busca vetorial da seção 8. O modelo então escreve a resposta a partir das passagens, que podem ser citadas e mantidas atualizadas sem treinar de novo.

As **ferramentas** (tools) permitem que um modelo aja. A aplicação descreve funções (busca, calculadora, consulta a banco de dados). Quando o modelo decide que uma é necessária, ele escreve um pedido estruturado, a aplicação executa a função e coloca o resultado de volta no contexto, e o modelo continua. O modelo nunca executa nada por conta própria. Um **agente** é isso em laço: o modelo escolhe a próxima ação, observa o resultado e repete até a tarefa terminar. Quando os passos são fixos no código e o modelo só preenche cada passo, trata-se de um fluxo de trabalho (workflow), que é mais simples e mais previsível.

A **alucinação** é texto fluente que é falso: uma citação inventada, uma referência que não existe. É consequência direta de como o modelo funciona: ele produz uma continuação plausível, e plausível não é o mesmo que verdadeiro. O que a reduz: dar o texto-fonte no contexto e pedir que o modelo responda só a partir dele, permitir o "não sei", pedir citações e conferir as afirmações. Nada a elimina por completo, então saídas importantes são verificadas.

**Avaliar** é medir em exemplos que o modelo não viu, com as respostas definidas de antemão. Uma resposta impressionante é um caso isolado. Questões de teste públicas vazam para os dados de treino com o tempo (contaminação), o que faz um modelo parecer melhor do que é.

Um risco para conhecer: qualquer coisa colocada no contexto pode influenciar o modelo, inclusive texto escrito por outra pessoa (uma página da web, um e-mail). Instruções escondidas nesse tipo de texto são chamadas de **injeção de prompt**. A defesa é tratar texto recuperado como dado, restringir o que as ferramentas podem fazer e manter uma pessoa no circuito para ações que importam.

Funcionando: o [embeddings-vector-search](embeddings-vector-search.md) implementa o passo de recuperação: uma pergunta escolhe as passagens mais relevantes.

## 12. Geração de imagens

Para o computador uma **imagem** é um tensor de números: altura x largura x 3 canais de cor. Uma figura colorida pequena, de 64 x 64, já são 12.288 números.

A **convolução** é a camada feita para imagens. Um filtro pequeno (digamos 3 x 3 pesos) desliza sobre a imagem e, em cada posição, calcula um produto escalar com o recorte que está embaixo dele. O mesmo filtro é usado em todo lugar, então um padrão aprendido em um canto é reconhecido em qualquer canto, e a camada precisa de poucos parâmetros.

```text
tamanho da saída = (W - F + 2P) / S + 1     W entrada, F filtro, P preenchimento, S passo
entrada de 28 pixels, filtro de 3, sem preenchimento, passo 1:   (28 - 3 + 0) / 1 + 1 = 26
8 filtros de 3 x 3 em uma imagem de 1 canal:   8 x (3 x 3 x 1) pesos + 8 vieses = 80 parâmetros
```

As primeiras camadas acabam detectando bordas, as seguintes formas e objetos. É assim que uma rede enxerga. Gerar é o sentido inverso, e três famílias fazem isso.

**Autoencoders.** Um codificador espreme a imagem em um vetor curto (o **latente**), e um decodificador reconstrói a imagem a partir dele. Treinado para que a saída seja igual à entrada, ele aprende uma descrição comprimida. Um **autoencoder variacional (VAE)** faz o codificador devolver uma pequena nuvem (uma média e uma dispersão) em vez de um ponto, e mantém essas nuvens perto de uma normal padrão. Assim, qualquer ponto sorteado de uma normal pode ser decodificado em uma imagem nova e plausível.

**GANs (redes adversárias generativas).** Duas redes jogam uma contra a outra. O gerador transforma ruído aleatório em uma imagem. O discriminador recebe imagens reais e geradas e tenta dizer qual é qual. Cada uma melhora ao vencer a outra, e no fim ideal o discriminador só consegue chutar (50%). As GANs geram em uma única passada e podem ser muito nítidas, mas o jogo é instável de treinar e o gerador pode acabar produzindo só alguns tipos de imagem (colapso de modos).

Os **modelos de difusão**, que estão por trás da maioria dos geradores de imagem atuais, dividem o problema em muitos passos fáceis.

```text
direto (fixo, sem aprendizado): some um pouco de ruído, muitas vezes
   imagem  ->  pouco ruído  ->  mais ruído  ->  ...  ->  ruído puro

reverso (aprendido): tire um pouco de ruído, muitas vezes
   ruído puro  ->  ...  ->  menos ruído  ->  pouco ruído  ->  imagem
```

1. **Processo direto.** Ruído gaussiano é somado passo a passo até não sobrar nada da imagem. Há um atalho para qualquer passo t: `x_t = raiz(a) x_0 + raiz(1 - a) ruído`, em que `a` vai de quase 1 (primeiros passos) a quase 0 (último passo). Com a = 0,5, um pixel que vale 2 e um ruído sorteado de -1 dão 0,707 x 2 + 0,707 x (-1) = 0,707.
2. **Treinamento.** Pegue uma imagem, escolha um passo ao acaso, some o ruído e pergunte à rede: "que ruído foi somado?". A perda é o erro quadrático médio entre o ruído verdadeiro e o palpite. É aprendizado supervisionado comum, com rótulos que nós mesmos criamos.
3. **Geração.** Comece de ruído aleatório puro e repita: peça o ruído à rede, subtraia uma parte dele, vá para o passo anterior. Depois de todos os passos aparece uma imagem que nunca esteve no conjunto de treino.

Dois acréscimos transformam isso em um sistema de texto para imagem. A **difusão latente** roda o processo inteiro sobre o pequeno latente de um autoencoder, em vez de sobre os pixels, e só decodifica no fim, o que custa muito menos computação. O **condicionamento por texto** codifica o prompt com um modelo de texto e deixa a rede que remove ruído olhar para ele por atenção cruzada (seção 9, com a imagem fazendo as consultas e o texto guardando as chaves e os valores), de modo que cada passo é conduzido para uma imagem que combina com a descrição.

A difusão é mais lenta para gerar que uma GAN, porque chama a rede uma vez por passo em vez de uma única vez, mas treina de forma estável e cobre bem a variedade dos dados.

Funcionando: o [diffusion-toy](diffusion-toy.md) faz tudo isso com pontos de duas dimensões no lugar de pixels, para que cada passo possa ser desenhado.

## 13. Limites, viés, segurança e custo

**Tamanho e memória.** Um modelo são os seus parâmetros. A memória é o número de parâmetros vezes os bytes de cada um:

```text
7 bilhões de parâmetros x 4 bytes (ponto flutuante de 32 bits) = 28 GB
7 bilhões de parâmetros x 1 byte  (inteiros de 8 bits)         = 7 GB
```

Guardar cada peso com menos bits é a **quantização**. O modelo fica menor e muitas vezes mais rápido, e perde um pouco de precisão, pois cada peso é arredondado para um de apenas 256 valores.

**Custo.** O treinamento é pago uma vez e é enorme: muitos chips especializados por semanas. A inferência é paga a cada uso e cresce com o número de tokens lidos e escritos, e é por isso que as APIs cobram por token, e que um prompt longo é mais caro e mais lento que um curto.

**O que um modelo de linguagem não é.**

- Não é um banco de dados. Ele guarda padrões, não registros, então pode errar com total confiança (seção 11).
- Tem uma **data de corte do conhecimento**: não sabe nada depois da data em que os dados de treino terminam, a menos que a informação seja colocada no contexto.
- É sensível à forma do pedido, e o mesmo pedido pode dar respostas diferentes.
- É fraco em trabalho exato por conta própria (contas longas, contar caracteres), porque enxerga tokens e prevê texto provável. Ferramentas resolvem isso: uma calculadora não chuta.

**Viés.** Um modelo aprende os padrões dos seus dados, inclusive os injustos. Se os textos do passado associam uma profissão a um gênero, o modelo repete a associação. Fazer curadoria dos dados, testar as saídas em diferentes grupos e corrigir no ajuste fino reduzem o problema e não o encerram.

**Privacidade e memorização.** Um modelo pode reproduzir trechos dos dados de treino. Dados sensíveis não devem ser usados em treinamento sem cuidado, e não devem ser colados em um serviço sem saber como serão usados.

**Segurança, em uma regra.** Quanto mais um sistema pode fazer sozinho (enviar mensagens, gastar dinheiro, alterar arquivos), mais as suas saídas precisam de limites e de revisão. Uma pessoa continua responsável pelas decisões que afetam pessoas: saúde, direito, dinheiro, contratação.

## 14. O que um framework oferece: PyTorch

As seções 5 e 6 podem ser escritas à mão, e os primeiros mini-projetos fazem exatamente isso. Ninguém treina um modelo de verdade desse jeito. Um **framework** de aprendizado profundo fornece quatro coisas, e são as mesmas quatro em todo framework:

| Peça | O que faz | À mão era |
| --- | --- | --- |
| **Tensor** | um arranjo de números de qualquer formato, com operações rápidas que também rodam em GPU | listas e laços do Python |
| **Diferenciação automática** | registra as operações da ida e calcula todos os gradientes | a função de volta que você escreveu para cada operação |
| **Módulos (camadas)** | blocos prontos que são donos dos seus parâmetros | as suas classes `Neuron` e `Layer` |
| **Otimizadores** | aplicam a regra de atualização a todos os parâmetros | o laço `w = w - lr * grad` |

**Tensores.** Um tensor do PyTorch tem um `shape`, um `dtype` (por exemplo ponto flutuante de 32 bits) e um `device` (CPU ou GPU). `a * b` multiplica elemento a elemento e `a @ b` é o produto de matrizes da seção 3.

**Diferenciação automática.** Marque um tensor com `requires_grad=True` e o PyTorch registra toda operação feita com ele. Chamar `backward()` no resultado roda a retropropagação e deixa cada gradiente em `.grad`:

```python
import torch

x = torch.tensor(2.0, requires_grad=True)
y = x**2 + 3 * x  # dy/dx = 2x + 3
y.backward()
print(x.grad)  # tensor(7.)
```

O grafo é construído enquanto o código roda, então `if` e `for` comuns do Python podem fazer parte de um modelo. Um detalhe surpreende todo mundo uma vez: **os gradientes se acumulam**. Um segundo `backward()` soma em `.grad` em vez de substituir, e é por isso que um laço de treinamento zera os gradientes a cada passo.

**Módulos.** Um modelo é uma classe que herda de `nn.Module`: as camadas são criadas no `__init__` e o cálculo é escrito no `forward`. O módulo encontra os próprios parâmetros, então `model.parameters()` entrega todos ao otimizador. Para uma pilha simples de camadas, `nn.Sequential` basta.

**O laço de treinamento** é escrito por você, e são sempre as mesmas cinco linhas:

```python
model = nn.Sequential(nn.Linear(2, 8), nn.Tanh(), nn.Linear(8, 1))
loss_fn = nn.BCEWithLogitsLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.5)

for epoch in range(200):
    logits = model(inputs)  # 1. ida (forward)
    loss = loss_fn(logits, targets)  # 2. o quanto errou?
    optimizer.zero_grad()  # 3. zera os gradientes antigos
    loss.backward()  # 4. retropropagação
    optimizer.step()  # 5. atualiza todos os parâmetros
```

Esse modelo é a rede 2-8-1 da seção 5, com os seus 33 parâmetros. Duas chaves são fáceis de confundir. `torch.no_grad()` para de registrar operações: é usada ao medir ou usar um modelo, economiza memória e não calcula nada diferente. `model.eval()` muda o comportamento das camadas que agem de outro modo no treino, como o dropout: ela não desliga os gradientes. O código de avaliação usa as duas.

Mais um erro comum: `nn.CrossEntropyLoss` espera as notas cruas (logits) e aplica o softmax por conta própria. Passar probabilidades aplica o softmax duas vezes, e o modelo aprende mal sem nenhuma mensagem de erro.

Funcionando: o [pytorch-basics](pytorch-basics.md) confere os gradientes do PyTorch contra gradientes numéricos e contra a retropropagação escrita à mão do [neural-network-from-scratch](neural-network-from-scratch.md), depois treina a mesma rede e compara linhas de código e tempo.

## 15. TensorFlow e Keras

O TensorFlow é o outro grande framework, e o Keras é a sua interface de alto nível. As ideias são as da seção 14 com outros nomes.

**Tensores e variáveis.** Um `tf.Tensor` não pode ser alterado depois de criado. Uma `tf.Variable` guarda um valor que o treinamento atualiza, então os parâmetros de um modelo são variáveis.

**Gradientes com uma fita.** O TensorFlow registra operações só dentro de um bloco `tf.GradientTape`, e depois se pede o gradiente à fita:

```python
import tensorflow as tf

x = tf.Variable(3.0)
with tf.GradientTape() as tape:
    y = x * x  # dy/dx = 2x
print(tape.gradient(y, x))  # 6.0
```

As variáveis treináveis são observadas automaticamente. Uma constante não: o gradiente dela volta como `None`, a menos que se chame `tape.watch`. Uma fita serve para uma chamada de `gradient`, a menos que seja criada com `persistent=True`.

**Keras: o laço já está escrito.** Com o Keras o modelo é descrito, configurado e treinado em três chamadas:

```python
model = keras.Sequential(
    [
        keras.Input(shape=(2,)),
        layers.Dense(8, activation="tanh"),
        layers.Dense(1, activation="sigmoid"),
    ]
)
model.compile(optimizer="sgd", loss="binary_crossentropy", metrics=["accuracy"])
history = model.fit(inputs, targets, epochs=200, batch_size=32)
loss, accuracy = model.evaluate(test_inputs, test_targets)
```

`compile` escolhe o otimizador, a perda e as métricas. `fit` roda o laço da seção 14 (ida, perda, gradientes, atualização) pelo número de épocas pedido e devolve um histórico com a perda de cada época. `evaluate` mede em outros dados e `predict` devolve as saídas. Isso é cômodo, e esconde o laço: quando é preciso algo fora do comum (duas redes treinando uma contra a outra, como em uma GAN), o passo é escrito à mão com uma fita de gradiente, exatamente como o laço do PyTorch.

**Execução imediata e grafos.** Por padrão o TensorFlow executa cada operação imediatamente, conforme o Python chega a ela. Essa é a **execução imediata (eager)**: fácil de depurar, com o custo do Python a cada passo. Decorar uma função com `tf.function` faz o TensorFlow executá-la uma vez para registrar um **grafo** das suas operações (isso se chama rastreamento, tracing) e depois executar o grafo diretamente. Um grafo é mais rápido, pode ser otimizado como um todo e pode ser salvo e executado onde não há Python, como um celular ou um servidor escrito em outra linguagem. O porém é que o código Python comum dentro da função, um `print` por exemplo, roda só durante o rastreamento, e não nas chamadas seguintes.

| Conceito | PyTorch | TensorFlow e Keras |
| --- | --- | --- |
| Arranjo de números | `torch.Tensor` | `tf.Tensor`, e `tf.Variable` para parâmetros |
| Gradiente | `requires_grad=True`, `loss.backward()`, `.grad` | `with tf.GradientTape() as tape`, `tape.gradient(loss, variables)` |
| Camada totalmente conectada | `nn.Linear(2, 8)` | `layers.Dense(8)` |
| Modelo | uma classe que herda de `nn.Module` | `keras.Sequential` ou `keras.Model` |
| Passo do otimizador | `optimizer.zero_grad()`, `optimizer.step()` | `optimizer.apply_gradients(...)` |
| Laço de treinamento | escrito à mão | `model.fit(...)`, ou à mão com uma fita |
| Execução | imediata, o grafo é refeito a cada ida | imediata por padrão, grafo com `tf.function` |

Aprender um framework torna o outro fácil, porque os conceitos sob os nomes são os das seções 3 a 6.

Funcionando: o [tensorflow-keras-basics](tensorflow-keras-basics.md) treina a mesma rede com `fit` e com uma fita de gradiente, e coloca os dois frameworks lado a lado.

## 16. Visão computacional

A visão computacional é a parte da IA que trabalha com imagens. A seção 12 apresentou a convolução para explicar a geração de imagens. Esta seção trata do sentido oposto: entender uma imagem.

**Imagens como tensores.** Uma imagem em tons de cinza é uma matriz de valores de brilho, em geral de 0 (preto) a 255 (branco), levados para a faixa de 0 a 1 antes de entrar em uma rede. Uma imagem colorida tem três matrizes dessas, uma por canal (vermelho, verde, azul). Um lote de 32 imagens coloridas de 64 x 64 pixels é um tensor de formato 32 x 3 x 64 x 64 no PyTorch (canais primeiro) e 32 x 64 x 64 x 3 no TensorFlow (canais por último). Os números são os mesmos, só a ordem das dimensões é uma convenção.

**Por que não uma rede comum?** Ligar todo pixel a todo neurônio custa demais e ignora o que é uma imagem. Uma imagem colorida de 64 x 64 tem 12.288 valores, então uma camada de 100 neurônios já tem 12.288 x 100 + 100 = 1.228.900 parâmetros. Pior, essa camada trata um gato no canto esquerdo e o mesmo gato no canto direito como entradas sem relação.

A **convolução** resolve os dois problemas. Um filtro pequeno desliza sobre a imagem e calcula um produto escalar em cada posição:

```text
recorte da imagem        filtro (borda vertical)      soma dos produtos
   0   0   9                -1   0   1
   0   0   9                -1   0   1                (0+0+9) + (0+0+9) + (0+0+9) = 27
   0   0   9                -1   0   1
```

O recorte vai de escuro à esquerda para claro à direita, e o filtro responde com um número grande: ele achou uma borda vertical. Em um recorte liso (todos os valores iguais) o mesmo filtro responde 0. A saída de um filtro sobre a imagem inteira é um **mapa de características** (feature map): uma figura de onde o padrão está.

- **Pesos compartilhados.** Os mesmos 9 números são usados em todas as posições, então a camada tem poucos parâmetros e um padrão aprendido em um lugar é encontrado em todos. Se o objeto se move, a resposta se move junto.
- **Os filtros são aprendidos.** Ninguém escreve o filtro de borda. O treinamento encontra os filtros que reduzem a perda, e a primeira camada de quase toda rede de visão acaba com detectores de borda e de cor.
- O **pooling** encolhe um mapa de características guardando um valor por região, em geral o máximo de cada bloco 2 x 2. Ele reduz cada lado à metade, não tem parâmetros e deixa o resultado menos sensível a pequenos deslocamentos.
- **Campo receptivo.** Cada camada enxerga uma parte da imagem um pouco maior que a anterior: duas camadas 3 x 3 seguidas enxergam 5 x 5 pixels. Por isso as camadas profundas reagem a formas e objetos inteiros.

Uma **rede convolucional (CNN)** repete convolução, ativação e pooling, e termina com um pequeno classificador:

```text
imagem -> [conv + ReLU + pool] -> [conv + ReLU + pool] -> achata -> camada linear -> uma nota por classe
          bordas, cores           cantos, texturas, partes              decisão
```

**As arquiteturas para conhecer**, cada uma lembrada por uma ideia:

| Rede | Ano | A ideia |
| --- | --- | --- |
| LeNet-5 | 1998 | convolução e subamostragem seguidas de camadas totalmente conectadas, lendo dígitos manuscritos |
| AlexNet | 2012 | uma CNN muito maior treinada em GPUs com ReLU, dropout e aumento de dados. A vitória na competição ImageNet deu início à era do aprendizado profundo |
| VGG | 2014 | profundidade só com filtros pequenos de 3 x 3, empilhados |
| ResNet | 2015 | conexões de atalho: um bloco devolve a sua entrada mais uma correção, o que tornou treináveis redes de mais de cem camadas |

**Aumento de dados (data augmentation).** Um gato deslocado alguns pixels, um pouco girado ou espelhado continua sendo um gato. Aplicar essas mudanças aleatórias às imagens de treino cria exemplos novos de graça e ensina a rede a ignorá-las. Aplica-se só ao conjunto de treino, e as mudanças precisam manter o rótulo verdadeiro: espelhar um "b" produz um "d".

**Transferência de aprendizado (transfer learning).** As primeiras camadas de uma rede treinada com milhões de imagens detectam bordas, texturas e formas úteis para quase qualquer tarefa com imagens. Então, em vez de treinar do zero com poucos dados, pegamos uma rede pré-treinada e ou a congelamos e treinamos só uma nova última camada, ou continuamos o treino dela inteira com uma taxa de aprendizado pequena (ajuste fino, como na seção 10). É a mesma ideia de pré-treinar um modelo de linguagem.

**Além da classificação.**

| Tarefa | Saída | Exemplo |
| --- | --- | --- |
| Classificação | um rótulo para a imagem | "gato" |
| Detecção | uma caixa e um rótulo para cada objeto | o YOLO prevê todas as caixas e classes em uma única passada pela imagem, o que o torna rápido o bastante para vídeo |
| Segmentação | um rótulo para cada pixel | a U-Net encolhe a imagem para entendê-la e a expande de volta ao tamanho original, com conexões de atalho que levam os detalhes finos de um lado ao outro |

A sobreposição entre uma caixa prevista e a verdadeira é medida pela **interseção sobre união (IoU)**: a área que as duas caixas compartilham dividida pela área que cobrem juntas, de 0 (sem sobreposição) a 1 (idênticas).

Hoje os transformers (seção 9) também são usados para imagens: a imagem é cortada em recortes e cada recorte é tratado como um token. E a rede que remove ruído em um modelo de difusão (seção 12) costuma ser uma U-Net. As peças desta página continuam sendo recombinadas.

Funcionando: o [computer-vision-cnn](computer-vision-cnn.md) escreve uma convolução à mão, treina uma pequena CNN com formas que ele mesmo desenha, compara-a com uma rede totalmente conectada em imagens deslocadas e salva os filtros aprendidos como imagens.

## Para onde ir depois

1. Rode os mini-projetos nesta ordem: [bpe-tokenizer](bpe-tokenizer.md), [neural-network-from-scratch](neural-network-from-scratch.md), [embeddings-vector-search](embeddings-vector-search.md), [tiny-language-model](tiny-language-model.md), [diffusion-toy](diffusion-toy.md), e depois os três que usam um framework: [pytorch-basics](pytorch-basics.md), [tensorflow-keras-basics](tensorflow-keras-basics.md), [computer-vision-cnn](computer-vision-cnn.md).
2. Responda ao quiz da área (`quiz/content/artificial-intelligence/`), que segue as mesmas dezesseis seções.
3. Leia e assista ao material de [references.md](references.md), que diz para que serve cada fonte.
