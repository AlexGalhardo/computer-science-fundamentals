# Rede neural do zero

> English version: [docs/en/artificial-intelligence/neural-network-from-scratch.md](../../en/artificial-intelligence/neural-network-from-scratch.md)

Mini-projeto MP-AI-2, em [`projects/artificial-intelligence/neural-network-from-scratch`](../../../projects/artificial-intelligence/neural-network-from-scratch). Ensina o que um neurônio calcula e como a retropropagação encontra os gradientes. A base está nas seções [5](README.md#5-neurônios-camadas-e-funções-de-ativação) e [6](README.md#6-descida-do-gradiente-e-retropropagação) da página da área.

## O plano

Treinar uma rede exige uma coisa difícil de fazer à mão: a inclinação da perda em relação a cada peso. Este projeto constrói a ferramenta que calcula essas inclinações automaticamente, e depois a usa.

1. `engine.py`: um número que lembra como foi calculado (`Value`).
2. `nn.py`: um neurônio, uma camada e uma rede feitos desses números.
3. `train.py`: a perda e o laço de descida do gradiente.

Não há NumPy nem framework. Os três arquivos têm cerca de 430 linhas de Python puro, e metade dessas linhas são comentários.

## Um número que lembra

```python
x, y, z = Value(2.0), Value(1.0), Value(4.0)
f = (x + y) * z  # f.data == 12.0
f.backward()
# x.grad == 4.0, y.grad == 4.0, z.grad == 3.0
```

Cada operação aritmética cria um novo `Value` e guarda nele duas coisas: os valores de onde ele veio, e uma pequena função com a **inclinação local** daquela operação.

| Operação | Inclinações locais |
| --- | --- |
| `a + b` | 1 para `a`, 1 para `b` |
| `a * b` | `b` para `a`, `a` para `b` |
| `a ** n` | `n * a^(n-1)` |
| `tanh(a)` | `1 - tanh(a)^2` |
| `relu(a)` | 1 se `a > 0`, senão 0 |
| `sigmoid(a)` | `s * (1 - s)` |
| `exp(a)` | `exp(a)` |
| `log(a)` | `1 / a` |

O grafo do exemplo:

```text
x = 2 --\
         (+) --> q = 3 --\
y = 1 --/                 (*) --> f = 12
z = 4 -------------------/
```

`backward()` começa em `f` com gradiente 1 e percorre o grafo do resultado até as entradas. Em cada nó ele multiplica o gradiente que chegou pela inclinação local e entrega o produto às entradas:

```text
f:  gradiente 1
*:  q recebe 1 x z = 4      z recebe 1 x q = 3
+:  x recebe 4 x 1 = 4      y recebe 4 x 1 = 4
```

Essa é a regra da cadeia, e fazê-la para todos os nós na ordem certa é a retropropagação. Dois detalhes a tornam correta:

- **Ordem.** Um nó só pode repassar o seu gradiente depois de tê-lo recebido por inteiro. Os nós são ordenados de modo que cada um venha depois daqueles a partir dos quais foi construído (uma ordem topológica), e o percurso anda por essa lista de trás para a frente.
- **Acúmulo.** Quando um valor é usado em dois lugares, ele recebe gradiente dos dois, então os gradientes são somados (`+=`) e nunca sobrescritos. Para `x * x` em x = 3 as duas contribuições são 3 + 3 = 6, a derivada de x². O outro lado disso: os gradientes precisam voltar a zero antes da próxima retropropagação, ou os antigos são somados aos novos.

## O gradiente está certo?

A definição de inclinação dá um segundo jeito, independente, de calculá-la: mexa a entrada um pouquinho e veja o quanto a saída se mexe.

```text
gradiente numérico = (f(x + h) - f(x - h)) / 2h        com h = 0,000001
```

Os testes comparam os dois para cada operação isolada, para combinações, para um valor usado duas vezes e para **cada peso de uma rede inteira**, com tolerância de 1e-6. É o teste que pega um sinal trocado ou um termo esquecido, e é assim que as bibliotecas de verdade testam os próprios gradientes.

## De um número a uma rede

Um **neurônio** é uma expressão curta feita de objetos `Value`: `ativação(w1 x1 + w2 x2 + viés)`. Uma **camada** é uma lista de neurônios que recebem as mesmas entradas. Um **MLP** é uma lista de camadas, as saídas de uma alimentando a seguinte. Como todo número envolvido é um `Value`, a perda calculada no fim também é um `Value`, e uma chamada a `backward()` preenche o gradiente de cada peso.

Os pesos começam como números aleatórios entre -1 e 1. Se todos começassem iguais, os neurônios de uma camada calculariam a mesma saída, receberiam o mesmo gradiente e continuariam cópias uns dos outros.

## A perda e o laço

A rede devolve um número, o logit `z`. `sigmoid(z)` é lido como a probabilidade da classe 1. A perda de um exemplo é o negativo do logaritmo da probabilidade dada à classe certa, que é `log(1 + e^(-s z))` com s = +1 para a classe 1 e -1 para a classe 0: perto de 0 quando a rede acerta com certeza, grande quando erra com certeza.

```python
for epoch in range(epochs):
    loss = mean_loss(model, points, labels)  # 1. ida
    model.zero_grad()  # 2. zera os gradientes antigos
    loss.backward()  # 3. volta
    for p in model.parameters():  # 4. passo contra o gradiente
        p.data -= learning_rate * p.grad
```

Esses quatro passos são o laço de treinamento de todo framework.

## XOR

O XOR responde 1 quando exatamente uma das duas entradas é 1. Desenhadas no papel, as duas classes ficam em cantos opostos de um quadrado, e nenhuma linha reta as separa. Um único neurônio é uma linha reta, então acerta no máximo 3 dos 4 pontos, e um teste confere isso. Com uma camada oculta de 4 neurônios (17 parâmetros):

| x1 | x2 | XOR | P(classe 1) | Resposta |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 0,005 | 0 |
| 0 | 1 | 1 | 0,974 | 1 |
| 1 | 0 | 1 | 0,973 | 1 |
| 1 | 1 | 0 | 0,037 | 0 |

A perda foi de 0,7863 para 0,0244 em 300 épocas.

## Duas luas

O segundo conjunto tem dois semicírculos entrelaçados com ruído, 80 pontos para treino e outros 200 para teste. Uma rede 2-8-8-1 (105 parâmetros) treinada por 120 épocas:

| Conjunto | Pontos | Acurácia |
| --- | ---: | ---: |
| Treino | 80 | 98,8% |
| Teste (nunca usado no treino) | 200 | 99,5% |

O conjunto de teste é o número honesto: é feito de pontos que a rede nunca viu.

![Perda por época](../../../projects/artificial-intelligence/neural-network-from-scratch/results/loss-curve.svg)

A perda cai depressa no começo, se arrasta por um tempo e depois cai de novo quando a rede descobre como curvar a fronteira. A curva de perda é a primeira coisa a olhar em qualquer treinamento.

![Fronteira de decisão](../../../projects/artificial-intelligence/neural-network-from-scratch/results/decision-boundary.svg)

A **fronteira de decisão** é onde a resposta muda de uma classe para a outra. Ela é desenhada perguntando à rede a resposta em cada célula de uma grade. A cor é mais forte onde a rede tem mais certeza, e a fronteira é uma curva: essa curva é o que as camadas ocultas compraram.

## O que um framework de verdade acrescenta

- **Tensores.** Aqui cada número é um objeto Python. Um framework guarda uma camada inteira como um único arranjo e a calcula em uma só operação otimizada, em CPU ou GPU. A ideia do grafo e das inclinações locais é a mesma.
- **Mais operações**, com a inclinação de cada uma já escrita.
- **Otimizadores** melhores que a descida do gradiente simples, como o Adam.

O mini-projeto [pytorch-basics](pytorch-basics.md) refaz esta rede com o PyTorch e confere que o framework calcula os mesmos gradientes que este motor.

## Como rodar

```sh
cd projects/artificial-intelligence/neural-network-from-scratch
./setup-unix-neural-network-from-scratch.sh
```
