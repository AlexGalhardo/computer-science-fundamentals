# Fundamentos de TensorFlow e Keras

> English version: [docs/en/artificial-intelligence/tensorflow-keras-basics.md](../../en/artificial-intelligence/tensorflow-keras-basics.md)

Mini-projeto MP-AI-7, em [`projects/artificial-intelligence/tensorflow-keras-basics`](../../../projects/artificial-intelligence/tensorflow-keras-basics). Ensina o mesmo modelo em outro framework, e o que uma API de alto nível esconde. A base está na seção [15](README.md#15-tensorflow-e-keras) da página da área, e o lado PyTorch de cada comparação está em [pytorch-basics](pytorch-basics.md) (MP-AI-6).

## O plano

A rede é a do [neural-network-from-scratch](neural-network-from-scratch.md) (MP-AI-2): 2 entradas, duas camadas ocultas de 8 neurônios com tanh, 1 saída, 105 parâmetros. O conjunto de dados também é o mesmo: 80 pontos de treino e 200 pontos de teste de dois semicírculos entrelaçados, feitos por uma cópia do mesmo gerador. Só a ferramenta muda.

1. `model.py`: a rede descrita como uma lista de camadas do Keras.
2. `keras_api.py`: o treinamento com três chamadas, `compile`, `fit` e `evaluate`.
3. `tape.py`: o mesmo treinamento com o passo escrito à mão em volta de uma fita de gradiente, e depois como grafo.
4. `side_by_side.py`: cada conceito no PyTorch e no TensorFlow.

## Descrevendo o modelo

```python
model = keras.Sequential(
    [
        keras.Input(shape=(2,)),
        keras.layers.Dense(8, activation="tanh"),
        keras.layers.Dense(8, activation="tanh"),
        keras.layers.Dense(1),
    ]
)
```

`Dense(8)` é uma camada totalmente conectada de 8 neurônios. Só o número de saídas é informado: o número de entradas vem da camada anterior, começando em `Input`. A contagem de parâmetros pode ser feita à mão:

```text
primeira camada   2 x 8 pesos + 8 vieses = 24
segunda camada    8 x 8 pesos + 8 vieses = 72
camada de saída   8 x 1 pesos + 1 viés   =  9
total                                     105
```

Um detalhe difere do PyTorch: o Keras guarda os pesos de uma camada com formato (entradas, saídas), então o primeiro kernel é (2, 8), e o PyTorch guarda (saídas, entradas), então o primeiro peso dele é (8, 2). A conta é o mesmo produto de matrizes.

**Logit ou sigmoide?** A última camada não tem ativação, então o modelo devolve um logit, e a perda é criada com `from_logits=True`. A outra forma comum é uma última camada com `activation="sigmoid"` e a perda `"binary_crossentropy"`. É o mesmo modelo: a sigmoide só sai de dentro da perda e vai para a última camada. Um teste confere que as duas dão o mesmo número, e que esse número é o `log(1 + e^(-s z))` do MP-AI-2. A forma com logit é mais segura com números muito grandes ou muito pequenos.

Os pesos iniciais seguem a regra do MP-AI-2, uniformes entre -1 e 1, como na versão em PyTorch.

## Três chamadas

```python
keras.utils.set_random_seed(7)
model.compile(
    optimizer=keras.optimizers.SGD(learning_rate=0.5),
    loss=keras.losses.BinaryCrossentropy(from_logits=True),
    metrics=[keras.metrics.BinaryAccuracy(threshold=0.0)],
)
history = model.fit(inputs, targets, epochs=120, batch_size=80, shuffle=False, verbose=0)
loss, accuracy = model.evaluate(test_inputs, test_targets, verbose=0)
```

- O `compile` não calcula nada. Ele guarda três escolhas: como atualizar (o otimizador), o que minimizar (a perda) e o que mais relatar (as métricas).
- O `fit` é o laço de treinamento. Por padrão ele corta os dados em mini-lotes de 32 pontos e os embaralha. Aqui o lote é o conjunto de treino inteiro, como no MP-AI-2: uma época, uma atualização.
- O `evaluate` mede em dados sem treinar, e devolve a perda e depois cada métrica.

Duas armadilhas aparecem nessas poucas linhas. O `metrics=["accuracy"]` de costume corta a saída em 0,5, o que é certo para uma probabilidade e errado para um logit: um logit de 0,2 significa classe 1, e 0,2 fica abaixo de 0,5. A métrica é avisada para cortar em 0. E o `batch_size=32` padrão faria três atualizações por época em 80 pontos, um treinamento diferente do que está sendo reproduzido.

| Conjunto | Pontos | Perda | Acurácia |
| --- | ---: | ---: | ---: |
| Treino | 80 | 0.0839 | 97.5% |
| Teste (nunca usado no treinamento) | 200 | 0.0710 | 98.5% |

| Época | Perda |
| ---: | ---: |
| 1 | 0.6567 |
| 10 | 0.2980 |
| 50 | 0.2222 |
| 100 | 0.1132 |
| 120 | 0.0850 |

Em nenhum lugar desse código há um gradiente ou uma atualização. Eles aconteceram dentro do `fit`.

## Gradientes com uma fita

O TensorFlow registra as operações só dentro de um bloco `tf.GradientTape`, e depois pergunta-se à fita uma inclinação:

```python
x = tf.Variable(3.0)
with tf.GradientTape() as tape:
    y = x * x
tape.gradient(y, x)  # 6.0, porque dy/dx = 2x
```

O exemplo do MP-AI-2, `f = (x + y) * z` em x = 2, y = 1, z = 4, pode ser feito à mão primeiro: `df/dx = z = 4`, `df/dy = z = 4`, `df/dz = x + y = 3`. A fita devolve 4, 4 e 3.

Três regras que diferem do PyTorch:

- Um `tf.Tensor` não pode ser alterado. O que o treinamento altera é uma `tf.Variable`, e as variáveis são observadas pela fita automaticamente. Uma constante não é: o gradiente dela volta como `None`, sem erro nenhum, a menos que `tape.watch(x)` seja chamado. A demo mostra `None` e depois 6.
- Uma fita responde a uma chamada de `gradient` e depois é liberada. Uma segunda chamada gera um erro, a menos que a fita tenha sido criada com `persistent=True`.
- Nada se acumula. A fita devolve gradientes novos a cada vez, então não existe `zero_grad`.

## O passo que o fit esconde

```python
optimizer = keras.optimizers.SGD(learning_rate=0.5)
loss_fn = keras.losses.BinaryCrossentropy(from_logits=True)

for epoch in range(120):
    with tf.GradientTape() as tape:
        logits = model(inputs, training=True)  # 1. ida
        loss = loss_fn(targets, logits)  # 2. perda
    gradients = tape.gradient(loss, model.trainable_variables)  # 3 e 4. gradientes
    optimizer.apply_gradients(zip(gradients, model.trainable_variables))  # 5. atualização
```

É o laço da versão em PyTorch com outras palavras. Com a mesma semente ele parte dos mesmos pesos da execução com `fit`, e dá os mesmos números:

| Como foi treinado | Primeira perda | Última perda | Acurácia de treino | Acurácia de teste | O Python rodou o passo |
| --- | ---: | ---: | ---: | ---: | ---: |
| `model.fit` | 0.6567 | 0.0850 | 97.5% | 98.5% | escondido |
| Fita de gradiente, na hora (eager) | 0.6567 | 0.0850 | 97.5% | 98.5% | 120 |
| Fita de gradiente dentro de `tf.function` | 0.6567 | 0.0850 | 97.5% | 98.5% | 1 |

Em cada uma das 120 épocas as perdas diferem em menos de 0,0001. Então o `fit` não é um algoritmo diferente: é este laço, já escrito.

![Perda por época](../../../projects/artificial-intelligence/tensorflow-keras-basics/results/loss-curve.svg)

A figura tem duas curvas, a do `fit` e a do laço com a fita, e elas ficam uma em cima da outra.

## Execução na hora contra grafo

A última coluna da tabela conta quantas vezes o Python realmente executou o corpo do passo. Rodando normalmente (**execução na hora**, ou eager), cada linha roda a cada passo: 120 vezes. Embrulhado em `tf.function`, a primeira chamada roda o código Python uma vez para gravar as operações em um **grafo** (isso se chama tracing), e as outras 119 chamadas executam o grafo sem passar pelo Python: o contador fica em 1.

Isso explica uma surpresa clássica: um `print` ou qualquer outro código Python comum dentro de uma `tf.function` roda só durante o tracing. Um teste também mostra quando acontece um novo tracing: chamar o passo com um lote de outro formato (10 pontos em vez de 80) grava um segundo grafo.

## PyTorch e TensorFlow lado a lado

| Conceito | PyTorch | TensorFlow e Keras |
| --- | --- | --- |
| Tensor | `torch.Tensor`: `torch.tensor(points)` | `tf.Tensor` (não pode ser alterado): `tf.constant(points)`. Os parâmetros são `tf.Variable` |
| Gradiente | `requires_grad=True`, `loss.backward()`, ler `.grad` | `with tf.GradientTape() as tape:`, depois `tape.gradient(loss, variables)` |
| Camada | `nn.Linear(2, 8)` seguida de `torch.tanh` | `keras.layers.Dense(8, activation="tanh")` |
| Modelo | uma classe que herda de `nn.Module`, com `forward` | `keras.Sequential([...])` |
| Perda sobre um logit | `nn.BCEWithLogitsLoss()` | `keras.losses.BinaryCrossentropy(from_logits=True)` |
| Otimizador | `torch.optim.SGD(model.parameters(), lr=0.5)`, `zero_grad()` e `step()` | `keras.optimizers.SGD(learning_rate=0.5)`, `apply_gradients(zip(grads, variables))` |
| Laço de treinamento | escrito à mão: ida, perda, `zero_grad`, `backward`, `step` | `model.compile(...)` e `model.fit(...)`, ou à mão com uma fita |
| Medição | `model.eval()` e `with torch.no_grad():` | `model.evaluate(...)`, ou `model(inputs, training=False)` |
| Execução | na hora (eager): o grafo é refeito a cada passada de ida | na hora por padrão, um grafo gravado com `@tf.function` |
| **Acurácia medida, 80 pontos de treino** | **97.5%** | **97.5%** (`fit`) |
| **Acurácia medida, 200 pontos de teste** | **98.0%** | **98.5%** (`fit`), **98.5%** (fita de gradiente) |

As acurácias do PyTorch vêm dos resultados versionados do [pytorch-basics](pytorch-basics.md) (`projects/artificial-intelligence/pytorch-basics/results/results.md`, primeira linha da tabela de treinamento). Este projeto não contém PyTorch. As duas execuções usam o mesmo conjunto de dados, rede, regra inicial, número de semente, taxa de aprendizado e número de épocas. Elas não partem dos mesmos pesos aleatórios, porque cada framework tem o seu próprio gerador aleatório, então as acurácias são próximas e não iguais: 196 contra 197 dos 200 pontos de teste. Para referência, o próprio MP-AI-2 chegou a 99,5% a partir dos pesos iniciais dele.

A tabela é a lição: cada linha é uma ideia com duas grafias. Quem entende os cinco passos do laço consegue ler qualquer um dos dois frameworks.

## O que um sistema real acrescenta

- **Conjuntos de dados que não cabem na memória**, lidos em mini-lotes pelo `tf.data` e embaralhados a cada época.
- **Callbacks** no `fit`: parar cedo quando a perda de validação para de melhorar, salvar o melhor modelo, registrar curvas.
- **Salvar e implantar.** Um grafo gravado pelo `tf.function` pode ser salvo e executado onde não há Python, como um celular ou um servidor em outra linguagem.
- **Treinamento sob medida.** Quando um `fit` não basta (duas redes que treinam uma contra a outra, por exemplo), o passo é escrito com uma fita, como aqui.

## Como rodar

```sh
cd projects/artificial-intelligence/tensorflow-keras-basics
./setup-unix-tensorflow-keras-basics.sh
```

No Windows, `./setup-windows-tensorflow-keras-basics.ps1`. Só a demo: `docker compose run --rm python-demo`. A imagem usa o Python 3.13 porque o TensorFlow 2.21.0 não tem pacote para o Python 3.14, e instala o Keras 3.15.1 e o NumPy 2.5.3. As linhas sobre CUDA que o TensorFlow imprime só dizem que nenhuma GPU foi encontrada.
