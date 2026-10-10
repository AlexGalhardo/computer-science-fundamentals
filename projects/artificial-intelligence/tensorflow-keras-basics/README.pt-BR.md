# tensorflow-keras-basics

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Ensina **o mesmo modelo em outro framework, e o que uma API de alto nível esconde**. A rede 2-8-8-1 do [neural-network-from-scratch](../neural-network-from-scratch/) (MP-AI-2) é descrita com o Keras e treinada no mesmo conjunto de dados de três formas: com `compile`, `fit` e `evaluate`, com um passo de treinamento escrito à mão em volta de uma `tf.GradientTape`, e com esse mesmo passo transformado em grafo pelo `tf.function`. As três dão a mesma perda em todas as épocas, o que mostra o que o `fit` estava fazendo o tempo todo. Uma tabela então coloca PyTorch e TensorFlow lado a lado.

Explicação completa: [docs/pt/artificial-intelligence/tensorflow-keras-basics.md](../../../docs/pt/artificial-intelligence/tensorflow-keras-basics.md).

## Tópicos do quiz que ele demonstra

- `artificial-intelligence` / `tensorflow-keras`: tensores (`tf.constant`) e variáveis (`tf.Variable`), `tf.GradientTape` e `tape.watch`, `keras.Sequential`, `Dense`, `compile`, `fit`, `evaluate`, um logit com `from_logits=True` contra uma saída com sigmoide, execução na hora (eager) contra grafo e o tracing do `tf.function`.
- `artificial-intelligence` / `pytorch`: os mesmos conceitos lado a lado (tensor, gradiente, camada, otimizador, laço de treinamento).

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-tensorflow-keras-basics.sh        # Linux e macOS
./setup-windows-tensorflow-keras-basics.ps1    # Windows
```

O script constrói a imagem, roda os testes e roda a demo. A primeira construção baixa o TensorFlow (um pacote grande: a imagem ocupa cerca de 3 GB em disco). Depois disso nada usa a rede: os dois serviços rodam com `network_mode: "none"`.

O TensorFlow leva vários segundos para ser importado e, em uma máquina sem GPU, imprime algumas linhas na saída de erro ("Could not find cuda drivers", "failed call to cuInit"). Elas são inofensivas: tudo aqui roda na CPU, e o `TF_CPP_MIN_LOG_LEVEL=2` já esconde o resto.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `python/model.py` | `build_model()`: a rede 2-8-8-1 como um `keras.Sequential`, a perda, os dados como arranjos, a acurácia contada à mão |
| `python/keras_api.py` | `train_with_fit()`: `compile`, `fit`, `evaluate` |
| `python/tape.py` | gradientes com `tf.GradientTape`, o passo de treinamento escrito à mão, na hora ou dentro de `tf.function` |
| `python/side_by_side.py` | a tabela PyTorch e TensorFlow, com a acurácia citada do pytorch-basics |
| `python/data.py` | uma **cópia** do gerador do conjunto de dados do MP-AI-2 |
| `python/render.py` | o gráfico de perda em SVG |
| `python/demo.py` | `python demo.py`: treina de três formas e grava `results/` |
| `python/test_tensorflow_keras_basics.py` | os testes |
| `python/pytest.ini` | esconde um aviso de depreciação de uma biblioteca que o TensorFlow instala (veja Limites) |
| `results/` | resultados versionados: `results.md`, `loss.csv`, `loss-curve.svg` |

Um mini-projeto nunca importa outro, então o `python/data.py` foi copiado do MP-AI-2 e é idêntico ao original. O conjunto de dados é, portanto, literalmente o mesmo (80 pontos de treino, 200 pontos de teste), e um teste fixa alguns dos seus pontos. Este projeto não contém PyTorch.

Só Python: `python:3.13.16-slim-trixie` com `tensorflow==2.21.0`, que traz o Keras 3.15.1 e o NumPy 2.5.3. Os outros mini-projetos desta área usam o Python 3.14. Este usa o 3.13 porque o TensorFlow 2.21.0 não tem pacote para o Python 3.14. O TensorFlow roda na CPU com 2 threads.

## Testes

```sh
docker compose run --rm python-test
```

Roda `ruff check`, `ruff format --check` e 26 testes (cerca de 15 segundos, mais a importação do TensorFlow). Os três treinamentos rodam uma vez e são compartilhados por todos os testes.

- **MP-AI-7.1** o modelo tem três camadas `Dense` e 105 parâmetros, e `compile` + `fit` + `evaluate` com uma semente fixa chegam a pelo menos 95% nos 200 pontos de teste. O `evaluate` concorda com a acurácia contada à mão, um logit com `from_logits=True` dá a mesma perda que uma saída com sigmoide, e a métrica de acurácia precisa cortar um logit em 0.
- **MP-AI-7.2** a fita dá 6 para `x * x` em x = 3 e 4, 4, 3 para `f = (x + y) * z` em x = 2, y = 1, z = 4, os valores calculados à mão. Uma constante dá `None` sem `tape.watch`. A perda do laço escrito à mão cai ao longo dos passos, ela segue a perda do `fit` dentro de 1e-4 em todas as épocas, e dentro do `tf.function` o Python roda o passo uma vez para 120 passos.
- **MP-AI-7.3** a tabela lado a lado tem uma linha para cada conceito com os dois frameworks preenchidos, e as duas acurácias medidas. Um teste também confere que o PyTorch não está instalado aqui.

## Demo

```sh
docker compose run --rm python-demo
```

Imprime e regrava [`results/results.md`](results/results.md), além de `loss.csv` e `loss-curve.svg`. Leva cerca de meio minuto, e todos os números são determinísticos (semente fixa).

Gradientes com uma fita:

```text
y = x * x at x = 3                         ->   dy/dx = 6
f = (x + y) * z with x = 2, y = 1, z = 4   ->   f = 12
df/dx = 4   df/dy = 4   df/dz = 3

x = tf.constant(3.0), y = x * x: gradient without tape.watch = None, with tape.watch = 6
```

Keras, 2-8-8-1 com tanh (105 parâmetros), SGD com taxa de aprendizado 0,5, 120 épocas, lote inteiro, `keras.utils.set_random_seed(7)`. O que o `model.evaluate` devolveu:

| Conjunto | Pontos | Perda | Acurácia |
| --- | ---: | ---: | ---: |
| Treino | 80 | 0.0839 | 97.5% |
| Teste (nunca usado no treinamento) | 200 | 0.0710 | 98.5% |

O mesmo treinamento, de três formas:

| Como foi treinado | Primeira perda | Última perda | Acurácia de treino | Acurácia de teste | O Python rodou o passo |
| --- | ---: | ---: | ---: | ---: | ---: |
| `model.fit` | 0.6567 | 0.0850 | 97.5% | 98.5% | escondido |
| Fita de gradiente, na hora (eager) | 0.6567 | 0.0850 | 97.5% | 98.5% | 120 |
| Fita de gradiente dentro de `tf.function` | 0.6567 | 0.0850 | 97.5% | 98.5% | 1 |

A perda de cada época difere em menos de 0,0001 entre o `fit` e o laço com a fita, e entre o laço executado na hora e o do `tf.function`.

![Perda por época](results/loss-curve.svg)

As duas curvas da figura ficam uma em cima da outra: esse é o resultado.

### PyTorch e TensorFlow lado a lado

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

As acurácias do PyTorch foram medidas pelo mini-projeto [pytorch-basics](../pytorch-basics/) (MP-AI-6) e são citadas do [`results/results.md`](../pytorch-basics/results/results.md) versionado dele, primeira linha da seção "Training on the two moons": mesmo conjunto de dados, mesma rede, mesma regra inicial, semente 7, 120 épocas, taxa de aprendizado 0,5. As acurácias do TensorFlow foram medidas por esta demo. Os dois frameworks sorteiam pesos iniciais diferentes a partir do mesmo número de semente, então as acurácias são próximas e não iguais: 98,0% são 196 dos 200 pontos de teste e 98,5% são 197.

Não há dashboard: a figura é um arquivo SVG gravado pela demo, sem biblioteca de gráficos.

## Limites

- A coluna do PyTorch é citada, não executada aqui. Se o pytorch-basics mudar, a constante em `python/side_by_side.py` e esta tabela precisam ser atualizadas à mão. Um teste fixa o valor citado, não o outro projeto.
- O `python/pytest.ini` esconde um `DeprecationWarning` impresso pela biblioteca `gast`, que o TensorFlow instala e usa dentro do `tf.function`. No Python 3.13 ele aparece dezenas de vezes por execução e diz respeito só a essa biblioteca. Nenhum outro aviso é filtrado.
- As linhas sobre CUDA na saída não podem ser desligadas com o `TF_CPP_MIN_LOG_LEVEL`. Elas só dizem que nenhuma GPU foi encontrada.
- No Keras 3 os parâmetros de um modelo são variáveis do Keras que embrulham uma `tf.Variable`. A fita e o otimizador as aceitam diretamente, então o código não mostra a diferença.
- A rede tem 105 parâmetros e 80 pontos de treino. Nesse tamanho o `fit` gasta o tempo no custo fixo de cada época (callbacks, métricas, a maquinaria de progresso), e é por isso que 120 épocas levam segundos. Nenhum tempo é relatado aqui: a comparação de tempos está no pytorch-basics, entre a versão feita à mão e o PyTorch.
- O treinamento usa floats de 32 bits. As perdas são arredondadas para 4 casas em `results/`, o que é estável nesta máquina. Outra CPU pode diferir no último dígito.
